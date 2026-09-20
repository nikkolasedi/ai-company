"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

interface Connector {
  id: string;
  name: string;
  provider: string;
  status: string;
  liveStatus?: string;
  tools: { name: string }[];
}

function dotColor(status: string, liveStatus?: string): string {
  const s = liveStatus ?? status;
  if (s === "connected" || s === "CONNECTED") return "#22c55e";
  if (s === "needs-auth") return "#fbbf24";
  if (s === "failed" || s === "ERROR") return "#ef4444";
  return "#94a3b8";
}

export function ConnectorBar() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(() => {
    fetch("/api/connectors")
      .then((r) => r.json())
      .then(setConnectors)
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function sync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/connectors/sync", { method: "POST" });
      const data = await res.json();
      setConnectors(data.connectors ?? []);
    } finally {
      setSyncing(false);
    }
  }

  if (!connectors.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        MCP
      </span>
      {connectors.map((c) => {
        const color = dotColor(c.status, c.liveStatus);
        return (
          <div
            key={c.id}
            className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]"
            style={{
              borderColor: `${color}44`,
              background: `${color}11`,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: color, boxShadow: `0 0 6px ${color}` }}
            />
            {c.name}
            <span className="text-zinc-500">({c.tools.length})</span>
          </div>
        );
      })}
      <button
        onClick={sync}
        disabled={syncing}
        className="rounded-full p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
        title="Sync MCP from Claude CLI"
      >
        <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
