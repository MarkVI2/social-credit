import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export interface ActivityDataBase {
  from?: string;
  to?: string;
  amount?: number;
  reason?: string;
  admin?: string;
  user?: string;
  sourceAccount?: string;
  [key: string]: unknown;
}
export interface ActivityLog {
  _id?: ObjectId;
  type: string;
  action: string;
  data: ActivityDataBase | null;
  createdAt: Date;
  undone?: boolean;
  message?: string; // human readable summary
}

export async function recordActivity(
  entry: Omit<ActivityLog, "_id" | "createdAt">
) {
  const db = await getDatabase();
  const col = db.collection<ActivityLog>("activityLogs");
  const doc: ActivityLog = { ...entry, createdAt: new Date() };
  await col.insertOne(doc);
  return doc;
}

export async function listActivity({
  skip = 0,
  limit = 50,
}: {
  skip?: number;
  limit?: number;
}) {
  const db = await getDatabase();
  // Fetch from the consolidated transactionHistory collection
  const col = db.collection<any>("transactionHistory");
  // Sort by timestamp descending
  const cursor = col.find({}, { sort: { timestamp: -1 }, skip, limit });
  const rawItems = await cursor.toArray();
  // Map timestamp field to createdAt for backward compatibility
  const items = rawItems.map((doc) => ({
    ...doc,
    createdAt: (doc as any).timestamp,
  }));
  const total = await col.countDocuments();
  return { items, total };
}

export async function markActivityUndone(id: string) {
  const db = await getDatabase();
  await db
    .collection<ActivityLog>("activityLogs")
    .updateOne({ _id: new ObjectId(id) }, { $set: { undone: true } });
}
