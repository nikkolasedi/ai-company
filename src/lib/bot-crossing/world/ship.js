import * as THREE from 'three'
import { withCurve } from '../core/curve.js'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'
import { tagEditable } from '../editor/layout.js'

/**
 * The company shuttle stop. People walk out of the shelter when a thread appears
 * and back onto the bus when one is archived — same door API the lander used to own.
 */

const HULL = 0xf2eee6
const HULL_DARK = 0xc8c0b4
const NAVY = 0x2f3d66
const STRIPE = 0xc96442
const TRIM = 0xc4a574
const METAL = 0x8a8680
const GLASS = 0xb7d4ea
const FRAME = 0xe8ece8
const TIRE = 0x2a2a2e
const AMBER = 0xe8b84a
const DARK = 0x2a2a2e

const SURFACE = new Map([
  [HULL, [0.48, 0.05]],
  [HULL_DARK, [0.62, 0.08]],
  [NAVY, [0.42, 0.12]],
  [STRIPE, [0.4, 0.08]],
  [TRIM, [0.45, 0.1]],
  [METAL, [0.26, 0.95]],
  [GLASS, [0.08, 0.02]],
  [FRAME, [0.42, 0.12]],
  [TIRE, [0.9, 0.0]],
  [AMBER, [0.35, 0.15]],
  [DARK, [0.45, 0.15]],
  [0x4a4d55, [0.35, 0.85]],
])
const DEFAULT_SURFACE = [0.55, 0.15]

export class Ship {
  constructor(scene, position) {
    this.group = new THREE.Group()
    this.group.position.copy(position)
    // Turned so the shelter opening points back toward the middle of the courtyard.
    this.group.rotation.y = Math.atan2(-position.x, -position.z)
    this.group.name = 'ship'
    scene.add(this.group)
    this.scene = scene

    this.footRadius = 5.6
    this._buildBus()
    this._buildShelter()
    this._buildLights()
    tagEditable(this.group, 'shuttle', 'Shuttle stop', this.footRadius)

    this.traffic = 0
  }

  _buildBus() {
    const parts = []
    const colors = []
    const push = (geo, color, rot) => {
      if (rot) {
        if (rot.x) geo.rotateX(rot.x)
        if (rot.y) geo.rotateY(rot.y)
        if (rot.z) geo.rotateZ(rot.z)
      }
      parts.push(geo)
      colors.push(new THREE.Color(color))
    }

    // Parked on the street side of the stop, long axis along the road (local Z).
    const z = -2.15
    const bodyY = 1.05

    push(new THREE.BoxGeometry(2.15, 1.35, 5.6).translate(0, bodyY, z), HULL)
    push(new THREE.BoxGeometry(2.22, 0.22, 5.68).translate(0, 1.72, z), NAVY)
    push(new THREE.BoxGeometry(2.24, 0.16, 5.7).translate(0, 0.52, z), STRIPE)
    // Cab
    push(new THREE.BoxGeometry(2.05, 0.72, 1.15).translate(0, 1.82, z - 2.05), HULL)
    push(new THREE.BoxGeometry(1.85, 0.55, 0.06).translate(0, 1.78, z - 2.64), GLASS)
    // Side windows
    for (const wz of [-0.55, 0.75, 1.95]) {
      push(new THREE.BoxGeometry(0.05, 0.48, 0.85).translate(-1.1, 1.42, z + wz), DARK)
      push(new THREE.BoxGeometry(0.05, 0.48, 0.85).translate(1.1, 1.42, z + wz), DARK)
    }
    // Door on the courtyard side of the bus
    push(new THREE.BoxGeometry(0.08, 1.15, 0.72).translate(1.12, 1.05, z + 1.15), DARK)
    push(new THREE.BoxGeometry(0.08, 0.08, 0.72).translate(1.14, 1.62, z + 1.15), METAL)
    // Roof rails + destination board
    push(new THREE.BoxGeometry(1.7, 0.08, 4.6).translate(0, 1.92, z), METAL)
    push(new THREE.BoxGeometry(1.15, 0.22, 0.08).translate(0, 1.95, z - 2.7), AMBER)
    // Wheels
    for (const [wx, wz] of [
      [-0.92, -3.85],
      [0.92, -3.85],
      [-0.92, -0.35],
      [0.92, -0.35],
    ]) {
      push(new THREE.CylinderGeometry(0.38, 0.38, 0.22, 12).translate(wx, 0.38, z + wz + 2.15), TIRE, { rz: Math.PI / 2 })
      push(new THREE.CylinderGeometry(0.16, 0.16, 0.24, 8).translate(wx, 0.38, z + wz + 2.15), METAL, { rz: Math.PI / 2 })
    }
    // Bumper
    push(new THREE.BoxGeometry(2.05, 0.18, 0.16).translate(0, 0.42, z - 2.82), HULL_DARK)
    push(new THREE.BoxGeometry(2.05, 0.18, 0.16).translate(0, 0.42, z + 2.82), HULL_DARK)

    const merged = mergeWithColors(parts, colors)
    this.hull = new THREE.Mesh(merged, hullMaterial())
    this.hull.castShadow = true
    this.hull.receiveShadow = true
    this.group.add(this.hull)

    this.airlockLocal = new THREE.Vector3(1.35, 0.12, -1.0)
  }

  _buildShelter() {
    const parts = []
    const colors = []
    const push = (geo, color) => {
      parts.push(geo)
      colors.push(new THREE.Color(color))
    }

    // Platform toward the courtyard
    push(new THREE.BoxGeometry(3.6, 0.12, 3.4).translate(0, 0.06, 2.15), HULL)
    // Corner posts
    for (const x of [-1.55, 1.55]) {
      for (const z of [1.0, 3.35]) {
        push(new THREE.BoxGeometry(0.1, 2.35, 0.1).translate(x, 1.22, z), FRAME)
      }
    }
    // Roof
    push(new THREE.BoxGeometry(3.5, 0.1, 2.7).translate(0, 2.42, 2.2), FRAME)
    // Bench
    push(new THREE.BoxGeometry(2.15, 0.08, 0.42).translate(0, 0.58, 1.55), TRIM)
    push(new THREE.BoxGeometry(2.15, 0.38, 0.08).translate(0, 0.82, 1.32), HULL_DARK)
    for (const x of [-0.95, 0.95]) {
      push(new THREE.BoxGeometry(0.08, 0.5, 0.08).translate(x, 0.3, 1.55), METAL)
    }
    // Sign pole + board
    push(new THREE.CylinderGeometry(0.05, 0.05, 2.7, 8).translate(-1.85, 1.4, 3.15), METAL)
    push(new THREE.BoxGeometry(0.72, 0.42, 0.06).translate(-1.85, 2.55, 3.15), NAVY)
    push(new THREE.BoxGeometry(0.58, 0.12, 0.04).translate(-1.85, 2.58, 3.19), AMBER)
    // Planter
    push(new THREE.CylinderGeometry(0.22, 0.26, 0.32, 10).translate(1.45, 0.28, 3.05), 0xc47a5a)
    push(new THREE.SphereGeometry(0.28, 8, 6).translate(1.45, 0.62, 3.05), 0x4f8a4a)

    const merged = mergeWithColors(parts, colors)
    this.shelter = new THREE.Mesh(merged, hullMaterial())
    this.shelter.castShadow = true
    this.shelter.receiveShadow = true
    this.group.add(this.shelter)

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: GLASS,
      transparent: true,
      opacity: 0.26,
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.4,
      thickness: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    this.glassMaterial = glassMat
    this.glass = new THREE.Group()
    const back = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.05, 0.04), glassMat)
    back.position.set(0, 1.28, 1.02)
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.05, 2.2), glassMat)
    left.position.set(-1.55, 1.28, 2.15)
    const right = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.05, 2.2), glassMat)
    right.position.set(1.55, 1.28, 2.15)
    this.glass.add(back, left, right)
    this.group.add(this.glass)

    // Walkway from the shelter toward the courtyard — the spawn point sits at its end.
    const walk = new THREE.BoxGeometry(1.7, 0.08, 2.1)
    walk.translate(0, 0.06, 4.15)
    this.ramp = new THREE.Mesh(walk, new THREE.MeshStandardMaterial({ color: HULL, roughness: 0.65, metalness: 0.04 }))
    this.ramp.castShadow = true
    this.ramp.receiveShadow = true
    this.group.add(this.ramp)

    const strips = []
    const stripColors = []
    for (const dx of [-0.78, 0.78]) {
      const s = new THREE.BoxGeometry(0.08, 0.04, 1.9)
      s.translate(dx, 0.12, 4.15)
      strips.push(s)
      stripColors.push(new THREE.Color(TRIM))
    }
    this.stripMaterial = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: true })
    this.strips = new THREE.Mesh(mergeWithColors(strips, stripColors), this.stripMaterial)
    this.group.add(this.strips)

    this.doorLocal = new THREE.Vector3(0, 0, 5.35)
  }

  _buildLights() {
    this.beaconMaterial = new THREE.MeshBasicMaterial({ color: 0xffe2b0, toneMapped: true })
    this.beacon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), this.beaconMaterial)
    this.beacon.position.set(0, 2.62, 2.2)
    this.group.add(this.beacon)

    const pads = []
    const padColors = []
    for (const dx of [-1.15, 1.15]) {
      const l = new THREE.SphereGeometry(0.07, 8, 6)
      l.translate(dx, 2.28, 3.2)
      pads.push(l)
      padColors.push(new THREE.Color(0xffe2b0))
    }
    this.padMaterial = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: true })
    this.padLights = new THREE.Mesh(mergeWithColors(pads, padColors), this.padMaterial)
    this.group.add(this.padLights)

    const apron = new THREE.Mesh(
      new THREE.CircleGeometry(5.4, 32),
      new THREE.MeshStandardMaterial({ color: 0xc8c2b4, roughness: 0.88, transparent: true, opacity: 0.38 })
    )
    apron.rotation.x = -Math.PI / 2
    apron.position.y = 0.03
    apron.receiveShadow = true
    this.group.add(apron)
  }

  /** World position of the foot of the walk — where people appear and vanish. */
  shipDoor(out = new THREE.Vector3()) {
    this.group.updateWorldMatrix(true, false)
    return out.copy(this.doorLocal).applyMatrix4(this.group.matrixWorld)
  }

  /** World position of the bus door. */
  shipAirlock(out = new THREE.Vector3()) {
    this.group.updateWorldMatrix(true, false)
    return out.copy(this.airlockLocal).applyMatrix4(this.group.matrixWorld)
  }

  update(dt, elapsed, _night) {
    const glow = 0.85 + 0.12 * Math.sin(elapsed * 1.4)
    this.beaconMaterial.color.setRGB(1.15 * glow, 0.9 * glow, 0.62 * glow)
    this.padMaterial.color.setRGB(1.05 * glow, 0.88 * glow, 0.62 * glow)
    if (this.glassMaterial.color) this.glassMaterial.color.setRGB(0.72, 0.83, 0.9)

    this.traffic = Math.max(0, this.traffic - dt * 1.5)
    const busy = Math.min(1, this.traffic)
    const pulse = 0.75 + 0.25 * Math.sin(elapsed * 3)
    const s = 0.85 * (1 + busy * pulse * 0.5)
    this.stripMaterial.color.setRGB(0.85 * s, 0.7 * s, 0.48 * s)
  }

  ping() {
    this.traffic = Math.min(2.5, this.traffic + 1)
  }

  dispose() {
    this.group.traverse((o) => {
      if (o.isMesh) {
        o.geometry.dispose()
        o.material.dispose()
      }
    })
    this.scene.remove(this.group)
  }
}

function mergeWithColors(parts, colors) {
  parts.forEach((geo, i) => {
    if (geo.index) {
      const next = geo.toNonIndexed()
      geo.dispose()
      parts[i] = next
    }
    const g = parts[i]
    g.deleteAttribute('uv')
    g.deleteAttribute('uv1')
    g.deleteAttribute('uv2')
    const count = g.attributes.position.count
    const arr = new Float32Array(count * 3)
    const surf = new Float32Array(count * 2)
    const c = colors[i]
    const s = SURFACE.get(colors[i].getHex()) || DEFAULT_SURFACE
    for (let k = 0; k < count; k++) {
      arr[k * 3] = c.r
      arr[k * 3 + 1] = c.g
      arr[k * 3 + 2] = c.b
      surf[k * 2] = s[0]
      surf[k * 2 + 1] = s[1]
    }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3))
    g.setAttribute('aSurface', new THREE.BufferAttribute(surf, 2))
    if (!g.attributes.normal) g.computeVertexNormals()
  })
  const merged = BufferGeometryUtils.mergeGeometries(parts, false)
  parts.forEach((g) => g.dispose())
  return merged || new THREE.BoxGeometry(1, 1, 1)
}

function hullMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.55,
    metalness: 0.22,
    side: THREE.DoubleSide,
    shadowSide: THREE.BackSide,
  })
  mat.onBeforeCompile = (shader) => {
    withCurve(shader)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n attribute vec2 aSurface;\n varying vec2 vSurface;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n vSurface = aSurface;`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n varying vec2 vSurface;`)
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = vSurface.x;')
      .replace('#include <metalnessmap_fragment>', 'float metalnessFactor = vSurface.y;')
  }
  return mat
}
