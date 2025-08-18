"use client";

import { useMemo, useState } from "react";
import BackHomeButton from "@/components/BackHomeButton";
import { trpc } from "@/trpc/client";

// Types for store items (kept minimal; align with backend when available)
type StoreItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
};

// Simple modal component
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{ background: "rgba(0,0,0,0.5)" }}
      />
      <div
        className="relative w-[95%] max-w-xl p-3 sm:p-4 border-4 rounded-none shadow-card"
        style={{
          background: "var(--background)",
          borderColor: "var(--foreground)",
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          {title ? (
            <h3
              className="font-heading font-bold uppercase tracking-wider"
              style={{ color: "var(--accent)" }}
            >
              {title}
            </h3>
          ) : (
            <span />
          )}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="font-mono text-xs sm:text-sm px-2 py-1 border-2 rounded-none"
            style={{
              background: "transparent",
              color: "var(--foreground)",
              borderColor: "var(--foreground)",
            }}
          >
            ✕
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

// Helper: Card for a single marketplace item (handles purchase mutation)
function MarketplaceItemCard({
  item,
  owned,
}: {
  item: StoreItem;
  owned?: boolean;
}) {
  const utils = trpc.useUtils();
  // Note: marketplace router may not exist yet; guard to avoid runtime errors
  const marketplaceTrpc = (trpc as any).marketplace as
    | { purchaseItem: { useMutation: Function } }
    | undefined;

  const purchase = marketplaceTrpc?.purchaseItem?.useMutation?.({
    onSuccess: async () => {
      // Invalidate user data to refresh credit balance
      await utils.user.getMe.invalidate();
    },
  });

  const disabled = !purchase || purchase.isLoading || owned;

  return (
    <div
      className="p-3 sm:p-4 border-4 rounded-none shadow-card-sm flex flex-col gap-2"
      style={{
        background: "var(--background)",
        borderColor: "var(--foreground)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className="font-heading font-bold uppercase tracking-wider text-sm sm:text-base"
          style={{ color: "var(--accent)" }}
        >
          {item.name}
        </h3>
        <span
          className="font-mono text-xs sm:text-sm"
          style={{ color: "var(--foreground)" }}
        >
          {item.price} cr
        </span>
      </div>
      {owned ? (
        <p className="font-mono text-[10px] sm:text-xs opacity-70">
          Already unlocked
        </p>
      ) : null}
      {item.description ? (
        <p className="font-mono text-xs sm:text-sm opacity-80">
          {item.description}
        </p>
      ) : null}
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => purchase?.mutate?.({ itemId: item.id })}
          disabled={disabled}
          className="px-3 py-1 border-2 rounded-none font-mono text-xs sm:text-sm"
          style={{
            background: disabled ? "transparent" : "var(--accent)",
            color: disabled ? "var(--foreground)" : "var(--background)",
            borderColor: "var(--foreground)",
            opacity: disabled ? 0.4 : 1,
          }}
        >
          {purchase?.isLoading ? "Purchasing…" : "Purchase"}
        </button>
      </div>
    </div>
  );
}

// Admin: Create Marketplace Item
function AdminItemCreator() {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");

  const adminCreate = trpc.marketplace.createItem.useMutation({
    onSuccess: async () => {
      try {
        await utils.marketplace.listItems.invalidate();
      } catch {}
      alert("The Decree has been recorded!");
      setName("");
      setDescription("");
      setPrice("");
    },
    onError: () =>
      alert("A directive has failed. The Committee is displeased."),
  });

  const canSubmit = name && typeof price === "number";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adminCreate.mutate({ name, description, price: Number(price) });
  };

  return (
    <section
      className="p-3 sm:p-4 border-4 rounded-none shadow-card-sm mb-3"
      style={{
        background: "var(--background)",
        borderColor: "var(--foreground)",
      }}
    >
      <h3
        className="font-heading font-bold uppercase tracking-wider mb-2"
        style={{ color: "var(--accent)" }}
      >
        Decree of the Central Committee: Add Item to People's Store
      </h3>
      <form className="flex flex-col gap-2" onSubmit={onSubmit}>
        <label className="font-mono text-xs sm:text-sm">
          <span className="mr-2">Item Decreed:</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name of the glorious item..."
            className="w-full px-2 py-1 border-2 rounded-none"
            style={{
              background: "transparent",
              color: "var(--foreground)",
              borderColor: "var(--foreground)",
            }}
          />
        </label>
        {/* System assigns Item ID automatically */}
        <label className="font-mono text-xs sm:text-sm">
          <span className="mr-2">Aims:</span>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A description befitting its purpose..."
            className="w-full px-2 py-1 border-2 rounded-none"
            style={{
              background: "transparent",
              color: "var(--foreground)",
              borderColor: "var(--foreground)",
            }}
          />
        </label>
        <label className="font-mono text-xs sm:text-sm">
          <span className="mr-2">Value:</span>
          <input
            type="number"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="Price in Social Credits (e.g., 150)"
            className="w-full px-2 py-1 border-2 rounded-none"
            style={{
              background: "transparent",
              color: "var(--foreground)",
              borderColor: "var(--foreground)",
            }}
          />
        </label>
        <div className="mt-2">
          <button
            type="submit"
            disabled={!canSubmit || adminCreate.isPending}
            className="px-3 py-1 border-2 rounded-none font-mono text-xs sm:text-sm"
            style={{
              background: !canSubmit ? "transparent" : "var(--accent)",
              color: !canSubmit ? "var(--foreground)" : "var(--background)",
              borderColor: "var(--foreground)",
              opacity: !canSubmit || adminCreate.isPending ? 0.6 : 1,
            }}
          >
            {adminCreate.isPending ? "Submitting…" : "Submit Decree"}
          </button>
        </div>
      </form>
    </section>
  );
}

// Admin: Create Auction
function AdminAuctionCreator() {
  const utils = trpc.useUtils();
  const [auctionType, setAuctionType] = useState<"english" | "dutch">(
    "english"
  );
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [startTime, setStartTime] = useState(""); // ISO local string
  const [endTime, setEndTime] = useState("");
  const [startingBid, setStartingBid] = useState<number | "">("");
  const [startingPrice, setStartingPrice] = useState<number | "">("");
  const [reservePrice, setReservePrice] = useState<number | "">("");
  const [decrementAmount, setDecrementAmount] = useState<number | "">("");
  const [decrementInterval, setDecrementInterval] = useState<number | "">("");

  // Prefer hypothetical admin.createAuction, fallback to auction.create
  const adminCreateAuction = (trpc as any)?.admin?.createAuction?.useMutation
    ? (trpc as any).admin.createAuction.useMutation
    : (trpc as any)?.auction?.create?.useMutation;

  const createAuction = adminCreateAuction
    ? adminCreateAuction({
        onSuccess: async () => {
          try {
            (await (trpc as any).auction?.list) && utils.invalidate();
          } catch {}
          alert("The auction is now the will of the people.");
          setItemName("");
          setItemDescription("");
          setStartTime("");
          setEndTime("");
          setStartingBid("");
          setStartingPrice("");
          setReservePrice("");
          setDecrementAmount("");
          setDecrementInterval("");
        },
        onError: () =>
          alert("A directive has failed. The Committee is displeased."),
      })
    : undefined;

  const canSubmit = useMemo(() => {
    if (!createAuction) return false;
    if (!itemName || !startTime) return false;
    if (auctionType === "english")
      return !!endTime && typeof startingBid === "number";
    return (
      typeof startingPrice === "number" &&
      typeof reservePrice === "number" &&
      typeof decrementAmount === "number" &&
      typeof decrementInterval === "number"
    );
  }, [
    createAuction,
    itemName,
    startTime,
    endTime,
    auctionType,
    startingBid,
    startingPrice,
    reservePrice,
    decrementAmount,
    decrementInterval,
  ]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createAuction) return alert("Directive endpoint unavailable.");
    const payload: any = {
      itemName,
      itemDescription: itemDescription || undefined,
      auctionType,
      startTime: new Date(startTime),
      endTime: new Date(endTime || startTime), // ensure required per router
    };
    if (auctionType === "english") {
      payload.startingBid = startingBid;
    } else {
      payload.startingPrice = startingPrice;
      payload.reservePrice = reservePrice;
      payload.decrementAmount = decrementAmount;
      payload.decrementInterval = decrementInterval;
    }
    createAuction.mutate(payload);
  };

  return (
    <section
      className="p-3 sm:p-4 border-4 rounded-none shadow-card-sm mb-3"
      style={{
        background: "var(--background)",
        borderColor: "var(--foreground)",
      }}
    >
      <h3
        className="font-heading font-bold uppercase tracking-wider mb-2"
        style={{ color: "var(--accent)" }}
      >
        Proclaim a New Spectacle for the People
      </h3>
      <form className="flex flex-col gap-2" onSubmit={onSubmit}>
        <label className="font-mono text-xs sm:text-sm">
          <span className="mr-2">Item Decreed:</span>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Name of the glorious item..."
            className="w-full px-2 py-1 border-2 rounded-none"
            style={{
              background: "transparent",
              color: "var(--foreground)",
              borderColor: "var(--foreground)",
            }}
          />
        </label>
        <label className="font-mono text-xs sm:text-sm">
          <span className="mr-2">Aims:</span>
          <input
            type="text"
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
            placeholder="A description befitting its purpose..."
            className="w-full px-2 py-1 border-2 rounded-none"
            style={{
              background: "transparent",
              color: "var(--foreground)",
              borderColor: "var(--foreground)",
            }}
          />
        </label>
        <label className="font-mono text-xs sm:text-sm">
          <span className="mr-2">Type of Proclamation:</span>
          <select
            value={auctionType}
            onChange={(e) => setAuctionType(e.target.value as any)}
            className="px-2 py-1 border-2 rounded-none"
            style={{
              background: "transparent",
              color: "var(--foreground)",
              borderColor: "var(--foreground)",
            }}
          >
            <option value="english">English</option>
            <option value="dutch">Dutch</option>
          </select>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="font-mono text-xs sm:text-sm">
            <span className="mr-2">Commencement:</span>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-2 py-1 border-2 rounded-none"
              style={{
                background: "transparent",
                color: "var(--foreground)",
                borderColor: "var(--foreground)",
              }}
            />
          </label>
          <label className="font-mono text-xs sm:text-sm">
            <span className="mr-2">Conclusion:</span>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-2 py-1 border-2 rounded-none"
              style={{
                background: "transparent",
                color: "var(--foreground)",
                borderColor: "var(--foreground)",
              }}
              disabled={auctionType !== "english"}
            />
          </label>
        </div>

        {auctionType === "english" ? (
          <label className="font-mono text-xs sm:text-sm">
            <span className="mr-2">Starting bid for the proletariat...</span>
            <input
              type="number"
              value={startingBid}
              onChange={(e) =>
                setStartingBid(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="w-full px-2 py-1 border-2 rounded-none"
              style={{
                background: "transparent",
                color: "var(--foreground)",
                borderColor: "var(--foreground)",
              }}
            />
          </label>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="font-mono text-xs sm:text-sm">
              <span className="mr-2">Opening price:</span>
              <input
                type="number"
                value={startingPrice}
                onChange={(e) =>
                  setStartingPrice(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="w-full px-2 py-1 border-2 rounded-none"
                style={{
                  background: "transparent",
                  color: "var(--foreground)",
                  borderColor: "var(--foreground)",
                }}
                placeholder="Price in Social Credits (e.g., 150)"
              />
            </label>
            <label className="font-mono text-xs sm:text-sm">
              <span className="mr-2">Reserve price:</span>
              <input
                type="number"
                value={reservePrice}
                onChange={(e) =>
                  setReservePrice(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="w-full px-2 py-1 border-2 rounded-none"
                style={{
                  background: "transparent",
                  color: "var(--foreground)",
                  borderColor: "var(--foreground)",
                }}
              />
            </label>
            <label className="font-mono text-xs sm:text-sm">
              <span className="mr-2">Decrement amount:</span>
              <input
                type="number"
                value={decrementAmount}
                onChange={(e) =>
                  setDecrementAmount(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="w-full px-2 py-1 border-2 rounded-none"
                style={{
                  background: "transparent",
                  color: "var(--foreground)",
                  borderColor: "var(--foreground)",
                }}
              />
            </label>
            <label className="font-mono text-xs sm:text-sm">
              <span className="mr-2">Decrement interval (sec):</span>
              <input
                type="number"
                value={decrementInterval}
                onChange={(e) =>
                  setDecrementInterval(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="w-full px-2 py-1 border-2 rounded-none"
                style={{
                  background: "transparent",
                  color: "var(--foreground)",
                  borderColor: "var(--foreground)",
                }}
              />
            </label>
          </div>
        )}

        <div className="mt-2">
          <button
            type="submit"
            disabled={!canSubmit || createAuction?.isLoading}
            className="px-3 py-1 border-2 rounded-none font-mono text-xs sm:text-sm"
            style={{
              background: !canSubmit ? "transparent" : "var(--accent)",
              color: !canSubmit ? "var(--foreground)" : "var(--background)",
              borderColor: "var(--foreground)",
              opacity: !canSubmit || createAuction?.isLoading ? 0.6 : 1,
            }}
          >
            {createAuction?.isLoading ? "Proclaiming…" : "Unleash Auction"}
          </button>
        </div>
      </form>
    </section>
  );
}

// Helper: People's Store (lists items via tRPC and renders cards)
function PeoplesStore({ user }: { user?: { role?: "user" | "admin" } | null }) {
  // Always call this hook first to keep hook order stable across renders
  const me = trpc.user.getMe.useQuery(undefined, { staleTime: 5000 });
  const myRank = (me.data?.user as any)?.rank as string | undefined;
  // Router may not exist yet; safe-guard the hook usage
  const marketplaceTrpc = (trpc as any).marketplace as
    | { listItems: { useQuery: Function } }
    | undefined;

  // Only call the hook if available (consistent across renders since code is static)
  const listQuery = marketplaceTrpc?.listItems?.useQuery
    ? marketplaceTrpc.listItems.useQuery()
    : undefined;

  if (!listQuery) {
    return (
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
          People’s Store
        </h2>
        <p className="font-mono text-xs sm:text-sm opacity-80">
          The People's Store is awaiting directives from the Committee. All is
          quiet.
        </p>
      </section>
    );
  }

  if (listQuery.isLoading) {
    return (
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
          People’s Store
        </h2>
        <p className="font-mono text-xs sm:text-sm opacity-80">
          Loading items…
        </p>
      </section>
    );
  }

  if (listQuery.error) {
    return (
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
          People’s Store
        </h2>
        <p className="font-mono text-xs sm:text-sm opacity-80">
          Error loading items. Please retry.
        </p>
      </section>
    );
  }

  const items = (listQuery.data?.items || listQuery.data) as
    | StoreItem[]
    | undefined;

  return (
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
        People’s Store
      </h2>
      {items && items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((it) => {
            const owned =
              !!myRank && / Badge$/.test(it.name) && it.name.startsWith(myRank);
            return <MarketplaceItemCard key={it.id} item={it} owned={owned} />;
          })}
        </div>
      ) : (
        <p className="font-mono text-xs sm:text-sm opacity-80">
          The People's Store is awaiting directives from the Committee. All is
          quiet.
        </p>
      )}
      {user ? (
        <div className="mt-4">
          <h3
            className="font-heading uppercase tracking-wider text-sm mb-2"
            style={{ color: "var(--accent)" }}
          >
            Your Committee-Issued Possessions
          </h3>
          <UserInventoryInline />
        </div>
      ) : null}
    </section>
  );
}

function UserInventoryInline() {
  const inv = trpc.marketplace.getMyInventory.useQuery(undefined, {
    staleTime: 5_000,
  });
  if (inv.isLoading)
    return <p className="font-mono text-xs opacity-80">Surveying holdings…</p>;
  if (inv.error)
    return (
      <p className="font-mono text-xs opacity-80">Could not load holdings.</p>
    );
  const items = inv.data || [];
  if (items.length === 0)
    return <p className="font-mono text-xs opacity-80">None recorded.</p>;
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map((it: any) => (
        <li
          key={it.id}
          className="p-2 border-4 rounded-none"
          style={{ borderColor: "var(--foreground)" }}
        >
          <div
            className="font-heading uppercase tracking-wider"
            style={{ color: "var(--accent)" }}
          >
            {it.name}
          </div>
          <div className="font-mono text-[11px] opacity-80">
            {it.description}
          </div>
        </li>
      ))}
    </ul>
  );
}

// Helper: Auction House with admin creation and empty state
function AuctionHouse({ user }: { user?: { role?: "user" | "admin" } | null }) {
  // Prefer auction.list if available
  const auctionListHook = (trpc as any)?.auction?.list?.useQuery as
    | ((input?: any) => { isLoading: boolean; error?: any; data?: any })
    | undefined;
  const listQuery = auctionListHook
    ? auctionListHook({ status: "active", limit: 10 })
    : undefined;

  const auctions = listQuery?.data?.items ?? [];

  return (
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
        Auction Administration
      </h2>

      {!listQuery ? (
        <p className="font-mono text-xs sm:text-sm opacity-80">
          The Auction Block is silent. Awaiting a new spectacle to galvanize the
          Komrades.
        </p>
      ) : listQuery.isLoading ? (
        <p className="font-mono text-xs sm:text-sm opacity-80">
          Summoning the spectacle…
        </p>
      ) : listQuery.error ? (
        <p className="font-mono text-xs sm:text-sm opacity-80">
          A directive has failed. The Committee is displeased.
        </p>
      ) : auctions.length === 0 ? (
        <p className="font-mono text-xs sm:text-sm opacity-80">
          The Auction Block is silent. Awaiting a new spectacle to galvanize the
          Komrades.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Placeholder for auctions list and future admin controls */}
          {auctions.map((a: any, idx: number) => (
            <div
              key={a._id?.toString?.() ?? idx}
              className="p-3 border-4 rounded-none shadow-card-sm"
              style={{
                background: "var(--background)",
                borderColor: "var(--foreground)",
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4
                    className="font-heading uppercase tracking-wider"
                    style={{ color: "var(--accent)" }}
                  >
                    {a.itemName}
                  </h4>
                  <p className="font-mono text-xs sm:text-sm opacity-80">
                    {a.itemDescription || "No description."}
                  </p>
                </div>
                <span className="font-mono text-xs sm:text-sm">
                  {a.auctionType ?? "english"}
                </span>
              </div>
              {/* Future: modification/deletion controls for admins */}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function MarketplacePage() {
  const [activeView, setActiveView] = useState<"store" | "auctions">("store");
  const { data: me } = trpc.user.getMe.useQuery(undefined, {
    retry: 1,
    staleTime: 10_000,
  });
  const user = me?.user ?? null;
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showAuctionModal, setShowAuctionModal] = useState(false);

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
                Marketplace
              </h1>
              <BackHomeButton className="mt-1" />
            </div>
            <p className="font-mono text-xs sm:text-sm opacity-80 mt-1">
              Explore the People’s Store to buy items and boosts, or visit the
              Auction House to participate in upcoming auctions.
            </p>
          </div>

          {/* Tab Navigation */}
          <div
            className="p-2 border-4 rounded-none shadow-card-sm flex items-center gap-4"
            style={{
              background: "var(--background)",
              borderColor: "var(--foreground)",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveView("store")}
              className="font-heading uppercase tracking-wider text-sm sm:text-base pb-1 border-b-4"
              style={{
                color: "var(--foreground)",
                borderColor:
                  activeView === "store" ? "var(--accent)" : "transparent",
              }}
            >
              People’s Store
            </button>
            <button
              type="button"
              onClick={() => setActiveView("auctions")}
              className="font-heading uppercase tracking-wider text-sm sm:text-base pb-1 border-b-4"
              style={{
                color: "var(--foreground)",
                borderColor:
                  activeView === "auctions" ? "var(--accent)" : "transparent",
              }}
            >
              Auction House
            </button>
            <div className="ml-auto">
              {user?.role === "admin" ? (
                <button
                  type="button"
                  onClick={() =>
                    activeView === "store"
                      ? setShowStoreModal(true)
                      : setShowAuctionModal(true)
                  }
                  className="font-heading uppercase tracking-wider text-sm sm:text-base px-2 py-1 border-2 rounded-none"
                  style={{
                    background:
                      (activeView === "store" && showStoreModal) ||
                      (activeView === "auctions" && showAuctionModal)
                        ? "var(--accent)"
                        : "transparent",
                    color:
                      (activeView === "store" && showStoreModal) ||
                      (activeView === "auctions" && showAuctionModal)
                        ? "var(--background)"
                        : "var(--foreground)",
                    borderColor: "var(--foreground)",
                  }}
                >
                  Create +
                </button>
              ) : null}
            </div>
          </div>

          {/* Dynamic Content Area */}
          <div className="flex flex-col gap-4">
            {activeView === "store" ? (
              <PeoplesStore user={user} />
            ) : (
              <AuctionHouse user={user} />
            )}
          </div>

          {/* Modals */}
          <Modal
            open={!!user && user.role === "admin" && showStoreModal}
            onClose={() => setShowStoreModal(false)}
            title="Committee Directives"
          >
            <AdminItemCreator />
          </Modal>
          <Modal
            open={!!user && user.role === "admin" && showAuctionModal}
            onClose={() => setShowAuctionModal(false)}
            title="Auction Administration"
          >
            <AdminAuctionCreator />
          </Modal>
        </div>
      </div>
    </div>
  );
}
