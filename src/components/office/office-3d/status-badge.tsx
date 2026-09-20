"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { BadgeKind } from "@/lib/office/agent-behavior";

const BADGE_SYMBOL: Record<Exclude<BadgeKind, "none">, string> = {
  waiting: "?",
  blocked: "!",
  working: "⚒",
  done: "✓",
};

const BADGE_COLOR: Record<Exclude<BadgeKind, "none">, string> = {
  waiting: "#fbbf24",
  blocked: "#ef4444",
  working: "#38bdf8",
  done: "#4ade80",
};

export function StatusBadge({ kind }: { kind: BadgeKind }) {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current || kind === "none") return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = 0.72 + Math.sin(t * 4) * 0.04;
  });

  if (kind === "none") return null;

  const color = BADGE_COLOR[kind];
  const symbol = BADGE_SYMBOL[kind];

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.11, 10, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.85} />
      </mesh>
      <Html center distanceFactor={8} style={{ pointerEvents: "none" }}>
        <div
          className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-slate-900"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        >
          {symbol}
        </div>
      </Html>
    </group>
  );
}
