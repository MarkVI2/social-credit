import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

// Returns top 5 users sorted by kollaborationKredits (desc)
export async function GET() {
  try {
    const db = await getDatabase();
    const pipeline = [
      {
        $addFields: {
          kollaborationKreditsSafe: { $ifNull: ["$kollaborationKredits", 0] },
        },
      },
      { $sort: { kollaborationKreditsSafe: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 1,
          name: { $ifNull: ["$name", "$username"] },
          handle: { $ifNull: ["$handle", "$username"] },
          kollaborationKredits: "$kollaborationKreditsSafe",
          avatarUrl: 1,
        },
      },
    ];

    const users = await db
      .collection("userinformation")
      .aggregate(pipeline)
      .toArray();

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching leaderboard" },
      { status: 500 }
    );
  }
}
