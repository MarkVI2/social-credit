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
  const [showPassword, setShowPassword] = useState(false);

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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="w-full max-w-md">
        <div
          className="border-4 p-6 sm:p-8 shadow-card"
          style={{
            background: "var(--background)",
            borderColor: "var(--foreground)",
            color: "var(--foreground)",
          }}
        >
          {/* Header */}
          <div className="space-y-1 text-center mb-6">
            <h1
              className="font-heading text-2xl sm:text-3xl font-extrabold uppercase tracking-wider"
              style={{ color: "var(--accent)" }}
            >
              Login
            </h1>
            <p className="font-mono text-xs sm:text-sm opacity-80">
              Authorized members only. Papers, please.
            </p>
            <p className="font-mono text-[11px] sm:text-xs opacity-70 leading-relaxed max-w-sm mx-auto">
              Social Credit is a collaborative classroom ledger for tracking
              contributions, friendly transfers, and administrative adjustments.
              Activity is logged transparently; balances fuel auctions, rewards,
              and playful economy mechanics.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error message */}
            {error && (
              <div
                className="border-4 bg-white/60 p-3"
                style={{ borderColor: "var(--accent)" }}
              >
                <p
                  className="font-mono text-sm"
                  style={{ color: "var(--accent)" }}
                >
                  {error}
                </p>
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
                      className="text-white py-2 px-3 rounded-none font-bold border-4 hover:opacity-90 disabled:opacity-60 btn-3d text-xs"
                      style={{
                        background: "var(--accent)",
                        borderColor: "var(--foreground)",
                      }}
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
                disabled={isLoading}
                className="w-full px-3 py-2 border-4 rounded-none focus:outline-none focus:ring-0"
                style={{
                  background: "var(--background)",
                  borderColor: "var(--foreground)",
                  color: "var(--foreground)",
                }}
                placeholder="Enter username or email"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  disabled={isLoading}
                  className="w-full pr-20 px-3 py-2 border-4 rounded-none focus:outline-none focus:ring-0 font-mono"
                  style={{
                    background: "var(--background)",
                    borderColor: "var(--foreground)",
                    color: "var(--foreground)",
                  }}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center justify-center px-3 font-mono text-[11px] sm:text-xs border-l-4 btn-3d"
                  style={{
                    background: "var(--background)",
                    borderColor: "var(--foreground)",
                    color: "var(--foreground)",
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white py-3 px-4 rounded-none font-bold border-4 hover:opacity-90 disabled:opacity-60 btn-3d"
              style={{
                background: "var(--accent)",
                borderColor: "var(--foreground)",
              }}
            >
              {isLoading ? "Signing In…" : "Sign In"}
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
            <div
              className="mt-3 border-4 bg-white/60 p-3"
              style={{ borderColor: "var(--foreground)" }}
            >
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
                  className="w-full px-3 py-2 border-4 rounded-none focus:outline-none"
                  style={{
                    background: "var(--background)",
                    borderColor: "var(--foreground)",
                    color: "var(--foreground)",
                  }}
                  placeholder="Enter username or email"
                  required
                />
                <button
                  type="submit"
                  className="w-full text-white py-2 px-4 rounded-none font-bold border-4 hover:opacity-90 btn-3d"
                  style={{
                    background: "var(--accent)",
                    borderColor: "var(--foreground)",
                  }}
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
