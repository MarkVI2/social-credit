"use client";

import { useEffect, useState } from "react";
import { Oswald } from "next/font/google";
import LeaderboardEntry, { LeaderboardEntryData } from "./LeaderboardEntry";

const oswald = Oswald({ subsets: ["latin"], weight: ["500", "600", "700"] });

export default function LeaderboardSidebar({
  forceRowEntries = false,
  fixedBadgeWidth = false,
}: {
  /** Force each entry to render as a single row on all breakpoints */
  forceRowEntries?: boolean;
  /** Fix badge width for perfect column alignment */
  fixedBadgeWidth?: boolean;
}) {
  const [data, setData] = useState<LeaderboardEntryData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const fetchLeaderboard = async (showLoading = false) => {
      try {
        if (showLoading) setLoading(true);
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        if (!res.ok) throw new Error("Network error");
        const json = await res.json();
        if (!mounted) return;
        if (json.success) {
          setData(json.users as LeaderboardEntryData[]);
          setError(null);
        } else {
          setError(json.message || "Failed to load leaderboard");
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (mounted) setError(msg);
      } finally {
        if (mounted && showLoading) setLoading(false);
      }
    };

    // Initial fetch with loading state
    fetchLeaderboard(true);
    // Refresh every 5 minutes without toggling loading to avoid flicker
    const interval = setInterval(() => fetchLeaderboard(false), 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const items = data || [];

  return (
    <aside
      className="w-full shrink-0 p-3 sm:p-4 lg:p-5 shadow-card-sm"
      style={{
        borderColor: "var(--foreground)",
        background: "var(--background)",
        color: "var(--foreground)",
        borderWidth: 4,
        borderStyle: "solid",
      }}
      aria-label="Leaderboard Sidebar"
    >
      <header className="mb-2 sm:mb-3">
        <h2
          className={`${oswald.className} uppercase tracking-wider font-extrabold text-lg sm:text-xl leading-none`}
          style={{ color: "var(--accent)" }}
        >
          TOP PARTY MEMBERS
        </h2>
        <p
          className="mt-1 text-[10px] sm:text-xs font-mono"
          style={{
            color: "color-mix(in oklab, var(--foreground) 80%, transparent)",
          }}
        >
          Redeemable ☭ for coffee, lab help, or moral support
        </p>
      </header>

      {/* Content states */}
      {loading && (
        <div className="font-mono text-xs py-4">Loading leaderboard…</div>
      )}
      {error && !loading && (
        <div
          className="font-mono text-xs py-4"
          style={{ color: "var(--accent)" }}
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <ul className="flex flex-col gap-2 sm:gap-3 overflow-x-hidden">
          {items.map((u, idx) => (
            <LeaderboardEntry
              key={u._id}
              user={u}
              rank={idx + 1}
              highlight={idx === 0}
              alwaysRow={forceRowEntries}
              fixedBadgeWidth={fixedBadgeWidth}
            />
          ))}
        </ul>
      )}

      <footer className="mt-3 sm:mt-4">
        <p className="text-[10px] sm:text-xs opacity-70 leading-snug">
          Note: No actual ideology was harmed in the making of these credits.
        </p>
      </footer>
    </aside>
  );
}

// Helper components moved to separate reusable file.
