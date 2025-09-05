import { z } from "zod";
import { createTRPCRouter, publicProcedure, adminProcedure } from "../init";
import { getDatabase } from "@/lib/mongodb";
import { MarketplaceItemSchema } from "@/models/marketplace";
import { ObjectId } from "mongodb";
import { protectedProcedure } from "../init";
import { broadcastLeaderboardUpdate } from "./leaderboardRouter";

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
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDatabase();
      const coll = db.collection("marketplaceItems");

      const now = new Date();
      const itemId = new ObjectId().toHexString();
      const doc = {
        itemId,
        name: input.name,
        description: input.description,
        price: input.price,
        imageUrl: input.imageUrl,
        sku: input.sku,
        createdAt: now,
        updatedAt: now,
      };

      const res = await coll.insertOne(doc);
      const created = { _id: res.insertedId, ...doc };
      // Validate against schema for consistency
      MarketplaceItemSchema.parse(created);
      return { success: true, item: created };
    }),

  // Public: list all marketplace items
  listItems: publicProcedure.query(async () => {
    const db = await getDatabase();
    const items = await db
      .collection("marketplaceItems")
      .find({}, { sort: { createdAt: -1 } })
      .toArray();
    // Optionally validate
    // items.forEach((i) => MarketplaceItemSchema.parse(i));
    return items.map((i: any) => ({
      id: i.itemId ?? i._id?.toString?.(),
      name: i.name,
      description: i.description,
      price: i.price,
      imageUrl: i.imageUrl,
      sku: i.sku,
      category: i.category,
      order: i.order,
    }));
  }),

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

      // Check for sequential rank unlocking
      if (item.category === "rank" && item.order > 1) {
        const requiredRankOrder = item.order - 1;
        const allRanks = await items.find({ category: "rank" }).toArray();
        const requiredRank = allRanks.find(
          (r) => r.order === requiredRankOrder
        );
        if (requiredRank) {
          const hasRequiredRank = await inventory.findOne({
            userId: ctx.user._id,
            itemId: requiredRank.itemId,
          });
          if (!hasRequiredRank) {
            throw new Error(
              `You must own ${requiredRank.name} to purchase ${item.name}.`
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
      await users.updateOne(
        { _id: ctx.user._id },
        { $inc: { credits: -price }, $set: { updatedAt: new Date() } }
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

      // Update live leaderboard since user credits changed
      try {
        // Log as a marketplace purchase for downstream analytics
        const from = me.username || me.email || "";
        await db.collection("transactionHistory").insertOne({
          from,
          to: "classBank",
          amount: price,
          reason: `Purchase: ${item.name}`,
          timestamp: new Date(),
          type: "marketplace_purchase",
          itemId: item.itemId,
          itemName: item.name,
          purchaser: from,
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
