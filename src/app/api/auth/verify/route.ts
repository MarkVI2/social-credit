import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Missing token" },
        { status: 400 }
      );
    }
    const db = await getDatabase();
    const coll = db.collection("userinformation");

    const user = await coll.findOne({ verificationToken: token });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Check expiry (24h window stored at signup)
    const expiresAt = (user as any).verificationTokenExpiresAt as
      | Date
      | undefined;
    if (!expiresAt || new Date(expiresAt).getTime() < Date.now()) {
      // Token expired; clear token to prevent reuse
      await coll.updateOne(
        { _id: user._id },
        {
          $unset: { verificationToken: "", verificationTokenExpiresAt: "" },
          $set: { updatedAt: new Date() },
        }
      );
      return NextResponse.json(
        {
          success: false,
          message: "Verification link expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    await coll.updateOne(
      { _id: user._id },
      {
        $set: { emailVerified: true, updatedAt: new Date() },
        $unset: { verificationToken: "", verificationTokenExpiresAt: "" },
      }
    );

    return NextResponse.json({ success: true, message: "Email verified" });
  } catch (e) {
    console.error("Verify email error:", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
