"use client";

import { OFFICE_ENTRANCE } from "@/lib/office/agent-behavior";

export function OfficeEntrance() {
  const [x, , z] = OFFICE_ENTRANCE;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.8, 1.1, 0.12]} />
        <meshStandardMaterial color="#4a5568" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.55, 0.08]}>
        <boxGeometry args={[1.4, 0.85, 0.02]} />
        <meshStandardMaterial
          color="#a8d4f0"
          transparent
          opacity={0.45}
          roughness={0.05}
          metalness={0.6}
        />
      </mesh>
      <mesh position={[0, 0.02, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 0.8]} />
        <meshStandardMaterial color="#64748b" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[2, 0.08, 0.2]} />
        <meshStandardMaterial color="#334155" emissive="#38bdf8" emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}
