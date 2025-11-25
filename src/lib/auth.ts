import crypto from "crypto";
import { NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import type { User } from "@/types/user";
import { ObjectId } from "mongodb";

// Simple token-based auth stored in DB as hashed token. Client stores raw token in localStorage.
export function createSessionToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

export async function setUserSession(
  userId: string,
  tokenHash: string,
  ttlHours = 168 // 7 days
) {
  const db = await getDatabase();
  const coll = db.collection<User>("userinformation");
  const expires = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  await coll.updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        sessionTokenHash: tokenHash,
        sessionTokenExpiresAt: expires,
        updatedAt: new Date(),
      },
    }
  );
}

export async function getUserFromAuthHeader(req: NextRequest) {
  try {
    let token: string | null = null;
    const auth =
      req.headers.get("authorization") || req.headers.get("Authorization");
    if (auth && auth.startsWith("Bearer ")) {
      token = auth.slice("Bearer ".length).trim();
    }
    if (!token) {
      try {
        const cookieToken = (
          req as unknown as {
            cookies?: {
              get?: (name: string) => { value?: string } | undefined;
            };
          }
        ).cookies?.get?.("auth_token")?.value;
        if (cookieToken) token = cookieToken;
      } catch {}
    }
    if (!token) return null;
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const db = await getDatabase();
    const coll = db.collection<User>("userinformation");
    const user = await coll.findOne({
      sessionTokenHash: hash,
      sessionTokenExpiresAt: { $gt: new Date() },
    });
    return user;
  } catch (e) {
    console.error("getUserFromAuthHeader error", e);
    return null;
  }
}

export function requireAdmin(user: User | null): user is User {
  return !!user && user.role === "admin";
}

export function checkTransactionRestriction(user: User | null) {
  // "after the 25th of november 2025"
  // We'll set the cutoff to the end of that day.
  const cutoff = new Date("2025-11-25T23:59:59");
  if (Date.now() > cutoff.getTime()) {
    if (!user || user.role !== "admin") {
      throw new Error(
        "Transactions are currently closed (effective after Nov 25, 2025)."
      );
    }
  }
}
