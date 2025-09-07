import { z } from "zod";
import { ObjectId } from "mongodb";

export const MarketplaceItemSchema = z.object({
  _id: z.instanceof(ObjectId),
  sku: z.string().min(1).optional(),
  itemId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  imageUrl: z.string().url().optional(),
  // Classification
  category: z.enum(["rank", "utility"]).optional(),
  order: z.number().int().positive().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type MarketplaceItem = z.infer<typeof MarketplaceItemSchema>;
