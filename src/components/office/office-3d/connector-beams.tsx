"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import type { ToolUsePulse } from "@/hooks/use-office-live-data";

function BeamPulse({
  pulse,
  dockPosition,
}: {
  pulse: ToolUsePulse;
  dockPosition: [number, number, number];
}) {
  const [progress, setProgress] = useState(0);
  const agentPos = pulse.agentPosition;
  const age = Date.now() - pulse.timestamp;
  const alive = age < 2000;

  useFrame((_, delta) => {
    if (!alive) return;
    setProgress((p) => Math.min(1, p + delta * 1.8));
  });

  if (!alive) return null;

  const mx = agentPos[0] + (dockPosition[0] - agentPos[0]) * progress;
  const my = 0.6 + Math.sin(progress * Math.PI) * 0.4;
  const mz = agentPos[2] + (dockPosition[2] - agentPos[2]) * progress;

  const points: [number, number, number][] = [
    [agentPos[0], 0.5, agentPos[2]],
    [mx, my, mz],
    [dockPosition[0], 0.8, dockPosition[2]],
  ];

  return (
    <Line
      points={points}
      color={pulse.color}
      lineWidth={2}
      transparent
      opacity={0.7 * (1 - age / 2000)}
    />
  );
}

/** Per-department connector dock + animated beams on tool use. */
export function ConnectorBeams({
  departmentSlug,
  departmentColor,
  zoneCenter,
  pulses,
}: {
  departmentSlug: string;
  departmentColor: string;
  zoneCenter: [number, number, number];
  pulses: ToolUsePulse[];
}) {
  const dockPosition = useMemo((): [number, number, number] => {
    const [cx, , cz] = zoneCenter;
    return [cx + 1.6, 0.6, cz - 0.4];
  }, [zoneCenter]);

  const deptPulses = pulses.filter((p) => p.departmentSlug === departmentSlug);

  return (
    <group>
      <mesh position={dockPosition}>
        <boxGeometry args={[0.35, 0.35, 0.08]} />
        <meshStandardMaterial
          color={departmentColor}
          emissive={departmentColor}
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
      {deptPulses.map((pulse) => (
        <BeamPulse key={pulse.id} pulse={pulse} dockPosition={dockPosition} />
      ))}
    </group>
  );
}
