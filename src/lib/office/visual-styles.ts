export type EnvironmentStyle = "A" | "B" | "C";
export type AvatarStyle = "A" | "B" | "D";

export const DEFAULT_ENVIRONMENT_STYLE: EnvironmentStyle = "C";
export const DEFAULT_AVATAR_STYLE: AvatarStyle = "B";

export const ENVIRONMENT_STYLE_LABELS: Record<EnvironmentStyle, string> = {
  A: "Corporate",
  B: "Cyberpunk",
  C: "Warm Startup",
};

export const AVATAR_STYLE_LABELS: Record<AvatarStyle, string> = {
  A: "Capsule",
  B: "Low-Poly",
  D: "Realistic",
};

export const AVATAR_STYLE_OPTIONS: AvatarStyle[] = ["A", "B", "D"];

export interface EnvironmentTheme {
  background: string;
  floor: string;
  platform: string;
  wall: string;
  wallCap: string;
  wallHeight: number;
  gridPrimary: string;
  gridSecondary: string;
  ambientIntensity: number;
  directionalIntensity: number;
  directionalColor: string;
  hemisphereSky: string;
  hemisphereGround: string;
  bloomIntensity: number;
  bloomThreshold: number;
  zoneOpacity: number;
  zoneEmissive: number;
  zoneBorderOpacity: number;
  zoneBorderWidth: number;
  showWalls: boolean;
  showWarmLights: boolean;
  showGrid: boolean;
  showNeonGrid: boolean;
  showPendantLamps: boolean;
  showDaylightFill: boolean;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  floorMetalness: number;
  floorRoughness: number;
  deskTop: string;
  deskLeg: string;
  deskEmissive: string;
  deskEmissiveIntensity: number;
  chairColor: string;
  chairEmissive: string;
  chairEmissiveIntensity: number;
  monitorFrame: string;
  screenEmissiveIntensity: number;
  plantPot: string;
  plantLeaf: string;
  plantScale: number;
  plantsPerZone: number;
  hubTableColor: string;
  exposure: number;
  labelBg: string;
  labelUseGlow: boolean;
}

export const ENVIRONMENT_THEMES: Record<EnvironmentStyle, EnvironmentTheme> = {
  A: {
    background: "#e4eaf2",
    floor: "#eef1f6",
    platform: "#d8dee8",
    wall: "#f7f8fb",
    wallCap: "#c5cdd8",
    wallHeight: 0.9,
    gridPrimary: "#dde3ec",
    gridSecondary: "#e8ecf2",
    ambientIntensity: 0.85,
    directionalIntensity: 1.5,
    directionalColor: "#fffaf5",
    hemisphereSky: "#ffffff",
    hemisphereGround: "#d0dae8",
    bloomIntensity: 0.2,
    bloomThreshold: 0.75,
    zoneOpacity: 0.22,
    zoneEmissive: 0.12,
    zoneBorderOpacity: 0.35,
    zoneBorderWidth: 1.2,
    showWalls: true,
    showWarmLights: false,
    showGrid: true,
    showNeonGrid: false,
    showPendantLamps: false,
    showDaylightFill: true,
    fogColor: "#e4eaf2",
    fogNear: 18,
    fogFar: 45,
    floorMetalness: 0.02,
    floorRoughness: 0.82,
    deskTop: "#f5f6f8",
    deskLeg: "#c8d0dc",
    deskEmissive: "#000000",
    deskEmissiveIntensity: 0,
    chairColor: "#2d3436",
    chairEmissive: "#000000",
    chairEmissiveIntensity: 0,
    monitorFrame: "#3a4550",
    screenEmissiveIntensity: 0.35,
    plantPot: "#f0f0f0",
    plantLeaf: "#5a9a5a",
    plantScale: 0.9,
    plantsPerZone: 1,
    hubTableColor: "#94a3b8",
    exposure: 1.2,
    labelBg: "rgba(255,255,255,0.85)",
    labelUseGlow: false,
  },
  B: {
    background: "#04060e",
    floor: "#080c18",
    platform: "#030508",
    wall: "#0c1424",
    wallCap: "#06b6d4",
    wallHeight: 1.4,
    gridPrimary: "#06b6d4",
    gridSecondary: "#1e1b4b",
    ambientIntensity: 0.15,
    directionalIntensity: 0.2,
    directionalColor: "#6366f1",
    hemisphereSky: "#1e1b4b",
    hemisphereGround: "#04060e",
    bloomIntensity: 1.6,
    bloomThreshold: 0.35,
    zoneOpacity: 0.04,
    zoneEmissive: 1.0,
    zoneBorderOpacity: 1.0,
    zoneBorderWidth: 2.8,
    showWalls: true,
    showWarmLights: false,
    showGrid: false,
    showNeonGrid: true,
    showPendantLamps: false,
    showDaylightFill: false,
    fogColor: "#04060e",
    fogNear: 8,
    fogFar: 32,
    floorMetalness: 0.55,
    floorRoughness: 0.15,
    deskTop: "#12182a",
    deskLeg: "#1a2540",
    deskEmissive: "#06b6d4",
    deskEmissiveIntensity: 0.35,
    chairColor: "#141c2e",
    chairEmissive: "#ec4899",
    chairEmissiveIntensity: 0.25,
    monitorFrame: "#1a2540",
    screenEmissiveIntensity: 1.1,
    plantPot: "#0f1520",
    plantLeaf: "#0d4a3a",
    plantScale: 0.85,
    plantsPerZone: 1,
    hubTableColor: "#6366f1",
    exposure: 1.0,
    labelBg: "rgba(0,0,0,0.7)",
    labelUseGlow: true,
  },
  C: {
    background: "#1a1410",
    floor: "#b8956c",
    platform: "#2a2118",
    wall: "#8b7355",
    wallCap: "#6b5344",
    wallHeight: 0.85,
    gridPrimary: "#a08060",
    gridSecondary: "#8b6f50",
    ambientIntensity: 0.5,
    directionalIntensity: 0.7,
    directionalColor: "#ffd599",
    hemisphereSky: "#ffd599",
    hemisphereGround: "#3d2e1f",
    bloomIntensity: 0.55,
    bloomThreshold: 0.6,
    zoneOpacity: 0.28,
    zoneEmissive: 0.15,
    zoneBorderOpacity: 0.5,
    zoneBorderWidth: 1.4,
    showWalls: true,
    showWarmLights: true,
    showGrid: false,
    showNeonGrid: false,
    showPendantLamps: true,
    showDaylightFill: false,
    fogColor: "#1a1410",
    fogNear: 12,
    fogFar: 38,
    floorMetalness: 0.02,
    floorRoughness: 0.78,
    deskTop: "#a67c52",
    deskLeg: "#5c4033",
    deskEmissive: "#000000",
    deskEmissiveIntensity: 0,
    chairColor: "#3d3428",
    chairEmissive: "#000000",
    chairEmissiveIntensity: 0,
    monitorFrame: "#4a3f35",
    screenEmissiveIntensity: 0.5,
    plantPot: "#9a7b5b",
    plantLeaf: "#4a8a4a",
    plantScale: 1.15,
    plantsPerZone: 2,
    hubTableColor: "#a67c52",
    exposure: 1.05,
    labelBg: "rgba(42,33,24,0.8)",
    labelUseGlow: false,
  },
};
