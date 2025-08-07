"use client";

import { useState, useEffect } from "react";

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
    console.log("Send", amount, "credits to", selectedUser);
  };
  const handleRequest = () => {
    console.log("Request", amount, "credits from", selectedUser);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#9D1B1B] flex items-center justify-center">
        <div className="text-[#E7E7E7]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#9D1B1B] p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-[#28282B] rounded-2xl p-6 border border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-[#E7E7E7]">
                Welcome back, {user.username}!
              </h1>
              <p className="text-[#F9C784] opacity-75">
                Digital Currency Dashboard
              </p>
            </div>
            <button className="bg-[#F9C784] text-[#28282B] px-4 py-2 rounded-lg font-semibold hover:bg-[#f7c066] transition-all duration-200">
              Logout
            </button>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-[#28282B] rounded-2xl p-8 border border-gray-700">
          <div className="text-center space-y-4">
            <h2 className="text-lg font-semibold text-[#E7E7E7]">
              Current Balance
            </h2>
            <div className="text-4xl font-bold text-[#F9C784]">
              ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-[#E7E7E7] opacity-75">
              Social Credit Units
            </p>
          </div>
        </div>

        {/* User Selection */}
        <div className="bg-[#28282B] rounded-2xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-[#E7E7E7] mb-4">
            Select User
          </h3>
          <input
            list="users"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full px-4 py-3 bg-[#1a1a1d] border border-gray-600 rounded-lg text-[#E7E7E7]"
            placeholder="Search user"
          />
          <datalist id="users">
            {users.map((u) => (
              <option key={u._id} value={u.username} />
            ))}
          </datalist>
        </div>

        {/* Amount Input */}
        <div className="bg-[#28282B] rounded-2xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-[#E7E7E7] mb-4">Amount</h3>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min="0"
            className="w-full px-4 py-3 bg-[#1a1a1d] border border-gray-600 rounded-lg text-[#E7E7E7]"
            placeholder="Enter credits"
          />
        </div>

        {/* Request and Send Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleRequest}
            className="flex-1 bg-[#F9C784] text-[#28282B] py-3 px-4 rounded-lg font-semibold hover:bg-[#f7c066]"
          >
            Request
          </button>
          <button
            onClick={handleSend}
            className="flex-1 bg-[#F9C784] text-[#28282B] py-3 px-4 rounded-lg font-semibold hover:bg-[#f7c066]"
          >
            Send
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[#28282B] rounded-2xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-[#E7E7E7] mb-4">
            Recent Transactions
          </h3>
          <div className="text-center py-8">
            <p className="text-[#E7E7E7] opacity-75">
              No transactions yet. Start by sending or receiving money!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
