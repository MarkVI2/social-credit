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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

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

    // Validate email domain
    const emailError = validateEmail(formData.email);
    const passwordError = validatePasswords();

    setErrors({
      email: emailError,
      password: passwordError,
      general: "",
    });

    // Only proceed if no errors
    if (!emailError && !passwordError) {
      try {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (data.success) {
          alert("Account created successfully! You can now log in.");
          // Reset form
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
                Create Account
              </h1>
              <p className="text-sm text-[#F9C784] opacity-75">
                Join the digital economy
              </p>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* General error message */}
              {errors.general && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-3">
                  <p className="text-sm text-red-400">{errors.general}</p>
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-[#E7E7E7]"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#1a1a1d] border border-gray-600 rounded-lg text-[#E7E7E7] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F9C784] focus:border-transparent transition-all duration-200"
                  placeholder="Choose a username"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[#E7E7E7]"
                >
                  University Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-[#1a1a1d] border rounded-lg text-[#E7E7E7] placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    errors.email
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-600 focus:ring-[#F9C784]"
                  }`}
                  placeholder="se23uxxx123@mahindrauniversity.edu.in"
                  required
                />
                {errors.email && (
                  <p className="text-sm text-red-400 mt-1">{errors.email}</p>
                )}
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
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#1a1a1d] border border-gray-600 rounded-lg text-[#E7E7E7] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F9C784] focus:border-transparent transition-all duration-200"
                  placeholder="Create a password"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-[#E7E7E7]"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-[#1a1a1d] border rounded-lg text-[#E7E7E7] placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    errors.password
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-600 focus:ring-[#F9C784]"
                  }`}
                  placeholder="Confirm your password"
                  required
                />
                {errors.password && (
                  <p className="text-sm text-red-400 mt-1">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#F9C784] text-[#28282B] py-3 px-4 rounded-lg font-semibold hover:bg-[#f7c066] focus:outline-none focus:ring-2 focus:ring-[#F9C784] focus:ring-offset-2 focus:ring-offset-[#28282B] transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            {/* Login link */}
            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-xs text-[#F9C784] hover:text-[#E7E7E7] transition-colors duration-200 underline underline-offset-2"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
