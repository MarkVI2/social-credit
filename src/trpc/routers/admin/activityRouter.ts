import { z } from 'zod';
import { adminProcedure, createTRPCRouter } from '../../init';
import { listActivity } from '@/services/logService';

export const activityRouter = createTRPCRouter({
  // Get activity logs (admin only)
  getActivityLogs: adminProcedure
    .input(
      z.object({
        cursor: z.number().min(0).default(0),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      try {
        const { cursor, limit } = input;
        const { items, total } = await listActivity({ skip: cursor, limit });
        
        return {
          success: true,
          items,
          total,
          cursor,
          limit,
          nextCursor: cursor + items.length,
        };
      } catch (error) {
        console.error('Activity API error', error);
        throw new Error('Internal server error');
      }
    }),
});

export type ActivityRouter = typeof activityRouter;