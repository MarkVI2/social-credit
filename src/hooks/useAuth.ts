"use client";

import type { User } from "@/types/user";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function useAuth() {
  const router = useRouter();
  const [balance, setBalance] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize user from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("currentUser");
      if (stored) {
        const userData = JSON.parse(stored) as User;
        setUser(userData);
        setIsAuthenticated(true);
        if (typeof userData.credits === "number") {
          setBalance(Math.trunc(userData.credits));
        }
      }
    } catch (error) {
      console.error("Error loading user from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = () => {
    setIsLoading(true);
    setUser(null);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("auth_token");
    } catch {
      console.log("Error removing auth data");
    }
    setIsLoading(false);
    router.push("/auth/login");
  };

  const refreshAuth = async (userData?: User) => {
    setIsLoading(true);
    if (userData) {
      setUser(userData);
      setIsAuthenticated(true);
    }
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      if (data?.authenticated && data.user) {
        const fresh = data.user as User;
        if (fresh && typeof (fresh as any).credits === "number") {
          setBalance(Math.trunc((fresh as any).credits as number));
        }
        try {
          localStorage.setItem("currentUser", JSON.stringify(fresh));
        } catch {}
        setUser(fresh);
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error("Failed to refresh user", e);
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = user?.role === "admin";

  return {
    user: user as User | null,
    balance,
    isLoading,
    isAuthenticated,
    isAdmin,
    logout,
    refreshAuth,
  };
}
