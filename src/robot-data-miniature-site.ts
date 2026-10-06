import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { INDOOR_SCENES, WORLD_BOUNDS, NEIGHBORHOOD_BOUNDS } from './robot-data-miniature-catalog'
import type { Vec3, WorldFocus } from './robot-data-miniature-catalog'

// All exterior coordinates are world metres; no interior or task station is rescaled.
export function buildMiniatureSite(focus: WorldFocus = 'all') {
  const root = new THREE.Group(); root.name = 'overview_site'
  const geometries: THREE.BufferGeometry[] = [], materials: THREE.Material[] = []
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>()
  const landmarks: { name: string; min: number[]; max: number[] }[] = []
  const material = (name: string, color: string) => {
    const value = new THREE.MeshStandardMaterial({ color, roughness: .94 })
    if (focus === 'neighborhood') value.clippingPlanes = [
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), NEIGHBORHOOD_BOUNDS.maxX),
      new THREE.Plane(new THREE.Vector3(0, 0, 1), -NEIGHBORHOOD_BOUNDS.minZ),
      new THREE.Plane(new THREE.Vector3(0, 0, -1), NEIGHBORHOOD_BOUNDS.maxZ),
    ]
    value.name = name; materials.push(value); return value
  }
  const M = {
    ground: material('ground', '#abbba0'), base: material('base', '#849087'), paving: material('paving', '#d5d9d3'),
    road: material('road', '#657277'), curb: material('curb', '#b8c0b9'), paint: material('paint', '#eef0dc'),
    terrace: material('terrace', '#c5ccbf'), lawn: material('lawn', '#9aae83'), gravel: material('gravel', '#bfcbc0'),
    leaf: material('leaf', '#61836a'), lightLeaf: material('light_leaf', '#92a477'), deepLeaf: material('deep_leaf', '#416d59'),
    timber: material('timber', '#aa9379'), metal: material('metal', '#485d56'), terracotta: material('terracotta', '#c37860'),
    white: material('white', '#e7e8dc'), blue: material('blue', '#658d9d'), glass: material('glass', '#354e55'),
    rubber: material('rubber', '#35413f'), flower: material('flower', '#e3c77b'), soil: material('soil', '#777e65'),
  }
  const unitBox = new THREE.BoxGeometry(1, 1, 1), cylinder = new THREE.CylinderGeometry(1, 1, 1, 10)
  const crown = new THREE.LatheGeometry([[0, 0], [.46, .06], [.87, .4], [1, 1], [.78, 1.65], [.38, 2.15], [0, 2.35]].map(([x, y]) => new THREE.Vector2(x, y)), 9)
  geometries.push(unitBox, cylinder, crown)
  const mesh = (name: string, geometry: THREE.BufferGeometry, scale: Vec3, at: Vec3, mat: THREE.Material, ry = 0) => {
    const transform = new THREE.Matrix4().compose(new THREE.Vector3(...at), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(...scale))
    const copy = geometry.clone().applyMatrix4(transform)
    const list = batches.get(mat) ?? []; list.push(copy); batches.set(mat, list)
    copy.computeBoundingBox()
    const bounds = copy.boundingBox!
    landmarks.push({ name, min: bounds.min.toArray(), max: bounds.max.toArray() })
  }
  const box = (name: string, size: Vec3, at: Vec3, mat: THREE.Material, ry = 0) => mesh(name, unitBox, size, at, mat, ry)
  const drum = (name: string, radius: number, height: number, at: Vec3, mat: THREE.Material) => mesh(name, cylinder, [radius, height, radius], at, mat)
  const { minX, maxX, minZ, maxZ } = WORLD_BOUNDS
  const width = maxX - minX, centerX = (minX + maxX) / 2, centerZ = (minZ + maxZ) / 2
  box('site_base', [width, .15, maxZ - minZ], [centerX, -.205, centerZ], M.base)
  box('site_ground', [width, .03, maxZ - minZ], [centerX, -.115, centerZ], M.ground)
  const north = INDOOR_SCENES.filter(s => s.siteDistrict === 'north'), south = INDOOR_SCENES.filter(s => s.siteDistrict !== 'north')
  const streetBack = Math.max(...north.map(s => s.position[2] + s.depth / 2))
  const streetFront = Math.min(...south.map(s => s.position[2] - s.depth / 2))
  const sidewalk = .8, roadBack = streetBack + sidewalk, roadFront = streetFront - sidewalk
  const roadZ = (roadBack + roadFront) / 2
  const avenueX = maxX - 2.55, avenueLeft = avenueX - 1.8
  const topRoadZ = minZ + 2.6, topRoadBack = topRoadZ - 1.8, topRoadFront = topRoadZ + 1.8
  const avenueEnd = maxZ - 1
  // Nonoverlapping road rectangles form a connected street network.
  box('district_street', [avenueLeft - minX, .035, roadFront - roadBack], [(minX + avenueLeft) / 2, -.073, roadZ], M.road)
  box('service_street', [avenueLeft - minX, .035, 3.6], [(minX + avenueLeft) / 2, -.073, topRoadZ], M.road)
  box('east_avenue', [3.6, .035, avenueEnd - topRoadBack], [avenueX, -.073, (avenueEnd + topRoadBack) / 2], M.road)
  for (const z of [streetBack + sidewalk / 2, streetFront - sidewalk / 2, topRoadFront + .5]) box('sidewalk', [avenueLeft - minX, .075, .8], [(minX + avenueLeft) / 2, -.0495, z], M.paving)
  for (const x of [avenueLeft - .45, avenueX + 2.22]) box('avenue_sidewalk', [.8, .075, avenueEnd - topRoadBack], [x, -.0495, (avenueEnd + topRoadBack) / 2], M.paving)
  for (const s of INDOOR_SCENES) box(`plot_${s.id}`, [s.width + .3, .075, s.depth + .3], [s.position[0], -.0875, s.position[2]], M.paving)
  const columns = [['kitchen', 'bedroom'], ['living', 'bathroom'], ['retail', 'checkout'], ['cafe', 'laundry'], ['produce', 'office']].map(ids => {
    const rooms = south.filter(s => ids.includes(s.id))
    return { left: Math.min(...rooms.map(s => s.position[0] - s.width / 2)), right: Math.max(...rooms.map(s => s.position[0] + s.width / 2)) }
  })
  const lanes = columns.slice(0, -1).map((column, i) => (column.right + columns[i + 1].left) / 2)
  const walkBack = Math.max(...south.filter(s => s.position[2] < 0).map(s => s.position[2] + s.depth / 2))
  const walkFront = Math.min(...south.filter(s => s.position[2] > 0).map(s => s.position[2] - s.depth / 2))
  const walkZ = (walkBack + walkFront) / 2
  box('cross_lane', [avenueLeft - minX, .03, walkFront - walkBack], [(minX + avenueLeft) / 2, -.066, walkZ], M.paving)
  for (const x of lanes) box('pedestrian_lane', [.95, .03, maxZ - streetFront - .5], [x, -.067, (streetFront + maxZ - .5) / 2], M.paving)
  for (const [left, right] of [[minX, .6], [8.6, avenueLeft]]) box('south_promenade', [right - left, .05, 1.15], [(left + right) / 2, -.044, 11.45], M.paving)
  const curb = (z: number, openings: [number, number][]) => {
    let start = minX + .01
    for (const [left, right] of [...openings, [avenueLeft, avenueLeft] as [number, number]].sort((a, b) => a[0] - b[0])) {
      if (left > start) box('curb', [left - start, .065, .09], [(left + start) / 2, -.029, z], M.curb)
      start = Math.max(start, right)
    }
  }
  const garage = north.find(s => s.id === 'garage')!, warehouse = north.find(s => s.id === 'warehouse')!
  const garageX = garage.position[0] + 2.11, warehouseX = warehouse.position[0] + 1.38
  const crossings = [(minX + .7 - 11.4) / 2 + 1.55, ...lanes.slice(1)]
  curb(roadBack, [[garageX - 1.37, garageX + 1.37], [warehouseX - 1.85, warehouseX + 1.85], ...crossings.map(x => [x - .65, x + .65] as [number, number])])
  curb(roadFront, crossings.map(x => [x - .65, x + .65]))
  for (const x of crossings) for (let z = roadBack + .22; z < roadFront - .12; z += .42) box('crosswalk', [1.15, .004, .21], [x, -.05, z], M.paint)
  for (const z of [roadZ, topRoadZ]) for (let x = minX + .6; x < avenueLeft - .7; x += 2.25) {
    if (z === roadZ && crossings.some(c => Math.abs(c - x) < 1.25)) continue
    box('lane_mark', [.9, .004, .065], [x, -.05, z], M.paint)
  }
  const avenueCrossings = [walkZ, 10.75]
  for (let z = topRoadFront + 1; z < avenueEnd - .5; z += 2.2) {
    if ([roadZ, ...avenueCrossings].some(c => Math.abs(z - c) < 1.2)) continue
    box('avenue_mark', [.065, .004, .85], [avenueX, -.05, z], M.paint)
  }
  for (const z of avenueCrossings) for (let x = avenueLeft + .23; x < avenueX + 1.65; x += .44) box('avenue_crosswalk', [.23, .004, 1.15], [x, -.05, z], M.paint)
  const tree = (x: number, z: number, height = 3.4, alternate = false) => {
    drum('tree_trunk', .085, height * .67, [x, height * .335, z], M.timber)
    mesh('tree_canopy', crown, [height * .3, height * .28, height * .27], [x, height * .33, z], alternate ? M.lightLeaf : M.leaf, x * .7)
    mesh('tree_canopy', crown, [height * .19, height * .23, height * .19], [x + .22, height * .48, z - .08], alternate ? M.leaf : M.deepLeaf, z * .6)
    drum('tree_bed', .56, .05, [x, -.057, z], M.gravel)
  }
  const hedge = (x: number, z: number, w: number, d = .45) => {
    box('planting_border', [w + .12, .14, d + .12], [x, -.007, z], M.curb)
    box('low_hedge', [w, .28, d], [x, .2, z], M.leaf)
  }
  const bench = (x: number, z: number, turn = 0) => {
    const b = (name: string, size: Vec3, dx: number, y: number, dz: number, mat: THREE.Material) => box(name, size, [x + dx * Math.cos(turn) + dz * Math.sin(turn), y, z - dx * Math.sin(turn) + dz * Math.cos(turn)], mat, turn)
    for (const dz of [-.14, 0, .14]) b('bench_seat', [1.65, .055, .105], 0, .45, dz, M.timber)
    for (const y of [.66, .79]) b('bench_back', [1.65, .09, .05], 0, y, -.23, M.timber)
    for (const dx of [-.6, .6]) { b('bench_leg', [.055, .43, .37], dx, .22, 0, M.metal); b('bench_upright', [.05, .44, .05], dx, .64, -.23, M.metal) }
  }
  const planter = (x: number, z: number, length = 1.2) => {
    box('planter', [length, .42, .5], [x, .18, z], M.terracotta)
    box('planter_soil', [length - .09, .025, .39], [x, .398, z], M.soil)
    for (let dx = -.42 * length; dx < length / 2; dx += .28) {
      mesh('planter_leaves', crown, [.17, .19, .16], [x + dx, .41, z], M.lightLeaf)
      drum('planter_flower', .07, .07, [x + dx, .84, z], M.flower)
    }
  }
  const lamp = (x: number, z: number) => {
    drum('lamp_base', .15, .08, [x, .01, z], M.metal)
    drum('lamp_post', .035, 2.3, [x, 1.15, z], M.metal)
    box('lamp_arm', [.45, .045, .05], [x + .18, 2.3, z], M.metal)
    box('lamp_head', [.3, .05, .16], [x + .36, 2.26, z], M.white)
  }
  // Outdoor collection areas occupy the former garden pockets; paths remain continuous beside them.
  const gardenLeft = minX + .7, gardenRight = -11.4, gardenX = (gardenLeft + gardenRight) / 2
  box('garden_lawn', [gardenRight - gardenLeft, .065, 13.8], [gardenX, -.058, 2.35], M.lawn)
  box('garden_walk', [.85, .035, 14.3], [-11.55, -.005, 2.35], M.gravel)
  box('garden_entry', [gardenRight - gardenLeft, .035, 1.15], [gardenX, -.004, walkZ], M.gravel)
  box('garden_north_connection', [.85, .035, .45], [-11.55, -.005, -4.7], M.gravel)
  box('garden_south_connection', [.85, .035, 2.55], [-11.55, -.005, 10.3], M.gravel)
  hedge(gardenX - .25, 9.04, gardenRight - gardenLeft - 1)
  hedge(gardenLeft + .22, 2, .45, 3.1)
  lamp(-11.06, 2); lamp(-11.06, 8.95)
  box('care_front_terrace', [6.8, .04, .66], [-15.15, -.026, -8.97], M.terrace)
  bench(-16.3, -8.94); planter(-12.9, -8.97)
  box('garage_driveway', [2.7, .04, .78], [garageX, -.07, -8.96], M.paving)
  for (const x of [garageX - 1.45, garageX + 1.45]) box('driveway_edge', [.045, .006, .72], [x, -.047, -8.96], M.paint)
  // Low planting stays below the windows. Tall trees occupy perimeter pockets.
  for (const [x, z] of [[-8.7, 8], [-1.3, 8], [20.5, 2.3]]) planter(x, z, 1.1)
  for (const x of [-8.9, -2.7, 4.5, 11.8, 20.4]) { tree(x, minZ + .65, 3.1, x > 0); lamp(x + 1.2, topRoadFront + .55) }
  for (const z of [-12.7, -2.2, 7.2]) tree(avenueX + 2.35, z, 2.8, z > 0)
  for (const x of [-8.7, -1.6, 12.1, 21.7]) { tree(x, 12.8, 2.4, x < 2); bench(x + (x === -1.6 ? 1.1 : 1.6), 12.35, Math.PI) }
  box('cafe_terrace', [5.8, .055, 2.35], [12.5, -.025, 8.77], M.terrace)
  for (const x of [11.2, 13.7]) {
    drum('cafe_table_top', .39, .055, [x, .74, 8.75], M.white)
    drum('cafe_table_stem', .045, .72, [x, .35, 8.75], M.metal)
    drum('cafe_table_base', .23, .04, [x, .005, 8.75], M.metal)
    for (const dz of [-.64, .64]) {
      box('cafe_chair', [.37, .06, .38], [x, .43, 8.75 + dz], M.terracotta)
      box('cafe_chair_back', [.37, .36, .045], [x, .64, 8.75 + dz + Math.sign(dz) * .18], M.terracotta)
      for (const dx of [-.13, .13]) box('cafe_chair_leg', [.035, .42, .28], [x + dx, .2, 8.75 + dz], M.metal)
    }
  }
  planter(15.1, 8.95, .6)
  // Open frontages share a clear promenade; furnishings stay in recessed pockets.
  box('commercial_forecourt', [6.6, .024, 3.1], [12.4, -.065, 10.45], M.gravel)
  for (const x of [9.85, 15.05]) for (const z of [7.72, 9.76]) box('cafe_pergola_post', [.085, 2.46, .085], [x, 1.19, z], M.metal)
  for (const z of [7.72, 9.76]) box('cafe_pergola_beam', [5.4, .12, .08], [12.45, 2.43, z], M.timber)
  for (let x = 10; x < 15.1; x += .62) box('cafe_pergola_louver', [.1, .075, 2.22], [x, 2.53, 8.74], M.timber)
  for (const x of [11.2, 13.7]) {
    drum('cafe_saucer', .085, .012, [x - .12, .775, 8.75], M.white)
    drum('cafe_cup', .042, .08, [x - .12, .821, 8.75], M.blue)
    drum('cafe_coffee', .033, .005, [x - .12, .864, 8.75], M.timber)
    box('cafe_table_menu', [.17, .17, .04], [x + .16, .85, 8.72], M.terracotta, -.2)
  }
  box('cafe_menu_board', [.48, .68, .045], [10.45, .68, 10.1], M.metal)
  for (const x of [10.25, 10.65]) box('cafe_menu_leg', [.04, .57, .32], [x, .26, 10.1], M.timber)
  for (const [y, w] of [[.86, .28], [.71, .31], [.6, .22]]) box('cafe_menu_line', [w, .018, .006], [10.45, y, 10.126], M.white)
  planter(14.25, 10.35, 1.55)
  // Office entrance furniture occupies the strip behind the continuous footpath.
  box('office_entry_terrace', [8.4, .024, 1.12], [21.45, -.065, 10.68], M.terrace)
  bench(18.45, 10.62)
  planter(20.45, 10.58, .8)
  const ring = new THREE.TorusGeometry(.32, .035, 5, 18)
  geometries.push(ring)
  const rod = (name: string, a: Vec3, b: Vec3, radius: number, mat: THREE.Material) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start)
    const shape = new THREE.CylinderGeometry(radius, radius, delta.length(), 6)
    shape.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()))
    shape.translate(...start.add(end).multiplyScalar(.5).toArray()); geometries.push(shape)
    mesh(name, shape, [1, 1, 1], [0, 0, 0], mat)
  }
  for (const z of [10.13, 10.73]) {
    for (const x of [23.15, 24.65]) {
      box('cycle_stand_upright', [.045, .64, .045], [x, .28, z], M.metal)
    }
    box('cycle_stand_rail', [1.54, .045, .045], [23.9, .6, z], M.metal)
  }
  for (const [z, mat] of [[10.25, M.blue], [10.65, M.terracotta]] as const) {
    for (const x of [23.34, 24.49]) {
      mesh('bicycle_tire', ring, [1, 1, 1], [x, .31, z], M.rubber)
      rod('bicycle_spoke', [x - .28, .31, z], [x + .28, .31, z], .009, M.white)
      rod('bicycle_spoke', [x, .03, z], [x, .59, z], .009, M.white)
    }
    const rear: Vec3 = [23.34, .31, z], crank: Vec3 = [23.85, .27, z], seat: Vec3 = [23.73, .83, z], head: Vec3 = [24.33, .81, z], front: Vec3 = [24.49, .31, z]
    for (const [a, b] of [[rear, crank], [rear, seat], [seat, crank], [seat, head], [head, crank], [head, front]]) rod('bicycle_frame', a, b, .025, mat)
    rod('bicycle_seatpost', seat, [23.73, .97, z], .02, M.metal)
    rod('bicycle_handle_post', head, [24.3, 1.06, z], .02, M.metal)
    rod('bicycle_handle', [24.3, 1.06, z - .14], [24.3, 1.06, z + .14], .018, M.metal)
    box('bicycle_saddle', [.24, .045, .14], [23.73, .97, z], M.rubber)
    box('bicycle_pedal', [.15, .04, .3], [23.85, .27, z], M.metal)
  }
  box('loading_apron', [6.6, .04, 1.5], [2.55, -.026, -16.82], M.terrace)
  for (const x of [.2, 4.9]) box('loading_bollard', [.095, .65, .095], [x, .29, -17.2], M.flower)
  // Three distinct back-of-house pockets: parcels, assembly totes and food supply.
  for (const [x, w] of [[11.4, 6.6], [21.05, 8.2]]) box('service_apron', [w, .04, 1.5], [x, -.026, -16.82], M.terrace)
  const pallet = (x: number, z: number) => {
    for (const dx of [-.42, 0, .42]) box('pallet_runner', [.12, .09, .8], [x + dx, .045, z], M.timber)
    for (const dz of [-.32, -.16, 0, .16, .32]) box('pallet_slat', [1.05, .055, .105], [x, .1175, z + dz], M.timber)
  }
  for (const x of [.65, 4.6]) {
    pallet(x, -16.73)
    for (const [dx, w, h] of [[-.25, .42, .56], [.25, .4, .4]]) {
      box('shipment_carton', [w, h, .62], [x + dx, .145 + h / 2, -16.73], M.timber)
      box('carton_tape', [.055, h + .005, .628], [x + dx, .145 + h / 2, -16.73], M.white)
    }
  }
  const trolley = (x: number, z: number, food = false) => {
    box('service_trolley_deck', [.85, .06, .62], [x, .2, z], M.metal)
    for (const dx of [-.33, .33]) for (const dz of [-.23, .23]) {
      box('service_trolley_caster', [.09, .15, .06], [x + dx, .08, z + dz], M.rubber)
    }
    for (const dz of [-.23, .23]) box('service_trolley_handle', [.035, .8, .035], [x - .39, .57, z + dz], M.metal)
    box('service_trolley_grip', [.04, .035, .49], [x - .39, .97, z], M.metal)
    for (const y of [.39, .73]) {
      box('supply_tote', [.65, .3, .48], [x + .04, y, z], food ? M.white : M.blue)
      box('supply_tote_lid', [.68, .035, .51], [x + .04, y + .1675, z], food ? M.deepLeaf : M.metal)
      box('supply_tote_handle', [.18, .035, .012], [x + .04, y + .02, z + .247], M.metal)
    }
  }
  trolley(10.35, -16.78); trolley(19.2, -16.78, true)
  pallet(13.4, -16.78)
  for (const y of [.24, .47]) box('returnable_tote', [.84, .19, .62], [13.4, y, -16.78], M.blue)
  for (const x of [23.1, 24]) {
    box('food_supply_cabinet', [.7, 1.12, .66], [x, .55, -16.78], M.white)
    box('food_supply_door', [.63, 1.02, .02], [x, .55, -17.121], M.gravel)
    box('food_supply_handle', [.035, .25, .04], [x + .22, .7, -17.154], M.metal)
  }
  for (const x of [1.1, 9.3, 18.3]) {
    for (const z of [-17.47, -16.12]) box('loading_bay_mark', [1.1, .005, .045], [x + 1.5, -.002, z], M.paint)
  }
  for (const x of [8.3, 14.5, 17.4, 24.9]) box('service_protection_post', [.08, .68, .08], [x, .3, -17.42], M.flower)
  const vanX = 7.2, vanZ = topRoadZ + .95
  box('delivery_van_body', [3.75, 1.24, 1.55], [vanX, 1.02, vanZ], M.white)
  box('delivery_van_cab', [.95, .7, 1.45], [vanX + 1.18, 1.56, vanZ], M.blue)
  box('van_windshield', [.022, .48, 1.18], [vanX + 1.669, 1.59, vanZ], M.glass)
  for (const dx of [-1.15, 1.12]) for (const dz of [-.78, .78]) {
    const wheel = new THREE.CylinderGeometry(.3, .3, .14, 12); wheel.rotateX(Math.PI / 2); geometries.push(wheel)
    mesh('van_wheel', wheel, [1, 1, 1], [vanX + dx, .29, vanZ + dz], M.rubber)
  }
  box('van_side_panel', [1.8, .55, .014], [vanX - .45, 1.1, vanZ + .784], M.blue)
  root.userData.street = { minX, maxX: avenueLeft, minZ: roadBack, maxZ: roadFront, sidewalk }
  root.userData.roads = [root.userData.street, { minX, maxX: avenueLeft, minZ: topRoadBack, maxZ: topRoadFront }, { minX: avenueLeft, maxX: avenueX + 1.8, minZ: topRoadBack, maxZ: avenueEnd }]
  root.userData.landmarks = landmarks
  // Batch by material so the outdoor details add only a few draw calls.
  for (const [mat, parts] of batches) {
    const normalized = parts.map(g => g.index ? g.toNonIndexed() : g)
    const merged = mergeGeometries(normalized)
    normalized.forEach((g, i) => { if (g !== parts[i]) g.dispose() })
    parts.forEach(g => g.dispose())
    if (!merged) continue
    geometries.push(merged)
    const object = new THREE.Mesh(merged, mat)
    object.name = `exterior_${mat.name}`; object.castShadow = true; object.receiveShadow = true
    root.add(object)
  }
  root.userData.drawCalls = root.children.length
  return { root, dispose: () => { geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()) } }
}
