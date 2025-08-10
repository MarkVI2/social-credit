import { getDatabase } from "@/lib/mongodb";

export type TransactionLog = {
  from: string;
  to: string;
  amount: number; // positive for credit to 'to'
  reason: string;
  timestamp: Date;
};

export async function logTransaction(entry: TransactionLog) {
  const db = await getDatabase();
  await db.collection("transactionHistory").insertOne({ ...entry });
}
