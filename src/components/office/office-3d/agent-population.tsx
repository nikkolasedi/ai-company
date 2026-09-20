"use client";

import { useMemo } from "react";
import type { AgentWithDepartment, DepartmentWithAgents } from "@/types";
import type { AvatarStyle } from "@/lib/office/visual-styles";
import { position2dTo3d } from "@/lib/office/coordinates";
import { getDepartmentZoneCenter, getDeskWorldTransform } from "@/lib/office/layout";
import { buildOfficeObstacles } from "@/lib/office/navigation";
import { LivingAgent } from "./living-agent";

interface AgentPopulationProps {
  departments: DepartmentWithAgents[];
  agents: AgentWithDepartment[];
  highlightedAgentId?: string;
  avatarStyle?: AvatarStyle;
}

export function AgentPopulation({
  departments,
  agents,
  highlightedAgentId,
  avatarStyle = "B",
}: AgentPopulationProps) {
  const [meetingX, , meetingZ] = position2dTo3d({ x: 450, y: 350 });

  const { assignments, obstacles } = useMemo(() => {
    const desks: Array<{ x: number; z: number }> = [];
    const list: Array<{
      agent: AgentWithDepartment;
      deskPosition: [number, number, number];
      deskRotation: number;
    }> = [];

    for (const dept of departments) {
      const zoneCenter = getDepartmentZoneCenter(dept.slug);
      const deptAgents = agents.filter(
        (a) => a.department.slug === dept.slug && !a.isOrchestrator
      );
      deptAgents.forEach((agent, i) => {
        const desk = getDeskWorldTransform(zoneCenter, i);
        desks.push({ x: desk.position[0], z: desk.position[2] });
        const offset = 0.04;
        list.push({
          agent,
          deskPosition: [
            desk.chairPosition[0] - offset * Math.sin(desk.rotation),
            0.2,
            desk.chairPosition[2] - offset * Math.cos(desk.rotation),
          ],
          deskRotation: desk.chairRotation,
        });
      });
    }

    const obs = buildOfficeObstacles(desks, { x: meetingX, z: meetingZ, r: 1.35 });
    return { assignments: list, obstacles: obs };
  }, [departments, agents, meetingX, meetingZ]);

  const ceo = agents.find((a) => a.isOrchestrator);

  return (
    <group>
      {assignments.map(({ agent, deskPosition, deskRotation }) => (
        <LivingAgent
          key={agent.id}
          agent={agent}
          deskPosition={deskPosition}
          deskRotation={deskRotation}
          highlight={highlightedAgentId === agent.id}
          avatarStyle={avatarStyle}
          obstacles={obstacles}
        />
      ))}
      {ceo && (
        <LivingAgent
          agent={ceo}
          deskPosition={[meetingX, 0.2, meetingZ + 0.55]}
          deskRotation={Math.PI}
          highlight={highlightedAgentId === ceo.id}
          avatarStyle={avatarStyle}
          obstacles={obstacles}
        />
      )}
    </group>
  );
}
