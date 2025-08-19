"use client";
import BackHomeButton from "@/components/BackHomeButton";
import { useMemo, useState } from "react";
import { trpc } from "@/trpc/client";

// Shared input styling
const sharedInputClass = "w-full px-2 py-1 border-2 rounded-none font-mono text-xs sm:text-sm";

type AuctionType = "english" | "dutch";
type LogEntry = {
  timestamp: string;
  user: string;
  action: string;
  amount: number;
  memo: string;
};

export default function AdminBankPage() {
  // Create Money form state
  const [mintUserId, setMintUserId] = useState<string>("");
  const [mintAmount, setMintAmount] = useState<string>("");
  const [mintReason, setMintReason] = useState<string>("");
  // Source account selector: admin or class bank
  const [sourceAccount, setSourceAccount] = useState<"admin" | "classBank">("classBank");

  // Host Auctions form state
  const [itemName, setItemName] = useState<string>("");
  const [startingPrice, setStartingPrice] = useState<string>("");
  const [startTimeStr, setStartTimeStr] = useState<string>(() => new Date().toISOString().slice(0,16));
  const [endTimeStr, setEndTimeStr] = useState<string>(() => new Date(Date.now() + 3600 * 1000).toISOString().slice(0,16));
  const [auctionType, setAuctionType] = useState<AuctionType>("forward");

  // Mutation to create auction
  const createAuction = trpc.auction.create.useMutation();

  // Auditing state
  const [search, setSearch] = useState<string>("");
  // Settle Auction state
  const [settleAuctionId, setSettleAuctionId] = useState<string>("");
  const [useClassBankFlag, setUseClassBankFlag] = useState<boolean>(false);
  const settleMutation = trpc.auction.settle.useMutation();
  const meQuery = trpc.user.getMe.useQuery();

  // Fetch class bank status
  const classBankStatus = trpc.admin.classbank.getClassBankStatus.useQuery();
  // Mutation for credit updates
  const creditsMutation = trpc.admin.credits.updateCredits.useMutation();
  // Fetch activity logs
  const logsQuery = trpc.admin.activity.getActivityLogs.useQuery({ cursor: 0, limit: 100 });
  const logs = logsQuery.data?.items ?? [];
  // Map raw logs to display entries
  const logEntries: LogEntry[] = logs.map(log => ({
    timestamp: log.createdAt.toLocaleString(),
    user: log.data?.user || log.data?.from || '',
    action: log.action,
    amount: log.data?.amount || 0,
            {/* Host Auctions */}
            <section
              className="p-3 sm:p-4 border-4 rounded-none shadow-card-sm flex flex-col flex-1 min-w-0 lg:basis-[calc(33%-1rem)]"
              style={{ background: "var(--background)", borderColor: "var(--foreground)" }}
            >
              <h2 className="font-heading font-bold uppercase tracking-wider mb-2" style={{ color: "var(--accent)" }}>
                Host Auctions
              </h2>
              <form onSubmit={handleAuctionSubmit} className="flex flex-col gap-3">
                <div>
                  <label className="block font-heading text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    placeholder="Item name"
                    className={sharedInputClass}
                    style={{ borderColor: "var(--foreground)" }}
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-heading text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                    Starting Price
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    className={sharedInputClass}
                    style={{ borderColor: "var(--foreground)" }}
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                  />
                </div>
                <fieldset className="rounded-none border-2 p-2" style={{ borderColor: "var(--foreground)" }}>
                  <legend className="px-1 font-heading text-[10px] sm:text-xs uppercase tracking-widest">
                    Auction Type
                  </legend>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="auctionType"
                        value="forward"
                        checked={auctionType === "forward"}
                        onChange={() => setAuctionType("forward")}
                        className="accent-current"
                      />
                      <span className="font-mono text-xs sm:text-sm">Forward</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="auctionType"
                        value="reverse"
                        checked={auctionType === "reverse"}
                        onChange={() => setAuctionType("reverse")}
                        className="accent-current"
                      />
                      <span className="font-mono text-xs sm:text-sm">Reverse</span>
                    </label>
                  </div>
                </fieldset>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-none border-2 px-3 py-2 font-heading text-xs sm:text-sm font-bold uppercase tracking-wider hover:opacity-90"
                    style={{ background: "var(--accent)", color: "var(--background)", borderColor: "var(--foreground)" }}
                  >
                    CREATE AUCTION
                  </button>
                </div>
              </form>
            </section>
                    type="text"
                    placeholder="User ID"
                    className={sharedInputClass}
                    style={{ borderColor: "var(--foreground)" }}
                    value={mintUserId}
                    onChange={(e) => setMintUserId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-heading text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                    AMOUNT
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    className={sharedInputClass}
                    style={{ borderColor: "var(--foreground)" }}
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-heading text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                    REASON
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Reason / Memo"
                    className={sharedInputClass}
                    style={{ borderColor: "var(--foreground)" }}
                    value={mintReason}
                    onChange={(e) => setMintReason(e.target.value)}
                  />
                </div>
                {/* Source account selection */}
                <div>
                  <label className="block font-heading text-[10px] sm:text-xs uppercase tracking-widest mb-1">SOURCE</label>
                  <select
                    value={sourceAccount}
                    onChange={e => setSourceAccount(e.target.value as any)}
                    className={sharedInputClass}
                    style={{ borderColor: "var(--foreground)" }}
                  >
                    <option value="admin">Admin</option>
                    <option value="classBank">Class Bank</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-none border-2 px-3 py-2 font-heading text-xs sm:text-sm font-bold uppercase tracking-wider hover:opacity-90 active:opacity-100"
                    style={{
                      background: "var(--accent)",
                      color: "var(--background)",
                      borderColor: "var(--foreground)",
                    }}
                  >
                    MINT CREDITS
                  </button>
                </div>
              </form>
            </section>

            {/* Host Auctions */}
            <section
              className="p-3 sm:p-4 border-4 rounded-none shadow-card-sm flex flex-col flex-1 min-w-0 lg:basis-[calc(33%-1rem)]"
              style={{
                background: "var(--background)",
                borderColor: "var(--foreground)",
              }}
            >
              <h2
                className="font-heading font-bold uppercase tracking-wider mb-2"
                style={{ color: "var(--accent)" }}
              >
                Host Auctions
              </h2>
              <form onSubmit={handleAuctionSubmit} className="flex flex-col gap-3">
                <div>
                  <label className="block font-heading text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    placeholder="Item name"
                    className={sharedInputClass}
                    style={{ borderColor: "var(--foreground)" }}
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-heading text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                    Starting Price
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    className={sharedInputClass}
                    style={{ borderColor: "var(--foreground)" }}
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-heading text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    className={sharedInputClass}
                    style={{ borderColor: "var(--foreground)" }}
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-heading text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    className={sharedInputClass}
                    style={{ borderColor: "var(--foreground)" }}
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                  />
                    <div>
                      <label className="block font-heading text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                        Start Time
                      </label>
                      <input
                        type="datetime-local"
                        className={sharedInputClass}
                        style={{ borderColor: "var(--foreground)" }}
                        value={startTimeStr}
                        onChange={(e) => setStartTimeStr(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-heading text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                        End Time
                      </label>
                      <input
                        type="datetime-local"
                        className={sharedInputClass}
                        style={{ borderColor: "var(--foreground)" }}
                        value={endTimeStr}
                        onChange={(e) => setEndTimeStr(e.target.value)}
                      />
                    </div>
                </div>
                <fieldset
                  className="rounded-none border-2 p-2"
                  style={{ borderColor: "var(--foreground)" }}
                >
                  <legend className="px-1 font-heading text-[10px] sm:text-xs uppercase tracking-widest">
                    Auction Type
                  </legend>
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="auctionType"
                            value="english"
                            checked={auctionType === "english"}
                            onChange={() => setAuctionType("english")}
                            className="accent-current"
                          />
                          <span className="font-mono text-xs sm:text-sm">
                            English
                          </span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="auctionType"
                            value="dutch"
                            checked={auctionType === "dutch"}
                            onChange={() => setAuctionType("dutch")}
                            className="accent-current"
                          />
                          <span className="font-mono text-xs sm:text-sm">
                            Dutch
                          </span>
                        </label>
                    </label>
                  </div>
                </fieldset>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-none border-2 px-3 py-2 font-heading text-xs sm:text-sm font-bold uppercase tracking-wider hover:opacity-90"
                    style={{
                      background: "var(--accent)",
                      color: "var(--background)",
                      borderColor: "var(--foreground)",
                    }}
                  >
                    CREATE AUCTION
                  </button>
                </div>
              </form>
            </section>
+        
+          {/* Settle Auction */}
+          <section
+            className="p-3 sm:p-4 border-4 rounded-none shadow-card-sm flex flex-col flex-1 min-w-0 lg:basis-[calc(33%-1rem)]"
+            style={{ background: "var(--background)", borderColor: "var(--foreground)" }}
+          >
+            <h2 className="font-heading font-bold uppercase tracking-wider mb-2" style={{ color: "var(--accent)" }}>
+              Settle Auction
+            </h2>
+            <form onSubmit={async e => {
+              e.preventDefault();
+              await settleMutation.mutateAsync({ auctionId: settleAuctionId, useClassBank: useClassBankFlag });
+              setSettleAuctionId(""); setUseClassBankFlag(false);
+            }} className="flex flex-col gap-3">
+              <div>
+                <label className="block font-heading text-[10px] sm:text-xs uppercase tracking-widest mb-1">
+                  Auction ID
+                </label>
+                <input
+                  type="text"
+                  className={sharedInputClass}
+                  style={{ borderColor: "var(--foreground)" }}
+                  value={settleAuctionId}
+                  onChange={e => setSettleAuctionId(e.target.value)}
+                />
+              </div>
+              {meQuery.data?.user?.role === 'admin' && (
+                <div>
+                  <label className="inline-flex items-center gap-2">
+                    <input
+                      type="checkbox"
+                      checked={useClassBankFlag}
+                      onChange={e => setUseClassBankFlag(e.target.checked)}
+                      className="accent-current"
+                    />
+                    <span className="font-mono text-xs sm:text-sm">Use Class Bank</span>
+                  </label>
+                </div>
+              )}
+              <div className="flex justify-end">
+                <button
+                  type="submit"
+                  disabled={settleMutation.isLoading}
+                  className="rounded-none border-2 px-3 py-2 font-heading text-xs sm:text-sm font-bold uppercase tracking-wider hover:opacity-90"
+                  style={{ background: "var(--accent)", color: "var(--background)", borderColor: "var(--foreground)" }}
+                >
+                  {settleMutation.isLoading ? 'Settling…' : 'Settle'}
+                </button>
+              </div>
+            </form>
+          </section>

            {/* Monetary Auditing */}
            <section
              className="p-3 sm:p-4 border-4 rounded-none shadow-card-sm flex flex-col flex-1 min-w-0 lg:basis-[calc(33%-1rem)]"
              style={{
                background: "var(--background)",
                borderColor: "var(--foreground)",
              }}
            >
              <h2
                className="font-heading font-bold uppercase tracking-wider mb-2"
                style={{ color: "var(--accent)" }}
              >
                Monetary Auditing
              </h2>
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Search by User ID or Memo..."
                  className={sharedInputClass}
                  style={{ borderColor: "var(--foreground)" }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="overflow-x-auto">
                <table
                  className="min-w-full table-fixed border-2 text-left"
                  style={{ borderColor: "var(--foreground)" }}
                >
                  <thead>
                    <tr>
                      {["Timestamp", "User", "Action", "Amount", "Memo"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-2 py-2 font-heading text-[10px] sm:text-xs uppercase tracking-widest border-2"
                            style={{
                              borderColor: "var(--foreground)",
                              background: "var(--background)",
                              color: "var(--accent)",
                            }}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((row, idx) => (
                      <tr key={idx} className="align-top">
                        <td
                          className="px-2 py-2 border-2 font-mono text-xs sm:text-sm"
                          style={{ borderColor: "var(--foreground)" }}
                        >
                          {row.timestamp}
                        </td>
                        <td
                          className="px-2 py-2 border-2 font-mono text-xs sm:text-sm"
                          style={{ borderColor: "var(--foreground)" }}
                        >
                          {row.user === 'ANONYMITY_TOKEN_24H' ? 'anonymous' : row.user}
                        </td>
                        <td
                          className="px-2 py-2 border-2 font-mono text-xs sm:text-sm"
                          style={{ borderColor: "var(--foreground)" }}
                        >
                          {row.action}
                        </td>
                        <td
                          className="px-2 py-2 border-2 font-mono text-xs sm:text-sm"
                          style={{ borderColor: "var(--foreground)" }}
                        >
                          {row.amount}
                        </td>
                        <td
                          className="px-2 py-2 border-2 font-mono text-xs sm:text-sm"
                          style={{ borderColor: "var(--foreground)" }}
                        >
                          {row.memo}
                        </td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-2 py-4 border-2 font-mono text-xs sm:text-sm text-center opacity-70"
                          style={{ borderColor: "var(--foreground)" }}
                        >
                          No results.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
