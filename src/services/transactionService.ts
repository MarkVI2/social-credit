import { getDatabase } from "@/lib/mongodb";
import { recordActivity } from "./logService";
import { buildUserTransferMessage } from "./messageTemplates";

export type TransactionLog = {
  from: string;
  to: string;
  amount: number; // positive for credit to 'to'
  reason: string;
  timestamp: Date;
  message?: string; // denormalized themed message
};

export async function logTransaction(entry: TransactionLog) {
  const db = await getDatabase();
  // Build message once
  let message: string | undefined;
  try {
    message = buildUserTransferMessage({
      from: entry.from,
      to: entry.to,
      credits: Math.abs(entry.amount),
      reason: entry.reason,
    });
  } catch {}
  await db.collection("transactionHistory").insertOne({ ...entry, message });
  try {
    await recordActivity({
      type: "transaction",
      action: "credit_transfer",
      data: entry,
      undone: false,
      message: message || genericTransactionMessage(entry),
    });
  } catch {
    /* non-fatal */
  }
}

// Provide a generic fallback formatted message
export function genericTransactionMessage(t: TransactionLog) {
  const dir = t.amount >= 0 ? `${t.from} -> ${t.to}` : `${t.to} -> ${t.from}`;
  return `${dir} : ${Math.abs(t.amount)}cr${t.reason ? ` (${t.reason})` : ""}`;
}
