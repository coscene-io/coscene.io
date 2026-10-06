import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { SceneDefinition, Vec3 } from './robot-data-miniature-catalog'
import { CARE_SURFACES, careTaskFrame } from './robot-data-miniature-care-tasks'
import { buildTaskProps } from './robot-data-miniature-task-props'

export function buildCareRoom(scene: SceneDefinition, wood: THREE.Texture, normal: THREE.Texture) {
  const root = new THREE.Group(); root.name = 'care'
  const geometries: THREE.BufferGeometry[] = [], materials: THREE.Material[] = []
  const material = (color: string, roughness = .75, metalness = 0) => {
    const value = new THREE.MeshStandardMaterial({ color, roughness, metalness }); materials.push(value); return value
  }
  const M = {
    wall: material('#eef0eb', .92), floor: material('#d9ddd7', .86), base: material('#8a948f'),
    white: material('#f1f2ed', .5), wood: material('#c6af8e', .68), ink: material('#293638', .6),
    green: material('#698679'), blue: material('#547c96'), fabric: material('#bbccc7', .96),
    paper: material('#e6e4d9', .9), metal: material('#b9c5c6', .28, .7), rubber: material('#384044', .93),
    clay: material('#b77560'), display: material('#829fa2', .3), yellow: material('#c1b171'),
  }
  M.wood.map = wood; M.wood.normalMap = normal; M.wood.normalScale.set(.12, .12)
  const mesh = (geometry: THREE.BufferGeometry, mat: THREE.Material, at: Vec3, parent: THREE.Object3D = root) => {
    geometries.push(geometry)
    const value = new THREE.Mesh(geometry, mat); value.position.set(...at)
    value.castShadow = value.receiveShadow = true; parent.add(value); return value
  }
  const box = (size: Vec3, at: Vec3, mat = M.white, radius = .008, parent: THREE.Object3D = root) => mesh(radius ? new RoundedBoxGeometry(...size, 2, Math.min(radius, ...size.map(v => v / 3))) : new THREE.BoxGeometry(...size), mat, at, parent)
  const cylinder = (radius: number, height: number, at: Vec3, mat = M.metal, parent: THREE.Object3D = root) => mesh(new THREE.CylinderGeometry(radius, radius, height, 24), mat, at, parent)
  const rod = (a: Vec3, b: Vec3, radius = .014, mat = M.metal, parent: THREE.Object3D = root) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b)
    const value = cylinder(radius, start.distanceTo(end), [0, 0, 0], mat, parent)
    value.position.copy(start).add(end).multiplyScalar(.5)
    value.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize()); return value
  }
  const group = (name: string, at: Vec3 = [0, 0, 0]) => { const value = new THREE.Group(); value.name = name; value.position.set(...at); root.add(value); return value }
  const wheel = (x: number, z: number, parent: THREE.Object3D) => {
    cylinder(.047, .033, [x, .065, z], M.rubber, parent).rotation.z = Math.PI / 2
    rod([x, .092, z], [x, .16, z], .012, M.metal, parent)
  }
  const surface = (name: keyof typeof CARE_SURFACES, parent: THREE.Object3D = root) => {
    const s = CARE_SURFACES[name], top = new THREE.Group(); top.name = name; top.userData.support = s; parent.add(top)
    const [x, y, z] = s.center
    box([s.width, .035, s.depth], [x, y - .0175, z], name.startsWith('cabinet') ? M.wood : M.white, .012, top)
    return top
  }

  const w = scene.width, d = scene.depth, back = -d / 2 + .12, left = -w / 2 + .06
  box([w, .1, d], [0, -.065, 0], M.base, .02)
  box([w - .035, .035, d - .035], [0, -.007, 0], M.floor, .012)
  for (let x = -w / 2 + .8; x < w / 2; x += .8) box([.004, .003, d - .06], [x, .012, 0], M.base, 0)
  for (let z = -d / 2 + .8; z < d / 2; z += .8) box([w - .06, .003, .004], [0, .012, z], M.base, 0)
  const rear = group('rear_shell'); rear.userData.cutaway = 'back'
  box([w, 2.35, .12], [0, 1.175, back - .06], M.wall, .006, rear)
  box([w - .15, .07, .018], [.025, .055, back + .009], M.base, .002, rear)
  box([4.72, 1.12, .025], [-.96, .63, back + .026], M.wood, .004, rear)
  const window = group('side_shell'); window.userData.cutaway = 'left'
  // Fit sill/header between jambs; overlapping flush faces flicker at overview distances.
  box([.12, .75, d - .84], [left, .375, 0], M.wall, .006, window)
  box([.12, 2.35, .3], [left, 1.175, -d / 2 + .27], M.wall, .006, window)
  box([.12, 2.35, .36], [left, 1.175, d / 2 - .24], M.wall, .006, window)
  box([.12, .16, d - .84], [left, 2.27, 0], M.wall, .006, window)
  box([.2, .04, d - .72], [left + .035, .77, 0], M.white, .004, window)
  for (let i = 0; i <= 4; i++) box([.04, 1.4, .035], [left, 1.51, -(d - .78) / 2 + i * (d - .78) / 4], M.ink, .001, window)
  for (const y of [.81, 1.74, 2.21]) box([.052, .035, d - .76], [left, y, 0], M.ink, .001, window)
  rod([left + .14, .9, -2.7], [left + .14, .9, .85], .024, M.wood, window)
  for (const z of [-2.55, -.85, .72]) rod([left + .04, .82, z], [left + .14, .9, z], .01, M.metal, window)

  for (const [index, x] of [-2.25, .05].entries()) {
    const bed = group(`care_bed_${index}`, [x, 0, -1.4])
    box([1.16, .22, 2.24], [0, .42, 0], M.white, .035, bed)
    box([1.11, .16, 2.16], [0, .6, 0], M.white, .045, bed)
    box([1.13, .065, 1.47], [0, .713, .3], index ? M.fabric : M.blue, .028, bed)
    box([1.14, .025, .29], [0, .758, .6], index ? M.green : M.fabric, .01, bed)
    const pillow = box([.73, .14, .43], [0, .74, -.76], M.white, .06, bed); pillow.rotation.x = -.12
    for (const z of [-1.15, 1.15]) {
      box([1.18, z < 0 ? .68 : .42, .065], [0, z < 0 ? .8 : .67, z], M.wood, .035, bed)
      box([.89, .22, .018], [0, z < 0 ? .81 : .68, z + (z < 0 ? .045 : -.045)], M.fabric, .04, bed)
      for (const dx of [-.5, .5]) { wheel(dx, z * .86, bed); rod([dx, .15, z * .86], [dx, .38, z * .86], .025, M.metal, bed) }
    }
    for (const dx of [-.59, .59]) {
      rod([dx, .83, -.84], [dx, .83, .18], .022, M.white, bed)
      for (const z of [-.84, -.33, .18]) rod([dx, .5, z], [dx, .83, z], .015, M.white, bed)
    }
    box([.8, .075, .07], [x, 1.18, back + .078], M.white, .01, rear)
    box([.08, .05, .012], [x + .29, 1.18, back + .12], M.clay, .006, rear)
    for (const dx of [-.22, -.04, .13]) box([.065, .035, .005], [x + dx, 1.18, back + .117], M.display, .004, rear)
    rod([x - .39, 1.2, back + .11], [x - .4, 1.62, back + .22], .012, M.metal, rear)
    box([.3, .045, .12], [x - .4, 1.64, back + .26], M.white, .015, rear)

    const cabinetName = index ? 'cabinetB' : 'cabinetA', s = CARE_SURFACES[cabinetName]
    const cabinet = group(`bedside_cabinet_${index}`)
    surface(cabinetName, cabinet)
    const [cx, cy, cz] = s.center
    box([s.width - .04, .58, s.depth - .025], [cx, .425, cz], M.wood, .014, cabinet)
    for (const y of [.24, .425, .61]) {
      box([.55, .17, .02], [cx, y, cz + .32], M.white, .005, cabinet)
      rod([cx - .11, y + .025, cz + .339], [cx + .11, y + .025, cz + .339], .007, M.metal, cabinet)
    }
    for (const dx of [-.23, .23]) for (const dz of [-.24, .24]) rod([cx + dx, .018, cz + dz], [cx + dx, cy - .035, cz + dz], .018, M.metal, cabinet)

    const tableName = index ? 'bedsideB' : 'bedsideA', t = CARE_SURFACES[tableName]
    const table = group(`overbed_table_${index}`); surface(tableName, table)
    const px = x - .68
    rod([px, .12, -.18], [px, t.center[1] - .055, -.18], .025, M.metal, table)
    rod([px, t.center[1] - .055, -.18], [x, t.center[1] - .055, -.18], .023, M.metal, table)
    for (const z of [-.43, .07]) {
      rod([px, .13, z], [x + .3, .13, z], .019, M.metal, table)
      for (const wx of [px, x + .3]) wheel(wx, z, table)
    }
    rod([px, .13, -.43], [px, .13, .07], .019, M.metal, table)
    table.userData.surfaceHeight = t.center[1]
  }

  const cabinet = group('supply_cabinet'), s = CARE_SURFACES.storage
  surface('storage', cabinet)
  box([2.16, .73, .63], [2.35, .52, -2.5], M.wood, .015, cabinet)
  for (const x of [1.62, 2.35, 3.08]) {
    box([.695, .64, .025], [x, .55, -2.174], M.white, .009, cabinet)
    rod([x + .21, .63, -2.151], [x + .21, .78, -2.151], .008, M.metal, cabinet)
  }
  for (const x of [1.29, 3.41]) box([.04, 1.14, .6], [x, 1.53, -2.5], M.wood, .005, cabinet)
  box([2.12, 1.17, .025], [2.35, 1.52, -2.805], M.wood, .004, cabinet)
  for (const y of [1.49, 2.09]) box([2.08, .035, .58], [2.35, y - .0175, -2.52], M.white, .006, cabinet)
  for (const [i, x] of [1.69, 2.32, 2.99].entries()) for (let layer = 0; layer < 3; layer++) {
    box([.39, .055, .28], [x, 1.518 + layer * .057, -2.49], i % 2 ? M.fabric : M.white, .013, cabinet)
  }
  for (const x of [1.41, 3.28]) for (const z of [-2.72, -2.28]) box([.06, .12, .06], [x, .078, z], M.metal, .004, cabinet)
  cabinet.userData.preparationHeight = s.center[1]

  const trolley = (name: string, at: Vec3, returning: boolean) => {
    const g = group(name)
    const [x, , z] = at
    for (const dx of [-.49, .49]) for (const dz of [-.33, .33]) {
      wheel(x + dx, z + dz, g)
      rod([x + dx, .15, z + dz], [x + dx, .97, z + dz], .018, M.metal, g)
    }
    box([1.1, .032, .77], [x, .29, z], M.white, .008, g)
    // Bin floors sit on the return deck; the clean cart has only its authored support top.
    if (returning) box([1.12, .035, .8], [x, .8475, z], M.display, .012, g)
    for (const dx of [-.54, .54]) rod([x + dx, .947, z - .35], [x + dx, .947, z + .35], .01, M.metal, g)
    for (const dz of [-.35, .35]) rod([x - .54, .947, z + dz], [x + .54, .947, z + dz], .01, M.metal, g)
    for (const dz of [-.27, .27]) rod([x + .51, .94, z + dz], [x + .66, 1.03, z + dz], .014, M.metal, g)
    rod([x + .66, 1.03, z - .27], [x + .66, 1.03, z + .27], .02, returning ? M.clay : M.green, g)
    if (returning) {
      surface('returnCups', g); surface('returnLinen', g)
      for (const [dx, tone] of [[-.27, M.display], [.27, M.fabric]] as const) {
        for (const dz of [-.315, .315]) box([.45, .16, .014], [x + dx, .983, z + dz], tone, .004, g)
        for (const ex of [-.228, .228]) box([.014, .16, .64], [x + dx + ex, .983, z], tone, .004, g)
      }
      for (const dx of [-.26, .26]) box([.4, .29, .54], [x + dx, .45, z], dx < 0 ? M.display : M.fabric, .024, g)
    } else {
      surface('service', g)
      box([.43, .26, .5], [x + .25, .435, z], M.fabric, .017, g)
      for (let i = 0; i < 3; i++) box([.35, .05, .31], [x - .25, .332 + i * .052, z], M.white, .014, g)
    }
  }
  trolley('clean_service_cart', CARE_SURFACES.service.center, false)
  trolley('return_cart', [2.55, .9, 2.15], true)

  const chair = group('visitor_chair', [-3.02, 0, 1.86]); chair.rotation.y = -.32
  box([.57, .11, .57], [0, .46, 0], M.fabric, .05, chair)
  box([.59, .54, .095], [0, .72, .27], M.fabric, .05, chair)
  for (const x of [-.28, .28]) {
    box([.06, .06, .5], [x, .65, .015], M.wood, .018, chair)
    for (const z of [-.21, .21]) rod([x, .035, z], [x, .635, z], .018, M.wood, chair)
  }
  const walker = group('walking_frame', [-1.28, 0, 2.32])
  for (const x of [-.25, .25]) {
    for (const z of [-.22, .22]) {
      rod([x, .028, z], [x * .9, .86, z * .85], .018, M.metal, walker)
      box([.055, .034, .055], [x, .035, z], M.rubber, .012, walker)
    }
    rod([x * .9, .86, -.19], [x * .9, .86, .19], .023, M.ink, walker)
  }
  for (const y of [.34, .7]) rod([-.23, y, -.2], [.23, y, -.2], .015, M.metal, walker)
  const tv = group('wall_television'); tv.userData.cutaway = 'back'
  box([1.0, .61, .035], [-.66, 1.78, back + .065], M.ink, .016, tv)
  box([.955, .56, .004], [-.66, 1.78, back + .085], M.display, .006, tv)
  box([.41, .055, .08], [-.66, 1.398, back + .084], M.ink, .008, tv)
  const camera = group('collection_camera', [.53, 0, 2.73])
  rod([0, .08, 0], [0, 1.38, 0], .013, M.ink, camera)
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; rod([0, .42, 0], [Math.cos(a) * .22, .018, Math.sin(a) * .22], .011, M.ink, camera) }
  box([.17, .09, .075], [0, 1.41, 0], M.ink, .012, camera)
  cylinder(.026, .025, [0, 1.41, -.048], M.display, camera).rotation.x = Math.PI / 2

  const initial = buildTaskProps(careTaskFrame(0, 'everyday'))
  initial.root.userData.taskProp = true; root.add(initial.root)
  return { root, dispose: () => { initial.dispose(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()) } }
}
