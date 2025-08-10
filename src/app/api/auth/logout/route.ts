import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getUserFromAuthHeader } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromAuthHeader(req);
    if (user) {
      const db = await getDatabase();
      await db
        .collection("userinformation")
        .updateOne(
          { _id: user._id },
          {
            $unset: { sessionTokenHash: "", sessionTokenExpiresAt: "" },
            $set: { updatedAt: new Date() },
          }
        );
    }
    const res = NextResponse.json({ success: true });
    res.cookies.set("auth_token", "", { httpOnly: true, maxAge: 0, path: "/" });
    return res;
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
