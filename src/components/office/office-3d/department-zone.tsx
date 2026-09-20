"use client";

import { Html } from "@react-three/drei";
import { useRouter } from "next/navigation";
import type { AgentWithDepartment, DepartmentWithAgents } from "@/types";
import { agentWorldPosition, departmentCenter } from "@/lib/office/coordinates";
import { OfficeChair, Plant, Workstation } from "./furniture";
import { AgentCharacter } from "./agent-character";

interface DepartmentZone3DProps {
  department: DepartmentWithAgents;
  agents: AgentWithDepartment[];
  highlightedAgentId?: string;
}

const DESK_LAYOUTS: Array<{ deskX: number; deskY: number; rot: number }> = [
  { deskX: 0, deskY: 0, rot: 0 },
  { deskX: 60, deskY: 20, rot: 0 },
  { deskX: 120, deskY: 0, rot: Math.PI },
  { deskX: 180, deskY: 20, rot: Math.PI },
  { deskX: 240, deskY: 0, rot: 0 },
  { deskX: 300, deskY: 20, rot: Math.PI },
];

export function DepartmentZone3D({
  department,
  agents,
  highlightedAgentId,
}: DepartmentZone3DProps) {
  const router = useRouter();
  const [cx, , cz] = departmentCenter(department.officeX, department.officeY);
  const zoneWidth = 5.2;
  const zoneDepth = 2.8;

  return (
    <group>
      <mesh
        position={[cx, 0.015, cz]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={() => router.push(`/departments/${department.slug}`)}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <planeGeometry args={[zoneWidth, zoneDepth]} />
        <meshStandardMaterial
          color={department.color}
          transparent
          opacity={0.18}
          roughness={0.85}
        />
      </mesh>

      <Html position={[cx, 0.08, cz - zoneDepth / 2 + 0.3]} center style={{ pointerEvents: "none" }}>
        <div
          className="select-none text-center"
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: department.color,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            textShadow: "0 1px 3px rgba(0,0,0,0.5)",
          }}
        >
          {department.name}
        </div>
      </Html>

      {agents.slice(0, 6).map((agent, i) => {
        const layout = DESK_LAYOUTS[i % DESK_LAYOUTS.length];
        const [wx, , wz] = agentWorldPosition(
          department.officeX,
          department.officeY,
          layout.deskX,
          layout.deskY
        );
        const chairOffset = layout.rot === 0 ? 0.45 : -0.45;

        return (
          <group key={agent.id}>
            <Workstation
              position={[wx, 0, wz]}
              rotation={layout.rot}
              screenColor={department.color}
            />
            <OfficeChair
              position={[wx, 0, wz + chairOffset]}
              rotation={layout.rot}
              color={i % 2 === 0 ? "#4a5568" : "#3a5068"}
            />
            <AgentCharacter
              agent={agent}
              position={[wx, 0, wz + chairOffset * 0.5]}
              highlight={highlightedAgentId === agent.id}
            />
          </group>
        );
      })}

      <Plant position={[cx - zoneWidth / 2 + 0.3, 0, cz + zoneDepth / 2 - 0.3]} />
    </group>
  );
}
