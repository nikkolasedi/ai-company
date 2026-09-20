import * as THREE from "three";
import type { EnvironmentStyle } from "@/lib/office/visual-styles";
import { ENVIRONMENT_THEMES } from "@/lib/office/visual-styles";

const DESK_HEIGHT = 0.42;

export function Workstation({
  position,
  rotation = 0,
  screenColor = "#90c0f0",
  environmentStyle = "C",
}: {
  position: [number, number, number];
  rotation?: number;
  screenColor?: string;
  environmentStyle?: EnvironmentStyle;
}) {
  const theme = ENVIRONMENT_THEMES[environmentStyle];
  const isCyber = environmentStyle === "B";

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[-0.15, DESK_HEIGHT, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.04, 0.55]} />
        <meshStandardMaterial
          color={theme.deskWood}
          roughness={isCyber ? 0.3 : 0.65}
          metalness={isCyber ? 0.4 : 0.02}
        />
      </mesh>
      <mesh position={[0.35, DESK_HEIGHT, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.04, 0.35]} />
        <meshStandardMaterial
          color={theme.deskWood}
          roughness={isCyber ? 0.3 : 0.65}
          metalness={isCyber ? 0.4 : 0.02}
        />
      </mesh>
      {[
        [-0.55, 0.2, -0.22],
        [0.25, 0.2, -0.22],
        [-0.55, 0.2, 0.22],
        [0.55, 0.2, 0.22],
      ].map((pos, i) => (
        <mesh key={`leg-${i}`} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[0.04, 0.4, 0.04]} />
          <meshStandardMaterial
            color={theme.deskMetal}
            roughness={0.4}
            metalness={0.55}
          />
        </mesh>
      ))}

      {[-0.2, 0.1].map((x, i) => (
        <group key={`monitor-${i}`} position={[x, DESK_HEIGHT + 0.02, -0.15]}>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 0.08, 8]} />
            <meshStandardMaterial color={theme.deskMetal} roughness={0.35} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.02, 0.16, 0.02]} />
            <meshStandardMaterial color={theme.monitorFrame} roughness={0.35} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.32, 0]} castShadow>
            <boxGeometry args={[0.38, 0.24, 0.02]} />
            <meshStandardMaterial color={theme.monitorFrame} roughness={0.25} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.32, 0.015]}>
            <planeGeometry args={[0.32, 0.18]} />
            <meshStandardMaterial
              color="#d0e8ff"
              emissive={screenColor}
              emissiveIntensity={isCyber ? 0.9 : 0.55}
              transparent
              opacity={0.95}
            />
          </mesh>
        </group>
      ))}

      <mesh position={[0, DESK_HEIGHT + 0.025, 0.08]}>
        <boxGeometry args={[0.28, 0.01, 0.1]} />
        <meshStandardMaterial color={theme.deskMetal} roughness={0.5} metalness={0.25} />
      </mesh>
    </group>
  );
}

export function OfficeChair({
  position,
  rotation = 0,
  color,
  environmentStyle = "C",
}: {
  position: [number, number, number];
  rotation?: number;
  color?: string;
  environmentStyle?: EnvironmentStyle;
}) {
  const theme = ENVIRONMENT_THEMES[environmentStyle];
  const chairColor = color ?? theme.chairColor;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.18, 0.04, 5]} />
        <meshStandardMaterial color={theme.deskMetal} roughness={0.35} metalness={0.55} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.22, 8]} />
        <meshStandardMaterial color={theme.deskMetal} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.28, 0.04, 0.28]} />
        <meshStandardMaterial color={chairColor} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.5, -0.12]} castShadow>
        <boxGeometry args={[0.26, 0.36, 0.03]} />
        <meshStandardMaterial color={chairColor} roughness={0.75} />
      </mesh>
      <mesh position={[0.15, 0.38, 0]}>
        <boxGeometry args={[0.03, 0.04, 0.2]} />
        <meshStandardMaterial color={theme.deskMetal} roughness={0.45} metalness={0.4} />
      </mesh>
      <mesh position={[-0.15, 0.38, 0]}>
        <boxGeometry args={[0.03, 0.04, 0.2]} />
        <meshStandardMaterial color={theme.deskMetal} roughness={0.45} metalness={0.4} />
      </mesh>
    </group>
  );
}

export function MeetingTable({
  position,
  radius = 1.1,
  color = "#6366f1",
  environmentStyle = "C",
}: {
  position: [number, number, number];
  radius?: number;
  color?: string;
  environmentStyle?: EnvironmentStyle;
}) {
  const theme = ENVIRONMENT_THEMES[environmentStyle];

  return (
    <group position={position}>
      <mesh position={[0, DESK_HEIGHT, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, 0.05, 32]} />
        <meshStandardMaterial
          color={theme.deskWood}
          roughness={0.4}
          metalness={environmentStyle === "B" ? 0.35 : 0.08}
        />
      </mesh>
      <mesh position={[0, DESK_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.08, 0.12, DESK_HEIGHT, 8]} />
        <meshStandardMaterial color={theme.deskMetal} roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh position={[0, DESK_HEIGHT + 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.08, radius - 0.02, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.55}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, DESK_HEIGHT + 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.7}
        />
      </mesh>
      <pointLight position={[0, 0.8, 0]} intensity={0.3} color={color} distance={3} decay={2} />
    </group>
  );
}

export function Plant({
  position,
  environmentStyle = "C",
}: {
  position: [number, number, number];
  environmentStyle?: EnvironmentStyle;
}) {
  const theme = ENVIRONMENT_THEMES[environmentStyle];

  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 0.3, 8]} />
        <meshStandardMaterial color={theme.plantPot} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.2, 8, 6]} />
        <meshStandardMaterial color={theme.plantLeaf} roughness={0.85} />
      </mesh>
      <mesh position={[0.08, 0.62, 0.05]} castShadow>
        <sphereGeometry args={[0.12, 6, 5]} />
        <meshStandardMaterial color={theme.plantLeaf} roughness={0.85} />
      </mesh>
      <mesh position={[-0.06, 0.58, -0.04]} castShadow>
        <sphereGeometry args={[0.1, 6, 5]} />
        <meshStandardMaterial color={theme.plantLeaf} roughness={0.85} />
      </mesh>
    </group>
  );
}
