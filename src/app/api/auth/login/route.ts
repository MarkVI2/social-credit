import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/services/userService";
import { LoginInput, User } from "@/types/user";
import { getDatabase } from "@/lib/mongodb";
import crypto from "crypto";
import { sendVerificationEmail } from "@/services/mailService";
import { createSessionToken, setUserSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body: LoginInput = await request.json();

    // Normalize inputs
    const rawIdentifier = (body.identifier ?? "").trim();
    const rawPassword = body.password ?? "";
    const isEmail = rawIdentifier.includes("@");
    const identifier = isEmail ? rawIdentifier.toLowerCase() : rawIdentifier;
    const password = rawPassword;

    // Validate input
    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: "Username/email and password are required" },
        { status: 400 }
      );
    }

    // Authenticate user
    const result = await UserService.authenticateUser(identifier, password);

    if (!result.success) {
      // If password was correct but email not verified, auto-resend a fresh verification link
      if (
        typeof result.message === "string" &&
        result.message.toLowerCase().includes("email not verified")
      ) {
        try {
          const db = await getDatabase();
          const coll = db.collection<User>("userinformation");
          // Find by identifier (username or email)
          const userDoc = await coll.findOne(
            rawIdentifier.includes("@")
              ? { email: identifier }
              : { username: identifier }
          );
          if (userDoc && !userDoc.emailVerified) {
            const token = crypto.randomBytes(24).toString("hex");
            const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
            await coll.updateOne(
              { _id: userDoc._id },
              {
                $set: {
                  verificationToken: token,
                  verificationTokenExpiresAt: expiresAt,
                  updatedAt: new Date(),
                },
              }
            );
            try {
              await sendVerificationEmail(userDoc.email, token);
            } catch (e) {
              console.error("Auto-resend verification failed:", e);
            }
          }
        } catch (e) {
          console.error("Login auto-resend error:", e);
        }
      }
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 401 }
      );
    }

    // Create session token and store hash
    const { token, hash } = createSessionToken();
    if (result.user && "_id" in result.user && result.user._id) {
      await setUserSession(String(result.user._id as unknown as string), hash);
    }

    const res = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: result.user,
        token,
      },
      { status: 200 }
    );
    // Set httpOnly cookie for middleware checks
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return res;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
