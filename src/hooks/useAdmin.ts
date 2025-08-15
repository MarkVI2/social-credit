'use client';

import { trpc } from '@/trpc/client';
import { useAuth } from './useAuth';

export function useAdmin() {
  const { isAdmin } = useAuth();

  // Admin activity/logs
  const getActivity = (cursor: number = 0, limit: number = 50) => {
    return trpc.admin.activity.getActivityLogs.useQuery(
      { cursor, limit },
      {
        enabled: isAdmin,
        staleTime: 30 * 1000, // 30 seconds
      }
    );
  };

  // Admin users management
  const getUsers = (query: string = '', page: number = 1, limit: number = 20) => {
    return trpc.admin.users.getUsers.useQuery(
      { query, page, limit },
      {
        enabled: isAdmin,
        staleTime: 60 * 1000, // 1 minute
      }
    );
  };

  const trpcUtils = trpc.useUtils();

  // Update user credits
  const updateCredits = trpc.admin.credits.updateCredits.useMutation({
    onSuccess: () => {
      // Invalidate related queries
      trpcUtils.admin.users.getUsers.invalidate();
      trpcUtils.leaderboard.getLeaderboard.invalidate();
    },
  });

  // Initialize class bank
  const initClassBank = trpc.admin.classbank.initClassBank.useMutation({
    onSuccess: () => {
      // Invalidate user queries
      trpcUtils.admin.users.getUsers.invalidate();
    },
  });

  // Bulk operations
  const bulkUpdateCredits = async (updates: { 
    targetUserId: string; 
    amount: number;
    sourceAccount: 'admin' | 'classBank';
    reason: string;
  }[]) => {
    const results = await Promise.allSettled(
      updates.map(update => 
        updateCredits.mutateAsync({
          targetUserId: update.targetUserId,
          amount: update.amount,
          sourceAccount: update.sourceAccount,
          reason: update.reason,
        })
      )
    );
    
    return results;
  };

  return {
    // Queries
    getActivity,
    getUsers,
    
    // Mutations
    updateCredits,
    initClassBank,
    bulkUpdateCredits,
    
    // States
    isUpdatingCredits: updateCredits.isPending,
    isInitializingBank: initClassBank.isPending,
    updateCreditsError: updateCredits.error,
    initBankError: initClassBank.error,
    
    // Auth
    isAdmin,
  };
}
