import { z } from "zod";
import { publicProcedure, protectedProcedure, createTRPCRouter } from "../init";
import { getDatabase } from "@/lib/mongodb";
import type { User } from "@/types/user";

export const userRouter = createTRPCRouter({
  // Get all users (public endpoint for searching recipients)
  getAll: publicProcedure.query(async () => {
    try {
      const db = await getDatabase();
      const users = await db
        .collection<User>("userinformation")
        .find(
          {},
          {
            projection: {
              _id: 1,
              username: 1,
              email: 1,
              credits: 1,
              role: 1,
              rank: 1,
              earnedLifetime: 1,
            },
          }
        )
        .toArray();

      return { success: true, users };
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Error fetching users");
    }
  }),

  // Get current user's profile (protected)
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDatabase();
    const coll = db.collection<User>("userinformation");
    const txCol = db.collection("transactionHistory");
    const userDoc = await coll.findOne({ _id: ctx.user._id });
    if (!userDoc) {
      throw new Error("User not found");
    }
    // Compute transaction counts
    const username = userDoc.username;
    const countSent = await txCol.countDocuments({ from: username });
    const countReceived = await txCol.countDocuments({ to: username });
    return {
      success: true,
      user: {
        _id: userDoc._id,
        username: userDoc.username,
        email: userDoc.email,
        credits: userDoc.credits || 0,
        role: userDoc.role,
        rank: userDoc.rank,
        earnedLifetime: userDoc.earnedLifetime || 0,
        spentLifetime: userDoc.spentLifetime || 0,
        receivedLifetime: userDoc.receivedLifetime || 0,
        transactionsSent: countSent,
        transactionsReceived: countReceived,
        createdAt: userDoc.createdAt,
      },
    };
  }),

  // Get user by ID or username/email
  getById: publicProcedure
    .input(
      z.object({
        id: z.string().min(1, "User ID is required"),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDatabase();
        const coll = db.collection<User>("userinformation");

        let user: User | null = null;

        // Check if it's a valid ObjectId
        const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(input.id);
        if (isValidObjectId) {
          const { ObjectId } = await import("mongodb");
          user = await coll.findOne({ _id: new ObjectId(input.id) });
        } else if (input.id.includes("@")) {
          user = await coll.findOne({ email: input.id.toLowerCase() });
        } else {
          user = await coll.findOne({ username: input.id });
        }

        if (!user) {
          throw new Error("User not found");
        }

        return {
          success: true,
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            credits: user.credits || 0,
            role: user.role,
            rank: user.rank,
            earnedLifetime: user.earnedLifetime,
            createdAt: user.createdAt,
          },
        };
      } catch (error) {
        console.error("Error fetching user:", error);
        throw new Error("Error fetching user");
      }
    }),

  // Update current user's profile
  updateMe: protectedProcedure
    .input(
      z.object({
        username: z.string().min(1).optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDatabase();
        const coll = db.collection<User>("userinformation");

        const updateFields: Partial<User> & { updatedAt: Date } = {
          updatedAt: new Date(),
        };

        if (input.username) {
          // Check if username is already taken
          const existingUser = await coll.findOne({
            username: input.username,
            _id: { $ne: ctx.user._id },
          });
          if (existingUser) {
            throw new Error("Username already taken");
          }
          updateFields.username = input.username;
        }

        if (input.email) {
          // Check if email is already taken
          const existingUser = await coll.findOne({
            email: input.email.toLowerCase(),
            _id: { $ne: ctx.user._id },
          });
          if (existingUser) {
            throw new Error("Email already taken");
          }
          updateFields.email = input.email.toLowerCase();
          updateFields.emailVerified = false; // Require re-verification
        }

        const result = await coll.updateOne(
          { _id: ctx.user._id },
          { $set: updateFields }
        );

        if (result.matchedCount === 0) {
          throw new Error("User not found");
        }

        return { success: true, message: "Profile updated successfully" };
      } catch (error) {
        console.error("Error updating user profile:", error);
        throw new Error(
          error instanceof Error ? error.message : "Error updating profile"
        );
      }
    }),
});

export type UserRouter = typeof userRouter;
