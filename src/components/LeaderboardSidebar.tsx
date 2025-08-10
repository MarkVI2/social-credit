"use client";

import { useEffect, useMemo, useState } from "react";
import { Oswald } from "next/font/google";

const oswald = Oswald({ subsets: ["latin"], weight: ["500", "600", "700"] });

interface LeaderUser {
  _id: string;
  name?: string;
  handle?: string;
  kollaborationKredits: number;
  avatarUrl?: string;
}

export default function LeaderboardSidebar() {
  const [data, setData] = useState<LeaderUser[] | null>(null);
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
          setData(json.users as LeaderUser[]);
          setError(null);
        } else {
          setError(json.message || "Failed to load leaderboard");
        }
      } catch (e: any) {
        if (mounted) setError(e.message ?? String(e));
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
      className="w-full sm:w-full md:w-72 lg:w-80 xl:w-96 shrink-0 p-3 sm:p-4 lg:p-5 shadow-[6px_6px_0_0_#28282B]"
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
          className={`${oswald.className} text-[#C62828] uppercase tracking-wider font-extrabold text-lg sm:text-xl leading-none`}
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
        <div className="font-mono text-xs py-4 text-[#C62828]">{error}</div>
      )}

      {!loading && !error && (
        <ul className="space-y-2 sm:space-y-3 overflow-x-auto">
          {items.map((u, idx) => (
            <li
              key={u._id}
              className={`flex items-center gap-3 sm:gap-4 p-2 sm:p-3 border-2 ${
                idx === 0 ? "border-[#C62828]" : ""
              }`}
              style={{
                borderColor: idx === 0 ? undefined : "var(--foreground)",
                background: "color-mix(in oklab, var(--background) 60%, white)",
                backdropFilter: "saturate(120%)",
              }}
            >
              <RankBadge rank={idx + 1} isTop={idx === 0} />
              <Avatar
                name={u.name || u.handle || "Unknown"}
                src={u.avatarUrl}
                isTop={idx === 0}
              />
              <div className="min-w-0 flex-1">
                <div
                  className={`${oswald.className} truncate text-sm sm:text-base font-semibold`}
                >
                  {toSatiricalName(u.name || u.handle || "Unknown")}
                </div>
                <div className="text-[10px] sm:text-xs opacity-80 font-mono">
                  @{u.handle || "unknown"}
                </div>
              </div>
              <div
                className={`font-mono text-sm sm:text-base tabular-nums px-2 py-1 border-2 ${
                  idx === 0 ? "border-[#C62828] text-[#C62828]" : ""
                }`}
                style={{
                  borderColor: idx === 0 ? undefined : "var(--foreground)",
                  background: "var(--background)",
                }}
                aria-label="Kollaboration Kredits"
              >
                {u.kollaborationKredits} KK
              </div>
            </li>
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

function toSatiricalName(name: string) {
  const trimmed = name.trim();
  // If already prefixed, keep it. Else add "Komrade".
  if (/^(Komrade|Comrade)/i.test(trimmed)) return trimmed;
  return `Komrade ${trimmed}`;
}

function RankBadge({ rank, isTop }: { rank: number; isTop: boolean }) {
  return (
    <div
      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border-2 font-mono font-bold"
      style={{
        borderColor: isTop ? "#C62828" : "var(--foreground)",
        background: isTop ? "#C62828" : "var(--background)",
        color: isTop ? "#ffffff" : "var(--foreground)",
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
      className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2"
      style={{ borderColor: isTop ? "#C62828" : "var(--foreground)" }}
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
