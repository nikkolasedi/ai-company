import * as THREE from 'three'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import { collectEditables, writeOverride, clearOverride, clearAllOverrides, applyPose, poseOf } from './layout.js'

/**
 * In-scene layout editor: click a tagged object, then drag / rotate / scale it.
 * Camera keeps right-drag orbit and wheel zoom; left-drag is for the gizmo.
 */
export class SceneEditor {
  constructor({ camera, renderer, scene, roots, rig }) {
    this.camera = camera
    this.renderer = renderer
    this.scene = scene
    this.roots = roots
    this.rig = rig

    this.enabled = false
    this.mode = 'translate'
    this.snap = true
    this.selected = null
    this.dragging = false
    this._listeners = new Set()

    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()

    this.controls = new TransformControls(camera, renderer.domElement)
    this.controls.enabled = false
    this.controls.setMode('translate')
    this.controls.setSize(1.05)
    this._applySnap()
    this.controls.addEventListener('dragging-changed', (e) => {
      this.dragging = e.value
      if (this.rig) this.rig.interacting = e.value
      if (!e.value && this.selected) {
        writeOverride(this.selected)
        this._emit()
      }
    })
    this.controls.addEventListener('objectChange', () => this._emit())

    this.helper = this.controls.getHelper()
    this.helper.visible = false
    scene.add(this.helper)

    this._onPointer = (e) => this._pointerDown(e)
    this._onKey = (e) => this._key(e)
    renderer.domElement.addEventListener('pointerdown', this._onPointer)
    window.addEventListener('keydown', this._onKey)
  }

  onChange(fn) {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }

  _emit() {
    const info = this.getState()
    for (const fn of this._listeners) fn(info)
  }

  getState() {
    return {
      enabled: this.enabled,
      mode: this.mode,
      snap: this.snap,
      selectedId: this.selected?.userData.editId ?? null,
      selectedLabel: this.selected?.userData.editLabel ?? null,
      pose: this.selected ? poseOf(this.selected) : null,
    }
  }

  setEnabled(on) {
    this.enabled = Boolean(on)
    this.controls.enabled = this.enabled
    if (this.rig) this.rig.editLocked = this.enabled
    if (!this.enabled) this.select(null)
    this.helper.visible = this.enabled && Boolean(this.selected)
    this._emit()
  }

  setMode(mode) {
    this.mode = mode
    this.controls.setMode(mode)
    this._emit()
  }

  setSnap(on) {
    this.snap = Boolean(on)
    this._applySnap()
    this._emit()
  }

  _applySnap() {
    this.controls.setTranslationSnap(this.snap ? 0.5 : null)
    this.controls.setRotationSnap(this.snap ? THREE.MathUtils.degToRad(15) : null)
    this.controls.setScaleSnap(this.snap ? 0.1 : null)
  }

  refresh() {
    const still = this.selected && collectEditables(this.roots).some((o) => o === this.selected)
    if (!still) this.select(null)
  }

  select(obj) {
    this.selected = obj || null
    if (obj && this.enabled) {
      this.controls.attach(obj)
      this.helper.visible = true
    } else {
      this.controls.detach()
      this.helper.visible = false
    }
    this._emit()
  }

  resetSelected() {
    if (!this.selected) return
    const home = this.selected.userData.editHome
    if (home) applyPose(this.selected, home)
    clearOverride(this.selected.userData.editId)
    this._emit()
  }

  resetAll() {
    clearAllOverrides()
    for (const obj of collectEditables(this.roots)) {
      if (obj.userData.editHome) applyPose(obj, obj.userData.editHome)
    }
    this._emit()
  }

  exportJSON() {
    const layout = {}
    for (const obj of collectEditables(this.roots)) {
      layout[obj.userData.editId] = poseOf(obj)
    }
    return layout
  }

  _pointerDown(e) {
    if (!this.enabled || this.dragging) return
    if (e.button !== 0) return
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    )
    this.raycaster.setFromCamera(this.pointer, this.camera)
    if (this.helper.visible && this.raycaster.intersectObject(this.helper, true).length) return
    const editables = collectEditables(this.roots)
    const hits = this.raycaster.intersectObjects(editables, true)
    if (!hits.length) {
      this.select(null)
      return
    }
    let obj = hits[0].object
    while (obj && !obj.userData.editId) obj = obj.parent
    if (obj) this.select(obj)
  }

  _key(e) {
    if (!this.enabled) return
    const tag = e.target?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return
    if (e.key === 'w' || e.key === 'W') this.setMode('translate')
    else if (e.key === 'e' || e.key === 'E') this.setMode('rotate')
    else if (e.key === 'r' || e.key === 'R') this.setMode('scale')
    else if (e.key === 'Escape') this.select(null)
    else if (e.key === 'Backspace' || e.key === 'Delete') this.resetSelected()
  }

  dispose() {
    this.controls.detach()
    this.scene.remove(this.helper)
    this.controls.dispose()
    this.renderer.domElement.removeEventListener('pointerdown', this._onPointer)
    window.removeEventListener('keydown', this._onKey)
    this._listeners.clear()
    if (this.rig) this.rig.editLocked = false
  }
}
