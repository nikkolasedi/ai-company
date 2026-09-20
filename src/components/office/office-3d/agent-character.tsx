"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Group } from "three";
import type { AgentWithDepartment } from "@/types";
import type { AvatarStyle } from "@/lib/office/visual-styles";
import { generateAvatarColor } from "@/lib/office/avatar-color";
import { STATUS_COLORS } from "@/lib/office/status-colors";
import { AvatarMesh } from "./avatars";
import { ThinkingIndicator } from "./thinking-indicator";

interface AgentCharacterProps {
  agent: AgentWithDepartment;
  position: [number, number, number];
  rotation?: number;
  highlight?: boolean;
  avatarStyle?: AvatarStyle;
}

export function AgentCharacter({
  agent,
  position,
  rotation = 0,
  highlight,
  avatarStyle = "B",
}: AgentCharacterProps) {
  const router = useRouter();
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  const color = generateAvatarColor(agent.id, agent.department.color);
  const statusColor = STATUS_COLORS[agent.status];
  const isActive = agent.status !== "IDLE";

  useFrame((state, delta) => {
    if (!groupRef.current || !bodyRef.current) return;

    const t = state.clock.elapsedTime;
    const lerpFactor = 1 - Math.pow(0.05, delta);
    const pos = groupRef.current.position;
    pos.x += (position[0] - pos.x) * lerpFactor;
    pos.z += (position[2] - pos.z) * lerpFactor;

    if (agent.status === "WORKING") {
      bodyRef.current.position.y = Math.abs(Math.sin(t * 6)) * 0.02;
    } else if (agent.status === "DELEGATING") {
      bodyRef.current.position.y = Math.sin(t * 4) * 0.015;
    } else {
      bodyRef.current.position.y = Math.sin(t * 2) * 0.01;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, rotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/agents/${agent.id}`);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      <group ref={bodyRef}>
        <AvatarMesh color={color} style={avatarStyle} />
      </group>

      {agent.status === "THINKING" && <ThinkingIndicator />}

      {isActive && (
        <mesh position={[0, 0.62, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={1.8}
          />
        </mesh>
      )}

      {(highlight || hovered) && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.27, 32]} />
          <meshStandardMaterial
            color={highlight ? "#ffffff" : statusColor}
            emissive={highlight ? "#ffffff" : statusColor}
            emissiveIntensity={0.6}
            transparent
            opacity={0.85}
          />
        </mesh>
      )}

      {hovered && (
        <Html position={[0, 0.85, 0]} center distanceFactor={10} style={{ pointerEvents: "none" }}>
          <div className="pointer-events-none whitespace-nowrap rounded bg-zinc-900/90 px-2 py-1 text-[11px] text-white shadow-lg backdrop-blur-sm">
            {agent.name} — {agent.role}
          </div>
        </Html>
      )}
    </group>
  );
}
