import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { logTransaction } from "@/services/transactionService";

// POST /api/transactions
// Body: { from: string (username or email), to: string (username or email), reason?: string }
// Always transfers 2 credits from `from` to `to` if possible.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fromId: string = (body.from ?? "").trim();
    const toId: string = (body.to ?? "").trim();
    const reason: string = (body.reason ?? "").trim();

    if (!fromId || !toId) {
      return NextResponse.json(
        { success: false, message: "Both sender and recipient are required" },
        { status: 400 }
      );
    }
    if (fromId === toId) {
      return NextResponse.json(
        { success: false, message: "Cannot send credits to yourself" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const coll = db.collection("userinformation");

    const fromQuery = fromId.includes("@")
      ? { email: fromId.toLowerCase() }
      : { username: fromId };
    const toQuery = toId.includes("@")
      ? { email: toId.toLowerCase() }
      : { username: toId };

    const fromUser = await coll.findOne(fromQuery);
    const toUser = await coll.findOne(toQuery);

    if (!fromUser || !toUser) {
      return NextResponse.json(
        { success: false, message: "Sender or recipient not found" },
        { status: 404 }
      );
    }

    const amount = 2; // fixed amount per requirements

    // Debit only if sender has at least `amount` credits
    const dec = await coll.updateOne(
      { ...fromQuery, credits: { $gte: amount } },
      { $inc: { credits: -amount }, $set: { updatedAt: new Date() } }
    );
    if (dec.matchedCount !== 1) {
      return NextResponse.json(
        { success: false, message: "Insufficient balance" },
        { status: 400 }
      );
    }
    // Credit recipient
    const inc = await coll.updateOne(toQuery, {
      $inc: { credits: amount },
      $set: { updatedAt: new Date() },
    });
    if (inc.matchedCount !== 1) {
      // Try to revert debit in case credit failed
      await coll.updateOne(fromQuery, { $inc: { credits: amount } });
      return NextResponse.json(
        { success: false, message: "Failed to credit recipient" },
        { status: 500 }
      );
    }

    // Log transaction after completion
    await logTransaction({
      from: fromUser.username || fromUser.email,
      to: toUser.username || toUser.email,
      amount,
      reason,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Transferred 2 credits",
      amount,
      reason,
    });
  } catch (error) {
    console.error("Transaction API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/transactions?userId=...&limit=10
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = (searchParams.get("userId") || "").trim();
    const usernameParam = (searchParams.get("username") || "").trim();
    const emailParam = (searchParams.get("email") || "").trim().toLowerCase();
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10))
    );
    const db = await getDatabase();
    // If no filter is provided, return latest global transactions
    if (!userId && !usernameParam && !emailParam) {
      const tx = db.collection("transactionHistory");
      const items = await tx
        .find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      return NextResponse.json({ success: true, items });
    }

    const users = db.collection<{ username?: string; email?: string }>(
      "userinformation"
    );
    const tx = db.collection("transactionHistory");
    const { ObjectId } = await import("mongodb");

    // Resolve user by id/username/email
    let user: { username?: string; email?: string } | null = null;
    if (userId) {
      // Use ObjectId if valid, otherwise try username/email semantics
      const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(userId);
      if (isValidObjectId) {
        user = await users.findOne({ _id: new ObjectId(userId) });
      } else if (userId.includes("@")) {
        user = await users.findOne({ email: userId.toLowerCase() });
      } else {
        user = await users.findOne({ username: userId });
      }
    }
    if (!user && usernameParam) {
      user = await users.findOne({ username: usernameParam });
    }
    if (!user && emailParam) {
      user = await users.findOne({ email: emailParam });
    }
    if (!user)
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );

    const username = user.username || user.email;
    const items = await tx
      .find({ $or: [{ from: username }, { to: username }] })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({ success: true, items });
  } catch (e) {
    console.error("Transactions GET error", e);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
