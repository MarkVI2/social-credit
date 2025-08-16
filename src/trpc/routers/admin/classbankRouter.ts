import { z } from 'zod';
import { adminProcedure, createTRPCRouter } from '../../init';
import { getDatabase } from '@/lib/mongodb';

export const classbankRouter = createTRPCRouter({
  // Initialize class bank (admin only)
  initClassBank: adminProcedure.mutation(async () => {
    try {
      const db = await getDatabase();
      const system = db.collection('systemAccounts');
      
      const existing = await system.findOne({ accountType: 'classBank' });
      if (!existing) {
        await system.insertOne({
          accountType: 'classBank',
          balance: 1000,
          lastUpdated: new Date(),
        });
        return { success: true, created: true };
      }
      
      return {
        success: true,
        created: false,
        balance: existing.balance,
      };
    } catch (error) {
      console.error('Error initializing class bank:', error);
      throw new Error('Error initializing class bank');
    }
  }),

  // Get class bank status
  getClassBankStatus: adminProcedure.query(async () => {
    try {
      const db = await getDatabase();
      const system = db.collection('systemAccounts');
      
      const classBank = await system.findOne({ accountType: 'classBank' });
      
      return {
        success: true,
        exists: !!classBank,
        balance: classBank?.balance || 0,
        lastUpdated: classBank?.lastUpdated,
      };
    } catch (error) {
      console.error('Error getting class bank status:', error);
      throw new Error('Error getting class bank status');
    }
  }),

  // Add funds to class bank (admin only)
  addFunds: adminProcedure
    .input(
      z.object({
        amount: z.number().positive('Amount must be positive'),
        reason: z.string().min(1, 'Reason is required'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDatabase();
        const system = db.collection('systemAccounts');
        
        const result = await system.updateOne(
          { accountType: 'classBank' },
          { 
            $inc: { balance: input.amount },
            $set: { lastUpdated: new Date() }
          },
          { upsert: true }
        );
        console.log('Update result:', result);

        return {
          success: true,
          message: `Added ${input.amount} credits to class bank`,
        };
      } catch (error) {
        console.error('Error adding funds to class bank:', error);
        throw new Error('Error adding funds to class bank');
      }
    }),
});

export type ClassbankRouter = typeof classbankRouter;