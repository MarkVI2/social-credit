import { MongoClient, Db } from "mongodb";

// Ensure MONGODB_URI is available. For script usage (tsx), Next.js env loading
// may not have occurred yet. Try loading from .env/.env.local as a fallback.
if (!process.env.MONGODB_URI) {
  try {
    // Use dynamic import to satisfy lint without eslint-disable
    // Note: optional for scripts; Next apps typically have env loaded already
    await import("dotenv").then((m) => m.config());
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
