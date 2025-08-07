import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import type { User } from "@/types/user";

export async function GET() {
  try {
    const db = await getDatabase();
    const users = await db
      .collection<User>("userinformation")
      .find({}, { projection: { _id: 1, username: 1, email: 1 } })
      .toArray();

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching users" },
      { status: 500 }
    );
  }
}
