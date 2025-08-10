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
  const [showForgot, setShowForgot] = useState(false);
  const [fpIdentifier, setFpIdentifier] = useState("");
  const [fpMsg, setFpMsg] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

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
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem("currentUser", JSON.stringify(data.user));
            if (data.token) localStorage.setItem("auth_token", data.token);
          }
        } catch {}
        // Redirect based on role
        const role = (data.user?.role || "user").toLowerCase();
        router.push(role === "admin" ? "/admin" : "/dashboard");
      } else {
        setError(data.message);
        // Auto-resend verification if not verified and an email is provided
        if (
          typeof data.message === "string" &&
          data.message.toLowerCase().includes("email not verified") &&
          identifier.includes("@")
        ) {
          try {
            setResending(true);
            setResendMsg("");
            const res = await fetch("/api/auth/verify/resend", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: identifier.trim() }),
            });
            await res.json();
            setResendMsg(
              "We sent a fresh verification link. Check your inbox and Spam/Junk."
            );
          } catch {
            setResendMsg("Failed to resend. Try again later.");
          } finally {
            setResending(false);
          }
        }
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
                {error.toLowerCase().includes("email not verified") && (
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      disabled={resending || !identifier.includes("@")}
                      onClick={async () => {
                        setResendMsg("");
                        if (!identifier.includes("@")) {
                          setResendMsg(
                            "Enter your email address in the login field to resend."
                          );
                          return;
                        }
                        setResending(true);
                        try {
                          const res = await fetch("/api/auth/verify/resend", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: identifier.trim() }),
                          });
                          await res.json();
                          setResendMsg(
                            "If the email exists, a fresh verification link was sent. Check your inbox and Spam/Junk."
                          );
                        } catch {
                          setResendMsg("Failed to resend. Try again later.");
                        }
                        setResending(false);
                      }}
                      className="bg-[#C62828] text-white py-2 px-3 rounded-none font-bold border-4 border-[#28282B] hover:opacity-90 disabled:opacity-60 btn-3d text-xs"
                    >
                      {resending ? "Resending…" : "Resend verification email"}
                    </button>
                    {resendMsg && (
                      <span className="font-mono text-[11px]">{resendMsg}</span>
                    )}
                  </div>
                )}
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
              className="w-full bg-[#C62828] text-white py-3 px-4 rounded-none font-bold border-4 border-[#28282B] hover:opacity-90 disabled:opacity-60 btn-3d"
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

          {/* Forgot Password */}
          <div className="text-center mt-2">
            <button
              type="button"
              onClick={() => {
                setShowForgot((s) => !s);
                setFpMsg("");
              }}
              className="text-xs underline underline-offset-2 hover:opacity-80"
            >
              {showForgot ? "Hide Forgot Password" : "Forgot Password?"}
            </button>
          </div>

          {showForgot && (
            <div className="mt-3 border-4 border-[#28282B] bg-white/60 p-3">
              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  setFpMsg("");
                  try {
                    const res = await fetch("/api/auth/forgot", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ identifier: fpIdentifier }),
                    });
                    await res.json();
                    setFpMsg(
                      "If an account exists, a reset link has been sent to the email on file."
                    );
                  } catch {
                    setFpMsg("Failed to send reset link. Try again later.");
                  }
                }}
                className="space-y-2"
              >
                <label className="block text-xs font-semibold text-left">
                  Username or Email
                </label>
                <input
                  type="text"
                  value={fpIdentifier}
                  onChange={(e) => setFpIdentifier(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F5DC] border-4 border-[#28282B] rounded-none text-[#28282B] placeholder-[#28282B]/60 focus:outline-none"
                  placeholder="Enter username or email"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-[#C62828] text-white py-2 px-4 rounded-none font-bold border-4 border-[#28282B] hover:opacity-90 btn-3d"
                >
                  Send Reset Link
                </button>
                {fpMsg && (
                  <p className="font-mono text-xs mt-1 text-left">{fpMsg}</p>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
