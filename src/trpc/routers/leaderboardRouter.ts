import { publicProcedure, createTRPCRouter } from "../init";
import { getDatabase } from "@/lib/mongodb";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events";

// Type for leaderboard user entry
interface LeaderboardUser {
  _id: string;
  name?: string;
  handle?: string;
  kollaborationKredits: number;
  credits: number;
  avatarUrl?: string;
  rank?: string;
  earnedLifetime?: number;
}

// Event emitter for leaderboard updates
const leaderboardEmitter = new EventEmitter();

// Function to broadcast leaderboard updates
export const broadcastLeaderboardUpdate = () => {
  leaderboardEmitter.emit("update");
};

export const leaderboardRouter = createTRPCRouter({
  // Get current leaderboard data
  getLeaderboard: publicProcedure.query(async () => {
    try {
      const db = await getDatabase();
      const pipeline = [
        {
          $addFields: { creditsSafe: { $ifNull: ["$credits", 0] } },
        },
        { $sort: { creditsSafe: -1 } },
        {
          $project: {
            _id: 1,
            name: { $ifNull: ["$name", "$username"] },
            handle: { $ifNull: ["$handle", "$username"] },
            // Keep field name for UI compatibility
            kollaborationKredits: "$creditsSafe",
            // Also include explicit credits field for future use
            credits: "$creditsSafe",
            avatarUrl: 1,
            rank: 1,
            earnedLifetime: 1,
          },
        },
      ];

      const users = await db
        .collection("userinformation")
        .aggregate(pipeline)
        .toArray();

      return { success: true, users };
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      throw new Error("Error fetching leaderboard");
    }
  }),

  // Server-sent events subscription for real-time leaderboard updates
  onUpdate: publicProcedure.subscription(() => {
    return observable<{ success: boolean; users: LeaderboardUser[] }>(
      (emit) => {
        // Send initial data
        const sendUpdate = async () => {
          try {
            const db = await getDatabase();
            const pipeline = [
              {
                $addFields: { creditsSafe: { $ifNull: ["$credits", 0] } },
              },
              { $sort: { creditsSafe: -1 } },
              {
                $project: {
                  _id: 1,
                  name: { $ifNull: ["$name", "$username"] },
                  handle: { $ifNull: ["$handle", "$username"] },
                  kollaborationKredits: "$creditsSafe",
                  credits: "$creditsSafe",
                  avatarUrl: 1,
                  rank: 1,
                  earnedLifetime: 1,
                },
              },
            ];

            const users = await db
              .collection("userinformation")
              .aggregate(pipeline)
              .toArray();

            emit.next({ success: true, users: users as LeaderboardUser[] });
          } catch (error) {
            console.error("Error in leaderboard subscription:", error);
            emit.error(new Error("Error fetching leaderboard"));
          }
        };

        // Send initial data
        sendUpdate();

        // Listen for updates
        const onUpdate = () => {
          sendUpdate();
        };

        leaderboardEmitter.on("update", onUpdate);

        // Cleanup
        return () => {
          leaderboardEmitter.off("update", onUpdate);
        };
      }
    );
  }),
});

export type LeaderboardRouter = typeof leaderboardRouter;
