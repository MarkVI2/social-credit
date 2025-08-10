import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // Only check if an auth token exists for admin pages; detailed checks in API
  if (pathname.startsWith("/admin")) {
    const token =
      req.cookies.get("auth_token")?.value ||
      (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
