import "dotenv/config";
import { getDatabase } from "../src/lib/mongodb";
import { getVanityRank } from "../src/lib/ranks";

async function main() {
  const db = await getDatabase();
  const tx = db.collection("transactionHistory");
  const users = db.collection("userinformation");

  console.log(
    "Aggregating total incoming credits per user from transactionHistory…"
  );
  const recvAgg = await tx
    .aggregate<{
      _id: string; // username or email
      totalReceived: number;
    }>([
      {
        $match: {
          to: {
            $exists: true,
            $nin: ["all", "Anonymous Komrade", "mint", "classBank"],
          },
        },
      },
      {
        $group: {
          _id: "$to",
          totalReceived: { $sum: "$amount" },
        },
      },
    ])
    .toArray();

  let updatedFromAgg = 0;
  for (const doc of recvAgg) {
    const key = String(doc._id);
    const filter = key.includes("@")
      ? { email: key.toLowerCase() }
      : { username: key };
    const u = await users.findOne(filter as any);
    if (!u) continue;
    const newLifetime = 20 + Math.max(0, Math.floor(doc.totalReceived || 0));
    const newRank = getVanityRank(newLifetime);
    const res = await users.updateOne(
      { _id: u._id },
      {
        $set: {
          earnedLifetime: newLifetime,
          rank: newRank,
          updatedAt: new Date(),
        },
      }
    );
    if (res.modifiedCount > 0) updatedFromAgg++;
  }

  // Ensure all users have at least baseline 20 if they never received any transactions
  console.log(
    "Ensuring baseline earnedLifetime=20 for users without incoming tx…"
  );
  const baselineRes = await users.updateMany(
    {
      $or: [
        { earnedLifetime: { $exists: false } },
        { earnedLifetime: { $lt: 20 } },
      ],
    },
    { $set: { earnedLifetime: 20 }, $currentDate: { updatedAt: true } }
  );

  // Recompute spentLifetime strictly from marketplace and auction spends
  console.log("Recomputing spentLifetime from marketplace & auction logs…");
  const spentAgg = await tx
    .aggregate<{
      _id: string;
      totalSpent: number;
    }>([
      {
        $match: {
          // Outgoing to classBank from users represents marketplace/auction spending
          to: "classBank",
          from: { $nin: ["mint", "classBank", "Anonymous Komrade"] },
          // Explicit types used by marketplace and auctions
          type: { $in: ["marketplace_purchase", "auction_settlement"] },
        },
      },
      { $group: { _id: "$from", totalSpent: { $sum: "$amount" } } },
    ])
    .toArray();
  // Reset spentLifetime to 0 first to avoid stale values
  await users.updateMany({}, { $set: { spentLifetime: 0 } });
  for (const doc of spentAgg) {
    const key = String(doc._id);
    const filter = key.includes("@")
      ? { email: key.toLowerCase() }
      : { username: key };
    await users.updateMany(filter as any, {
      $set: { spentLifetime: Math.max(0, Math.floor(doc.totalSpent || 0)) },
      $currentDate: { updatedAt: true },
    });
  }
  // Refresh ranks for all users to stay consistent with possibly changed lifetime values
  console.log("Refreshing ranks to match earnedLifetime…");
  const cursor = users.find(
    {},
    { projection: { _id: 1, earnedLifetime: 1, rank: 1 } }
  );
  let rankUpdated = 0;
  while (await cursor.hasNext()) {
    const u: any = await cursor.next();
    if (!u) continue;
    const lifetime =
      typeof u.earnedLifetime === "number" ? u.earnedLifetime : 20;
    const desired = getVanityRank(lifetime);
    if (u.rank !== desired) {
      const res = await users.updateOne(
        { _id: u._id },
        { $set: { rank: desired }, $currentDate: { updatedAt: true } }
      );
      if (res.modifiedCount > 0) rankUpdated++;
    }
  }

  console.log(
    `Backfill complete. Updated from tx aggregates: ${updatedFromAgg}. Baseline set for ${baselineRes.modifiedCount}. Ranks refreshed: ${rankUpdated}.`
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
