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
  courseCredits?: number;
}

export function LeaderboardEntry({
  user,
  rank,
  highlight,
  alwaysRow = false,
  fixedBadgeWidth = false,
  showCourseCredits = false,
}: {
  user: LeaderboardEntryData;
  rank: number;
  highlight: boolean;
  /** When true: force row layout on all breakpoints (Admin page requirement) */
  alwaysRow?: boolean;
  /** When true: apply a fixed width to the credits badge for consistent right alignment */
  fixedBadgeWidth?: boolean;
  showCourseCredits?: boolean;
}) {
  const displayName = useMemo(() => {
    const base = (user.name || user.handle || "Unknown").trim();
    const rankPrefix = (user.rank || "").trim();
    return rankPrefix ? `${rankPrefix} ${base}` : base;
  }, [user.name, user.handle, user.rank]);

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
          {typeof user.txCount === "number" && (
            <div className="text-[10px] sm:text-xs opacity-70 font-mono">
              {user.txCount} transactions
            </div>
          )}
          {typeof user.netGain === "number" && (
            <div className="text-[10px] sm:text-xs opacity-70 font-mono">
              Net: {user.netGain >= 0 ? "+" : ""}
              {user.netGain} KK
            </div>
          )}
          {/*   {user.rank && (
            <div className="text-[10px] sm:text-xs opacity-90 font-mono">
              {user.rank}
            </div>
          )} */}
        </div>
      </div>
      <div
        className={`font-mono text-xs sm:text-sm tabular-nums px-2 py-0.5 border-2 self-center ${
          highlight ? "border-[var(--accent)] text-[var(--accent)]" : ""
        } ${fixedBadgeWidth ? "w-20 text-center shrink-0" : ""}`}
        style={{
          borderColor: highlight ? undefined : "var(--foreground)",
          background: "var(--background)",
        }}
        aria-label="Kollaboration Kredits"
      >
        {showCourseCredits
          ? (user.courseCredits ?? 3.5).toFixed(2)
          : Math.trunc(user.kollaborationKredits)}{" "}
        {showCourseCredits ? "Score" : "KK"}
      </div>
    </li>
  );
}

// No-op; rank prefixing handled inline above

function RankBadge({ rank, isTop }: { rank: number; isTop: boolean }) {
  return (
    <div
      className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center border-2 font-mono font-bold shrink-0 text-xs sm:text-sm"
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
