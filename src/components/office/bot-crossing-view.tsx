"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { AgentWithDepartment, OfficeEvent } from "@/types";
import {
  agentsToThreads,
  patchThreadFromEvent,
  type BotCrossingThread,
} from "@/lib/bot-crossing/adapters/agent-to-thread";
import type { ColonyRuntime } from "@/lib/bot-crossing/runtime";

interface BotCrossingViewProps {
  agents: AgentWithDepartment[];
  events: OfficeEvent[];
  highlightedAgentId?: string;
}

export function BotCrossingView({ agents, events, highlightedAgentId }: BotCrossingViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<ColonyRuntime | null>(null);
  const threadsRef = useRef<Map<string, BotCrossingThread>>(new Map());
  const router = useRouter();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;

    import("@/lib/bot-crossing/runtime").then(async ({ bootColony }) => {
      if (disposed) return;
      const runtime = await bootColony(container);
      if (disposed) {
        runtime.dispose();
        return;
      }
      runtimeRef.current = runtime;

      const threads = agentsToThreads(agents);
      const map = new Map(threads.map((t) => [t.id, t]));
      threadsRef.current = map;
      runtime.applyThreads(threads);

      const canvas = container.querySelector("canvas");
      if (canvas) {
        canvas.classList.add("bot-crossing-canvas");
        const onClick = (e: MouseEvent) => {
          const rect = canvas.getBoundingClientRect();
          const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
          const id = runtime.pickAgent(ndcX, ndcY, rect.width / rect.height);
          if (id) router.push(`/agents/${id}`);
        };
        canvas.addEventListener("click", onClick);
        return () => canvas.removeEventListener("click", onClick);
      }
    });

    return () => {
      disposed = true;
      runtimeRef.current?.dispose();
      runtimeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    const threads = agentsToThreads(agents);
    const map = new Map(threads.map((t) => [t.id, t]));
    threadsRef.current = map;
    runtime.applyThreads(threads);
  }, [agents]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || !events.length) return;

    const latest = events[0];
    const existing = threadsRef.current.get(latest.agentId);
    if (!existing) return;

    const patched = patchThreadFromEvent(existing, latest);
    threadsRef.current.set(latest.agentId, patched);
    runtime.applyThreads([...threadsRef.current.values()]);
  }, [events]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime || !highlightedAgentId) return;
    const agent = runtime.colony.agentFor(highlightedAgentId);
    if (agent) runtime.colony.astronauts.setSelected(agent);
  }, [highlightedAgentId]);

  return (
    <div
      ref={containerRef}
      className="bot-crossing-root absolute inset-0 overflow-hidden rounded-lg bg-[#0a0b0f]"
    />
  );
}
