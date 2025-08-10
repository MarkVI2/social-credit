import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { UserService } from "@/services/userService";
import { sendPasswordChangeNotification } from "@/services/mailService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = (body.token || "").trim();
    const newPassword = (body.newPassword || "").trim();

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Token and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const coll = db.collection("userinformation");
    const user = await coll.findOne({
      resetToken: token,
      resetTokenExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    const hashed = await UserService.hashPassword(newPassword);

    await coll.updateOne(
      { _id: user._id },
      {
        $set: { password: hashed, updatedAt: new Date() },
        $unset: { resetToken: "", resetTokenExpiresAt: "" },
      }
    );

    try {
      await sendPasswordChangeNotification(user.email);
    } catch (e) {
      console.error("Failed to send change notification:", e);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Reset password error:", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
