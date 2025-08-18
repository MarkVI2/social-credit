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
  }),
});

export type AppRouter = typeof appRouter;
