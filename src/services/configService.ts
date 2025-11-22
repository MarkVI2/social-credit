import { getDatabase } from "@/lib/mongodb";

export const CONFIG_COLLECTION = "systemAccounts";
export const CONFIG_DOC_FILTER = { accountType: "globalConfig" };

export async function getGlobalMaxScore(): Promise<number> {
  const db = await getDatabase();
  const config = await db
    .collection(CONFIG_COLLECTION)
    .findOne(CONFIG_DOC_FILTER);
  // Default to 680 if not set, or maybe a lower reasonable default?
  // If we want strictly relative, we might want to start low or handle "no max yet".
  // But 680 is the "People's Hero" rank, so it's a good fallback.
  return config?.maxScore ?? 680;
}

export async function updateGlobalMaxScore(newMax: number): Promise<void> {
  const db = await getDatabase();
  await db.collection(CONFIG_COLLECTION).updateOne(
    CONFIG_DOC_FILTER,
    {
      $set: {
        maxScore: newMax,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        accountType: "globalConfig",
      },
    },
    { upsert: true }
  );
}
