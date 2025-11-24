import "dotenv/config";
import { getDatabase } from "../src/lib/mongodb";

async function main() {
  const db = await getDatabase();
  const items = await db.collection("marketplaceItems").find({}).toArray();
  console.log(JSON.stringify(items, null, 2));
  process.exit(0);
}

main();
