'use client';

import { trpc } from '@/trpc/client';
import { useAuth } from './useAuth';

export function useTransactions() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  // Transfer credits mutation
  const transferMutation = trpc.transactions.transfer.useMutation({
    onSuccess: () => {
      // Invalidate related queries on successful transfer
      utils.user.getMe.invalidate();
      utils.leaderboard.getLeaderboard.invalidate();
      utils.transactions.getMyHistory.invalidate();
    },
    onError: (error) => {
      console.error('Transfer failed:', error);
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
      throw new Error('Must be authenticated to transfer credits');
    }

    return transferMutation.mutateAsync({
      to,
      reason: reason || '',
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
