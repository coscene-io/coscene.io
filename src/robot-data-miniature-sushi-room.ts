import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { SceneDefinition, Vec3 } from './robot-data-miniature-catalog'
import { SUSHI_SURFACES, sushiTaskFrame } from './robot-data-miniature-sushi-tasks'
import { buildTaskProps } from './robot-data-miniature-task-props'

export function buildSushiRoom(scene: SceneDefinition, wood: THREE.Texture, normal: THREE.Texture) {
  const root = new THREE.Group(); root.name = 'sushi'
  const geometries: THREE.BufferGeometry[] = [], materials: THREE.Material[] = []
  const material = (color: string, roughness = .75, metalness = 0) => {
    const value = new THREE.MeshStandardMaterial({ color, roughness, metalness }); materials.push(value); return value
  }
  const M = {
    wall: material('#eef0eb'), floor: material('#d2dad4'), base: material('#87948e'),
    white: material('#f1f2ed', .5), wood: material('#c6af8e', .68), ink: material('#293638'),
    green: material('#55796c'), blue: material('#547c96'), fabric: material('#a85443'),
    metal: material('#b9c5c6', .28, .7), rubber: material('#384044'), paper: material('#e3e5d9'),
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
  const group = (name: string) => { const value = new THREE.Group(); value.name = name; root.add(value); return value }
  const w = scene.width, d = scene.depth
  box([w, .1, d], [0, -.065, 0], M.base)
  box([w - .035, .035, d - .035], [0, -.007, 0], M.floor)
  // Tile inlays are above the floor, not a second coplanar floor layer.
  for (let x = -4.1; x < 4.4; x += .6) box([.004, .002, d - .06], [x, .012, 0], M.base)
  for (let z = -2.7; z < 3.2; z += .6) box([w - .06, .002, .004], [0, .012, z], M.base)
  const rear = group('rear_shell'); rear.userData.cutaway = 'back'
  box([w, 2.4, .12], [0, 1.2, -3.24], M.wall, rear)
  box([w - .15, .07, .018], [.015, .055, -3.171], M.base, rear)
  const left = group('side_shell'); left.userData.cutaway = 'left'
  box([.12, .74, d - .324], [-4.54, .37, -.03], M.green, left)
  box([.12, 2.4, .18], [-4.54, 1.2, 3.21], M.wall, left)
  box([.12, .14, d - .324], [-4.54, 2.33, -.03], M.wall, left)
  for (const z of [-2.85, -1.45, -.05, 1.35, 2.97]) box([.046, 1.5, .035], [-4.54, 1.5, z], M.wood, left)
  box([.2, .045, d - .324], [-4.50, .7625, -.03], M.wood, left)

  const prep = group('preparation_counter'), pass = group('serving_pass'), clean = group('clean_supply'), returns = group('dish_return')
  const counter = (key: 'prep' | 'pass' | 'clean' | 'returns', parent: THREE.Group) => {
    const s = SUSHI_SURFACES[key], [x, y, z] = s.center
    box([s.width, .04, s.depth], [x, y - .02, z], M.metal, parent)
    box([s.width - .045, .7, s.depth - .055], [x, .5, z], key === 'pass' ? M.green : M.white, parent)
    const doors = Math.ceil(s.width / .72)
    for (let i = 0; i < doors; i++) {
      const dx = (i - (doors - 1) / 2) * (s.width - .065) / doors
      box([(s.width - .065) / doors - .014, .58, .018], [x + dx, .51, z + s.depth / 2 - .012], M.metal, parent)
      rod([x + dx + .12, .66, z + s.depth / 2 + .005], [x + dx + .12, .79, z + s.depth / 2 + .005], .008, M.ink, parent)
    }
    for (const dx of [-s.width / 2 + .1, s.width / 2 - .1]) for (const dz of [-s.depth / 2 + .08, s.depth / 2 - .08]) cylinder(.024, .15, [x + dx, .09, z + dz], M.metal, parent)
  }
  counter('prep', prep); counter('pass', pass); counter('clean', clean); counter('returns', returns)

  const fridge = group('refrigerated_storage')
  box([.9, 1.94, .82], [-3.93, 1.02, -2.68], M.metal, fridge)
  for (const y of [.61, 1.55]) {
    box([.84, .86, .026], [-3.93, y, -2.255], M.white, fridge)
    rod([-3.62, y - .26, -2.224], [-3.62, y + .25, -2.224], .016, M.ink, fridge)
  }
  for (let i = 0; i < 6; i++) box([.61, .012, .008], [-3.93, .14 + i * .035, -2.262], M.ink, fridge)
  const wash = group('wash_station')
  box([1.16, .75, .71], [2.24, .48, -2.69], M.white, wash)
  box([1.21, .04, .74], [2.24, .92, -2.69], M.metal, wash)
  box([.73, .014, .47], [2.24, .95, -2.69], M.ink, wash)
  box([.65, .014, .39], [2.24, .96, -2.69], M.metal, wash)
  rod([2.24, .95, -2.98], [2.24, 1.3, -2.98], .016, M.metal, wash)
  rod([2.24, 1.3, -2.98], [2.24, 1.3, -2.75], .016, M.metal, wash)
  rod([2.24, 1.3, -2.75], [2.24, 1.24, -2.75], .016, M.metal, wash)
  box([1.11, .58, .02], [2.24, .46, -2.319], M.metal, wash)
  box([.38, .05, .019], [2.24, .73, -2.296], M.ink, wash)
  // Visible pass opening and a 2.35 m side passage keep front/back workspaces connected.
  const partition = group('kitchen_partition'); partition.userData.cutaway = 'back'
  box([4.0, .86, .11], [-2.35, .43, -.58], M.green, partition)
  for (const x of [-.35, 1.45, 2.16]) box([.075, 2.23, .16], [x, 1.115, -.58], M.wood, partition)
  box([2.64, .12, .22], [.91, 2.26, -.58], M.wood, partition)
  for (const x of [1.57, 1.79, 2.01]) box([.19, .47, .025], [x, 1.945, -.61], M.fabric, partition)
  const shelf = group('kitchen_shelf'); shelf.userData.cutaway = 'back'
  box([4.7, .045, .35], [-.82, 1.64, -2.99], M.metal, shelf)
  for (const x of [-2.9, 1.25]) rod([x, 1.35, -3.16], [x, 1.61, -2.88], .012, M.metal, shelf)
  for (let i = 0; i < 6; i++) {
    box([.34, .14, .25], [-2.83 + i * .75, 1.7325, -2.99], i % 2 ? M.paper : M.green, shelf)
    box([.34, .014, .25], [-2.83 + i * .75, 1.812, -2.99], M.white, shelf)
  }

  const conveyor = group('conveyor_counter')
  const capsule = (r: number) => {
    const shape = new THREE.Shape()
    shape.moveTo(-1.75, -r); shape.lineTo(1.75, -r)
    shape.absarc(1.75, 0, r, -Math.PI / 2, Math.PI / 2, false)
    shape.lineTo(-1.75, r); shape.absarc(-1.75, 0, r, Math.PI / 2, Math.PI * 1.5, false)
    shape.closePath(); return shape
  }
  const slab = (outer: number, inner: number, height: number, top: number, mat: THREE.Material) => {
    const shape = capsule(outer)
    if (inner) shape.holes.push(new THREE.Path(capsule(inner).getPoints(48).reverse()))
    const value = mesh(new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, steps: 1, curveSegments: 40 }), mat, [-.65, top, 1.05], conveyor)
    value.rotation.x = Math.PI / 2; return value
  }
  slab(.94, 0, .8, .85, M.green)
  slab(1.3, .79, .045, .91, M.wood)
  slab(.79, .43, .04, 1.015, M.rubber)
  slab(.815, .793, .035, 1.032, M.metal)
  slab(.427, .402, .035, 1.032, M.metal)
  slab(.399, 0, .025, .985, M.wood)
  // Track seams lie above the belt, with a physical gap from the task plate supports.
  for (let i = 0; i <= 28; i++) for (const z of [-.61, .61]) box([.009, .002, .32], [-2.39 + i * .125, 1.0165, 1.05 + z], M.metal, conveyor)
  for (const side of [-1, 1]) for (let i = 0; i < 18; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 17
    const value = box([.009, .002, .32], [-.65 + side * (1.75 + Math.cos(a) * .61), 1.0165, 1.05 + Math.sin(a) * .61], M.metal, conveyor)
    value.rotation.y = -side * a + Math.PI / 2
  }
  for (const x of [-2.3, -1.2, -.1, 1]) {
    const stool = group(`dining_stool_${x}`)
    cylinder(.21, .09, [x, .56, 2.9], M.fabric, stool)
    cylinder(.055, .47, [x, .28, 2.9], M.metal, stool)
    cylinder(.2, .025, [x, .029, 2.9], M.ink, stool)
    const rest = mesh(new THREE.TorusGeometry(.135, .012, 8, 24), M.metal, [x, .23, 2.9], stool); rest.rotation.x = Math.PI / 2
    box([.32, .16, .04], [x, .68, 3.08], M.wood, stool)
    for (const dx of [-.12, .12]) rod([x + dx, .56, 2.94], [x + dx, .67, 3.08], .009, M.metal, stool)
    const settings = group(`seat_settings_${x}`)
    cylinder(.037, .105, [x + .32, .9625, 2.03], M.ink, settings)
    cylinder(.022, .014, [x + .32, 1.022, 2.03], M.fabric, settings)
    for (const dx of [0, .016]) rod([x + .39 + dx, .92, 2.15], [x + .39 + dx, .92, 2.32], .0035, M.wood, settings)
    box([.16, .11, .045], [x, 1.1, 1.9], M.ink, settings)
    box([.14, .09, .003], [x, 1.1, 1.925], M.blue, settings)
    rod([x, .92, 1.91], [x, 1.06, 1.91], .011, M.metal, settings)
  }
  const lamps = group('pendant_lamps'); lamps.userData.cutaway = 'back'
  rod([-.35, 2.34, -.5], [-.35, 2.34, 1.05], .018, M.ink, lamps)
  rod([1.5, 2.34, -.5], [1.5, 2.34, 1.05], .018, M.ink, lamps)
  rod([-3.2, 2.34, 1.05], [1.5, 2.34, 1.05], .018, M.ink, lamps)
  for (const x of [-2.3, -.65, 1]) {
    rod([x, 2.34, 1.05], [x, 2.14, 1.05], .006, M.ink, lamps)
    cylinder(.15, .24, [x, 2.02, 1.05], M.paper, lamps)
    for (const y of [1.9, 2.14]) cylinder(.152, .013, [x, y, 1.05], M.wood, lamps)
  }
  const initial = buildTaskProps(sushiTaskFrame(0, 'everyday'))
  initial.root.userData.taskProp = true; root.add(initial.root)
  return { root, dispose: () => { initial.dispose(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()) } }
}
