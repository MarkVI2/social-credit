import "dotenv/config";
import { getDatabase } from "../src/lib/mongodb";

async function main() {
  const db = await getDatabase();
  const tx = db.collection("transactionHistory");
  const users = db.collection("userinformation");

  console.log("Backfilling spentLifetime and transactionsSent...");
  const sentAgg = await tx
    .aggregate([
      // Only human users: exclude system accounts and anonymized; ignore admin adjustment logs
      {
        $match: {
          from: { $nin: ["mint", "classBank", "Anonymous Komrade"] },
          $or: [{ type: { $exists: false } }, { type: { $ne: "admin" } }],
        },
      },
      {
        $group: {
          _id: "$from",
          // 'amount' is positive value to 'to'; spending is deducted from sender
          totalSpent: { $sum: "$amount" },
          countSent: { $sum: 1 },
        },
      },
    ])
    .toArray();
  for (const doc of sentAgg) {
    const key = String(doc._id);
    const filter = key.includes("@")
      ? { email: key.toLowerCase() }
      : { username: key };
    await users.updateMany(filter as any, {
      $set: {
        // Ensure non-negative lifetime; treat aggregated sum as absolute spending
        spentLifetime: Math.abs(doc.totalSpent || 0),
        transactionsSent: doc.countSent,
      },
    });
  }

  console.log("Backfilling receivedLifetime and transactionsReceived...");
  const recvAgg = await tx
    .aggregate([
      {
        $match: {
          to: { $nin: ["mint", "classBank", "Anonymous Komrade", "all"] },
          $or: [{ type: { $exists: false } }, { type: { $ne: "admin" } }],
        },
      },
      {
        $group: {
          _id: "$to",
          totalReceived: { $sum: "$amount" },
          countReceived: { $sum: 1 },
        },
      },
    ])
    .toArray();
  for (const doc of recvAgg) {
    const key = String(doc._id);
    const filter = key.includes("@")
      ? { email: key.toLowerCase() }
      : { username: key };
    await users.updateMany(filter as any, {
      $set: {
        receivedLifetime: doc.totalReceived,
        transactionsReceived: doc.countReceived,
      },
    });
  }

  console.log("Backfill complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
