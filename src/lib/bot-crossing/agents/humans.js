import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { ASSET_BASE } from '../config.js'

/**
 * Stylised office workers in place of the astronaut suit.
 *
 * Male and female are the Suit characters from Quaternius' Ultimate Modular
 * Men and Women packs (CC0). Each file already carries idle, walk, run and
 * gesture clips on the same skeleton, so nothing is retargeted.
 */

const BAKE_FPS = 30
const TEXELS_PER_BONE = 4
/** Matches the KayKit crew's on-screen height (2.2 units × 0.56) against a ~1.8m suit. */
export const HUMAN_SCALE = 0.68

const BONES = [
  ['head', ['Head']],
  ['chest', ['Chest']],
  ['hand.r', ['Wrist.R']],
  ['hand.l', ['Wrist.L']],
  ['foot.r', ['Foot.R']],
  ['foot.l', ['Foot.L']],
]

/** Colony clip key → clip baked from the character file. Several keys share one bake. */
const CLIP_SOURCE = {
  idle: 'Idle',
  idleAlt: 'Idle_Neutral',
  walk: 'Walk',
  run: 'Run',
  work: 'Interact',
  workAlt: 'Idle',
  cheer: 'Wave',
  jump: 'Run',
  wave: 'Wave',
  sitDown: 'Idle',
  sit: 'Idle',
  standUp: 'Idle',
  hit: 'HitRecieve',
  spawn: 'Idle',
  interact: 'Interact',
  phoneUp: 'Idle',
  phone: 'Idle',
  phoneDown: 'Idle',
}

const LOOPING = new Set(['Idle', 'Idle_Neutral', 'Walk', 'Run', 'Wave', 'Interact'])

const MODELS = {
  male: `${ASSET_BASE}humans/human-male.glb`,
  female: `${ASSET_BASE}humans/human-female.glb`,
}

let loading = null
let rigs = null

export function loadHumans() {
  if (!loading) loading = bakeAll().then((r) => (rigs = r))
  return loading
}

export function humanRigs() {
  return rigs
}

async function bakeAll() {
  const loader = new GLTFLoader()
  const male = await bakeBody('male', MODELS.male, loader)
  const female = await bakeBody('female', MODELS.female, loader)
  return { male, female }
}

async function bakeBody(gender, url, loader) {
  const gltf = await loader.loadAsync(url)
  const root = gltf.scene
  root.updateMatrixWorld(true)

  const meshes = []
  root.traverse((obj) => {
    if (obj.isSkinnedMesh && obj.geometry?.attributes?.position?.count) meshes.push(obj)
  })
  if (!meshes.length) throw new Error(`humans: ${gender} has no skinned mesh`)

  const boneNames = new Set(meshes[0].skeleton.bones.map((b) => b.name))
  const byName = new Map(gltf.animations.map((clip) => [clip.name, clip]))
  const clipsFor = new Map()
  for (const sourceName of new Set(Object.values(CLIP_SOURCE))) {
    const clip = byName.get(sourceName)
    if (!clip) throw new Error(`humans: ${gender} is missing clip "${sourceName}"`)
    clipsFor.set(sourceName, adaptClip(clip, boneNames))
  }

  const baked = bakeClips(root, meshes[0], clipsFor)
  const parts = meshes.map((mesh) => {
    const material = mesh.material
    if (material && !Array.isArray(material)) {
      material.roughness = 0.9
      material.metalness = 0
    }
    return {
      name: mesh.name,
      geometry: mesh.geometry,
      material,
    }
  })

  const head = new THREE.Vector3().setFromMatrixPosition(
    new THREE.Matrix4().fromArray(baked.attach, 0)
  )

  return {
    gender,
    parts,
    scale: HUMAN_SCALE,
    tilt: 0,
    headHeight: head.y * HUMAN_SCALE,
    pickSlots: BONES.map((_, i) => i),
    headSlot: 0,
    ...baked,
  }
}

function adaptClip(clip, boneNames) {
  const tracks = []
  for (const track of clip.tracks) {
    const dot = track.name.lastIndexOf('.')
    const node = track.name.slice(0, dot)
    if (!boneNames.has(node)) continue
    tracks.push(track)
  }
  if (!tracks.length) throw new Error(`humans: clip "${clip.name}" matched no bones`)
  return new THREE.AnimationClip(clip.name, clip.duration, tracks)
}

function boneIndex(bones, aliases) {
  const plain = (name) => name.replace(/[^a-z0-9]/gi, '').toLowerCase()
  for (const alias of aliases) {
    const want = plain(alias)
    const index = bones.findIndex((bone) => {
      const got = plain(bone.name)
      return got === want || got.endsWith(want)
    })
    if (index >= 0) return index
  }
  return -1
}

function bakeClips(root, mesh, clipsFor) {
  const skeleton = mesh.skeleton
  const boneCount = skeleton.bones.length
  const attachBones = BONES.map(([, aliases]) => boneIndex(skeleton.bones, aliases))
  const missing = BONES.filter((_, i) => attachBones[i] < 0).map(([name]) => name)
  if (missing.length) throw new Error(`humans: missing bones ${missing.join(', ')}`)

  const bakedSources = {}
  let frameCount = 0
  for (const [sourceName, clip] of clipsFor) {
    const frames = Math.max(2, Math.round(clip.duration * BAKE_FPS) + 1)
    bakedSources[sourceName] = {
      start: frameCount,
      frames,
      duration: clip.duration,
      loop: LOOPING.has(sourceName),
      clip,
    }
    frameCount += frames
  }

  const clips = {}
  for (const [key, sourceName] of Object.entries(CLIP_SOURCE)) {
    const source = bakedSources[sourceName]
    clips[key] = {
      start: source.start,
      frames: source.frames,
      duration: source.duration,
      loop: source.loop,
      name: sourceName,
    }
  }

  const stride = boneCount * TEXELS_PER_BONE * 4
  const data = new Float32Array(frameCount * stride)
  const attach = new Float32Array(frameCount * BONES.length * 16)
  const mixer = new THREE.AnimationMixer(root)
  const scratch = new THREE.Matrix4()
  const bind = mesh.bindMatrix
  const pre = new THREE.Matrix4().multiplyMatrices(mesh.matrixWorld, mesh.bindMatrixInverse)

  for (const source of Object.values(bakedSources)) {
    const action = mixer.clipAction(source.clip)
    action.play()
    for (let f = 0; f < source.frames; f++) {
      const raw = source.frames > 1 ? (f / (source.frames - 1)) * source.duration : 0
      const t = source.loop ? raw : Math.min(raw, Math.max(0, source.duration - 1e-3))
      mixer.setTime(t)
      root.updateMatrixWorld(true)
      skeleton.update()

      const offset = (source.start + f) * stride
      for (let b = 0; b < boneCount; b++) {
        scratch.fromArray(skeleton.boneMatrices, b * 16)
        scratch.premultiply(pre).multiply(bind)
        scratch.toArray(data, offset + b * 16)
      }
      const attachOffset = (source.start + f) * BONES.length * 16
      attachBones.forEach((bone, slot) => {
        skeleton.bones[bone].matrixWorld.toArray(attach, attachOffset + slot * 16)
      })
    }
    action.stop()
  }

  const texture = new THREE.DataTexture(
    data,
    boneCount * TEXELS_PER_BONE,
    frameCount,
    THREE.RGBAFormat,
    THREE.FloatType
  )
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true

  mixer.stopAllAction()
  return {
    boneTexture: texture,
    attach,
    boneCount,
    frameCount,
    clips,
  }
}
