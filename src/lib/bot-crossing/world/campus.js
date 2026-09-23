import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'
import { mulberry } from './planet.js'
import { tagEditable } from '../editor/layout.js'

/**
 * Office-park grounds around the hex courtyard. Each prop is its own mesh so
 * the in-scene editor can drag, rotate and scale it.
 */

function merge(parts) {
  const prepared = parts.map((g) => {
    const geo = g.index ? g.toNonIndexed() : g
    geo.deleteAttribute('uv')
    geo.deleteAttribute('uv1')
    geo.deleteAttribute('uv2')
    return geo
  })
  const geo = BufferGeometryUtils.mergeGeometries(prepared, false)
  parts.forEach((g) => g.dispose())
  return geo || new THREE.BoxGeometry(1, 1, 1)
}

function paint(geo, color) {
  const c = new THREE.Color(color)
  const n = geo.attributes.position.count
  const arr = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r
    arr[i * 3 + 1] = c.g
    arr[i * 3 + 2] = c.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3))
  if (!geo.attributes.normal) geo.computeVertexNormals()
  return geo
}

function treeGeometry(scale, rand) {
  const parts = []
  const trunk = new THREE.CylinderGeometry(0.18 * scale, 0.28 * scale, 2.2 * scale, 7)
  trunk.translate(0, 1.1 * scale, 0)
  parts.push(paint(trunk, 0x6b4a2a))
  for (let i = 0; i < 3; i++) {
    const r = (1.4 - i * 0.28) * scale
    const canopy = new THREE.SphereGeometry(r, 8, 6)
    canopy.translate((rand() - 0.5) * 0.2, (2.1 + i * 0.85) * scale, (rand() - 0.5) * 0.2)
    parts.push(paint(canopy, i % 2 ? 0x3f7a38 : 0x4f8f44))
  }
  return merge(parts)
}

function buildingGeometry(w, d, h, color) {
  const parts = []
  parts.push(paint(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), color))
  parts.push(paint(new THREE.BoxGeometry(w + 0.4, 0.22, d + 0.4).translate(0, h + 0.1, 0), 0x5a5348))
  const rows = Math.max(2, Math.floor(h / 3.2))
  const cols = Math.max(2, Math.floor(w / 3.4))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lx = (c - (cols - 1) / 2) * 2.6
      const ly = 1.6 + r * 2.8
      if (ly > h - 1.1) continue
      parts.push(paint(new THREE.BoxGeometry(1.1, 1.15, 0.08).translate(lx, ly, d / 2 + 0.02), 0x8eb4cc))
    }
  }
  return merge(parts)
}

function lampGeometry() {
  const parts = []
  parts.push(paint(new THREE.CylinderGeometry(0.06, 0.08, 3.4, 6).translate(0, 1.7, 0), 0x6a6660))
  parts.push(paint(new THREE.BoxGeometry(0.08, 0.08, 1.1).translate(0, 3.35, 0.45), 0x6a6660))
  parts.push(paint(new THREE.BoxGeometry(0.28, 0.1, 0.36).translate(0, 3.28, 0.9), 0xf0d9a8))
  return merge(parts)
}

function carGeometry(color) {
  const parts = []
  parts.push(paint(new THREE.BoxGeometry(1.7, 0.45, 0.85).translate(0, 0.38, 0), color))
  parts.push(paint(new THREE.BoxGeometry(0.85, 0.35, 0.78).translate(-0.15, 0.72, 0), 0xb8c8d4))
  return merge(parts)
}

function streetGeometry(length = 46) {
  const parts = []
  parts.push(paint(new THREE.BoxGeometry(8.2, 0.18, length), 0x3a3c42))
  for (let i = -4; i < 8; i++) {
    parts.push(paint(new THREE.BoxGeometry(0.18, 0.04, 1.4).translate(0, 0.08, i * 3.2 + 2), 0xe8d36a))
  }
  return merge(parts)
}

function addMesh(group, geo, matProps, pose, id, label, radius) {
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial(matProps))
  mesh.position.set(pose.x || 0, pose.y || 0, pose.z || 0)
  mesh.rotation.y = pose.yaw || 0
  mesh.castShadow = true
  mesh.receiveShadow = true
  tagEditable(mesh, id, label, radius)
  group.add(mesh)
  return mesh
}

export function createCampus(ship) {
  const group = new THREE.Group()
  group.name = 'campus'
  const rand = mulberry(2026)
  const dir = new THREE.Vector3(ship.x, 0, ship.z)
  if (dir.lengthSq() < 0.01) dir.set(-1, 0, 0.4)
  dir.normalize()
  const side = new THREE.Vector3(-dir.z, 0, dir.x)
  const yaw = Math.atan2(dir.x, dir.z)
  const foliage = { vertexColors: true, roughness: 0.88, metalness: 0 }
  const stone = { vertexColors: true, roughness: 0.7, metalness: 0.06 }

  addMesh(
    group,
    streetGeometry(46),
    { vertexColors: true, roughness: 0.82, metalness: 0.04 },
    { x: ship.x + dir.x * 8, y: 0.16, z: ship.z + dir.z * 8, yaw },
    'campus:street',
    'Street',
    4.6
  )
  addMesh(
    group,
    paint(new THREE.BoxGeometry(3.4, 0.1, 18), 0xc8c2b4),
    { vertexColors: true, roughness: 0.78, metalness: 0.02 },
    { x: ship.x - dir.x * 2, y: 0.14, z: ship.z - dir.z * 2, yaw },
    'campus:path',
    'Walkway',
    2.2
  )

  const treeSpots = [
    [38, 22], [44, -18], [-40, 26], [-46, -20], [32, -36], [-34, 40],
    [52, 10], [-54, -8], [28, 48], [-26, -46], [58, -28], [-20, 54],
  ]
  let treeI = 0
  for (const [x, z] of treeSpots) {
    if (Math.hypot(x - ship.x, z - ship.z) < 14) continue
    addMesh(group, treeGeometry(1.4 + rand() * 1.0, rand), foliage, { x, z }, `campus:tree:${treeI}`, `Tree ${treeI + 1}`, 1.1)
    treeI++
  }

  for (let i = 0; i < 10; i++) {
    const t = i / 9
    const hx = side.x * (28 + t * 10) + dir.x * (6 + t * 8)
    const hz = side.z * (28 + t * 10) + dir.z * (6 + t * 8)
    const bush = paint(new THREE.SphereGeometry(0.7 + rand() * 0.25, 7, 5).translate(0, 0.55, 0), 0x3d7a38)
    addMesh(group, bush, foliage, { x: hx, z: hz }, `campus:hedge:${i}`, `Hedge ${i + 1}`, 0.7)
  }

  const facade = [0xd8cfc2, 0xc5cdd6, 0xe2d6c4, 0xc8d0c4, 0xd4c8bc]
  const sites = [
    { a: 0.7, d: 62, w: 14, dep: 10, h: 10 },
    { a: 2.1, d: 68, w: 12, dep: 9, h: 13 },
    { a: 3.5, d: 64, w: 16, dep: 11, h: 9 },
    { a: 4.8, d: 70, w: 11, dep: 8, h: 15 },
    { a: 5.7, d: 58, w: 13, dep: 9, h: 8 },
  ]
  sites.forEach((s, i) => {
    const x = Math.cos(s.a) * s.d
    const z = Math.sin(s.a) * s.d
    addMesh(
      group,
      buildingGeometry(s.w, s.dep, s.h, facade[i % facade.length]),
      stone,
      { x, z, yaw: s.a + Math.PI / 2 },
      `campus:office:${i}`,
      `Office ${i + 1}`,
      Math.max(s.w, s.dep) * 0.62
    )
  })

  const carA = { x: ship.x + side.x * 6.2 + dir.x * 14, z: ship.z + side.z * 6.2 + dir.z * 14 }
  const carB = { x: ship.x - side.x * 6.2 + dir.x * 18, z: ship.z - side.z * 6.2 + dir.z * 18 }
  addMesh(group, carGeometry(0xc96442), { vertexColors: true, roughness: 0.45, metalness: 0.25 }, { ...carA, yaw }, 'campus:car:0', 'Car 1', 1.4)
  addMesh(group, carGeometry(0x3a5a8c), { vertexColors: true, roughness: 0.45, metalness: 0.25 }, { ...carB, yaw: yaw + 0.04 }, 'campus:car:1', 'Car 2', 1.4)

  let lampI = 0
  for (const t of [6, 16, 26, 36]) {
    addMesh(group, lampGeometry(), { vertexColors: true, roughness: 0.45, metalness: 0.2 }, {
      x: ship.x + dir.x * t + side.x * 4.4,
      z: ship.z + dir.z * t + side.z * 4.4,
      yaw,
    }, `campus:lamp:${lampI}`, `Lamp ${lampI + 1}`, 0.4)
    lampI++
    addMesh(group, lampGeometry(), { vertexColors: true, roughness: 0.45, metalness: 0.2 }, {
      x: ship.x + dir.x * t - side.x * 4.4,
      z: ship.z + dir.z * t - side.z * 4.4,
      yaw: yaw + Math.PI,
    }, `campus:lamp:${lampI}`, `Lamp ${lampI + 1}`, 0.4)
    lampI++
  }

  group.userData.obstacles = campusObstacles(group)
  return group
}

export function campusObstacles(group) {
  const list = []
  if (!group) return list
  group.traverse((o) => {
    if (!o.userData?.blockRadius) return
    list.push({
      x: o.position.x,
      z: o.position.z,
      r: o.userData.blockRadius * Math.max(o.scale.x, o.scale.z),
    })
  })
  return list
}

export function disposeCampus(group) {
  if (!group) return
  group.traverse((o) => {
    if (o.isMesh) {
      o.geometry.dispose()
      o.material.dispose()
    }
  })
}
