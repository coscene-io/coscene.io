import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { SceneDefinition, Vec3, WorkSceneId } from './robot-data-miniature-catalog'
import { WORK_SURFACES, workTaskFrame } from './robot-data-miniature-work-tasks'
import { buildTaskProps } from './robot-data-miniature-task-props'

export function buildWorkRoom(scene: SceneDefinition & { id: WorkSceneId }, wood: THREE.Texture, normal: THREE.Texture) {
  const root = new THREE.Group(); root.name = scene.id
  const geometries: THREE.BufferGeometry[] = [], materials: THREE.Material[] = []
  const material = (color: string, roughness = .7, metalness = 0) => {
    const result = new THREE.MeshStandardMaterial({ color, roughness, metalness }); materials.push(result); return result
  }
  const M = {
    wall: material('#eef0eb', .92), floor: material('#bdc4c0', .88), base: material('#88958d'),
    ink: material('#293438', .58), white: material('#e8ece8', .48), metal: material('#aab8bc', .3, .7),
    wood: material('#c6af8e'), green: material('#6c8477'), blue: material('#567e96'),
    red: material('#ad6961'), yellow: material('#c6b574'), paper: material('#b9a88b'),
    window: material('#98b4ba', .25, .2), rubber: material('#384044', .93), grass: material('#9faf92'),
  }
  M.wood.map = wood; M.wood.normalMap = normal; M.wood.normalScale.set(.12, .12)
  const mesh = (geometry: THREE.BufferGeometry, mat: THREE.Material, at: Vec3, parent: THREE.Object3D = root) => {
    geometries.push(geometry); const node = new THREE.Mesh(geometry, mat)
    node.position.set(...at); node.castShadow = node.receiveShadow = true; parent.add(node); return node
  }
  const box = (size: Vec3, at: Vec3, mat = M.white, radius = .007, parent: THREE.Object3D = root) => mesh(radius ? new RoundedBoxGeometry(...size, 2, Math.min(radius, ...size.map(v => v / 3))) : new THREE.BoxGeometry(...size), mat, at, parent)
  const cylinder = (r: number, h: number, at: Vec3, mat = M.metal, parent: THREE.Object3D = root) => mesh(new THREE.CylinderGeometry(r, r, h, 24), mat, at, parent)
  const rod = (a: Vec3, b: Vec3, r = .014, mat = M.ink, parent: THREE.Object3D = root) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b)
    const node = cylinder(r, start.distanceTo(end), [0, 0, 0], mat, parent)
    node.position.copy(start).add(end).multiplyScalar(.5)
    node.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize()); return node
  }
  const group = (name: string, at: Vec3 = [0, 0, 0], heading = 0) => { const node = new THREE.Group(); node.name = name; node.position.set(...at); node.rotation.y = heading; root.add(node); return node }
  const surface = (name: string, s: { center: Vec3; width: number; depth: number }, mat = M.wood, mobile = false) => {
    const [x, y, z] = s.center, node = group(name)
    node.userData.support = { ...s }
    box([s.width, .055, s.depth], [x, y - .0275, z], mat, .01, node)
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
      const px = x + dx * (s.width / 2 - .075), pz = z + dz * (s.depth / 2 - .075)
      box([.05, y - .12, .05], [px, (y + .02) / 2, pz], M.ink, .004, node)
      if (mobile) { const wheel = cylinder(.055, .032, [px, .071, pz], M.rubber, node); wheel.rotation.z = Math.PI / 2 }
      else box([.085, .02, .085], [px, .026, pz], M.rubber, .004, node)
    }
    box([s.width - .09, .035, s.depth - .09], [x, .24, z], M.metal, .004, node)
    return node
  }
  const storageBox = (at: Vec3, width = .46, tone = M.paper, parent: THREE.Object3D = root) => {
    box([width, .31, .38], [at[0], at[1] + .155, at[2]], tone, .012, parent)
    box([width + .015, .025, .39], [at[0], at[1] + .315, at[2]], tone, .004, parent)
    box([.13, .075, .002], [at[0], at[1] + .16, at[2] + .192], M.white, .001, parent)
    box([.12, .022, .011], [at[0], at[1] + .255, at[2] + .196], M.ink, .004, parent)
  }
  const screen = (at: Vec3, heading: number) => {
    const node = group('workstation_display', at, heading)
    box([.25, .018, .18], [0, .009, 0], M.ink, .008, node)
    rod([0, .02, 0], [0, .29, -.03], .018, M.metal, node)
    box([.43, .28, .034], [0, .3, 0], M.ink, .012, node)
    box([.397, .245, .004], [0, .3, .02], M.window, .002, node)
    for (let i = 0; i < 3; i++) box([.18, .009, .002], [-.08, .37 - i * .05, .024], M.white, .001, node)
    box([.08, .13, .002], [.115, .3, .024], M.green, .001, node)
  }
  const scanner = (at: Vec3, heading = 0) => {
    const node = group('barcode_scanner', at, heading)
    box([.15, .023, .15], [0, .0115, 0], M.ink, .015, node)
    rod([0, .025, 0], [0, .16, -.035], .025, M.ink, node)
    box([.095, .065, .11], [0, .19, -.037], M.ink, .015, node)
    box([.07, .03, .005], [0, .19, .02], M.red, .002, node)
  }
  const w = scene.width, d = scene.depth, back = -d / 2 + .12, left = -w / 2 + .06
  box([w, .1, d], [0, -.065, 0], M.base, .02)
  box([w - .035, .035, d - .035], [0, -.007, 0], M.floor, .01)
  if (scene.id !== 'workcell') {
    for (let x = -w / 2 + 1.25; x < w / 2; x += 1.25) box([.005, .003, d - .08], [x, .012, 0], M.base, 0)
    for (let z = -d / 2 + 1.25; z < d / 2; z += 1.25) {
      let start = -w / 2 + .04
      for (let x = -w / 2 + 1.25; x < w / 2; x += 1.25) {
        box([x - .0025 - start, .003, .005], [(start + x - .0025) / 2, .012, z], M.base, 0)
        start = x + .0025
      }
      box([w / 2 - .04 - start, .003, .005], [(start + w / 2 - .04) / 2, .012, z], M.base, 0)
    }
  }
  const rear = group('rear_shell'); rear.userData.cutaway = 'back'
  box([w, 2.7, .12], [0, 1.35, back - .06], M.wall, .006, rear)
  box([w - .15, .09, .018], [.025, .065, back + .009], M.base, .003, rear)
  const side = group('side_shell'); side.userData.cutaway = 'left'
  box([.12, .88, 4.49], [left, .44, -.625], M.wall, .007, side)
  box([.12, 2.7, .31], [left, 1.35, -3.025], M.wall, .007, side)
  box([.12, 2.7, .32], [left, 1.35, 1.78], M.wall, .007, side)
  box([.12, .24, 4.49], [left, 2.58, -.625], M.wall, .006, side)
  for (const y of [.91, 2.42]) rod([left + .07, y, -2.86], [left + .07, y, 1.61], .018, M.ink, side)
  for (const z of [-1.8, -.65, .5]) rod([left + .07, .91, z], [left + .07, 2.42, z], .018, M.ink, side)
  for (const x of [-1.8, 1.5]) {
    box([1.4, .055, .1], [x, 2.54, back + .2], M.white)
    rod([x - .5, 2.54, back + .04], [x - .5, 2.54, back + .2], .012)
  }

  if (scene.id === 'garage') {
    surface('intake', WORK_SURFACES.garage.intake, M.metal, true)
    const cart = group('garden_storage_cart', [-2.65, 0, .08])
    for (const z of [-.34, .34]) storageBox([0, .258, z], .6, M.green, cart)
    surface('bench', WORK_SURFACES.garage.bench)
    const gardenShelf = group('garden_supplies', [-1.62, 1.65, back + .3])
    box([2.65, .055, .48], [0, 0, 0], M.wood, .008, gardenShelf)
    for (let i = 0; i < 4; i++) {
      const pot = mesh(new THREE.CylinderGeometry(.12, .08, .19, 20), M.red, [-.96 + i * .28, .123, .02], gardenShelf)
      pot.name = 'terracotta_pot'
      cylinder(.1, .013, [-.96 + i * .28, .223, .02], M.ink, gardenShelf)
    }
    for (const x of [.45, .88]) storageBox([x, .03, 0], .31, M.green, gardenShelf)
    const gardenTools = group('long_garden_tools', [-.12, 0, back + .27])
    box([.52, .09, .035], [0, 1.9, 0], M.wood, .005, gardenTools)
    for (const x of [-.16, .16]) {
      rod([x, .37, .07], [x, 1.95, .07], .019, M.wood, gardenTools)
      if (x < 0) box([.21, .31, .04], [x, .24, .07], M.metal, .07, gardenTools)
      else { rod([x - .15, .38, .07], [x + .15, .38, .07], .013, M.metal, gardenTools); for (let i = 0; i < 6; i++) rod([x - .15 + i * .06, .38, .07], [x - .15 + i * .06, .22, .11], .007, M.metal, gardenTools) }
    }
    for (const x of [-2.25, -1.55, -.85]) storageBox([x, .258, -2.42], .56, M.green)

    const car = group('parked_vehicle', [1.97, 0, -.72])
    box([1.48, .42, 3.65], [0, .55, 0], M.blue, .16, car)
    box([1.32, .35, 1.23], [0, .73, 1.13], M.blue, .11, car)
    box([1.24, .51, 1.57], [0, 1.015, -.36], M.window, .14, car)
    box([1.27, .065, 1.5], [0, 1.29, -.4], M.blue, .05, car)
    for (const x of [-.657, .657]) {
      box([.04, .5, .065], [x, 1.0, -.38], M.blue, .007, car)
      box([.06, .05, 1.55], [x, .79, -.38], M.blue, .007, car)
      box([.13, .085, .2], [x * 1.22, .86, .44], M.blue, .023, car)
      for (const z of [-1.16, 1.12]) {
        const tire = cylinder(.285, .19, [x * 1.1, .303, z], M.rubber, car); tire.rotation.z = Math.PI / 2
        const hub = cylinder(.157, .198, [x * 1.1, .303, z], M.metal, car); hub.rotation.z = Math.PI / 2
      }
      for (const z of [-.82, .22]) box([.026, .023, .16], [x * 1.06, .73, z], M.metal, .003, car)
    }
    for (const x of [-.51, .51]) { box([.29, .11, .015], [x, .66, 1.824], M.white, .013, car); box([.24, .11, .015], [x, .69, -1.826], M.red, .013, car) }
    box([.76, .12, .02], [0, .43, 1.831], M.ink, .015, car)
    const bicycle = group('bicycle', [-3.35, 0, -1.69], Math.PI / 2)
    for (const x of [-.56, .56]) {
      const wheel = mesh(new THREE.TorusGeometry(.31, .026, 10, 40), M.rubber, [x, .335, 0], bicycle)
      wheel.name = 'bicycle_wheel'
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; rod([x, .335, 0], [x + Math.cos(a) * .29, .335 + Math.sin(a) * .29, 0], .0025, M.metal, bicycle) }
    }
    for (const [a, b] of [
      [[-.56, .335, 0], [-.18, .72, 0]], [[-.56, .335, 0], [0, .335, 0]], [[-.18, .72, 0], [0, .335, 0]],
      [[-.18, .72, 0], [.38, .78, 0]], [[0, .335, 0], [.38, .78, 0]], [[.38, .78, 0], [.56, .335, 0]],
    ] as [Vec3, Vec3][]) rod(a, b, .018, M.green, bicycle)
    rod([-.18, .72, 0], [-.2, .84, 0], .015, M.metal, bicycle)
    box([.24, .045, .13], [-.23, .85, 0], M.ink, .025, bicycle)
    rod([.38, .78, 0], [.35, .97, 0], .016, M.metal, bicycle)
    rod([.35, .97, -.18], [.35, .97, .18], .014, M.ink, bicycle)
    rod([0, .335, -.14], [0, .335, .14], .014, M.metal, bicycle)
    for (const z of [-.15, .15]) box([.14, .025, .07], [0, .335, z], M.ink, .005, bicycle)
    rod([-.2, .45, 0], [-.32, .018, .17], .013, M.metal, bicycle)

    const opening = group('sectional_garage_door'); opening.userData.cutaway = 'front'
    for (const x of [.84, 3.38]) {
      box([.15, 2.475, .22], [x, 1.2375, 2.05], M.white, .01, opening)
      rod([x - .12, .12, 2.01], [x - .12, 2.48, 2.01], .016, M.metal, opening)
      rod([x - .12, 2.48, 2.01], [x - .12, 2.48, .9], .016, M.metal, opening)
    }
    box([2.74, .21, .22], [2.11, 2.58, 2.05], M.white, .008, opening)
    for (let z = 1.12; z < 1.98; z += .21) box([2.36, .045, .203], [2.05, 2.48, z], M.white, .005, opening)
    box([2.69, .006, 1.16], [2.03, .018, 2.7], M.white, .005).name = 'driveway_connection'
    box([1.75, .025, .86], [-2.62, .025, 2.77], M.grass, .02).name = 'yard_connection'
    for (let i = 0; i < 4; i++) box([.36, .025, .43], [-1.59 + i * .46, .028, 2.79], M.white, .012)
    const reel = cylinder(.21, .13, [-3.57, 1.23, 1.14], M.green); reel.rotation.z = Math.PI / 2
    for (let i = 0; i < 4; i++) {
      const hose = mesh(new THREE.TorusGeometry(.17, .012, 8, 28), M.rubber, [-3.49 + i * .018, 1.23, 1.14]); hose.rotation.y = Math.PI / 2
    }
    rod([-3.51, .05, .64], [-3.51, 1.63, .64], .013, M.wood)
    box([.12, .07, .35], [-3.51, .059, .64], M.green, .008)
    storageBox([-2.67, .026, 1.56], .59, M.blue)
    const mower = group('lawn_mower', [-2.57, 0, 2.18], -.15)
    box([.49, .18, .66], [0, .2, 0], M.green, .09, mower)
    box([.25, .14, .25], [0, .34, -.05], M.ink, .03, mower)
    for (const x of [-.27, .27]) for (const z of [-.23, .23]) { const wheel = cylinder(.095, .055, [x, .115, z], M.rubber, mower); wheel.rotation.z = Math.PI / 2 }
    for (const x of [-.2, .2]) rod([x, .24, .25], [x, .9, .64], .015, M.metal, mower)
    rod([-.2, .9, .64], [.2, .9, .64], .025, M.ink, mower)
    const sports = group('outdoor_equipment', [.43, 0, -2.56])
    box([.38, .65, .42], [0, .35, 0], M.blue, .035, sports)
    for (const z of [-.12, .12]) rod([-.11, .72, z], [.11, .72, z], .024, M.wood, sports)
    box([.22, .8, .065], [.07, 1.0, 0], M.green, .03, sports)
  } else if (scene.id === 'warehouse') {
    const surfaces = WORK_SURFACES.warehouse
    surface('intake', surfaces.intake, M.metal, true)
    surface('buffer', surfaces.buffer, M.metal)
    for (const x of [-3.01, -1.11, .82]) for (const z of [-2.92, -1.99]) box([.065, 2.6, .065], [x, 1.315, z], M.blue)
    for (const y of [.98, 1.71, 2.45]) {
      for (const z of [-2.92, -1.99]) box([3.88, .08, .04], [-1.1, y - .04, z], M.yellow)
      if (y > 1) {
        box([3.83, .04, .89], [-1.1, y - .02, -2.455], M.metal)
        for (let i = 0; i < 6; i++) storageBox([-2.65 + i * .61, y, -2.45], .47, i % 3 ? M.paper : M.green)
      }
    }
    surface('packing', surfaces.packing)
    screen([-.45, .94, 1.44], Math.PI)
    scanner([.57, .94, .63], Math.PI)
    const roll = cylinder(.085, .13, [.58, 1.032, 1.28], M.paper); roll.rotation.z = Math.PI / 2
    box([.28, .038, .22], [.55, .96, 1.28], M.ink, .01).name = 'tape_dispenser'
    for (const x of [-.55, .04]) storageBox([x, .258, 1], .43, M.paper)
    const outbound = surface('outbound', surfaces.outbound, M.ink)
    outbound.children[0].visible = false
    for (let z = .08; z < 1.51; z += .12) {
      const roller = cylinder(.045, 1.72, [1.87, .755, z], M.metal, outbound); roller.rotation.z = Math.PI / 2
    }
    for (const x of [1.0, 2.74]) box([.05, .1, 1.55], [x, .75, .78], M.blue)
    const door = group('loading_door'); door.userData.cutaway = 'back'
    box([1.9, 2.5, .03], [2.27, 1.25, back + .085], M.ink, .007, door)
    for (let y = .21; y < 2.48; y += .205) box([1.76, .195, .045], [2.27, y, back + .112], M.metal, .003, door)
    for (const x of [1.26, 3.28]) box([.13, .45, .15], [x, .235, back + .18], M.yellow)
    const pallet = group('pallet_jack', [2.72, 0, -1.39], .2)
    for (const x of [-.27, .27]) {
      box([.14, .075, 1.1], [x, .12, 0], M.yellow, .02, pallet)
      for (const z of [-.41, .43]) { const wheel = cylinder(.055, .08, [x, .073, z], M.ink, pallet); wheel.rotation.z = Math.PI / 2 }
    }
    box([.66, .23, .22], [0, .22, .52], M.yellow, .03, pallet)
    rod([0, .25, .52], [0, 1.1, .7], .025, M.ink, pallet)
    for (const x of [-.16, .16]) rod([0, .87, .66], [x, 1.15, .71], .017, M.ink, pallet)
    rod([-.16, 1.15, .71], [.16, 1.15, .71], .02, M.ink, pallet)
    const skid = group('inbound_pallet', [-2.56, 0, 2.34])
    for (const z of [-.4, 0, .4]) box([1.1, .07, .1], [0, .055, z], M.wood, .004, skid)
    for (let x = -.48; x < .5; x += .19) box([.15, .045, 1.05], [x, .111, 0], M.wood, .004, skid)
    for (const x of [-.27, .27]) storageBox([x, .134, 0], .45, M.paper, skid)
    for (const x of [-.6, 3.27]) box([.047, .003, 1.03], [x, .018, 2.7], M.yellow, .001)
    box([3.7, .012, .78], [1.38, .017, 2.91], M.base, .008).name = 'loading_apron_connection'
  } else {
    const surfaces = WORK_SURFACES.workcell
    surface('intake', surfaces.intake, M.metal, true)
    surface('buffer', surfaces.buffer, M.metal)
    surface('output', surfaces.output, M.green)
    surface('assembly_bench', { ...surfaces.fixture, center: [.15, .98, -.25] }, M.green)
    const fixture = group('fixture'); fixture.userData.support = surfaces.fixture
    box([2.15, .026, 1.08], [.15, .993, -.25], M.white, .008, fixture)
    for (const x of [-.36, .64]) {
      for (const dx of [-.39, .39]) for (const z of [-.57, .07]) {
        box([.05, .036, .08], [x + dx, 1.024, z], M.blue, .006, fixture)
      }
    }
    const rail = group('assembly_light_and_balancer')
    for (const x of [-1.02, 1.31]) box([.05, 2.15, .05], [x, 1.09, -.83], M.metal, .004, rail)
    box([2.43, .055, .055], [.145, 2.14, -.83], M.metal, .004, rail)
    box([1.7, .045, .16], [.15, 2.09, -.73], M.white, .01, rail)
    const reel = cylinder(.09, .07, [.75, 1.96, -.81], M.blue, rail); reel.rotation.x = Math.PI / 2
    rod([.75, 1.88, -.8], [.75, 1.49, -.8], .004, M.ink, rail)
    cylinder(.031, .2, [.75, 1.38, -.8], M.blue, rail)
    cylinder(.009, .1, [.75, 1.23, -.8], M.metal, rail)
    const stock = group('connector_bins_and_wire_reels')
    for (const y of [1.35, 1.83]) {
      box([3.3, .035, .38], [-.8, y, -2.85], M.white, .004, stock)
      for (let i = 0; i < 7; i++) {
        const x = -2.18 + i * .46
        box([.36, .16, .28], [x, y + .095, -2.84], i % 2 ? M.blue : M.green, .013, stock)
        box([.2, .065, .003], [x, y + .12, -2.698], M.white, .001, stock)
        box([.23, .016, .16], [x, y + .18, -2.81], M.ink, .005, stock)
      }
    }
    for (const x of [-2.17, -1.62, -1.07]) {
      const spool = group('wire_reel', [x, .4, -2.54])
      for (const z of [-.09, .09]) cylinder(.16, .025, [0, 0, z], M.white, spool).rotation.x = Math.PI / 2
      cylinder(.12, .17, [0, 0, 0], x < -1.8 ? M.red : x < -1.3 ? M.blue : M.yellow, spool).rotation.x = Math.PI / 2
    }
    const test = group('continuity_tester', [2.45, 0, -2.19])
    box([1.67, .87, .51], [0, .465, 0], M.white, .018, test)
    box([1.52, .055, .56], [0, .93, 0], M.metal, .008, test)
    box([.65, .27, .26], [-.3, 1.095, 0], M.white, .015, test)
    box([.25, .13, .006], [-.4, 1.13, .135], M.window, .005, test)
    for (const x of [-.07, .04]) cylinder(.018, .012, [x, 1.12, .144], M.ink, test).rotation.x = Math.PI / 2
    screen([2.94, .958, -2.18], 0)
    const magnifier = group('inspection_magnifier', [1.06, .98, -2.57])
    box([.27, .03, .23], [0, .015, 0], M.ink, .008, magnifier)
    rod([0, .03, 0], [0, .34, -.06], .017, M.metal, magnifier)
    rod([0, .34, -.06], [-.17, .55, .02], .017, M.metal, magnifier)
    const lens = mesh(new THREE.TorusGeometry(.11, .018, 8, 28), M.white, [-.17, .55, .02], magnifier); lens.rotation.x = -.6
    for (const x of [-3.3, 3.28]) box([.045, .003, 5.2], [x, .018, -.2], M.yellow, .001)
    box([6.535, .003, .045], [-.01, .018, 2.4], M.yellow, .001)
    box([6.5, .006, .58], [0, .015, 2.85], M.base, .003).name = 'service_aisle_connection'
  }

  const tripod = group('collection_camera', [scene.id === 'garage' ? -.37 : 3.32, 0, 2.38], -.7)
  rod([0, .08, 0], [0, 1.37, 0], .014, M.ink, tripod)
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; rod([0, .45, 0], [Math.cos(a) * .25, .018, Math.sin(a) * .25], .012, M.ink, tripod) }
  box([.19, .1, .08], [0, 1.4, 0], M.ink, .012, tripod)
  cylinder(.029, .04, [0, 1.4, -.052], M.window, tripod).rotation.x = Math.PI / 2
  const initial = buildTaskProps(workTaskFrame(scene.id, 0, 'everyday'))
  initial.root.userData.taskProp = true; root.add(initial.root)
  return { root, dispose: () => { initial.dispose(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()) } }
}
