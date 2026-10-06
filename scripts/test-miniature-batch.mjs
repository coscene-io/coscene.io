import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { batchMiniature } from '../src/robot-data-miniature-batch.ts'

test('static batching preserves placements and leaves source resources owned by callers', () => {
  const root = new THREE.Group(), geometry = new THREE.BoxGeometry(1, 1, 1)
  const first = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: '#334455' }))
  const second = new THREE.Mesh(geometry, first.material.clone())
  first.position.x = -2; second.position.x = 2; root.position.z = 3
  root.add(first, second)
  let sourceDisposed = false
  geometry.addEventListener('dispose', () => { sourceDisposed = true })
  const result = batchMiniature([{ root, placement: new THREE.Matrix4().makeTranslation(10, 0, 0) }])
  assert.equal(result.root.children.length, 1)
  assert.equal(result.root.userData.batching.sourceMeshes, 2)
  const bounds = new THREE.Box3().setFromObject(result.root)
  assert.deepEqual(bounds.min.toArray(), [7.5, -.5, 2.5])
  assert.deepEqual(bounds.max.toArray(), [12.5, .5, 3.5])
  assert.equal(root.children.length, 2)
  result.dispose()
  assert.equal(sourceDisposed, false)
  geometry.dispose(); first.material.dispose(); second.material.dispose()
})

test('mirrored geometry retains front-face winding and transformed normals', () => {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3))
  geometry.computeVertexNormals()
  const source = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial())
  source.scale.x = -1
  const result = batchMiniature([{ root: source }]), combined = result.root.children[0].geometry
  const p = combined.getAttribute('position'), i = combined.index
  const points = [0, 1, 2].map(n => new THREE.Vector3().fromBufferAttribute(p, i.getX(n)))
  const normal = points[1].sub(points[0]).cross(points[2].sub(points[0])).normalize()
  assert.ok(normal.dot(new THREE.Vector3().fromBufferAttribute(combined.getAttribute('normal'), 0)) > .999)
  result.dispose(); geometry.dispose(); source.material.dispose()
})

test('different materials and transparent surfaces are not combined', () => {
  const root = new THREE.Group(), geometry = new THREE.BoxGeometry(1, 1, 1)
  const materials = [new THREE.MeshStandardMaterial({ roughness: .2 }), new THREE.MeshStandardMaterial({ roughness: .8 }), new THREE.MeshStandardMaterial({ transparent: true, opacity: .5 })]
  materials.forEach((material, i) => { const mesh = new THREE.Mesh(geometry, material); mesh.position.x = i * 2; root.add(mesh) })
  const hidden = new THREE.Group(); hidden.visible = false; hidden.add(new THREE.Mesh(geometry, materials[0])); root.add(hidden)
  const result = batchMiniature([{ root }])
  assert.equal(result.root.children.length, 3)
  assert.equal(result.root.userData.batching.sourceMeshes, 3)
  assert.equal(result.root.children.filter(n => n.material.transparent).length, 1)
  result.dispose(); geometry.dispose(); materials.forEach(m => m.dispose())
})
