"use client";
import BackHomeButton from "@/components/BackHomeButton";
import { trpc } from "@/trpc/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { useMemo, useState } from "react";
import { NetworkGraph } from "@/components/NetworkGraph";

export default function AdminStatisticsPage() {
  // Charts without temporal controls
  const supply = trpc.admin.stats.totalSupplyOverTime.useQuery({
    granularity: "day",
  });
  const velocity = trpc.admin.stats.velocity.useQuery({ granularity: "day" });
  const sinksSources = trpc.admin.stats.sinksSources.useQuery({});
  const topTraders = trpc.admin.stats.topTraders.useQuery({});

  // Knowledge/Peer graphs temporal controls: N days from the very first transaction
  const bounds = trpc.admin.stats.timeBounds.useQuery();
  const earliest = bounds.data?.earliest
    ? new Date(bounds.data.earliest)
    : undefined;
  const latest = bounds.data?.latest ? new Date(bounds.data.latest) : undefined;
  const totalDays = useMemo(() => {
    if (!earliest || !latest) return 365;
    const diff =
      Math.ceil(
        (latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
    return Math.max(1, diff);
  }, [earliest, latest]);
  const [daysFromStart, setDaysFromStart] = useState<number>(30);
  const windowToDate = useMemo(() => {
    if (!earliest) return undefined;
    const d = new Date(earliest);
    d.setDate(d.getDate() + Math.min(daysFromStart - 1, totalDays - 1));
    return d;
  }, [earliest, daysFromStart, totalDays]);
  const peerGraph = trpc.admin.stats.peerGraph.useQuery({
    from: earliest,
    to: windowToDate,
  });
  const knowledge = trpc.admin.stats.knowledgeGraph.useQuery({
    from: earliest,
    to: windowToDate,
  });

  const supplySeries = useMemo(
    () =>
      (supply.data?.series || []).map((p) => ({
        ts: new Date(p.timestamp).toLocaleDateString(),
        cumulative: p.cumulative,
        delta: p.delta,
      })),
    [supply.data]
  );
  const velocitySeries = useMemo(
    () =>
      (velocity.data?.series || []).map((p) => ({
        ts: new Date(p.timestamp).toLocaleDateString(),
        velocity:
          p.velocity == null ? null : Number(p.velocity?.toFixed?.(3) || 0),
        volume: p.volume,
      })),
    [velocity.data]
  );

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
                Statistics
              </h1>
              <BackHomeButton className="mt-1" />
            </div>
            <p className="font-mono text-xs sm:text-sm opacity-80 mt-1">
              System-wide metrics on coin management, trading, and knowledge
              graphs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Coin Management */}
            <section
              className="p-3 sm:p-4 border-4 rounded-none shadow-card-sm flex flex-col"
              style={{
                background: "var(--background)",
                borderColor: "var(--foreground)",
              }}
            >
              <h2
                className="font-heading font-bold uppercase tracking-wider mb-2"
                style={{ color: "var(--accent)" }}
              >
                Coin Management
              </h2>
              <div
                className="text-xs font-heading uppercase mb-1"
                style={{ color: "var(--accent)" }}
              >
                Total Supply (Δ and Cumulative)
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={supplySeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ts" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      stroke="#8884d8"
                      dot={false}
                      name="Total Supply Δ cumulative"
                    />
                    <Line
                      type="monotone"
                      dataKey="delta"
                      stroke="#82ca9d"
                      dot={false}
                      name="Δ per period"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div
                className="text-xs font-heading uppercase mb-1 mt-4"
                style={{ color: "var(--accent)" }}
              >
                Velocity (Volume / Supply)
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={velocitySeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ts" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey={(d: any) => d.velocity}
                      stroke="#ef4444"
                      dot={false}
                      name="Velocity"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div
                className="text-xs font-heading uppercase mb-1 mt-4"
                style={{ color: "var(--accent)" }}
              >
                Transactions by Type (Volume)
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(sinksSources.data?.byType || []).map((r) => ({
                      type: r._id || "unknown",
                      total: r.total,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="#60a5fa" name="By Type" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Trading */}
            <section
              className="p-3 sm:p-4 border-4 rounded-none shadow-card-sm flex flex-col"
              style={{
                background: "var(--background)",
                borderColor: "var(--foreground)",
              }}
            >
              <h2
                className="font-heading font-bold uppercase tracking-wider mb-2"
                style={{ color: "var(--accent)" }}
              >
                Trading
              </h2>
              <div className="overflow-auto">
                <table className="w-full text-xs sm:text-sm font-mono">
                  <thead>
                    <tr
                      className="text-left border-b-2"
                      style={{ borderColor: "var(--foreground)" }}
                    >
                      <th className="py-1 pr-2">User</th>
                      <th className="py-1 pr-2">Volume</th>
                      <th className="py-1 pr-2">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(topTraders.data?.traders || []).map((t) => (
                      <tr
                        key={t.user}
                        className="border-b last:border-b-0"
                        style={{ borderColor: "var(--foreground)" }}
                      >
                        <td className="py-1 pr-2">{t.user}</td>
                        <td className="py-1 pr-2">{t.volume}</td>
                        <td className="py-1 pr-2">{t.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-xs opacity-80">
                Top traders by total volume.
              </div>
            </section>

            {/* Knowledge Graph */}
            <section
              className="p-3 sm:p-4 border-4 rounded-none shadow-card-sm flex flex-col"
              style={{
                background: "var(--background)",
                borderColor: "var(--foreground)",
              }}
            >
              <h2
                className="font-heading font-bold uppercase tracking-wider mb-2"
                style={{ color: "var(--accent)" }}
              >
                Knowledge Graphs
              </h2>
              <div className="mb-3">
                <label className="block font-heading text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                  Time Window (Days from Start)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={totalDays}
                    value={Math.min(daysFromStart, totalDays)}
                    onChange={(e) => setDaysFromStart(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="font-mono text-xs whitespace-nowrap">
                    First {Math.min(daysFromStart, totalDays)} day
                    {Math.min(daysFromStart, totalDays) === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="mt-1 text-[10px] opacity-70 font-mono">
                  {earliest && windowToDate
                    ? `${earliest.toLocaleDateString()} → ${windowToDate.toLocaleDateString()}`
                    : "Loading bounds…"}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <NetworkGraph
                  title="Peer Trading Graph"
                  nodes={peerGraph.data?.nodes || []}
                  edges={peerGraph.data?.edges || []}
                  height={280}
                />
                <NetworkGraph
                  title="Knowledge Graph"
                  nodes={knowledge.data?.nodes || []}
                  edges={knowledge.data?.edges || []}
                  height={280}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
