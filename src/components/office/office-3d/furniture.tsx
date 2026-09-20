import * as THREE from "three";

const DESK_HEIGHT = 0.42;

export function Workstation({
  position,
  rotation = 0,
  screenColor = "#90c0f0",
}: {
  position: [number, number, number];
  rotation?: number;
  screenColor?: string;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* L-shaped desk — recommended style */}
      <mesh position={[-0.15, DESK_HEIGHT, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.04, 0.55]} />
        <meshStandardMaterial color="#c4a882" roughness={0.65} metalness={0.02} />
      </mesh>
      <mesh position={[0.35, DESK_HEIGHT, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.04, 0.35]} />
        <meshStandardMaterial color="#c4a882" roughness={0.65} metalness={0.02} />
      </mesh>
      {[
        [-0.55, 0.2, -0.22],
        [0.25, 0.2, -0.22],
        [-0.55, 0.2, 0.22],
        [0.55, 0.2, 0.22],
      ].map((pos, i) => (
        <mesh key={`leg-${i}`} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[0.04, 0.4, 0.04]} />
          <meshStandardMaterial color="#8898a8" roughness={0.5} metalness={0.35} />
        </mesh>
      ))}

      {/* Dual monitors */}
      {[-0.2, 0.1].map((x, i) => (
        <group key={`monitor-${i}`} position={[x, DESK_HEIGHT + 0.02, -0.15]}>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 0.08, 8]} />
            <meshStandardMaterial color="#6b7a8a" roughness={0.4} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.02, 0.16, 0.02]} />
            <meshStandardMaterial color="#7a8a9a" roughness={0.4} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.32, 0]} castShadow>
            <boxGeometry args={[0.38, 0.24, 0.02]} />
            <meshStandardMaterial color="#3a4550" roughness={0.3} metalness={0.15} />
          </mesh>
          <mesh position={[0, 0.32, 0.015]}>
            <planeGeometry args={[0.32, 0.18]} />
            <meshStandardMaterial
              color="#d0e8ff"
              emissive={screenColor}
              emissiveIntensity={0.45}
              transparent
              opacity={0.92}
            />
          </mesh>
        </group>
      ))}

      <mesh position={[0, DESK_HEIGHT + 0.025, 0.08]}>
        <boxGeometry args={[0.28, 0.01, 0.1]} />
        <meshStandardMaterial color="#aab0b8" roughness={0.6} metalness={0.15} />
      </mesh>
    </group>
  );
}

export function OfficeChair({
  position,
  rotation = 0,
  color = "#4a5568",
}: {
  position: [number, number, number];
  rotation?: number;
  color?: string;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.04, 5]} />
        <meshStandardMaterial color="#7a8a9a" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.22, 8]} />
        <meshStandardMaterial color="#8898a8" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.28, 0.04, 0.28]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.5, -0.12]} castShadow>
        <boxGeometry args={[0.26, 0.36, 0.03]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0.15, 0.38, 0]}>
        <boxGeometry args={[0.03, 0.04, 0.2]} />
        <meshStandardMaterial color="#7a8a9a" roughness={0.5} metalness={0.35} />
      </mesh>
      <mesh position={[-0.15, 0.38, 0]}>
        <boxGeometry args={[0.03, 0.04, 0.2]} />
        <meshStandardMaterial color="#7a8a9a" roughness={0.5} metalness={0.35} />
      </mesh>
    </group>
  );
}

export function MeetingTable({
  position,
  radius = 1.1,
  color = "#5ba0d0",
}: {
  position: [number, number, number];
  radius?: number;
  color?: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, DESK_HEIGHT, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, 0.05, 6]} />
        <meshStandardMaterial color="#8aa8c8" roughness={0.45} metalness={0.08} />
      </mesh>
      <mesh position={[0, DESK_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.08, 0.12, DESK_HEIGHT, 8]} />
        <meshStandardMaterial color="#7a8a9a" roughness={0.4} metalness={0.45} />
      </mesh>
      <mesh position={[0, DESK_HEIGHT + 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.08, radius - 0.02, 6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, DESK_HEIGHT + 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
}

export function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.3, 8]} />
        <meshStandardMaterial color="#9a8a7a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.2, 8, 6]} />
        <meshStandardMaterial color="#4a8a4a" roughness={0.85} />
      </mesh>
      <mesh position={[0.08, 0.62, 0.05]}>
        <sphereGeometry args={[0.12, 6, 5]} />
        <meshStandardMaterial color="#3d7a3d" roughness={0.85} />
      </mesh>
    </group>
  );
}
