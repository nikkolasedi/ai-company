/** Map 2D office canvas (900×700) to 3D world space (18×14 units). */
export const OFFICE_WIDTH = 900;
export const OFFICE_HEIGHT = 700;
export const WORLD_WIDTH = 18;
export const WORLD_DEPTH = 14;

export const SCALE_X = WORLD_WIDTH / OFFICE_WIDTH;
export const SCALE_Z = WORLD_DEPTH / OFFICE_HEIGHT;

export const SCENE_CENTER: [number, number, number] = [
  WORLD_WIDTH / 2,
  0,
  WORLD_DEPTH / 2,
];

export function position2dTo3d(pos: { x: number; y: number }): [number, number, number] {
  return [pos.x * SCALE_X, 0, pos.y * SCALE_Z];
}

export function agentWorldPosition(
  officeX: number,
  officeY: number,
  deskX: number,
  deskY: number
): [number, number, number] {
  return position2dTo3d({
    x: officeX + deskX + 60,
    y: officeY + deskY + 70,
  });
}

export function departmentCenter(
  officeX: number,
  officeY: number
): [number, number, number] {
  return position2dTo3d({
    x: officeX + 140,
    y: officeY + 80,
  });
}
