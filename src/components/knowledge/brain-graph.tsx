"use client";

import { useCallback, useEffect, useState } from "react";

interface GraphNode {
  id: string;
  title: string;
  x: number;
  y: number;
  group: string;
}

interface GraphLink {
  source: string;
  target: string;
}

const GROUP_COLORS: Record<string, string> = {
  Knowledge: "#6366f1",
  Deliverables: "#22c55e",
};

export function BrainGraph({
  height = 320,
  refreshKey = 0,
}: {
  height?: number;
  refreshKey?: number;
}) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ title: string; content: string } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/knowledge/graph")
      .then((r) => r.json())
      .then((data) => {
        setNodes(data.nodes ?? []);
        setLinks(data.links ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function openDoc(nodeId: string) {
    const res = await fetch(`/api/knowledge/documents/${nodeId}`);
    if (!res.ok) return;
    const doc = await res.json();
    setSelected({ title: doc.title, content: doc.content ?? "" });
  }

  if (loading) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50"
        style={{ height }}
      >
        <span className="text-sm text-zinc-500">Loading knowledge graph...</span>
      </div>
    );
  }

  if (!nodes.length) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50"
        style={{ height }}
      >
        <span className="text-sm text-zinc-500">
          No knowledge yet — ingest documents or complete tasks to grow the brain
        </span>
      </div>
    );
  }

  const pad = 40;
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs) - pad;
  const maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad;
  const maxY = Math.max(...ys) + pad;
  const w = maxX - minX;
  const h = maxY - minY;

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="space-y-3">
      <div
        className="overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-indigo-950/30"
        style={{ height }}
      >
        <svg
          viewBox={`${minX} ${minY} ${w} ${h}`}
          className="h-full w-full cursor-pointer"
          preserveAspectRatio="xMidYMid meet"
        >
          {links.map((link, i) => {
            const a = nodeById.get(link.source);
            const b = nodeById.get(link.target);
            if (!a || !b) return null;
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#6366f155"
                strokeWidth={1}
                strokeDasharray="4 3"
              />
            );
          })}
          {nodes.map((node) => {
            const color = GROUP_COLORS[node.group] ?? "#94a3b8";
            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                onClick={() => openDoc(node.id)}
              >
                <circle r={6} fill={color} fillOpacity={0.9}>
                  <title>{node.title}</title>
                </circle>
                <circle r={10} fill="none" stroke={color} strokeOpacity={0.3} strokeWidth={1} />
                <text
                  y={16}
                  textAnchor="middle"
                  fill="#cbd5e1"
                  fontSize={8}
                  fontFamily="system-ui, sans-serif"
                >
                  {node.title.length > 22 ? node.title.slice(0, 20) + "…" : node.title}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {selected && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium">{selected.title}</h3>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Close
            </button>
          </div>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-zinc-400">
            {selected.content}
          </pre>
        </div>
      )}
    </div>
  );
}
