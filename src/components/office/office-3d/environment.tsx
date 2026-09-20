"use client";

import { ContactShadows } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import type { EnvironmentStyle } from "@/lib/office/visual-styles";
import { ENVIRONMENT_THEMES } from "@/lib/office/visual-styles";
import { SCENE_CENTER, WORLD_DEPTH, WORLD_WIDTH } from "@/lib/office/coordinates";

function createFloorTexture(style: EnvironmentStyle): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  if (style === "A") {
    const tile = size / 8;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const light = (row + col) % 2 === 0;
        ctx.fillStyle = light ? "#f4f6fa" : "#e8ecf4";
        ctx.fillRect(col * tile, row * tile, tile, tile);
        ctx.strokeStyle = "#d5dce8";
        ctx.lineWidth = 2;
        ctx.strokeRect(col * tile + 1, row * tile + 1, tile - 2, tile - 2);
      }
    }
  } else if (style === "B") {
    const tile = size / 10;
    ctx.fillStyle = "#060a14";
    ctx.fillRect(0, 0, size, size);
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        ctx.strokeStyle = (row + col) % 2 === 0 ? "#0e7490" : "#1e1b4b";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(col * tile + 2, row * tile + 2, tile - 4, tile - 4);
        if ((row + col) % 3 === 0) {
          ctx.fillStyle = "rgba(6,182,212,0.08)";
          ctx.fillRect(col * tile + 4, row * tile + 4, tile - 8, tile - 8);
        }
      }
    }
  } else {
    const plankH = size / 12;
    for (let i = 0; i < 12; i++) {
      const shade = i % 2 === 0 ? "#b8956c" : "#a88458";
      ctx.fillStyle = shade;
      ctx.fillRect(0, i * plankH, size, plankH);
      ctx.strokeStyle = "#8b6f4a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, i * plankH);
      ctx.lineTo(size, i * plankH);
      ctx.stroke();
      const knotX = ((i * 97) % 7) * (size / 8) + 40;
      ctx.fillStyle = "rgba(90,60,35,0.15)";
      ctx.beginPath();
      ctx.ellipse(knotX, i * plankH + plankH / 2, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 5);
  texture.anisotropy = 8;
  return texture;
}

function TiledFloor({
  cx,
  cz,
  width,
  depth,
  style,
  theme,
}: {
  cx: number;
  cz: number;
  width: number;
  depth: number;
  style: EnvironmentStyle;
  theme: (typeof ENVIRONMENT_THEMES)[EnvironmentStyle];
}) {
  const texture = useMemo(() => createFloorTexture(style), [style]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.012, cz]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial
        map={texture}
        color={theme.floor}
        roughness={theme.floorRoughness}
        metalness={theme.floorMetalness}
        emissive={style === "B" ? "#0a1020" : "#000000"}
        emissiveIntensity={style === "B" ? 0.12 : 0}
      />
    </mesh>
  );
}

function FloorSkirting({
  cx,
  cz,
  width,
  depth,
  color,
  capColor,
}: {
  cx: number;
  cz: number;
  width: number;
  depth: number;
  color: string;
  capColor: string;
}) {
  const h = 0.08;
  const hw = width / 2;
  const hd = depth / 2;
  const segments: Array<{ pos: [number, number, number]; size: [number, number, number] }> = [
    { pos: [cx, h / 2, cz - hd], size: [width + 0.12, h, 0.06] },
    { pos: [cx, h / 2, cz + hd], size: [width + 0.12, h, 0.06] },
    { pos: [cx - hw, h / 2, cz], size: [0.06, h, depth + 0.12] },
    { pos: [cx + hw, h / 2, cz], size: [0.06, h, depth + 0.12] },
  ];

  return (
    <group>
      {segments.map((seg, i) => (
        <mesh key={i} position={seg.pos} castShadow receiveShadow>
          <boxGeometry args={seg.size} />
          <meshStandardMaterial color={color} roughness={0.55} metalness={0.08} />
        </mesh>
      ))}
      {segments.map((seg, i) => (
        <mesh key={`cap-${i}`} position={[seg.pos[0], seg.pos[1] + h / 2 + 0.015, seg.pos[2]]}>
          <boxGeometry args={[seg.size[0], 0.03, seg.size[2]]} />
          <meshStandardMaterial color={capColor} roughness={0.35} metalness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function WindowPanel({
  position,
  rotationY,
  width,
  height,
  style,
  theme,
}: {
  position: [number, number, number];
  rotationY: number;
  width: number;
  height: number;
  style: EnvironmentStyle;
  theme: (typeof ENVIRONMENT_THEMES)[EnvironmentStyle];
}) {
  const frameW = 0.06;
  const glassColor = style === "B" ? "#1a3050" : style === "A" ? "#c8ddf5" : "#8ab4d4";
  const glassOpacity = style === "B" ? 0.35 : style === "A" ? 0.45 : 0.3;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[width, height, frameW]} />
        <meshStandardMaterial color={theme.wallCap} roughness={0.45} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0, frameW * 0.15]}>
        <boxGeometry args={[width - 0.14, height - 0.14, 0.02]} />
        <meshStandardMaterial
          color={glassColor}
          transparent
          opacity={glassOpacity}
          roughness={0.05}
          metalness={0.6}
          emissive={style === "B" ? "#06b6d4" : "#a8c8e8"}
          emissiveIntensity={style === "B" ? 0.15 : 0.04}
        />
      </mesh>
      <mesh position={[0, height / 2 - 0.04, frameW * 0.2]}>
        <boxGeometry args={[width - 0.1, 0.03, 0.02]} />
        <meshStandardMaterial color={theme.wallCap} roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, frameW * 0.2]}>
        <boxGeometry args={[0.03, height - 0.1, 0.02]} />
        <meshStandardMaterial color={theme.wallCap} roughness={0.4} metalness={0.3} />
      </mesh>
    </group>
  );
}

function PerimeterWalls({
  cx,
  cz,
  width,
  depth,
  style,
  theme,
}: {
  cx: number;
  cz: number;
  width: number;
  depth: number;
  style: EnvironmentStyle;
  theme: (typeof ENVIRONMENT_THEMES)[EnvironmentStyle];
}) {
  const wh = theme.wallHeight;
  const wallOpacity = style === "B" ? 0.55 : 1;
  const capEmissive = style === "B" ? 0.6 : style === "A" ? 0.05 : 0.1;
  const hw = width / 2;
  const hd = depth / 2;
  const wallThick = 0.12;

  const walls: Array<{
    pos: [number, number, number];
    size: [number, number, number];
    rot: number;
    winCount: number;
    winW: number;
  }> = [
    { pos: [cx, wh / 2, cz - hd], size: [width, wh, wallThick], rot: 0, winCount: 4, winW: 2.8 },
    { pos: [cx, wh / 2, cz + hd], size: [width, wh, wallThick], rot: Math.PI, winCount: 4, winW: 2.8 },
    { pos: [cx - hw, wh / 2, cz], size: [wallThick, wh, depth], rot: Math.PI / 2, winCount: 3, winW: 2.6 },
    { pos: [cx + hw, wh / 2, cz], size: [wallThick, wh, depth], rot: -Math.PI / 2, winCount: 3, winW: 2.6 },
  ];

  return (
    <group>
      {walls.map((wall, wi) => {
        const isLong = wall.size[0] > wall.size[2];
        const span = isLong ? wall.size[0] : wall.size[2];
        const gap = span / (wall.winCount + 1);

        return (
          <group key={wi}>
            <mesh position={wall.pos} castShadow receiveShadow>
              <boxGeometry args={wall.size} />
              <meshStandardMaterial
                color={theme.wall}
                roughness={0.75}
                metalness={0.04}
                transparent
                opacity={wallOpacity}
              />
            </mesh>
            <mesh
              position={[wall.pos[0], wh + 0.03, wall.pos[2]]}
              castShadow
            >
              <boxGeometry args={[wall.size[0] + 0.04, 0.06, wall.size[2] + 0.04]} />
              <meshStandardMaterial
                color={theme.wallCap}
                roughness={0.35}
                metalness={0.35}
                emissive={theme.wallCap}
                emissiveIntensity={capEmissive}
              />
            </mesh>

            {Array.from({ length: wall.winCount }, (_, i) => {
              const t = (i + 1) * gap - span / 2;
              const winH = wh * 0.55;
              const winPos: [number, number, number] = isLong
                ? [wall.pos[0] + t, wh * 0.52, wall.pos[2]]
                : [wall.pos[0], wh * 0.52, wall.pos[2] + t];

              return (
                <WindowPanel
                  key={`${wi}-win-${i}`}
                  position={winPos}
                  rotationY={wall.rot}
                  width={wall.winW}
                  height={winH}
                  style={style}
                  theme={theme}
                />
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

function ExteriorTree({
  position,
  style,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
  style: EnvironmentStyle;
}) {
  const trunk = style === "B" ? "#1a2030" : "#5c4a3a";
  const leaf = style === "B" ? "#0d4a3a" : style === "A" ? "#5a9a6a" : "#4a8a4a";
  const pot = style === "B" ? "#0f1520" : "#8b7355";

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {style !== "B" && (
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.18, 0.22, 0.24, 8]} />
          <meshStandardMaterial color={pot} roughness={0.85} />
        </mesh>
      )}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 0.7, 6]} />
        <meshStandardMaterial color={trunk} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <coneGeometry args={[0.45, 0.9, 7]} />
        <meshStandardMaterial color={leaf} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <coneGeometry args={[0.32, 0.65, 7]} />
        <meshStandardMaterial color={leaf} roughness={0.85} />
      </mesh>
      {style === "B" && (
        <pointLight position={[0, 1.2, 0]} intensity={0.15} color="#06b6d4" distance={3} decay={2} />
      )}
    </group>
  );
}

function ExteriorLandscape({
  cx,
  cz,
  width,
  depth,
  style,
  theme,
}: {
  cx: number;
  cz: number;
  width: number;
  depth: number;
  style: EnvironmentStyle;
  theme: (typeof ENVIRONMENT_THEMES)[EnvironmentStyle];
}) {
  const pad = 10;
  const groundColor = style === "B" ? "#030508" : style === "A" ? "#c8d4c0" : "#3d5c3a";
  const pathColor = style === "B" ? "#0a1020" : style === "A" ? "#b8c4b0" : "#5a4a38";

  const treePositions: Array<[number, number, number]> = [
    [cx - width / 2 - 3.5, 0, cz - depth / 2 - 2],
    [cx + width / 2 + 3.5, 0, cz - depth / 2 - 2.5],
    [cx - width / 2 - 4, 0, cz + depth / 2 + 2],
    [cx + width / 2 + 4, 0, cz + depth / 2 + 2.5],
    [cx - width / 2 - 2, 0, cz + depth / 2 + 4],
    [cx + width / 2 + 2, 0, cz - depth / 2 - 4],
    [cx, 0, cz - depth / 2 - 5],
    [cx, 0, cz + depth / 2 + 5],
  ];

  const bushColor = style === "B" ? "#0a3028" : "#4a7a4a";

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.12, cz]} receiveShadow>
        <planeGeometry args={[width + pad * 2, depth + pad * 2]} />
        <meshStandardMaterial color={groundColor} roughness={0.95} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.1, cz - depth / 2 - 2.8]}>
        <planeGeometry args={[width * 0.6, 2.5]} />
        <meshStandardMaterial color={pathColor} roughness={0.88} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.09, cz]} receiveShadow>
        <ringGeometry args={[Math.max(width, depth) / 2 + 0.3, Math.max(width, depth) / 2 + 1.2, 48]} />
        <meshStandardMaterial
          color={theme.platform}
          roughness={0.9}
          transparent
          opacity={0.85}
        />
      </mesh>

      {treePositions.map((pos, i) => (
        <ExteriorTree
          key={`tree-${i}`}
          position={pos}
          style={style}
          scale={0.85 + (i % 3) * 0.15}
        />
      ))}

      {[
        [cx - width / 2 - 1.2, cz - depth / 2 - 0.8],
        [cx + width / 2 + 1.2, cz - depth / 2 - 0.8],
        [cx - width / 2 - 1.2, cz + depth / 2 + 0.8],
        [cx + width / 2 + 1.2, cz + depth / 2 + 0.8],
      ].map(([x, z], i) => (
        <mesh key={`bush-${i}`} position={[x, 0.2, z]} castShadow>
          <sphereGeometry args={[0.35, 8, 6]} />
          <meshStandardMaterial color={bushColor} roughness={0.9} />
        </mesh>
      ))}

      {style === "A" && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.08, cz]}>
          <ringGeometry args={[Math.max(width, depth) / 2 + 1.5, Math.max(width, depth) / 2 + 3, 64]} />
          <meshStandardMaterial color="#d0dae8" roughness={0.95} transparent opacity={0.5} />
        </mesh>
      )}
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
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
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

      <ExteriorLandscape
        cx={cx}
        cz={cz}
        width={WORLD_WIDTH}
        depth={WORLD_DEPTH}
        style={style}
        theme={theme}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.005, cz]} receiveShadow>
        <planeGeometry args={[WORLD_WIDTH + 0.4, WORLD_DEPTH + 0.4]} />
        <meshStandardMaterial color={theme.platform} roughness={0.92} />
      </mesh>

      <TiledFloor
        cx={cx}
        cz={cz}
        width={WORLD_WIDTH}
        depth={WORLD_DEPTH}
        style={style}
        theme={theme}
      />

      {theme.showGrid && (
        <gridHelper
          args={[WORLD_WIDTH, 24, theme.gridPrimary, theme.gridSecondary]}
          position={[cx, 0.022, cz]}
        />
      )}

      {theme.showNeonGrid && (
        <gridHelper
          args={[WORLD_WIDTH, 20, theme.gridPrimary, theme.gridSecondary]}
          position={[cx, 0.025, cz]}
        />
      )}

      <FloorSkirting
        cx={cx}
        cz={cz}
        width={WORLD_WIDTH}
        depth={WORLD_DEPTH}
        color={theme.wallCap}
        capColor={theme.wall}
      />

      {theme.showWalls && (
        <PerimeterWalls
          cx={cx}
          cz={cz}
          width={WORLD_WIDTH}
          depth={WORLD_DEPTH}
          style={style}
          theme={theme}
        />
      )}

      <ContactShadows
        position={[cx, 0.015, cz]}
        opacity={style === "A" ? 0.3 : style === "B" ? 0.6 : 0.45}
        scale={26}
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
