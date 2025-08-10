import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getUserFromAuthHeader, requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const me = await getUserFromAuthHeader(req);
  if (!requireAdmin(me)) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
  const db = await getDatabase();
  const system = db.collection("systemAccounts");
  const existing = await system.findOne({ accountType: "classBank" });
  if (!existing) {
    await system.insertOne({
      accountType: "classBank",
      balance: 1000,
      lastUpdated: new Date(),
    });
    return NextResponse.json({ success: true, created: true });
  }
  return NextResponse.json({
    success: true,
    created: false,
    balance: existing.balance,
  });
}
