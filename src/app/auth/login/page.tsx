"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(""); // Can be username or email
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F5DC] text-[#28282B] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="border-4 border-[#28282B] bg-[#F5F5DC] p-6 sm:p-8 shadow-[8px_8px_0_0_#28282B]">
          {/* Header */}
          <div className="space-y-1 text-center mb-6">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold uppercase text-[#C62828] tracking-wider">
              Login
            </h1>
            <p className="font-mono text-xs sm:text-sm opacity-80">
              Authorized members only. Papers, please.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error message */}
            {error && (
              <div className="border-4 border-[#C62828] bg-white/60 p-3">
                <p className="font-mono text-sm text-[#C62828]">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="identifier"
                className="block text-sm font-semibold"
              >
                Username or Email
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError("");
                }}
                className="w-full px-3 py-2 bg-[#F5F5DC] border-4 border-[#28282B] rounded-none text-[#28282B] placeholder-[#28282B]/60 focus:outline-none focus:ring-0"
                placeholder="Enter username or email"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="w-full px-3 py-2 bg-[#F5F5DC] border-4 border-[#28282B] rounded-none text-[#28282B] placeholder-[#28282B]/60 focus:outline-none focus:ring-0"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#C62828] text-white py-3 px-4 rounded-none font-bold border-4 border-[#28282B] hover:opacity-90 disabled:opacity-60"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Sign up link */}
          <div className="text-center mt-4">
            <Link
              href="/auth/signup"
              className="text-xs underline underline-offset-2 hover:opacity-80"
            >
              Don&apos;t have an account? Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
