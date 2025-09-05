import dotenv from "dotenv";
// Load env before importing any project modules
dotenv.config({ path: ".env.local" });
dotenv.config();
// Use relative import to avoid Next.js path alias resolution issues under tsx
import { getDatabase } from "../src/lib/mongodb";
import { ObjectId } from "mongodb";
import { RANKS } from "../src/lib/ranks";

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
      price: 3,
      category: "utility",
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
      price: 5,
      category: "utility",
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      itemId: new ObjectId().toHexString(),
      sku: "RANK_RECRUIT",
      name: "Recruit Badge",
      description: "Official recognition of a new Komrade.",
      price: 0,
      category: "rank",
      order: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      itemId: new ObjectId().toHexString(),
      sku: "RANK_KOMRADE",
      name: "Komrade Badge",
      description: "A true and tested Komrade.",
      price: 100,
      category: "rank",
      order: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      itemId: new ObjectId().toHexString(),
      sku: "RANK_APPARATCHIK",
      name: "Apparatchik Badge",
      description: "A member of the Party machine.",
      price: 500,
      category: "rank",
      order: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      itemId: new ObjectId().toHexString(),
      sku: "RANK_COMMISSAR",
      name: "Commissar Badge",
      description: "An enforcer of Party doctrine.",
      price: 2500,
      category: "rank",
      order: 4,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      itemId: new ObjectId().toHexString(),
      sku: "RANK_POLITBURO",
      name: "Politburo Badge",
      description: "A member of the inner circle.",
      price: 10000,
      category: "rank",
      order: 5,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      itemId: new ObjectId().toHexString(),
      sku: "RANK_GENERAL_SECRETARY",
      name: "General Secretary Badge",
      description: "The supreme leader.",
      price: 50000,
      category: "rank",
      order: 6,
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

  // Seed rank badge items
  let rankCreated = 0;
  let rankUpdated = 0;
  for (let i = 0; i < RANKS.length; i++) {
    const r = RANKS[i];
    const itemId = `rank-${r.min}`;
    const sku = `rank:${r.min}`;
    // Price between 5 and 10, scaled by rank index
    const price = 5 + Math.floor((i * 5) / Math.max(1, RANKS.length - 1));
    const base = {
      itemId,
      sku,
      name: `${r.name} Badge`,
      description: `Rank badge for ${r.name}. Achieve ${r.min}+ lifetime credits to unlock.`,
      price,
      updatedAt: now,
    } as any;
    const res = await coll.updateOne(
      { sku },
      { $setOnInsert: { _id: new ObjectId(), createdAt: now }, $set: base },
      { upsert: true }
    );
    if (res.upsertedCount && res.upsertedCount > 0) rankCreated++;
    else if (res.modifiedCount > 0) rankUpdated++;
  }
  console.log(
    `Rank badges upserted. Created: ${rankCreated}, Updated: ${rankUpdated}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
