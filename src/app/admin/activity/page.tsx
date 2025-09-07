"use client";

import BackHomeButton from "@/components/BackHomeButton";
import { useAdmin } from "@/hooks/useAdmin";
import {
  IconExchange,
  IconCoin,
  IconUser,
  IconAlertTriangle,
} from "@tabler/icons-react";

interface BaseActivityData {
  from?: string;
  to?: string;
  amount?: number;
  reason?: string; // transaction
  admin?: string;
  user?: string;
  sourceAccount?: string; // admin adjustments
  [key: string]: unknown;
}
interface ActivityLogEntry {
  _id: string;
  type: string;
  action: string;
  data: BaseActivityData | null;
  createdAt: string;
  message?: string;
  undone?: boolean;
  // Enriched transactionHistory fields
  itemId?: string;
  itemName?: string;
  purchaser?: string;
  // Some documents from transactionHistory also include raw fields
  from?: string;
  to?: string;
}

export default function AdminActivityPage() {
  // Use tRPC hook for activity data
  const { data: activityData, isLoading: loading } = useAdmin().getActivity(
    0,
    50
  );
  const items = (activityData?.items || ([] as unknown)) as ActivityLogEntry[];

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-4 lg:px-6 py-4">
        <div
          className="p-3 sm:p-4 lg:p-5 border-4 rounded-none shadow-card mb-4"
          style={{
            background: "var(--background)",
            borderColor: "var(--foreground)",
          }}
        >
          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
            <h1
              className="font-heading text-xl sm:text-2xl font-extrabold uppercase tracking-wider"
              style={{ color: "var(--accent)" }}
            >
              Activity
            </h1>
            <BackHomeButton className="mt-1" />
          </div>
          <p className="font-mono text-xs sm:text-sm opacity-80 mt-1">
            Chronological system activity feed.
          </p>
        </div>

        <div
          className="p-3 sm:p-4 border-4 rounded-none shadow-card-sm"
          style={{
            background: "var(--background)",
            borderColor: "var(--foreground)",
          }}
        >
          {items.length === 0 && !loading ? (
            <div className="font-mono text-xs opacity-80">No activity yet.</div>
          ) : (
            <ul
              className="divide-y-2"
              style={{ borderColor: "var(--foreground)" }}
            >
              {items.map((a) => (
                <li
                  key={a._id}
                  className="py-2 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4"
                >
                  <div className="font-mono text-[10px] sm:text-xs opacity-80 w-40 shrink-0">
                    {new Date(a.createdAt).toLocaleString()}
                  </div>
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <ActionIcon action={a.action} />
                    <div className="text-xs sm:text-sm leading-relaxed break-words flex-1 min-w-0">
                      {renderMessage(a)}
                    </div>
                  </div>
                  {a.undone && (
                    <div className="text-[10px] font-mono uppercase tracking-wider text-danger">
                      UNDONE
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionIcon({ action }: { action: string }) {
  switch (action) {
    case "credit_transfer":
      return <IconExchange size={18} />;
    case "mint":
    case "burn":
      return <IconCoin size={18} />;
    case "login":
    case "signup":
      return <IconUser size={18} />;
    default:
      return <IconAlertTriangle size={18} />;
  }
}

function renderMessage(a: ActivityLogEntry) {
  if (a.message)
    return (
      <span
        className="font-mono"
        dangerouslySetInnerHTML={{ __html: a.message }}
      />
    );
  // Marketplace purchases from consolidated transactionHistory
  if ((a as any).type === "marketplace_purchase") {
    const itemName = (a as any).itemName || (a.data as any)?.itemName || "item";
    const buyer =
      (a as any).purchaser || a.data?.from || (a as any).from || "someone";
    return (
      <span className="font-mono">
        <strong>{buyer}</strong> purchased <strong>{itemName}</strong>
      </span>
    );
  }
  if (a.action === "credit_transfer" && a.data) {
    const d = a.data;
    return (
      <span className="font-mono">
        <strong>{d.from}</strong> → <strong>{d.to}</strong> : {d.amount}cr
        {d.reason ? ` (${d.reason})` : ""}
      </span>
    );
  }
  return (
    <span className="font-mono">
      {a.type}/{a.action}
    </span>
  );
}
