// Rank utilities: compute vanity communist-styled ranks based on lifetime earned credits

export type VanityRank = {
  name: string;
  min: number; // inclusive threshold for earnedLifetime
};

// Ordered ascending by min threshold
export const RANKS: VanityRank[] = [
  { min: 0, name: "Recruit" },
  { min: 20, name: "Comrade Jr." },
  { min: 40, name: "Comrade" },
  { min: 70, name: "Comrade Sr." },
  { min: 100, name: "Brigade Org." },
  { min: 140, name: "Steward" },
  { min: 180, name: "Red Banner" },
  { min: 230, name: "Cadre" },
  { min: 290, name: "Vanguard" },
  { min: 360, name: "Council" },
  { min: 440, name: "Politburo" },
  { min: 540, name: "First Sec." },
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

export function calculateCourseCredits(
  earnedLifetime: number = 0,
  spentLifetime: number = 0,
  maxThreshold: number = MAX_SCORE_THRESHOLD
): number {
  const score = 0.75 * earnedLifetime + 0.25 * spentLifetime;

  if (score <= MIN_SCORE_THRESHOLD) return MIN_COURSE_CREDITS;
  if (score >= maxThreshold) return MAX_COURSE_CREDITS;

  const range = maxThreshold - MIN_SCORE_THRESHOLD;
  // Avoid division by zero if maxThreshold equals MIN_SCORE_THRESHOLD
  if (range <= 0) return MAX_COURSE_CREDITS;

  const progress = (score - MIN_SCORE_THRESHOLD) / range;
  const credits =
    MIN_COURSE_CREDITS + progress * (MAX_COURSE_CREDITS - MIN_COURSE_CREDITS);

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
