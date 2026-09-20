import { position2dTo3d, SCENE_CENTER } from "./coordinates";

/** Canonical zone centers arranged clockwise around the CEO hub. */
export const DEPARTMENT_ZONE_LAYOUTS: Array<{
  slug: string;
  center2d: { x: number; y: number };
}> = [
  { slug: "marketing", center2d: { x: 450, y: 120 } },
  { slug: "technology", center2d: { x: 620, y: 185 } },
  { slug: "sales", center2d: { x: 680, y: 350 } },
  { slug: "customer-communication", center2d: { x: 450, y: 580 } },
  { slug: "finance", center2d: { x: 280, y: 505 } },
  { slug: "operations", center2d: { x: 220, y: 350 } },
];

/** 2D top-left corner for department zone boxes (used by seed + 2D view). */
export const ZONE_BOX = { width: 260, height: 140, offsetX: 130, offsetY: 70 };

export function departmentOfficeOrigin(center2d: { x: number; y: number }) {
  return {
    officeX: center2d.x - ZONE_BOX.offsetX,
    officeY: center2d.y - ZONE_BOX.offsetY,
  };
}

export function getDepartmentZoneCenter(slug: string): [number, number, number] {
  const layout = DEPARTMENT_ZONE_LAYOUTS.find((z) => z.slug === slug);
  if (!layout) return SCENE_CENTER;
  return position2dTo3d(layout.center2d);
}

export function getFacingHubRotation(zoneX: number, zoneZ: number): number {
  const dx = SCENE_CENTER[0] - zoneX;
  const dz = SCENE_CENTER[2] - zoneZ;
  return Math.atan2(dx, -dz);
}

const DESK_LOCAL_OFFSETS: Array<{ lx: number; lz: number }> = [
  { lx: -0.95, lz: -0.3 },
  { lx: 0, lz: -0.3 },
  { lx: 0.95, lz: -0.3 },
  { lx: -0.95, lz: 0.45 },
  { lx: 0, lz: 0.45 },
  { lx: 0.95, lz: 0.45 },
];

/** Compact 2D desk coords within a zone box (for seed + 2D view). */
export const COMPACT_DESK_2D: Array<{ deskX: number; deskY: number }> = [
  { deskX: 15, deskY: 10 },
  { deskX: 85, deskY: 25 },
  { deskX: 155, deskY: 10 },
  { deskX: 15, deskY: 65 },
  { deskX: 85, deskY: 80 },
  { deskX: 155, deskY: 65 },
];

export function getDeskWorldTransform(
  zoneCenter: [number, number, number],
  deskIndex: number
): { position: [number, number, number]; rotation: number; chairPosition: [number, number, number]; chairRotation: number } {
  const offset = DESK_LOCAL_OFFSETS[deskIndex % DESK_LOCAL_OFFSETS.length];
  const facing = getFacingHubRotation(zoneCenter[0], zoneCenter[2]);
  const cosR = Math.cos(facing);
  const sinR = Math.sin(facing);

  const wx = zoneCenter[0] + offset.lx * cosR - offset.lz * sinR;
  const wz = zoneCenter[2] + offset.lx * sinR + offset.lz * cosR;

  const chairDist = 0.42;
  const chairWx = wx + chairDist * sinR;
  const chairWz = wz + chairDist * cosR;

  return {
    position: [wx, 0, wz],
    rotation: facing,
    chairPosition: [chairWx, 0, chairWz],
    chairRotation: facing + Math.PI,
  };
}
