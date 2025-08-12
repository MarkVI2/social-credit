import { NextRequest, NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/auth";
import type { User } from "@/types/user";

export async function GET(req: NextRequest) {
  const user = await getUserFromAuthHeader(req);
  if (!user)
    return NextResponse.json({ authenticated: false }, { status: 200 });
  // Omit password & sensitive tokens
  const {
    password: _pwd,
    sessionTokenHash: _sth,
    resetToken: _rt,
    verificationToken: _vt,
    ...safe
  } = user as User;
  return NextResponse.json(
    { authenticated: true, user: safe },
    { status: 200 }
  );
}
