import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/services/userService";
import { LoginInput } from "@/types/user";

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
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: result.user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
