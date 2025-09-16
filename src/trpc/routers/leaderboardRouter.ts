import { publicProcedure, createTRPCRouter } from "../init";
import { z } from "zod";
import { getDatabase } from "@/lib/mongodb";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events";

// Type for leaderboard user entry
interface LeaderboardUser {
  _id: string;
  name?: string;
  handle?: string;
  kollaborationKredits: number;
  credits: number;
  avatarUrl?: string;
  rank?: string;
  earnedLifetime?: number;
}

// Event emitter for leaderboard updates
const leaderboardEmitter = new EventEmitter();

// Function to broadcast leaderboard updates
export const broadcastLeaderboardUpdate = () => {
  leaderboardEmitter.emit("update");
};

export const leaderboardRouter = createTRPCRouter({
  // Get current leaderboard data with optional filter
  getLeaderboard: publicProcedure
    .input(
      z
        .object({
          filter: z
            .enum(["kredits", "active", "topGainers", "topLosers"])
            .optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      try {
        const db = await getDatabase();
        const filter = input?.filter || "kredits";

        let pipeline: any[] = [];

        if (filter === "kredits") {
          pipeline = [
            { $addFields: { creditsSafe: { $ifNull: ["$credits", 0] } } },
            { $sort: { creditsSafe: -1 } },
            {
              $project: {
                _id: 1,
                name: { $ifNull: ["$name", "$username"] },
                handle: { $ifNull: ["$handle", "$username"] },
                kollaborationKredits: "$creditsSafe",
                credits: "$creditsSafe",
                avatarUrl: 1,
                rank: 1,
                earnedLifetime: 1,
              },
            },
          ];
        } else if (filter === "active") {
          // Most active by transaction count (sent + received)
          pipeline = [
            {
              $lookup: {
                from: "transactionHistory",
                localField: "username",
                foreignField: "from",
                as: "sentTx",
              },
            },
            {
              $lookup: {
                from: "transactionHistory",
                localField: "username",
                foreignField: "to",
                as: "recvTx",
              },
            },
            {
              $addFields: {
                txCount: { $add: [{ $size: "$sentTx" }, { $size: "$recvTx" }] },
                kollaborationKredits: { $ifNull: ["$credits", 0] },
              },
            },
            { $sort: { txCount: -1 } },
            {
              $project: {
                _id: 1,
                name: { $ifNull: ["$name", "$username"] },
                handle: { $ifNull: ["$handle", "$username"] },
                kollaborationKredits: 1,
                credits: "$kollaborationKredits",
                txCount: 1,
                avatarUrl: 1,
                rank: 1,
              },
            },
          ];
        } else if (filter === "topGainers" || filter === "topLosers") {
          // Net gain/loss computed as received - sent (by summing amounts)
          pipeline = [
            {
              $lookup: {
                from: "transactionHistory",
                let: { uname: "$username" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$to", "$$uname"] } } },
                  { $group: { _id: null, received: { $sum: "$amount" } } },
                ],
                as: "receivedAgg",
              },
            },
            {
              $lookup: {
                from: "transactionHistory",
                let: { uname: "$username" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$from", "$$uname"] } } },
                  { $group: { _id: null, sent: { $sum: "$amount" } } },
                ],
                as: "sentAgg",
              },
            },
            {
              $addFields: {
                receivedTotal: {
                  $ifNull: [{ $arrayElemAt: ["$receivedAgg.received", 0] }, 0],
                },
                sentTotal: {
                  $ifNull: [{ $arrayElemAt: ["$sentAgg.sent", 0] }, 0],
                },
              },
            },
            {
              $addFields: {
                netGain: { $subtract: ["$receivedTotal", "$sentTotal"] },
                kollaborationKredits: { $ifNull: ["$credits", 0] },
              },
            },
            { $sort: { netGain: filter === "topGainers" ? -1 : 1 } },
            {
              $project: {
                _id: 1,
                name: { $ifNull: ["$name", "$username"] },
                handle: { $ifNull: ["$handle", "$username"] },
                kollaborationKredits: 1,
                credits: "$kollaborationKredits",
                netGain: 1,
                avatarUrl: 1,
                rank: 1,
              },
            },
          ];
        }

        const users = await db
          .collection("userinformation")
          .aggregate(pipeline)
          .toArray();

        return { success: true, users };
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        throw new Error("Error fetching leaderboard");
      }
    }),

  // Server-sent events subscription for real-time leaderboard updates
  onUpdate: publicProcedure
    .input(
      z
        .object({
          filter: z
            .enum(["kredits", "active", "topGainers", "topLosers"])
            .optional(),
        })
        .optional()
    )
    .subscription(({ input }) => {
      const filter = input?.filter || "kredits";
      return observable<{ success: boolean; users: LeaderboardUser[] }>(
        (emit) => {
          // Send initial data
          const sendUpdate = async () => {
            try {
              const db = await getDatabase();
              // Reuse the same pipelines as getLeaderboard for parity
              let pipeline: any[] = [];
              if (filter === "kredits") {
                pipeline = [
                  { $addFields: { creditsSafe: { $ifNull: ["$credits", 0] } } },
                  { $sort: { creditsSafe: -1 } },
                  {
                    $project: {
                      _id: 1,
                      name: { $ifNull: ["$name", "$username"] },
                      handle: { $ifNull: ["$handle", "$username"] },
                      kollaborationKredits: "$creditsSafe",
                      credits: "$creditsSafe",
                      avatarUrl: 1,
                      rank: 1,
                      earnedLifetime: 1,
                    },
                  },
                ];
              } else if (filter === "active") {
                pipeline = [
                  {
                    $lookup: {
                      from: "transactionHistory",
                      localField: "username",
                      foreignField: "from",
                      as: "sentTx",
                    },
                  },
                  {
                    $lookup: {
                      from: "transactionHistory",
                      localField: "username",
                      foreignField: "to",
                      as: "recvTx",
                    },
                  },
                  {
                    $addFields: {
                      txCount: {
                        $add: [{ $size: "$sentTx" }, { $size: "$recvTx" }],
                      },
                      kollaborationKredits: { $ifNull: ["$credits", 0] },
                    },
                  },
                  { $sort: { txCount: -1 } },
                  {
                    $project: {
                      _id: 1,
                      name: { $ifNull: ["$name", "$username"] },
                      handle: { $ifNull: ["$handle", "$username"] },
                      kollaborationKredits: 1,
                      credits: "$kollaborationKredits",
                      txCount: 1,
                      avatarUrl: 1,
                      rank: 1,
                    },
                  },
                ];
              } else if (filter === "topGainers" || filter === "topLosers") {
                pipeline = [
                  {
                    $lookup: {
                      from: "transactionHistory",
                      let: { uname: "$username" },
                      pipeline: [
                        { $match: { $expr: { $eq: ["$to", "$$uname"] } } },
                        {
                          $group: { _id: null, received: { $sum: "$amount" } },
                        },
                      ],
                      as: "receivedAgg",
                    },
                  },
                  {
                    $lookup: {
                      from: "transactionHistory",
                      let: { uname: "$username" },
                      pipeline: [
                        { $match: { $expr: { $eq: ["$from", "$$uname"] } } },
                        { $group: { _id: null, sent: { $sum: "$amount" } } },
                      ],
                      as: "sentAgg",
                    },
                  },
                  {
                    $addFields: {
                      receivedTotal: {
                        $ifNull: [
                          { $arrayElemAt: ["$receivedAgg.received", 0] },
                          0,
                        ],
                      },
                      sentTotal: {
                        $ifNull: [{ $arrayElemAt: ["$sentAgg.sent", 0] }, 0],
                      },
                    },
                  },
                  {
                    $addFields: {
                      netGain: { $subtract: ["$receivedTotal", "$sentTotal"] },
                      kollaborationKredits: { $ifNull: ["$credits", 0] },
                    },
                  },
                  { $sort: { netGain: filter === "topGainers" ? -1 : 1 } },
                  {
                    $project: {
                      _id: 1,
                      name: { $ifNull: ["$name", "$username"] },
                      handle: { $ifNull: ["$handle", "$username"] },
                      kollaborationKredits: 1,
                      credits: "$kollaborationKredits",
                      netGain: 1,
                      avatarUrl: 1,
                      rank: 1,
                    },
                  },
                ];
              }

              const users = await db
                .collection("userinformation")
                .aggregate(pipeline)
                .toArray();

              emit.next({ success: true, users: users as LeaderboardUser[] });
            } catch (error) {
              console.error("Error in leaderboard subscription:", error);
              emit.error(new Error("Error fetching leaderboard"));
            }
          };

          // Send initial data
          sendUpdate();

          // Listen for updates and re-send with chosen filter
          const onUpdate = () => {
            sendUpdate();
          };

          leaderboardEmitter.on("update", onUpdate);

          // Cleanup
          return () => {
            leaderboardEmitter.off("update", onUpdate);
          };
        }
      );
    }),
});

export type LeaderboardRouter = typeof leaderboardRouter;
