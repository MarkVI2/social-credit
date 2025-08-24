import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "../../init";
import { getDatabase } from "@/lib/mongodb";

// Helper to bucketize by day
function timeBucket(stage: "day" | "hour") {
  if (stage === "day") {
    return {
      year: { $year: "$timestamp" },
      month: { $month: "$timestamp" },
      day: { $dayOfMonth: "$timestamp" },
    };
  }
  return {
    year: { $year: "$timestamp" },
    month: { $month: "$timestamp" },
    day: { $dayOfMonth: "$timestamp" },
    hour: { $hour: "$timestamp" },
  };
}

export const statsRouter = createTRPCRouter({
  // Provide earliest and latest transaction timestamps
  timeBounds: adminProcedure.query(async () => {
    const db = await getDatabase();
    const tx = db.collection("transactionHistory");
    const minDoc = await tx
      .find({}, { projection: { timestamp: 1 } })
      .sort({ timestamp: 1 })
      .limit(1)
      .toArray();
    const maxDoc = await tx
      .find({}, { projection: { timestamp: 1 } })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();
    return {
      earliest: minDoc[0]?.timestamp || null,
      latest: maxDoc[0]?.timestamp || null,
    };
  }),
  // Total supply over time using transaction deltas with special case for classBank and explicit mint/burn
  totalSupplyOverTime: adminProcedure
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
        granularity: z.enum(["hour", "day"]).default("day"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDatabase();
      const tx = db.collection("transactionHistory");
      const system = db.collection("systemAccounts");

      const match: any = {};
      if (input.from)
        match.timestamp = { ...(match.timestamp || {}), $gte: input.from };
      if (input.to)
        match.timestamp = { ...(match.timestamp || {}), $lte: input.to };

      // Compute net new supply per bucket: mint_supply (+), burn_supply (-).
      // For older records without type, infer mint when from === "mint" or reason contains "mint".
      const pipeline: any[] = [
        { $match: match },
        {
          $addFields: {
            inferredType: {
              $cond: [
                { $eq: ["$type", "mint_supply"] },
                "mint_supply",
                {
                  $cond: [
                    { $eq: ["$type", "burn_supply"] },
                    "burn_supply",
                    {
                      $cond: [
                        {
                          $regexMatch: {
                            input: { $ifNull: ["$reason", ""] },
                            regex: /\bmint\b/i,
                          },
                        },
                        "mint_supply",
                        {
                          $cond: [
                            {
                              $regexMatch: {
                                input: { $ifNull: ["$reason", ""] },
                                regex: /\bburn\b/i,
                              },
                            },
                            "burn_supply",
                            "$type",
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: timeBucket(input.granularity),
            minted: {
              $sum: {
                $cond: [
                  { $eq: ["$inferredType", "mint_supply"] },
                  "$amount",
                  0,
                ],
              },
            },
            burned: {
              $sum: {
                $cond: [
                  { $eq: ["$inferredType", "burn_supply"] },
                  "$amount",
                  0,
                ],
              },
            },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 },
        },
      ];

      const buckets = await tx.aggregate(pipeline).toArray();

      // Fetch current balances for sanity reference
      const usersTotal = await db
        .collection("userinformation")
        .aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: { $ifNull: ["$credits", 0] } },
            },
          },
        ])
        .toArray();
      const classBank = await system.findOne({ accountType: "classBank" });
      const currentSupply =
        (usersTotal[0]?.total || 0) + (classBank?.balance || 0);

      let cumulative = 0;
      const series = buckets.map((b: any) => {
        const delta = (b.minted || 0) - (b.burned || 0);
        cumulative += delta;
        const { year, month, day, hour } = b._id;
        const ts = new Date(year, (month || 1) - 1, day || 1, hour || 0);
        return { timestamp: ts, delta, cumulative };
      });

      return { series, currentSupply };
    }),

  // Velocity: volume / supply per period
  velocity: adminProcedure
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
        granularity: z.enum(["hour", "day"]).default("day"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDatabase();
      const tx = db.collection("transactionHistory");
      const match: any = {};
      if (input.from)
        match.timestamp = { ...(match.timestamp || {}), $gte: input.from };
      if (input.to)
        match.timestamp = { ...(match.timestamp || {}), $lte: input.to };

      const volume = await tx
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: timeBucket(input.granularity),
              volume: { $sum: "$amount" },
            },
          },
          {
            $sort: {
              "_id.year": 1,
              "_id.month": 1,
              "_id.day": 1,
              "_id.hour": 1,
            },
          },
        ])
        .toArray();
      const usersTotal = await db
        .collection("userinformation")
        .aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: { $ifNull: ["$credits", 0] } },
            },
          },
        ])
        .toArray();
      const classBank = await db
        .collection("systemAccounts")
        .findOne({ accountType: "classBank" });
      const supply =
        (usersTotal[0]?.total || 0) + (classBank?.balance || 0) || 1;
      const series = volume.map((v: any) => {
        const { year, month, day, hour } = v._id;
        const ts = new Date(year, (month || 1) - 1, day || 1, hour || 0);
        return {
          timestamp: ts,
          velocity: (v.volume || 0) / supply,
          volume: v.volume,
        };
      });
      return { series, supply };
    }),

  // Top sinks and sources by type/from/to
  sinksSources: adminProcedure
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDatabase();
      const tx = db.collection("transactionHistory");
      const match: any = {};
      if (input.from)
        match.timestamp = { ...(match.timestamp || {}), $gte: input.from };
      if (input.to)
        match.timestamp = { ...(match.timestamp || {}), $lte: input.to };

      // Sources: group by from
      const topSources = await tx
        .aggregate([
          { $match: match },
          { $group: { _id: "$from", total: { $sum: "$amount" } } },
          { $sort: { total: -1 } },
          { $limit: input.limit },
        ])
        .toArray();

      // Sinks: group by to and treat spending as sink from payer perspective — approximate by grouping by 'to' for incoming, we invert amounts by grouping by 'to' and 'from'
      const topSinks = await tx
        .aggregate([
          { $match: match },
          { $group: { _id: "$to", total: { $sum: "$amount" } } },
          { $sort: { total: -1 } },
          { $limit: input.limit },
        ])
        .toArray();

      // Also by type
      const byType = await tx
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: "$type",
              total: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { total: -1 } },
        ])
        .toArray();

      return { topSources, topSinks, byType };
    }),

  // Top traders by total volume
  topTraders: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }))
    .query(async ({ input }) => {
      const db = await getDatabase();
      const tx = db.collection("transactionHistory");
      const agg = await tx
        .aggregate([
          {
            $project: {
              pairs: ["$from", "$to"],
              amount: "$amount",
            },
          },
          { $unwind: "$pairs" },
          {
            $group: {
              _id: "$pairs",
              volume: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { volume: -1 } },
          { $limit: input.limit },
        ])
        .toArray();
      return {
        traders: agg.map((a: any) => ({
          user: a._id,
          volume: a.volume,
          count: a.count,
        })),
      };
    }),

  // Peer trading graph edges
  peerGraph: adminProcedure
    .input(
      z.object({
        minVolume: z.number().min(0).default(0),
        limit: z.number().min(1).max(1000).default(500),
        from: z.date().optional(),
        to: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDatabase();
      const tx = db.collection("transactionHistory");
      const match: any = {};
      if (input.from)
        match.timestamp = { ...(match.timestamp || {}), $gte: input.from };
      if (input.to)
        match.timestamp = { ...(match.timestamp || {}), $lte: input.to };
      const edges = await tx
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: { from: "$from", to: "$to" },
              volume: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
          { $match: { volume: { $gte: input.minVolume } } },
          { $sort: { volume: -1 } },
          { $limit: input.limit },
        ])
        .toArray();
      const nodesSet = new Set<string>();
      edges.forEach((e: any) => {
        nodesSet.add(e._id.from);
        nodesSet.add(e._id.to);
      });
      const nodes = Array.from(nodesSet).map((id) => ({ id }));
      const formattedEdges = edges.map((e: any) => ({
        from: e._id.from,
        to: e._id.to,
        volume: e.volume,
        count: e.count,
      }));
      return { nodes, edges: formattedEdges };
    }),

  // Knowledge graph derived from transactions (degree centrality proxy)
  knowledgeGraph: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(1000).default(500),
        from: z.date().optional(),
        to: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDatabase();
      const tx = db.collection("transactionHistory");
      const match: any = {};
      if (input.from)
        match.timestamp = { ...(match.timestamp || {}), $gte: input.from };
      if (input.to)
        match.timestamp = { ...(match.timestamp || {}), $lte: input.to };
      const edges = await tx
        .aggregate([
          { $match: match },
          {
            $group: { _id: { from: "$from", to: "$to" }, weight: { $sum: 1 } },
          },
          { $sort: { weight: -1 } },
          { $limit: input.limit },
        ])
        .toArray();
      const nodesMap = new Map<string, { id: string; degree: number }>();
      edges.forEach((e: any) => {
        const f = e._id.from;
        const t = e._id.to;
        nodesMap.set(f, {
          id: f,
          degree: (nodesMap.get(f)?.degree || 0) + e.weight,
        });
        nodesMap.set(t, {
          id: t,
          degree: (nodesMap.get(t)?.degree || 0) + e.weight,
        });
      });
      return {
        nodes: Array.from(nodesMap.values()),
        edges: edges.map((e: any) => ({
          from: e._id.from,
          to: e._id.to,
          weight: e.weight,
        })),
      };
    }),
});

export type StatsRouter = typeof statsRouter;
