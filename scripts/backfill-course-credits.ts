import "dotenv/config";
import { getDatabase } from "../src/lib/mongodb";
import {
  calculateCourseCredits,
  IGNORED_USERS_FOR_GLOBAL_MAX,
} from "../src/lib/ranks";

async function main() {
  const db = await getDatabase();
  const users = db.collection("userinformation");
  const system = db.collection("systemAccounts");

  console.log("Fetching all users to determine max score...");
  const allUsers = await users.find({}).toArray();

  let maxScore = 0;
  let maxScoreUser = "Unknown";
  const userScores = new Map<string, number>();

  // 1. Calculate all scores and find max (excluding ignored users)
  for (const user of allUsers) {
    const earned = user.earnedLifetime ?? 20;
    const spent = user.spentLifetime ?? 0;
    const score = 0.75 * earned + 0.25 * spent;
    userScores.set(user._id.toString(), score);

    const isIgnored =
      IGNORED_USERS_FOR_GLOBAL_MAX.includes(user.username) ||
      IGNORED_USERS_FOR_GLOBAL_MAX.includes(user.email);

    if (!isIgnored && score > maxScore) {
      maxScore = score;
      maxScoreUser = user.username || user.email || "Unknown";
    }
  }

  // Ensure maxScore is at least the minimum threshold (15) to avoid weird scaling
  // If everyone is new (score 15), maxScore is 15.
  if (maxScore < 15) maxScore = 15;

  console.log(`Global Max Score found: ${maxScore} (held by ${maxScoreUser})`);

  // 2. Save max score to config
  await system.updateOne(
    { accountType: "globalConfig" },
    {
      $set: {
        maxScore: maxScore,
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
    const courseCredits = calculateCourseCredits(earned, spent, maxScore);

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
