// Rank utilities: compute vanity communist-styled ranks based on lifetime earned credits

export type VanityRank = {
  name: string;
  min: number; // inclusive threshold for earnedLifetime
};

// Ordered ascending by min threshold
export const RANKS: VanityRank[] = [
  { min: 0, name: "New Recruit" },
  { min: 20, name: "Junior Comrade" },
  { min: 40, name: "Comrade" },
  { min: 70, name: "Senior Comrade" },
  { min: 100, name: "Brigade Organizer" },
  { min: 140, name: "Collective Steward" },
  { min: 180, name: "Red Banner Bearer" },
  { min: 230, name: "People's Cadre" },
  { min: 290, name: "Vanguard Planner" },
  { min: 360, name: "Council Member" },
  { min: 440, name: "Politburo Advisor" },
  { min: 540, name: "First Secretary" },
  { min: 680, name: "Hero of the People" },
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
