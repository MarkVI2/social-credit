import { getDatabase } from "@/lib/mongodb";

export const CONFIG_COLLECTION = "systemAccounts";
export const CONFIG_DOC_FILTER = { accountType: "globalConfig" };

export interface GlobalStats {
  count: number;
  sum: number;
  sumSq: number;
  mean: number;
  stdDev: number;
}

export async function getGlobalStats(): Promise<GlobalStats> {
  const db = await getDatabase();
  const config = await db
    .collection(CONFIG_COLLECTION)
    .findOne(CONFIG_DOC_FILTER);

  const count = config?.statsCount ?? 0;
  const sum = config?.statsSum ?? 0;
  const sumSq = config?.statsSumSq ?? 0;

  // Calculate derived stats
  const mean = count > 0 ? sum / count : 0;
  const variance = count > 0 ? sumSq / count - mean * mean : 0;
  const stdDev = Math.sqrt(Math.max(0, variance));

  return { count, sum, sumSq, mean, stdDev };
}

export async function updateGlobalStatsDelta(
  oldScore: number,
  newScore: number,
  isNewUser: boolean = false
): Promise<void> {
  const db = await getDatabase();
  const update: any = {
    $inc: {
      statsSum: newScore - oldScore,
      statsSumSq: newScore * newScore - oldScore * oldScore,
    },
    $set: { updatedAt: new Date() },
    $setOnInsert: { accountType: "globalConfig" },
  };

  if (isNewUser) {
    update.$inc.statsCount = 1;
  }

  await db
    .collection(CONFIG_COLLECTION)
    .updateOne(CONFIG_DOC_FILTER, update, { upsert: true });
}

// Deprecated but kept for compatibility if needed, though we should migrate away
export async function getGlobalMaxScore(): Promise<number> {
  const db = await getDatabase();
  const config = await db
    .collection(CONFIG_COLLECTION)
    .findOne(CONFIG_DOC_FILTER);
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
