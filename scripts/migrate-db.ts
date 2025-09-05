/* eslint-disable no-console */
import * as mongodb from "mongodb";
import type { Db, Collection as MongoCollectionType, Document } from "mongodb";
import dotenv from "dotenv";
const { MongoClient } = mongodb;

// Load environment variables from .env file
dotenv.config();

async function runMigration() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error("Error: MONGODB_URI is not defined in your .env file.");
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const dbName = new URL(MONGODB_URI).pathname.substring(1);
    const db = client.db(dbName);
    console.log(`Connected to MongoDB database: ${dbName}`);

    // Step 1: Clean up and amend marketplaceItems
    await handleMarketplaceItems(db);

    // Step 2: Migrate activityLogs to transactionHistory
    await migrateActivityLogs(db);

    console.log("\nMigration completed successfully.");
    console.log(
      "You may now delete the activityLogs collection from your database."
    );
  } catch (error) {
    console.error("\nAn error occurred during migration:", error);
  } finally {
    await client.close();
    console.log("\nMongoDB connection closed.");
  }
}

async function handleMarketplaceItems(db: Db) {
  console.log("\n--- Handling marketplaceItems ---");
  const marketplaceItems: MongoCollectionType =
    db.collection("marketplaceItems");

  // Find and delete duplicates
  console.log(
    "Finding and deleting duplicate marketplace items based on SKU..."
  );
  const duplicateCursor = marketplaceItems.aggregate([
    {
      $group: {
        _id: { sku: "$sku" },
        uniqueIds: { $addToSet: "$_id" },
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
  ]);

  const duplicates = await duplicateCursor.toArray();

  if (duplicates.length === 0) {
    console.log("  - No duplicate marketplace items found.");
  } else {
    for (const doc of duplicates) {
      doc.uniqueIds.shift(); // Keep the first one
      const result = await marketplaceItems.deleteMany({
        _id: { $in: doc.uniqueIds },
      });
      console.log(
        `  - Deleted ${result.deletedCount} duplicate(s) for SKU: ${doc._id.sku}`
      );
    }
  }

  // Amend items with category and order
  console.log("Amending marketplace items with category and order fields...");
  const itemsToAmendCursor = marketplaceItems.find({
    category: { $exists: false },
  });
  const itemsToAmend = await itemsToAmendCursor.toArray();

  if (itemsToAmend.length === 0) {
    console.log("  - All marketplace items already have the 'category' field.");
  } else {
    for (const doc of itemsToAmend) {
      let category = "utility";
      let order = 0;

      if (doc.name.includes("Badge")) {
        category = "rank";
        if (doc.sku === "RANK_RECRUIT") order = 1;
        else if (doc.sku === "RANK_KOMRADE") order = 2;
        else if (doc.sku === "RANK_APPARATCHIK") order = 3;
        else if (doc.sku === "RANK_COMMISSAR") order = 4;
        else if (doc.sku === "RANK_POLITBURO") order = 5;
        else if (doc.sku === "RANK_GENERAL_SECRETARY") order = 6;
      }

      await marketplaceItems.updateOne(
        { _id: doc._id },
        {
          $set: {
            category: category,
            order: order,
          },
        }
      );
    }
    console.log(`  - Amended ${itemsToAmend.length} marketplace items.`);
  }
  console.log("--- Finished handling marketplaceItems ---");
}

async function migrateActivityLogs(db: Db) {
  console.log("\n--- Migrating activityLogs to transactionHistory ---");
  const activityLogs: MongoCollectionType = db.collection("activityLogs");
  const transactionHistory: MongoCollectionType =
    db.collection("transactionHistory");

  const logs = await activityLogs.find().toArray();
  if (logs.length === 0) {
    console.log("  - No activity logs to migrate.");
  } else {
    const transactionsToInsert: Document[] = logs.map((log: Document) => {
      const { _id, createdAt, type, action, undone, message, data } = log;
      return {
        timestamp: createdAt,
        type: type,
        action: action,
        undone: undone,
        message: message,
        ...data,
      };
    });

    const result = await transactionHistory.insertMany(transactionsToInsert);
    console.log(
      `  - Migrated ${result.insertedCount} documents from activityLogs to transactionHistory.`
    );

    console.log(
      "\nIMPORTANT: The script has NOT deleted the original activityLogs collection."
    );
    console.log(
      "Please verify the migrated data in 'transactionHistory' and then manually drop the 'activityLogs' collection."
    );
  }
  console.log("--- Finished migrating activityLogs ---");
}

runMigration().catch(console.error);
