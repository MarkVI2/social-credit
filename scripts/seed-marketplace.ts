import dotenv from "dotenv";
// Load env before importing any project modules
dotenv.config({ path: ".env.local" });
dotenv.config();
// Use relative import to avoid Next.js path alias resolution issues under tsx
import { getDatabase } from "../src/lib/mongodb";
import { ObjectId } from "mongodb";

async function main() {
  const db = await getDatabase();
  const coll = db.collection("marketplaceItems");
  const now = new Date();

  const items = [
    {
      _id: new ObjectId(),
      itemId: new ObjectId().toHexString(),
      sku: "USERNAME_CHANGE_TOKEN",
      name: "Decree of Renaming",
      description:
        "A solemn writ allowing a comrade a one-time reshaping of identity before the collective.",
      price: 150,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      itemId: new ObjectId().toHexString(),
      sku: "ANONYMITY_TOKEN_24H",
      name: "Veil of the Anonymous Komrade",
      description:
        "For 24 hours, appear as 'Anonymous Komrade' in the public rolls — a cloak sanctioned by the Committee.",
      price: 200,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      itemId: new ObjectId().toHexString(),
      sku: "VANITY_RANKS_BASIC",
      name: "Ornamental Title of Distinction",
      description:
        "A purely ceremonial title affixed beside one's earned rank, to delight the masses.",
      price: 100,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const it of items) {
    const exists = await coll.findOne({ sku: it.sku });
    if (!exists) {
      await coll.insertOne(it);
      console.log(`Inserted ${it.sku}`);
    } else {
      console.log(`Skipped existing ${it.sku}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
