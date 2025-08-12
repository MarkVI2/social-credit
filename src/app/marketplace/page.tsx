"use client";
import BackHomeButton from "@/components/BackHomeButton";

export default function MarketplacePage() {
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
                Auction / Marketplace
              </h1>
              <BackHomeButton className="mt-1" />
            </div>
            <p className="font-mono text-xs sm:text-sm opacity-80 mt-1">
              Buy items, level-ups, and bid in forward or reverse auctions
              hosted by admins.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 flex-wrap">
            <section
              className="p-3 sm:p-4 border-4 rounded-none shadow-card-sm flex flex-col flex-1 min-w-0 lg:basis-[calc(50%-0.5rem)]"
              style={{
                background: "var(--background)",
                borderColor: "var(--foreground)",
              }}
            >
              <h2
                className="font-heading font-bold uppercase tracking-wider mb-2"
                style={{ color: "var(--accent)" }}
              >
                Shop
              </h2>
              <p className="font-mono text-xs sm:text-sm opacity-80">
                Catalog of items, boosts, and level-ups.
              </p>
            </section>
            <section
              className="p-3 sm:p-4 border-4 rounded-none shadow-card-sm flex flex-col flex-1 min-w-0 lg:basis-[calc(50%-0.5rem)]"
              style={{
                background: "var(--background)",
                borderColor: "var(--foreground)",
              }}
            >
              <h2
                className="font-heading font-bold uppercase tracking-wider mb-2"
                style={{ color: "var(--accent)" }}
              >
                Auctions
              </h2>
              <p className="font-mono text-xs sm:text-sm opacity-80">
                Bid or reverse-bid on admin-hosted auctions.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
