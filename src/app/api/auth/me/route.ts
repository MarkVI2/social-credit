import { NextRequest, NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromAuthHeader(req);
  if (!user)
    return NextResponse.json({ authenticated: false }, { status: 200 });
  // omit password and sensitive fields
  const {
    password: _password,
    sessionTokenHash: _sessionTokenHash,
    resetToken: _resetToken,
    verificationToken: _verificationToken,
    ...safe
  } = user as Record<string, unknown>;
  return NextResponse.json(
    { authenticated: true, user: safe },
    { status: 200 }
  );
}
