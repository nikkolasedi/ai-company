"use client";

import type { EnvironmentStyle } from "@/lib/office/visual-styles";
import { ENVIRONMENT_THEMES } from "@/lib/office/visual-styles";
import { SCENE_CENTER, WORLD_DEPTH, WORLD_WIDTH } from "@/lib/office/coordinates";

const WALL_HEIGHT = 2.6;

function Wall({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.75} metalness={0.02} />
    </mesh>
  );
}

export function Environment3D({ style }: { style: EnvironmentStyle }) {
  const theme = ENVIRONMENT_THEMES[style];
  const cx = SCENE_CENTER[0];
  const cz = SCENE_CENTER[2];

  return (
    <group>
      <ambientLight intensity={theme.ambientIntensity} />
      <directionalLight
        position={[12, 18, 10]}
        intensity={theme.directionalIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <hemisphereLight
        args={[theme.hemisphereSky, theme.hemisphereGround, 0.35]}
      />

      {theme.showWarmLights && (
        <>
          <pointLight position={[4, 2.5, 4]} intensity={0.5} color="#ffd599" distance={8} decay={2} />
          <pointLight position={[14, 2.5, 10]} intensity={0.4} color="#ffb86c" distance={8} decay={2} />
        </>
      )}

      {style === "B" && (
        <>
          <pointLight position={[cx, 1.5, cz]} intensity={0.6} color="#6366f1" distance={12} decay={2} />
          <pointLight position={[4, 1.2, 4]} intensity={0.4} color="#06b6d4" distance={6} decay={2} />
          <pointLight position={[14, 1.2, 10]} intensity={0.4} color="#ec4899" distance={6} decay={2} />
        </>
      )}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.08, cz]} receiveShadow>
        <planeGeometry args={[WORLD_WIDTH + 4, WORLD_DEPTH + 4]} />
        <meshStandardMaterial color={theme.platform} roughness={0.95} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.01, cz]} receiveShadow>
        <planeGeometry args={[WORLD_WIDTH, WORLD_DEPTH]} />
        <meshStandardMaterial color={theme.floor} roughness={0.7} metalness={style === "B" ? 0.15 : 0.02} />
      </mesh>

      <gridHelper
        args={[WORLD_WIDTH, 18, theme.gridPrimary, theme.gridSecondary]}
        position={[cx, 0.02, cz]}
      />

      {theme.showWalls && (
        <>
          <Wall position={[cx, WALL_HEIGHT / 2, 0]} size={[WORLD_WIDTH, WALL_HEIGHT, 0.12]} color={theme.wall} />
          <Wall position={[0, WALL_HEIGHT / 2, cz]} size={[0.12, WALL_HEIGHT, WORLD_DEPTH]} color={theme.wall} />
          <Wall position={[WORLD_WIDTH, WALL_HEIGHT / 2, cz]} size={[0.12, WALL_HEIGHT, WORLD_DEPTH]} color={theme.wall} />
          <Wall position={[cx, WALL_HEIGHT * 0.35, cz * 0.55]} size={[0.08, WALL_HEIGHT * 0.7, WORLD_DEPTH * 0.45]} color={theme.wall} />
          <Wall position={[cx * 0.55, WALL_HEIGHT * 0.35, cz]} size={[WORLD_WIDTH * 0.45, WALL_HEIGHT * 0.7, 0.08]} color={theme.wall} />
        </>
      )}
    </group>
  );
}

export function getEnvironmentBackground(style: EnvironmentStyle) {
  return ENVIRONMENT_THEMES[style].background;
}

export function getEnvironmentBloom(style: EnvironmentStyle) {
  return ENVIRONMENT_THEMES[style].bloomIntensity;
}
