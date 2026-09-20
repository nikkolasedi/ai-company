"use client";

import type { AvatarStyle } from "@/lib/office/visual-styles";

interface AvatarMeshProps {
  color: string;
  style: AvatarStyle;
}

export function AvatarMesh({ color, style }: AvatarMeshProps) {
  if (style === "A") return <CapsuleAvatar color={color} />;
  if (style === "C") return <VoxelAvatar color={color} />;
  return <LowPolyAvatar color={color} />;
}

function CapsuleAvatar({ color }: { color: string }) {
  const eye = "#1a1a2e";

  return (
    <group position={[0, 0.12, 0.02]} rotation={[-0.08, 0, 0]}>
      <mesh position={[0, 0.14, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.14, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.32, 0.04]} castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.05} />
      </mesh>
      <mesh position={[-0.035, 0.34, 0.1]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color={eye} />
      </mesh>
      <mesh position={[0.035, 0.34, 0.1]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color={eye} />
      </mesh>
    </group>
  );
}

function LowPolyAvatar({ color }: { color: string }) {
  const skin = "#e8c4a0";
  const hair = "#5c4030";
  const pants = "#3a4550";

  return (
    <group position={[0, 0.1, 0.02]} rotation={[-0.06, 0, 0]}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[0.2, 0.2, 0.12]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.34, 0.03]} castShadow>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.4, 0.03]} castShadow>
        <boxGeometry args={[0.13, 0.05, 0.13]} />
        <meshStandardMaterial color={hair} roughness={0.85} />
      </mesh>
      <mesh position={[-0.13, 0.14, 0.1]} rotation={[0.6, 0, 0]} castShadow>
        <boxGeometry args={[0.05, 0.14, 0.05]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0.13, 0.14, 0.1]} rotation={[0.6, 0, 0]} castShadow>
        <boxGeometry args={[0.05, 0.14, 0.05]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[-0.06, 0.02, 0.14]} rotation={[1.1, 0, 0]} castShadow>
        <boxGeometry args={[0.07, 0.16, 0.07]} />
        <meshStandardMaterial color={pants} roughness={0.8} />
      </mesh>
      <mesh position={[0.06, 0.02, 0.14]} rotation={[1.1, 0, 0]} castShadow>
        <boxGeometry args={[0.07, 0.16, 0.07]} />
        <meshStandardMaterial color={pants} roughness={0.8} />
      </mesh>
    </group>
  );
}

function VoxelAvatar({ color }: { color: string }) {
  const skin = "#e8c4a0";
  const hair = "#5c4030";

  const voxels: Array<{ pos: [number, number, number]; size: [number, number, number]; mat: string; rot?: [number, number, number] }> = [
    { pos: [0, 0.08, 0.06], size: [0.1, 0.12, 0.1], mat: color },
    { pos: [0, 0.2, 0.04], size: [0.12, 0.12, 0.1], mat: color },
    { pos: [0, 0.32, 0.06], size: [0.09, 0.09, 0.09], mat: skin },
    { pos: [0, 0.37, 0.06], size: [0.1, 0.04, 0.1], mat: hair },
    { pos: [-0.08, 0.16, 0.12], size: [0.05, 0.08, 0.05], mat: color, rot: [0.6, 0, 0] },
    { pos: [0.08, 0.16, 0.12], size: [0.05, 0.08, 0.05], mat: color, rot: [0.6, 0, 0] },
    { pos: [-0.05, 0.02, 0.14], size: [0.05, 0.1, 0.05], mat: "#3a4550", rot: [1.1, 0, 0] },
    { pos: [0.05, 0.02, 0.14], size: [0.05, 0.1, 0.05], mat: "#3a4550", rot: [1.1, 0, 0] },
  ];

  return (
    <group position={[0, 0.1, 0.02]} rotation={[-0.05, 0, 0]}>
      {voxels.map((v, i) => (
        <mesh key={i} position={v.pos} rotation={v.rot ?? [0, 0, 0]} castShadow>
          <boxGeometry args={v.size} />
          <meshStandardMaterial color={v.mat} roughness={0.82} />
        </mesh>
      ))}
    </group>
  );
}
