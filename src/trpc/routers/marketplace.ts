import { z } from "zod";
import { createTRPCRouter, publicProcedure, adminProcedure } from "../init";
import { getDatabase } from "@/lib/mongodb";
import { MarketplaceItemSchema } from "@/models/marketplace";
import { ObjectId } from "mongodb";
import { protectedProcedure } from "../init";
import { broadcastLeaderboardUpdate } from "./leaderboardRouter";
import { logTransaction } from "@/services/transactionService";
import { classifyItem } from "@/lib/marketplaceUtils";
import {
  calculateCourseCredits,
  calculateRawScore,
  IGNORED_USERS_FOR_GLOBAL_MAX,
} from "@/lib/ranks";
import {
  getGlobalStats,
  updateGlobalStatsDelta,
} from "@/services/configService";

export const marketplaceRouter = createTRPCRouter({
  // Admin only: create a marketplace item
  createItem: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().positive(),
        imageUrl: z.string().url().optional(),
        sku: z.string().min(1).optional(),
        category: z.enum(["rank", "utility"]).optional(),
        order: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDatabase();
      const coll = db.collection("marketplaceItems");

      const now = new Date();
      const itemId = new ObjectId().toHexString();
      const doc: any = {
        itemId,
        name: input.name,
        description: input.description,
        price: input.price,
        imageUrl: input.imageUrl,
        sku: input.sku,
        createdAt: now,
        updatedAt: now,
      };
      // Apply classification if provided or derive from sku/name
      if (input.category) doc.category = input.category;
      if (input.order) doc.order = input.order;
      if (!doc.category) {
        const cls = classifyItem(doc);
        doc.category = cls.category;
        if (cls.order) doc.order = cls.order;
      }

      const res = await coll.insertOne(doc);
      const created = { _id: res.insertedId, ...doc };
      // Validate against schema for consistency
      MarketplaceItemSchema.parse(created);
      return { success: true, item: created };
    }),

  // Public: list all marketplace items
  listItems: publicProcedure.query(
    async (): Promise<
      Array<{
        id: string;
        name: string;
        description?: string;
        price: number;
        imageUrl?: string;
        sku?: string;
        category?: "rank" | "utility";
        order?: number;
      }>
    > => {
      const db = await getDatabase();
      const items = await db
        .collection("marketplaceItems")
        .find({}, { sort: { createdAt: -1 } })
        .toArray();
      return items.map((i: any) => {
        const cls = classifyItem(i);
        // Optionally validate with augmented fields
        try {
          MarketplaceItemSchema.parse({
            ...i,
            category: cls.category,
            order: cls.order,
          });
        } catch {}
        return {
          id: i.itemId ?? i._id?.toString?.(),
          name: i.name,
          description: i.description,
          price: i.price,
          imageUrl: i.imageUrl,
          sku: i.sku,
          category: cls.category ?? i.category,
          order: cls.order ?? i.order,
        };
      });
    }
  ),

  // Protected: purchase an item -> deduct credits and add to user inventory
  purchaseItem: protectedProcedure
    .input(z.object({ itemId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDatabase();
      const items = db.collection("marketplaceItems");
      const users = db.collection("userinformation");
      const system = db.collection("systemAccounts");
      const inventory = db.collection("userInventory");

      let byId: ObjectId | undefined = undefined;
      try {
        byId = new ObjectId(input.itemId);
      } catch {
        byId = undefined;
      }
      const item = await items.findOne({
        $or: [{ itemId: input.itemId }, ...(byId ? [{ _id: byId }] : [])],
      });
      if (!item) throw new Error("Item not found");
      const price = Number(item.price || 0);

      // Ensure user has enough credits
      const me = await users.findOne({ _id: ctx.user._id });
      if (!me) throw new Error("User not found");
      if (me.isFrozen)
        throw new Error("Your account is frozen by an administrator.");
      if (me.timeoutUntil && new Date(me.timeoutUntil).getTime() > Date.now()) {
        throw new Error("You are on timeout and cannot purchase right now.");
      }
      if ((me.credits || 0) < price) throw new Error("Insufficient credits");

      // Derive classification if missing and enforce sequential rank unlocking
      const cls = classifyItem(item);
      if (cls.category === "rank") {
        // Fetch all rank items and sort by increasing order (min threshold)
        const allDocs = await items.find({}).toArray();
        const orderedRanks = allDocs
          .filter((r) => classifyItem(r).category === "rank")
          .sort(
            (a, b) =>
              (classifyItem(a).order ?? 0) - (classifyItem(b).order ?? 0)
          );
        const idx = orderedRanks.findIndex((r) => r.itemId === item.itemId);
        if (idx > 0) {
          const requiredPrev = orderedRanks[idx - 1];
          const hasPrev = await inventory.findOne({
            userId: ctx.user._id,
            itemId: requiredPrev.itemId,
          });
          if (!hasPrev) {
            throw new Error(
              `You must own ${requiredPrev.name} to purchase ${item.name}.`
            );
          }
        }
      }

      // Check if user already owns the item
      const existingInventoryItem = await inventory.findOne({
        userId: ctx.user._id,
        itemId: item.itemId,
      });

      if (existingInventoryItem) {
        // Item already exists, so we don't add it again.
        return { success: true, message: "Item already in inventory." };
      }

      // Deduct and add to inventory atomically-ish; then credit class bank
      const oldSpent = me.spentLifetime ?? 0;
      const newSpentLifetime = oldSpent + price;
      const earned = me.earnedLifetime ?? 20;

      const oldRawScore = calculateRawScore(earned, oldSpent);
      const newRawScore = calculateRawScore(earned, newSpentLifetime);

      // Dynamic Course Credits Calculation
      const isIgnored =
        IGNORED_USERS_FOR_GLOBAL_MAX.includes(me.username) ||
        IGNORED_USERS_FOR_GLOBAL_MAX.includes(me.email);

      if (!isIgnored) {
        await updateGlobalStatsDelta(oldRawScore, newRawScore);
      }

      const { mean, stdDev } = await getGlobalStats();

      const newCourseCredits = calculateCourseCredits(
        earned,
        newSpentLifetime,
        mean,
        stdDev
      );

      await users.updateOne(
        { _id: ctx.user._id },
        {
          $inc: { credits: -price, spentLifetime: price },
          $set: {
            updatedAt: new Date(),
            courseCredits: newCourseCredits,
          },
        }
      );
      await inventory.insertOne({
        _id: new ObjectId(),
        userId: ctx.user._id,
        itemId: item.itemId,
        sku: item.sku,
        name: item.name,
        description: item.description,
        acquiredAt: new Date(),
      });
      await system.updateOne(
        { accountType: "classBank" },
        { $inc: { balance: price }, $set: { lastUpdated: new Date() } },
        { upsert: true }
      );

      // Update live leaderboard since user credits changed and log transaction (with anonymity applied if active)
      try {
        const from = me.username || me.email || "";
        await logTransaction({
          from,
          to: "classBank",
          amount: price,
          reason: `Purchase: ${item.name}`,
          timestamp: new Date(),
          type: "marketplace_purchase",
          // message will be built inside logTransaction
        });
        broadcastLeaderboardUpdate();
      } catch {}
      return { success: true };
    }),

  // Protected: get current user's inventory
  getMyInventory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDatabase();
    const inventory = db.collection("userInventory");
    const items = await inventory
      .find({ userId: ctx.user._id }, { sort: { acquiredAt: -1 } })
      .toArray();
    return items.map((i: any) => ({
      id: i._id?.toString?.(),
      itemId: i.itemId,
      sku: i.sku,
      name: i.name,
      description: i.description,
      acquiredAt: i.acquiredAt,
    }));
  }),
});

export type MarketplaceRouter = typeof marketplaceRouter;
