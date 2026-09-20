"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import type { AgentWithDepartment } from "@/types";
import type { AvatarStyle } from "@/lib/office/visual-styles";
import {
  BADGE_FOR,
  FACE_FOR,
  OFFICE_ENTRANCE,
  shouldStand,
  visualBehaviorFor,
  walkSpeedFor,
  markCelebrating,
} from "@/lib/office/agent-behavior";
import { findPath } from "@/lib/office/navigation";
import type { NavObstacle } from "@/lib/office/navigation";
import { AgentCharacter } from "./agent-character";

interface LivingAgentProps {
  agent: AgentWithDepartment;
  deskPosition: [number, number, number];
  deskRotation: number;
  highlight?: boolean;
  avatarStyle?: AvatarStyle;
  obstacles: NavObstacle[];
}

export function LivingAgent({
  agent,
  deskPosition,
  deskRotation,
  highlight,
  avatarStyle = "B",
  obstacles,
}: LivingAgentProps) {
  const groupRef = useRef<Group>(null);
  const worldPosRef = useRef<[number, number, number]>([
    OFFICE_ENTRANCE[0],
    0.2,
    OFFICE_ENTRANCE[2],
  ]);
  const pathRef = useRef<[number, number][]>([]);
  const pathIdx = useRef(0);
  const rotationRef = useRef(deskRotation);
  const spawnedRef = useRef(false);
  const lastStatus = useRef(agent.status);

  const behavior = visualBehaviorFor(agent.status, agent.id);
  const badge = BADGE_FOR[behavior];
  const face = FACE_FOR[behavior];
  const standing = shouldStand(behavior);
  const working = behavior === "working" || behavior === "delegating";

  useEffect(() => {
    if (lastStatus.current === agent.status) return;

    if (agent.status === "IDLE" && lastStatus.current !== "IDLE") {
      markCelebrating(agent.id);
    }

    const becameActive =
      agent.status !== "IDLE" &&
      agent.status !== "OFFLINE" &&
      lastStatus.current === "IDLE";

    if (becameActive || !spawnedRef.current) {
      const wp = worldPosRef.current;
      const from = spawnedRef.current ? [wp[0], wp[2]] : [OFFICE_ENTRANCE[0], OFFICE_ENTRANCE[2]];
      pathRef.current = findPath(from[0], from[1], deskPosition[0], deskPosition[2], obstacles);
      pathIdx.current = 0;
      if (!spawnedRef.current) {
        worldPosRef.current = [OFFICE_ENTRANCE[0], 0.2, OFFICE_ENTRANCE[2]];
      }
      spawnedRef.current = true;
    }

    lastStatus.current = agent.status;
  }, [agent.status, agent.id, deskPosition, obstacles]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const speed = walkSpeedFor(behavior);
    const path = pathRef.current;
    let [x, y, z] = worldPosRef.current;

    if (path.length > 0 && pathIdx.current < path.length && !standing) {
      const [tx, tz] = path[pathIdx.current];
      const dx = tx - x;
      const dz = tz - z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.08) {
        pathIdx.current++;
      } else {
        const step = speed * delta;
        x += (dx / dist) * step;
        z += (dz / dist) * step;
        rotationRef.current = Math.atan2(dx, -dz);
        y = 0.2 + Math.abs(Math.sin(Date.now() * 0.012)) * 0.03;
      }
      worldPosRef.current = [x, y, z];
    } else if (standing) {
      const standY = 0.45 + Math.sin(Date.now() * 0.003) * 0.02;
      worldPosRef.current = [deskPosition[0], standY, deskPosition[2]];
      x = deskPosition[0];
      y = standY;
      z = deskPosition[2];
      rotationRef.current = deskRotation;
    } else if (working) {
      y = 0.2 + Math.abs(Math.sin(Date.now() * 0.008)) * 0.025;
      worldPosRef.current = [deskPosition[0], y, deskPosition[2]];
      x = deskPosition[0];
      z = deskPosition[2];
      rotationRef.current = deskRotation;
    } else if (behavior === "celebrating") {
      y = 0.35 + Math.abs(Math.sin(Date.now() * 0.01)) * 0.12;
      worldPosRef.current = [deskPosition[0], y, deskPosition[2]];
      x = deskPosition[0];
      z = deskPosition[2];
      rotationRef.current = deskRotation;
    } else if (behavior === "sleeping") {
      y = 0.12;
      worldPosRef.current = [deskPosition[0], y, deskPosition[2]];
      x = deskPosition[0];
      z = deskPosition[2];
      rotationRef.current = deskRotation;
    } else {
      worldPosRef.current = [deskPosition[0], 0.2, deskPosition[2]];
      x = deskPosition[0];
      y = 0.2;
      z = deskPosition[2];
      rotationRef.current = deskRotation;
    }

    groupRef.current.position.set(x, y, z);
    groupRef.current.rotation.y = rotationRef.current;
  });

  return (
    <group ref={groupRef}>
      <AgentCharacter
        agent={agent}
        position={[0, 0, 0]}
        rotation={0}
        highlight={highlight}
        avatarStyle={avatarStyle}
        faceExpression={face}
        badgeKind={badge}
        showWorkParticles={working}
        isStanding={standing}
        isSleeping={behavior === "sleeping"}
      />
    </group>
  );
}
