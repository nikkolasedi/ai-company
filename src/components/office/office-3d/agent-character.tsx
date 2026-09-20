"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Group } from "three";
import type { AgentWithDepartment } from "@/types";
import type { AvatarStyle } from "@/lib/office/visual-styles";
import type { BadgeKind, FaceExpression } from "@/lib/office/agent-behavior";
import { generateAvatarColor } from "@/lib/office/avatar-color";
import { AvatarMesh } from "./avatars";
import { FaceScreen } from "./face-screen";
import { StatusBadge } from "./status-badge";
import { WorkParticles } from "./work-particles";

interface AgentCharacterProps {
  agent: AgentWithDepartment;
  position: [number, number, number];
  rotation?: number;
  highlight?: boolean;
  avatarStyle?: AvatarStyle;
  faceExpression?: FaceExpression;
  badgeKind?: BadgeKind;
  showWorkParticles?: boolean;
  isStanding?: boolean;
  isSleeping?: boolean;
}

export function AgentCharacter({
  agent,
  position,
  rotation = 0,
  highlight,
  avatarStyle = "B",
  faceExpression = "neutral",
  badgeKind = "none",
  showWorkParticles = false,
  isStanding = false,
  isSleeping = false,
}: AgentCharacterProps) {
  const router = useRouter();
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  const color = generateAvatarColor(agent.id, agent.department.color);
  const particlePos: [number, number, number] = [0, 0.35, 0.1];

  useFrame((state) => {
    if (!bodyRef.current) return;
    const t = state.clock.elapsedTime;
    if (isSleeping) {
      bodyRef.current.rotation.x = 0.35;
      bodyRef.current.position.y = -0.05;
    } else if (isStanding) {
      bodyRef.current.rotation.x = 0;
      bodyRef.current.position.y = Math.sin(t * 2) * 0.015;
    } else {
      bodyRef.current.rotation.x = -0.06;
      bodyRef.current.position.y = Math.sin(t * 3) * 0.01;
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
        <FaceScreen expression={faceExpression} />
      </group>

      <StatusBadge kind={badgeKind} />

      {showWorkParticles && <WorkParticles active position={particlePos} />}

      {(highlight || hovered) && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.28, 32]} />
          <meshStandardMaterial
            color={highlight ? "#ffffff" : agent.department.color}
            emissive={highlight ? "#ffffff" : agent.department.color}
            emissiveIntensity={0.7}
            transparent
            opacity={0.9}
          />
        </mesh>
      )}

      {hovered && (
        <Html position={[0, 0.85, 0]} center distanceFactor={10} style={{ pointerEvents: "none" }}>
          <div className="pointer-events-none whitespace-nowrap rounded-lg bg-slate-900/90 px-2.5 py-1 text-[11px] text-white shadow-lg backdrop-blur-sm">
            {agent.name} — {agent.role}
          </div>
        </Html>
      )}
    </group>
  );
}
