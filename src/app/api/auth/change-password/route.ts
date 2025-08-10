import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { UserService } from "@/services/userService";
import { sendPasswordChangeNotification } from "@/services/mailService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const currentPassword = (body.currentPassword || "").trim();
    const newPassword = (body.newPassword || "").trim();

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
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
    const user = await coll.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const ok = await UserService.comparePassword(
      currentPassword,
      user.password
    );
    if (!ok) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const hashed = await UserService.hashPassword(newPassword);
    await coll.updateOne(
      { _id: user._id },
      { $set: { password: hashed, updatedAt: new Date() } }
    );

    try {
      await sendPasswordChangeNotification(user.email);
    } catch (e) {
      console.error("Failed to send change notification:", e);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Change password error:", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
