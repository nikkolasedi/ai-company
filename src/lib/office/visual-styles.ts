export type EnvironmentStyle = "A" | "B" | "C";
export type AvatarStyle = "A" | "B" | "C";

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
  C: "Voxel",
};

export interface EnvironmentTheme {
  background: string;
  floor: string;
  platform: string;
  wall: string;
  gridPrimary: string;
  gridSecondary: string;
  ambientIntensity: number;
  directionalIntensity: number;
  hemisphereSky: string;
  hemisphereGround: string;
  bloomIntensity: number;
  zoneOpacity: number;
  zoneEmissive: number;
  showWalls: boolean;
  showWarmLights: boolean;
  showGrid: boolean;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  deskWood: string;
  deskMetal: string;
  chairColor: string;
  monitorFrame: string;
  plantPot: string;
  plantLeaf: string;
  exposure: number;
}

export const ENVIRONMENT_THEMES: Record<EnvironmentStyle, EnvironmentTheme> = {
  A: {
    background: "#dce3ed",
    floor: "#e8ecf2",
    platform: "#c8d0dc",
    wall: "#f0f3f8",
    gridPrimary: "#d8dee8",
    gridSecondary: "#e2e8f0",
    ambientIntensity: 0.75,
    directionalIntensity: 1.35,
    hemisphereSky: "#ffffff",
    hemisphereGround: "#c8d4e4",
    bloomIntensity: 0.25,
    zoneOpacity: 0.18,
    zoneEmissive: 0.08,
    showWalls: true,
    showWarmLights: false,
    showGrid: false,
    fogColor: "#dce3ed",
    fogNear: 14,
    fogFar: 40,
    deskWood: "#d4b896",
    deskMetal: "#a0aab8",
    chairColor: "#6b7a8a",
    monitorFrame: "#4a5568",
    plantPot: "#b8a898",
    plantLeaf: "#5a9a5a",
    exposure: 1.15,
  },
  B: {
    background: "#060a14",
    floor: "#0c1220",
    platform: "#080e1a",
    wall: "#141c2e",
    gridPrimary: "#1a3a6a",
    gridSecondary: "#0d1f3d",
    ambientIntensity: 0.2,
    directionalIntensity: 0.35,
    hemisphereSky: "#1e3a6a",
    hemisphereGround: "#060a14",
    bloomIntensity: 1.4,
    zoneOpacity: 0.06,
    zoneEmissive: 0.85,
    showWalls: true,
    showWarmLights: false,
    showGrid: true,
    fogColor: "#060a14",
    fogNear: 10,
    fogFar: 35,
    deskWood: "#1a2235",
    deskMetal: "#2a3a55",
    chairColor: "#1e2838",
    monitorFrame: "#2a3548",
    plantPot: "#1a2030",
    plantLeaf: "#1a5a4a",
    exposure: 1.0,
  },
  C: {
    background: "#14100c",
    floor: "#3d2e1f",
    platform: "#241c14",
    wall: "#4a3f35",
    gridPrimary: "#5c4a38",
    gridSecondary: "#3d2e1f",
    ambientIntensity: 0.45,
    directionalIntensity: 0.9,
    hemisphereSky: "#ffd599",
    hemisphereGround: "#2a2118",
    bloomIntensity: 0.9,
    zoneOpacity: 0.2,
    zoneEmissive: 0.45,
    showWalls: true,
    showWarmLights: true,
    showGrid: false,
    fogColor: "#14100c",
    fogNear: 12,
    fogFar: 38,
    deskWood: "#c4a882",
    deskMetal: "#8898a8",
    chairColor: "#4a5568",
    monitorFrame: "#3a4550",
    plantPot: "#9a8a7a",
    plantLeaf: "#4a8a4a",
    exposure: 1.1,
  },
};
