"use client";

import { OrbitControls, Html } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { AgentWithDepartment, DepartmentWithAgents } from "@/types";
import type { DelegationLink } from "@/hooks/use-office-live-data";
import { agentWorldPosition, position2dTo3d, SCENE_CENTER } from "@/lib/office/coordinates";
import { AgentCharacter } from "./agent-character";
import { DelegationLine } from "./delegation-line";
import { DepartmentZone3D } from "./department-zone";
import { Environment3D } from "./environment";
import { MeetingTable, Plant } from "./furniture";

const BG_COLOR = new THREE.Color("#0f1729");

interface OfficeScene3DProps {
  departments: DepartmentWithAgents[];
  agents: AgentWithDepartment[];
  highlightedAgentId?: string;
  delegationLinks: DelegationLink[];
}

function BackgroundSync() {
  const { gl } = useThree();
  const colorRef = useRef(BG_COLOR.clone());

  useEffect(() => {
    gl.setClearColor(colorRef.current);
  }, [gl]);

  useFrame(() => {
    colorRef.current.lerp(BG_COLOR, 0.05);
    gl.setClearColor(colorRef.current);
  });

  return null;
}

function SceneContent({
  departments,
  agents,
  highlightedAgentId,
  delegationLinks,
}: OfficeScene3DProps) {
  const ceoAgent = agents.find((a) => a.isOrchestrator);
  const [meetingX, , meetingZ] = position2dTo3d({ x: 450, y: 350 });

  const agentPositions = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    for (const agent of agents) {
      const dept = departments.find((d) => d.slug === agent.department.slug);
      if (dept) {
        map.set(
          agent.id,
          agentWorldPosition(dept.officeX, dept.officeY, agent.deskX + 60, agent.deskY + 35)
        );
      }
    }
    return map;
  }, [agents, departments]);

  return (
    <>
      <BackgroundSync />
      <OrbitControls
        enableRotate
        enablePan
        enableZoom
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.6}
        minDistance={8}
        maxDistance={35}
        target={SCENE_CENTER}
        enableDamping
        dampingFactor={0.08}
      />
      <Environment3D />

      {departments.map((dept) => (
        <DepartmentZone3D
          key={dept.id}
          department={dept}
          agents={agents.filter((a) => a.department.slug === dept.slug && !a.isOrchestrator)}
          highlightedAgentId={highlightedAgentId}
        />
      ))}

      <MeetingTable position={[meetingX, 0, meetingZ]} color="#6366f1" />
      <Html position={[meetingX, 0.15, meetingZ - 1.6]} center style={{ pointerEvents: "none" }}>
        <div className="select-none text-[10px] font-semibold uppercase tracking-widest text-indigo-300">
          CEO Command Center
        </div>
      </Html>

      {ceoAgent && (
        <AgentCharacter
          agent={ceoAgent}
          position={[meetingX, 0, meetingZ + 0.6]}
          highlight={highlightedAgentId === ceoAgent.id}
        />
      )}

      <Plant position={[meetingX - 1.8, 0, meetingZ + 1.2]} />
      <Plant position={[meetingX + 1.8, 0, meetingZ + 1.2]} />

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
        <Bloom intensity={0.8} luminanceThreshold={0.6} luminanceSmoothing={0.4} mipmapBlur />
      </EffectComposer>
    </>
  );
}

export function OfficeScene3D(props: OfficeScene3DProps) {
  return (
    <div className="h-full w-full min-h-[500px]">
      <Canvas
        gl={{ antialias: true, alpha: false }}
        shadows
        camera={{
          fov: 42,
          position: [SCENE_CENTER[0] + 10, 12, SCENE_CENTER[2] + 10],
          near: 0.1,
          far: 200,
        }}
      >
        <SceneContent {...props} />
      </Canvas>
    </div>
  );
}
