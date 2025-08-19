import bcrypt from "bcryptjs";
import { getDatabase } from "@/lib/mongodb";
import { User, UserInput } from "@/types/user";
import { getVanityRank } from "@/lib/ranks";
import crypto from "crypto";
import { sendVerificationEmail } from "./mailService";

export class UserService {
  private static async getCollection() {
    const db = await getDatabase();
    // Use 'userinformation' collection as requested
    return db.collection<User>("userinformation");
  }

  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async createUser(
    userData: UserInput
  ): Promise<{ success: boolean; message: string; userId?: string }> {
    try {
      const collection = await this.getCollection();

      // Check if username already exists (exact match)
      const existingUsername = await collection.findOne({
        username: userData.username,
      });
      if (existingUsername) {
        return { success: false, message: "Username already exists" };
      }

      // Check if email already exists
      const existingEmail = await collection.findOne({
        email: userData.email.toLowerCase(),
      });
      if (existingEmail) {
        return { success: false, message: "Email already exists" };
      }

      // Hash the password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user object
      const token = crypto.randomBytes(24).toString("hex");
      const user: Omit<User, "_id"> = {
        username: userData.username,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        credits: 20,
        earnedLifetime: 20,
        rank: getVanityRank(20),
        role: "user",
        emailVerified: false,
        verificationToken: token,
        verificationTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert user into database
      const result = await collection.insertOne(user);

      // Send verification email (best effort)
      try {
        await sendVerificationEmail(user.email, token);
      } catch (e) {
        console.error("Failed to send verification email:", e);
      }

      return {
        success: true,
        message: "User created successfully",
        userId: result.insertedId.toString(),
      };
    } catch (error) {
      console.error("Error creating user:", error);
      return { success: false, message: "Failed to create user" };
    }
  }

  static async authenticateUser(
    identifier: string,
    password: string
  ): Promise<{
    success: boolean;
    message: string;
    user?: Omit<User, "password">;
  }> {
    try {
      const collection = await this.getCollection();

      // Find user by username or email
      const user = await collection.findOne({
        $or: [{ username: identifier }, { email: identifier.toLowerCase() }],
      });

      if (!user) {
        return { success: false, message: "Invalid credentials" };
      }

      // Compare password
      const isPasswordValid = await this.comparePassword(
        password,
        user.password
      );

      if (!isPasswordValid) {
        return { success: false, message: "Invalid credentials" };
      }

      // Require verified email to log in
      if (!user.emailVerified) {
        return {
          success: false,
          message:
            "Email not verified. Please check your inbox for the verification link.",
        };
      }

      // Return user without password
      const { password: _omit, ...userWithoutPassword } = user as Omit<
        User,
        "password"
      > & { password: string };
      // Touch _omit so it isn't considered unused by linters
      if (typeof _omit === "string" && _omit.length < 0) {
        // no-op
      }
      if (
        typeof (userWithoutPassword as { credits?: number }).credits !==
        "number"
      ) {
        // Backfill credits for legacy users
        await (
          await this.getCollection()
        ).updateOne(
          { _id: user._id },
          { $set: { credits: 20, updatedAt: new Date() } }
        );
        (userWithoutPassword as { credits?: number }).credits = 20;
      }

      // Backfill earnedLifetime and rank for legacy users
      const needsLifetime =
        typeof (userWithoutPassword as { earnedLifetime?: number })
          .earnedLifetime !== "number";
      const needsRank =
        typeof (userWithoutPassword as { rank?: string }).rank !== "string";
      if (needsLifetime || needsRank) {
        const earnedLifetime = needsLifetime
          ? (userWithoutPassword as { credits?: number }).credits ?? 20
          : (userWithoutPassword as { earnedLifetime?: number })
              .earnedLifetime!;
        const rank = getVanityRank(earnedLifetime);
        await (
          await this.getCollection()
        ).updateOne(
          { _id: user._id },
          { $set: { earnedLifetime, rank, updatedAt: new Date() } }
        );
        (userWithoutPassword as { earnedLifetime?: number }).earnedLifetime =
          earnedLifetime;
        (userWithoutPassword as { rank?: string }).rank = rank;
      }

      if (!(userWithoutPassword as { role?: string }).role) {
        await (
          await this.getCollection()
        ).updateOne(
          { _id: user._id },
          { $set: { role: "user", updatedAt: new Date() } }
        );
        (userWithoutPassword as { role?: string }).role = "user";
      }

      return {
        success: true,
        message: "Authentication successful",
        user: userWithoutPassword as Omit<User, "password">,
      };
    } catch (error) {
      console.error("Error authenticating user:", error);
      return { success: false, message: "Authentication failed" };
    }
  }

  static async getUserByUsername(username: string): Promise<User | null> {
    try {
      const collection = await this.getCollection();
      return await collection.findOne({ username });
    } catch (error) {
      console.error("Error getting user by username:", error);
      return null;
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const collection = await this.getCollection();
      return await collection.findOne({ email });
    } catch (error) {
      console.error("Error getting user by email:", error);
      return null;
    }
  }
}
