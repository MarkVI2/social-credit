import { NextRequest, NextResponse } from "next/server";
// Force Node.js runtime for database operations
export const runtime = "nodejs";
import { getDatabase } from "@/lib/mongodb";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/services/mailService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = (body.identifier || "").trim();
    if (!identifier) {
      return NextResponse.json(
        { success: false, message: "Identifier is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const coll = db.collection("userinformation");
    const query = identifier.includes("@")
      ? { email: identifier.toLowerCase() }
      : { username: identifier };
    const user = await coll.findOne(query);

    // Always return success to avoid user enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expireAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    await coll.updateOne(query, {
      $set: {
        resetToken: token,
        resetTokenExpiresAt: expireAt,
        updatedAt: new Date(),
      },
    });

    try {
      await sendPasswordResetEmail(user.email, token);
    } catch (e) {
      console.error("Failed to send reset email:", e);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Forgot password error:", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
