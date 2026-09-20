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
}

export const ENVIRONMENT_THEMES: Record<EnvironmentStyle, EnvironmentTheme> = {
  A: {
    background: "#e8ecf2",
    floor: "#d4dbe6",
    platform: "#bcc4d0",
    wall: "#e8ecf2",
    gridPrimary: "#c0c8d4",
    gridSecondary: "#cad2dc",
    ambientIntensity: 0.65,
    directionalIntensity: 1.2,
    hemisphereSky: "#ffffff",
    hemisphereGround: "#c8d0dc",
    bloomIntensity: 0.3,
    zoneOpacity: 0.12,
    zoneEmissive: 0.1,
    showWalls: true,
    showWarmLights: false,
  },
  B: {
    background: "#0a0e1a",
    floor: "#111827",
    platform: "#0f1729",
    wall: "#1e293b",
    gridPrimary: "#1e3a5f",
    gridSecondary: "#0f2744",
    ambientIntensity: 0.25,
    directionalIntensity: 0.5,
    hemisphereSky: "#1e3a5f",
    hemisphereGround: "#0a0e1a",
    bloomIntensity: 1.2,
    zoneOpacity: 0.08,
    zoneEmissive: 0.6,
    showWalls: true,
    showWarmLights: false,
  },
  C: {
    background: "#1a1410",
    floor: "#3d2e1f",
    platform: "#2a2118",
    wall: "#4a3f35",
    gridPrimary: "#5c4a38",
    gridSecondary: "#3d2e1f",
    ambientIntensity: 0.4,
    directionalIntensity: 0.85,
    hemisphereSky: "#ffd599",
    hemisphereGround: "#2a2118",
    bloomIntensity: 0.85,
    zoneOpacity: 0.15,
    zoneEmissive: 0.35,
    showWalls: true,
    showWarmLights: true,
  },
};
