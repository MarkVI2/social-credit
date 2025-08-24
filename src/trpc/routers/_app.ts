import { createTRPCRouter } from "../init";
import { leaderboardRouter } from "./leaderboardRouter";
import { transactionsRouter } from "./transactionsRouter";
import { userRouter } from "./userRouter";
import { activityRouter } from "./admin/activityRouter";
import { adminUsersRouter } from "./admin/adminUsersRouter";
import { classbankRouter } from "./admin/classbankRouter";
import { creditsRouter } from "./admin/creditsRouter";
import { auctionRouter } from "./auction";
import { marketplaceRouter } from "./marketplace";
import { statsRouter } from "./admin/statsRouter";
import { transactionsAdminRouter } from "./admin/transactionsAdminRouter";

export const appRouter = createTRPCRouter({
  // Public and user routes
  leaderboard: leaderboardRouter,
  transactions: transactionsRouter,
  user: userRouter,
  auction: auctionRouter,
  marketplace: marketplaceRouter,

  // Admin routes
  admin: createTRPCRouter({
    activity: activityRouter,
    users: adminUsersRouter,
    classbank: classbankRouter,
    credits: creditsRouter,
    stats: statsRouter,
    transactions: transactionsAdminRouter,
  }),
});

export type AppRouter = typeof appRouter;
