import { MongoClient, Db } from "mongodb";

// Ensure MONGODB_URI is available. For script usage (tsx), Next.js env loading
// may not have occurred yet. Try loading from .env/.env.local as a fallback.
if (!process.env.MONGODB_URI) {
  try {
    // Prefer synchronous require here to avoid top-level await in CJS scripts
    const dotenv = require("dotenv");
    // Load both .env.local (if present) and .env
    dotenv.config({ path: ".env.local" });
    dotenv.config();
  } catch {
    // ignore optional dotenv failure in environments that don't have it
  }
}

if (!process.env.MONGODB_URI) {
  throw new Error(
    "Please add your MongoDB URI to .env or .env.local (MONGODB_URI)"
  );
}

const uri = process.env.MONGODB_URI as string;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  // Connect to the SocialCreditSystem database
  return client.db("SocialCreditSystem");
}

export default clientPromise;
