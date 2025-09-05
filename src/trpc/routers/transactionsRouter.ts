import { z } from "zod";
import { publicProcedure, protectedProcedure, createTRPCRouter } from "../init";
import { getDatabase } from "@/lib/mongodb";
import { logTransaction } from "@/services/transactionService";
import { broadcastLeaderboardUpdate } from "./leaderboardRouter";
import { getVanityRank } from "@/lib/ranks";
import { ObjectId } from "mongodb";

export const transactionsRouter = createTRPCRouter({
  // Create a new transaction (transfer credits)
  transfer: protectedProcedure
    .input(
      z.object({
        to: z.string().min(1, "Recipient is required"),
        reason: z.string().optional().default(""),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const fromId = ctx.user.username || ctx.user.email;
      const toId = input.to.trim();
      const reason = input.reason.trim();

      if (fromId === toId) {
        throw new Error("Cannot send credits to yourself");
      }

      const db = await getDatabase();
      const coll = db.collection("userinformation");

      const toQuery = toId.includes("@")
        ? { email: toId.toLowerCase() }
        : { username: toId };

      const toUser = await coll.findOne(toQuery);
      if (!toUser) {
        throw new Error("Recipient not found");
      }

      // Server-side rate-limit: only one transaction every 2 minutes
      const txCol = db.collection("transactionHistory");
      const last = await txCol.findOne(
        { from: fromId },
        { sort: { timestamp: -1 }, projection: { timestamp: 1 } }
      );
      if (
        last?.timestamp instanceof Date &&
        Date.now() - last.timestamp.getTime() < 2 * 60 * 1000
      ) {
        throw new Error(
          "Rate limit exceeded. Only one transaction every 2 minutes."
        );
      }
      const amount = 2; // fixed amount per requirements

      // Debit sender (only if sufficient balance) and track spent lifetime
      const fromQuery = ctx.user.email
        ? { email: ctx.user.email }
        : { username: ctx.user.username };
      const dec = await coll.updateOne(
        { ...fromQuery, credits: { $gte: amount } },
        {
          $inc: { credits: -amount, spentLifetime: amount },
          $set: { updatedAt: new Date() },
        }
      );

      if (dec.matchedCount !== 1) {
        throw new Error("Insufficient balance");
      }

      // Credit recipient + increment lifetime and update rank
      const toDoc = await coll.findOne(toQuery);
      const newLifetime =
        (toDoc?.earnedLifetime ?? toDoc?.credits ?? 0) + amount;
      const newRank = getVanityRank(newLifetime);
      // Credit recipient and track received lifetime
      const inc = await coll.updateOne(toQuery, {
        $inc: { credits: amount, receivedLifetime: amount },
        $set: {
          updatedAt: new Date(),
          earnedLifetime: newLifetime,
          rank: newRank,
        },
      });

      if (inc.matchedCount !== 1) {
        // Try to revert debit in case credit failed
        await coll.updateOne(fromQuery, { $inc: { credits: amount } });
        throw new Error("Failed to credit recipient");
      }

      // Log transaction after completion
      await logTransaction({
        from: ctx.user.username || ctx.user.email || "",
        to: toUser.username || toUser.email || "",
        amount,
        reason,
        timestamp: new Date(),
      });

      // Broadcast leaderboard update since credits changed
      broadcastLeaderboardUpdate();

      return {
        success: true,
        message: "Transferred 2 credits",
        amount,
        reason,
      };
    }),

  // Get transaction history
  getHistory: publicProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        username: z.string().optional(),
        email: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDatabase();
      const tx = db.collection("transactionHistory");

      // If no filter is provided, return latest global transactions
      if (!input.userId && !input.username && !input.email) {
        const items = await tx
          .find({})
          .sort({ timestamp: -1 })
          .limit(input.limit)
          .toArray();
        return { success: true, items };
      }

      const users = db.collection<{ username?: string; email?: string }>(
        "userinformation"
      );

      // Resolve user by id/username/email
      let user: { username?: string; email?: string } | null = null;

      if (input.userId) {
        // Use ObjectId if valid, otherwise try username/email semantics
        const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(input.userId);
        if (isValidObjectId) {
          user = await users.findOne({ _id: new ObjectId(input.userId) });
        } else if (input.userId.includes("@")) {
          user = await users.findOne({ email: input.userId.toLowerCase() });
        } else {
          user = await users.findOne({ username: input.userId });
        }
      }

      if (!user && input.username) {
        user = await users.findOne({ username: input.username });
      }

      if (!user && input.email) {
        user = await users.findOne({ email: input.email.toLowerCase() });
      }

      if (!user) {
        throw new Error("User not found");
      }

      const username = user.username || user.email;
      const items = await tx
        .find({ $or: [{ from: username }, { to: username }] })
        .sort({ timestamp: -1 })
        .limit(input.limit)
        .toArray();

      return { success: true, items };
    }),

  // Get user's recent transactions (protected version)
  getMyHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDatabase();
      const tx = db.collection("transactionHistory");

      const username = ctx.user.username || ctx.user.email;
      const items = await tx
        .find({ $or: [{ from: username }, { to: username }] })
        .sort({ timestamp: -1 })
        .limit(input.limit)
        .toArray();

      return { success: true, items };
    }),
});

export type TransactionsRouter = typeof transactionsRouter;
