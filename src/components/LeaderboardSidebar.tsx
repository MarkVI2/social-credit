"use client";

import { Oswald } from "next/font/google";
import LeaderboardEntry, { LeaderboardEntryData } from "./LeaderboardEntry";
import { trpc } from "@/trpc/client";
import { useState } from "react";
import { useMe } from "@/hooks/useMe";

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
  // Fetch current user first to keep hook order stable
  const me = useMe();
  const myId =
    (me.data?.user as any)?._id?.toString?.() ?? (me.data?.user as any)?._id;
  const myUsername = (me.data?.user as any)?.username as string | undefined;

  const [filter, setFilter] = useState<
    "kredits" | "active" | "topGainers" | "topLosers"
  >("kredits");

  const trpcUtils = trpc.useContext();

  const {
    data: leaderboardData,
    isLoading: loading,
    error,
  } = trpc.leaderboard.getLeaderboard.useQuery(
    { filter },
    { staleTime: 10_000 }
  );

  // Subscribe to leaderboard updates for the current filter and invalidate automatically
  trpc.leaderboard.onUpdate.useSubscription(
    { filter },
    {
      onData: (data) => {
        try {
          trpcUtils.leaderboard.getLeaderboard.invalidate({ filter } as any);
        } catch {}
      },
    }
  );

  const items = (leaderboardData?.users || []) as LeaderboardEntryData[];
  const errorMessage = error?.message || null;

  return (
    <aside
      className="w-full shrink-0 p-3 sm:p-4 lg:p-5 shadow-card-sm flex flex-col h-[350px] sm:h-[450px] lg:h-full"
      style={{
        borderColor: "var(--foreground)",
        background: "var(--background)",
        color: "var(--foreground)",
        borderWidth: 4,
        borderStyle: "solid",
      }}
      aria-label="Leaderboard Sidebar"
    >
      <header className="mb-2 sm:mb-3 shrink-0">
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

      {/* Filter pills */}
      <div className="mb-3 flex gap-2 flex-wrap">
        {(
          [
            { key: "kredits", label: "By Kredits" },
            { key: "active", label: "Most Active" },
            { key: "topGainers", label: "Top Gainers" },
            { key: "topLosers", label: "Top Losers" },
          ] as { key: string; label: string }[]
        ).map((p) => (
          <button
            key={p.key}
            onClick={() => setFilter(p.key as any)}
            className={`px-2 py-1 border-2 rounded-none font-mono text-xs ${
              filter === p.key
                ? "bg-[var(--accent)] text-[var(--background)] border-[var(--accent)]"
                : "bg-transparent text-[var(--foreground)] border-[var(--foreground)]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Content states */}
      {loading && (
        <div className="font-mono text-xs py-4">Loading leaderboard…</div>
      )}
      {errorMessage && !loading && (
        <div
          className="font-mono text-xs py-4"
          style={{ color: "var(--accent)" }}
        >
          {errorMessage}
        </div>
      )}

      {!loading && !errorMessage && (
        <ul className="flex flex-col gap-2 sm:gap-3 overflow-x-hidden overflow-y-auto flex-1 min-h-0">
          {items.map((u, idx) => {
            const isMe =
              (myId && u._id === myId) ||
              (myUsername && u.handle === myUsername);
            return (
              <LeaderboardEntry
                key={u._id}
                user={u}
                rank={idx + 1}
                highlight={!!isMe}
                alwaysRow={forceRowEntries}
                fixedBadgeWidth={fixedBadgeWidth}
              />
            );
          })}
        </ul>
      )}
      <footer className="mt-3 sm:mt-4 shrink-0">
        <p className="text-[10px] sm:text-xs opacity-70 leading-snug">
          Note: No actual ideology was harmed in the making of these credits.
        </p>
      </footer>
    </aside>
  );
}

// Helper components moved to separate reusable file.
