import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { SceneDefinition, Vec3 } from './robot-data-miniature-catalog'

export type WorkSurface = { center: Vec3; width: number; depth: number }

// Shared construction for the two new rooms; existing approved interiors stay untouched.
export function roomKit(scene: SceneDefinition, wood: THREE.Texture, normal: THREE.Texture) {
  const root = new THREE.Group(); root.name = scene.id
  const geometries: THREE.BufferGeometry[] = [], materials: THREE.Material[] = []
  const material = (color: string, roughness = .78, metalness = 0) => {
    const value = new THREE.MeshStandardMaterial({ color, roughness, metalness }); materials.push(value); return value
  }
  const M = {
    wall: material('#eef0eb'), floor: material('#d5dcd7'), base: material('#89958f'),
    white: material('#f1f2ed', .5), wood: material('#c6af8e', .68), ink: material('#293638'),
    green: material('#5d7e6e'), blue: material('#587f99'), fabric: material('#a3b8b8', .95),
    metal: material('#b9c5c6', .28, .7), rubber: material('#384044'), paper: material('#e3e5d9'),
    red: material('#bd6556'), yellow: material('#c6b55e'), leaf: material('#64814f'),
  }
  M.wood.map = wood; M.wood.normalMap = normal; M.wood.normalScale.set(.12, .12)
  const mesh = (geometry: THREE.BufferGeometry, mat: THREE.Material, at: Vec3, parent: THREE.Object3D = root) => {
    geometries.push(geometry)
    const value = new THREE.Mesh(geometry, mat); value.position.set(...at)
    value.castShadow = value.receiveShadow = true; parent.add(value); return value
  }
  const box = (size: Vec3, at: Vec3, mat = M.white, parent: THREE.Object3D = root, radius = .006) => mesh(new RoundedBoxGeometry(...size, 2, Math.min(radius, ...size.map(v => v / 3))), mat, at, parent)
  const cylinder = (radius: number, height: number, at: Vec3, mat = M.metal, parent: THREE.Object3D = root) => mesh(new THREE.CylinderGeometry(radius, radius, height, 24), mat, at, parent)
  const rod = (a: Vec3, b: Vec3, radius = .013, mat = M.metal, parent: THREE.Object3D = root) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b)
    const value = cylinder(radius, start.distanceTo(end), [0, 0, 0], mat, parent)
    value.position.copy(start).add(end).multiplyScalar(.5)
    value.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize()); return value
  }
  const group = (name: string, at: Vec3 = [0, 0, 0], obstacle = false) => {
    const value = new THREE.Group(); value.name = name; value.position.set(...at)
    if (obstacle) value.userData.obstacle = true
    root.add(value); return value
  }
  const table = (s: WorkSurface, parent: THREE.Group, mat = M.wood) => {
    const [x, y, z] = s.center
    box([s.width, .045, s.depth], [x, y - .0225, z], mat, parent, .012)
    for (const dx of [-s.width / 2 + .09, s.width / 2 - .09]) for (const dz of [-s.depth / 2 + .09, s.depth / 2 - .09]) box([.05, y - .063, .05], [x + dx, (y - .063) / 2 + .018, z + dz], M.ink, parent)
  }
  const shell = () => {
    const w = scene.width, d = scene.depth, left = -w / 2 + .06
    box([w, .1, d], [0, -.065, 0], M.base)
    box([w - .035, .035, d - .035], [0, -.007, 0], M.floor)
    const rear = group('rear_shell'); rear.userData.cutaway = 'back'
    box([w, 2.4, .12], [0, 1.2, -d / 2 + .06], M.wall, rear)
    box([w - .16, .075, .018], [.02, .055, -d / 2 + .129], M.base, rear)
    const side = group('side_shell'); side.userData.cutaway = 'left'
    const length = d - .324
    box([.12, .74, length], [left, .37, -.03], M.wall, side)
    box([.12, 2.4, .18], [left, 1.2, d / 2 - .09], M.wall, side)
    box([.12, .14, length], [left, 2.33, -.03], M.wall, side)
    box([.18, .035, length], [left + .03, .76, -.03], M.wood, side)
    for (let z = -d / 2 + .34; z < d / 2 - .25; z += 1.15) box([.04, 1.47, .03], [left, 1.505, z], M.ink, side)
    return { rear, side }
  }
  const plant = (at: Vec3, parent: THREE.Object3D = root) => {
    mesh(new THREE.CylinderGeometry(.16, .12, .28, 24), M.white, [at[0], at[1] + .14, at[2]], parent)
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3, tip: Vec3 = [at[0] + Math.cos(a) * .18, at[1] + .47 + i % 3 * .12, at[2] + Math.sin(a) * .18]
      rod([at[0], at[1] + .22, at[2]], tip, .006, M.leaf, parent)
      const leaf = mesh(new THREE.SphereGeometry(1, 12, 8), M.leaf, tip, parent)
      leaf.scale.set(.07, .015, .18); leaf.rotation.set(.5, -a, .4)
    }
  }
  return { root, M, mesh, box, cylinder, rod, group, table, shell, plant, dispose: () => { geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()) } }
}
