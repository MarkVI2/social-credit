"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LeaderboardSidebar from "@/components/LeaderboardSidebar";
import { IconSearch, IconSun, IconMoon } from "@tabler/icons-react";
import Link from "next/link";
import { useAdmin } from "@/hooks/useAdmin";
import TransactionEntry from "@/components/TransactionEntry";

export default function AdminPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Use tRPC hook for users data
  const { data: usersData, isLoading: loading } = useAdmin().getUsers(
    query,
    page,
    limit
  );
  const users = usersData?.items || [];
  const total = usersData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Context menu state for destructive admin actions
  const [ctxMenu, setCtxMenu] = useState<{
    open: boolean;
    x: number;
    y: number;
    user?: {
      _id?: { toString: () => string } | string;
      username?: string;
      email?: string;
      isFrozen?: boolean;
      timeoutUntil?: string | Date | null;
    };
  }>({ open: false, x: 0, y: 0 });

  // theme
  const [theme, setTheme] = useState<"light" | "dark">("light");
  // Keep minimal token state for components that still need it
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth_token");
      const cookieToken = raw || "";
      setToken(cookieToken);
    } catch {}
  }, []);
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
    [theme, toggleTheme, token]
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
            <AdminRecentTransactions />
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
                    if (e.key === "Enter") {
                      setPage(1); // Reset to first page on new search
                    }
                  }}
                  placeholder="Search by username or email"
                  className="flex-1 min-w-0 px-3 py-2 border-4 rounded-none"
                  style={{
                    background: "var(--background)",
                    borderColor: "var(--foreground)",
                  }}
                />
                <button
                  onClick={() => setPage(1)}
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
                      <tr
                        key={u._id?.toString() || Math.random().toString()}
                        className="odd:bg-white/30"
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setCtxMenu({
                            open: true,
                            x: e.clientX,
                            y: e.clientY,
                            user: u as any,
                          });
                        }}
                      >
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
                            userId={u._id?.toString() || ""}
                            username={u.username}
                            onDone={() => {
                              // tRPC will automatically refetch when data changes
                            }}
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
                  onClick={() => setPage(page - 1)}
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
                  onClick={() => setPage(page + 1)}
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
      {ctxMenu.open && ctxMenu.user && (
        <UserContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          user={ctxMenu.user}
          onClose={() => setCtxMenu((s) => ({ ...s, open: false }))}
        />
      )}
    </div>
  );
}

function InlineGrant({
  userId,
  username,
  onDone,
}: {
  userId: string;
  username: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [source, setSource] = useState<"admin" | "classBank">("admin");

  // Use tRPC hook for updating credits
  const { updateCredits, isUpdatingCredits } = useAdmin();

  async function submit() {
    try {
      await updateCredits.mutateAsync({
        targetUserId: userId,
        amount,
        sourceAccount: source,
        reason,
      });
      setOpen(false);
      setAmount(0);
      setReason("");
      onDone();
    } catch (e) {
      console.error(e);
      alert(e || "Failed to update credits");
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
              disabled={isUpdatingCredits}
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
              disabled={isUpdatingCredits || !amount || !reason}
              onClick={submit}
              className="border-4 px-3 py-1 btn-3d disabled:opacity-60"
              style={{
                background: "var(--accent)",
                borderColor: "var(--foreground)",
                color: "white",
              }}
            >
              {isUpdatingCredits ? "Saving…" : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UserContextMenu({
  x,
  y,
  user,
  onClose,
}: {
  x: number;
  y: number;
  user: {
    _id?: { toString: () => string } | string;
    username?: string;
    email?: string;
    isFrozen?: boolean;
    timeoutUntil?: string | Date | null;
  };
  onClose: () => void;
}) {
  const { freezeUser, timeoutUser, deleteUser } = useAdmin();

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      // Close if clicking outside the menu
      const el = document.getElementById("admin-user-context-menu");
      if (el && !el.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    setTimeout(() => {
      document.addEventListener("mousedown", onDown);
      document.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const id =
    typeof user._id === "string" ? user._id : user._id?.toString() || "";
  const label = user.username || user.email || id;

  const doFreeze = async (frozen: boolean) => {
    try {
      await freezeUser.mutateAsync({ userId: id, frozen });
    } catch (e) {
      console.error(e);
      alert("Failed to update freeze state");
    } finally {
      onClose();
    }
  };

  const doTimeoutMs = async (ms: number) => {
    try {
      const until = new Date(Date.now() + ms);
      await timeoutUser.mutateAsync({ userId: id, until });
    } catch (e) {
      console.error(e);
      alert("Failed to set timeout");
    } finally {
      onClose();
    }
  };

  const clearTimeoutNow = async () => {
    try {
      // Set a past date to effectively clear timeout
      await timeoutUser.mutateAsync({ userId: id, until: new Date(0) });
    } catch (e) {
      console.error(e);
      alert("Failed to clear timeout");
    } finally {
      onClose();
    }
  };

  const doDelete = async () => {
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return;
    try {
      await deleteUser.mutateAsync({ userId: id });
    } catch (e) {
      console.error(e);
      alert("Failed to delete user");
    } finally {
      onClose();
    }
  };

  const menuStyle: React.CSSProperties = {
    position: "fixed",
    top: y + 2,
    left: x + 2,
    zIndex: 1000,
    background: "var(--background)",
    border: "4px solid var(--foreground)",
    boxShadow: "6px 6px 0 0 #28282B",
    minWidth: 220,
  };

  return (
    <div id="admin-user-context-menu" style={menuStyle} role="menu">
      <div
        className="px-3 py-2 border-b-2 font-mono text-xs opacity-80"
        style={{ borderColor: "var(--foreground)" }}
      >
        Actions for {label}
      </div>
      <button
        onClick={() => doFreeze(!(user.isFrozen ?? false))}
        className="block w-full text-left px-3 py-2 border-b-2 hover:opacity-90"
        style={{ borderColor: "var(--foreground)" }}
        role="menuitem"
      >
        {user.isFrozen ? "Unfreeze account" : "Freeze account"}
      </button>
      <div
        className="px-3 py-1 border-b-2"
        style={{ borderColor: "var(--foreground)" }}
      >
        <div className="font-mono text-xs opacity-80 mb-1">Timeout</div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => doTimeoutMs(15 * 60 * 1000)}
            className="border-2 px-2 py-0.5 btn-3d"
            style={{
              background: "var(--background)",
              borderColor: "var(--foreground)",
            }}
          >
            15m
          </button>
          <button
            onClick={() => doTimeoutMs(60 * 60 * 1000)}
            className="border-2 px-2 py-0.5 btn-3d"
            style={{
              background: "var(--background)",
              borderColor: "var(--foreground)",
            }}
          >
            1h
          </button>
          <button
            onClick={() => doTimeoutMs(24 * 60 * 60 * 1000)}
            className="border-2 px-2 py-0.5 btn-3d"
            style={{
              background: "var(--background)",
              borderColor: "var(--foreground)",
            }}
          >
            24h
          </button>
          <button
            onClick={async () => {
              const input = prompt("Timeout hours (e.g., 2.5):", "1");
              if (!input) return;
              const hours = Number(input);
              if (!isFinite(hours) || hours <= 0)
                return alert("Invalid number");
              await doTimeoutMs(hours * 60 * 60 * 1000);
            }}
            className="border-2 px-2 py-0.5 btn-3d"
            style={{
              background: "var(--background)",
              borderColor: "var(--foreground)",
            }}
          >
            Custom
          </button>
          <button
            onClick={clearTimeoutNow}
            className="border-2 px-2 py-0.5 btn-3d"
            style={{
              background: "var(--background)",
              borderColor: "var(--foreground)",
            }}
          >
            Clear
          </button>
        </div>
      </div>
      <button
        onClick={doDelete}
        className="block w-full text-left px-3 py-2 hover:opacity-90"
        style={{ color: "#b00020" }}
        role="menuitem"
      >
        Delete account
      </button>
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

function AdminRecentTransactions() {
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

  // Use tRPC hook instead of manual fetch
  const {
    data: activityData,
    isLoading,
    refetch,
  } = useAdmin().getActivity(0, 15);
  const items = (activityData?.items || ([] as unknown)) as ActivityItem[];

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
          onClick={() => refetch()}
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
        Real-time activity updates via tRPC.
      </p>
      {isLoading ? (
        <div className="font-mono text-xs opacity-80">Loading activity...</div>
      ) : items.length === 0 ? (
        <div className="font-mono text-xs opacity-80">No activity yet.</div>
      ) : (
        <div className="max-h-72 overflow-y-auto pr-1">
          <ul
            className="divide-y-2"
            style={{ borderColor: "var(--foreground)" }}
          >
            {items.map((a, i) => (
              <TransactionEntry key={i} transaction={a as any} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
