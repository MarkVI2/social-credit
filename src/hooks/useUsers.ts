'use client';

import { trpc } from '@/trpc/client';

export function useUsers() {
  // Get all users (for recipient selection in transfers)
  const allUsersQuery = trpc.user.getAll.useQuery(undefined, {
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // Get user by ID
  const getUserById = (id: string) => {
    return trpc.user.getById.useQuery(
      { id },
      {
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
      }
    );
  };

  return {
    allUsers: allUsersQuery.data?.users || [],
    allUsersQuery,
    getUserById,
    isLoadingUsers: allUsersQuery.isLoading,
    usersError: allUsersQuery.error,
  };
}
