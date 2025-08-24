"use client";
import { useEffect, useRef } from "react";
import { Network, DataSet } from "vis-network/standalone";

type Node = { id: string; label?: string; degree?: number };
type Edge = {
  from: string;
  to: string;
  volume?: number;
  count?: number;
  weight?: number;
};

export function NetworkGraph({
  nodes,
  edges,
  height = 320,
  title,
}: {
  nodes: Node[];
  edges: Edge[];
  height?: number;
  title?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const data = {
      nodes: new DataSet(
        nodes.map((n) => ({
          id: n.id,
          label: n.label || n.id,
          value: n.degree,
        })) as any
      ),
      edges: new DataSet(
        edges.map((e) => ({
          from: e.from,
          to: e.to,
          width: e.volume || e.count || e.weight || 1,
        })) as any
      ),
    };
    const options: any = {
      nodes: { shape: "dot", scaling: { min: 5, max: 30 } },
      edges: { smooth: true },
      physics: { stabilization: true },
      interaction: { hover: true },
    };
    networkRef.current = new Network(
      containerRef.current,
      data as any,
      options
    );
    return () => {
      networkRef.current?.destroy();
      networkRef.current = null;
    };
  }, [nodes, edges]);

  return (
    <div>
      {title ? (
        <div
          className="font-heading text-xs uppercase mb-1"
          style={{ color: "var(--accent)" }}
        >
          {title}
        </div>
      ) : null}
      <div
        ref={containerRef}
        style={{
          height,
          border: "2px solid var(--foreground)",
          background: "var(--background)",
        }}
      />
    </div>
  );
}
