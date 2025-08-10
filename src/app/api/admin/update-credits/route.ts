import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getUserFromAuthHeader, requireAdmin } from "@/lib/auth";
import { logTransaction } from "@/services/transactionService";
import clientPromise from "@/lib/mongodb";
import type { User } from "@/types/user";
import { ObjectId } from "mongodb";

// Body: { targetUserId, amount, sourceAccount: "admin" | "classBank", reason }
export async function POST(req: NextRequest) {
  try {
    const me = await getUserFromAuthHeader(req);
    if (!requireAdmin(me)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const targetUserId = String(body.targetUserId || "").trim();
    const amount = Number(body.amount);
    const sourceAccount = String(body.sourceAccount || "").trim();
    const reason = String(body.reason || "").trim();

    if (!targetUserId || !reason || !Number.isFinite(amount)) {
      return NextResponse.json(
        { success: false, message: "Invalid payload" },
        { status: 400 }
      );
    }
    if (!["admin", "classBank"].includes(sourceAccount)) {
      return NextResponse.json(
        { success: false, message: "Invalid source account" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const users = db.collection<User>("userinformation");
    const system = db.collection("systemAccounts");

    const target = await users.findOne({ _id: new ObjectId(targetUserId) });
    if (!target)
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );

    if (amount === 0)
      return NextResponse.json(
        { success: false, message: "Amount cannot be zero" },
        { status: 400 }
      );

    // Normalize operation: positive amount means credit to target; negative means deduction from target
    // For admin source, deduct from admin when crediting user; for classBank, deduct from class bank when crediting user.

    const client = await clientPromise;
    const session = client.startSession();
    try {
      let ok = false;
      await session.withTransaction(async () => {
        if (sourceAccount === "admin") {
          const adminQuery = { _id: (me as User)._id } as { _id: ObjectId };
          if (amount > 0) {
            // deduct from admin, credit to user
            const dec = await users.updateOne(
              { ...adminQuery, credits: { $gte: amount } },
              { $inc: { credits: -amount }, $set: { updatedAt: new Date() } },
              { session }
            );
            if (dec.matchedCount !== 1)
              throw new Error("Insufficient admin balance");
            const inc = await users.updateOne(
              { _id: target._id },
              { $inc: { credits: amount }, $set: { updatedAt: new Date() } },
              { session }
            );
            if (inc.matchedCount !== 1)
              throw new Error("Failed to credit target");
          } else {
            // deduction from target goes to admin
            const abs = Math.abs(amount);
            const dec = await users.updateOne(
              { _id: target._id, credits: { $gte: abs } },
              { $inc: { credits: -abs }, $set: { updatedAt: new Date() } },
              { session }
            );
            if (dec.matchedCount !== 1)
              throw new Error("Insufficient user balance");
            const inc = await users.updateOne(
              adminQuery,
              { $inc: { credits: abs }, $set: { updatedAt: new Date() } },
              { session }
            );
            if (inc.matchedCount !== 1)
              throw new Error("Failed to credit admin");
          }
          ok = true;
        } else if (sourceAccount === "classBank") {
          const bank = await system.findOne(
            { accountType: "classBank" },
            { session }
          );
          if (!bank) throw new Error("Class bank not found");
          if (amount > 0) {
            // deduct from bank, credit to user atomically
            const decRes = await system.findOneAndUpdate(
              { _id: bank._id, balance: { $gte: amount } },
              { $inc: { balance: -amount }, $set: { lastUpdated: new Date() } },
              { session, returnDocument: "after" }
            );
            if (!decRes || !decRes.value)
              throw new Error("Insufficient bank balance");
            const inc = await users.updateOne(
              { _id: target._id },
              { $inc: { credits: amount }, $set: { updatedAt: new Date() } },
              { session }
            );
            if (inc.matchedCount !== 1)
              throw new Error("Failed to credit target");
          } else {
            // deduction from target goes to bank
            const abs = Math.abs(amount);
            const dec = await users.updateOne(
              { _id: target._id, credits: { $gte: abs } },
              { $inc: { credits: -abs }, $set: { updatedAt: new Date() } },
              { session }
            );
            if (dec.matchedCount !== 1)
              throw new Error("Insufficient user balance");
            await system.updateOne(
              { _id: bank._id },
              { $inc: { balance: abs }, $set: { lastUpdated: new Date() } },
              { session }
            );
          }
          ok = true;
        }
      });
      if (!ok) throw new Error("Transaction failed");
    } finally {
      await session.endSession();
    }

    // Log transaction after commit
    await logTransaction({
      from:
        amount > 0
          ? sourceAccount === "admin"
            ? me!.email || me!.username
            : "Class Bank"
          : target.username,
      to:
        amount > 0
          ? target.username
          : sourceAccount === "admin"
          ? me!.email || me!.username
          : "Class Bank",
      amount: Math.abs(amount) * (amount > 0 ? 1 : -1),
      reason,
      timestamp: new Date(),
    });

    // Email notification (best-effort)
    try {
      const newBalance =
        (
          await (await getDatabase())
            .collection<User>("userinformation")
            .findOne({ _id: target._id })
        )?.credits || 0;
      const { sendAdminCreditUpdateEmail } = await import(
        "@/services/notifyService"
      );
      await sendAdminCreditUpdateEmail(
        target.email,
        Math.abs(amount) * (amount > 0 ? 1 : -1),
        newBalance,
        reason
      );
    } catch (e) {
      console.error("Failed to send email notification", e);
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error("Admin update credits error", e);
    const msg =
      e && typeof (e as { message?: unknown }).message === "string"
        ? (e as { message: string }).message
        : "Internal server error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
