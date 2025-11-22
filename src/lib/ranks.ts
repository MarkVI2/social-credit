// Rank utilities: compute vanity communist-styled ranks based on lifetime earned credits

export type VanityRank = {
  name: string;
  min: number; // inclusive threshold for earnedLifetime
};

// Ordered ascending by min threshold
export const RANKS: VanityRank[] = [
  { min: 0, name: "Recruit" },
  { min: 20, name: "Comrade Jr." },
  { min: 30, name: "Komrade" },
  { min: 50, name: "Komrade Sr." },
  { min: 70, name: "Brigade Org." },
  { min: 100, name: "Steward" },
  { min: 150, name: "Red Banner" },
  { min: 210, name: "Cadre" },
  { min: 280, name: "Vanguard" },
  { min: 340, name: "Council" },
  { min: 450, name: "Politburo" },
  { min: 550, name: "First Sec." },
  { min: 680, name: "People's Hero" },
];

export const MAX_COURSE_CREDITS = 5.0;
export const MIN_COURSE_CREDITS = 3.5;
// Based on People's Hero rank (680) and initial grant (20)
// Score = 0.75 * earned + 0.25 * spent
// Min Score = 0.75 * 20 + 0.25 * 0 = 15
// Max Score (approx) = 0.75 * 680 + 0.25 * 680 = 680 (if all spent)
// or 0.75 * 680 + 0.25 * 0 = 510 (if none spent)
// We'll use 680 as the max threshold for 5.0
export const MAX_SCORE_THRESHOLD = 680; // Default fallback
export const MIN_SCORE_THRESHOLD = 15;

export const IGNORED_USERS_FOR_GLOBAL_MAX = [
  "yytgpt",
  "yayati.gupta@mahindrauniversity.edu.in",
];

export function calculateRawScore(
  earnedLifetime: number = 0,
  spentLifetime: number = 0
): number {
  return 0.75 * earnedLifetime + 0.25 * spentLifetime;
}

export function calculateCourseCredits(
  earnedLifetime: number = 0,
  spentLifetime: number = 0,
  mean: number = 15,
  stdDev: number = 10
): number {
  const rawScore = calculateRawScore(earnedLifetime, spentLifetime);

  // If no variation yet, everyone gets the median grade
  if (stdDev === 0) return 4.25;

  // Z-score calculation
  const z = (rawScore - mean) / stdDev;

  // Map Z-score to grade:
  // Mean (Z=0) -> 4.25
  // +2 SD (Z=2) -> 5.00
  // -2 SD (Z=-2) -> 3.50
  // Scale factor = (5.0 - 4.25) / 2 = 0.375
  let credits = 4.25 + z * 0.375;

  // Clamp to valid range
  credits = Math.max(MIN_COURSE_CREDITS, Math.min(MAX_COURSE_CREDITS, credits));

  return Number(credits.toFixed(2));
}

export function getVanityRank(
  earnedLifetime: number | undefined | null
): string {
  const e = Math.max(0, Math.floor(earnedLifetime ?? 0));
  let current = RANKS[0].name;
  for (const r of RANKS) {
    if (e >= r.min) current = r.name;
    else break;
  }
  return current;
}

export function nextRankInfo(earnedLifetime: number | undefined | null): {
  next?: VanityRank;
  remaining?: number;
} {
  const e = Math.max(0, Math.floor(earnedLifetime ?? 0));
  for (let i = 0; i < RANKS.length; i++) {
    const r = RANKS[i];
    const next = RANKS[i + 1];
    if (!next) return { next: undefined, remaining: undefined };
    if (e >= r.min && e < next.min) {
      return { next, remaining: next.min - e };
    }
  }
  return { next: undefined, remaining: undefined };
}
