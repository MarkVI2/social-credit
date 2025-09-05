"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/trpc/client";

interface Props {
  user: { username: string; email: string } | null;
  onClose: () => void;
}

export default function SettingsModal({ user, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<
    "settings" | "possessions" | "statistics"
  >("settings");
  // Fetch user stats for statistics tab
  const { data: statsData, isLoading: statsLoading } = trpc.user.getMe.useQuery(
    undefined,
    { enabled: !!user }
  );

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    // 1) Cookie overrides
    const cookieMatch = document.cookie
      .split("; ")
      .find((row) => row.startsWith("theme="));
    const cookieTheme = cookieMatch?.split("=")[1] as
      | "light"
      | "dark"
      | undefined;
    if (cookieTheme === "dark" || cookieTheme === "light") return cookieTheme;
    // 2) Local storage fallback
    const ls = (localStorage.getItem("theme") as "light" | "dark") || null;
    if (ls === "dark" || ls === "light") return ls;
    // 3) Default to light; do not auto-switch based on system preference
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    // Ensure we always set one class and remove the other to avoid conflicts
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
    // Persist to cookie for SSR and to localStorage for backward compatibility
    try {
      localStorage.setItem("theme", theme);
    } catch {}
    try {
      const oneYear = 60 * 60 * 24 * 365;
      document.cookie = `theme=${theme}; Path=/; Max-Age=${oneYear}; SameSite=Lax`;
    } catch {}
  }, [theme]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-lg border-4 p-5 sm:p-6 shadow-card-lg"
        style={{
          background: "var(--background)",
          color: "var(--foreground)",
          borderColor: "var(--foreground)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              className="font-heading text-xl font-extrabold uppercase tracking-wider"
              style={{ color: "var(--accent)" }}
            >
              Settings
            </h2>
            <p className="font-mono text-xs opacity-80 mt-1">
              {user?.username} · {user?.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold btn-3d border-4"
            style={{
              background: "var(--background)",
              color: "var(--foreground)",
              borderColor: "var(--foreground)",
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          className="mt-4 flex items-center gap-4 border-b-4 pb-2"
          style={{ borderColor: "var(--foreground)" }}
        >
          <button
            onClick={() => setActiveTab("settings")}
            className="font-heading uppercase tracking-wider text-sm pb-1 border-b-4"
            style={{
              color: "var(--foreground)",
              borderColor:
                activeTab === "settings" ? "var(--accent)" : "transparent",
            }}
            aria-current={activeTab === "settings"}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab("possessions")}
            className="font-heading uppercase tracking-wider text-sm pb-1 border-b-4"
            style={{
              color: "var(--foreground)",
              borderColor:
                activeTab === "possessions" ? "var(--accent)" : "transparent",
            }}
            aria-current={activeTab === "possessions"}
          >
            Possessions
          </button>
          <button
            onClick={() => setActiveTab("statistics")}
            className="font-heading uppercase tracking-wider text-sm pb-1 border-b-4"
            style={{
              color: "var(--foreground)",
              borderColor:
                activeTab === "statistics" ? "var(--accent)" : "transparent",
            }}
            aria-current={activeTab === "statistics"}
          >
            Statistics
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "settings" ? (
          <div className="mt-4 space-y-4">
            <div
              className="border-4 p-4"
              style={{
                borderColor: "var(--foreground)",
                background: "color-mix(in oklab, var(--background) 70%, white)",
              }}
            >
              <h3
                className="font-heading text-sm uppercase tracking-wider font-bold"
                style={{ color: "var(--accent)" }}
              >
                Profile
              </h3>
              <ChangePasswordForm email={user?.email || ""} />
            </div>

            <div
              className="border-4 p-4"
              style={{
                borderColor: "var(--foreground)",
                background: "color-mix(in oklab, var(--background) 70%, white)",
              }}
            >
              <h3
                className="font-heading text-sm uppercase tracking-wider font-bold"
                style={{ color: "var(--accent)" }}
              >
                Theme
              </h3>
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={() => setTheme("light")}
                  aria-pressed={theme === "light"}
                  className={`px-3 py-2 border-4 rounded-none font-bold btn-3d ${
                    theme === "light"
                      ? "bg-[var(--background)] text-[var(--foreground)] border-[var(--border)]"
                      : "bg-white text-[var(--foreground)] border-[var(--border)]"
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  aria-pressed={theme === "dark"}
                  className={`px-3 py-2 border-4 rounded-none font-bold btn-3d ${
                    theme === "dark"
                      ? "bg-[var(--background)] text-[var(--foreground)] border-[var(--border)]"
                      : "bg-[#1d1d1d] text-[var(--foreground)] border-[var(--border)]"
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === "statistics" ? (
          <div className="mt-4 space-y-4">
            {statsLoading ? (
              <p className="font-mono text-sm">Loading statistics…</p>
            ) : statsData?.user ? (
              <ul className="space-y-2 font-mono text-sm">
                <li>Credits Balance: {statsData.user.credits}</li>
                <li>Lifetime Earned: {statsData.user.earnedLifetime}</li>
                <li>Lifetime Spent: {statsData.user.spentLifetime}</li>
                <li>Credits Received: {statsData.user.receivedLifetime}</li>
                <li>Transactions Sent: {statsData.user.transactionsSent}</li>
                <li>
                  Transactions Received: {statsData.user.transactionsReceived}
                </li>
              </ul>
            ) : (
              <p className="font-mono text-sm">No statistics available.</p>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <PossessionsList />
          </div>
        )}
      </div>
    </div>
  );
}

function PossessionsList() {
  const inv = trpc.marketplace.getMyInventory.useQuery(undefined, {
    staleTime: 5_000,
  });
  if (inv.isLoading) {
    return (
      <p className="font-mono text-xs opacity-80">Surveying the armory…</p>
    );
  }
  if (inv.error) {
    return (
      <p className="font-mono text-xs opacity-80">
        Unable to retrieve possessions. The Committee frowns upon this.
      </p>
    );
  }
  const items = inv.data || [];
  if (items.length === 0) {
    return (
      <p className="font-mono text-xs opacity-80">
        No possessions recorded. Visit the People's Marketplace to acquire
        sanctioned goods.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((it: any) => (
        <li
          key={it.id}
          className="p-2 border-4 rounded-none"
          style={{ borderColor: "var(--foreground)" }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div
                className="font-heading uppercase tracking-wider"
                style={{ color: "var(--accent)" }}
              >
                {it.name}
              </div>
              <div className="font-mono text-xs opacity-80">
                {it.description}
              </div>
            </div>
            <div className="font-mono text-xs opacity-80">
              {new Date(it.acquiredAt).toLocaleString()}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ChangePasswordForm({ email }: { email: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    if (next !== confirm) {
      setMsg("New passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: current,
          newPassword: next,
          email,
        }),
      });
      const data = await res.json();
      if (data.success)
        setMsg("Password updated. A confirmation email has been sent.");
      else setMsg(data.message || "Failed to update password");
    } catch {
      setMsg("Network error. Try again later.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-2">
      <label className="block text-xs font-semibold">Current Password</label>
      <input
        type="password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        className="w-full px-3 py-2 border-4 rounded-none focus:outline-none"
        style={{
          background: "var(--background)",
          color: "var(--foreground)",
          borderColor: "var(--border)",
        }}
        placeholder="Enter current password"
        required
      />
      <label className="block text-xs font-semibold">New Password</label>
      <input
        type="password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        className="w-full px-3 py-2 border-4 rounded-none focus:outline-none"
        style={{
          background: "var(--background)",
          color: "var(--foreground)",
          borderColor: "var(--border)",
        }}
        placeholder="Enter new password"
        required
      />
      <label className="block text-xs font-semibold">
        Confirm New Password
      </label>
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="w-full px-3 py-2 border-4 rounded-none focus:outline-none"
        style={{
          background: "var(--background)",
          color: "var(--foreground)",
          borderColor: "var(--border)",
        }}
        placeholder="Confirm new password"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 rounded-none font-bold border-4 hover:opacity-90 disabled:opacity-60 btn-3d"
        style={{
          background: "var(--accent)",
          color: "var(--accent-contrast)",
          borderColor: "var(--border)",
        }}
      >
        {loading ? "Updating…" : "Update Password"}
      </button>
      {msg && <p className="font-mono text-xs mt-1">{msg}</p>}
    </form>
  );
}
