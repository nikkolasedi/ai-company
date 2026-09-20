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
  return (
    <group>
      <mesh position={[0, 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.15, 0.4, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </group>
  );
}

function LowPolyAvatar({ color }: { color: string }) {
  const skin = "#e8c4a0";
  const shirt = color;

  return (
    <group>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.22, 0.28, 0.14]} />
        <meshStandardMaterial color={shirt} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[0.14, 0.14, 0.14]} />
        <meshStandardMaterial color={skin} roughness={0.8} />
      </mesh>
      <mesh position={[-0.14, 0.42, 0]} castShadow>
        <boxGeometry args={[0.06, 0.22, 0.06]} />
        <meshStandardMaterial color={shirt} roughness={0.75} />
      </mesh>
      <mesh position={[0.14, 0.42, 0]} castShadow>
        <boxGeometry args={[0.06, 0.22, 0.06]} />
        <meshStandardMaterial color={shirt} roughness={0.75} />
      </mesh>
      <mesh position={[-0.07, 0.18, 0]} castShadow>
        <boxGeometry args={[0.08, 0.22, 0.08]} />
        <meshStandardMaterial color="#3a4550" roughness={0.8} />
      </mesh>
      <mesh position={[0.07, 0.18, 0]} castShadow>
        <boxGeometry args={[0.08, 0.22, 0.08]} />
        <meshStandardMaterial color="#3a4550" roughness={0.8} />
      </mesh>
    </group>
  );
}

function VoxelAvatar({ color }: { color: string }) {
  const skin = "#e8c4a0";

  const voxels: Array<{ pos: [number, number, number]; size: [number, number, number]; mat: string }> = [
    { pos: [0, 0.2, 0], size: [0.1, 0.2, 0.1], mat: color },
    { pos: [0, 0.38, 0], size: [0.14, 0.16, 0.12], mat: color },
    { pos: [0, 0.54, 0], size: [0.1, 0.1, 0.1], mat: skin },
    { pos: [-0.1, 0.38, 0], size: [0.06, 0.12, 0.06], mat: color },
    { pos: [0.1, 0.38, 0], size: [0.06, 0.12, 0.06], mat: color },
    { pos: [-0.06, 0.14, 0], size: [0.06, 0.14, 0.06], mat: "#3a4550" },
    { pos: [0.06, 0.14, 0], size: [0.06, 0.14, 0.06], mat: "#3a4550" },
  ];

  return (
    <group>
      {voxels.map((v, i) => (
        <mesh key={i} position={v.pos} castShadow>
          <boxGeometry args={v.size} />
          <meshStandardMaterial color={v.mat} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}
