import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mulberry } from './planet.js'
import { withCurve } from '../core/curve.js'

const FIT_RADIUS = 2.6

/**
 * Warm-studio office furniture. One merged mesh per workstation, same progress
 * reveal the space-base buildings used, so a new task still "arrives" on the floor.
 */

const OAK = 0xc4a574
const WALNUT = 0x8b6a44
const CREAM = 0xf3ece3
const METAL = 0x9a9086
const DARK = 0x3d3832
const SCREEN = 0x8ec8f0
const FRAME = 0x2a2a2e
const POT = 0xc47a5a
const LEAF = 0x4f8a4a
const LEAF_DARK = 0x3a6a38
const CHAIR = 0x5c5348
const WHITE = 0xf6f1ea
const COFFEE = 0x4a3224

const SURFACE = {
  [OAK]: [0.55, 0.02],
  [WALNUT]: [0.5, 0.04],
  [CREAM]: [0.62, 0.0],
  [METAL]: [0.32, 0.55],
  [DARK]: [0.45, 0.15],
  [SCREEN]: [0.12, 0.0],
  [FRAME]: [0.35, 0.4],
  [POT]: [0.7, 0.0],
  [LEAF]: [0.85, 0.0],
  [LEAF_DARK]: [0.88, 0.0],
  [CHAIR]: [0.72, 0.0],
  [WHITE]: [0.48, 0.02],
  [COFFEE]: [0.6, 0.0],
}

class Furniture {
  constructor() {
    this.parts = []
  }

  add(geo, color, extra = {}) {
    if (geo.index) geo = geo.toNonIndexed()
    geo.deleteAttribute('uv')
    geo.deleteAttribute('uv1')
    geo.deleteAttribute('uv2')
    if (extra.s && extra.s !== 1) geo.scale(extra.s, extra.s, extra.s)
    if (extra.rx) geo.rotateX(extra.rx)
    if (extra.ry) geo.rotateY(extra.ry)
    if (extra.rz) geo.rotateZ(extra.rz)
    geo.translate(extra.x || 0, extra.y || 0, extra.z || 0)
    const count = geo.attributes.position.count
    const colors = new Float32Array(count * 3)
    const c = new THREE.Color(color)
    for (let i = 0; i < count; i++) {
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const [rough, metal] = SURFACE[color] || [0.55, 0.05]
    const surf = new Float32Array(count * 2)
    for (let i = 0; i < count; i++) {
      surf[i * 2] = extra.roughness ?? rough
      surf[i * 2 + 1] = extra.metalness ?? metal
    }
    geo.setAttribute('aSurface', new THREE.BufferAttribute(surf, 2))
    const emit = extra.emissive || 0
    geo.setAttribute('aEmissive', new THREE.BufferAttribute(new Float32Array(count).fill(emit), 1))
    if (!geo.attributes.normal) geo.computeVertexNormals()
    this.parts.push(geo)
    return this
  }

  finish() {
    const prepared = this.parts.map((geo) => (geo.index ? geo.toNonIndexed() : geo))
    const merged = BufferGeometryUtils.mergeGeometries(prepared, false)
    for (const p of this.parts) p.dispose()
    if (!merged) {
      return new THREE.BoxGeometry(0.4, 0.4, 0.4)
    }
    merged.computeBoundingBox()
    return merged
  }
}

function box(w, h, d) {
  return new THREE.BoxGeometry(w, h, d)
}

function cyl(rt, rb, h, seg = 10) {
  return new THREE.CylinderGeometry(rt, rb, h, seg)
}

function sphere(r, w = 8, h = 6) {
  return new THREE.SphereGeometry(r, w, h)
}

function roundBox(w, h, d, r = 0.04) {
  return new RoundedBoxGeometry(w, h, d, 2, r)
}

function standingDesk(c, y = 0) {
  const topY = y + 1.14
  c.add(roundBox(1.95, 0.06, 0.92, 0.03), OAK, { y: topY })
  c.add(roundBox(0.7, 0.06, 0.52, 0.03), OAK, { x: 0.95, y: topY, z: -0.1 })
  for (const [x, z] of [
    [-0.86, -0.36],
    [0.86, -0.36],
    [-0.86, 0.36],
    [1.18, 0.16],
  ]) {
    c.add(box(0.055, 1.12, 0.055), METAL, { x, y: y + 0.56, z })
  }
  return topY
}

function monitor(c, x, y, z, yaw = 0) {
  c.add(cyl(0.09, 0.11, 0.07, 8), METAL, { x, y: y + 0.04, z, ry: yaw })
  c.add(box(0.04, 0.28, 0.04), FRAME, { x, y: y + 0.2, z, ry: yaw })
  c.add(box(0.68, 0.44, 0.04), FRAME, { x, y: y + 0.46, z, ry: yaw })
  c.add(box(0.6, 0.36, 0.012), SCREEN, { x, y: y + 0.46, z: z + 0.024, ry: yaw, emissive: 0.85 })
}

function laptop(c, x, y, z, yaw = 0) {
  c.add(roundBox(0.4, 0.02, 0.28, 0.012), FRAME, { x, y: y + 0.012, z, ry: yaw })
  const lid = box(0.4, 0.26, 0.014)
  lid.rotateX(-0.55)
  c.add(lid, FRAME, { x, y: y + 0.15, z: z - 0.1, ry: yaw })
  const screen = box(0.35, 0.2, 0.008)
  screen.rotateX(-0.55)
  c.add(screen, SCREEN, { x, y: y + 0.15, z: z - 0.088, ry: yaw, emissive: 0.7 })
}

function chair(c, x, z, yaw = 0, accent = CHAIR) {
  c.add(cyl(0.2, 0.22, 0.05, 8), METAL, { x, y: 0.06, z, ry: yaw })
  c.add(cyl(0.04, 0.04, 0.34, 6), METAL, { x, y: 0.24, z, ry: yaw })
  c.add(roundBox(0.4, 0.06, 0.4, 0.03), accent, { x, y: 0.44, z, ry: yaw })
  c.add(roundBox(0.38, 0.48, 0.05, 0.03), accent, { x, y: 0.7, z: z - 0.18, ry: yaw })
}

function potPlant(c, x, z, scale = 1, tall = false) {
  const s = scale * 1.25
  c.add(cyl(0.16 * s, 0.2 * s, 0.34 * s, 8), POT, { x, y: 0.17 * s, z })
  c.add(sphere(0.28 * s, 8, 6), LEAF, { x, y: (tall ? 0.78 : 0.6) * s, z })
  c.add(sphere(0.18 * s, 6, 5), LEAF_DARK, { x: x + 0.12 * s, y: (tall ? 0.9 : 0.7) * s, z: z + 0.05 * s })
  c.add(sphere(0.15 * s, 6, 5), LEAF, { x: x - 0.1 * s, y: (tall ? 0.86 : 0.68) * s, z: z - 0.06 * s })
  if (tall) {
    c.add(cyl(0.03 * s, 0.04 * s, 0.9 * s, 5), WALNUT, { x, y: 0.7 * s, z })
    c.add(sphere(0.24 * s, 7, 5), LEAF, { x: x + 0.08 * s, y: 1.2 * s, z })
    c.add(sphere(0.2 * s, 6, 5), LEAF_DARK, { x: x - 0.1 * s, y: 1.28 * s, z: z + 0.06 * s })
  }
}

function succulent(c, x, y, z) {
  c.add(cyl(0.05, 0.06, 0.08, 7), POT, { x, y: y + 0.04, z })
  c.add(sphere(0.055, 6, 4), LEAF, { x, y: y + 0.1, z })
}

const KINDS = {
  habitat(c, _rand, accent) {
    const top = standingDesk(c)
    monitor(c, -0.34, top, -0.22)
    monitor(c, 0.34, top, -0.22)
    laptop(c, 0.02, top, 0.16)
    c.add(box(0.4, 0.014, 0.14), DARK, { y: top + 0.012, z: 0.22 })
    succulent(c, 0.78, top, 0.22)
    chair(c, 0, 0.7, Math.PI, accent)
    return 'Standing desk'
  },

  lab(c, _rand, accent) {
    const top = standingDesk(c, 0)
    monitor(c, -0.22, top, -0.2)
    laptop(c, 0.34, top, 0.1)
    c.add(box(0.28, 0.1, 0.2), WHITE, { x: 0.7, y: top + 0.06, z: -0.14 })
    succulent(c, -0.78, top, 0.2)
    chair(c, 0.05, 0.66, Math.PI, accent)
    return 'Lab desk'
  },

  workshop(c, rand, accent) {
    c.add(cyl(1.28, 1.28, 0.07, 24), OAK, { y: 0.78 })
    c.add(cyl(0.12, 0.18, 0.76, 8), METAL, { y: 0.38 })
    c.add(cyl(0.34, 0.34, 0.05, 16), WALNUT, { y: 0.84 })
    const seats = 6
    for (let i = 0; i < seats; i++) {
      const a = (i / seats) * Math.PI * 2 + rand() * 0.08
      chair(c, Math.cos(a) * 1.72, Math.sin(a) * 1.72, a + Math.PI, accent)
    }
    return 'Meeting table'
  },

  greenhouse(c, rand) {
    c.add(roundBox(1.7, 0.22, 0.7, 0.04), WALNUT, { y: 0.14 })
    c.add(box(1.55, 0.08, 0.55), 0x3d2a1c, { y: 0.26 })
    for (let i = 0; i < 4; i++) {
      potPlant(c, -0.55 + i * 0.38, (rand() - 0.5) * 0.12, 0.72 + rand() * 0.18, rand() > 0.55)
    }
    return 'Planter'
  },

  tower(c) {
    c.add(cyl(0.22, 0.26, 0.38, 10), POT, { y: 0.2 })
    c.add(cyl(0.035, 0.05, 1.35, 6), WALNUT, { y: 0.95 })
    c.add(sphere(0.42, 9, 7), LEAF, { y: 1.55 })
    c.add(sphere(0.28, 7, 6), LEAF_DARK, { x: 0.22, y: 1.72, z: 0.08 })
    c.add(sphere(0.24, 7, 6), LEAF, { x: -0.2, y: 1.8, z: -0.1 })
    c.add(sphere(0.2, 6, 5), LEAF_DARK, { x: 0.08, y: 1.95, z: 0.16 })
    return 'Olive tree'
  },

  silo(c) {
    c.add(roundBox(0.72, 1.15, 0.42, 0.03), OAK, { y: 0.58 })
    for (let i = 0; i < 3; i++) {
      c.add(box(0.68, 0.015, 0.4), WALNUT, { y: 0.28 + i * 0.32 })
      c.add(box(0.04, 0.04, 0.04), METAL, { x: 0.3, y: 0.4 + i * 0.32, z: 0.22 })
    }
    potPlant(c, 0.55, 0.28, 0.7)
    return 'Cabinet'
  },

  reactor(c) {
    c.add(roundBox(1.35, 0.08, 0.55, 0.02), WALNUT, { y: 0.92 })
    c.add(roundBox(1.2, 0.82, 0.48, 0.03), CREAM, { y: 0.45 })
    c.add(cyl(0.12, 0.12, 0.18, 10), METAL, { x: -0.35, y: 1.08, z: 0.02 })
    c.add(cyl(0.07, 0.09, 0.1, 8), DARK, { x: -0.35, y: 1.2, z: 0.02 })
    c.add(cyl(0.08, 0.08, 0.14, 8), WHITE, { x: -0.08, y: 1.04, z: 0.04 })
    c.add(cyl(0.055, 0.055, 0.1, 8), WHITE, { x: 0.12, y: 1.02, z: 0.04 })
    c.add(box(0.22, 0.08, 0.16), COFFEE, { x: 0.42, y: 0.98, z: 0.02 })
    return 'Coffee bar'
  },

  solar(c) {
    c.add(roundBox(1.6, 0.08, 0.42, 0.02), OAK, { y: 0.42, z: -0.15 })
    c.add(box(1.55, 1.05, 0.04), 0xb7d3e6, { y: 1.0, z: -0.32, roughness: 0.08, metalness: 0.15 })
    c.add(box(1.62, 1.12, 0.03), WHITE, { y: 1.0, z: -0.35 })
    potPlant(c, -0.55, 0.05, 0.65)
    potPlant(c, 0.55, 0.08, 0.55)
    succulent(c, 0, 0.42, -0.02)
    return 'Window bay'
  },

  antenna(c) {
    c.add(roundBox(0.55, 0.05, 0.4, 0.02), OAK, { y: 0.72 })
    c.add(cyl(0.03, 0.03, 0.7, 6), METAL, { y: 0.35 })
    c.add(cyl(0.12, 0.16, 0.04, 8), METAL, { y: 0.04 })
    c.add(cyl(0.16, 0.12, 0.18, 10), 0xf0d9a8, { y: 1.0, emissive: 0.35 })
    succulent(c, 0.18, 0.72, 0.08)
    return 'Floor lamp'
  },

  pad(c, rand, accent) {
    c.add(cyl(0.68, 0.68, 0.07, 20), OAK, { y: 0.36 })
    c.add(cyl(0.1, 0.12, 0.34, 8), METAL, { y: 0.18 })
    for (const side of [-1.05, 1.05]) {
      c.add(roundBox(0.76, 0.14, 0.7, 0.04), accent || CHAIR, { x: side, y: 0.32, z: 0.06, ry: side > 0 ? -0.2 : 0.2 })
      c.add(roundBox(0.7, 0.4, 0.1, 0.03), accent || CHAIR, { x: side, y: 0.58, z: -0.24, ry: side > 0 ? -0.2 : 0.2 })
    }
    c.add(cyl(0.1, 0.1, 0.12, 8), WHITE, { y: 0.46, z: 0.1 })
    if (rand() > 0.4) potPlant(c, 0, -0.85, 0.7)
    return 'Lounge'
  },

  tvWall(c, _rand, accent) {
    c.add(roundBox(0.28, 1.55, 2.2, 0.03), DARK, { y: 0.82, z: 0 })
    c.add(box(0.08, 1.15, 1.85), SCREEN, { x: 0.16, y: 0.92, emissive: 0.95 })
    c.add(box(1.7, 0.06, 0.08), accent, { x: 0.18, y: 1.52 })
    c.add(roundBox(0.9, 0.08, 0.42, 0.02), OAK, { x: 0.7, y: 0.42 })
    potPlant(c, 1.15, 0.55, 0.7)
    return 'Campaign wall'
  },

  safe(c, _rand, accent) {
    c.add(roundBox(0.95, 1.05, 0.7, 0.04), 0x3a3f46, { y: 0.54 })
    c.add(box(0.72, 0.82, 0.04), METAL, { z: 0.36, y: 0.58 })
    c.add(cyl(0.08, 0.08, 0.05, 10), accent, { z: 0.4, y: 0.62, rx: Math.PI / 2 })
    c.add(roundBox(0.55, 0.18, 0.4, 0.02), 0xc9a24a, { y: 1.16 })
    c.add(box(0.28, 0.06, 0.2), DARK, { y: 1.28 })
    return 'Safe'
  },

  whiteboard(c, _rand, accent) {
    c.add(box(0.08, 1.35, 1.7), WHITE, { y: 1.05 })
    c.add(box(0.06, 1.2, 1.55), 0xeef4f8, { x: 0.03, y: 1.05 })
    c.add(box(1.55, 0.04, 0.05), accent, { x: 0.04, y: 1.68 })
    c.add(box(0.22, 0.04, 0.08), 0x2a6ad4, { x: 0.08, y: 1.15, z: 0.2 })
    c.add(box(0.18, 0.04, 0.08), 0xe24a4a, { x: 0.08, y: 0.95, z: -0.15 })
    c.add(roundBox(0.7, 0.72, 0.18, 0.02), OAK, { x: 0.55, y: 0.38, z: 0.55 })
    return 'Whiteboard'
  },

  serverRack(c, _rand, accent) {
    c.add(roundBox(0.7, 1.55, 0.85, 0.03), DARK, { y: 0.8 })
    for (let i = 0; i < 5; i++) {
      c.add(box(0.58, 0.12, 0.04), i % 2 ? accent : METAL, { z: 0.42, y: 0.32 + i * 0.24, emissive: i % 2 ? 0.4 : 0 })
    }
    c.add(box(0.08, 0.08, 0.08), 0x3ae86a, { x: 0.22, y: 1.48, z: 0.4, emissive: 0.8 })
    return 'Server rack'
  },

  kanban(c, _rand, accent) {
    c.add(roundBox(0.12, 1.45, 1.85, 0.02), WALNUT, { y: 0.95 })
    c.add(box(0.04, 1.2, 1.65), 0xf3efe6, { x: 0.08, y: 0.98 })
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 3; row++) {
        c.add(box(0.03, 0.16, 0.28), col === 1 ? accent : 0xf0d27a, {
          x: 0.12,
          y: 1.35 - row * 0.28,
          z: -0.5 + col * 0.5,
        })
      }
    }
    return 'Planner board'
  },

  headsetStation(c, _rand, accent) {
    c.add(roundBox(1.35, 0.08, 0.7, 0.03), OAK, { y: 0.92 })
    c.add(roundBox(1.2, 0.82, 0.6, 0.03), CREAM, { y: 0.45 })
    c.add(cyl(0.12, 0.12, 0.08, 10), DARK, { x: -0.35, y: 1.02 })
    c.add(cyl(0.04, 0.04, 0.22, 6), METAL, { x: -0.35, y: 1.16 })
    const ring = new THREE.TorusGeometry(0.12, 0.025, 6, 12)
    ring.rotateX(Math.PI / 2)
    c.add(ring, accent, { x: -0.35, y: 1.28 })
    c.add(box(0.32, 0.22, 0.04), SCREEN, { x: 0.28, y: 1.18, z: -0.12, emissive: 0.7 })
    return 'Support desk'
  },
}

const KIND_IDS = Object.keys(KINDS)

function decorateOffice(material, uniforms) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    withCurve(shader)
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         attribute float aEmissive;
         attribute vec2 aSurface;
         varying float vEmissive;
         varying vec2 vSurface;
         varying float vLocalY;
         uniform float uProgress;
         uniform float uMaxY;
         uniform float uMinY;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vLocalY = transformed.y;
         vEmissive = aEmissive;
         vSurface = aSurface;
         transformed.y -= ( 1.0 - uProgress ) * ( uMaxY - uMinY );`
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         varying float vEmissive;
         varying vec2 vSurface;
         varying float vLocalY;
         uniform float uProgress;
         uniform float uMaxY;
         uniform float uMinY;
         uniform vec3 uAccent;`
      )
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = vSurface.x;')
      .replace('#include <metalnessmap_fragment>', 'float metalnessFactor = vSurface.y;')
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         totalEmissiveRadiance += vec3(0.45, 0.72, 0.95) * vEmissive;`
      )
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
         if ( vLocalY < uMinY + ( 1.0 - uProgress ) * ( uMaxY - uMinY ) - 0.001 ) discard;`
      )
  }
  return material
}

export function createOfficeBuilding({ seed = 1, accent = 0xc96442, kind = null } = {}) {
  const rand = mulberry(seed)
  const chosen = kind && KINDS[kind] ? kind : KIND_IDS[Math.floor(rand() * KIND_IDS.length)]
  const c = new Furniture()
  const label = KINDS[chosen](c, rand, accent)
  const geo = c.finish()

  let radius = 0
  const positions = geo.getAttribute('position')
  for (let i = 0; i < positions.count; i++) {
    radius = Math.max(radius, Math.hypot(positions.getX(i), positions.getZ(i)))
  }
  const scale = Math.min(1.5, FIT_RADIUS / Math.max(radius, 0.001))
  geo.scale(scale, scale, scale)
  geo.computeBoundingBox()
  const height = geo.boundingBox.max.y
  const footprint = Math.max(
    Math.abs(geo.boundingBox.max.x),
    Math.abs(geo.boundingBox.min.x),
    Math.abs(geo.boundingBox.max.z),
    Math.abs(geo.boundingBox.min.z)
  )

  const uniforms = {
    uProgress: { value: 1 },
    uMaxY: { value: height },
    uMinY: { value: geo.boundingBox.min.y },
    uAccent: { value: new THREE.Color(accent) },
  }

  const material = decorateOffice(
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.55,
      metalness: 0.05,
      side: THREE.FrontSide,
    }),
    uniforms
  )

  const mesh = new THREE.Mesh(geo, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.userData.kind = chosen
  mesh.userData.label = label
  mesh.userData.height = height
  mesh.userData.footprint = footprint
  mesh.userData.uniforms = uniforms
  mesh.userData.progress = 1
  mesh.userData.setProgress = (p) => {
    const v = THREE.MathUtils.clamp(p, 0, 1)
    mesh.userData.progress = v
    uniforms.uProgress.value = v
    mesh.visible = v > 0.02
  }
  return mesh
}

/** Small yard props for plot clutter — shared plants plus department extras. */
export function officeClutterGeometry(kind, rand, accent = 0xc4a574) {
  const c = new Furniture()
  if (kind === 'planter') {
    potPlant(c, 0, 0, 0.95 + rand() * 0.3, rand() > 0.45)
  } else if (kind === 'stool') {
    c.add(cyl(0.16, 0.16, 0.05, 8), OAK, { y: 0.48 })
    c.add(cyl(0.035, 0.035, 0.46, 6), METAL, { y: 0.23 })
    c.add(cyl(0.14, 0.14, 0.04, 8), METAL, { y: 0.02 })
  } else if (kind === 'box') {
    c.add(roundBox(0.42, 0.32, 0.34, 0.02), 0xd2b48c, { y: 0.18, ry: rand() * 0.4 })
    c.add(roundBox(0.36, 0.22, 0.3, 0.02), 0xc4a06a, { y: 0.44, x: 0.04 })
  } else if (kind === 'bookshelf') {
    c.add(roundBox(0.7, 1.15, 0.28, 0.02), WALNUT, { y: 0.58 })
    for (let i = 0; i < 3; i++) c.add(box(0.62, 0.03, 0.24), OAK, { y: 0.28 + i * 0.32 })
    c.add(box(0.12, 0.22, 0.18), accent, { x: -0.16, y: 0.42 })
    c.add(box(0.1, 0.2, 0.16), DARK, { x: 0.08, y: 0.74 })
  } else if (kind === 'case') {
    c.add(roundBox(0.38, 0.22, 0.28, 0.03), 0x2c2418, { y: 0.14 })
    c.add(box(0.3, 0.04, 0.22), 0xc9a24a, { y: 0.26 })
  } else if (kind === 'pastry') {
    c.add(cyl(0.16, 0.16, 0.04, 12), 0xf0d27a, { y: 0.08 })
    c.add(cyl(0.1, 0.1, 0.05, 10), 0xc45a2a, { y: 0.12 })
  } else if (kind === 'phone') {
    c.add(roundBox(0.18, 0.28, 0.12, 0.02), DARK, { y: 0.2 })
    c.add(box(0.08, 0.1, 0.04), accent, { y: 0.38, emissive: 0.3 })
  } else if (kind === 'plaque') {
    c.add(cyl(0.08, 0.1, 0.22, 6), METAL, { y: 0.12 })
    c.add(box(0.16, 0.18, 0.04), 0xc9a24a, { y: 0.32 })
  } else if (kind === 'clipboard') {
    c.add(roundBox(0.22, 0.04, 0.3, 0.01), accent, { y: 0.08 })
    c.add(box(0.16, 0.01, 0.22), WHITE, { y: 0.11 })
  } else if (kind === 'crate') {
    c.add(roundBox(0.4, 0.32, 0.36, 0.02), WALNUT, { y: 0.18 })
  } else if (kind === 'headset') {
    c.add(cyl(0.08, 0.08, 0.06, 8), DARK, { y: 0.1 })
    const band = new THREE.TorusGeometry(0.1, 0.02, 6, 12, Math.PI)
    c.add(band, accent, { y: 0.2 })
  } else if (kind === 'cups') {
    c.add(cyl(0.05, 0.06, 0.1, 8), WHITE, { x: -0.08, y: 0.08 })
    c.add(cyl(0.05, 0.06, 0.1, 8), accent, { x: 0.08, y: 0.08 })
  } else if (kind === 'cablebin') {
    c.add(roundBox(0.28, 0.22, 0.28, 0.03), DARK, { y: 0.12 })
    c.add(cyl(0.03, 0.03, 0.16, 6), METAL, { y: 0.28, x: 0.06 })
  } else if (kind === 'gadget') {
    c.add(roundBox(0.2, 0.12, 0.2, 0.02), FRAME, { y: 0.1 })
    c.add(box(0.12, 0.02, 0.12), SCREEN, { y: 0.17, emissive: 0.6 })
  } else if (kind === 'cooler') {
    c.add(roundBox(0.32, 0.82, 0.32, 0.03), WHITE, { y: 0.42 })
    c.add(cyl(0.055, 0.055, 0.09, 8), METAL, { y: 0.86 })
  } else {
    c.add(cyl(0.14, 0.16, 0.36, 8), DARK, { y: 0.18 })
    c.add(cyl(0.15, 0.15, 0.04, 8), METAL, { y: 0.38 })
  }
  return c.finish()
}

export const OFFICE_CLUTTER = ['planter', 'stool', 'bag', 'cooler', 'bin']
