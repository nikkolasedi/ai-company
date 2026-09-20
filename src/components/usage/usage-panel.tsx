"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UsageData {
  planTier: string;
  usage: Record<string, { used: number; limit: number }>;
}

export function UsagePanel() {
  const [data, setData] = useState<UsageData | null>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage ({data.planTier} plan)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(data.usage).map(([key, { used, limit }]) => (
          <div key={key}>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">{key.replace(/PerDay$/, " / day")}</span>
              <span>{used} / {limit}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
