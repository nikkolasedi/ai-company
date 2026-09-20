"use client";

import { Html, Line } from "@react-three/drei";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import type { AgentWithDepartment, DepartmentWithAgents } from "@/types";
import type { AvatarStyle, EnvironmentStyle } from "@/lib/office/visual-styles";
import { ENVIRONMENT_THEMES } from "@/lib/office/visual-styles";
import { agentWorldPosition, departmentCenter } from "@/lib/office/coordinates";
import { OfficeChair, Plant, Workstation } from "./furniture";
import { AgentCharacter } from "./agent-character";

interface DepartmentZone3DProps {
  department: DepartmentWithAgents;
  agents: AgentWithDepartment[];
  highlightedAgentId?: string;
  environmentStyle?: EnvironmentStyle;
  avatarStyle?: AvatarStyle;
}

const DESK_LAYOUTS: Array<{ deskX: number; deskY: number; rot: number }> = [
  { deskX: 0, deskY: 0, rot: 0 },
  { deskX: 60, deskY: 20, rot: 0 },
  { deskX: 120, deskY: 0, rot: Math.PI },
  { deskX: 180, deskY: 20, rot: Math.PI },
  { deskX: 240, deskY: 0, rot: 0 },
  { deskX: 300, deskY: 20, rot: Math.PI },
];

function hexPoints(w: number, d: number): [number, number, number][] {
  const hw = w / 2;
  const hd = d / 2;
  const pts: [number, number, number][] = [
    [-hw * 0.55, 0, -hd],
    [hw * 0.55, 0, -hd],
    [hw, 0, 0],
    [hw * 0.55, 0, hd],
    [-hw * 0.55, 0, hd],
    [-hw, 0, 0],
    [-hw * 0.55, 0, -hd],
  ];
  return pts;
}

export function DepartmentZone3D({
  department,
  agents,
  highlightedAgentId,
  environmentStyle = "C",
  avatarStyle = "B",
}: DepartmentZone3DProps) {
  const router = useRouter();
  const [cx, , cz] = departmentCenter(department.officeX, department.officeY);
  const zoneWidth = 5.2;
  const zoneDepth = 2.8;
  const theme = ENVIRONMENT_THEMES[environmentStyle];

  const hexShape = useMemo(() => {
    const shape = new THREE.Shape();
    const hw = zoneWidth / 2;
    const hd = zoneDepth / 2;
    shape.moveTo(-hw * 0.55, -hd);
    shape.lineTo(hw * 0.55, -hd);
    shape.lineTo(hw, 0);
    shape.lineTo(hw * 0.55, hd);
    shape.lineTo(-hw * 0.55, hd);
    shape.lineTo(-hw, 0);
    shape.closePath();
    return shape;
  }, [zoneWidth, zoneDepth]);

  const borderPoints = useMemo(() => hexPoints(zoneWidth, zoneDepth), [zoneWidth, zoneDepth]);

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
        <shapeGeometry args={[hexShape]} />
        <meshStandardMaterial
          color={department.color}
          emissive={department.color}
          emissiveIntensity={theme.zoneEmissive}
          transparent
          opacity={theme.zoneOpacity}
          roughness={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>

      <Line
        points={borderPoints.map(([x, y, z]) => [cx + x, 0.03, cz + z] as [number, number, number])}
        color={department.color}
        lineWidth={environmentStyle === "B" ? 2.5 : 1.5}
        transparent
        opacity={environmentStyle === "B" ? 0.9 : 0.6}
      />

      <Html
        position={[cx, 0.5, cz - zoneDepth / 2 + 0.15]}
        center
        distanceFactor={12}
        style={{ pointerEvents: "none" }}
      >
        <div
          className="select-none whitespace-nowrap rounded-md px-2 py-0.5 text-center backdrop-blur-sm"
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: department.color,
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            background: "rgba(0,0,0,0.45)",
            textShadow: `0 0 8px ${department.color}80`,
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
        const chairOffset = layout.rot === 0 ? 0.42 : -0.42;
        const chairRotation = layout.rot + Math.PI;
        const deskFacingOffset = layout.rot === 0 ? -0.05 : 0.05;
        const chairZ = wz + chairOffset + deskFacingOffset;

        return (
          <group key={agent.id}>
            <Workstation
              position={[wx, 0, wz]}
              rotation={layout.rot}
              screenColor={department.color}
              environmentStyle={environmentStyle}
            />
            <OfficeChair
              position={[wx, 0, chairZ]}
              rotation={chairRotation}
              environmentStyle={environmentStyle}
            />
            <AgentCharacter
              agent={agent}
              position={[wx, 0.2, chairZ]}
              rotation={chairRotation}
              highlight={highlightedAgentId === agent.id}
              avatarStyle={avatarStyle}
            />
          </group>
        );
      })}

      <Plant
        position={[cx - zoneWidth / 2 + 0.35, 0, cz + zoneDepth / 2 - 0.25]}
        environmentStyle={environmentStyle}
      />
    </group>
  );
}
