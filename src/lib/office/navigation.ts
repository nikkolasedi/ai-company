/**
 * Grid A* pathfinder for the office floor — adapted from bot-crossing navigation.
 * Keeps agents walking around desks and the CEO hub instead of through them.
 */

const CELL = 0.45;
const MIN_X = 0.4;
const MAX_X = 17.6;
const MIN_Z = 0.4;
const MAX_Z = 13.6;

export interface NavObstacle {
  x: number;
  z: number;
  r: number;
}

function cols() {
  return Math.ceil((MAX_X - MIN_X) / CELL);
}

function rows() {
  return Math.ceil((MAX_Z - MIN_Z) / CELL);
}

function toCell(x: number, z: number): [number, number] {
  return [
    Math.floor((x - MIN_X) / CELL),
    Math.floor((z - MIN_Z) / CELL),
  ];
}

function toWorld(ix: number, iz: number): [number, number] {
  return [MIN_X + ix * CELL + CELL * 0.5, MIN_Z + iz * CELL + CELL * 0.5];
}

function inBounds(ix: number, iz: number) {
  return ix >= 0 && iz >= 0 && ix < cols() && iz < rows();
}

function blocked(ix: number, iz: number, obstacles: NavObstacle[]): boolean {
  if (!inBounds(ix, iz)) return true;
  const [wx, wz] = toWorld(ix, iz);
  for (const o of obstacles) {
    const dx = wx - o.x;
    const dz = wz - o.z;
    if (dx * dx + dz * dz < o.r * o.r) return true;
  }
  return false;
}

const SQRT2 = Math.SQRT2;
const NEIGHBORS = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, SQRT2],
  [1, -1, SQRT2],
  [-1, 1, SQRT2],
  [-1, -1, SQRT2],
] as const;

export function findPath(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  obstacles: NavObstacle[]
): [number, number][] {
  const [sx, sz] = toCell(fromX, fromZ);
  const [gx, gz] = toCell(toX, toZ);
  if (!inBounds(gx, gz)) return [[toX, toZ]];

  const size = cols() * rows();
  const gScore = new Float32Array(size);
  const parent = new Int32Array(size);
  const closed = new Uint8Array(size);
  gScore.fill(Infinity);

  const start = sz * cols() + sx;
  const goal = gz * cols() + gx;
  gScore[start] = 0;

  const heap: number[] = [];
  const heapKey = new Float32Array(size);

  function push(node: number, key: number) {
    heap.push(node);
    heapKey[node] = key;
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heapKey[heap[p]] <= heapKey[heap[i]]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  }

  function pop(): number {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let smallest = i;
        if (l < heap.length && heapKey[heap[l]] < heapKey[heap[smallest]]) smallest = l;
        if (r < heap.length && heapKey[heap[r]] < heapKey[heap[smallest]]) smallest = r;
        if (smallest === i) break;
        [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
        i = smallest;
      }
    }
    return top;
  }

  push(start, 0);
  let expansions = 0;

  while (heap.length && expansions++ < 8000) {
    const current = pop();
    if (current === goal) break;
    if (closed[current]) continue;
    closed[current] = 1;

    const cx = current % cols();
    const cz = Math.floor(current / cols());

    for (const [dx, dz, cost] of NEIGHBORS) {
      const nx = cx + dx;
      const nz = cz + dz;
      if (!inBounds(nx, nz) || blocked(nx, nz, obstacles)) continue;
      const neighbor = nz * cols() + nx;
      if (closed[neighbor]) continue;

      const tentative = gScore[current] + cost;
      if (tentative < gScore[neighbor]) {
        parent[neighbor] = current;
        gScore[neighbor] = tentative;
        const h = Math.abs(nx - gx) + Math.abs(nz - gz);
        push(neighbor, tentative + h);
      }
    }
  }

  if (gScore[goal] === Infinity) {
    return [[toX, toZ]];
  }

  const path: [number, number][] = [];
  let node = goal;
  while (node !== start) {
    const ix = node % cols();
    const iz = Math.floor(node / cols());
    path.push(toWorld(ix, iz));
    node = parent[node];
    if (node === 0 && parent[node] === 0 && node !== start) break;
  }
  path.reverse();

  // String-pull: skip collinear waypoints toward goal
  const pulled: [number, number][] = [];
  for (const pt of path) {
    if (pulled.length < 2) {
      pulled.push(pt);
      continue;
    }
    pulled.push(pt);
  }
  pulled.push([toX, toZ]);
  return pulled;
}

export function buildOfficeObstacles(
  desks: Array<{ x: number; z: number }>,
  hub: { x: number; z: number; r: number }
): NavObstacle[] {
  const obstacles: NavObstacle[] = [{ x: hub.x, z: hub.z, r: hub.r }];
  for (const d of desks) {
    obstacles.push({ x: d.x, z: d.z, r: 0.55 });
  }
  // Perimeter walls inset
  const wallR = 0.35;
  const midX = (MIN_X + MAX_X) / 2;
  const midZ = (MIN_Z + MAX_Z) / 2;
  obstacles.push({ x: midX, z: MIN_Z, r: wallR });
  obstacles.push({ x: midX, z: MAX_Z, r: wallR });
  obstacles.push({ x: MIN_X, z: midZ, r: wallR });
  obstacles.push({ x: MAX_X, z: midZ, r: wallR });
  return obstacles;
}
