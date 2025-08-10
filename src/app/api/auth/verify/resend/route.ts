import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import crypto from "crypto";
import { sendVerificationEmail } from "@/services/mailService";
import { User } from "@/types/user";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail = (body.email || "").trim();
    const email = rawEmail.toLowerCase();
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const coll = db.collection<User>("userinformation");
    const user = await coll.findOne({ email });

    // Always respond success to avoid user enumeration
    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true });
    }

    // Generate new token and expiry (24h)
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await coll.updateOne(
      { _id: user._id },
      {
        $set: {
          verificationToken: token,
          verificationTokenExpiresAt: expiresAt,
          updatedAt: new Date(),
        },
      }
    );

    try {
      await sendVerificationEmail(email, token);
    } catch (e) {
      console.error("Failed to resend verification email:", e);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Resend verification error:", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
