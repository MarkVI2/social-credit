"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trpc } from "@/trpc/client";

export default function Prefetcher() {
  const utils = trpc.useUtils();

  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("auth_token");
    const isAuthed = Boolean(token);

    const tasks: Promise<unknown>[] = [];

    // Always prefetch leaderboard and public transaction history
    try {
      tasks.push(utils.leaderboard.getLeaderboard.prefetch());
      tasks.push(utils.transactions.getHistory.prefetch({ limit: 10 }));
    } catch {}

    // Route-aware prefetch targets
    try {
      if (pathname?.startsWith("/dashboard") || pathname === "/") {
        if (isAuthed) {
          tasks.push(utils.user.getMe.prefetch());
          tasks.push(utils.transactions.getMyHistory.prefetch({ limit: 10 }));
        }
        tasks.push(utils.marketplace.listItems.prefetch());
      } else if (pathname?.startsWith("/marketplace")) {
        tasks.push(utils.marketplace.listItems.prefetch());
        if (isAuthed) tasks.push(utils.marketplace.getMyInventory.prefetch());
      } else if (pathname?.startsWith("/admin")) {
        // Admin-heavy prefetches
        if (isAuthed) {
          tasks.push(
            (utils as any).admin.users.getUsers.prefetch({
              query: "",
              page: 1,
              limit: 20,
            })
          );
          tasks.push(
            (utils as any).admin.stats.getSystemBalances?.prefetch?.()
          );
        }
      }
    } catch (e) {
      // swallow
    }

    // Run in background
    Promise.allSettled(tasks).catch(() => {});
  }, [utils, pathname]);

  return null;
}
