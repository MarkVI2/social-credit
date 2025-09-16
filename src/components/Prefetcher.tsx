"use client";

import { useEffect } from "react";
import { trpc } from "@/trpc/client";

export default function Prefetcher() {
  const utils = trpc.useUtils();

  useEffect(() => {
    // Only prefetch when an auth token exists to avoid unauthenticated 401s
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("auth_token");
    const willPrefetch = Boolean(token);

    // Common queries to warm: user, leaderboard, my/history transactions, marketplace
    const tasks: Promise<unknown>[] = [];

    if (willPrefetch) {
      try {
        tasks.push(utils.user.getMe.prefetch());
        tasks.push(utils.transactions.getMyHistory.prefetch({ limit: 10 }));
        tasks.push(utils.transactions.getHistory.prefetch({ limit: 10 }));
        tasks.push(utils.leaderboard.getLeaderboard.prefetch());
        tasks.push(utils.marketplace.listItems.prefetch());
        tasks.push(utils.marketplace.getMyInventory.prefetch());
      } catch (e) {
        // swallow
      }
    } else {
      // Prefetch only public resources when not authenticated
      try {
        tasks.push(utils.leaderboard.getLeaderboard.prefetch());
        tasks.push(utils.transactions.getHistory.prefetch({ limit: 10 }));
      } catch (e) {}
    }

    // Run in background
    Promise.allSettled(tasks).catch(() => {});
  }, [utils]);

  return null;
}
