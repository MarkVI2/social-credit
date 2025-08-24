import { z } from "zod";
import { ObjectId } from "mongodb";

// Schema for a single bid entry in an English auction's history.
const BidSchema = z.object({
  userId: z.instanceof(ObjectId),
  amount: z.number().positive(),
  timestamp: z.date(),
});

// Main schema for the 'auctions' collection.
// It handles both 'english' and 'dutch' auction types.
export const AuctionSchema = z.object({
  _id: z.instanceof(ObjectId),
  itemName: z.string().min(3),
  itemDescription: z.string().optional(),
  itemImage: z.string().url().optional(),
  sellerId: z.instanceof(ObjectId),
  // If true, settlement will route proceeds to system classBank instead of seller
  payoutToClassBank: z.boolean().optional(),
  auctionType: z.enum(["english", "dutch"]),
  status: z.enum(["active", "completed", "cancelled"]).default("active"),
  startTime: z.date(),
  endTime: z.date(), // Primarily for English auctions

  // English Auction Fields
  startingBid: z.number().positive().optional(),
  currentBid: z.number().positive().optional(),
  highestBidderId: z.instanceof(ObjectId).optional(),
  bids: z.array(BidSchema).default([]),

  // Dutch Auction Fields
  startingPrice: z.number().positive().optional(),
  reservePrice: z.number().positive().optional(),
  decrementAmount: z.number().positive().optional(),
  decrementInterval: z.number().positive().optional(), // in seconds

  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Schema for the 'auctionTransactions' collection for auditing.
export const AuctionTransactionSchema = z.object({
  _id: z.instanceof(ObjectId),
  ticketId: z.string(), // e.g., "AUC-TKT-..."
  auctionId: z.instanceof(ObjectId),
  itemName: z.string(),
  winnerId: z.instanceof(ObjectId),
  sellerId: z.instanceof(ObjectId),
  finalPrice: z.number().positive(),
  completedAt: z.date(),
});

// Infer TypeScript types from the Zod schemas.
export type Auction = z.infer<typeof AuctionSchema>;
export type AuctionTransaction = z.infer<typeof AuctionTransactionSchema>;
export type Bid = z.infer<typeof BidSchema>;
