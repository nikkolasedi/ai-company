"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AuditEntry {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  createdAt: string;
  user?: { name: string | null; email: string } | null;
  metadata?: Record<string, unknown> | null;
}

export function AuditLogPanel() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit?limit=100");
      if (res.ok) setLogs(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Audit Log</CardTitle>
        <button onClick={load} className="text-xs text-indigo-400 hover:underline">
          Refresh
        </button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-zinc-500">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-zinc-500">No audit entries</p>
        ) : (
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
            {logs.map((log) => (
              <li
                key={log.id}
                className="rounded-lg border border-zinc-800 px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-zinc-200">{log.action}</span>
                  <span className="shrink-0 text-xs text-zinc-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  {log.resource}
                  {log.resourceId ? ` · ${log.resourceId.slice(0, 8)}` : ""}
                  {log.user?.name ? ` · ${log.user.name}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
