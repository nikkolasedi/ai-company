"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Memory {
  id: string;
  content: string;
  type: string;
  createdAt: string;
}

export function AgentMemoryPanel({
  agentId,
  initialMemories,
}: {
  agentId: string;
  initialMemories: Memory[];
}) {
  const [memories, setMemories] = useState(initialMemories);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  async function teach() {
    if (!feedback.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      if (res.ok) {
        const data = await res.json();
        setMemories((prev) => [
          { id: data.id ?? String(Date.now()), content: feedback, type: "lesson", createdAt: new Date().toISOString() },
          ...prev,
        ]);
        setFeedback("");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Memory</CardTitle>
        <CardDescription>Lessons and task history (auto-pruned to latest 50 tasks / 30 lessons)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Teach this agent a standing lesson..."
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
          />
          <Button onClick={teach} disabled={loading || !feedback.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Teach"}
          </Button>
        </div>

        {memories.length === 0 ? (
          <p className="text-sm text-zinc-500">No memories yet</p>
        ) : (
          <ul className="space-y-2">
            {memories.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm"
              >
                <span className="text-xs uppercase text-zinc-500">{m.type}</span>
                <p className="text-zinc-300">{m.content}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
