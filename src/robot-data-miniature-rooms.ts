import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { SceneDefinition, Vec3 } from './robot-data-miniature-catalog'
import { isOutdoorScene } from './robot-data-miniature-catalog'
import { buildOutdoorRoom } from './robot-data-miniature-outdoor-room'
import { isWorkScene } from './robot-data-miniature-work-tasks'
import { buildWorkRoom } from './robot-data-miniature-work-rooms'
import { buildCareRoom } from './robot-data-miniature-care-room'
import { buildSushiRoom } from './robot-data-miniature-sushi-room'
import { buildProduceRoom } from './robot-data-miniature-produce-room'
import { buildOfficeRoom } from './robot-data-miniature-office-room'

// Shared metre-scale joinery keeps the new rooms in the approved kitchen's material language.
export function buildCollectionRoom(scene: SceneDefinition, wood: THREE.Texture, normal: THREE.Texture) {
  if (isOutdoorScene(scene.id)) return buildOutdoorRoom(scene, wood, normal)
  if (scene.id === 'care') return buildCareRoom(scene, wood, normal)
  if (scene.id === 'sushi') return buildSushiRoom(scene, wood, normal)
  if (scene.id === 'produce') return buildProduceRoom(scene, wood, normal)
  if (scene.id === 'office') return buildOfficeRoom(scene, wood, normal)
  if (isWorkScene(scene.id)) return buildWorkRoom({ ...scene, id: scene.id }, wood, normal)
  const root = new THREE.Group()
  root.name = scene.id
  const geometries: THREE.BufferGeometry[] = []
  const materials: THREE.Material[] = []
  const material = (color: string, roughness = .75, metalness = 0) => {
    const result = new THREE.MeshStandardMaterial({ color, roughness, metalness })
    materials.push(result)
    return result
  }
  const M = {
    wall: material('#eef0eb', .92), floor: material('#d9ddd7', .86), base: material('#8a948f'),
    ink: material('#263234', .5), wood: material('#c6af8e', .68), pale: material('#bcc9bc'),
    white: material('#f1f2ed', .37), green: material('#546c62', .58), blue: material('#48718b'),
    clay: material('#b77560'), fabric: material('#c7ccc4', .98), darkFabric: material('#748577', .98),
    metal: material('#b9c5c6', .26, .8), glass: material('#516a72', .19, .3), yellow: material('#c1b171'),
    coffee: material('#51483f'), pastry: material('#bd9562'), paper: material('#e3ddca'),
    clear: material('#c5dde0', .14), display: material('#829fa2', .3), red: material('#bd665d'),
  }
  M.clear.transparent = true; M.clear.opacity = .2; M.clear.depthWrite = false
  M.wood.map = wood; M.wood.normalMap = normal; M.wood.normalScale.set(.18, .18)
  const mesh = (geometry: THREE.BufferGeometry, mat: THREE.Material, at: Vec3, parent: THREE.Object3D = root) => {
    geometries.push(geometry)
    const item = new THREE.Mesh(geometry, mat)
    item.position.set(...at); item.castShadow = item.receiveShadow = true
    parent.add(item); return item
  }
  const box = (size: Vec3, at: Vec3, mat = M.white, r = .006, parent: THREE.Object3D = root) => mesh(r ? new RoundedBoxGeometry(...size, 2, Math.min(r, ...size.map(v => v / 3))) : new THREE.BoxGeometry(...size), mat, at, parent)
  const cylinder = (r: number, height: number, at: Vec3, mat = M.metal, parent: THREE.Object3D = root) => mesh(new THREE.CylinderGeometry(r, r, height, 24), mat, at, parent)
  const rod = (a: Vec3, b: Vec3, r: number, mat = M.ink, parent: THREE.Object3D = root) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b)
    const item = cylinder(r, start.distanceTo(end), [0, 0, 0], mat, parent)
    item.position.copy(start).add(end).multiplyScalar(.5)
    item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize())
  }
  const ring = (radius: number, tube: number, at: Vec3, mat = M.metal) => mesh(new THREE.TorusGeometry(radius, tube, 10, 40), mat, at)
  const group = (at: Vec3, rotation = 0) => { const result = new THREE.Group(); result.position.set(...at); result.rotation.y = rotation; root.add(result); return result }
  const cup = (at: Vec3, mat = M.white, parent: THREE.Object3D = root) => {
    const profile = [[0, 0], [.035, 0], [.045, .095], [.038, .099], [.03, .014], [0, .014]].map(p => new THREE.Vector2(...p as [number, number]))
    mesh(new THREE.LatheGeometry(profile, 24), mat, at, parent)
    const handle = mesh(new THREE.TorusGeometry(.027, .006, 8, 20), mat, [at[0] + .042, at[1] + .052, at[2]], parent)
    handle.rotation.y = Math.PI / 2
  }
  const bottle = (at: Vec3, mat = M.green, h = .23) => {
    cylinder(.041, h * .72, [at[0], at[1] + h * .36, at[2]], mat)
    cylinder(.019, h * .3, [at[0], at[1] + h * .85, at[2]], mat)
    cylinder(.021, .018, [at[0], at[1] + h, at[2]], M.ink)
  }
  const table = (at: Vec3, w: number, d: number, h = .77, mat = M.wood) => {
    box([w, .045, d], [at[0], h, at[2]], mat, .012)
    for (const x of [-1, 1]) for (const z of [-1, 1]) box([.045, h - .04, .045], [at[0] + x * (w / 2 - .08), h / 2 - .005, at[2] + z * (d / 2 - .08)], M.ink)
  }
  const basket = (at: Vec3, w = .5, d = .38, h = .28) => {
    box([w, .02, d], [at[0], at[1] + .01, at[2]], M.pale)
    for (const z of [-1, 1]) {
      box([w, .025, .018], [at[0], at[1] + h, at[2] + z * d / 2], M.pale)
      for (let i = 0; i < 9; i++) box([.022, h, .014], [at[0] - w / 2 + .02 + i * (w - .04) / 8, at[1] + h / 2, at[2] + z * d / 2], M.pale)
    }
    for (const x of [-1, 1]) box([.018, h, d], [at[0] + x * w / 2, at[1] + h / 2, at[2]], M.pale)
  }
  const plant = (at: Vec3) => {
    const pot = mesh(new THREE.CylinderGeometry(.14, .1, .24, 24), M.clay, [at[0], .14, at[2]])
    pot.name = 'planter'
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4, y = .45 + i % 3 * .12
      const x = at[0] + Math.cos(a) * .15, z = at[2] + Math.sin(a) * .15
      rod([at[0], .25, at[2]], [x, y, z], .004, M.green)
      const leaf = mesh(new THREE.SphereGeometry(1, 12, 8), M.green, [x, y, z])
      leaf.scale.set(.06, .13, .013); leaf.rotation.set(.3, a, .4)
    }
  }
  const chair = (at: Vec3, rotation = 0, height = .46) => {
    const item = group(at, rotation); item.name = 'chair'
    box([.4, .045, .4], [0, height, 0], M.wood, .035, item)
    for (const x of [-.14, .14]) for (const z of [-.14, .14]) rod([x, height, z], [x * 1.25, .03, z * 1.25], .015, M.ink, item)
    for (const x of [-.16, .16]) rod([x, height, .17], [x, height + .36, .19], .013, M.ink, item)
    box([.39, .24, .04], [0, height + .28, .19], M.wood, .03, item)
  }
  const goods = (at: Vec3, kind = 0, parent: THREE.Object3D = root) => {
    const tone = [M.blue, M.clay, M.yellow, M.green][kind % 4]
    if (kind % 3 === 0) {
      cylinder(.045, .15, [at[0], at[1] + .075, at[2]], tone, parent)
      cylinder(.043, .007, [at[0], at[1] + .153, at[2]], M.metal, parent)
    } else {
      box([.115, .18, .08], [at[0], at[1] + .09, at[2]], tone, .012, parent)
      box([.07, .065, .002], [at[0], at[1] + .1, at[2] + .041], M.paper, .001, parent)
    }
  }
  const cart = (at: Vec3, rotation = 0, linen = false) => {
    const item = group(at, rotation); item.name = linen ? 'linen_cart' : 'shopping_cart'
    for (const x of [-.23, .23]) for (const z of [-.34, .34]) {
      const wheel = cylinder(.055, .033, [x, .055, z], M.ink, item); wheel.rotation.z = Math.PI / 2
      rod([x, .11, z], [x, .25, z], .015, M.metal, item)
    }
    for (const x of [-.25, .25]) {
      rod([x, .22, -.38], [x, .22, .38], .017, M.metal, item)
      rod([x, .22, .32], [x, .97, .4], .019, M.metal, item)
      rod([x, .83, -.38], [x, .83, .4], .013, M.metal, item)
      for (let z = -.36; z <= .38; z += .085) rod([x * .75, .5, z * .78], [x, .83, z], .004, M.metal, item)
      for (const y of [.58, .68, .78]) rod([x * (.75 + (y - .5) * .76), y, -.36], [x * (.75 + (y - .5) * .76), y, .39], .004, M.metal, item)
    }
    rod([-.25, .97, .4], [.25, .97, .4], .023, M.green, item)
    box([.4, .025, .61], [0, .5, 0], M.metal, .008, item)
    box([.43, .015, .65], [0, .22, 0], M.metal, .004, item)
    for (const z of [-.38, .4]) {
      rod([-.25, .83, z], [.25, .83, z], .012, M.metal, item)
      for (let x = -.22; x < .24; x += .065) rod([x * .8, .51, z * .79], [x, .83, z], .004, M.metal, item)
    }
    const cargoStart = item.children.length
    if (linen) for (let i = 0; i < 4; i++) box([.34, .06, .47], [0, .55 + i * .062, 0], i % 2 ? M.white : M.fabric, .025, item)
    else for (let i = 0; i < 6; i++) goods([-.09 + i % 2 * .18, .52, -.18 + Math.floor(i / 2) * .18], i, item)
    if (scene.id === 'retail' || scene.id === 'laundry') item.children.slice(cargoStart).forEach(node => { node.userData.taskProp = true })
  }
  const monitor = (at: Vec3, rotation = 0, width = .36) => {
    const item = group(at, rotation); item.name = 'monitor'
    box([width * .55, .02, .17], [0, .01, 0], M.ink, .012, item)
    rod([0, .02, 0], [0, .23, -.02], .017, M.metal, item)
    box([width, width * .65, .035], [0, .29, 0], M.ink, .012, item)
    box([width - .025, width * .65 - .028, .003], [0, .29, .019], M.display, .002, item)
    for (let i = 0; i < 3; i++) box([width * .42, .012, .001], [-width * .15, .31 - i * .035, .022], M.white, .001, item)
    for (let i = 0; i < 4; i++) box([.035, .026, .001], [width * .3, .345 - i * .037, .022], i === 2 ? M.clay : M.pale, .002, item)
    return item
  }
  const rimmedBasin = (at: Vec3, radius: number, height: number, depthScale = 1) => {
    const profile = [[0, 0], [radius * .66, 0], [radius * .96, height * .84], [radius, height], [radius * .87, height + .012], [radius * .76, height * .22], [0, height * .2]]
    const item = mesh(new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), 48), M.white, at)
    item.scale.z = depthScale; return item
  }
  const { width: w, depth: d } = scene
  const back = -d / 2 + .12, left = -w / 2 + .06
  box([w, .1, d], [0, -.065, 0], M.base, .02)
  box([w - .035, .035, d - .035], [0, -.007, 0], M.floor, .012)
  const cols = Math.ceil(w / .66), rows = Math.ceil(d / .66)
  for (let x = 0; x < cols; x++) for (let z = 0; z < rows; z++) box([w / cols - .006, .007, d / rows - .006], [-w / 2 + (x + .5) * w / cols, .014, -d / 2 + (z + .5) * d / rows], M.floor, .001)
  const shellStart = root.children.length
  box([w, 2.35, .12], [0, 1.175, back - .06], M.wall)
  box([.12, .65, d - .88], [left, .325, 0], M.wall)
  box([.12, 2.35, .32], [left, 1.175, -d / 2 + .28], M.wall)
  box([.12, 2.35, .38], [left, 1.175, d / 2 - .25], M.wall)
  box([.12, .16, d - .88], [left, 2.27, 0], M.wall)
  box([w - .15, .065, .016], [.025, .055, back + .007], M.ink, .001)
  box([.22, .04, d - .72], [left + .04, .67, 0], M.white)
  for (let i = 0; i <= 3; i++) box([.04, 1.5, .035], [left, 1.46, -(d - .78) / 2 + i * (d - .78) / 3], M.ink, .001)
  for (const y of [.7, 1.73, 2.21]) box([.052, .035, d - .76], [left, y, 0], M.ink, .001)
  root.children.slice(shellStart).forEach(item => { item.userData.cutaway = item.position.x < left + .3 ? 'left' : 'back' })

  if (scene.id === 'living') {
    box([2.9, .018, 2.5], [0, .031, .05], M.fabric, .025)
    const sofaStart = root.children.length
    box([2.6, .22, .94], [.1, .25, back + .8], M.darkFabric, .07)
    box([2.6, .55, .21], [.1, .62, back + .43], M.darkFabric, .06)
    for (const x of [-1.15, 1.35]) box([.21, .46, .92], [x, .5, back + .8], M.darkFabric, .07)
    for (const x of [-.66, .1, .86]) box([.72, .15, .7], [x, .42, back + .86], M.fabric, .05)
    for (const x of [-.82, .96]) { const cushion = box([.42, .4, .12], [x, .71, back + .62], x < 0 ? M.clay : M.pale, .06); cushion.rotation.z = .15 }
    const sofaParts = root.children.slice(sofaStart)
    const sofa = group([0, 0, 0], -Math.PI / 2); sofa.name = 'sofa'
    sofaParts.forEach(part => sofa.add(part))
    table([.1, 0, .35], 1.42, .73, .47)
    const tableProps = root.children.length
    box([.28, .024, .22], [.35, .509, .37], M.blue)
    box([.055, .015, .18], [-.25, .501, .41], M.ink)
    cup([-.35, .494, .22], M.clay)
    root.children.slice(tableProps).forEach(node => { node.userData.taskProp = true })
    table([1.38, 0, -1.77], .49, .49, .55)
    rod([1.38, .58, -1.84], [1.38, 1.07, -1.84], .016)
    mesh(new THREE.ConeGeometry(.22, .25, 32, 1, true), M.white, [1.38, 1.12, -1.84])
    box([1.05, .66, .025], [0, 1.5, back + .025], M.wood)
    box([.92, .55, .015], [0, 1.5, back + .046], M.pale)
    box([.32, .21, .006], [-.22, 1.43, back + .057], M.blue)
    plant([-1.9, 0, 1.55])
    // Place the television opposite the sofa, leaving the front of the room open.
    const mediaStart = root.children.length
    box([1.62, .3, .34], [.08, .24, 1.89], M.wood, .025).name = 'tv_console'
    for (const x of [-.6, .75]) for (const z of [1.78, 2]) cylinder(.02, .085, [x, .065, z], M.ink)
    const tv = group([.08, .41, 1.89], Math.PI); tv.name = 'television'
    box([1.3, .73, .035], [0, .48, 0], M.ink, .012, tv)
    box([1.265, .695, .003], [0, .48, .02], M.glass, .005, tv)
    for (const x of [-.4, .4]) for (const z of [-.09, .09]) rod([x, .12, 0], [x + .06, .015, z], .014, M.ink, tv)
    box([.67, .07, .09], [.07, .435, 1.74], M.ink)
    const mediaParts = root.children.slice(mediaStart)
    const media = group([0, 0, -.32], -Math.PI / 2)
    mediaParts.forEach(part => media.add(part))
    basket([-1.21, .022, 1.76], .38, .3, .24)
    for (let i = 0; i < 3; i++) box([.025, .27, .21], [-1.28 + i * .042, .18, 1.76], [M.blue, M.paper, M.clay][i]).userData.taskProp = true
    cup([1.52, .576, -1.62], M.white)
  } else if (scene.id === 'bedroom') {
    const bedStart = root.children.length
    box([1.65, .3, 2.14], [-.38, .23, -.34], M.wood, .025)
    box([1.7, 1.06, .09], [-.38, .55, -1.47], M.wood, .018)
    box([1.6, .18, 2.04], [-.38, .47, -.32], M.white, .055)
    box([1.64, .075, 1.39], [-.38, .593, .04], M.fabric, .025)
    box([1.65, .07, .45], [-.38, .64, .4], M.darkFabric, .018)
    for (const x of [-.79, .04]) box([.62, .13, .43], [x, .63, -1], M.white, .055)
    for (const x of [-1.55, .8]) { table([x, 0, -1.29], .47, .47, .53); box([.17, .026, .21], [x, .565, -1.25], M.blue) }
    const bedParts = root.children.slice(bedStart), bed = group([0, 0, -.86]); bed.name = 'bed_and_nightstands'
    bedParts.forEach(part => bed.add(part))
    basket([1.4, .024, .99], .53, .47, .36)
    box([.33, .08, .25], [1.4, .17, .99], M.fabric, .018).userData.taskProp = true
    box([1.48, 1.93, .55], [1.8, .99, back + .35], M.pale).name = 'wardrobe'
    for (const x of [1.43, 2.17]) { box([.7, 1.82, .024], [x, 1.01, back + .64], M.wood); rod([x + .23, .98, back + .663], [x + .23, 1.2, back + .663], .006) }
    box([2.13, .013, 1.07], [-.4, .03, 1.43], M.darkFabric, .015)
    table([-1.5, 0, 1.84], 1.13, .42, .76)
    box([.37, .25, .36], [-1.85, .61, 1.84], M.wood, .015).name = 'vanity_desk'
    rod([-1.98, .66, 1.61], [-1.73, .66, 1.61], .006, M.metal)
    const mirror = ring(.28, .018, [-1.4, 1.2, 1.97], M.metal); mirror.name = 'vanity_mirror'
    cylinder(.263, .014, [-1.4, 1.2, 1.97], M.glass).rotation.x = Math.PI / 2
    for (const x of [-1.59, -1.21]) rod([x, .79, 1.97], [x, 1.06, 1.97], .009, M.metal)
    chair([-1.42, 0, 1.17], Math.PI)
    for (let i = 0; i < 3; i++) bottle([-1.92 + i * .115, .784, 1.86], [M.blue, M.white, M.clay][i], .1 + i * .025)
    box([.18, .05, .14], [-1.05, .81, 1.78], M.pale, .014)
    for (const x of [-1.55, .8]) { cylinder(.075, .025, [x, .57, -2.25], M.metal); rod([x, .58, -2.25], [x, .84, -2.25], .012, M.metal); mesh(new THREE.ConeGeometry(.13, .19, 24, 1, true), M.paper, [x, .87, -2.25]) }
    table([-2.17, 0, -.2], .4, .48, .54)
    for (let i = 0; i < 3; i++) box([.23, .035, .3], [-2.17, .58 + i * .036, -.2], i % 2 ? M.paper : M.blue)
    plant([-2.2, 0, 2.14])
  } else if (scene.id === 'bathroom') {
    box([1.7, .67, .61], [.42, .43, back + .48], M.wood)
    box([1.82, .045, .7], [.42, .79, back + .48], M.white)
    const basin = cylinder(.245, .06, [.43, .843, back + .49], M.white); basin.scale.z = .76
    const inside = cylinder(.204, .009, [.43, .877, back + .49], M.glass); inside.scale.z = .73
    rod([.43, .815, back + .22], [.43, 1.07, back + .22], .012, M.metal)
    rod([.43, 1.07, back + .22], [.43, 1.07, back + .39], .012, M.metal)
    box([1.51, .86, .035], [.42, 1.52, back + .03], M.metal)
    box([1.44, .8, .016], [.42, 1.52, back + .057], M.glass)
    const vanityProps = root.children.length
    for (const x of [-.28, -.1]) bottle([x, .815, back + .52], x < -.2 ? M.blue : M.white, .18)
    box([.32, .055, .21], [.97, .841, back + .55], M.fabric, .02)
    root.children.slice(vanityProps).forEach(node => { node.userData.taskProp = true })
    for (const z of [-.8, -.35]) rod([2.03, .03, z], [2.03, 1.05, z], .013, M.metal)
    rod([2.03, 1.05, -.8], [2.03, 1.05, -.35], .012, M.metal)
    box([.025, .48, .32], [2.03, .82, -.55], M.fabric)
    basket([-.98, .024, 1.52], .52, .5, .57)
    box([.9, .015, .54], [.37, .031, -.92], M.darkFabric, .012)
    box([1.61, .014, 2.78], [1.35, .021, .61], M.pale, .009).name = 'wet_zone'
    const tub = rimmedBasin([1.42, .039, .73], .43, .52, 1.95); tub.name = 'bathtub'
    const water = cylinder(.33, .013, [1.42, .224, .73], M.display); water.scale.z = 1.9
    box([.89, .025, .16], [1.42, .588, 1.03], M.wood, .012)
    bottle([1.68, .602, 1.03], M.clay, .13)
    rod([1.95, .04, .09], [1.95, .894, .09], .019, M.metal)
    rod([1.95, .894, .09], [1.68, .894, .09], .018, M.metal)
    rod([1.68, .894, .09], [1.68, .834, .09], .018, M.metal)
    const toiletStart = root.children.length
    box([.35, .61, .17], [-1.02, .33, back + .15], M.white, .04).name = 'toilet'
    box([.38, .035, .2], [-1.02, .65, back + .15], M.white, .025)
    box([.08, .008, .045], [-1.02, .673, back + .15], M.metal, .008)
    const pedestal = cylinder(.13, .2, [-1.02, .125, back + .44], M.white); pedestal.scale.z = 1.45
    rimmedBasin([-1.02, .18, back + .48], .225, .23, 1.35)
    const seat = ring(.212, .023, [-1.02, .427, back + .48], M.white); seat.rotation.x = Math.PI / 2; seat.scale.y = 1.32
    const tissue = cylinder(.05, .105, [-.68, .67, back + .27], M.paper); tissue.rotation.z = Math.PI / 2
    rod([-.64, .026, back + .27], [-.64, .61, back + .27], .012, M.metal)
    const toiletParts = root.children.slice(toiletStart), toiletZone = group([-.63, 0, 0]); toiletZone.name = 'toilet_zone'
    toiletParts.forEach(part => toiletZone.add(part))
    box([.075, 1.2, 1.17], [-1.08, .62, back + .61], M.wall, .01).name = 'privacy_partition'
    const linenCabinet = group([-1.87, 0, .35]); linenCabinet.name = 'bath_linen_cabinet'
    box([.468, 1.45, .035], [0, .75, -.185], M.wood, .006, linenCabinet)
    for (const x of [-.252, .252]) box([.036, 1.45, .4], [x, .75, 0], M.wood, .006, linenCabinet)
    for (const y of [.54, .98, 1.42]) {
      box([.48, .03, .36], [0, y, .02], M.white, .005, linenCabinet)
      for (let i = 0; i < 2; i++) box([.36, .065, .25], [0, y + .05 + i * .069, .04], M.fabric, .02, linenCabinet)
    }
  } else if (scene.id === 'retail') {
    const shelf = (cx: number, cz: number, width: number, height: number) => {
      box([width - .035, height, .035], [cx, height / 2 + .05, cz - .2], M.blue)
      for (const x of [cx - width / 2, cx + width / 2]) box([.035, height, .46], [x, height / 2 + .05, cz], M.ink)
      for (let row = 0; row < 4; row++) {
        const y = .16 + row * (height - .15) / 4
        box([width, .035, .47], [cx, y, cz], M.white)
        box([width, .042, .009], [cx, y - .004, cz + .24], M.pale)
        for (let col = 0; col < 7; col++) {
          const x = cx - width / 2 + .17 + col * (width - .34) / 6
          const stockStart = root.children.length
          if (row % 2) bottle([x, y + .018, cz], [M.clay, M.green, M.white][col % 3], .21)
          else { box([.17, .24, .15], [x, y + .137, cz], [M.pale, M.blue, M.yellow][col % 3]); box([.1, .055, .003], [x, y + .15, cz + .077], M.white, .001) }
          if (cx < 0 && (row === 1 || row === 2) && col >= 1 && col <= 3) root.children.slice(stockStart).forEach(node => { node.userData.taskProp = true })
          box([.09, .03, .004], [x, y, cz + .247], M.paper, .001)
        }
      }
    }
    shelf(-1.29, back + .35, 2.25, 1.98); shelf(1.17, back + .35, 2.25, 1.98)
    shelf(1.27, .18, 1.75, 1.19)
    basket([1.02, .024, 1.61], .8, .5, .37)
    for (let i = 0; i < 3; i++) box([.17, .24, .14], [.8 + i * .19, .17, 1.61], M.clay).userData.taskProp = true
    cart([-1.9, .018, .9], .12)
    const lowerGoods = root.children.length
    for (const x of [-2.04, -1.9, -1.76]) goods([x, .246, 1.02], 3)
    root.children.slice(lowerGoods).forEach(node => { node.userData.taskProp = true })
    box([.08, 1.35, .08], [2.42, .695, .1], M.ink)
    box([.4, .3, .055], [2.42, 1.34, .1], M.pale)
  } else if (scene.id === 'checkout') {
    box([1.12, .82, 2.27], [.53, .45, .2], M.blue, .014)
    box([1.25, .055, 2.4], [.53, .887, .2], M.white)
    box([.87, .015, 1.08], [.53, .925, -.33], M.ink, .012)
    for (const z of [-.87, .22]) { const roller = cylinder(.025, .89, [.53, .932, z], M.metal); roller.rotation.z = Math.PI / 2 }
    // Customer lane is +X; the operator and POS face each other across -X.
    monitor([.05, .922, -.6], -Math.PI / 2, .4).name = 'cashier_pos'
    monitor([.81, .922, .6], Math.PI / 2, .23).name = 'customer_payment'
    box([.27, .018, .33], [.12, .931, .2], M.metal, .012).name = 'barcode_scan_bed'
    box([.19, .004, .25], [.12, .943, .2], M.glass, .008)
    box([.14, .002, .004], [.12, .946, .2], M.red, .001)
    const gun = group([.02, .924, .57], -Math.PI / 2); gun.name = 'barcode_scanner'
    box([.095, .018, .13], [0, .009, 0], M.ink, .015, gun)
    rod([0, .02, 0], [0, .13, -.025], .024, M.ink, gun)
    const grip = box([.045, .13, .042], [0, .15, -.018], M.ink, .01, gun); grip.rotation.x = -.35
    const head = box([.085, .058, .13], [0, .223, .011], M.ink, .014, gun); head.rotation.x = -.25
    box([.065, .032, .004], [0, .233, .075], M.red, .004, gun)
    const cord = new THREE.CatmullRomCurve3([[.02, .94, .56], [-.04, .87, .83], [.18, .924, .83], [.24, .928, .39]].map(v => new THREE.Vector3(...v as Vec3)))
    mesh(new THREE.TubeGeometry(cord, 20, .004, 6, false), M.ink, [0, 0, 0])
    box([.15, .11, .17], [.27, .984, .71], M.ink, .012).name = 'receipt_printer'
    box([.09, .002, .075], [.27, 1.041, .765], M.paper).userData.taskProp = true
    const tillProps = root.children.length
    for (let i = 0; i < 5; i++) goods([.39 + i % 2 * .22, .936, -.72 + Math.floor(i / 2) * .22], i)
    // Open paper bags sit beyond the scan bed, rather than empty oversized crates.
    for (const x of [.37, .83]) {
      box([.238, .018, .23], [x, .934, 1.04], M.paper)
      for (const z of [.918, 1.162]) box([.238, .29, .014], [x, 1.07, z], M.paper)
      for (const dx of [-.126, .126]) box([.014, .29, .258], [x + dx, 1.07, 1.04], M.paper)
      for (const z of [.92, 1.16]) {
        const handle = ring(.058, .005, [x, 1.25, z], M.wood); handle.scale.y = .8
      }
      goods([x, .95, 1.04], x < .5 ? 1 : 2)
    }
    root.children.slice(tillProps).forEach(node => { node.userData.taskProp = true })
    cart([1.68, .018, -.52], Math.PI)
    box([.63, .024, 1.07], [-.87, .03, .03], M.darkFabric, .025).name = 'cashier_mat'
    box([2.8, .12, .53], [0, .13, back + .39], M.wood)
    for (let i = 0; i < 4; i++) { basket([-1.02 + i * .68, .21, back + .39], .58, .44, .32) }
    for (const y of [1.13, 1.48]) {
      box([1.48, .035, .2], [.47, y, back + .14], M.white)
      for (let i = 0; i < 8; i++) goods([-.15 + i * .17, y + .018, back + .15], i)
    }
  } else if (scene.id === 'cafe') {
    box([4.52, .79, .71], [.16, .43, back + .49], M.wood)
    box([4.65, .05, .82], [.16, .85, back + .49], M.white)
    for (let i = 0; i < 24; i++) box([.04, .73, .017], [-1.99 + i * .187, .43, back + .859], M.green, .002)
    box([.94, .4, .47], [-.25, 1.11, back + .42], M.metal, .025).name = 'espresso_machine'
    box([.87, .25, .03], [-.25, 1.11, back + .67], M.blue, .018)
    box([.96, .027, .4], [-.25, 1.325, back + .45], M.metal)
    for (const x of [-.48, -.08]) {
      const gauge = cylinder(.044, .014, [x, 1.18, back + .693], M.white); gauge.rotation.x = Math.PI / 2
      rod([x, 1.18, back + .705], [x + .025, 1.197, back + .705], .002, M.ink)
      cylinder(.053, .06, [x, 1.02, back + .74], M.metal)
      rod([x, 1.04, back + .75], [x, 1.04, back + .91], .016)
      rod([x, .994, back + .74], [x, .97, back + .74], .005, M.metal)
      cup([x, .905, back + .74]); cup([x, 1.34, back + .43])
    }
    rod([.2, 1.09, back + .67], [.3, .95, back + .83], .008, M.metal)
    box([.92, .025, .31], [-.25, .891, back + .73], M.metal)
    for (let i = 0; i < 15; i++) box([.007, .003, .23], [-.66 + i * .057, .905, back + .73], M.ink, .001)
    cylinder(.1, .23, [.59, 1.24, back + .44], M.clear).name = 'coffee_grinder'
    cylinder(.075, .08, [.59, 1.165, back + .44], M.coffee)
    cylinder(.106, .018, [.59, 1.365, back + .44], M.ink)
    box([.23, .27, .28], [.59, 1.015, back + .45], M.ink, .025)
    rod([.59, 1.09, back + .61], [.59, 1.09, back + .73], .022, M.metal)
    cylinder(.065, .115, [.83, .933, back + .7], M.metal)
    ring(.035, .007, [.897, .948, back + .7], M.metal)
    for (const y of [1.52, 1.99]) {
      box([2.36, .04, .27], [.88, y, back + .16], M.wood)
      for (let i = 0; i < 6; i++) cup([-.1 + i * .31, y + .02, back + .18], i % 2 ? M.white : M.clay)
    }
    // A service bar separates the preparation aisle from customer seating.
    box([2.55, .73, .78], [.9, .405, .69], M.green, .018).name = 'service_bar'
    box([2.66, .055, .9], [.9, .82, .69], M.white, .018)
    for (let i = 0; i < 20; i++) box([.037, .69, .015], [-.3 + i * .126, .415, 1.087], M.wood, .002)
    rod([-.22, .24, 1.23], [2.02, .24, 1.23], .016, M.metal)
    for (const x of [-.15, 1.95]) rod([x, .24, 1.23], [x, .24, 1.08], .012, M.metal)
    const barProps = root.children.length
    box([.58, .025, .38], [.3, .861, .46], M.wood, .014)
    for (let i = 0; i < 3; i++) cylinder(.105, .012, [.9, .854 + i * .014, .46], M.white)
    cup([-.03, .849, .66], M.clay); cup([.32, .875, .42], M.white)
    root.children.slice(barProps).forEach(node => { node.userData.taskProp = true })
    // Glazed pastry display, with distinct food silhouettes inside.
    box([.68, .06, .6], [1.65, .88, .65], M.wood, .018).name = 'pastry_case'
    for (const x of [1.32, 1.98]) for (const z of [.36, .94]) rod([x, .91, z], [x, 1.32, z], .009, M.metal)
    box([.69, .015, .62], [1.65, 1.325, .65], M.clear)
    for (const z of [.35, .95]) box([.66, .4, .009], [1.65, 1.115, z], M.clear)
    for (const x of [1.32, 1.98]) box([.009, .4, .6], [x, 1.115, .65], M.clear)
    for (let i = 0; i < 4; i++) {
      const x = 1.48 + i % 2 * .29, z = .52 + Math.floor(i / 2) * .24
      cylinder(.092, .009, [x, .918, z], M.white)
      if (i % 2) { cylinder(.067, .08, [x, .96, z], M.pastry); cylinder(.067, .012, [x, 1.006, z], M.white) }
      else { const pastry = mesh(new THREE.TorusGeometry(.061, .027, 10, 20, Math.PI * 1.45), M.pastry, [x, .943, z]); pastry.rotation.x = Math.PI / 2 }
    }
    chair([.18, 0, 1.66], 0, .59); chair([1.23, 0, 1.66], 0, .59)
    cylinder(.4, .04, [-1.98, .73, 1.18], M.wood).name = 'cafe_table'
    cylinder(.039, .67, [-1.98, .375, 1.18], M.ink)
    cylinder(.24, .028, [-1.98, .037, 1.18], M.ink)
    chair([-2.52, 0, .91], -Math.PI / 2); chair([-1.57, 0, 1.7], .7)
    const tableProps = root.children.length
    cup([-2.08, .752, 1.17]); cup([-1.83, .752, 1.1], M.clay)
    box([.13, .19, .07], [-2, .85, 1.38], M.paper, .009)
    root.children.slice(tableProps).forEach(node => { node.userData.taskProp = true })
    box([.64, .75, .035], [-1.59, 1.66, back + .04], M.wood, .014)
    box([.57, .68, .013], [-1.59, 1.66, back + .066], M.ink, .008)
    for (let i = 0; i < 6; i++) box([i % 2 ? .29 : .39, .009, .004], [-1.62, 1.89 - i * .079, back + .075], M.paper, .001)
    for (let i = 0; i < 3; i++) { box([.13, .23, .09], [-1.8 + i * .17, 1, back + .45], M.paper, .014); box([.075, .08, .003], [-1.8 + i * .17, 1, back + .497], [M.green, M.clay, M.blue][i]) }
    plant([-2.56, 0, -.9])
  } else if (scene.id === 'laundry') {
    for (const x of [-1.8, -.74, .32, 1.38]) {
      box([.91, 1.07, .82], [x, .555, back + .52], M.metal, .02)
      box([.84, .85, .026], [x, .49, back + .948], M.white, .014)
      cylinder(.04, .02, [x + .27, .96, back + .978], M.ink).rotation.x = Math.PI / 2
      box([.27, .075, .016], [x - .14, .97, back + .98], M.ink)
      ring(.29, .024, [x, .5, back + .985], M.metal)
      const door = cylinder(.267, .016, [x, .5, back + .98], M.glass); door.rotation.x = Math.PI / 2
    }
    box([4.17, .045, .91], [-.21, 1.12, back + .51], M.metal)
    for (const x of [.32, 1.38]) {
      box([.91, 1.05, .82], [x, 1.668, back + .52], M.white, .02)
      box([.28, .065, .013], [x - .12, 2.05, back + .945], M.ink)
      ring(.265, .028, [x, 1.65, back + .95], M.metal)
      cylinder(.24, .016, [x, 1.65, back + .95], M.glass).rotation.x = Math.PI / 2
    }
    const foldStart = root.children.length
    table([.56, 0, .43], 1.32, .84, .83)
    const foldParts = root.children.slice(foldStart), foldingTable = group([0, 0, 0]); foldingTable.name = 'folding_table'
    foldParts.forEach(part => foldingTable.add(part))
    for (let i = 0; i < 4; i++) box([.45, .052, .33], [.68, .886 + i * .052, .44], i % 2 ? M.white : M.fabric, .015).userData.taskProp = true
    for (const [index, x] of [-.53, 1.52].entries()) {
      const basketStart = root.children.length
      basket([x, .035, 2.2], .58, .55, .54)
      const basketParts = root.children.slice(basketStart), returns = group([0, 0, 0]); returns.name = `clean_return_basket_${index}`
      basketParts.forEach(part => returns.add(part))
    }
    for (const x of [-.43, -.26, -.09]) bottle([x, 1.145, back + .47], M.blue, .25)
    cart([-1.46, .018, 1.45], .1, true)
    for (const z of [-1.53, -.35]) {
      rod([1.71, .026, z], [1.71, 1.76, z], .018, M.metal)
      rod([1.49, .036, z], [1.94, .036, z], .021, M.metal)
    }
    rod([1.71, 1.76, -1.53], [1.71, 1.76, -.35], .018, M.metal)
    for (let i = 0; i < 4; i++) {
      const z = -1.34 + i * .25
      rod([1.71, 1.75, z], [1.71, 1.64, z], .004, M.metal)
      rod([1.71, 1.64, z], [1.5, 1.5, z], .006, M.wood)
      rod([1.5, 1.5, z], [1.93, 1.5, z], .006, M.wood)
      rod([1.93, 1.5, z], [1.71, 1.64, z], .006, M.wood)
      box([.38, .57, .022], [1.71, 1.25, z], i % 2 ? M.white : M.darkFabric, .025)
    }
    box([1.65, .04, .31], [-1.25, 1.79, back + .18], M.white)
    for (let i = 0; i < 4; i++) box([.28, .16, .23], [-1.8 + i * .34, 1.89, back + .2], i % 2 ? M.paper : M.blue, .012)
    table([-1.6, 0, .22], .43, 1.06, .8)
    box([.43, .025, 1.06], [-1.6, .835, .22], M.fabric, .08).name = 'ironing_board'
    const iron = box([.105, .083, .19], [-1.6, .891, -.1], M.blue, .022)
    iron.name = 'iron'; rod([-1.6, .94, -.16], [-1.6, .97, -.03], .018, M.ink)
    const storage = group([2.57, 0, -.76]); storage.name = 'clean_linen_storage'
    for (const x of [-.28, .28]) for (const z of [-.67, .67]) box([.04, 1.96, .04], [x, 1, z], M.metal, .004, storage)
    for (const y of [.3, .79, 1.28, 1.77]) {
      box([.62, .035, 1.4], [0, y, 0], M.white, .004, storage)
      for (const z of [-.42, 0, .42]) for (let i = 0; i < 3; i++) box([.4, .055, .3], [0, y + .045 + i * .057, z], i % 2 ? M.fabric : M.white, .014, storage)
    }
    table([-2.51, 0, -.68], .58, 1.33, .79)
    basket([-2.51, .814, -.94], .43, .48, .31)
    basket([-2.51, .814, -.36], .43, .48, .31)
    box([1.04, .006, 2.62], [-2.43, .023, -.66], M.pale, .005).name = 'incoming_linen_zone'
    box([1.09, .006, 2.88], [2.46, .023, -.62], M.white, .005).name = 'clean_linen_zone'
  }

  const tripod = group([w / 2 - .48, 0, d / 2 - .48], -.75)
  rod([0, .12, 0], [0, 1.22, 0], .014, M.ink, tripod)
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; rod([0, .47, 0], [Math.cos(a) * .24, .024, Math.sin(a) * .24], .01, M.ink, tripod) }
  box([.17, .09, .075], [0, 1.25, 0], M.ink, .009, tripod)
  const lens = cylinder(.025, .035, [0, 1.25, -.05], M.glass, tripod); lens.rotation.x = Math.PI / 2
  return { root, dispose: () => { geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()) } }
}
