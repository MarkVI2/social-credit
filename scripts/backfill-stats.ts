import { getDatabase } from "../src/lib/mongodb";

async function main() {
  const db = await getDatabase();
  const tx = db.collection("transactionHistory");
  const users = db.collection("userinformation");

  console.log("Backfilling spentLifetime and transactionsSent...");
  const sentAgg = await tx
    .aggregate([
      {
        $group: {
          _id: "$from",
          totalSpent: { $sum: "$amount" },
          countSent: { $sum: 1 },
        },
      },
    ])
    .toArray();
  for (const doc of sentAgg) {
    await users.updateMany(
      { $or: [{ username: doc._id }, { email: doc._id }] },
      {
        $set: {
          spentLifetime: doc.totalSpent,
          transactionsSent: doc.countSent,
        },
      }
    );
  }

  console.log("Backfilling receivedLifetime and transactionsReceived...");
  const recvAgg = await tx
    .aggregate([
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
    await users.updateMany(
      { $or: [{ username: doc._id }, { email: doc._id }] },
      {
        $set: {
          receivedLifetime: doc.totalReceived,
          transactionsReceived: doc.countReceived,
        },
      }
    );
  }

  console.log("Backfill complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
