"use client";

import { trpc } from "@/trpc/client";
import { useAuth } from "./useAuth";

export function useTransactions() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  // Transfer credits mutation
  const transferMutation = trpc.transactions.transfer.useMutation({
    // Optimistic update for snappier UI
    async onMutate(variables) {
      const amount = 2;
      await Promise.all([
        utils.user.getMe.cancel(),
        utils.transactions.getMyHistory.cancel({ limit: 10 }),
        utils.transactions.getHistory.cancel({ limit: 10 }),
      ]);

      const prevMe = utils.user.getMe.getData();
      const prevMyHistory = utils.transactions.getMyHistory.getData({
        limit: 10,
      });
      const prevGlobal = utils.transactions.getHistory.getData({ limit: 10 });

      // Optimistically decrement current user's balance
      if (prevMe?.user) {
        utils.user.getMe.setData(undefined, (old) => {
          if (!old?.user) return old ?? (null as any);
          return {
            ...old,
            user: {
              ...old.user,
              credits: Math.max(0, (old.user.credits || 0) - amount),
            },
          } as any;
        });
      }

      // Optimistically prepend to my history
      if (prevMyHistory?.items) {
        const now = new Date();
        const currentUser = prevMe?.user;
        const optimisticItem = {
          timestamp: now,
          from: (currentUser?.username || currentUser?.email || "") as string,
          to: variables.to,
          amount,
          reason: variables.reason || "",
        } as any;
        utils.transactions.getMyHistory.setData({ limit: 10 }, (old) => {
          if (!old?.items) return old ?? (null as any);
          return {
            ...old,
            items: [optimisticItem, ...old.items].slice(0, 10),
          } as any;
        });
      }

      // Optimistically prepend to global history feed if present
      if (prevGlobal?.items) {
        const now = new Date();
        const currentUser = prevMe?.user;
        const optimisticGlobal = {
          timestamp: now,
          from: (currentUser?.username || currentUser?.email || "") as string,
          to: variables.to,
          amount,
          reason: variables.reason || "",
        } as any;
        utils.transactions.getHistory.setData({ limit: 10 }, (old) => {
          if (!old?.items) return old ?? (null as any);
          return {
            ...old,
            items: [optimisticGlobal, ...old.items].slice(0, 10),
          } as any;
        });
      }

      return { prevMe, prevMyHistory, prevGlobal };
    },
    onError: (error, _vars, ctx) => {
      console.error("Transfer failed:", error);
      // Rollback on error
      if (ctx?.prevMe) utils.user.getMe.setData(undefined, ctx.prevMe as any);
      if (ctx?.prevMyHistory)
        utils.transactions.getMyHistory.setData(
          { limit: 10 },
          ctx.prevMyHistory as any
        );
      if (ctx?.prevGlobal)
        utils.transactions.getHistory.setData(
          { limit: 10 },
          ctx.prevGlobal as any
        );
    },
    onSettled: async () => {
      // Ensure we refetch to reconcile with server state
      await Promise.all([
        utils.user.getMe.invalidate(),
        utils.leaderboard.getLeaderboard.invalidate(),
        utils.transactions.getMyHistory.invalidate(),
        utils.transactions.getHistory.invalidate(),
      ]);
    },
  });

  // Get user's transaction history
  const transactionHistory = trpc.transactions.getMyHistory.useQuery(
    { limit: 10 },
    {
      enabled: isAuthenticated,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  // Get global transaction history (public)
  const getGlobalHistory = (limit: number = 10) => {
    return trpc.transactions.getHistory.useQuery(
      { limit },
      {
        staleTime: 1 * 60 * 1000, // 1 minute
      }
    );
  };

  // Get specific user's transaction history
  const getUserHistory = (userId: string, limit: number = 10) => {
    return trpc.transactions.getHistory.useQuery(
      { userId, limit },
      {
        enabled: !!userId,
        staleTime: 2 * 60 * 1000, // 2 minutes
      }
    );
  };

  const transfer = async (to: string, reason?: string) => {
    if (!isAuthenticated) {
      throw new Error("Must be authenticated to transfer credits");
    }

    return transferMutation.mutateAsync({
      to,
      reason: reason || "",
    });
  };

  return {
    transfer,
    transferMutation,
    transactionHistory,
    getGlobalHistory,
    getUserHistory,
    isTransferring: transferMutation.isPending,
    transferError: transferMutation.error,
    isLoadingHistory: transactionHistory.isLoading,
    historyError: transactionHistory.error,
  };
}
