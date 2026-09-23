import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'
import { mulberry } from './planet.js'

/**
 * Office-park grounds around the hex courtyard: a street to the shuttle,
 * lawn trees, hedges, and a few neighbouring buildings.
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

function tree(x, z, scale, rand) {
  const parts = []
  const trunk = new THREE.CylinderGeometry(0.18 * scale, 0.28 * scale, 2.2 * scale, 7)
  trunk.translate(x, 1.1 * scale, z)
  parts.push(paint(trunk, 0x6b4a2a))
  const layers = 3
  for (let i = 0; i < layers; i++) {
    const r = (1.4 - i * 0.28) * scale
    const canopy = new THREE.SphereGeometry(r, 8, 6)
    canopy.translate(x + (rand() - 0.5) * 0.2, (2.1 + i * 0.85) * scale, z + (rand() - 0.5) * 0.2)
    parts.push(paint(canopy, i % 2 ? 0x3f7a38 : 0x4f8f44))
  }
  return merge(parts)
}

function building(x, z, w, d, h, yaw, color) {
  const parts = []
  const body = new THREE.BoxGeometry(w, h, d)
  body.rotateY(yaw)
  body.translate(x, h / 2, z)
  parts.push(paint(body, color))
  const roof = new THREE.BoxGeometry(w + 0.4, 0.22, d + 0.4)
  roof.rotateY(yaw)
  roof.translate(x, h + 0.1, z)
  parts.push(paint(roof, 0x5a5348))
  const rows = Math.max(2, Math.floor(h / 3.2))
  const cols = Math.max(2, Math.floor(w / 3.4))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lx = (c - (cols - 1) / 2) * 2.6
      const ly = 1.6 + r * 2.8
      if (ly > h - 1.1) continue
      const pane = new THREE.BoxGeometry(1.1, 1.15, 0.08)
      pane.rotateY(yaw)
      pane.translate(x + Math.cos(yaw) * lx + Math.sin(yaw) * (d / 2 + 0.02), ly, z - Math.sin(yaw) * lx + Math.cos(yaw) * (d / 2 + 0.02))
      parts.push(paint(pane, 0x8eb4cc))
    }
  }
  return merge(parts)
}

function lamp(x, z, yaw) {
  const parts = []
  const pole = new THREE.CylinderGeometry(0.06, 0.08, 3.4, 6)
  pole.translate(x, 1.7, z)
  parts.push(paint(pole, 0x6a6660))
  const arm = new THREE.BoxGeometry(0.08, 0.08, 1.1)
  arm.rotateY(yaw)
  arm.translate(x + Math.sin(yaw) * 0.45, 3.35, z + Math.cos(yaw) * 0.45)
  parts.push(paint(arm, 0x6a6660))
  const head = new THREE.BoxGeometry(0.28, 0.1, 0.36)
  head.rotateY(yaw)
  head.translate(x + Math.sin(yaw) * 0.9, 3.28, z + Math.cos(yaw) * 0.9)
  parts.push(paint(head, 0xf0d9a8))
  return merge(parts)
}

function car(x, z, yaw, color) {
  const parts = []
  const body = new THREE.BoxGeometry(1.7, 0.45, 0.85)
  body.rotateY(yaw)
  body.translate(x, 0.38, z)
  parts.push(paint(body, color))
  const cabin = new THREE.BoxGeometry(0.85, 0.35, 0.78)
  cabin.rotateY(yaw)
  cabin.translate(x - 0.15, 0.72, z)
  parts.push(paint(cabin, 0xb8c8d4))
  return merge(parts)
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
  const road = new THREE.BoxGeometry(8.2, 0.18, 46)
  road.rotateY(yaw)
  road.translate(ship.x + dir.x * 8, 0.16, ship.z + dir.z * 8)
  paint(road, 0x3a3c42)

  const dashParts = []
  for (let i = -4; i < 8; i++) {
    const dash = new THREE.BoxGeometry(0.18, 0.04, 1.4)
    dash.rotateY(yaw)
    dash.translate(ship.x + dir.x * (i * 3.2 + 2), 0.22, ship.z + dir.z * (i * 3.2 + 2))
    dashParts.push(paint(dash, 0xe8d36a))
  }

  const walk = new THREE.BoxGeometry(3.4, 0.1, 18)
  walk.rotateY(yaw)
  walk.translate(ship.x - dir.x * 2, 0.14, ship.z - dir.z * 2)
  paint(walk, 0xc8c2b4)

  const roadMesh = new THREE.Mesh(merge([road, ...dashParts, walk]), new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.82,
    metalness: 0.04,
  }))
  roadMesh.receiveShadow = true
  group.add(roadMesh)

  const obstacles = [{ x: ship.x, z: ship.z, r: 6.4 }]
  for (let i = 0; i < 10; i++) {
    obstacles.push({
      x: ship.x + dir.x * (i * 4.4 + 2),
      z: ship.z + dir.z * (i * 4.4 + 2),
      r: 4.6,
    })
  }
  const treeParts = []
  const treeSpots = [
    [38, 22], [44, -18], [-40, 26], [-46, -20], [32, -36], [-34, 40],
    [52, 10], [-54, -8], [28, 48], [-26, -46], [58, -28], [-20, 54],
  ]
  for (const [x, z] of treeSpots) {
    if (Math.hypot(x - ship.x, z - ship.z) < 14) continue
    treeParts.push(tree(x, z, 1.4 + rand() * 1.0, rand))
    obstacles.push({ x, z, r: 1.1 })
  }
  if (treeParts.length) {
    const trees = new THREE.Mesh(merge(treeParts), new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0,
    }))
    trees.castShadow = true
    trees.receiveShadow = true
    group.add(trees)
  }

  const hedgeParts = []
  for (let i = 0; i < 10; i++) {
    const t = i / 9
    const hx = side.x * (28 + t * 10) + dir.x * (6 + t * 8)
    const hz = side.z * (28 + t * 10) + dir.z * (6 + t * 8)
    const bush = new THREE.SphereGeometry(0.7 + rand() * 0.25, 7, 5)
    bush.translate(hx, 0.55, hz)
    hedgeParts.push(paint(bush, 0x3d7a38))
    obstacles.push({ x: hx, z: hz, r: 0.7 })
  }
  if (hedgeParts.length) {
    const hedges = new THREE.Mesh(merge(hedgeParts), new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
    }))
    hedges.castShadow = true
    group.add(hedges)
  }

  const facade = [0xd8cfc2, 0xc5cdd6, 0xe2d6c4, 0xc8d0c4, 0xd4c8bc]
  const buildingParts = []
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
    buildingParts.push(building(x, z, s.w, s.dep, s.h, s.a + Math.PI / 2, facade[i % facade.length]))
    obstacles.push({ x, z, r: Math.max(s.w, s.dep) * 0.62 })
  })
  const offices = new THREE.Mesh(merge(buildingParts), new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.7,
    metalness: 0.06,
  }))
  offices.castShadow = true
  offices.receiveShadow = true
  group.add(offices)

  const carA = { x: ship.x + side.x * 6.2 + dir.x * 14, z: ship.z + side.z * 6.2 + dir.z * 14 }
  const carB = { x: ship.x - side.x * 6.2 + dir.x * 18, z: ship.z - side.z * 6.2 + dir.z * 18 }
  const carParts = [
    car(carA.x, carA.z, yaw, 0xc96442),
    car(carB.x, carB.z, yaw + 0.04, 0x3a5a8c),
  ]
  const cars = new THREE.Mesh(merge(carParts), new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.45,
    metalness: 0.25,
  }))
  cars.castShadow = true
  group.add(cars)
  obstacles.push({ x: carA.x, z: carA.z, r: 1.4 }, { x: carB.x, z: carB.z, r: 1.4 })

  const lampParts = []
  for (const t of [6, 16, 26, 36]) {
    lampParts.push(lamp(ship.x + dir.x * t + side.x * 4.4, ship.z + dir.z * t + side.z * 4.4, yaw))
    lampParts.push(lamp(ship.x + dir.x * t - side.x * 4.4, ship.z + dir.z * t - side.z * 4.4, yaw + Math.PI))
  }
  const lamps = new THREE.Mesh(merge(lampParts), new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.45,
    metalness: 0.2,
  }))
  lamps.castShadow = true
  group.add(lamps)

  group.userData.obstacles = obstacles
  return group
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
