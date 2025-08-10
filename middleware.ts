import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import crypto from "crypto";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  if (pathname.startsWith("/admin")) {
    const token =
      req.cookies.get("auth_token")?.value ||
      (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    // In Edge runtime we cannot query MongoDB; enforce minimal check (auth present)
    if (!token) return NextResponse.redirect(new URL("/auth/login", req.url));
    // Role enforcement happens in server API/routes.
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
