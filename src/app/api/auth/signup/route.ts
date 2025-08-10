import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/services/userService";
import { UserInput } from "@/types/user";
import { isEmailAllowed } from "@/lib/allowlist";

export async function POST(request: NextRequest) {
  try {
    const body: UserInput = await request.json();

    // Normalize inputs
    body.username = (body.username ?? "").trim();
    body.email = (body.email ?? "").trim().toLowerCase();

    // Validate input
    if (
      !body.username ||
      !body.email ||
      !body.password ||
      !body.confirmPassword
    ) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email domain
    if (!body.email.endsWith("@mahindrauniversity.edu.in")) {
      return NextResponse.json(
        {
          success: false,
          message: "Email must end with @mahindrauniversity.edu.in",
        },
        { status: 400 }
      );
    }

    // Validate password confirmation
    if (body.password !== body.confirmPassword) {
      return NextResponse.json(
        { success: false, message: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Validate password strength (optional)
    if (body.password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters long",
        },
        { status: 400 }
      );
    }

    // Validate email allowlist
    const allowed = await isEmailAllowed(body.email);
    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Signup not allowed for this email address",
        },
        { status: 403 }
      );
    }

    // Create user
    const result = await UserService.createUser(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        userId: result.userId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
