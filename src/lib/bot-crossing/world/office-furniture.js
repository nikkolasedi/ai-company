import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mulberry } from './planet.js'
import { withCurve } from '../core/curve.js'

const FIT_RADIUS = 2

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
  const topY = y + 1.08
  c.add(roundBox(1.55, 0.05, 0.72, 0.02), OAK, { y: topY })
  c.add(roundBox(0.55, 0.05, 0.42, 0.02), OAK, { x: 0.78, y: topY, z: -0.08 })
  for (const [x, z] of [
    [-0.68, -0.28],
    [0.68, -0.28],
    [-0.68, 0.28],
    [0.95, 0.12],
  ]) {
    c.add(box(0.045, 1.06, 0.045), METAL, { x, y: y + 0.53, z })
  }
  return topY
}

function monitor(c, x, y, z, yaw = 0) {
  c.add(cyl(0.07, 0.09, 0.06, 8), METAL, { x, y: y + 0.03, z, ry: yaw })
  c.add(box(0.03, 0.22, 0.03), FRAME, { x, y: y + 0.16, z, ry: yaw })
  c.add(box(0.52, 0.34, 0.03), FRAME, { x, y: y + 0.36, z, ry: yaw })
  c.add(box(0.46, 0.28, 0.01), SCREEN, { x, y: y + 0.36, z: z + 0.018, ry: yaw, emissive: 0.85 })
}

function laptop(c, x, y, z, yaw = 0) {
  c.add(roundBox(0.32, 0.018, 0.22, 0.01), FRAME, { x, y: y + 0.01, z, ry: yaw })
  const lid = box(0.32, 0.2, 0.012)
  lid.rotateX(-0.55)
  c.add(lid, FRAME, { x, y: y + 0.12, z: z - 0.08, ry: yaw })
  const screen = box(0.28, 0.16, 0.006)
  screen.rotateX(-0.55)
  c.add(screen, SCREEN, { x, y: y + 0.12, z: z - 0.07, ry: yaw, emissive: 0.7 })
}

function chair(c, x, z, yaw = 0) {
  c.add(cyl(0.16, 0.18, 0.04, 8), METAL, { x, y: 0.05, z, ry: yaw })
  c.add(cyl(0.03, 0.03, 0.28, 6), METAL, { x, y: 0.2, z, ry: yaw })
  c.add(roundBox(0.32, 0.05, 0.32, 0.03), CHAIR, { x, y: 0.36, z, ry: yaw })
  c.add(roundBox(0.3, 0.38, 0.04, 0.02), CHAIR, { x, y: 0.56, z: z - 0.14, ry: yaw })
}

function potPlant(c, x, z, scale = 1, tall = false) {
  c.add(cyl(0.13 * scale, 0.16 * scale, 0.28 * scale, 8), POT, { x, y: 0.14 * scale, z })
  c.add(sphere(0.22 * scale, 8, 6), LEAF, { x, y: (tall ? 0.62 : 0.48) * scale, z })
  c.add(sphere(0.14 * scale, 6, 5), LEAF_DARK, { x: x + 0.1 * scale, y: (tall ? 0.72 : 0.56) * scale, z: z + 0.04 * scale })
  c.add(sphere(0.12 * scale, 6, 5), LEAF, { x: x - 0.08 * scale, y: (tall ? 0.68 : 0.54) * scale, z: z - 0.05 * scale })
  if (tall) {
    c.add(cyl(0.02 * scale, 0.03 * scale, 0.7 * scale, 5), WALNUT, { x, y: 0.55 * scale, z })
    c.add(sphere(0.18 * scale, 7, 5), LEAF, { x: x + 0.06 * scale, y: 0.95 * scale, z })
    c.add(sphere(0.16 * scale, 6, 5), LEAF_DARK, { x: x - 0.08 * scale, y: 1.02 * scale, z: z + 0.05 * scale })
  }
}

function succulent(c, x, y, z) {
  c.add(cyl(0.05, 0.06, 0.08, 7), POT, { x, y: y + 0.04, z })
  c.add(sphere(0.055, 6, 4), LEAF, { x, y: y + 0.1, z })
}

const KINDS = {
  habitat(c) {
    const top = standingDesk(c)
    monitor(c, -0.28, top, -0.18)
    monitor(c, 0.28, top, -0.18)
    laptop(c, 0.02, top, 0.12)
    c.add(box(0.34, 0.012, 0.12), DARK, { y: top + 0.01, z: 0.18 })
    succulent(c, 0.62, top, 0.18)
    chair(c, 0, 0.55, Math.PI)
    return 'Standing desk'
  },

  lab(c) {
    const top = standingDesk(c, 0)
    monitor(c, -0.18, top, -0.16)
    laptop(c, 0.28, top, 0.08)
    c.add(box(0.22, 0.08, 0.16), WHITE, { x: 0.55, y: top + 0.05, z: -0.12 })
    succulent(c, -0.62, top, 0.16)
    chair(c, 0.05, 0.52, Math.PI)
    return 'Lab desk'
  },

  workshop(c, rand) {
    c.add(cyl(1.05, 1.05, 0.06, 24), OAK, { y: 0.74 })
    c.add(cyl(0.1, 0.16, 0.72, 8), METAL, { y: 0.36 })
    c.add(cyl(0.28, 0.28, 0.04, 16), WALNUT, { y: 0.78 })
    const seats = 6
    for (let i = 0; i < seats; i++) {
      const a = (i / seats) * Math.PI * 2 + rand() * 0.08
      chair(c, Math.cos(a) * 1.42, Math.sin(a) * 1.42, a + Math.PI)
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

  pad(c, rand) {
    c.add(cyl(0.55, 0.55, 0.06, 20), OAK, { y: 0.32 })
    c.add(cyl(0.08, 0.1, 0.3, 8), METAL, { y: 0.16 })
    for (const side of [-0.85, 0.85]) {
      c.add(roundBox(0.62, 0.12, 0.58, 0.04), CHAIR, { x: side, y: 0.28, z: 0.05, ry: side > 0 ? -0.2 : 0.2 })
      c.add(roundBox(0.58, 0.32, 0.08, 0.03), CHAIR, { x: side, y: 0.5, z: -0.2, ry: side > 0 ? -0.2 : 0.2 })
    }
    c.add(cyl(0.08, 0.08, 0.1, 8), WHITE, { y: 0.4, z: 0.08 })
    if (rand() > 0.4) potPlant(c, 0, -0.7, 0.55)
    return 'Lounge'
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
  const scale = Math.min(1.35, FIT_RADIUS / Math.max(radius, 0.001))
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

/** Small yard props for plot clutter — planter, stool, bag, cooler, bin. */
export function officeClutterGeometry(kind, rand) {
  const c = new Furniture()
  if (kind === 'planter') {
    potPlant(c, 0, 0, 0.85 + rand() * 0.25, rand() > 0.5)
  } else if (kind === 'stool') {
    c.add(cyl(0.14, 0.14, 0.04, 8), OAK, { y: 0.42 })
    c.add(cyl(0.03, 0.03, 0.4, 6), METAL, { y: 0.2 })
    c.add(cyl(0.12, 0.12, 0.03, 8), METAL, { y: 0.02 })
  } else if (kind === 'bag') {
    c.add(roundBox(0.22, 0.28, 0.12, 0.03), DARK, { y: 0.16, ry: rand() * 6 })
    c.add(box(0.16, 0.04, 0.04), METAL, { y: 0.32 })
  } else if (kind === 'cooler') {
    c.add(roundBox(0.28, 0.72, 0.28, 0.03), WHITE, { y: 0.36 })
    c.add(cyl(0.05, 0.05, 0.08, 8), METAL, { y: 0.76 })
    c.add(box(0.18, 0.02, 0.12), FRAME, { y: 0.5, z: 0.14 })
  } else {
    c.add(cyl(0.12, 0.14, 0.32, 8), DARK, { y: 0.16 })
    c.add(cyl(0.13, 0.13, 0.03, 8), METAL, { y: 0.33 })
  }
  return c.finish()
}

export const OFFICE_CLUTTER = ['planter', 'stool', 'bag', 'cooler', 'bin']
