import { OFFICE_HEIGHT, OFFICE_WIDTH, position2dTo3d, SCENE_CENTER, SCALE_X, SCALE_Z } from "./coordinates";

const HUB_2D = { x: OFFICE_WIDTH / 2, y: OFFICE_HEIGHT / 2 };
const HEX_RADIUS_2D = 238;

/** Clockwise from top: marketing → technology → sales → customer → finance → operations */
const SLUG_ORDER = [
  "marketing",
  "technology",
  "sales",
  "customer-communication",
  "finance",
  "operations",
] as const;

export const ZONE_HEX_RADIUS = 1.55;
export const HUB_CLEAR_RADIUS = 2.35;

export const DEPARTMENT_ZONE_LAYOUTS = SLUG_ORDER.map((slug, i) => {
  const angle = -Math.PI / 2 + i * (Math.PI / 3);
  return {
    slug,
    center2d: {
      x: HUB_2D.x + HEX_RADIUS_2D * Math.cos(angle),
      y: HUB_2D.y + HEX_RADIUS_2D * Math.sin(angle),
    },
    angle,
  };
});

export const ZONE_BOX = { width: 220, height: 120, offsetX: 110, offsetY: 60 };

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

/** Regular flat-top hexagon points in local XZ (y=0). */
export function regularHexagonPoints(radius: number): Array<[number, number, number]> {
  const pts: Array<[number, number, number]> = [];
  for (let i = 0; i <= 6; i++) {
    const a = Math.PI / 6 + i * (Math.PI / 3);
    pts.push([radius * Math.cos(a), 0, radius * Math.sin(a)]);
  }
  return pts;
}

/** Two rows of three desks, spaced outward from hub. */
const DESK_LOCAL_OFFSETS: Array<{ lx: number; lz: number }> = [
  { lx: -1.15, lz: 0.22 },
  { lx: 0, lz: 0.22 },
  { lx: 1.15, lz: 0.22 },
  { lx: -1.15, lz: 0.88 },
  { lx: 0, lz: 0.88 },
  { lx: 1.15, lz: 0.88 },
];

export const COMPACT_DESK_2D: Array<{ deskX: number; deskY: number }> = [
  { deskX: 20, deskY: 20 },
  { deskX: 90, deskY: 20 },
  { deskX: 160, deskY: 20 },
  { deskX: 20, deskY: 70 },
  { deskX: 90, deskY: 70 },
  { deskX: 160, deskY: 70 },
];

export function getDeskWorldTransform(
  zoneCenter: [number, number, number],
  deskIndex: number
): {
  position: [number, number, number];
  rotation: number;
  chairPosition: [number, number, number];
  chairRotation: number;
} {
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

/** World-space hex ring connecting all department centers. */
export function hubHexRingPoints(): Array<[number, number, number]> {
  return DEPARTMENT_ZONE_LAYOUTS.map((z) => {
    const [x, , cz] = position2dTo3d(z.center2d);
    return [x, 0.04, cz] as [number, number, number];
  });
}
