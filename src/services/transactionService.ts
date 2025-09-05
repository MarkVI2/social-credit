import { getDatabase } from "@/lib/mongodb";
import { recordActivity } from "./logService";
import { buildUserTransferMessage } from "./messageTemplates";

export type TransactionLog = {
  from: string;
  to: string;
  amount: number; // positive for credit to 'to'
  reason: string;
  timestamp: Date;
  // Optional machine-readable category for analytics: 'peer_transfer' | 'marketplace_purchase' | 'auction_settlement' | 'admin_adjustment' | 'mint_supply' | 'burn_supply' | 'other'
  type?: string;
  message?: string; // denormalized themed message
};

export async function logTransaction(entry: TransactionLog) {
  const db = await getDatabase();
  const users = db.collection("userinformation");
  const inventory = db.collection("userInventory");

  let finalEntry = { ...entry };

  // Check if sender has Veil of Anonymity
  if (
    finalEntry.from &&
    finalEntry.from !== "mint" &&
    finalEntry.from !== "classBank"
  ) {
    const sender = await users.findOne({ username: finalEntry.from });
    if (sender) {
      const veil = await inventory.findOne({
        userId: sender._id,
        sku: "ANONYMITY_TOKEN_24H",
      });

      if (veil) {
        const acquiredAt = new Date(veil.acquiredAt);
        const now = new Date();
        const hoursSinceAcquired =
          (now.getTime() - acquiredAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceAcquired <= 24) {
          finalEntry.from = "Anonymous Komrade";
        }
      }
    }
  }

  // Build message once
  let message: string | undefined;
  try {
    message = buildUserTransferMessage({
      from: finalEntry.from,
      to: finalEntry.to,
      credits: Math.abs(finalEntry.amount),
      reason: finalEntry.reason,
    });
  } catch {}
  await db
    .collection("transactionHistory")
    .insertOne({ ...finalEntry, message });
}

// Provide a generic fallback formatted message
export function genericTransactionMessage(t: TransactionLog) {
  const dir = t.amount >= 0 ? `${t.from} -> ${t.to}` : `${t.to} -> ${t.from}`;
  return `${dir} : ${Math.abs(t.amount)}cr${t.reason ? ` (${t.reason})` : ""}`;
}
