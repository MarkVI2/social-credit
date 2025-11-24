import "dotenv/config";
import { getDatabase } from "../src/lib/mongodb";
import { RANKS } from "../src/lib/ranks";
import { ObjectId } from "mongodb";

async function main() {
  const db = await getDatabase();
  const marketplace = db.collection("marketplaceItems");
  const users = db.collection("userinformation");
  const inventory = db.collection("userInventory");

  console.log("Step 1: Syncing Marketplace Rank Items...");

  // 1. Ensure all ranks exist in marketplace
  for (let i = 0; i < RANKS.length; i++) {
    const rank = RANKS[i];
    const itemName = `${rank.name} Badge`;
    const order = i + 1;
    const sku = `RANK_${i}`;

    // Check if exists by name or sku
    const existing = await marketplace.findOne({
      $or: [{ name: itemName }, { sku: sku }],
    });

    if (existing) {
      // Update metadata
      await marketplace.updateOne(
        { _id: existing._id },
        {
          $set: {
            category: "rank",
            order: order,
            sku: sku, // Standardize SKU
            updatedAt: new Date(),
          },
        }
      );
      console.log(`Updated rank item: ${itemName}`);
    } else {
      // Create new
      await marketplace.insertOne({
        itemId: new ObjectId().toHexString(),
        name: itemName,
        description: `Official badge for the ${rank.name} rank.`,
        price: 10, // Default price
        imageUrl: "",
        sku: sku,
        category: "rank",
        order: order,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`Created rank item: ${itemName}`);
    }
  }

  console.log("\nStep 2: Backfilling User Inventory & Ranks...");

  const allUsers = await users.find({}).toArray();
  let updatedUsers = 0;

  for (const user of allUsers) {
    const earned = user.earnedLifetime ?? 20;

    // Determine which ranks this user SHOULD have based on lifetime earnings
    // We backfill them so they don't have to re-buy everything they already earned
    const eligibleRanks = RANKS.filter((r) => earned >= r.min);

    let highestRankName = "Recruit";

    for (let i = 0; i < eligibleRanks.length; i++) {
      const rank = eligibleRanks[i];
      const itemName = `${rank.name} Badge`;
      const sku = `RANK_${i}`;

      // Find the item ID
      const itemDoc = await marketplace.findOne({ sku });
      if (!itemDoc) continue;

      // Check inventory
      const hasItem = await inventory.findOne({
        userId: user._id,
        $or: [{ itemId: itemDoc.itemId }, { sku: sku }],
      });

      if (!hasItem) {
        // Grant item
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

      highestRankName = rank.name;
    }

    // Update user's current rank field to match highest owned/eligible
    if (user.rank !== highestRankName) {
      await users.updateOne(
        { _id: user._id },
        { $set: { rank: highestRankName } }
      );
      updatedUsers++;
    }
  }

  console.log(`\nFinished! Updated ranks for ${updatedUsers} users.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
