import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import crypto from "crypto";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // Only check admin page routes; API will do its own checks
  if (pathname.startsWith("/admin")) {
    const token =
      req.cookies.get("auth_token")?.value ||
      (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    try {
      const hash = crypto.createHash("sha256").update(token).digest("hex");
      const db = await getDatabase();
      const user = await db.collection("userinformation").findOne({
        sessionTokenHash: hash,
        sessionTokenExpiresAt: { $gt: new Date() },
      });
      if (!user || user.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    } catch (e) {
      console.error("middleware error", e);
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
