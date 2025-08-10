import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { User } from "@/types/user";

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
    const coll = db.collection<User>("userinformation");

    const user = await coll.findOne({ verificationToken: token });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Check expiry (24h window stored at signup)
    const expiresAt = user.verificationTokenExpiresAt;
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

    // Redirect to a friendly verified page
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const verifiedPath = "/auth/verified";
    const location = baseUrl
      ? `${baseUrl.replace(/\/+$/, "")}${verifiedPath}`
      : verifiedPath;
    return NextResponse.redirect(location);
  } catch (e) {
    console.error("Verify email error:", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
