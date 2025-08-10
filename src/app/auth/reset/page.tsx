"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ResetPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMsg("");
    if (password !== confirm) {
      setMsg("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg("Password updated. Redirecting to login…");
        setTimeout(() => router.push("/auth/login"), 1500);
      } else {
        setMsg(data.message || "Failed to reset password");
      }
    } catch {
      setMsg("Network error. Try again later.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F5DC] text-[#28282B] flex items-center justify-center p-4">
      <div className="w-full max-w-md border-4 border-[#28282B] bg-[#F5F5DC] p-6 shadow-[8px_8px_0_0_#28282B]">
        <h1 className="font-heading text-2xl font-extrabold uppercase text-[#C62828] tracking-wider mb-2">
          Reset Password
        </h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <input type="hidden" value={token} readOnly />
          <div>
            <label className="block text-sm font-semibold">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F5DC] border-4 border-[#28282B] rounded-none text-[#28282B] placeholder-[#28282B]/60 focus:outline-none"
              placeholder="Enter new password"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5F5DC] border-4 border-[#28282B] rounded-none text-[#28282B] placeholder-[#28282B]/60 focus:outline-none"
              placeholder="Confirm new password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C62828] text-white py-3 px-4 rounded-none font-bold border-4 border-[#28282B] hover:opacity-90 disabled:opacity-60 btn-3d"
          >
            {loading ? "Updating…" : "Update Password"}
          </button>
          {msg && <p className="font-mono text-xs mt-2">{msg}</p>}
        </form>
      </div>
    </div>
  );
}
