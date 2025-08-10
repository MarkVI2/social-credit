"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import LeaderboardSidebar from "@/components/LeaderboardSidebar";
import SettingsModal from "@/components/SettingsModal";
import { IconLogout } from "@tabler/icons-react";

interface User {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
  credits?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);

  const userInitial = useMemo(
    () => (user?.username ? user.username.charAt(0).toUpperCase() : "?"),
    [user?.username]
  );

  // Random greeting messages
  const greetings = useMemo(
    () => [
      "Welcome back, {name}",
      "Good to see you, {name}",
      "Salutations, {name}",
      "Glorious return, {name}",
      "Operational again, {name}",
      "At your command, {name}",
      "All systems ready, {name}",
      "Comrade {name}, reporting",
      "Proceed, {name}",
      "Control granted, {name}",
    ],
    []
  );

  const greeting = useMemo(() => {
    const name = user?.username || "User";
    const msg = greetings[Math.floor(Math.random() * greetings.length)];
    return msg.replace("{name}", name);
  }, [greetings, user?.username]);

  // Validation state
  const matchedUser = useMemo(
    () =>
      users.find(
        (u) => u.username === selectedUser || u.email === selectedUser
      ) || null,
    [users, selectedUser]
  );
  const isValidUser = !!matchedUser;
  const isValidReason = reason.trim().length > 0;
  const canSubmit = isValidUser && isValidReason;

  // Refresh current user from DB and sync credits
  const refreshCurrentUser = useCallback(async () => {
    try {
      if (!user) return;
      // Query users API and find the current user
      const res = await fetch("/api/users", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        const fresh = (data.users as User[]).find(
          (u) => u.username === user.username || u.email === user.email
        );
        if (fresh && typeof fresh.credits === "number") {
          setBalance(Math.trunc(fresh.credits));
          const currentCredits = user?.credits;
          if (currentCredits !== fresh.credits) {
            const stored: User & { credits: number } = {
              ...user,
              credits: fresh.credits,
            } as User & { credits: number };
            try {
              localStorage.setItem("currentUser", JSON.stringify(stored));
            } catch {}
            setUser(stored);
          }
        }
      }
    } catch (e) {
      console.error("Failed to refresh user", e);
    }
  }, [user]);

  useEffect(() => {
    // Try to load current user from localStorage (temporary client-side session)
    try {
      const stored =
        typeof window !== "undefined" && localStorage.getItem("currentUser");
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        if (typeof u.credits === "number") setBalance(Math.trunc(u.credits));
        return;
      }
    } catch {}
    // No fallback mock; redirect to login if no user found
    router.push("/auth/login");
  }, [router]);

  useEffect(() => {
    fetch("/api/users", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsers(data.users);
          // If current user exists, sync balance from API
          if (user) {
            const fresh = (data.users as User[]).find(
              (u) => u.username === user.username || u.email === user.email
            );
            if (fresh && typeof fresh.credits === "number") {
              setBalance(Math.trunc(fresh.credits));
              const currentCredits = user?.credits;
              if (currentCredits !== fresh.credits) {
                const stored: User & { credits: number } = {
                  ...user,
                  credits: fresh.credits,
                } as User & { credits: number };
                try {
                  localStorage.setItem("currentUser", JSON.stringify(stored));
                } catch {}
                setUser(stored);
              }
            }
          }
        }
      })
      .catch((err) => console.error("Error fetching users:", err));
  }, [user?.username, user?.email]);

  // Once user is set, do an initial refresh to ensure balance is up-to-date
  useEffect(() => {
    if (user) {
      refreshCurrentUser();
    }
  }, [user, refreshCurrentUser]);

  // Periodically refresh balance every 1 minute
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      refreshCurrentUser();
    }, 60 * 1000);
    return () => clearInterval(id);
  }, [user, refreshCurrentUser]);

  const handleSend = async () => {
    const target = users.find(
      (u) => u.username === selectedUser || u.email === selectedUser
    );
    if (!user || !target) return;
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: user.username,
          to: target.username,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Reduce local balance by 2 and clear reason
        setBalance((b) => Math.max(0, Math.trunc(b) - 2));
        setReason("");
        // Refresh current user credits from server
        await refreshCurrentUser();
      } else {
        console.error(data.message);
      }
    } catch (e) {
      console.error("Send error", e);
    }
  };
  // const handleRequest = () => {
  //   const target = users.find(
  //     (u) => u.username === selectedUser || u.email === selectedUser
  //   );
  //   console.log(
  //     "Request",
  //     amount,
  //     "credits from",
  //     target?.username ?? selectedUser
  //   );
  // };

  const handleLogout = () => {
    try {
      localStorage.removeItem("currentUser");
    } catch {}
    router.push("/auth/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5DC] text-[#28282B] flex items-center justify-center">
        <div className="font-mono">Loading…</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Page container */}
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-4 lg:px-6 py-3 min-w-0">
        {/* Layout: single column on sm/md, two-column grid on lg with fixed left rail */}
        <div className="grid gap-4 lg:grid-cols-[300px_1fr] lg:items-start">
          {/* Main content (first in DOM; on lg it will occupy the right column) */}
          <div className="w-full lg:col-start-2 max-w-screen-md mx-auto flex flex-col gap-4 min-w-0">
            {/* Header (welcome bar) */}
            <div className="w-full">
              <div
                className="p-3 sm:p-4 lg:p-5 border-4 rounded-none shadow-[8px_8px_0_0_#28282B]"
                style={{
                  background: "var(--background)",
                  color: "var(--foreground)",
                  borderColor: "var(--foreground)",
                }}
              >
                {/* Top row: avatar + greeting on the left, logout on the right */}
                <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <button
                      onClick={() => setShowSettings(true)}
                      aria-label={`Open settings for ${user.username}`}
                      className="w-10 h-10 sm:w-9 sm:h-9 rounded-full border-4 flex items-center justify-center font-bold btn-3d"
                      style={{
                        background: "var(--background)",
                        color: "var(--foreground)",
                        borderColor: "var(--foreground)",
                      }}
                    >
                      {userInitial}
                    </button>
                    <div className="min-w-0 pr-10 sm:pr-0">
                      <h1
                        className="font-heading text-lg sm:text-xl md:text-2xl font-extrabold uppercase tracking-wider truncate"
                        style={{ color: "var(--accent)" }}
                      >
                        {greeting}
                      </h1>
                      <p className="font-mono text-xs sm:text-sm mt-1 opacity-80 truncate">
                        Control panel of the credit collective
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <button
                      onClick={handleLogout}
                      aria-label="Logout"
                      className="text-white px-3.5 py-2 sm:py-1.5 rounded-none font-bold border-4 hover:opacity-90 btn-3d flex items-center justify-center"
                      style={{
                        background: "var(--accent)",
                        borderColor: "var(--foreground)",
                      }}
                    >
                      <IconLogout size={20} stroke={2} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Balance */}
            <div className="w-full">
              <div
                className="p-3 sm:p-4 lg:p-5 border-4 rounded-none shadow-[8px_8px_0_0_#28282B]"
                style={{
                  background: "var(--background)",
                  color: "var(--foreground)",
                  borderColor: "var(--foreground)",
                }}
              >
                <div className="text-center space-y-3">
                  <h2
                    className="font-heading text-base sm:text-lg md:text-xl font-extrabold uppercase tracking-wider"
                    style={{ color: "var(--accent)" }}
                  >
                    Current Balance
                  </h2>
                  <div
                    className="text-3xl sm:text-4xl font-bold font-mono tabular-nums"
                    style={{ color: "var(--accent)" }}
                  >
                    {Math.trunc(balance).toLocaleString("en-IN")}
                  </div>
                  <p className="font-mono text-xs sm:text-sm opacity-80">
                    Current Balance (credits)
                  </p>
                </div>
              </div>
            </div>

            {/* Select User */}
            <div className="w-full">
              <div
                className="p-3 sm:p-4 lg:p-5 border-4 rounded-none shadow-[8px_8px_0_0_#28282B]"
                style={{
                  background: "var(--background)",
                  color: "var(--foreground)",
                  borderColor: "var(--foreground)",
                }}
              >
                <h3
                  className="font-heading text-sm sm:text-base md:text-lg font-extrabold uppercase tracking-wider mb-3"
                  style={{ color: "var(--accent)" }}
                >
                  Select User
                </h3>
                <input
                  list="users"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-2.5 py-2 sm:px-3.5 sm:py-2.5 lg:px-4 lg:py-3 rounded-none focus:outline-none border-4"
                  style={{
                    background: "var(--background)",
                    color: "var(--foreground)",
                    borderColor: "var(--foreground)",
                  }}
                  placeholder="Search by username or email"
                  required
                />
                <datalist id="users">
                  {users.map((u) => (
                    <option key={`${u._id}-u`} value={u.username} />
                  ))}
                  {users.map((u) => (
                    <option key={`${u._id}-e`} value={u.email} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Reason */}
            <div className="w-full">
              <div
                className="p-3 sm:p-4 lg:p-5 border-4 rounded-none shadow-[8px_8px_0_0_#28282B]"
                style={{
                  background: "var(--background)",
                  color: "var(--foreground)",
                  borderColor: "var(--foreground)",
                }}
              >
                <h3
                  className="font-heading text-sm sm:text-base md:text-lg font-extrabold uppercase tracking-wider mb-3"
                  style={{ color: "var(--accent)" }}
                >
                  Reason for Transaction
                </h3>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-2.5 py-2 sm:px-3.5 sm:py-2.5 lg:px-4 lg:py-3 rounded-none focus:outline-none border-4"
                  style={{
                    background: "var(--background)",
                    color: "var(--foreground)",
                    borderColor: "var(--foreground)",
                  }}
                  placeholder="Enter reason"
                  required
                />
              </div>
            </div>

            {/* {/* Amount 
            <div className="w-full">
              <div
                className="p-3 sm:p-4 lg:p-5 border-4 rounded-none shadow-[8px_8px_0_0_#28282B]"
                style={{
                  background: "var(--background)",
                  color: "var(--foreground)",
                  borderColor: "var(--foreground)",
                }}
              >
                <h3
                  className="font-heading text-sm sm:text-base md:text-lg font-extrabold uppercase tracking-wider mb-3 text-center"
                  style={{ color: "var(--accent)" }}
                >
                  Amount
                </h3>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min="1"
                  className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto block px-2.5 py-2 sm:px-3.5 sm:py-2.5 lg:px-4 lg:py-3 rounded-none focus:outline-none border-4 font-mono text-center"
                  style={{
                    background: "var(--background)",
                    color: "var(--foreground)",
                    borderColor: "var(--foreground)",
                  }}
                  placeholder="Enter credits"
                  required
                />
              </div>
            </div> */}

            {/* Actions */}
            <div className="w-full">
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                {/* <button
                  onClick={handleRequest}
                  disabled={!canSubmit}
                  aria-disabled={!canSubmit}
                  className="flex-1 py-2 sm:py-2.5 px-3 sm:px-3.5 rounded-none font-bold border-4 hover:opacity-90 btn-3d disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
                  style={{
                    background: "var(--background)",
                    color: "var(--foreground)",
                    borderColor: "var(--foreground)",
                  }}
                >
                  Request
                </button> */}
                <button
                  onClick={handleSend}
                  disabled={!canSubmit}
                  aria-disabled={!canSubmit}
                  className="flex-1 text-white py-2 sm:py-2.5 px-3 sm:px-3.5 rounded-none font-bold border-4 hover:opacity-90 btn-3d disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
                  style={{
                    background: "var(--accent)",
                    borderColor: "var(--foreground)",
                  }}
                >
                  Send 2 credits
                </button>
              </div>
              {!canSubmit && (
                <p className="mt-1.5 font-mono text-[11px] opacity-80">
                  Hint: select a valid user and enter a reason. Each send
                  transfers 2 credits.
                </p>
              )}
              {showSettings && (
                <SettingsModal
                  user={user}
                  onClose={() => setShowSettings(false)}
                />
              )}
            </div>

            {/* Recent Transactions */}
            <div className="w-full">
              <div
                className="p-3 sm:p-4 lg:p-5 border-4 rounded-none shadow-[8px_8px_0_0_#28282B]"
                style={{
                  background: "var(--background)",
                  color: "var(--foreground)",
                  borderColor: "var(--foreground)",
                }}
              >
                <h3
                  className="font-heading text-sm sm:text-base md:text-lg font-extrabold uppercase tracking-wider mb-3"
                  style={{ color: "var(--accent)" }}
                >
                  Recent Transactions
                </h3>
                <div className="text-center py-6">
                  <p className="font-mono opacity-80">
                    No transactions yet. Start by sending or receiving money!
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Leaderboard Sidebar: sticky on lg in left column; placed after content so it's last on small/medium */}
          <div className="w-full lg:col-start-1 lg:row-start-1 lg:sticky lg:top-24 self-start min-w-0">
            <LeaderboardSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
