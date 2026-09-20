"use client";

import type { AvatarStyle } from "@/lib/office/visual-styles";

interface AvatarMeshProps {
  color: string;
  style: AvatarStyle;
}

export function AvatarMesh({ color, style }: AvatarMeshProps) {
  if (style === "A") return <CapsuleAvatar color={color} />;
  if (style === "D") return <RealisticAvatar color={color} />;
  return <LowPolyAvatar color={color} />;
}

/** Style A — simple rounded capsule blob with dot eyes and smile. */
function CapsuleAvatar({ color }: { color: string }) {
  const eye = "#1a1a2e";

  return (
    <group position={[0, 0.1, 0.04]} rotation={[-0.06, 0, 0]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.15, 0.28, 12, 24]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.04} />
      </mesh>
      <mesh position={[-0.045, 0.3, 0.1]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshStandardMaterial color={eye} />
      </mesh>
      <mesh position={[0.045, 0.3, 0.1]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshStandardMaterial color={eye} />
      </mesh>
      <mesh position={[0, 0.26, 0.11]} rotation={[0.3, 0, 0]}>
        <torusGeometry args={[0.025, 0.006, 6, 12, Math.PI]} />
        <meshStandardMaterial color={eye} />
      </mesh>
    </group>
  );
}

/** Style B — blocky low-poly humanoid (Minecraft / Roblox style). */
function LowPolyAvatar({ color }: { color: string }) {
  const skin = "#e8c4a0";
  const hair = "#6b4423";
  const pants = "#3b5bdb";

  return (
    <group position={[0, 0.1, 0.03]} rotation={[-0.06, 0, 0]}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[0.22, 0.22, 0.13]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.34, 0.02]} castShadow>
        <boxGeometry args={[0.14, 0.14, 0.14]} />
        <meshStandardMaterial color={skin} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.41, 0.02]} castShadow>
        <boxGeometry args={[0.15, 0.05, 0.15]} />
        <meshStandardMaterial color={hair} roughness={0.85} />
      </mesh>
      <mesh position={[-0.14, 0.14, 0.1]} rotation={[0.65, 0, 0]} castShadow>
        <boxGeometry args={[0.06, 0.15, 0.06]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      <mesh position={[0.14, 0.14, 0.1]} rotation={[0.65, 0, 0]} castShadow>
        <boxGeometry args={[0.06, 0.15, 0.06]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      <mesh position={[-0.07, 0.02, 0.15]} rotation={[1.15, 0, 0]} castShadow>
        <boxGeometry args={[0.08, 0.18, 0.08]} />
        <meshStandardMaterial color={pants} roughness={0.8} />
      </mesh>
      <mesh position={[0.07, 0.02, 0.15]} rotation={[1.15, 0, 0]} castShadow>
        <boxGeometry args={[0.08, 0.18, 0.08]} />
        <meshStandardMaterial color={pants} roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Style D — realistic seated humanoid (procedural GLB-style mesh). */
function RealisticAvatar({ color: _accent }: { color: string }) {
  const skin = "#d4a574";
  const hair = "#4a3728";
  const beard = "#5c4033";
  const shirt = "#1e3a5f";
  const pants = "#2d3748";

  return (
    <group position={[0, 0.1, 0.03]} rotation={[-0.06, 0, 0]}>
      {/* Torso / shirt */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.2, 0.24, 0.12]} />
        <meshStandardMaterial color={shirt} roughness={0.65} />
      </mesh>
      {/* Shoulders */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.24, 0.06, 0.13]} />
        <meshStandardMaterial color={shirt} roughness={0.65} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.36, 0.02]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.06, 8]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.44, 0.03]} castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 0.5, 0.02]} castShadow>
        <sphereGeometry args={[0.1, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={hair} roughness={0.8} />
      </mesh>
      {/* Beard */}
      <mesh position={[0, 0.4, 0.08]} castShadow>
        <boxGeometry args={[0.08, 0.06, 0.04]} />
        <meshStandardMaterial color={beard} roughness={0.85} />
      </mesh>
      {/* Arms reaching toward desk */}
      <mesh position={[-0.13, 0.18, 0.08]} rotation={[0.7, 0, 0.2]} castShadow>
        <capsuleGeometry args={[0.035, 0.12, 6, 8]} />
        <meshStandardMaterial color={shirt} roughness={0.65} />
      </mesh>
      <mesh position={[0.13, 0.18, 0.08]} rotation={[0.7, 0, -0.2]} castShadow>
        <capsuleGeometry args={[0.035, 0.12, 6, 8]} />
        <meshStandardMaterial color={shirt} roughness={0.65} />
      </mesh>
      {/* Forearms on desk */}
      <mesh position={[-0.1, 0.12, 0.14]} rotation={[0.2, 0, 0.15]} castShadow>
        <capsuleGeometry args={[0.03, 0.1, 6, 8]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>
      <mesh position={[0.1, 0.12, 0.14]} rotation={[0.2, 0, -0.15]} castShadow>
        <capsuleGeometry args={[0.03, 0.1, 6, 8]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>
      {/* Seated legs */}
      <mesh position={[-0.07, 0.04, 0.14]} rotation={[1.2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.045, 0.14, 6, 8]} />
        <meshStandardMaterial color={pants} roughness={0.75} />
      </mesh>
      <mesh position={[0.07, 0.04, 0.14]} rotation={[1.2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.045, 0.14, 6, 8]} />
        <meshStandardMaterial color={pants} roughness={0.75} />
      </mesh>
    </group>
  );
}
