"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import type { AgentWithDepartment, DepartmentWithAgents } from "@/types";
import { useOfficeLiveData } from "@/hooks/use-office-live-data";
import { Badge } from "@/components/ui/badge";
import { ConnectorBar } from "./connector-bar";
import { LiveActivityPanel } from "./live-activity-panel";
import { Office2DView } from "./office-2d-view";
import { OfficeAgentPanel } from "./office-agent-panel";
import { ViewModeSwitch, type OfficeViewMode } from "./view-mode-switch";

const BotCrossingView = dynamic(
  () => import("./bot-crossing-view").then((m) => m.BotCrossingView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-zinc-500">
        Loading colony...
      </div>
    ),
  }
);

interface IsometricOfficeProps {
  departments: DepartmentWithAgents[];
  initialAgents: AgentWithDepartment[];
}

function ColonyFallback() {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-zinc-500">
      Loading colony...
    </div>
  );
}

export function IsometricOffice({ departments, initialAgents }: IsometricOfficeProps) {
  const { agents, events, highlightedAgentId, refresh } = useOfficeLiveData(initialAgents);
  const [viewMode, setViewMode] = useState<OfficeViewMode>("3d");
  const [displayMode, setDisplayMode] = useState<OfficeViewMode>("3d");
  const [webglAvailable, setWebglAvailable] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setWebglAvailable(!!gl);
      if (!gl) setViewMode("2d");
    } catch {
      setWebglAvailable(false);
      setViewMode("2d");
    }
  }, []);

  useEffect(() => {
    if (viewMode !== displayMode) {
      const timer = setTimeout(() => setDisplayMode(viewMode), 150);
      return () => clearTimeout(timer);
    }
  }, [viewMode, displayMode]);

  const ceoAgent = agents.find((a) => a.isOrchestrator);
  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 lg:flex-row lg:gap-4">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-3 sm:p-4 lg:p-6">
        <div className="mb-3 flex shrink-0 flex-col gap-3 sm:mb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold sm:text-xl">Agent Colony</h2>
            <p className="text-xs text-zinc-400 sm:text-sm">
              {displayMode === "3d"
                ? "Drag to look around. Click a person to see their desk."
                : "Tap a person to see their desk"}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2 sm:gap-3">
            <ViewModeSwitch
              viewMode={viewMode}
              onChange={setViewMode}
              webglAvailable={webglAvailable}
            />
            <ConnectorBar />
            {ceoAgent && (
              <button
                type="button"
                onClick={() => setSelectedAgentId(ceoAgent.id)}
                className="flex min-w-0 items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-sm sm:px-4 sm:py-2"
              >
                <span className="font-medium text-indigo-300">CEO</span>
                <span className="hidden truncate text-zinc-400 sm:inline">{ceoAgent.name}</span>
                <Badge status={ceoAgent.status} />
              </button>
            )}
          </div>
        </div>

        <div className="relative min-h-[38dvh] flex-1 overflow-hidden sm:min-h-[42dvh] lg:min-h-0">
          {displayMode === "2d" ? (
            <div className="h-full overflow-auto">
              <Office2DView
                departments={departments}
                agents={agents}
                highlightedAgentId={highlightedAgentId}
                onSelectAgent={setSelectedAgentId}
              />
            </div>
          ) : (
            <Suspense fallback={<ColonyFallback />}>
              <BotCrossingView
                agents={agents}
                events={events}
                highlightedAgentId={highlightedAgentId}
                selectedAgentId={selectedAgentId}
                onSelectAgent={setSelectedAgentId}
              />
            </Suspense>
          )}
          {selectedAgent && (
            <OfficeAgentPanel
              agent={selectedAgent}
              colleagues={agents}
              onClose={() => setSelectedAgentId(null)}
              onChanged={refresh}
              onSelect={setSelectedAgentId}
            />
          )}
        </div>
      </div>

      <LiveActivityPanel events={events} />
    </div>
  );
}
