'use client';

import { trpc } from '@/trpc/client';

export function useLeaderboard() {
  return trpc.leaderboard.getLeaderboard.useQuery(undefined, {
    refetchInterval: 60 * 1000, // Auto-refresh every minute
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
