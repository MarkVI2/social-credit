"use client";

import { Oswald } from "next/font/google";
import LeaderboardEntry, { LeaderboardEntryData } from "./LeaderboardEntry";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { trpc } from "@/trpc/client";
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

  const { data: leaderboardData, isLoading: loading, error } = useLeaderboard();

  const items = (leaderboardData?.users || []) as LeaderboardEntryData[];
  const errorMessage = error?.message || null;

  return (
    <aside
      className="w-full h-full shrink-0 p-3 sm:p-4 lg:p-5 shadow-card-sm flex flex-col lg:max-h-full max-h-[calc(100vh-8rem)]"
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
        <ul
          className="flex-1 min-h-0 flex flex-col gap-2 sm:gap-3 overflow-x-hidden overflow-y-auto pr-1 pb-4"
          style={{
            scrollbarColor: "var(--foreground) transparent",
            scrollbarWidth: "thin",
          }}
        >
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
