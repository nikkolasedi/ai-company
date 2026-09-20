"use client";

import { Html, Line } from "@react-three/drei";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import type { AgentWithDepartment, DepartmentWithAgents } from "@/types";
import type { AvatarStyle, EnvironmentStyle } from "@/lib/office/visual-styles";
import { ENVIRONMENT_THEMES } from "@/lib/office/visual-styles";
import {
  getDepartmentZoneCenter,
  getDeskWorldTransform,
  getFacingHubRotation,
  regularHexagonPoints,
  ZONE_HEX_RADIUS,
} from "@/lib/office/layout";
import { OfficeChair, Plant, Workstation } from "./furniture";
import { AgentCharacter } from "./agent-character";

interface DepartmentZone3DProps {
  department: DepartmentWithAgents;
  agents: AgentWithDepartment[];
  highlightedAgentId?: string;
  environmentStyle?: EnvironmentStyle;
  avatarStyle?: AvatarStyle;
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
    const pts = regularHexagonPoints(ZONE_HEX_RADIUS);
    shape.moveTo(pts[0][0], pts[0][2]);
    for (let i = 1; i < pts.length; i++) {
      shape.lineTo(pts[i][0], pts[i][2]);
    }
    shape.closePath();
    return shape;
  }, []);

  const borderPoints = useMemo(() => regularHexagonPoints(ZONE_HEX_RADIUS), []);

  const labelDist = ZONE_HEX_RADIUS + 0.15;
  const labelX = cx + labelDist * Math.sin(facing);
  const labelZ = cz + labelDist * Math.cos(facing);

  const plantAngle = facing + Math.PI / 3;
  const plantPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const dist = ZONE_HEX_RADIUS + 0.2;
    for (let i = 0; i < theme.plantsPerZone; i++) {
      const a = plantAngle + i * (Math.PI / 2);
      positions.push([cx + dist * Math.sin(a), 0, cz + dist * Math.cos(a)]);
    }
    return positions;
  }, [cx, cz, plantAngle, theme.plantsPerZone]);

  return (
    <group>
      <mesh
        position={[cx, 0.012, cz]}
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
          roughness={environmentStyle === "B" ? 0.3 : 0.85}
          metalness={environmentStyle === "B" ? 0.2 : 0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <Line
        points={borderPoints.map(([x, y, z]) => [cx + x, 0.025, cz + z] as [number, number, number])}
        color={department.color}
        lineWidth={theme.zoneBorderWidth}
        transparent
        opacity={theme.zoneBorderOpacity}
      />

      {environmentStyle === "B" && (
        <Line
          points={borderPoints.map(([x, y, z]) => [
            cx + x * 0.88,
            0.03,
            cz + z * 0.88,
          ] as [number, number, number])}
          color="#ffffff"
          lineWidth={0.6}
          transparent
          opacity={0.2}
        />
      )}

      <Html position={[labelX, 0.55, labelZ]} center distanceFactor={13} style={{ pointerEvents: "none" }}>
        <div
          className="select-none whitespace-nowrap rounded-md px-2 py-0.5 text-center"
          style={{
            fontSize: "9px",
            fontWeight: 700,
            color: department.color,
            letterSpacing: "1px",
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
        const agentFacingOffset = 0.04;
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
