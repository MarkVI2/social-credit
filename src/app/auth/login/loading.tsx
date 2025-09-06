"use client";

export default function Loading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="font-mono text-xl">Loading Login…</div>
    </div>
  );
}
