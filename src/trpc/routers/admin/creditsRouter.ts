import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "../../init";
import { getDatabase } from "@/lib/mongodb";
import { logTransaction } from "@/services/transactionService";
import { recordActivity } from "@/services/logService";
import {
  buildAdminGiveMessage,
  buildAdminTakeMessage,
} from "@/services/messageTemplates";
import clientPromise from "@/lib/mongodb";
import type { User } from "@/types/user";
import { ObjectId } from "mongodb";
import { broadcastLeaderboardUpdate } from "../leaderboardRouter";
import { getVanityRank } from "@/lib/ranks";

// Type for system accounts
interface SystemAccount {
  _id: string;
  balance: number;
  updatedAt: Date;
}

export const creditsRouter = createTRPCRouter({
  // Update user credits (admin only)
  updateCredits: adminProcedure
    .input(
      z.object({
        targetUserId: z.string().min(1, "Target user ID is required"),
        amount: z
          .number()
          .refine(
            (val) => Number.isFinite(val) && val !== 0,
            "Amount must be a non-zero finite number"
          ),
        sourceAccount: z.enum(["admin", "classBank"]),
        reason: z.string().min(1, "Reason is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { targetUserId, amount, sourceAccount, reason } = input;
      const me = ctx.user;

      const db = await getDatabase();
      const users = db.collection<User>("userinformation");
      const system = db.collection<SystemAccount>("systemAccounts");

      const target = await users.findOne({ _id: new ObjectId(targetUserId) });
      if (!target) {
        throw new Error("User not found");
      }

      // Normalize operation: positive amount means credit to target; negative means deduction from target
      // For admin source, deduct from admin when crediting user; for classBank, deduct from class bank when crediting user.

      const client = await clientPromise;
      const session = client.startSession();

      try {
        let ok = false;
        await session.withTransaction(async () => {
          if (sourceAccount === "admin") {
            const adminQuery = { _id: me._id as ObjectId };
            if (amount > 0) {
              // deduct from admin, credit to user
              const dec = await users.updateOne(
                { ...adminQuery, credits: { $gte: amount } },
                { $inc: { credits: -amount }, $set: { updatedAt: new Date() } },
                { session }
              );
              if (dec.matchedCount !== 1) {
                throw new Error("Insufficient admin balance");
              }
              const newLifetime =
                (target.earnedLifetime ?? target.credits ?? 0) + amount;
              const newRank = getVanityRank(newLifetime);
              const inc = await users.updateOne(
                { _id: target._id },
                {
                  $inc: { credits: amount },
                  $set: {
                    updatedAt: new Date(),
                    earnedLifetime: newLifetime,
                    rank: newRank,
                  },
                },
                { session }
              );
              if (inc.matchedCount !== 1) {
                throw new Error("Failed to credit target");
              }
            } else {
              // deduction from target goes to admin
              const abs = Math.abs(amount);
              const dec = await users.updateOne(
                { _id: target._id, credits: { $gte: abs } },
                { $inc: { credits: -abs }, $set: { updatedAt: new Date() } },
                { session }
              );
              if (dec.matchedCount !== 1) {
                throw new Error("Insufficient user balance");
              }
              const inc = await users.updateOne(
                adminQuery,
                { $inc: { credits: abs }, $set: { updatedAt: new Date() } },
                { session }
              );
              if (inc.matchedCount !== 1) {
                throw new Error("Failed to credit admin");
              }
            }
          } else {
            // classBank source
            const classBankQuery = { _id: "classBank" };
            if (amount > 0) {
              // deduct from class bank, credit to user
              const dec = await system.updateOne(
                { ...classBankQuery, balance: { $gte: amount } },
                { $inc: { balance: -amount }, $set: { updatedAt: new Date() } },
                { session }
              );
              if (dec.matchedCount !== 1) {
                throw new Error("Insufficient class bank balance");
              }
              const newLifetime =
                (target.earnedLifetime ?? target.credits ?? 0) + amount;
              const newRank = getVanityRank(newLifetime);
              const inc = await users.updateOne(
                { _id: target._id },
                {
                  $inc: { credits: amount },
                  $set: {
                    updatedAt: new Date(),
                    earnedLifetime: newLifetime,
                    rank: newRank,
                  },
                },
                { session }
              );
              if (inc.matchedCount !== 1) {
                throw new Error("Failed to credit target");
              }
            } else {
              // deduction from target goes to class bank
              const abs = Math.abs(amount);
              const dec = await users.updateOne(
                { _id: target._id, credits: { $gte: abs } },
                { $inc: { credits: -abs }, $set: { updatedAt: new Date() } },
                { session }
              );
              if (dec.matchedCount !== 1) {
                throw new Error("Insufficient user balance");
              }
              const inc = await system.updateOne(
                classBankQuery,
                { $inc: { balance: abs }, $set: { updatedAt: new Date() } },
                { session }
              );
              if (inc.matchedCount !== 1) {
                throw new Error("Failed to credit class bank");
              }
            }
          }
          ok = true;
        });

        if (!ok) {
          throw new Error("Transaction failed");
        }

        // Log the transaction and activity
        const message =
          amount > 0
            ? buildAdminGiveMessage({
                admin: me.username || me.email || "admin",
                user: target.username || target.email || "",
                credits: amount,
              })
            : buildAdminTakeMessage({
                admin: me.username || me.email || "admin",
                user: target.username || target.email || "",
                credits: Math.abs(amount),
              });

        await logTransaction({
          from:
            amount > 0
              ? sourceAccount === "admin"
                ? me.username || me.email || ""
                : "classBank"
              : target.username || target.email || "",
          to:
            amount > 0
              ? target.username || target.email || ""
              : sourceAccount === "admin"
              ? me.username || me.email || ""
              : "classBank",
          amount: Math.abs(amount),
          reason,
          timestamp: new Date(),
        });

        await recordActivity({
          type: "admin",
          action: amount > 0 ? "mint" : "burn",
          data: {
            admin: me.username || me.email,
            user: target.username || target.email,
            amount: Math.abs(amount),
            sourceAccount,
            reason,
          },
          message,
        });

        // Broadcast leaderboard update since credits changed
        broadcastLeaderboardUpdate();

        return {
          success: true,
          message: `Successfully ${
            amount > 0 ? "granted" : "deducted"
          } ${Math.abs(amount)} credits`,
        };
      } finally {
        await session.endSession();
      }
    }),

  // Get system account balances (admin only)
  getSystemBalances: adminProcedure.query(async () => {
    try {
      const db = await getDatabase();
      const system = db.collection<SystemAccount>("systemAccounts");
      const users = db.collection<User>("userinformation");

      const classBankAccount = await system.findOne({ _id: "classBank" });
      const totalUserCredits = await users
        .aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: { $ifNull: ["$credits", 0] } },
            },
          },
        ])
        .toArray();

      return {
        success: true,
        classBankBalance: classBankAccount?.balance || 0,
        totalUserCredits: totalUserCredits[0]?.total || 0,
      };
    } catch (error) {
      console.error("Error fetching system balances:", error);
      throw new Error("Error fetching system balances");
    }
  }),

  // Reset all user credits (admin only)
  resetAllCredits: adminProcedure
    .input(
      z.object({
        newAmount: z.number().min(0).default(0),
        reason: z.string().min(1, "Reason is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDatabase();
        const users = db.collection<User>("userinformation");

        const result = await users.updateMany(
          {},
          {
            $set: {
              credits: input.newAmount,
              updatedAt: new Date(),
            },
          }
        );

        await recordActivity({
          type: "admin",
          action: "reset_credits",
          data: {
            admin: ctx.user.username || ctx.user.email,
            newAmount: input.newAmount,
            reason: input.reason,
            affectedUsers: result.modifiedCount,
          },
          message: `Admin ${
            ctx.user.username || ctx.user.email
          } reset all user credits to ${input.newAmount}. Reason: ${
            input.reason
          }`,
        });

        // Broadcast leaderboard update since all credits changed
        broadcastLeaderboardUpdate();

        return {
          success: true,
          message: `Reset ${result.modifiedCount} user accounts to ${input.newAmount} credits`,
          affectedUsers: result.modifiedCount,
        };
      } catch (error) {
        console.error("Error resetting credits:", error);
        throw new Error("Error resetting credits");
      }
    }),
});

export type CreditsRouter = typeof creditsRouter;
