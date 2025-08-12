"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LeaderboardSidebar from "@/components/LeaderboardSidebar";
import { useRouter } from "next/navigation";
import { IconSearch, IconSun, IconMoon } from "@tabler/icons-react";
import Link from "next/link";

type AdminUser = {
  _id: string;
  username: string;
  email: string;
  credits?: number;
  role?: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string>("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  // theme
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(stored);
      } else {
        // default to light explicitly
        document.documentElement.classList.add("light");
      }
    } catch {}
  }, []);
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem("theme", next);
      } catch {}
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(next);
      return next;
    });
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth_token");
      const cookieToken = raw || "";
      setToken(cookieToken);
    } catch {}
  }, []);

  const fetchUsers = useCallback(
    async (p = 1, q = "") => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/users?page=${p}&limit=${limit}&query=${encodeURIComponent(
            q
          )}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            cache: "no-store",
          }
        );
        if (res.status === 401) router.push("/auth/login");
        const data = await res.json();
        if (data.success) {
          setUsers(data.items);
          setTotal(data.total);
          setPage(data.page);
        }
      } finally {
        setLoading(false);
      }
    },
    [limit, router, token]
  );

  useEffect(() => {
    const id = setTimeout(() => {
      void fetchUsers(1, query);
    }, 250);
    return () => clearTimeout(id);
  }, [query, fetchUsers]);

  const header = useMemo(
    () => (
      <div className="w-full order-0 relative z-40">
        <div
          className="p-3 sm:p-4 border-4 rounded-none shadow-card relative z-40"
          style={{
            background: "var(--background)",
            color: "var(--foreground)",
            borderColor: "var(--foreground)",
          }}
        >
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <div
                className=" order-1 font-heading text-l sm:text-2xl font-extrabold uppercase tracking-wider truncate"
                style={{ color: "var(--accent)" }}
              >
                The People&apos;s Ledger
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/admin/activity"
                className="border-4 px-3 py-1 btn-3d"
                style={{
                  background: "var(--background)",
                  borderColor: "var(--foreground)",
                }}
              >
                Activity
              </Link>
              <Link
                href="/admin/bank"
                className="border-4 px-3 py-1 btn-3d"
                style={{
                  background: "var(--background)",
                  borderColor: "var(--foreground)",
                }}
              >
                Bank Access
              </Link>
              <Link
                href="/marketplace"
                className="border-4 px-3 py-1 btn-3d"
                style={{
                  background: "var(--background)",
                  borderColor: "var(--foreground)",
                }}
              >
                Auction/Marketplace
              </Link>
              <Link
                href="/admin/statistics"
                className="border-4 px-3 py-1 btn-3d"
                style={{
                  background: "var(--background)",
                  borderColor: "var(--foreground)",
                }}
              >
                Statistics
              </Link>
              <button
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                className="border-4 px-2 py-1 btn-3d flex items-center gap-1"
                style={{
                  background: "var(--background)",
                  borderColor: "var(--foreground)",
                }}
              >
                {theme === "light" ? (
                  <IconMoon size={16} />
                ) : (
                  <IconSun size={16} />
                )}
                <span className="hidden xl:inline font-mono text-xs">
                  {theme === "light" ? "Dark" : "Light"}
                </span>
              </button>
            </div>
            <div className="flex items-center gap-2 lg:gap-3 relative">
              {/* Mobile theme toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                className="lg:hidden w-9 h-9 border-4 flex items-center justify-center btn-3d"
                style={{
                  background: "var(--background)",
                  borderColor: "var(--foreground)",
                }}
              >
                {theme === "light" ? (
                  <IconMoon size={18} />
                ) : (
                  <IconSun size={18} />
                )}
              </button>
              <AdminAvatar
                token={token}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            </div>
          </div>
        </div>
      </div>
    ),
    [token, theme, toggleTheme]
  );

  return (
    <div
      className="min-h-screen relative"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-4 lg:px-6 py-3">
        {header}
        {/* Main responsive flex layout: row on desktop, column on small screens */}
        <div className="flex flex-col lg:flex-row items-start gap-4 mt-4 relative z-10">
          {/* Left column (leaderboard + recent transactions) */}
          <div className="flex flex-col gap-4 w-full lg:w-80 xl:w-96 flex-shrink-0 order-1 lg:order-none">
            <LeaderboardSidebar forceRowEntries fixedBadgeWidth />
            <AdminRecentTransactions token={token} />
          </div>

          {/* Right column (search + users table) */}
          <div className="w-full flex flex-col gap-4 min-w-0 flex-1 order-0 lg:order-none">
            <div
              className="p-3 sm:p-4 border-4 rounded-none shadow-card flex flex-col gap-4"
              style={{
                background: "var(--background)",
                borderColor: "var(--foreground)",
              }}
            >
              {/* Search bar */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fetchUsers(1, query);
                  }}
                  placeholder="Search by username or email"
                  className="flex-1 min-w-0 px-3 py-2 border-4 rounded-none"
                  style={{
                    background: "var(--background)",
                    borderColor: "var(--foreground)",
                  }}
                />
                <button
                  onClick={() => fetchUsers(1, query)}
                  className="border-4 btn-3d w-10 h-10 flex items-center justify-center shrink-0"
                  style={{
                    background: "var(--accent)",
                    borderColor: "var(--foreground)",
                    color: "white",
                  }}
                  aria-label="Search"
                >
                  <IconSearch size={20} />
                </button>
              </div>
              {/* Table */}
              <div
                className="p-0 border-4 rounded-none shadow-[6px_6px_0_0_#28282B] overflow-x-auto"
                style={{
                  background: "var(--background)",
                  borderColor: "var(--foreground)",
                }}
              >
                <table className="w-full font-mono text-sm">
                  <thead>
                    <tr className="bg-black/5">
                      <th className="text-left p-2 border-b-4">Username</th>
                      <th className="text-left p-2 border-b-4 hidden md:table-cell">
                        Email
                      </th>
                      <th className="text-right p-2 border-b-4">Credits</th>
                      <th className="text-center p-2 border-b-4">Role</th>
                      <th className="text-right p-2 border-b-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="odd:bg-white/30">
                        <td className="p-2 align-top">
                          <div className="font-mono text-sm">{u.username}</div>
                          <div
                            className="md:hidden text-xs opacity-80 truncate max-w-[12rem]"
                            title={u.email}
                          >
                            {u.email}
                          </div>
                        </td>
                        <td className="p-2 hidden md:table-cell">
                          <div
                            className="truncate max-w-[20rem]"
                            title={u.email}
                          >
                            {u.email}
                          </div>
                        </td>
                        <td className="p-2 text-right">
                          {Math.trunc(u.credits || 0)}
                        </td>
                        <td className="p-2 text-center">{u.role || "user"}</td>
                        <td className="p-2 text-right">
                          <InlineGrant
                            userId={u._id}
                            username={u.username}
                            token={token}
                            onDone={() => fetchUsers(page, query)}
                          />
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center">
                          {loading ? "Loading…" : "No users"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between">
                <button
                  disabled={page <= 1}
                  onClick={() => fetchUsers(page - 1, query)}
                  className="border-4 px-3 py-1 btn-3d disabled:opacity-60"
                  style={{
                    background: "var(--background)",
                    borderColor: "var(--foreground)",
                  }}
                >
                  Prev
                </button>
                <div className="font-mono">
                  Page {page} / {totalPages}
                </div>
                <button
                  disabled={page >= totalPages}
                  onClick={() => fetchUsers(page + 1, query)}
                  className="border-4 px-3 py-1 btn-3d disabled:opacity-60"
                  style={{
                    background: "var(--background)",
                    borderColor: "var(--foreground)",
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InlineGrant({
  userId,
  username,
  token,
  onDone,
}: {
  userId: string;
  username: string;
  token: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [source, setSource] = useState<"admin" | "classBank">("admin");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/update-credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          targetUserId: userId,
          amount,
          sourceAccount: source,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOpen(false);
        setAmount(0);
        setReason("");
        onDone();
      } else {
        alert(data.message || "Failed");
      }
    } catch (e) {
      console.error(e);
      alert("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-2">
      {!open ? (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setOpen(true);
              setAmount(2);
            }}
            className="border-4 px-2 py-1 btn-3d"
            style={{
              background: "var(--accent)",
              borderColor: "var(--foreground)",
              color: "white",
            }}
          >
            Give
          </button>
          <button
            onClick={() => {
              setOpen(true);
              setAmount(-2);
            }}
            className="border-4 px-2 py-1 btn-3d"
            style={{
              background: "var(--background)",
              borderColor: "var(--foreground)",
            }}
          >
            Deduct
          </button>
        </div>
      ) : (
        <div
          className="p-2 border-4 rounded-none"
          style={{
            background: "var(--background)",
            borderColor: "var(--foreground)",
          }}
        >
          <div className="font-mono text-xs mb-1">Action for {username}</div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-24 text-right px-2 py-1 border-4 rounded-none"
              style={{
                background: "var(--background)",
                borderColor: "var(--foreground)",
              }}
            />
            <select
              value={source}
              onChange={(e) =>
                setSource(e.target.value as "admin" | "classBank")
              }
              className="px-2 py-1 border-4 rounded-none"
              style={{
                background: "var(--background)",
                borderColor: "var(--foreground)",
              }}
            >
              <option value="admin">Admin’s Own Account</option>
              <option value="classBank">Class Bank</option>
            </select>
          </div>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason"
            className="w-64 max-w-full px-2 py-1 border-4 rounded-none mb-2"
            style={{
              background: "var(--background)",
              borderColor: "var(--foreground)",
            }}
          />
          <div className="flex gap-2 justify-end">
            <button
              disabled={submitting}
              onClick={() => setOpen(false)}
              className="border-4 px-2 py-1 btn-3d disabled:opacity-60"
              style={{
                background: "var(--background)",
                borderColor: "var(--foreground)",
              }}
            >
              Cancel
            </button>
            <button
              disabled={submitting || !amount || !reason}
              onClick={submit}
              className="border-4 px-3 py-1 btn-3d disabled:opacity-60"
              style={{
                background: "var(--accent)",
                borderColor: "var(--foreground)",
                color: "white",
              }}
            >
              {submitting ? "Saving…" : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminAvatar({
  token,
  theme,
  onToggleTheme,
}: {
  token: string;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState("A");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store",
        });
        const data = await res.json();
        if (data?.authenticated && data.user?.username) {
          setInitial(String(data.user.username).charAt(0).toUpperCase());
        }
      } catch {}
    };
    load();
  }, [token]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    try {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("auth_token");
    } catch {}
    window.location.href = "/auth/login";
  };

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (
        menuRef.current &&
        !menuRef.current.contains(t) &&
        btnRef.current &&
        !btnRef.current.contains(t)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative z-50">
      <button
        ref={btnRef}
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="admin-profile-menu"
        className="w-9 h-9 rounded-full border-4 flex items-center justify-center font-bold"
        style={{
          background: "var(--background)",
          borderColor: "var(--foreground)",
        }}
      >
        {initial}
      </button>
      {open && (
        <div
          ref={menuRef}
          id="admin-profile-menu"
          role="menu"
          className="absolute right-0 mt-2 border-4 bg-[var(--background)] shadow-[6px_6px_0_0_#28282B] overflow-hidden z-[100]"
          style={{ borderColor: "var(--foreground)" }}
        >
          <div className="min-w-56">
            {/* Mobile-only nav links */}
            <Link
              href="/admin/activity"
              className="lg:hidden block w-full text-left px-3 py-2 border-b-2 hover:opacity-90"
              style={{ borderColor: "var(--foreground)" }}
              role="menuitem"
            >
              Activity
            </Link>
            <Link
              href="/admin/bank"
              className="lg:hidden block w-full text-left px-3 py-2 border-b-2 hover:opacity-90"
              style={{ borderColor: "var(--foreground)" }}
              role="menuitem"
            >
              Bank Access
            </Link>
            <Link
              href="/marketplace"
              className="lg:hidden block w-full text-left px-3 py-2 border-b-2 hover:opacity-90"
              style={{ borderColor: "var(--foreground)" }}
              role="menuitem"
            >
              Auction/Marketplace
            </Link>
            <Link
              href="/admin/statistics"
              className="lg:hidden block w-full text-left px-3 py-2 border-b-2 hover:opacity-90"
              style={{ borderColor: "var(--foreground)" }}
              role="menuitem"
            >
              Statistics
            </Link>
            {/* Desktop Activity link (kept inside menu; could also live in top bar if desired) */}
            <Link
              href="/admin/activity"
              className="hidden lg:block w-full text-left px-3 py-2 border-b-2 hover:opacity-90"
              style={{ borderColor: "var(--foreground)" }}
              role="menuitem"
            >
              Activity
            </Link>
            {/* Theme toggle inside menu (all breakpoints) */}
            <button
              onClick={onToggleTheme}
              className="w-full text-left px-3 py-2 border-b-2 hover:opacity-90 flex items-center gap-2"
              style={{ borderColor: "var(--foreground)" }}
              role="menuitem"
            >
              {theme === "light" ? (
                <IconMoon size={16} />
              ) : (
                <IconSun size={16} />
              )}
              <span>Switch to {theme === "light" ? "Dark" : "Light"} Mode</span>
            </button>
            <button
              onClick={logout}
              className="w-full text-left px-3 py-2 hover:opacity-90"
              role="menuitem"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminRecentTransactions({ token }: { token: string }) {
  interface ActivityItemData {
    from?: string;
    to?: string;
    amount?: number;
    reason?: string;
    admin?: string;
    user?: string;
    [k: string]: unknown;
  }
  interface ActivityItem {
    _id?: string;
    createdAt: string | Date;
    type: string;
    action: string;
    message?: string;
    data?: ActivityItemData | null;
  }
  const [items, setItems] = useState<ActivityItem[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/activity?cursor=0&limit=15`, {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (data.success) setItems(data.items || []);
      else
        console.error("[AdminRecentActivity] API error:", data.message || data);
    } catch (e) {
      console.error("[AdminRecentActivity] Failed to fetch", e);
    }
  }, [token]);

  useEffect(() => {
    load();
    // Refresh every 10 minutes instead of aggressive polling to reduce DB/API load
    const TEN_MIN = 10 * 60 * 1000;
    const id = setInterval(load, TEN_MIN);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div
      className="p-3 sm:p-4 border-4 rounded-none shadow-card-sm"
      style={{
        background: "var(--background)",
        borderColor: "var(--foreground)",
        color: "var(--foreground)",
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3
          className="font-heading text-sm sm:text-base font-extrabold uppercase tracking-wider"
          style={{ color: "var(--accent)" }}
        >
          Recent Activity
        </h3>
        <button
          onClick={load}
          className="border-4 px-2 py-0.5 font-mono text-[10px] sm:text-xs btn-3d rounded-none"
          style={{
            background: "var(--background)",
            borderColor: "var(--foreground)",
            color: "var(--foreground)",
          }}
          aria-label="Refresh activity"
        >
          Refresh
        </button>
      </div>
      <p className="font-mono text-[10px] sm:text-[11px] opacity-60 mb-2 leading-snug">
        Auto-refresh every 10 minutes to conserve resources.
      </p>
      {items.length === 0 ? (
        <div className="font-mono text-xs opacity-80">No activity yet.</div>
      ) : (
        <div className="max-h-72 overflow-y-auto pr-1">
          <ul
            className="divide-y-2"
            style={{ borderColor: "var(--foreground)" }}
          >
            {items.map((a, i) => (
              <li key={i} className="py-2">
                <div className="text-[11px] sm:text-xs font-mono opacity-80">
                  {new Date(a.createdAt).toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm font-mono mt-1 leading-relaxed break-words">
                  {a.message ? (
                    <>{a.message}</>
                  ) : a.action === "credit_transfer" && a.data ? (
                    <>
                      <span className="font-semibold">{a.data.from}</span> →{" "}
                      <span className="font-semibold">{a.data.to}</span> :{" "}
                      {a.data.amount}cr
                      {a.data.reason ? ` (${a.data.reason})` : ""}
                    </>
                  ) : (
                    <span>
                      {a.type}/{a.action}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
