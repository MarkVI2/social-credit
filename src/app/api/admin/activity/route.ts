import { NextRequest, NextResponse } from "next/server";
import { getUserFromAuthHeader, requireAdmin } from "@/lib/auth";
import { listActivity } from "@/services/logService";

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
    const cursor = Math.max(0, parseInt(searchParams.get("cursor") || "0", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "50", 10))
    );
    const { items, total } = await listActivity({ skip: cursor, limit });
    return NextResponse.json({
      success: true,
      items,
      total,
      cursor,
      limit,
      nextCursor: cursor + items.length,
    });
  } catch (e) {
    console.error("Activity API error", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
