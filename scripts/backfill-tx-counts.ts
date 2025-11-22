import "dotenv/config";
import { getDatabase } from "../src/lib/mongodb";

async function main() {
  const db = await getDatabase();
  const users = db.collection("userinformation");
  const transactions = db.collection("transactionHistory");

  console.log("Backfilling transaction counts (excluding admin transactions)...");
  const allUsers = await users.find({}).toArray();

  let updatedCount = 0;

  for (const user of allUsers) {
    const identifiers = [user.username, user.email].filter(Boolean);

    // Count sent transactions (excluding admin)
    // Note: Anonymous transactions are not linked to user here, so they are excluded from user's count.
    const sentCount = await transactions.countDocuments({
      from: { $in: identifiers },
      $or: [{ type: { $exists: false } }, { type: { $ne: "admin" } }],
    });

    // Count received transactions (excluding admin)
    const receivedCount = await transactions.countDocuments({
      to: { $in: identifiers },
      $or: [{ type: { $exists: false } }, { type: { $ne: "admin" } }],
    });

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          transactionsSent: sentCount,
          transactionsReceived: receivedCount,
        },
      }
    );

    updatedCount++;
    if (updatedCount % 10 === 0) {
      process.stdout.write(`\rUpdated ${updatedCount}/${allUsers.length} users`);
    }
  }

  console.log(`\nFinished! Updated ${updatedCount} users.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
