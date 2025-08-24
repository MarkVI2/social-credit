import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "../../init";
import { getDatabase } from "@/lib/mongodb";

export const transactionsAdminRouter = createTRPCRouter({
  // Paginated, searchable transaction history
  list: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(200).default(25),
        sender: z.string().optional(),
        receiver: z.string().optional(),
        type: z.string().optional(),
        from: z.date().optional(),
        to: z.date().optional(),
        q: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDatabase();
      const tx = db.collection("transactionHistory");
      const filter: any = {};
      if (input.sender) filter.from = input.sender;
      if (input.receiver) filter.to = input.receiver;
      if (input.type) filter.type = input.type;
      if (input.from)
        filter.timestamp = { ...(filter.timestamp || {}), $gte: input.from };
      if (input.to)
        filter.timestamp = { ...(filter.timestamp || {}), $lte: input.to };
      if (input.q) {
        filter.$or = [
          { from: { $regex: input.q, $options: "i" } },
          { to: { $regex: input.q, $options: "i" } },
          { reason: { $regex: input.q, $options: "i" } },
        ];
      }
      const skip = (input.page - 1) * input.pageSize;
      const cursor = tx.find(filter, {
        sort: { timestamp: -1 },
        skip,
        limit: input.pageSize,
      });
      const items = await cursor.toArray();
      const total = await tx.countDocuments(filter);
      return { items, total, page: input.page, pageSize: input.pageSize };
    }),
});

export type TransactionsAdminRouter = typeof transactionsAdminRouter;
