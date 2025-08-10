import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getUserFromAuthHeader, requireAdmin } from "@/lib/auth";
import type { User } from "@/types/user";

// GET /api/admin/users?query=...&page=1&limit=20
// Force Node.js runtime to allow MongoDB driver usage
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  try {
    const me = await getUserFromAuthHeader(req);
    if (!requireAdmin(me)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("query") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const skip = (page - 1) * limit;

    const db = await getDatabase();
    const coll = db.collection<User>("userinformation");

    const filter = q
      ? {
          $or: [
            { username: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      coll
        .find(filter, {
          projection: { _id: 1, username: 1, email: 1, credits: 1, role: 1 },
        })
        .skip(skip)
        .limit(limit)
        .toArray(),
      coll.countDocuments(filter),
    ]);

    return NextResponse.json({ success: true, items, total, page, limit });
  } catch (e) {
    console.error("Admin users list error", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
