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
    <div className="min-h-screen bg-[#9D1B1B] flex items-center justify-center p-4">
      {/* Floating cube container */}
      <div className="relative">
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-[#28282B] rounded-2xl blur-xl opacity-50 transform scale-105"></div>

        {/* Main auth cube */}
        <div className="relative bg-[#28282B] rounded-2xl p-8 shadow-2xl border border-gray-700 backdrop-blur-sm">
          <div className="w-80 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-[#E7E7E7]">
                Welcome Back
              </h1>
              <p className="text-sm text-[#F9C784] opacity-75">
                Access your digital wallet
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="identifier"
                  className="block text-sm font-medium text-[#E7E7E7]"
                >
                  Username or Email
                </label>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setError(""); // Clear error when user starts typing
                  }}
                  className="w-full px-4 py-3 bg-[#1a1a1d] border border-gray-600 rounded-lg text-[#E7E7E7] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F9C784] focus:border-transparent transition-all duration-200"
                  placeholder="Enter username or email"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#E7E7E7]"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(""); // Clear error when user starts typing
                  }}
                  className="w-full px-4 py-3 bg-[#1a1a1d] border border-gray-600 rounded-lg text-[#E7E7E7] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F9C784] focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#F9C784] text-[#28282B] py-3 px-4 rounded-lg font-semibold hover:bg-[#f7c066] focus:outline-none focus:ring-2 focus:ring-[#F9C784] focus:ring-offset-2 focus:ring-offset-[#28282B] transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            {/* Sign up link */}
            <div className="text-center">
              <Link
                href="/auth/signup"
                className="text-xs text-[#F9C784] hover:text-[#E7E7E7] transition-colors duration-200 underline underline-offset-2"
              >
                Don't have an account? Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
