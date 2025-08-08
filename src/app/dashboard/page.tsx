"use client";

import { useState, useEffect } from "react";
import LeaderboardSidebar from "@/components/LeaderboardSidebar";

interface User {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [balance] = useState(1000.0); // Mock balance for now
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    // TODO: Get user data from session/context when implementing authentication
    // For now, using mock data
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
    console.log("Request", amount, "credits from", target?.username ?? selectedUser);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5DC] text-[#28282B] flex items-center justify-center">
        <div className="font-mono">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5DC] p-4 text-[#28282B]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[20rem_1fr] gap-6">
        {/* Leaderboard Sidebar */}
        <div className="order-2 lg:order-1">
          <LeaderboardSidebar />
        </div>

        {/* Main content */}
        <div className="order-1 lg:order-2 space-y-6">
          {/* Header */}
          <div className="bg-[#F5F5DC] p-6 border-4 border-[#28282B] text-[#28282B] rounded-none shadow-[8px_8px_0_0_#28282B]">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold uppercase text-[#C62828] tracking-wider">
                  Welcome Back, {user.username}
                </h1>
                <p className="font-mono text-xs sm:text-sm mt-1 opacity-80">
                  Control panel of the credit collective
                </p>
              </div>
              <button className="bg-[#C62828] text-white px-4 py-2 rounded-none font-bold border-4 border-[#28282B] hover:opacity-90">
                Logout
              </button>
            </div>
          </div>

          {/* Balance */}
          <div className="bg-[#F5F5DC] p-8 border-4 border-[#28282B] text-[#28282B] rounded-none shadow-[8px_8px_0_0_#28282B]">
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

          {/* Select User */}
          <div className="bg-[#F5F5DC] p-6 border-4 border-[#28282B] text-[#28282B] rounded-none shadow-[8px_8px_0_0_#28282B]">
            <h3 className="font-heading text-lg font-extrabold uppercase text-[#C62828] tracking-wider mb-4">
              Select User
            </h3>
            <input
              list="users"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F5DC] border-4 border-[#28282B] rounded-none text-[#28282B] placeholder-[#28282B]/60 focus:outline-none"
              placeholder="Search by username or email"
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

          {/* Reason */}
          <div className="bg-[#F5F5DC] p-6 border-4 border-[#28282B] text-[#28282B] rounded-none shadow-[8px_8px_0_0_#28282B]">
            <h3 className="font-heading text-lg font-extrabold uppercase text-[#C62828] tracking-wider mb-4">
              Reason for Transaction
            </h3>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F5DC] border-4 border-[#28282B] rounded-none text-[#28282B] placeholder-[#28282B]/60 focus:outline-none"
              placeholder="Enter reason"
            />
          </div>

          {/* Amount */}
          <div className="bg-[#F5F5DC] p-6 border-4 border-[#28282B] text-[#28282B] rounded-none shadow-[8px_8px_0_0_#28282B]">
            <h3 className="font-heading text-lg font-extrabold uppercase text-[#C62828] tracking-wider mb-4">
              Amount
            </h3>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min="0"
              className="w-full px-3 py-2 bg-[#F5F5DC] border-4 border-[#28282B] rounded-none text-[#28282B] placeholder-[#28282B]/60 focus:outline-none font-mono"
              placeholder="Enter credits"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleRequest}
              className="flex-1 bg-[#F5F5DC] text-[#28282B] py-3 px-4 rounded-none font-bold border-4 border-[#28282B] hover:opacity-90 shadow-[6px_6px_0_0_#28282B]"
            >
              Request
            </button>
            <button
              onClick={handleSend}
              className="flex-1 bg-[#C62828] text-white py-3 px-4 rounded-none font-bold border-4 border-[#28282B] hover:opacity-90 shadow-[6px_6px_0_0_#28282B]"
            >
              Send
            </button>
          </div>

          {/* Recent Transactions */}
          <div className="bg-[#F5F5DC] p-6 border-4 border-[#28282B] text-[#28282B] rounded-none shadow-[8px_8px_0_0_#28282B]">
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
