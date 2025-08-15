"use client";
import BackHomeButton from "@/components/BackHomeButton";
import { useMemo, useState } from "react";

type AuctionType = "forward" | "reverse";
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

  // Host Auctions form state
  const [itemName, setItemName] = useState<string>("");
  const [startingPrice, setStartingPrice] = useState<string>("");
  const [auctionType, setAuctionType] = useState<AuctionType>("forward");

  // Auditing state
  const [search, setSearch] = useState<string>("");

  const demoLogs: LogEntry[] = useMemo(
    () => [
      {
        timestamp: "2025-08-10 09:24",
        user: "usr_1A2B3C",
        action: "MINT",
        amount: 250,
        memo: "Initial class stipend",
      },
      {
        timestamp: "2025-08-11 14:05",
        user: "usr_9Z8Y7X",
        action: "TRANSFER",
        amount: -40,
        memo: "Marketplace: Notebook",
      },
      {
        timestamp: "2025-08-12 18:42",
        user: "usr_1A2B3C",
        action: "BURN",
        amount: -20,
        memo: "Fine: Late submission",
      },
      {
        timestamp: "2025-08-13 10:10",
        user: "usr_5K6L7M",
        action: "MINT",
        amount: 100,
        memo: "Auction reward",
      },
    ],
    []
  );

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return demoLogs;
    return demoLogs.filter((l) =>
      [l.user, l.memo].some((v) => v.toLowerCase().includes(q))
    );
  }, [demoLogs, search]);

  const sharedInputClass =
    "rounded-none border-2 w-full bg-transparent px-2 py-2 font-mono text-xs sm:text-sm focus:outline-none focus:ring-0";

  const handleMintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder submit: wire this to POST /api/admin/update-credits or similar in future.
    // Keeping values as strings to allow empty state; parse as needed.
    console.log("MINT", {
      userId: mintUserId.trim(),
      amount: Number(mintAmount || 0),
      reason: mintReason.trim(),
    });
  };

  const handleAuctionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("AUCTION", {
      itemName: itemName.trim(),
      startingPrice: Number(startingPrice || 0),
      auctionType,
    });
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-4 lg:px-6 py-4">
        <div className="flex flex-col gap-3">
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
                Bank Access
              </h1>
              <BackHomeButton className="mt-1" />
            </div>
            <p className="font-mono text-xs sm:text-sm opacity-80 mt-1">
              Create money, host auctions, and audit monetary flows.
            </p>
          </div>

          {/* Responsive flex layout: stack on mobile, 3-up row on large screens */}
          <div className="flex flex-col lg:flex-row flex-wrap gap-4">
            {/* Create Money */}
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
                Create Money
              </h2>
              <form onSubmit={handleMintSubmit} className="flex flex-col gap-3">
                <div>
                  <label className="block font-heading text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                    TARGET USER
                  </label>
                  <input
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
              <form
                onSubmit={handleAuctionSubmit}
                className="flex flex-col gap-3"
              >
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
                <fieldset
                  className="rounded-none border-2 p-2"
                  style={{ borderColor: "var(--foreground)" }}
                >
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
                      <span className="font-mono text-xs sm:text-sm">
                        Forward
                      </span>
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
                      <span className="font-mono text-xs sm:text-sm">
                        Reverse
                      </span>
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
                          {row.user}
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
