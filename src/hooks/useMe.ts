"use client";

import { trpc } from "@/trpc/client";

export function useMe() {
  // Check synchronously if auth token exists in localStorage (browser only)
  const tokenAvailable =
    typeof window !== "undefined" && !!localStorage.getItem("auth_token");

  return trpc.user.getMe.useQuery(undefined, {
    enabled: tokenAvailable,
    staleTime: 5_000,
    refetchOnWindowFocus: true,
  });
}
