import bcrypt from "bcryptjs";
import { getDatabase } from "@/lib/mongodb";
import { User, UserInput } from "@/types/user";

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

      // Check if username already exists
      const existingUsername = await collection.findOne({
        username: userData.username,
      });
      if (existingUsername) {
        return { success: false, message: "Username already exists" };
      }

      // Check if email already exists
      const existingEmail = await collection.findOne({ email: userData.email });
      if (existingEmail) {
        return { success: false, message: "Email already exists" };
      }

      // Hash the password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user object
      const user: Omit<User, "_id"> = {
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert user into database
      const result = await collection.insertOne(user);

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
        $or: [{ username: identifier }, { email: identifier }],
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

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        message: "Authentication successful",
        user: userWithoutPassword,
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
