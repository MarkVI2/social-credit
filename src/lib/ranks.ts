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
