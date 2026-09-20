import { SCENE_CENTER, WORLD_DEPTH, WORLD_WIDTH } from "@/lib/office/coordinates";

const WALL_HEIGHT = 2.6;

function Wall({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#c8d0dc" roughness={0.75} metalness={0.02} />
    </mesh>
  );
}

export function Environment3D() {
  const cx = SCENE_CENTER[0];
  const cz = SCENE_CENTER[2];

  return (
    <group>
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[12, 18, 10]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <hemisphereLight args={["#e8f0ff", "#2a3040", 0.35]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.08, cz]} receiveShadow>
        <planeGeometry args={[WORLD_WIDTH + 4, WORLD_DEPTH + 4]} />
        <meshStandardMaterial color="#bcc4d0" roughness={0.95} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.01, cz]} receiveShadow>
        <planeGeometry args={[WORLD_WIDTH, WORLD_DEPTH]} />
        <meshStandardMaterial color="#d4dbe6" roughness={0.7} metalness={0.02} />
      </mesh>

      <gridHelper
        args={[WORLD_WIDTH, 18, "#c0c8d4", "#cad2dc"]}
        position={[cx, 0.02, cz]}
      />

      <Wall position={[cx, WALL_HEIGHT / 2, 0]} size={[WORLD_WIDTH, WALL_HEIGHT, 0.12]} />
      <Wall position={[0, WALL_HEIGHT / 2, cz]} size={[0.12, WALL_HEIGHT, WORLD_DEPTH]} />
      <Wall position={[WORLD_WIDTH, WALL_HEIGHT / 2, cz]} size={[0.12, WALL_HEIGHT, WORLD_DEPTH]} />

      <Wall position={[cx, WALL_HEIGHT * 0.35, cz * 0.55]} size={[0.08, WALL_HEIGHT * 0.7, WORLD_DEPTH * 0.45]} />
      <Wall position={[cx * 0.55, WALL_HEIGHT * 0.35, cz]} size={[WORLD_WIDTH * 0.45, WALL_HEIGHT * 0.7, 0.08]} />
    </group>
  );
}
