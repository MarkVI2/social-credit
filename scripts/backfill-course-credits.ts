import "dotenv/config";
import { getDatabase } from "../src/lib/mongodb";
import {
  calculateCourseCredits,
  calculateRawScore,
  IGNORED_USERS_FOR_GLOBAL_MAX,
} from "../src/lib/ranks";

async function main() {
  const db = await getDatabase();
  const users = db.collection("userinformation");
  const system = db.collection("systemAccounts");

  console.log("Fetching all users to calculate stats...");
  const allUsers = await users.find({}).toArray();

  let count = 0;
  let sum = 0;
  let sumSq = 0;
  let minScore = Infinity;
  let maxScore = -Infinity;
  const scores: number[] = [];

  // 1. Calculate stats (excluding ignored users)
  for (const user of allUsers) {
    const earned = user.earnedLifetime ?? 20;
    const spent = user.spentLifetime ?? 0;
    const rawScore = calculateRawScore(earned, spent);

    const isIgnored =
      IGNORED_USERS_FOR_GLOBAL_MAX.includes(user.username) ||
      IGNORED_USERS_FOR_GLOBAL_MAX.includes(user.email);

    if (!isIgnored) {
      count++;
      sum += rawScore;
      sumSq += rawScore * rawScore;
      scores.push(rawScore);
      if (rawScore < minScore) minScore = rawScore;
      if (rawScore > maxScore) maxScore = rawScore;
    }
  }

  const mean = count > 0 ? sum / count : 0;
  const variance = count > 0 ? sumSq / count - mean * mean : 0;
  const stdDev = Math.sqrt(Math.max(0, variance));

  // Calculate Mode
  const frequency: Record<number, number> = {};
  let maxFreq = 0;
  let mode = 0;
  for (const s of scores) {
    frequency[s] = (frequency[s] || 0) + 1;
    if (frequency[s] > maxFreq) {
      maxFreq = frequency[s];
      mode = s;
    }
  }

  console.log(
    `Stats calculated:
    Count=${count}
    Mean=${mean.toFixed(2)}
    StdDev=${stdDev.toFixed(2)}
    Min=${minScore === Infinity ? 0 : minScore.toFixed(2)}
    Max=${maxScore === -Infinity ? 0 : maxScore.toFixed(2)}
    Mode=${mode.toFixed(2)} (count: ${maxFreq})`
  );

  // 2. Save stats to config
  await system.updateOne(
    { accountType: "globalConfig" },
    {
      $set: {
        statsCount: count,
        statsSum: sum,
        statsSumSq: sumSq,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        accountType: "globalConfig",
      },
    },
    { upsert: true }
  );

  console.log("Updating users with relative grading...");

  // 3. Update all users
  let updatedCount = 0;
  for (const user of allUsers) {
    const earned = user.earnedLifetime ?? 20;
    const spent = user.spentLifetime ?? 0;
    const courseCredits = calculateCourseCredits(earned, spent, mean, stdDev);

    await users.updateOne(
      { _id: user._id },
      { $set: { courseCredits: courseCredits } }
    );
    updatedCount++;
  }

  console.log(`Updated ${updatedCount} users.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
