import "dotenv/config";
import { getDatabase } from "../src/lib/mongodb";
import { ObjectId } from "mongodb";

async function main() {
  const db = await getDatabase();
  const system = db.collection("systemAccounts");
  const existing = await system.findOne({ accountType: "classBank" });
  if (!existing) {
    await system.insertOne({
      _id: new ObjectId(),
      accountType: "classBank",
      balance: 1000,
      lastUpdated: new Date(),
    });
    console.log("Created classBank with 1000 balance");
  } else {
    console.log("classBank already exists with balance", existing.balance);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
