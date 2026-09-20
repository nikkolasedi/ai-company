"use client";

import { Html, Line } from "@react-three/drei";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import type { AgentWithDepartment, DepartmentWithAgents } from "@/types";
import type { AvatarStyle, EnvironmentStyle } from "@/lib/office/visual-styles";
import { ENVIRONMENT_THEMES } from "@/lib/office/visual-styles";
import { getDepartmentZoneCenter, getDeskWorldTransform, getFacingHubRotation } from "@/lib/office/layout";
import { OfficeChair, Plant, Workstation } from "./furniture";
import { AgentCharacter } from "./agent-character";

interface DepartmentZone3DProps {
  department: DepartmentWithAgents;
  agents: AgentWithDepartment[];
  highlightedAgentId?: string;
  environmentStyle?: EnvironmentStyle;
  avatarStyle?: AvatarStyle;
}

const ZONE_WIDTH = 4.6;
const ZONE_DEPTH = 2.4;

function hexPoints(w: number, d: number): [number, number, number][] {
  const hw = w / 2;
  const hd = d / 2;
  return [
    [-hw * 0.55, 0, -hd],
    [hw * 0.55, 0, -hd],
    [hw, 0, 0],
    [hw * 0.55, 0, hd],
    [-hw * 0.55, 0, hd],
    [-hw, 0, 0],
    [-hw * 0.55, 0, -hd],
  ];
}

export function DepartmentZone3D({
  department,
  agents,
  highlightedAgentId,
  environmentStyle = "C",
  avatarStyle = "B",
}: DepartmentZone3DProps) {
  const router = useRouter();
  const zoneCenter = getDepartmentZoneCenter(department.slug);
  const [cx, , cz] = zoneCenter;
  const theme = ENVIRONMENT_THEMES[environmentStyle];
  const facing = getFacingHubRotation(cx, cz);

  const hexShape = useMemo(() => {
    const shape = new THREE.Shape();
    const hw = ZONE_WIDTH / 2;
    const hd = ZONE_DEPTH / 2;
    shape.moveTo(-hw * 0.55, -hd);
    shape.lineTo(hw * 0.55, -hd);
    shape.lineTo(hw, 0);
    shape.lineTo(hw * 0.55, hd);
    shape.lineTo(-hw * 0.55, hd);
    shape.lineTo(-hw, 0);
    shape.closePath();
    return shape;
  }, []);

  const borderPoints = useMemo(() => hexPoints(ZONE_WIDTH, ZONE_DEPTH), []);

  const labelOffsetZ = -ZONE_DEPTH / 2 + 0.2;
  const labelX = cx + labelOffsetZ * Math.sin(facing);
  const labelZ = cz + labelOffsetZ * Math.cos(facing);

  const plantPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const offsets = [
      { lx: ZONE_WIDTH / 2 - 0.35, lz: ZONE_DEPTH / 2 - 0.25 },
      { lx: -ZONE_WIDTH / 2 + 0.35, lz: ZONE_DEPTH / 2 - 0.25 },
    ];
    for (let i = 0; i < theme.plantsPerZone; i++) {
      const o = offsets[i % offsets.length];
      positions.push([
        cx + o.lx * Math.cos(facing) - o.lz * Math.sin(facing),
        0,
        cz + o.lx * Math.sin(facing) + o.lz * Math.cos(facing),
      ]);
    }
    return positions;
  }, [cx, cz, facing, theme.plantsPerZone]);

  return (
    <group>
      <mesh
        position={[cx, 0.015, cz]}
        rotation={[-Math.PI / 2, facing, 0]}
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
          roughness={environmentStyle === "B" ? 0.3 : 0.85}
          metalness={environmentStyle === "B" ? 0.2 : 0}
          side={THREE.DoubleSide}
        />
      </mesh>

      <group position={[cx, 0.03, cz]} rotation={[0, facing, 0]}>
        <Line
          points={borderPoints}
          color={department.color}
          lineWidth={theme.zoneBorderWidth}
          transparent
          opacity={theme.zoneBorderOpacity}
        />
      </group>

      {environmentStyle === "B" && (
        <group position={[cx, 0.04, cz]} rotation={[0, facing, 0]}>
          <Line
            points={borderPoints.map(([x, y, z]) => [x * 0.92, y, z * 0.92] as [number, number, number])}
            color="#ffffff"
            lineWidth={0.8}
            transparent
            opacity={0.25}
          />
        </group>
      )}

      <Html
        position={[labelX, 0.5, labelZ]}
        center
        distanceFactor={12}
        style={{ pointerEvents: "none" }}
      >
        <div
          className="select-none whitespace-nowrap rounded-md px-2 py-0.5 text-center"
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: department.color,
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            background: theme.labelBg,
            textShadow: theme.labelUseGlow ? `0 0 10px ${department.color}` : "none",
          }}
        >
          {department.name}
        </div>
      </Html>

      {agents.slice(0, 6).map((agent, i) => {
        const desk = getDeskWorldTransform(zoneCenter, i);
        const agentFacingOffset = 0.05;
        const agentX = desk.chairPosition[0] - agentFacingOffset * Math.sin(desk.rotation);
        const agentZ = desk.chairPosition[2] - agentFacingOffset * Math.cos(desk.rotation);

        return (
          <group key={agent.id}>
            <Workstation
              position={desk.position}
              rotation={desk.rotation}
              screenColor={department.color}
              environmentStyle={environmentStyle}
            />
            <OfficeChair
              position={desk.chairPosition}
              rotation={desk.chairRotation}
              environmentStyle={environmentStyle}
            />
            <AgentCharacter
              agent={agent}
              position={[agentX, 0.2, agentZ]}
              rotation={desk.chairRotation}
              highlight={highlightedAgentId === agent.id}
              avatarStyle={avatarStyle}
            />
          </group>
        );
      })}

      {plantPositions.map((pos, i) => (
        <Plant key={`plant-${i}`} position={pos} environmentStyle={environmentStyle} />
      ))}
    </group>
  );
}
