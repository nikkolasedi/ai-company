"use client";

import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { EnvironmentStyle } from "@/lib/office/visual-styles";
import { ENVIRONMENT_THEMES } from "@/lib/office/visual-styles";
import { SCENE_CENTER, WORLD_DEPTH, WORLD_WIDTH } from "@/lib/office/coordinates";

function PartitionWall({
  position,
  size,
  color,
  capColor,
  opacity = 1,
  capEmissive = 0.15,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  capColor: string;
  opacity?: number;
  capEmissive?: number;
}) {
  const [w, h, d] = size;
  const capHeight = 0.06;
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.02} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, h / 2 + capHeight / 2, 0]} castShadow>
        <boxGeometry args={[w, capHeight, d]} />
        <meshStandardMaterial
          color={capColor}
          roughness={0.35}
          metalness={0.35}
          emissive={capColor}
          emissiveIntensity={capEmissive}
        />
      </mesh>
    </group>
  );
}

function PendantLamp({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.6, 6]} />
        <meshStandardMaterial color="#4a3f35" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.45, 0]}>
        <coneGeometry args={[0.18, 0.22, 8, 1, true]} />
        <meshStandardMaterial color="#d4a574" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 1.3, 0]} intensity={0.55} color={color} distance={5} decay={2} />
    </group>
  );
}

export function Environment3D({ style }: { style: EnvironmentStyle }) {
  const theme = ENVIRONMENT_THEMES[style];
  const cx = SCENE_CENTER[0];
  const cz = SCENE_CENTER[2];
  const wh = theme.wallHeight;
  const wallOpacity = style === "B" ? 0.55 : 1;
  const capEmissive = style === "B" ? 0.6 : style === "A" ? 0.05 : 0.1;

  return (
    <group>
      <fog attach="fog" args={[theme.fogColor, theme.fogNear, theme.fogFar]} />

      <ambientLight intensity={theme.ambientIntensity} />
      <directionalLight
        position={style === "A" ? [10, 20, 8] : [12, 18, 10]}
        intensity={theme.directionalIntensity}
        color={theme.directionalColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <hemisphereLight args={[theme.hemisphereSky, theme.hemisphereGround, 0.45]} />

      {theme.showDaylightFill && (
        <directionalLight position={[-6, 14, 4]} intensity={0.55} color="#e8f0ff" />
      )}

      {theme.showWarmLights && (
        <>
          <pointLight position={[cx, 2.8, cz]} intensity={0.7} color="#ffd599" distance={12} decay={2} />
          <pointLight position={[4, 2.2, 4]} intensity={0.45} color="#ffb86c" distance={8} decay={2} />
          <pointLight position={[14, 2.2, 10]} intensity={0.4} color="#ff9f5a" distance={8} decay={2} />
        </>
      )}

      {style === "B" && (
        <>
          <pointLight position={[cx, 0.5, cz]} intensity={0.5} color="#6366f1" distance={14} decay={2} />
          <pointLight position={[3, 0.8, 3]} intensity={0.45} color="#06b6d4" distance={7} decay={2} />
          <pointLight position={[15, 0.8, 11]} intensity={0.45} color="#ec4899" distance={7} decay={2} />
          <pointLight position={[3, 0.8, 11]} intensity={0.35} color="#8b5cf6" distance={6} decay={2} />
        </>
      )}

      {theme.showPendantLamps && (
        <>
          <PendantLamp position={[cx - 1.2, 0, cz]} color="#ffd599" />
          <PendantLamp position={[cx + 1.2, 0, cz]} color="#ffb86c" />
        </>
      )}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.08, cz]} receiveShadow>
        <planeGeometry args={[WORLD_WIDTH + 4, WORLD_DEPTH + 4]} />
        <meshStandardMaterial color={theme.platform} roughness={0.95} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.01, cz]} receiveShadow>
        <planeGeometry args={[WORLD_WIDTH, WORLD_DEPTH]} />
        <meshStandardMaterial
          color={theme.floor}
          roughness={theme.floorRoughness}
          metalness={theme.floorMetalness}
          emissive={style === "B" ? "#0a1020" : "#000000"}
          emissiveIntensity={style === "B" ? 0.15 : 0}
        />
      </mesh>

      {theme.showGrid && (
        <gridHelper
          args={[WORLD_WIDTH, 24, theme.gridPrimary, theme.gridSecondary]}
          position={[cx, 0.02, cz]}
        />
      )}

      {theme.showNeonGrid && (
        <gridHelper
          args={[WORLD_WIDTH, 20, theme.gridPrimary, theme.gridSecondary]}
          position={[cx, 0.025, cz]}
        />
      )}

      {theme.showWalls && (
        <>
          <PartitionWall
            position={[cx, wh / 2, 0]}
            size={[WORLD_WIDTH, wh, 0.1]}
            color={theme.wall}
            capColor={theme.wallCap}
            opacity={wallOpacity}
            capEmissive={capEmissive}
          />
          <PartitionWall
            position={[0, wh / 2, cz]}
            size={[0.1, wh, WORLD_DEPTH]}
            color={theme.wall}
            capColor={theme.wallCap}
            opacity={wallOpacity}
            capEmissive={capEmissive}
          />
          <PartitionWall
            position={[WORLD_WIDTH, wh / 2, cz]}
            size={[0.1, wh, WORLD_DEPTH]}
            color={theme.wall}
            capColor={theme.wallCap}
            opacity={wallOpacity}
            capEmissive={capEmissive}
          />
        </>
      )}

      <ContactShadows
        position={[cx, 0.015, cz]}
        opacity={style === "A" ? 0.3 : style === "B" ? 0.6 : 0.45}
        scale={22}
        blur={2.5}
        far={4}
        color={style === "B" ? "#06b6d4" : "#000000"}
      />
    </group>
  );
}

export function getEnvironmentBackground(style: EnvironmentStyle) {
  return ENVIRONMENT_THEMES[style].background;
}

export function getEnvironmentBloom(style: EnvironmentStyle) {
  return ENVIRONMENT_THEMES[style].bloomIntensity;
}

export function getEnvironmentBloomThreshold(style: EnvironmentStyle) {
  return ENVIRONMENT_THEMES[style].bloomThreshold;
}

export function getEnvironmentExposure(style: EnvironmentStyle) {
  return ENVIRONMENT_THEMES[style].exposure;
}
