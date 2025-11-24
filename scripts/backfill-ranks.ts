import "dotenv/config";
import { getDatabase } from "../src/lib/mongodb";
import { RANKS } from "../src/lib/ranks";
import { ObjectId } from "mongodb";

async function main() {
  const db = await getDatabase();
  const users = db.collection("userinformation");
  const inventory = db.collection("userInventory");
  const marketplace = db.collection("marketplaceItems");

  console.log("Fetching all users...");
  const allUsers = await users.find({}).toArray();
  let updatedCount = 0;

  for (const user of allUsers) {
    const earned = user.earnedLifetime ?? 20;

    // 1. Determine the highest rank they are ELIGIBLE for based on earnings
    const eligibleRanks = RANKS.filter((r) => earned >= r.min);

    // 2. Ensure they have the inventory items for ALL eligible ranks
    // (Since we are fixing data, we assume they should have them)
    let highestOwnedRankName = "Recruit";

    for (let i = 0; i < eligibleRanks.length; i++) {
      const rank = eligibleRanks[i];
      const sku = `RANK_${i}`;
      const itemName = `${rank.name} Badge`;

      // Find the marketplace item to get correct ID/Description
      const itemDoc = await marketplace.findOne({ sku });
      if (!itemDoc) {
        // console.warn(`Warning: Marketplace item not found for SKU ${sku}`);
        continue;
      }

      // Check if user has this rank item
      const hasItem = await inventory.findOne({
        userId: user._id,
        $or: [{ itemId: itemDoc.itemId }, { sku: sku }],
      });

      if (!hasItem) {
        // Grant the item
        await inventory.insertOne({
          _id: new ObjectId(),
          userId: user._id,
          itemId: itemDoc.itemId,
          sku: sku,
          name: itemName,
          description: itemDoc.description,
          acquiredAt: new Date(),
        });
        // console.log(`Granted ${itemName} to ${user.username}`);
      }

      highestOwnedRankName = rank.name;
    }

    // 3. Update the user's rank field to match the highest rank they now own
    // Also fix any inconsistencies in rank naming (e.g. "Comrade Jr." vs "Comrade Jr")
    if (user.rank !== highestOwnedRankName) {
      console.log(
        `Updating ${user.username}: "${user.rank}" -> "${highestOwnedRankName}" (Earned: ${earned})`
      );
      await users.updateOne(
        { _id: user._id },
        { $set: { rank: highestOwnedRankName } }
      );
      updatedCount++;
    }
  }

  console.log(`\nFinished! Fixed ranks for ${updatedCount} users.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
