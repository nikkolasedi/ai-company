"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentWithDepartment, OfficeEvent } from "@/types";
import {
  agentsToThreads,
  mergeAgentIntoThread,
  patchThreadFromEvent,
  type BotCrossingThread,
} from "@/lib/bot-crossing/adapters/agent-to-thread";
import type { ColonyRuntime } from "@/lib/bot-crossing/runtime";
import { SceneEditorToolbar } from "./scene-editor-toolbar";

function eventKey(event: OfficeEvent) {
  return `${event.timestamp}|${event.type}|${event.agentId ?? ""}|${event.taskId ?? ""}|${event.message ?? ""}`;
}

interface BotCrossingViewProps {
  agents: AgentWithDepartment[];
  events: OfficeEvent[];
  highlightedAgentId?: string;
  selectedAgentId?: string | null;
  onSelectAgent: (id: string | null) => void;
}

export function BotCrossingView({
  agents,
  events,
  highlightedAgentId: _highlightedAgentId,
  selectedAgentId,
  onSelectAgent,
}: BotCrossingViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<ColonyRuntime | null>(null);
  const threadsRef = useRef<Map<string, BotCrossingThread>>(new Map());
  const seenEventsRef = useRef(new Set<string>());
  const eventsReadyRef = useRef(false);
  const clickCleanupRef = useRef<(() => void) | null>(null);
  const onSelectRef = useRef(onSelectAgent);
  const [ready, setReady] = useState(false);
  onSelectRef.current = onSelectAgent;

  const applyAllThreads = useCallback((runtime: ColonyRuntime) => {
    runtime.applyThreads([...threadsRef.current.values()]);
  }, []);

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
      threadsRef.current = new Map(threads.map((t) => [t.id, t]));
      runtime.applyThreads(threads);
      setReady(true);

      const canvas = container.querySelector("canvas");
      if (canvas) {
        canvas.classList.add("bot-crossing-canvas");
        const onClick = (e: MouseEvent) => {
          // Orbit and pan happen on this same canvas. A drag ends in a click, and
          // that used to open whoever was under the cursor.
          if (!runtime.rig.wasClick) return;
          const rect = canvas.getBoundingClientRect();
          const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
          const id = runtime.pickAgent(ndcX, ndcY, rect.width / rect.height);
          onSelectRef.current(id);
        };
        canvas.addEventListener("click", onClick);
        clickCleanupRef.current = () => canvas.removeEventListener("click", onClick);
      }
    });

    return () => {
      disposed = true;
      clickCleanupRef.current?.();
      clickCleanupRef.current = null;
      runtimeRef.current?.dispose();
      runtimeRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    const runtime = runtimeRef.current;
    if (!runtime) return;

    for (const agent of agents) {
      const existing = threadsRef.current.get(agent.id);
      threadsRef.current.set(agent.id, mergeAgentIntoThread(existing, agent));
    }
    applyAllThreads(runtime);
  }, [agents, ready, applyAllThreads]);

  useEffect(() => {
    if (!ready) return;
    const runtime = runtimeRef.current;
    if (!runtime) return;

    // The roster already matches the people on screen. Replaying the activity
    // list would let an older event overwrite the task they are on now.
    if (!eventsReadyRef.current) {
      for (const event of events) seenEventsRef.current.add(eventKey(event));
      eventsReadyRef.current = true;
      return;
    }

    const pending = events.filter(
      (event) => event.agentId && event.type !== "CONNECTED" && !seenEventsRef.current.has(eventKey(event))
    );
    if (!pending.length) return;

    for (const event of [...pending].reverse()) {
      seenEventsRef.current.add(eventKey(event));
      const existing = threadsRef.current.get(event.agentId!);
      if (!existing) continue;
      threadsRef.current.set(event.agentId!, patchThreadFromEvent(existing, event));
    }
    applyAllThreads(runtime);
  }, [events, ready, applyAllThreads]);

  useEffect(() => {
    if (!ready) return;
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const agent = selectedAgentId ? runtime.colony.agentFor(selectedAgentId) : null;
    runtime.colony.astronauts.setSelected(agent);
  }, [selectedAgentId, ready, agents]);

  return (
    <div
      ref={containerRef}
      className="bot-crossing-root absolute inset-0 overflow-hidden rounded-lg bg-[#d8dce6]"
    >
      {ready && <SceneEditorToolbar runtime={runtimeRef.current} />}
    </div>
  );
}
