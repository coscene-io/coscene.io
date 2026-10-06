import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

type Source = { root: THREE.Object3D; placement?: THREE.Matrix4 }

// Bake static poses only. Close-view joints, task objects and cutaway walls stay editable.
export function batchMiniature(sources: Source[]) {
  const root = new THREE.Group()
  root.name = 'overview_static_batches'
  const owned: THREE.BufferGeometry[] = []
  const meta = { textures: {}, images: {} }
  const appearances = new Map<THREE.Material, string>()
  const batches = new Map<string, { parts: THREE.BufferGeometry[]; mesh: THREE.Mesh }>()
  let sourceMeshes = 0
  for (const { root: source, placement = new THREE.Matrix4() } of sources) {
    source.updateWorldMatrix(true, true)
    const basis = placement.clone().multiply(source.matrix).multiply(source.matrixWorld.clone().invert())
    source.traverseVisible(node => {
      if (!(node instanceof THREE.Mesh)) return
      sourceMeshes++
      const transform = basis.clone().multiply(node.matrixWorld)
      const material = node.material
      if (Array.isArray(material) || material.transparent || material.clippingPlanes?.length || node instanceof THREE.SkinnedMesh || Object.keys(node.geometry.morphAttributes).length || Number.isFinite(node.geometry.drawRange.count)) {
        const copy = node.clone(false)
        copy.matrix.copy(transform); copy.matrixAutoUpdate = false
        root.add(copy)
        return
      }
      let appearance = appearances.get(material)
      if (!appearance) {
        const json: Partial<ReturnType<THREE.Material['toJSON']>> = material.toJSON(meta)
        delete json.uuid; delete json.name; delete json.userData; delete json.metadata
        appearance = JSON.stringify(json)
        appearances.set(material, appearance)
      }
      const geometry: THREE.BufferGeometry = node.geometry.clone()
      // Preserve transformed normals without re-quantizing source integer attributes.
      for (const name of ['position', 'normal', 'tangent']) {
        const attribute = geometry.getAttribute(name)
        if (!attribute || attribute.array instanceof Float32Array) continue
        const values = new Float32Array(attribute.count * attribute.itemSize)
        for (let i = 0; i < attribute.count; i++) for (let c = 0; c < attribute.itemSize; c++) values[i * attribute.itemSize + c] = attribute.getComponent(i, c)
        geometry.setAttribute(name, new THREE.Float32BufferAttribute(values, attribute.itemSize))
      }
      geometry.applyMatrix4(transform)
      if (!geometry.index) geometry.setIndex(Array.from({ length: geometry.getAttribute('position').count }, (_, i) => i))
      if (transform.determinant() < 0) {
        const index = geometry.index!
        for (let i = 0; i < index.count; i += 3) { const a = index.getX(i); index.setX(i, index.getX(i + 1)); index.setX(i + 1, a) }
        const tangent = geometry.getAttribute('tangent')
        if (tangent) for (let i = 0; i < tangent.count; i++) tangent.setW(i, -tangent.getW(i))
      }
      geometry.clearGroups()
      const attributes = Object.entries(geometry.attributes).sort(([a], [b]) => a.localeCompare(b)).map(([name, a]) => [name, a.itemSize, a.normalized, a.array.constructor.name])
      const key = JSON.stringify([appearance, attributes, node.castShadow, node.receiveShadow, node.renderOrder])
      const batch = batches.get(key) ?? { parts: [] as THREE.BufferGeometry[], mesh: node }
      batch.parts.push(geometry); batches.set(key, batch)
    })
  }
  for (const { parts, mesh } of batches.values()) {
    const geometry = mergeGeometries(parts)
    parts.forEach(part => part.dispose())
    if (!geometry) throw new Error('Static miniature geometry could not be combined')
    owned.push(geometry)
    const combined = new THREE.Mesh(geometry, mesh.material)
    combined.castShadow = mesh.castShadow; combined.receiveShadow = mesh.receiveShadow
    combined.renderOrder = mesh.renderOrder
    root.add(combined)
  }
  root.userData.batching = { sourceMeshes, drawMeshes: root.children.length }
  return { root, dispose: () => owned.forEach(geometry => geometry.dispose()) }
}
