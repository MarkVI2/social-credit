"use client";

import { useEffect, useState } from "react";

interface Props {
  user: { username: string; email: string } | null;
  onClose: () => void;
}

export default function SettingsModal({ user, onClose }: Props) {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    // Prefer cookie to keep SSR and CSR in sync
    const cookieMatch = document.cookie
      .split("; ")
      .find((row) => row.startsWith("theme="));
    const cookieTheme = cookieMatch?.split("=")[1] as
      | "light"
      | "dark"
      | undefined;
    if (cookieTheme === "dark" || cookieTheme === "light") return cookieTheme;
    const ls = (localStorage.getItem("theme") as "light" | "dark") || null;
    if (ls) return ls;
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
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
        className="relative z-10 w-full max-w-lg border-4 p-5 sm:p-6 shadow-[10px_10px_0_0_#28282B]"
        style={{
          background: "var(--background)",
          color: "var(--foreground)",
          borderColor: "var(--foreground)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-extrabold uppercase text-[#C62828] tracking-wider">
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

        <div className="mt-6 space-y-4">
          <div
            className="border-4 p-4"
            style={{
              borderColor: "var(--foreground)",
              background: "color-mix(in oklab, var(--background) 70%, white)",
            }}
          >
            <h3 className="font-heading text-sm uppercase tracking-wider text-[#C62828] font-bold">
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
            <h3 className="font-heading text-sm uppercase tracking-wider text-[#C62828] font-bold">
              Theme
            </h3>
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={() => setTheme("light")}
                aria-pressed={theme === "light"}
                className={`px-3 py-2 border-4 rounded-none font-bold btn-3d ${
                  theme === "light"
                    ? "bg-[#F5F5DC] text-[#28282B] border-[#28282B]"
                    : "bg-white text-[#28282B] border-[#28282B]"
                }`}
              >
                Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                aria-pressed={theme === "dark"}
                className={`px-3 py-2 border-4 rounded-none font-bold btn-3d ${
                  theme === "dark"
                    ? "bg-[#121212] text-[#ededed] border-[#ededed]"
                    : "bg-[#1d1d1d] text-[#ededed] border-[#ededed]"
                }`}
              >
                Dark
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
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
        className="w-full px-3 py-2 bg-[#F5F5DC] border-4 border-[#28282B] rounded-none text-[#28282B] placeholder-[#28282B]/60 focus:outline-none"
        placeholder="Enter current password"
        required
      />
      <label className="block text-xs font-semibold">New Password</label>
      <input
        type="password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        className="w-full px-3 py-2 bg-[#F5F5DC] border-4 border-[#28282B] rounded-none text-[#28282B] placeholder-[#28282B]/60 focus:outline-none"
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
        className="w-full px-3 py-2 bg-[#F5F5DC] border-4 border-[#28282B] rounded-none text-[#28282B] placeholder-[#28282B]/60 focus:outline-none"
        placeholder="Confirm new password"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#C62828] text-white py-2 px-4 rounded-none font-bold border-4 border-[#28282B] hover:opacity-90 disabled:opacity-60 btn-3d"
      >
        {loading ? "Updating…" : "Update Password"}
      </button>
      {msg && <p className="font-mono text-xs mt-1">{msg}</p>}
    </form>
  );
}
