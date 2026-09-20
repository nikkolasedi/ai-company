"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import type { AgentWithDepartment, DepartmentWithAgents } from "@/types";
import { useOfficeLiveData } from "@/hooks/use-office-live-data";
import { useOfficeVisualStyle } from "@/hooks/use-office-visual-style";
import { Badge } from "@/components/ui/badge";
import { LiveActivityPanel } from "./live-activity-panel";
import { Office2DView } from "./office-2d-view";
import { StyleSwitcher } from "./style-switcher";
import { ViewModeSwitch, type OfficeViewMode } from "./view-mode-switch";

const OfficeScene3D = dynamic(
  () => import("./office-3d/scene").then((m) => m.OfficeScene3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-zinc-500">
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
    <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-zinc-500">
      Loading 3D scene...
    </div>
  );
}

export function IsometricOffice({ departments, initialAgents }: IsometricOfficeProps) {
  const { agents, events, highlightedAgentId, delegationLinks, toolPulses } =
    useOfficeLiveData(initialAgents);
  const {
    environmentStyle,
    avatarStyle,
    setEnvironmentStyle,
    setAvatarStyle,
  } = useOfficeVisualStyle();
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
    <div className="flex h-full min-h-0 flex-col gap-3 lg:flex-row lg:gap-4">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-3 sm:p-4 lg:p-6">
        <div className="mb-3 flex shrink-0 flex-col gap-3 sm:mb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold sm:text-xl">Virtual Office</h2>
            <p className="text-xs text-zinc-400 sm:text-sm">
              {displayMode === "3d"
                ? "Drag to orbit · Pinch to zoom · Tap agents to explore"
                : "Tap departments or agents to explore"}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2 sm:gap-3">
            {displayMode === "3d" && (
              <StyleSwitcher
                environmentStyle={environmentStyle}
                avatarStyle={avatarStyle}
                onEnvironmentChange={setEnvironmentStyle}
                onAvatarChange={setAvatarStyle}
              />
            )}
            <ViewModeSwitch
              viewMode={viewMode}
              onChange={setViewMode}
              webglAvailable={webglAvailable}
            />
            {ceoAgent && (
              <Link
                href={`/agents/${ceoAgent.id}`}
                className="flex min-w-0 items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-sm sm:px-4 sm:py-2"
              >
                <span className="font-medium text-indigo-300">CEO</span>
                <span className="hidden truncate text-zinc-400 sm:inline">{ceoAgent.name}</span>
                <Badge status={ceoAgent.status} />
              </Link>
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
              />
            </div>
          ) : (
            <Suspense fallback={<Scene3DFallback />}>
              <OfficeScene3D
                departments={departments}
                agents={agents}
                highlightedAgentId={highlightedAgentId}
                delegationLinks={delegationLinks}
                toolPulses={toolPulses}
                environmentStyle={environmentStyle}
                avatarStyle={avatarStyle}
              />
            </Suspense>
          )}
        </div>
      </div>

      <LiveActivityPanel events={events} />
    </div>
  );
}
