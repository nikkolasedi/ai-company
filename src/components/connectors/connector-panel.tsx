"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Plug } from "lucide-react";

interface Connector {
  id: string;
  name: string;
  provider: string;
  status: string;
  liveStatus?: string;
  departments: string[];
  tools: { name: string; description: string | null }[];
  source?: string;
}

function statusColor(status: string, liveStatus?: string): string {
  const s = liveStatus ?? status;
  if (s === "connected" || s === "CONNECTED") return "#22c55e";
  if (s === "needs-auth") return "#fbbf24";
  if (s === "failed" || s === "ERROR") return "#ef4444";
  return "#94a3b8";
}

export function ConnectorPanel() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/connectors")
      .then((r) => r.json())
      .then(setConnectors)
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSync() {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/connectors/sync", { method: "POST" });
      const data = await res.json();
      setConnectors(data.connectors ?? []);
      setSyncMessage(
        data.synced
          ? `Synced ${data.synced} MCP server(s) from Claude CLI`
          : data.message ?? "Sync complete"
      );
    } catch {
      setSyncMessage("Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plug className="h-4 w-4 text-indigo-400" />
          <h2 className="text-lg font-semibold">Connectors</h2>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
          Sync MCP
        </button>
      </div>

      {syncMessage && (
        <p className="text-xs text-zinc-400">{syncMessage}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {connectors.map((c) => {
          const color = statusColor(c.status, c.liveStatus);
          return (
            <div
              key={c.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                  />
                  <span className="font-medium">{c.name}</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {c.liveStatus ?? c.status}
                </span>
              </div>
              <p className="mb-2 text-xs text-zinc-500">
                {c.tools.length} tools · {c.source ?? "seed"}
              </p>
              {c.departments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {c.departments.map((d) => (
                    <span
                      key={d}
                      className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              )}
              <div className="space-y-1">
                {c.tools.slice(0, 3).map((t) => (
                  <p key={t.name} className="truncate text-[11px] text-zinc-500">
                    {t.name}
                  </p>
                ))}
                {c.tools.length > 3 && (
                  <p className="text-[10px] text-zinc-600">+{c.tools.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
