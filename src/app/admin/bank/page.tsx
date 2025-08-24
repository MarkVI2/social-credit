"use client";
import BackHomeButton from "@/components/BackHomeButton";
import { trpc } from "@/trpc/client";
import { useState } from "react";

const sharedInputClass =
  "w-full px-2 py-1 border-2 rounded-none font-mono text-xs sm:text-sm";

export default function AdminBankPage() {
  // Mint form
  const [targetUserId, setTargetUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [toAll, setToAll] = useState(false);
  const mint = trpc.admin.credits.mintSupply.useMutation();

  // Auctions
  const [itemName, setItemName] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [startTime, setStartTime] = useState(() =>
    new Date().toISOString().slice(0, 16)
  );
  const [endTime, setEndTime] = useState(() =>
    new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16)
  );
  const [payoutToClassBank, setPayoutToClassBank] = useState(true);
  const createAuction = trpc.auction.create.useMutation();
  const settleAuction = trpc.auction.settle.useMutation();

  // Class bank status
  const classBankStatus = trpc.admin.classbank.getClassBankStatus.useQuery();

  // Transactions auditing filters
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [type, setType] = useState("");
  const [fromStr, setFromStr] = useState("");
  const [toStr, setToStr] = useState("");
  const txQuery = trpc.admin.transactions.list.useQuery({
    page,
    pageSize: 25,
    q: q || undefined,
    sender: sender || undefined,
    receiver: receiver || undefined,
    type: type || undefined,
    from: fromStr ? new Date(fromStr) : undefined,
    to: toStr ? new Date(toStr) : undefined,
  });

  async function onMintSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    await mint.mutateAsync({
      amount: amt,
      reason,
      targetUserId: toAll ? undefined : targetUserId || undefined,
      distributeToAll: toAll,
    });
    setAmount("");
    setReason("");
    setTargetUserId("");
    setToAll(false);
  }

  async function onCreateAuction(e: React.FormEvent) {
    e.preventDefault();
    const sp = Number(startingPrice) || undefined;
    await createAuction.mutateAsync({
      itemName,
      auctionType: "english",
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      startingBid: sp,
      payoutToClassBank,
    } as any);
    setItemName("");
    setStartingPrice("");
  }

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
              Bank
            </h1>
            <BackHomeButton className="mt-1" />
          </div>
          <p className="font-mono text-xs sm:text-sm opacity-80 mt-1">
            Mint currency, audit transactions, and host class-funded auctions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Mint credits */}
          <section
            className="p-3 sm:p-4 border-4 rounded-none shadow-card-sm"
            style={{
              background: "var(--background)",
              borderColor: "var(--foreground)",
            }}
          >
            <h2
              className="font-heading font-bold uppercase tracking-wider mb-2"
              style={{ color: "var(--accent)" }}
            >
              Mint Credits
            </h2>
            <form onSubmit={onMintSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block font-heading text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                  User ID (optional)
                </label>
                <input
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="Mongo _id"
                  className={sharedInputClass}
                  style={{ borderColor: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block font-heading text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={sharedInputClass}
                  style={{ borderColor: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block font-heading text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                  Reason
                </label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={sharedInputClass}
                  style={{ borderColor: "var(--foreground)" }}
                />
              </div>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={toAll}
                  onChange={(e) => setToAll(e.target.checked)}
                  className="accent-current"
                />
                <span className="font-mono text-xs sm:text-sm">
                  Distribute to all users
                </span>
              </label>
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
                  Mint
                </button>
              </div>
            </form>
            <div className="mt-3 font-mono text-xs opacity-80">
              Class Bank: {classBankStatus.data?.balance ?? 0} cr
            </div>
          </section>

          {/* Host auction */}
          <section
            className="p-3 sm:p-4 border-4 rounded-none shadow-card-sm"
            style={{
              background: "var(--background)",
              borderColor: "var(--foreground)",
            }}
          >
            <h2
              className="font-heading font-bold uppercase tracking-wider mb-2"
              style={{ color: "var(--accent)" }}
            >
              Host Auction
            </h2>
            <form onSubmit={onCreateAuction} className="flex flex-col gap-3">
              <div>
                <label className="block font-heading text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                  Item Name
                </label>
                <input
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className={sharedInputClass}
                  style={{ borderColor: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block font-heading text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                  Starting Bid
                </label>
                <input
                  type="number"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                  className={sharedInputClass}
                  style={{ borderColor: "var(--foreground)" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-heading text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                    Start
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={sharedInputClass}
                    style={{ borderColor: "var(--foreground)" }}
                  />
                </div>
                <div>
                  <label className="block font-heading text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                    End
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={sharedInputClass}
                    style={{ borderColor: "var(--foreground)" }}
                  />
                </div>
              </div>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={payoutToClassBank}
                  onChange={(e) => setPayoutToClassBank(e.target.checked)}
                  className="accent-current"
                />
                <span className="font-mono text-xs sm:text-sm">
                  Payout to Class Bank
                </span>
              </label>
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
                  Create
                </button>
              </div>
            </form>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const id = prompt("Auction ID to settle?") || "";
                if (!id) return;
                await settleAuction.mutateAsync({
                  auctionId: id,
                  useClassBank: payoutToClassBank,
                });
              }}
              className="mt-3"
            >
              <button
                type="submit"
                className="rounded-none border-2 px-3 py-2 font-heading text-xs sm:text-sm font-bold uppercase tracking-wider"
                style={{
                  background: "var(--accent)",
                  color: "var(--background)",
                  borderColor: "var(--foreground)",
                }}
              >
                Settle Auction…
              </button>
            </form>
          </section>

          {/* Auditing */}
          <section
            className="p-3 sm:p-4 border-4 rounded-none shadow-card-sm"
            style={{
              background: "var(--background)",
              borderColor: "var(--foreground)",
            }}
          >
            <h2
              className="font-heading font-bold uppercase tracking-wider mb-2"
              style={{ color: "var(--accent)" }}
            >
              Transactions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search reason/from/to"
                className={sharedInputClass}
                style={{ borderColor: "var(--foreground)" }}
              />
              <input
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="Sender"
                className={sharedInputClass}
                style={{ borderColor: "var(--foreground)" }}
              />
              <input
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                placeholder="Receiver"
                className={sharedInputClass}
                style={{ borderColor: "var(--foreground)" }}
              />
              <input
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="Type (e.g., marketplace_purchase)"
                className={sharedInputClass}
                style={{ borderColor: "var(--foreground)" }}
              />
              <input
                type="date"
                value={fromStr}
                onChange={(e) => setFromStr(e.target.value)}
                className={sharedInputClass}
                style={{ borderColor: "var(--foreground)" }}
              />
              <input
                type="date"
                value={toStr}
                onChange={(e) => setToStr(e.target.value)}
                className={sharedInputClass}
                style={{ borderColor: "var(--foreground)" }}
              />
            </div>
            <div className="mb-2 flex gap-2">
              <button
                onClick={() => txQuery.refetch()}
                className="rounded-none border-2 px-3 py-2 font-heading text-[10px] sm:text-xs font-bold uppercase tracking-wider"
                style={{
                  background: "var(--accent)",
                  color: "var(--background)",
                  borderColor: "var(--foreground)",
                }}
              >
                Apply
              </button>
              <button
                onClick={() => {
                  setQ("");
                  setSender("");
                  setReceiver("");
                  setType("");
                  setFromStr("");
                  setToStr("");
                  setPage(1);
                }}
                className="rounded-none border-2 px-3 py-2 font-heading text-[10px] sm:text-xs font-bold uppercase tracking-wider"
                style={{ borderColor: "var(--foreground)" }}
              >
                Reset
              </button>
            </div>
            <div className="overflow-auto max-h-80">
              <table className="w-full text-xs sm:text-sm font-mono">
                <thead>
                  <tr
                    className="text-left border-b-2"
                    style={{ borderColor: "var(--foreground)" }}
                  >
                    <th className="py-1 pr-2">Time</th>
                    <th className="py-1 pr-2">From</th>
                    <th className="py-1 pr-2">To</th>
                    <th className="py-1 pr-2">Amount</th>
                    <th className="py-1 pr-2">Type</th>
                    <th className="py-1 pr-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {(txQuery.data?.items || []).map((t: any, i: number) => (
                    <tr
                      key={i}
                      className="border-b last:border-b-0"
                      style={{ borderColor: "var(--foreground)" }}
                    >
                      <td className="py-1 pr-2">
                        {new Date(t.timestamp).toLocaleString()}
                      </td>
                      <td className="py-1 pr-2">{t.from}</td>
                      <td className="py-1 pr-2">{t.to}</td>
                      <td className="py-1 pr-2">{t.amount}</td>
                      <td className="py-1 pr-2">{t.type || "peer_transfer"}</td>
                      <td className="py-1 pr-2">{t.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                className="rounded-none border-2 px-2 py-1 font-heading text-[10px] uppercase"
                style={{ borderColor: "var(--foreground)" }}
              >
                Prev
              </button>
              <div className="font-mono text-xs">Page {page}</div>
              <button
                onClick={() => setPage(page + 1)}
                className="rounded-none border-2 px-2 py-1 font-heading text-[10px] uppercase"
                style={{ borderColor: "var(--foreground)" }}
              >
                Next
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
