import { getDatabase } from "../src/lib/mongodb";
import { Db } from "mongodb";

async function testConnection() {
  console.log("Testing MongoDB connection...");

  // Set a timeout for the connection test
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error("Connection timeout after 10 seconds")),
      10000
    );
  });

  try {
    const dbPromise = getDatabase();
    const db: Db = await Promise.race([dbPromise, timeoutPromise]);

    console.log("✅ MongoDB connection successful!");

    // Test creating indexes for the userinformation collection
    const usersCollection = db.collection("userinformation");

    // Create unique indexes for username and email
    await usersCollection.createIndex({ username: 1 }, { unique: true });
    await usersCollection.createIndex({ email: 1 }, { unique: true });

    console.log("✅ Database indexes created successfully!");
    console.log("🎉 Database setup complete!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:");
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("timeout")) {
      console.error(
        "  - Connection timed out. Please check your MongoDB URI and network connection."
      );
    } else if (errorMessage.includes("authentication")) {
      console.error(
        "  - Authentication failed. Please check your username and password."
      );
    } else {
      console.error("  - Error:", errorMessage);
    }
    console.log("\n📝 Please ensure:");
    console.log("  1. Your MongoDB cluster is running");
    console.log("  2. Your IP address is whitelisted in MongoDB Atlas");
    console.log("  3. Your connection string includes the correct password");
    console.log("  4. The database name is included in the connection string");
  }

  process.exit(0);
}

testConnection();
