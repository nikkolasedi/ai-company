"use client";

import { Html, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { AgentWithDepartment, DepartmentWithAgents } from "@/types";
import type { DelegationLink, ToolUsePulse } from "@/hooks/use-office-live-data";
import type { AvatarStyle, EnvironmentStyle } from "@/lib/office/visual-styles";
import { DEFAULT_AVATAR_STYLE, DEFAULT_ENVIRONMENT_STYLE } from "@/lib/office/visual-styles";
import { position2dTo3d, SCENE_CENTER } from "@/lib/office/coordinates";
import {
  getDepartmentZoneCenter,
  getDeskWorldTransform,
  hubHexRingPoints,
  HUB_CLEAR_RADIUS,
  regularHexagonPoints,
} from "@/lib/office/layout";
import { AgentPopulation } from "./agent-population";
import { DelegationLine } from "./delegation-line";
import { DepartmentZone3D } from "./department-zone";
import { OfficeEntrance } from "./entrance";
import {
  Environment3D,
  getEnvironmentBackground,
  getEnvironmentBloom,
  getEnvironmentBloomThreshold,
  getEnvironmentExposure,
} from "./environment";
import { ENVIRONMENT_THEMES } from "@/lib/office/visual-styles";
import { MeetingTable, OfficeChair, Plant } from "./furniture";
import { PostEffects } from "./post-effects";

function BackgroundSync({ background }: { background: string }) {
  const { gl } = useThree();
  const targetColor = useMemo(() => new THREE.Color(background), [background]);
  const colorRef = useRef(targetColor.clone());

  useEffect(() => {
    colorRef.current.copy(targetColor);
    gl.setClearColor(colorRef.current);
  }, [gl, targetColor]);

  useFrame(() => {
    colorRef.current.lerp(targetColor, 0.05);
    gl.setClearColor(colorRef.current);
  });

  return null;
}

function HubConnectionLines({
  departments,
  meetingX,
  meetingZ,
}: {
  departments: DepartmentWithAgents[];
  meetingX: number;
  meetingZ: number;
}) {
  return (
    <>
      {departments.map((dept) => {
        const [cx, , cz] = getDepartmentZoneCenter(dept.slug);
        const midY = 0.8;
        const points: [number, number, number][] = [
          [cx, 0.05, cz],
          [(cx + meetingX) / 2, midY, (cz + meetingZ) / 2],
          [meetingX, 0.15, meetingZ],
        ];
        return (
          <Line
            key={dept.id}
            points={points}
            color={dept.color}
            lineWidth={1}
            dashed
            dashScale={2}
            dashSize={0.25}
            gapSize={0.15}
            transparent
            opacity={0.35}
          />
        );
      })}
    </>
  );
}

interface OfficeScene3DProps {
  departments: DepartmentWithAgents[];
  agents: AgentWithDepartment[];
  highlightedAgentId?: string;
  delegationLinks: DelegationLink[];
  toolPulses?: ToolUsePulse[];
  environmentStyle?: EnvironmentStyle;
  avatarStyle?: AvatarStyle;
}

function SceneContent({
  departments,
  agents,
  highlightedAgentId,
  delegationLinks,
  toolPulses = [],
  environmentStyle = DEFAULT_ENVIRONMENT_STYLE,
  avatarStyle = DEFAULT_AVATAR_STYLE,
}: OfficeScene3DProps) {
  const [meetingX, , meetingZ] = position2dTo3d({ x: 450, y: 350 });

  const agentPositions = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    for (const dept of departments) {
      const zoneCenter = getDepartmentZoneCenter(dept.slug);
      const deptAgents = agents.filter(
        (a) => a.department.slug === dept.slug && !a.isOrchestrator
      );
      deptAgents.forEach((agent, i) => {
        const desk = getDeskWorldTransform(zoneCenter, i);
        map.set(agent.id, [desk.chairPosition[0], 0.5, desk.chairPosition[2]]);
      });
    }
    const ceo = agents.find((a) => a.isOrchestrator);
    if (ceo) {
      map.set(ceo.id, [meetingX, 0.5, meetingZ + 0.55]);
    }
    return map;
  }, [agents, departments, meetingX, meetingZ]);

  const bloomIntensity = getEnvironmentBloom(environmentStyle);
  const bloomThreshold = getEnvironmentBloomThreshold(environmentStyle);
  const envTheme = ENVIRONMENT_THEMES[environmentStyle];

  return (
    <>
      <BackgroundSync background={getEnvironmentBackground(environmentStyle)} />
      <OrbitControls
        enableRotate
        enablePan
        enableZoom
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.4}
        minDistance={8}
        maxDistance={36}
        target={SCENE_CENTER}
        enableDamping
        dampingFactor={0.08}
      />
      <Environment3D style={environmentStyle} />
      <OfficeEntrance />

      <Line
        points={[...hubHexRingPoints(), hubHexRingPoints()[0]]}
        color={envTheme.hubTableColor}
        lineWidth={1.2}
        transparent
        opacity={0.25}
      />
      <Line
        points={regularHexagonPoints(HUB_CLEAR_RADIUS).map(
          ([x, y, z]) => [meetingX + x, 0.035, meetingZ + z] as [number, number, number]
        )}
        color={envTheme.hubTableColor}
        lineWidth={1.5}
        transparent
        opacity={0.4}
      />

      <HubConnectionLines
        departments={departments}
        meetingX={meetingX}
        meetingZ={meetingZ}
      />

      {departments.map((dept) => (
        <DepartmentZone3D
          key={dept.id}
          department={dept}
          agents={agents.filter((a) => a.department.slug === dept.slug && !a.isOrchestrator)}
          environmentStyle={environmentStyle}
          toolPulses={toolPulses}
          agentPositions={agentPositions}
        />
      ))}

      <MeetingTable
        position={[meetingX, 0, meetingZ]}
        environmentStyle={environmentStyle}
      />
      <Html
        position={[meetingX, 1.2, meetingZ]}
        center
        distanceFactor={14}
        style={{ pointerEvents: "none" }}
      >
        <div
          className="select-none whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
          style={{
            color: envTheme.hubTableColor,
            background: envTheme.labelBg,
            textShadow: envTheme.labelUseGlow ? `0 0 10px ${envTheme.hubTableColor}` : "none",
          }}
        >
          CEO Command Center
        </div>
      </Html>

      <OfficeChair
        position={[meetingX, 0, meetingZ + 0.55]}
        rotation={Math.PI}
        environmentStyle={environmentStyle}
      />

      <Plant position={[meetingX - 1.8, 0, meetingZ + 1.2]} environmentStyle={environmentStyle} />
      <Plant position={[meetingX + 1.8, 0, meetingZ + 1.2]} environmentStyle={environmentStyle} />

      <AgentPopulation
        departments={departments}
        agents={agents}
        highlightedAgentId={highlightedAgentId}
        avatarStyle={avatarStyle}
      />

      {delegationLinks.map((link) => {
        const from = agentPositions.get(link.fromAgentId);
        const to = agentPositions.get(link.toAgentId);
        if (!from || !to) return null;
        return (
          <DelegationLine
            key={`${link.fromAgentId}-${link.toAgentId}-${link.timestamp}`}
            from={from}
            to={to}
          />
        );
      })}

      <EffectComposer>
        <PostEffects
          bloomIntensity={bloomIntensity}
          bloomThreshold={bloomThreshold}
          toyWorld
        />
      </EffectComposer>
    </>
  );
}

export function OfficeScene3D(props: OfficeScene3DProps) {
  const exposure = getEnvironmentExposure(props.environmentStyle ?? DEFAULT_ENVIRONMENT_STYLE);

  return (
    <div className="h-full w-full min-h-[240px]">
      <Canvas
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: exposure,
        }}
        shadows
        camera={{
          fov: 42,
          position: [SCENE_CENTER[0] + 10, 12, SCENE_CENTER[2] + 12],
          near: 0.1,
          far: 200,
        }}
      >
        <SceneContent {...props} />
      </Canvas>
    </div>
  );
}
