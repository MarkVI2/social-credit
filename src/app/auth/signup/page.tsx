"use client";

import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    if (!email.endsWith("@mahindrauniversity.edu.in")) {
      return "Email must end with @mahindrauniversity.edu.in";
    }
    return "";
  };

  const validatePasswords = () => {
    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }
    return "";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear errors when user starts typing
    if (name === "email") {
      setErrors((prev) => ({ ...prev, email: "", general: "" }));
    } else if (name === "password" || name === "confirmPassword") {
      setErrors((prev) => ({ ...prev, password: "", general: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const emailError = validateEmail(formData.email);
    const passwordError = validatePasswords();

    setErrors({ email: emailError, password: passwordError, general: "" });

    if (!emailError && !passwordError) {
      try {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        if (data.success) {
          alert("Account created successfully! You can now log in.");
          setFormData({
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
          });
        } else {
          setErrors((prev) => ({ ...prev, general: data.message }));
        }
      } catch (error) {
        console.error("Signup error:", error);
        setErrors((prev) => ({
          ...prev,
          general: "Network error. Please try again.",
        }));
      }
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
              Create Account
            </h1>
            <p className="font-mono text-xs sm:text-sm opacity-80">
              Enrollment into the credit collective.
            </p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General error message */}
            {errors.general && (
              <div className="border-4 border-[#C62828] bg-white/60 p-3">
                <p className="font-mono text-sm text-[#C62828]">
                  {errors.general}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-semibold">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-[#F5F5DC] border-4 border-[#28282B] rounded-none text-[#28282B] placeholder-[#28282B]/60 focus:outline-none focus:ring-0"
                placeholder="Choose a username"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold">
                University Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-[#F5F5DC] border-4 rounded-none text-[#28282B] placeholder-[#28282B]/60 focus:outline-none focus:ring-0 ${
                  errors.email ? "border-[#C62828]" : "border-[#28282B]"
                }`}
                placeholder="se23uxxx123@mahindrauniversity.edu.in"
                required
              />
              {errors.email && (
                <p className="font-mono text-sm text-[#C62828] mt-1">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-[#F5F5DC] border-4 border-[#28282B] rounded-none text-[#28282B] placeholder-[#28282B]/60 focus:outline-none focus:ring-0"
                placeholder="Create a password"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-[#F5F5DC] border-4 rounded-none text-[#28282B] placeholder-[#28282B]/60 focus:outline-none focus:ring-0 ${
                  errors.password ? "border-[#C62828]" : "border-[#28282B]"
                }`}
                placeholder="Confirm your password"
                required
              />
              {errors.password && (
                <p className="font-mono text-sm text-[#C62828] mt-1">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#C62828] text-white py-3 px-4 rounded-none font-bold border-4 border-[#28282B] hover:opacity-90 disabled:opacity-60"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Login link */}
          <div className="text-center mt-4">
            <Link
              href="/auth/login"
              className="text-xs underline underline-offset-2 hover:opacity-80"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
