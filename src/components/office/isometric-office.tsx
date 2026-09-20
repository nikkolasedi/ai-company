"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import type { AgentWithDepartment, DepartmentWithAgents } from "@/types";
import { useOfficeLiveData } from "@/hooks/use-office-live-data";
import { Badge } from "@/components/ui/badge";
import { LiveActivityPanel } from "./live-activity-panel";
import { Office2DView } from "./office-2d-view";
import { ViewModeSwitch, type OfficeViewMode } from "./view-mode-switch";

const OfficeScene3D = dynamic(
  () => import("./office-3d/scene").then((m) => m.OfficeScene3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[500px] items-center justify-center text-sm text-zinc-500">
        Loading 3D scene...
      </div>
    ),
  }
);

interface IsometricOfficeProps {
  departments: DepartmentWithAgents[];
  initialAgents: AgentWithDepartment[];
}

function Scene3DFallback() {
  return (
    <div className="flex h-full min-h-[500px] items-center justify-center text-sm text-zinc-500">
      Loading 3D scene...
    </div>
  );
}

export function IsometricOffice({ departments, initialAgents }: IsometricOfficeProps) {
  const { agents, events, highlightedAgentId, delegationLinks } =
    useOfficeLiveData(initialAgents);
  const [viewMode, setViewMode] = useState<OfficeViewMode>("3d");
  const [displayMode, setDisplayMode] = useState<OfficeViewMode>("3d");
  const [webglAvailable, setWebglAvailable] = useState(true);

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

  return (
    <div className="flex h-full gap-4">
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Virtual Office</h2>
            <p className="text-sm text-zinc-400">
              {displayMode === "3d"
                ? "Drag to orbit · Scroll to zoom · Click agents to explore"
                : "Click departments or agents to explore"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ViewModeSwitch
              viewMode={viewMode}
              onChange={setViewMode}
              webglAvailable={webglAvailable}
            />
            {ceoAgent && (
              <Link
                href={`/agents/${ceoAgent.id}`}
                className="flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm"
              >
                <span className="font-medium text-indigo-300">CEO</span>
                <span className="text-zinc-400">{ceoAgent.name}</span>
                <Badge status={ceoAgent.status} />
              </Link>
            )}
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          {displayMode === "2d" ? (
            <div className="h-full overflow-auto">
              <Office2DView
                departments={departments}
                agents={agents}
                highlightedAgentId={highlightedAgentId}
              />
            </div>
          ) : (
            <Suspense fallback={<Scene3DFallback />}>
              <OfficeScene3D
                departments={departments}
                agents={agents}
                highlightedAgentId={highlightedAgentId}
                delegationLinks={delegationLinks}
              />
            </Suspense>
          )}
        </div>
      </div>

      <LiveActivityPanel events={events} />
    </div>
  );
}
