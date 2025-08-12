"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BackHomeButton from "@/components/BackHomeButton";
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
}

export default function AdminActivityPage() {
  const [items, setItems] = useState<ActivityLogEntry[]>([]);
  // External cursor state no longer needed (using ref); retained only if UI display needed later
  // Removed unused cursor state to satisfy lint
  // Keep an internal mutable cursor to avoid recreating callbacks & effects
  const cursorRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const lastFetchRef = useRef(0); // throttle timestamp
  const THROTTLE_MS = 1000; // minimum ms between sequential fetches

  const load = useCallback(
    async (reset = false) => {
      const now = Date.now();
      if (loading) return; // respect current in-flight
      if (!reset && now - lastFetchRef.current < THROTTLE_MS) return; // throttle successive scroll hits
      lastFetchRef.current = now;
      const start = reset ? 0 : cursorRef.current;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/activity?cursor=${start}&limit=40`,
          {
            cache: "no-store",
          }
        );
        if (res.status === 401) {
          window.location.href = "/auth/login";
          return;
        }
        const data = await res.json();
        if (data.success) {
          type RawId = { $oid: string } | string | undefined;
          interface RawActivity {
            _id?: RawId;
            createdAt?: string | Date;
            type?: string;
            action?: string;
            data?: BaseActivityData | null;
            message?: string;
            undone?: boolean;
          }
          const newItems: ActivityLogEntry[] = (
            data.items as RawActivity[]
          ).map((raw) => {
            const idSource = raw._id;
            const resolvedId =
              typeof idSource === "string"
                ? idSource
                : idSource && typeof idSource === "object" && "$oid" in idSource
                ? (idSource as { $oid: string }).$oid
                : Math.random().toString(36).slice(2);
            const createdAtVal = raw.createdAt;
            return {
              _id: resolvedId,
              type: raw.type || "unknown",
              action: raw.action || "unknown",
              data: raw.data ?? null,
              message: raw.message,
              undone: raw.undone,
              createdAt:
                typeof createdAtVal === "string"
                  ? createdAtVal
                  : createdAtVal instanceof Date
                  ? createdAtVal.toISOString()
                  : new Date().toISOString(),
            } as ActivityLogEntry;
          });
          setItems((prev) => (reset ? newItems : [...prev, ...newItems]));
          const next = data.nextCursor || start + newItems.length;
          // Update internal cursor ref for pagination
          cursorRef.current = next;
          if (!newItems.length || next >= data.total) setHasMore(false);
        }
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  // Initial load only once
  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasMore) return;
    const el = loadingRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) load();
        });
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [load, hasMore]);

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
          {hasMore && (
            <div
              ref={loadingRef}
              className="py-4 text-center font-mono text-xs opacity-70"
            >
              {loading ? "Loading…" : "Load more"}
            </div>
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
  if (a.message) return a.message;
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
