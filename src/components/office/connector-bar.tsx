"use client";

import { useEffect, useState } from "react";

interface Connector {
  id: string;
  name: string;
  provider: string;
  status: string;
  tools: { name: string }[];
}

export function ConnectorBar() {
  const [connectors, setConnectors] = useState<Connector[]>([]);

  useEffect(() => {
    fetch("/api/connectors")
      .then((r) => r.json())
      .then(setConnectors)
      .catch(() => {});
  }, []);

  if (!connectors.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Connectors
      </span>
      {connectors.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]"
          style={{
            borderColor: c.status === "CONNECTED" ? "#22c55e44" : "#64748b44",
            background: c.status === "CONNECTED" ? "#22c55e11" : "#64748b11",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: c.status === "CONNECTED" ? "#22c55e" : "#94a3b8",
              boxShadow: c.status === "CONNECTED" ? "0 0 6px #22c55e" : "none",
            }}
          />
          {c.name}
          <span className="text-zinc-500">({c.tools.length})</span>
        </div>
      ))}
    </div>
  );
}
