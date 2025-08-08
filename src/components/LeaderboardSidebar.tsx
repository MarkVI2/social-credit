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
    setLoading(true);
    fetch("/api/leaderboard")
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then((json) => {
        if (!mounted) return;
        if (json.success) {
          setData(json.users as LeaderUser[]);
          setError(null);
        } else {
          setError(json.message || "Failed to load leaderboard");
        }
      })
      .catch((e) => mounted && setError(e.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const items = data || [];

  return (
    <aside
      className="w-full sm:w-80 shrink-0 border-4 border-[#28282B] bg-[#F5F5DC] text-[#28282B] p-3 sm:p-4 lg:p-5 shadow-[6px_6px_0_0_#28282B]"
      aria-label="Leaderboard Sidebar"
    >
      <header className="mb-2 sm:mb-3">
        <h2
          className={`${oswald.className} text-[#C62828] uppercase tracking-wider font-extrabold text-lg sm:text-xl leading-none`}
        >
          TOP PARTY MEMBERS
        </h2>
        <p className="mt-1 text-[10px] sm:text-xs text-[#28282B]/80 font-mono">
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
                idx === 0 ? "border-[#C62828]" : "border-[#28282B]"
              } bg-white/60 dark:bg-white/10`}
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
                  idx === 0
                    ? "border-[#C62828] text-[#C62828]"
                    : "border-[#28282B]"
                } bg-[#F5F5DC]`}
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
      className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border-2 ${
        isTop
          ? "border-[#C62828] bg-[#C62828] text-white"
          : "border-[#28282B] bg-[#F5F5DC]"
      } font-mono font-bold`}
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
      className={`relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 ${
        isTop ? "border-[#C62828]" : "border-[#28282B]"
      }`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#F5F5DC] text-[#28282B] font-semibold">
          {initials}
        </div>
      )}
    </div>
  );
}
