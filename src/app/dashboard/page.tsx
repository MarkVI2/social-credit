"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import LeaderboardSidebar from "@/components/LeaderboardSidebar";
import SettingsModal from "@/components/SettingsModal";
import { IconLogout } from "@tabler/icons-react";
import { useUsers } from "@/hooks/useUsers";
import { useTransactions } from "@/hooks/useTransactions";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/trpc/client";
//

// Transaction item shape (user + global recent logs)
interface UserTransaction {
  timestamp: string | Date;
  from: string;
  to: string;
  amount: number;
  reason?: string;
  message?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);

  // Use tRPC hooks
  const { user, isLoading: authLoading, refreshAuth } = useAuth();
  const { allUsers: users } = useUsers();
  const { transactionHistory, getGlobalHistory, transfer, isTransferring } =
    useTransactions();
  const utils = trpc.useUtils();
  const meQuery = trpc.user.getMe.useQuery(undefined, {
    enabled: !!user,
    staleTime: 5000,
  });

  // Get global history
  const globalHistoryQuery = getGlobalHistory(10);
  const recent = (transactionHistory.data?.items ||
    ([] as unknown)) as UserTransaction[];
  const globalRecent = (globalHistoryQuery.data?.items ||
    ([] as unknown)) as UserTransaction[];

  // Map emails to usernames for display; keep usernames as-is
  const emailToUsername = useMemo(() => {
    const m = new Map<string, string>();
    users.forEach((u) => m.set(u.email.toLowerCase(), u.username));
    return m;
  }, [users]);

  const resolveName = useCallback(
    (id: string) => {
      if (!id) return id;
      if (id.toLowerCase() === "class bank") return "Class Bank";
      if (id.includes("@")) return emailToUsername.get(id.toLowerCase()) || id;
      return id; // assume already username
    },
    [emailToUsername]
  );

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

  // Prefer server-sourced credits (authoritative), fallback to local user
  const displayCredits = useMemo(() => {
    const serverCredits = meQuery.data?.user?.credits;
    if (typeof serverCredits === "number") return Math.trunc(serverCredits);
    const localCredits = user?.credits;
    if (typeof localCredits === "number") return Math.trunc(localCredits);
    return 0;
  }, [meQuery.data?.user?.credits, user?.credits]);

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
  // Rate limit: only one send every 2 minutes
  const lastMyTx = recent[0];
  const lastTxTime = lastMyTx ? new Date(lastMyTx.timestamp).getTime() : 0;
  const timeSinceLast = Date.now() - lastTxTime;
  const rateLimitMs = 2 * 60 * 1000;
  const isRateLimited = Boolean(lastMyTx) && timeSinceLast < rateLimitMs;
  const retrySeconds = isRateLimited
    ? Math.ceil((rateLimitMs - timeSinceLast) / 1000)
    : 0;

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    } else if (user?.role === "admin") {
      router.push("/admin");
    }
  }, [user, authLoading, router]);

  const handleSend = async () => {
    const target = users.find(
      (u) => u.username === selectedUser || u.email === selectedUser
    );
    if (!user || !target) return;

    try {
      await transfer(target.username, reason);
      setReason("");
      // Refresh auth/user to update local credits immediately
      if (user) {
        await refreshAuth(user);
      }
      // Invalidate tRPC user to refresh server-sourced credits
      await utils.user.getMe.invalidate();
    } catch (e) {
      console.error("[Send] Transfer error", e);
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
      localStorage.removeItem("auth_token");
    } catch {}
    router.push("/auth/login");
  };

  if (authLoading || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
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
        {/* Responsive flex layout: column on mobile, row on lg */}
        <div className="flex flex-col lg:flex-row items-start gap-4">
          {/* Left column: leaderboard (order after content on mobile for priority) */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 order-1 lg:order-none lg:sticky lg:top-24 self-start min-w-0">
            <div className="lg:pr-2">
              <LeaderboardSidebar forceRowEntries fixedBadgeWidth />
            </div>
          </div>

          {/* Main content */}
          <div className="w-full max-w-screen-md mx-auto flex flex-col gap-4 min-w-0 order-0 lg:order-none flex-1">
            {/* Header (welcome bar) */}
            <div className="w-full">
              <div
                className="p-3 sm:p-4 lg:p-5 border-4 rounded-none shadow-card"
                style={{
                  background: "var(--background)",
                  color: "var(--foreground)",
                  borderColor: "var(--foreground)",
                }}
              >
                {/* Top row: avatar + greeting (left) and logout (right) */}
                <div className="flex items-stretch gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <button
                      onClick={() => setShowSettings(true)}
                      aria-label={`Open settings for ${user.username}`}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 flex items-center justify-center font-bold btn-3d shrink-0 text-xl sm:text-2xl"
                      style={{
                        background: "var(--background)",
                        color: "var(--foreground)",
                        borderColor: "var(--foreground)",
                      }}
                    >
                      {userInitial}
                    </button>
                    <div className="min-w-0 flex-1">
                      <h1
                        className="font-heading text-lg sm:text-xl md:text-2xl font-extrabold uppercase tracking-wider break-words whitespace-normal"
                        style={{ color: "var(--accent)" }}
                      >
                        {greeting}
                      </h1>
                      <p className="font-mono text-xs sm:text-sm mt-1 opacity-80 break-words whitespace-normal">
                        Control panel of the credit collective
                      </p>
                      <div className="mt-2">
                        <button
                          onClick={() => router.push("/marketplace")}
                          className="px-2 py-1 border-2 rounded-none font-mono text-xs sm:text-sm"
                          style={{
                            background: "transparent",
                            color: "var(--foreground)",
                            borderColor: "var(--foreground)",
                          }}
                        >
                          Visit People's Marketplace
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <button
                      onClick={handleLogout}
                      aria-label="Logout"
                      className="text-white px-4 py-3 sm:px-5 sm:py-3 rounded-none font-bold border-4 hover:opacity-90 btn-3d flex items-center justify-center h-full"
                      style={{
                        background: "var(--accent)",
                        borderColor: "var(--foreground)",
                      }}
                    >
                      <IconLogout size={24} stroke={2} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Balance */}
            <div className="w-full">
              <div
                className="p-3 sm:p-4 lg:p-5 border-4 rounded-none shadow-card"
                style={{
                  background: "var(--background)",
                  color: "var(--foreground)",
                  borderColor: "var(--foreground)",
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <h3
                    className="font-heading text-sm sm:text-base md:text-lg font-extrabold uppercase tracking-wider mb-2"
                    style={{ color: "var(--accent)" }}
                  >
                    Balance
                  </h3>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="font-heading font-extrabold tracking-wider text-4xl sm:text-5xl md:text-6xl"
                      style={{ color: "var(--accent)" }}
                    >
                      {displayCredits}
                    </div>
                    <div className="font-mono text-[11px] sm:text-xs opacity-80">
                      credits
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Select User */}
            <div className="w-full">
              <div
                className="p-3 sm:p-4 lg:p-5 border-4 rounded-none shadow-card"
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
                className="p-3 sm:p-4 lg:p-5 border-4 rounded-none shadow-card"
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
                className="p-3 sm:p-4 lg:p-5 border-4 rounded-none shadow-card"
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
                  disabled={!canSubmit || isTransferring || isRateLimited}
                  aria-disabled={!canSubmit || isTransferring || isRateLimited}
                  className="flex-1 text-white py-2 sm:py-2.5 px-3 sm:px-3.5 rounded-none font-bold border-4 hover:opacity-90 btn-3d disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
                  style={{
                    background: "var(--accent)",
                    borderColor: "var(--foreground)",
                  }}
                >
                  {isTransferring ? "Sending..." : "Send 2 credits"}
                </button>
              </div>
              {!canSubmit && (
                <p className="mt-1.5 font-mono text-[11px] opacity-80">
                  Hint: select a valid user and enter a reason. Each send
                  transfers 2 credits.
                </p>
              )}
              {isRateLimited && (
                <p className="mt-1.5 font-mono text-[11px] opacity-80">
                  Rate limit exceeded. Try again in {retrySeconds} second
                  {retrySeconds > 1 ? "s" : ""}.
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
                className="p-3 sm:p-4 lg:p-5 border-4 rounded-none shadow-card"
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
                {globalHistoryQuery.isLoading ? (
                  <div className="text-center py-6">
                    <p className="font-mono opacity-80">Loading activity…</p>
                  </div>
                ) : globalRecent.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="font-mono opacity-80">No activity yet.</p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto pr-1">
                    <ul
                      className="divide-y-2"
                      style={{ borderColor: "var(--foreground)" }}
                    >
                      {globalRecent.map((t: UserTransaction, i: number) => (
                        <li key={i} className="py-2">
                          <div className="text-[11px] sm:text-xs font-mono opacity-80">
                            {new Date(t.timestamp).toLocaleString()}
                          </div>
                          <div className="text-xs sm:text-sm font-mono mt-1 leading-relaxed break-words">
                            {t.message ? (
                              <span
                                dangerouslySetInnerHTML={{ __html: t.message }}
                              />
                            ) : (
                              <>
                                <span className="text-red-500 font-bold">
                                  {resolveName(t.from)}
                                </span>{" "}
                                has transfered{" "}
                                <span
                                  className="font-bold"
                                  style={{ color: "var(--accent)" }}
                                >
                                  {t.amount}
                                </span>{" "}
                                to{" "}
                                <span className="text-red-500 font-bold">
                                  {resolveName(t.to)}
                                </span>
                                {t.reason ? (
                                  <>
                                    {" "}
                                    for{" "}
                                    <span className="italic font-semibold">
                                      {t.reason}
                                    </span>
                                  </>
                                ) : null}
                              </>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
