import "dotenv/config";
import { getDatabase } from "../src/lib/mongodb";
import { getVanityRank } from "../src/lib/ranks";

async function main() {
  const db = await getDatabase();
  const users = db.collection("userinformation");
  const cursor = users.find({});
  let updated = 0;
  while (await cursor.hasNext()) {
    const u = await cursor.next();
    if (!u) continue;
    const credits = typeof u.credits === "number" ? u.credits : 20;
    const earnedLifetime =
      typeof u.earnedLifetime === "number" ? u.earnedLifetime : credits;
    const rank =
      typeof u.rank === "string" ? u.rank : getVanityRank(earnedLifetime);
    const res = await users.updateOne(
      { _id: u._id },
      { $set: { earnedLifetime, rank, updatedAt: new Date() } }
    );
    if (res.modifiedCount > 0) updated++;
  }
  console.log(`Backfill complete. Updated ${updated} users.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
