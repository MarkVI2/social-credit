"use client";

import { useMemo } from "react";
import { Oswald } from "next/font/google";

const oswald = Oswald({ subsets: ["latin"], weight: ["500", "600", "700"] });

export interface LeaderboardEntryData {
  _id: string;
  name?: string;
  handle?: string;
  kollaborationKredits: number;
  avatarUrl?: string;
  rank?: string;
}

export function LeaderboardEntry({
  user,
  rank,
  highlight,
  alwaysRow = false,
  fixedBadgeWidth = false,
}: {
  user: LeaderboardEntryData;
  rank: number;
  highlight: boolean;
  /** When true: force row layout on all breakpoints (Admin page requirement) */
  alwaysRow?: boolean;
  /** When true: apply a fixed width to the credits badge for consistent right alignment */
  fixedBadgeWidth?: boolean;
}) {
  const displayName = useMemo(
    () => toSatiricalName(user.name || user.handle || "Unknown"),
    [user.name, user.handle]
  );

  const containerFlex = alwaysRow
    ? "flex-row items-center"
    : "flex-col sm:flex-row sm:items-center"; // dashboard: stack on mobile

  return (
    <li
      className={`flex ${containerFlex} justify-between gap-2 sm:gap-4 p-2 sm:p-3 border-2 ${
        highlight ? "border-[var(--accent)]" : ""
      }`}
      style={{
        borderColor: highlight ? undefined : "var(--foreground)",
        background: "color-mix(in oklab, var(--background) 60%, white)",
        backdropFilter: "saturate(120%)",
      }}
    >
      <div className="flex flex-row items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <RankBadge rank={rank} isTop={highlight} />
        <Avatar
          name={user.name || user.handle || "Unknown"}
          src={user.avatarUrl}
          isTop={highlight}
        />
        <div className="flex flex-col min-w-0 leading-tight">
          <div
            className={`${oswald.className} text-sm sm:text-base font-semibold break-words`}
          >
            {displayName}
          </div>
          <div className="text-[10px] sm:text-xs opacity-80 font-mono break-all">
            @{user.handle || "unknown"}
          </div>
          {user.rank && (
            <div className="text-[10px] sm:text-xs opacity-90 font-mono">
              {user.rank}
            </div>
          )}
        </div>
      </div>
      <div
        className={`font-mono text-sm sm:text-base tabular-nums px-2 py-1 border-2 self-start ${
          alwaysRow ? "" : "sm:self-center"
        } ${highlight ? "border-[var(--accent)] text-[var(--accent)]" : ""} ${
          fixedBadgeWidth ? "w-20 text-center shrink-0" : ""
        }`}
        style={{
          borderColor: highlight ? undefined : "var(--foreground)",
          background: "var(--background)",
        }}
        aria-label="Kollaboration Kredits"
      >
        {user.kollaborationKredits} KK
      </div>
    </li>
  );
}

function toSatiricalName(name: string) {
  const trimmed = name.trim();
  if (/^(Komrade|Comrade)/i.test(trimmed)) return trimmed;
  return `Komrade ${trimmed}`;
}

function RankBadge({ rank, isTop }: { rank: number; isTop: boolean }) {
  return (
    <div
      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border-2 font-mono font-bold shrink-0"
      style={{
        borderColor: isTop ? "var(--accent)" : "var(--foreground)",
        background: isTop ? "var(--accent)" : "var(--background)",
        color: isTop ? "var(--accent-contrast)" : "var(--foreground)",
      }}
      aria-label={`Rank ${rank}`}
    >
      {rank}
    </div>
  );
}

function Avatar({
  name,
  src,
  isTop,
}: {
  name: string;
  src?: string;
  isTop: boolean;
}) {
  const initials = useMemo(
    () =>
      name
        .split(" ")
        .map((n) => n[0]?.toUpperCase())
        .slice(0, 2)
        .join("") || "?",
    [name]
  );

  return (
    <div
      className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 shrink-0"
      style={{ borderColor: isTop ? "var(--accent)" : "var(--foreground)" }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center font-semibold"
          style={{
            background: "var(--background)",
            color: "var(--foreground)",
          }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

export default LeaderboardEntry;
