import * as THREE from 'three'
import { withCurve } from '../core/curve.js'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'

/**
 * The glass lobby. People walk out of the doors when a thread appears and back in
 * when one is archived — same door API the lander used to own.
 */

const HULL = 0xf4efe6
const HULL_DARK = 0xd8cfc2
const TRIM = 0xc4a574
const METAL = 0x9a9086
const GLASS = 0xb7d4ea
const FRAME = 0xe8ece8

/** Roughness / metalness per material, so the hull reads as painted panel over bare strut. */
const SURFACE = new Map([
  [HULL, [0.48, 0.05]],
  [HULL_DARK, [0.62, 0.08]],
  [TRIM, [0.45, 0.1]],
  [METAL, [0.26, 0.95]],
  [GLASS, [0.08, 0.02]],
  [FRAME, [0.42, 0.12]],
  [0x4a4d55, [0.35, 0.85]],
])
const DEFAULT_SURFACE = [0.55, 0.15]

export class Ship {
  constructor(scene, position) {
    this.group = new THREE.Group()
    this.group.position.copy(position)
    // Turned so the ramp points back toward the middle of the colony.
    this.group.rotation.y = Math.atan2(-position.x, -position.z)
    this.group.name = 'ship'
    scene.add(this.group)
    this.scene = scene

    this._buildHull()
    this._buildRamp() // sets doorLocal from where the ramp actually lands
    this._buildLights()

    this.traffic = 0 // ramps glow brighter while astronauts are using them
  }

  _buildHull() {
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

    this.footRadius = 3.2
    const w = 3.4
    const d = 3.1
    const h = 3.2

    // Floor slab
    push(new THREE.BoxGeometry(w + 0.4, 0.16, d + 0.4).translate(0, 0.08, 0), HULL)
    // Roof
    push(new THREE.BoxGeometry(w + 0.5, 0.14, d + 0.5).translate(0, h, 0), FRAME)
    // Corner posts
    for (const x of [-w / 2, w / 2]) {
      for (const z of [-d / 2, d / 2]) {
        push(new THREE.BoxGeometry(0.16, h, 0.16).translate(x, h / 2, z), FRAME)
      }
    }
    // Side lintels
    push(new THREE.BoxGeometry(w, 0.14, 0.14).translate(0, h - 0.1, d / 2), FRAME)
    push(new THREE.BoxGeometry(w, 0.14, 0.14).translate(0, h - 0.1, -d / 2), FRAME)
    // Reception desk facing the doors
    push(new THREE.BoxGeometry(1.6, 0.08, 0.55).translate(0, 0.92, -0.35), TRIM)
    push(new THREE.BoxGeometry(1.45, 0.82, 0.48).translate(0, 0.45, -0.35), HULL_DARK)
    // Planter
    push(new THREE.CylinderGeometry(0.22, 0.26, 0.32, 10).translate(-1.15, 0.28, 0.85), 0xc47a5a)
    push(new THREE.SphereGeometry(0.28, 8, 6).translate(-1.15, 0.62, 0.85), 0x4f8a4a)
    // Sign band
    push(new THREE.BoxGeometry(1.4, 0.22, 0.06).translate(0, 2.55, d / 2 + 0.08), TRIM)

    const merged = mergeWithColors(parts, colors)
    this.hull = new THREE.Mesh(merged, hullMaterial())
    this.hull.castShadow = true
    this.hull.receiveShadow = true
    this.group.add(this.hull)

    // Glass walls — opening on +Z for the doors
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: GLASS,
      transparent: true,
      opacity: 0.28,
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.45,
      thickness: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const panes = [
      [w, h - 0.3, 0.04, 0, h / 2, -d / 2],
      [0.04, h - 0.3, d, -w / 2, h / 2, 0],
      [0.04, h - 0.3, d, w / 2, h / 2, 0],
    ]
    this.glassMaterial = glassMat
    this.glass = new THREE.Group()
    for (const [gw, gh, gd, x, y, z] of panes) {
      const pane = new THREE.Mesh(new THREE.BoxGeometry(gw, gh, gd), glassMat)
      pane.position.set(x, y, z)
      this.glass.add(pane)
    }
    this.group.add(this.glass)

    const opening = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 2.2),
      new THREE.MeshBasicMaterial({ color: 0x1a1c22, toneMapped: false, side: THREE.DoubleSide })
    )
    opening.position.set(0, 1.15, d / 2 - 0.12)
    this.group.add(opening)
  }

  /**
   * The ramp runs from the lip of the airlock down to the ground. Its length and angle are
   * solved from those two points rather than set by hand, so it always meets both.
   */
  _buildRamp() {
    const footZ = 4.4
    const walk = new THREE.BoxGeometry(1.8, 0.1, 2.4)
    walk.translate(0, 0.08, 2.7)
    const mat = new THREE.MeshStandardMaterial({ color: HULL, roughness: 0.65, metalness: 0.04 })
    this.ramp = new THREE.Mesh(walk, mat)
    this.ramp.castShadow = true
    this.ramp.receiveShadow = true
    this.group.add(this.ramp)

    const strips = []
    const stripColors = []
    for (const dx of [-0.82, 0.82]) {
      const s = new THREE.BoxGeometry(0.08, 0.04, 2.2)
      s.translate(dx, 0.14, 2.7)
      strips.push(s)
      stripColors.push(new THREE.Color(TRIM))
    }
    this.stripMaterial = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: true })
    this.strips = new THREE.Mesh(mergeWithColors(strips, stripColors), this.stripMaterial)
    this.group.add(this.strips)

    this.doorLocal = new THREE.Vector3(0, 0, footZ + 0.4)
    this.airlockLocal = new THREE.Vector3(0, 0.12, 1.35)
  }

  _buildLights() {
    this.beaconMaterial = new THREE.MeshBasicMaterial({ color: 0xffe2b0, toneMapped: true })
    this.beacon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), this.beaconMaterial)
    this.beacon.position.set(0, 3.05, 0)
    this.group.add(this.beacon)

    const pads = []
    const padColors = []
    for (const dx of [-1.1, 1.1]) {
      const l = new THREE.SphereGeometry(0.08, 8, 6)
      l.translate(dx, 2.15, 1.55)
      pads.push(l)
      padColors.push(new THREE.Color(0xffe2b0))
    }
    this.padMaterial = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: true })
    this.padLights = new THREE.Mesh(mergeWithColors(pads, padColors), this.padMaterial)
    this.group.add(this.padLights)

    const apron = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, 32),
      new THREE.MeshStandardMaterial({ color: 0xd8cbb4, roughness: 0.85, transparent: true, opacity: 0.45 })
    )
    apron.rotation.x = -Math.PI / 2
    apron.position.y = 0.04
    apron.receiveShadow = true
    this.group.add(apron)
  }

  /** World position of the foot of the ramp — where astronauts appear and vanish. */
  shipDoor(out = new THREE.Vector3()) {
    // The first roster can arrive before the first frame, when the group's world matrix
    // is still the identity — and the door would be at the world origin, in the middle of
    // the colony, which is where a whole crew once appeared from.
    this.group.updateWorldMatrix(true, false)
    return out.copy(this.doorLocal).applyMatrix4(this.group.matrixWorld)
  }

  /** World position of the airlock at the top of the ramp. */
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

  /** Called when an astronaut uses the ramp, so the lights react. */
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

/**
 * Merge a set of geometries, baking one flat colour per part into vertex colours — plus the
 * roughness and metalness that colour implies, so a single merged hull can hold painted
 * panel, bare strut and glass and have each behave correctly under the environment map.
 */
function mergeWithColors(parts, colors) {
  parts.forEach((geo, i) => {
    const count = geo.attributes.position.count
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
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3))
    geo.setAttribute('aSurface', new THREE.BufferAttribute(surf, 2))
    geo.deleteAttribute('uv')
    if (!geo.attributes.normal) geo.computeVertexNormals()
  })
  const merged = BufferGeometryUtils.mergeGeometries(parts, false)
  parts.forEach((g) => g.dispose())
  return merged
}

/** The hull material: per-vertex PBR, and double-sided so the engine bell and the airlock
 *  collar — both open tubes — show their insides instead of vanishing. */
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
