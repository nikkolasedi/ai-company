const KEY = 'ai-company.office-layout.v1'

export function loadLayout() {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveLayout(layout) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(layout))
}

export function hasOverride(id) {
  return Boolean(loadLayout()[id])
}

export function poseOf(obj) {
  return {
    position: obj.position.toArray(),
    rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
    scale: obj.scale.toArray(),
  }
}

export function applyPose(obj, pose) {
  if (!pose) return
  if (pose.position) obj.position.fromArray(pose.position)
  if (pose.rotation) obj.rotation.set(pose.rotation[0], pose.rotation[1], pose.rotation[2])
  if (pose.scale) obj.scale.fromArray(pose.scale)
}

export function tagEditable(obj, id, label, blockRadius = 0) {
  obj.userData.editId = id
  obj.userData.editLabel = label
  if (blockRadius) obj.userData.blockRadius = blockRadius
  if (!obj.userData.editHome) obj.userData.editHome = poseOf(obj)
  applyPose(obj, loadLayout()[id])
  return obj
}

export function writeOverride(obj) {
  if (!obj?.userData.editId) return
  const layout = loadLayout()
  layout[obj.userData.editId] = poseOf(obj)
  saveLayout(layout)
}

export function clearOverride(id) {
  const layout = loadLayout()
  delete layout[id]
  saveLayout(layout)
}

export function clearAllOverrides() {
  saveLayout({})
}

export function collectEditables(roots) {
  const out = []
  const seen = new Set()
  for (const root of roots) {
    if (!root) continue
    root.traverse((o) => {
      if (!o.userData?.editId || seen.has(o.userData.editId)) return
      seen.add(o.userData.editId)
      out.push(o)
    })
  }
  return out
}
