import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "../init";
import { AuctionSchema, Auction, Bid } from "../../models/auction";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { logTransaction } from "@/services/transactionService";

export const auctionRouter = createTRPCRouter({
  // Admin-only: create a new auction
  create: adminProcedure
    .input(
      z.object({
        itemName: z.string().min(3),
        itemDescription: z.string().optional(),
        itemImage: z.string().url().optional(),
        auctionType: z.enum(["english", "dutch"]),
        startTime: z.date(),
        endTime: z.date(),
        startingBid: z.number().positive().optional(),
        startingPrice: z.number().positive().optional(),
        reservePrice: z.number().positive().optional(),
        decrementAmount: z.number().positive().optional(),
        decrementInterval: z.number().positive().optional(),
        payoutToClassBank: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDatabase();
      const auctions = db.collection<Auction>("auctions");
      const doc: Auction = {
        _id: new ObjectId(),
        itemName: input.itemName,
        itemDescription: input.itemDescription,
        itemImage: input.itemImage,
        sellerId: ctx.user._id!,
        payoutToClassBank: input.payoutToClassBank,
        auctionType: input.auctionType,
        status: "active",
        startTime: input.startTime,
        endTime: input.endTime,
        startingBid: input.startingBid,
        currentBid: undefined,
        highestBidderId: undefined,
        bids: [],
        startingPrice: input.startingPrice,
        reservePrice: input.reservePrice,
        decrementAmount: input.decrementAmount,
        decrementInterval: input.decrementInterval,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
      await auctions.insertOne(doc as any);
      return { success: true, id: doc._id.toString() };
    }),

  // List auctions with optional status filter and cursor pagination
  list: publicProcedure
    .input(
      z.object({
        status: z.enum(["active", "completed"]).default("active"),
        limit: z.number().min(1).max(50).default(10),
        cursor: z.instanceof(ObjectId).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDatabase();
      const auctions = db.collection<Auction>("auctions");
      const users = db.collection<any>("userinformation");
      const filter: any = { status: input.status };
      if (input.cursor) {
        filter._id = { $gt: input.cursor };
      }
      const results = await auctions
        .find(filter)
        .sort({ _id: 1 })
        .limit(input.limit + 1)
        .toArray();
      const hasNext = results.length > input.limit;
      // raw items from DB
      const rawItems = results.slice(0, input.limit);
      const sellerIds: ObjectId[] = rawItems.map((a: Auction) => a.sellerId);
      const sellers = await users.find({ _id: { $in: sellerIds } }).toArray();
      const sellerMap = new Map(sellers.map((u) => [u._id.toString(), u]));
      const formatted = rawItems.map((a) => ({
        id: a._id.toString(),
        itemName: a.itemName,
        auctionType: a.auctionType,
        status: a.status,
        startTime: a.startTime,
        endTime: a.endTime,
        currentBid: a.currentBid,
        seller: {
          id: a.sellerId.toString(),
          username: sellerMap.get(a.sellerId.toString())?.username || null,
        },
      }));
      return {
        items: formatted,
        nextCursor: hasNext ? formatted[formatted.length - 1].id : null,
      };
    }),

  // Get a single auction by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDatabase();
      const auctions = db.collection<Auction>("auctions");
      const users = db.collection<any>("userinformation");

      const auc = await auctions.findOne<Auction>({
        _id: new ObjectId(input.id),
      });
      if (!auc) {
        throw new Error("Auction not found");
      }
      // Fetch seller
      const seller = await users.findOne({ _id: auc.sellerId });
      // Fetch highest bidder if exists
      let highestBidder = null;
      if (auc.highestBidderId) {
        highestBidder = await users.findOne({ _id: auc.highestBidderId });
      }
      // Fetch bid user details
      const bidUserIds: ObjectId[] = auc.bids.map((b: Bid) => b.userId);
      const uniqueIds: ObjectId[] = Array.from(
        new Set(bidUserIds.map((id: ObjectId) => id.toString()))
      ).map((idStr: string) => new ObjectId(idStr));
      const bidUsers = await users.find({ _id: { $in: uniqueIds } }).toArray();
      const userMap = new Map(bidUsers.map((u) => [u._id.toString(), u]));
      const bids = auc.bids.map((b: Bid) => ({
        amount: b.amount,
        timestamp: b.timestamp,
        user: {
          id: b.userId.toString(),
          username: userMap.get(b.userId.toString())?.username || null,
        },
      }));

      return {
        id: auc._id.toString(),
        itemName: auc.itemName,
        itemDescription: auc.itemDescription,
        itemImage: auc.itemImage,
        auctionType: auc.auctionType,
        status: auc.status,
        startTime: auc.startTime,
        endTime: auc.endTime,
        startingBid: auc.startingBid,
        currentBid: auc.currentBid,
        reservePrice: auc.reservePrice,
        seller: seller
          ? { id: seller._id.toString(), username: seller.username }
          : null,
        highestBidder: highestBidder
          ? {
              id: highestBidder._id.toString(),
              username: highestBidder.username,
            }
          : null,
        bids,
      };
    }),

  // Place a bid on an English auction
  placeBid: protectedProcedure
    .input(
      z.object({
        auctionId: z.string(),
        bidAmount: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Implementation pending
      return { success: true, message: "Bid placed (implementation pending)." };
    }),

  // Claim a Dutch auction immediately
  claimDutchAuction: protectedProcedure
    .input(z.object({ auctionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Implementation pending
      return {
        success: true,
        message: "Auction claimed (implementation pending).",
      };
    }),

  // Settle auction: transfer credits from winner to host or class bank
  settle: protectedProcedure
    .input(
      z.object({
        auctionId: z.string(),
        useClassBank: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDatabase();
      const auctions = db.collection<Auction>("auctions");
      const users = db.collection<any>("userinformation");
      const system = db.collection("systemAccounts");

      const auc = await auctions.findOne({
        _id: new ObjectId(input.auctionId),
      });
      if (!auc || !auc.highestBidderId || !auc.currentBid) {
        throw new Error("Invalid auction or no bids");
      }
      const winnerId = auc.highestBidderId;
      const amount = auc.currentBid;
      const sellerId = auc.sellerId;

      // Fetch users
      const winner = await users.findOne({ _id: winnerId });
      const seller = await users.findOne({ _id: sellerId });
      if (!winner) throw new Error("Winner not found");

      // Determine recipients
      let to: string;
      const payToClassBank = input.useClassBank || auc.payoutToClassBank;
      if (payToClassBank) {
        to = "classBank";
      } else {
        to =
          seller?.username || ctx.user.username || ctx.user.email || "unknown";
      }
      const from = winner.username;

      // Perform transfer
      // Deduct from winner
      await users.updateOne({ _id: winnerId }, { $inc: { credits: -amount } });
      // Credit to recipient
      if (to === "classBank") {
        await system.updateOne(
          { accountType: "classBank" },
          { $inc: { balance: amount }, $set: { lastUpdated: new Date() } },
          { upsert: true }
        );
      } else {
        const recip = await users.findOne({ username: to });
        if (recip)
          await users.updateOne(
            { _id: recip._id },
            { $inc: { credits: amount } }
          );
      }

      // Log transaction
      await logTransaction({
        from,
        to,
        amount,
        reason: `Auction settlement for ${input.auctionId}`,
        timestamp: new Date(),
        type: "auction_settlement",
      });
      // Update auction status to completed
      await auctions.updateOne(
        { _id: new ObjectId(input.auctionId) },
        { $set: { status: "completed" } }
      );
      // Record auction transaction
      const transactions = db.collection<any>("auctionTransactions");
      const ticketId = `AUC-TKT-${new ObjectId().toString()}`;
      await transactions.insertOne({
        _id: new ObjectId(),
        ticketId,
        auctionId: new ObjectId(input.auctionId),
        itemName: auc.itemName,
        winnerId: winnerId,
        sellerId: sellerId,
        finalPrice: amount,
        completedAt: new Date(),
      });

      return { success: true };
    }),
});
