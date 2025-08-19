import { z } from 'zod';
import { adminProcedure, createTRPCRouter } from '../../init';
import { getDatabase } from '@/lib/mongodb';
import type { User } from '@/types/user';

export const adminUsersRouter = createTRPCRouter({
  // Get all users with pagination and search (admin only)
  getUsers: adminProcedure
    .input(
      z.object({
        query: z.string().optional().default(''),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      try {
        const { query, page, limit } = input;
        const skip = (page - 1) * limit;

        const db = await getDatabase();
        const coll = db.collection<User>('userinformation');

        const filter = query.trim()
          ? {
              $or: [
                { username: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
              ],
            }
          : {};

        const [items, total] = await Promise.all([
          coll
            .find(filter, {
              projection: { _id: 1, username: 1, email: 1, credits: 1, role: 1 },
            })
            .skip(skip)
            .limit(limit)
            .toArray(),
          coll.countDocuments(filter),
        ]);

        return { success: true, items, total, page, limit };
      } catch (error) {
        console.error('Admin users list error', error);
        throw new Error('Internal server error');
      }
    }),

  // Update user role (admin only)
  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1, 'User ID is required'),
        role: z.enum(['user', 'admin']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { ObjectId } = await import('mongodb');
        const db = await getDatabase();
        const coll = db.collection<User>('userinformation');

        // Prevent admin from removing their own admin role
        if (input.userId === ctx.user._id?.toString() && input.role !== 'admin') {
          throw new Error('Cannot remove your own admin privileges');
        }

        const result = await coll.updateOne(
          { _id: new ObjectId(input.userId) },
          { 
            $set: { 
              role: input.role, 
              updatedAt: new Date() 
            } 
          }
        );

        if (result.matchedCount === 0) {
          throw new Error('User not found');
        }

        return {
          success: true,
          message: `User role updated to ${input.role}`,
        };
      } catch (error) {
        console.error('Error updating user role:', error);
        throw new Error(error instanceof Error ? error.message : 'Error updating user role');
      }
    }),

  // Delete user (admin only)
  deleteUser: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1, 'User ID is required'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { ObjectId } = await import('mongodb');
        
        // Prevent admin from deleting themselves
        if (input.userId === ctx.user._id?.toString()) {
          throw new Error('Cannot delete your own account');
        }

        const db = await getDatabase();
        const coll = db.collection<User>('userinformation');

        const result = await coll.deleteOne({ _id: new ObjectId(input.userId) });

        if (result.deletedCount === 0) {
          throw new Error('User not found');
        }

        return {
          success: true,
          message: 'User deleted successfully',
        };
      } catch (error) {
        console.error('Error deleting user:', error);
        throw new Error(error instanceof Error ? error.message : 'Error deleting user');
      }
    }),
});

export type AdminUsersRouter = typeof adminUsersRouter;