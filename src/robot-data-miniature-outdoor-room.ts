import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { SceneDefinition } from './robot-data-miniature-catalog'
import { isOutdoorScene } from './robot-data-miniature-catalog'
import { roomKit } from './robot-data-miniature-room-kit'
import { outdoorTaskFrame } from './robot-data-miniature-outdoor-tasks'
import { buildTaskProps } from './robot-data-miniature-task-props'

export function buildOutdoorRoom(scene: SceneDefinition, wood: THREE.Texture, normal: THREE.Texture) {
  if (!isOutdoorScene(scene.id)) throw new Error(`Not an outdoor scene: ${scene.id}`)
  const kit = roomKit(scene, wood, normal), { root, M, box, cylinder, rod, group, table, mesh } = kit
  root.userData.environment = 'outdoor'
  // Paving and planted ground meet the shared site at grade; there is no room shell or plinth.
  box([scene.width, .025, scene.depth], [0, .003, 0], scene.id === 'garden' ? M.leaf : M.floor, root, .008)
  const tree = (x: number, z: number, height: number) => {
    const g = group('shade_tree', [x, 0, z], true)
    cylinder(.055, height * .66, [0, height * .33, 0], M.wood, g)
    for (let i = 0; i < 3; i++) {
      const crown = mesh(new THREE.IcosahedronGeometry(1, 1), i % 2 ? M.green : M.leaf, [i === 1 ? -.24 : .14, height * (.69 + i * .07), i === 2 ? .18 : -.12], g)
      crown.scale.set(.48, .65, .48)
    }
  }
  const planter = (x: number, z: number, width: number) => {
    const p = group('boundary_planter', [x, 0, z], true)
    box([width, .26, .42], [0, .145, 0], M.red, p)
    box([width - .07, .014, .34], [0, .282, 0], M.wood, p)
    for (let dx = -width / 2 + .15; dx < width / 2; dx += .28) {
      const leaf = mesh(new THREE.IcosahedronGeometry(.19, 1), M.green, [dx, .43, 0], p); leaf.scale.y = 1.1
    }
  }
  if (scene.id === 'cleanup') {
    const wash = group('bin_wash_bay', [0, 0, 0])
    box([1.72, .012, 1.35], [-1.8, .0215, -1.95], M.fabric, wash)
    box([1.72, .055, .14], [-1.8, .043, -1.215], M.ink, wash)
    for (let i = 0; i < 17; i++) box([.028, .006, .12], [-2.59 + i * .099, .0735, -1.215], M.metal, wash)
    const equipment = group('wash_utilities', [0, 0, 0], true)
    box([1.72, .65, .06], [-1.8, .355, -2.65], M.metal, equipment)
    rod([-2.75, .02, -2.6], [-2.75, 1.17, -2.6], .025, M.metal, equipment)
    rod([-2.75, 1.17, -2.6], [-2.55, 1.17, -2.6], .024, M.metal, equipment)
    box([.11, .022, .024], [-2.75, 1.23, -2.6], M.blue, equipment)
    for (let i = 0; i < 4; i++) mesh(new THREE.TorusGeometry(.22 - i * .018, .013, 6, 22), M.ink, [-2.84, .72, -2.48 + i * .027], equipment)
    const bays = group('bin_parking_bays')
    for (const x of [.15, 1.13, 2.11]) {
      box([.76, .008, .9], [x, .02, -1.85], M.paper, bays)
      box([.69, .008, .83], [x, .029, -1.85], M.floor, bays)
    }
    const cart = group('cleaning_supply_cart', [0, 0, 0], true)
    table({ center: [2.34, .82, 1.95], width: .9, depth: .6 }, cart, M.metal)
    box([.82, .024, .54], [2.34, .087, 1.95], M.green, cart)
    for (const x of [1.96, 2.72]) rod([x, .3, 2.22], [x, 1.04, 2.22], .016, M.metal, cart)
    rod([1.96, 1.04, 2.22], [2.72, 1.04, 2.22], .016, M.metal, cart)
    for (const x of [-2.95, 2.95]) cylinder(.055, .65, [x, .34, -2.45], M.yellow)
    planter(-1.8, 2.45, 2.2)
    for (const x of [-2.8, .95, 2.85]) box([.012, .002, scene.depth - .1], [x, .017, 0], M.base)
    const lamp = group('service_lamp', [3, 0, -2.45], true)
    cylinder(.028, 2.65, [0, 1.34, 0], M.ink, lamp)
    box([.42, .055, .2], [-.15, 2.65, 0], M.white, lamp)
  } else if (scene.id === 'garden') {
    box([2.65, .018, scene.depth], [0, .0245, 0], M.floor)
    // Separate side strips keep the crossing free of coplanar paving faces.
    for (const x of [-2.36, 2.36]) box([2.07, .018, 1.1], [x, .0245, 1.95], M.floor)
    for (const x of [-2.35, 2.35]) {
      const bed = group('raised_planting_bed', [x, 0, -.85], true)
      box([1.08, .29, 1.72], [0, .16, 0], M.wood, bed)
      box([.97, .016, 1.61], [0, .313, 0], M.base, bed)
      for (const dx of [-.27, .27]) for (const z of [-.52, 0, .52]) {
        for (let i = 0; i < 3; i++) {
          const leaf = mesh(new THREE.SphereGeometry(1, 8, 6), M.green, [dx + (i - 1) * .06, .45, z], bed)
          leaf.scale.set(.1, .13, .17); leaf.rotation.y = i * 1.8
        }
        cylinder(.065, .055, [dx, .57, z], x > 0 ? M.yellow : M.red, bed)
      }
    }
    const potting = group('potting_bench', [0, 0, 0], true)
    table({ center: [0, .9, -2.15], width: 2.15, depth: .62 }, potting)
    box([2.03, .025, .54], [0, .28, -2.15], M.green, potting)
    for (const x of [-.6, 0, .6]) box([.43, .24, .36], [x, .415, -2.15], M.paper, potting)
    const rack = group('garden_tool_rack', [0, 0, 0], true)
    table({ center: [-2.5, .8, 1.8], width: 1.28, depth: .59 }, rack, M.green)
    box([1.2, .025, .53], [-2.5, .3075, 1.8], M.wood, rack)
    const collector = group('leaf_collection_basket', [2.5, 0, 2.1], true)
    cylinder(.35, .055, [0, .065, 0], M.wood, collector)
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8
      rod([Math.cos(a) * .3, .08, Math.sin(a) * .3], [Math.cos(a) * .37, .62, Math.sin(a) * .37], .023, M.wood, collector)
    }
    const rim = mesh(new THREE.TorusGeometry(.37, .025, 6, 24), M.wood, [0, .62, 0], collector); rim.rotation.x = Math.PI / 2
    tree(-2.85, -2.25, 3.05); tree(2.85, -2.25, 2.85)
    planter(-.25, 2.6, 1.8)
  } else {
    for (let x = -3.5; x < 4; x += .7) box([.006, .002, scene.depth - .03], [x, .017, 0], M.base)
    for (let z = -2.25; z < 2.9; z += .65) box([scene.width - .03, .002, .006], [0, .017, z], M.base)
    const booth = group('popup_kiosk', [0, 0, 0], true)
    box([3.55, 1.62, .07], [0, .84, -2.68], M.green, booth)
    for (const x of [-1.74, 1.74]) rod([x, .018, -2.62], [x, 2.63, -2.62], .027, M.ink, booth)
    rod([-1.74, 2.62, -2.62], [1.74, 2.62, -2.62], .03, M.ink, booth)
    for (let i = 0; i < 10; i++) {
      const roof = box([.345, .045, 1.3], [-1.565 + i * .348, 2.56, -2.02], i % 2 ? M.white : M.red, booth)
      roof.rotation.x = .09
    }
    for (const x of [-1.68, 1.68]) rod([x, 1.78, -2.63], [x, 2.5, -1.38], .023, M.ink, booth)
    box([3.5, .2, .04], [0, 2.46, -1.355], M.red, booth)
    const counter = group('popup_service_counter', [0, 0, 0], true)
    table({ center: [0, .91, -.95], width: 2.8, depth: .66 }, counter)
    box([2.62, .68, .57], [0, .5, -.95], M.green, counter)
    for (let x = -1.18; x < 1.3; x += .16) box([.018, .54, .016], [x, .5, -.657], M.wood, counter)
    const terminal = group('popup_terminal', [0, 0, 0], true)
    box([.26, .03, .24], [.92, .927, -1.05], M.ink, terminal)
    rod([.92, .94, -1.1], [.92, 1.12, -1.12], .02, M.ink, terminal)
    const screen = box([.29, .2, .025], [.92, 1.2, -1.12], M.ink, terminal); screen.rotation.x = -.2
    const display = box([.25, .16, .006], [.92, 1.2, -1.1], M.blue, terminal); display.rotation.x = -.2
    planter(-2.7, 2.6, 1.5)
    planter(1.2, 2.6, 1.4)
    const bin = group('popup_packaging_bin', [3.32, 0, 2.16], true)
    cylinder(.22, .08, [0, .056, 0], M.green, bin)
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6
      box([.032, .44, .032], [Math.cos(a) * .22, .25, Math.sin(a) * .22], M.green, bin)
    }
  }
  // Static details share material batches; changing a task rebuilds only its movable objects.
  root.updateWorldMatrix(true, true)
  root.userData.obstacles = root.children.filter(node => node.userData.obstacle).map(node => {
    const bounds = new THREE.Box3().setFromObject(node)
    return { name: node.name, min: bounds.min.toArray(), max: bounds.max.toArray() }
  })
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>(), merged: THREE.BufferGeometry[] = []
  root.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return
    const material = node.material as THREE.Material, parts = batches.get(material) ?? []
    const geometry = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone()
    parts.push(geometry.applyMatrix4(node.matrixWorld)); batches.set(material, parts)
  })
  root.clear()
  for (const [material, parts] of batches) {
    const geometry = mergeGeometries(parts); parts.forEach(part => part.dispose())
    if (!geometry) continue
    merged.push(geometry)
    const value = new THREE.Mesh(geometry, material); value.castShadow = value.receiveShadow = true; root.add(value)
  }
  const initial = buildTaskProps(outdoorTaskFrame(scene.id, 0, 'everyday'))
  initial.root.userData.taskProp = true; root.add(initial.root)
  return { root, dispose: () => { initial.dispose(); merged.forEach(g => g.dispose()); kit.dispose() } }
}
