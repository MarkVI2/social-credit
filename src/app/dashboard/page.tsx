"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import LeaderboardSidebar from "@/components/LeaderboardSidebar";
import SettingsModal from "@/components/SettingsModal";

interface User {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [balance] = useState(1000.0); // Mock balance for now
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
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
      "Comrade {name}, reporting in",
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
  const isValidAmount = Number.isFinite(amount) && amount > 0;
  const isValidReason = reason.trim().length > 0;
  const canSubmit = isValidUser && isValidAmount && isValidReason;

  useEffect(() => {
    // Try to load current user from localStorage (temporary client-side session)
    try {
      const stored =
        typeof window !== "undefined" && localStorage.getItem("currentUser");
      if (stored) {
        setUser(JSON.parse(stored));
        return;
      }
    } catch {}
    // Fallback mock (remove when real auth is wired)
    setUser({
      _id: "mock-id",
      username: "johndoe",
      email: "john.doe@mahindrauniversity.edu.in",
      createdAt: new Date().toISOString(),
    });
  }, []);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUsers(data.users);
      })
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  const handleSend = () => {
    const target = users.find(
      (u) => u.username === selectedUser || u.email === selectedUser
    );
    console.log("Send", amount, "credits to", target?.username ?? selectedUser);
  };
  const handleRequest = () => {
    const target = users.find(
      (u) => u.username === selectedUser || u.email === selectedUser
    );
    console.log(
      "Request",
      amount,
      "credits from",
      target?.username ?? selectedUser
    );
  };

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
      className="min-h-screen p-3 sm:p-4"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="mx-auto w-full max-w-6xl lg:max-w-none lg:px-4 flex flex-wrap items-start justify-center gap-4 sm:gap-6">
        {/* Leaderboard Sidebar */}
        <LeaderboardSidebar />

        {/* Header (welcome bar) */}
        <div className="w-full sm:w-64 md:w-72 lg:w-80 xl:w-96 shrink-0 p-3 sm:p-4 lg:p-5">
          <div
            className="p-3 sm:p-4 lg:p-5 border-4 rounded-none shadow-[8px_8px_0_0_#28282B]"
            style={{
              background: "var(--background)",
              color: "var(--foreground)",
              borderColor: "var(--foreground)",
            }}
          >
            {/* Top row: avatar + greeting on the left, logout on the right */}
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                  onClick={() => setShowSettings(true)}
                  aria-label={`Open settings for ${user.username}`}
                  className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-[#F5F5DC] dark:bg-[#121212] text-[#28282B] dark:text-[#ededed] border-4 border-[#28282B] dark:border-[#ededed] flex items-center justify-center font-bold btn-3d"
                >
                  {userInitial}
                </button>
                <div className="min-w-0">
                  <h1 className="font-heading text-2xl sm:text-3xl font-extrabold uppercase text-[#C62828] tracking-wider truncate">
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
                  className="bg-[#C62828] text-white px-4 py-2 sm:py-2 rounded-none font-bold border-4 border-[#28282B] dark:border-[#ededed] hover:opacity-90 btn-3d"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="w-full sm:w-64 md:w-72 lg:w-80 xl:w-96 shrink-0 p-3 sm:p-4 lg:p-5">
          <div
            className="p-4 sm:p-6 lg:p-8 border-4 rounded-none shadow-[8px_8px_0_0_#28282B]"
            style={{
              background: "var(--background)",
              color: "var(--foreground)",
              borderColor: "var(--foreground)",
            }}
          >
            <div className="text-center space-y-4">
              <h2 className="font-heading text-xl font-extrabold uppercase text-[#C62828] tracking-wider">
                Current Balance
              </h2>
              <div className="text-4xl sm:text-5xl font-bold text-[#C62828] font-mono tabular-nums">
                ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <p className="font-mono text-xs sm:text-sm opacity-80">
                Social Credit Units
              </p>
            </div>
          </div>
        </div>

        {/* Select User */}
        <div className="w-full sm:w-64 md:w-72 lg:w-80 xl:w-96 shrink-0 p-3 sm:p-4 lg:p-5">
          <div
            className="p-3 sm:p-4 lg:p-5 border-4 rounded-none shadow-[8px_8px_0_0_#28282B]"
            style={{
              background: "var(--background)",
              color: "var(--foreground)",
              borderColor: "var(--foreground)",
            }}
          >
            <h3 className="font-heading text-lg font-extrabold uppercase text-[#C62828] tracking-wider mb-4">
              Select User
            </h3>
            <input
              list="users"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-2.5 py-2 sm:px-3 sm:py-2.5 lg:px-4 lg:py-3 bg-[#F5F5DC] dark:bg-[#1d1d1d] border-4 border-[#28282B] dark:border-[#ededed] rounded-none text-[#28282B] dark:text-[#ededed] placeholder-[#28282B]/60 dark:placeholder-[#ededed]/60 focus:outline-none"
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
        <div className="w-full sm:w-64 md:w-72 lg:w-80 xl:w-96 shrink-0 p-3 sm:p-4 lg:p-5">
          <div
            className="p-3 sm:p-4 lg:p-5 border-4 rounded-none shadow-[8px_8px_0_0_#28282B]"
            style={{
              background: "var(--background)",
              color: "var(--foreground)",
              borderColor: "var(--foreground)",
            }}
          >
            <h3 className="font-heading text-lg font-extrabold uppercase text-[#C62828] tracking-wider mb-4">
              Reason for Transaction
            </h3>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-2.5 py-2 sm:px-3 sm:py-2.5 lg:px-4 lg:py-3 bg-[#F5F5DC] dark:bg-[#1d1d1d] border-4 border-[#28282B] dark:border-[#ededed] rounded-none text-[#28282B] dark:text-[#ededed] placeholder-[#28282B]/60 dark:placeholder-[#ededed]/60 focus:outline-none"
              placeholder="Enter reason"
              required
            />
          </div>
        </div>

        {/* Amount */}
        <div className="w-full sm:w-64 md:w-72 lg:w-80 xl:w-96 shrink-0 p-3 sm:p-4 lg:p-5">
          <div
            className="p-3 sm:p-4 lg:p-5 border-4 rounded-none shadow-[8px_8px_0_0_#28282B]"
            style={{
              background: "var(--background)",
              color: "var(--foreground)",
              borderColor: "var(--foreground)",
            }}
          >
            <h3 className="font-heading text-lg font-extrabold uppercase text-[#C62828] tracking-wider mb-4 text-center">
              Amount
            </h3>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min="1"
              className="w-full max-w-xs mx-auto block px-2.5 py-2 sm:px-3 sm:py-2.5 lg:px-4 lg:py-3 bg-[#F5F5DC] dark:bg-[#1d1d1d] border-4 border-[#28282B] dark:border-[#ededed] rounded-none text-[#28282B] dark:text-[#ededed] placeholder-[#28282B]/60 dark:placeholder-[#ededed]/60 focus:outline-none font-mono text-center"
              placeholder="Enter credits"
              required
            />
          </div>
        </div>

        {/* Actions */}
        <div className="w-full sm:w-64 md:w-72 lg:w-80 xl:w-96 shrink-0 p-3 sm:p-4 lg:p-5">
          <div className="flex gap-3 sm:gap-4">
            <button
              onClick={handleRequest}
              disabled={!canSubmit}
              aria-disabled={!canSubmit}
              className="flex-1 bg-[#F5F5DC] dark:bg-[#121212] text-[#28282B] dark:text-[#ededed] py-2.5 sm:py-3 px-3 sm:px-4 rounded-none font-bold border-4 border-[#28282B] dark:border-[#ededed] hover:opacity-90 btn-3d disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Request
            </button>
            <button
              onClick={handleSend}
              disabled={!canSubmit}
              aria-disabled={!canSubmit}
              className="flex-1 bg-[#C62828] text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-none font-bold border-4 border-[#28282B] dark:border-[#ededed] hover:opacity-90 btn-3d disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Send
            </button>
          </div>
          {!canSubmit && (
            <p className="mt-2 font-mono text-xs opacity-80">
              Hint: select a valid user, enter a reason, and an amount greater
              than 0.
            </p>
          )}
          {showSettings && (
            <SettingsModal user={user} onClose={() => setShowSettings(false)} />
          )}
        </div>
        {/* Recent Transactions */}
        <div className="w-full sm:w-64 md:w-72 lg:w-80 xl:w-96 shrink-0 p-3 sm:p-4 lg:p-5">
          <div
            className="p-3 sm:p-4 lg:p-5 border-4 rounded-none shadow-[8px_8px_0_0_#28282B]"
            style={{
              background: "var(--background)",
              color: "var(--foreground)",
              borderColor: "var(--foreground)",
            }}
          >
            <h3 className="font-heading text-lg font-extrabold uppercase text-[#C62828] tracking-wider mb-4">
              Recent Transactions
            </h3>
            <div className="text-center py-8">
              <p className="font-mono opacity-80">
                No transactions yet. Start by sending or receiving money!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
