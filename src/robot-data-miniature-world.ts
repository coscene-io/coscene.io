import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

type Vec = [number, number, number]

export function buildMiniatureRoom(woodMap: THREE.Texture, woodNormal: THREE.Texture) {
  const root = new THREE.Group()
  root.name = 'Kitchen_scale_study'
  const geometries: THREE.BufferGeometry[] = []
  const materials: THREE.Material[] = []
  const textures: THREE.Texture[] = []
  const standard = (color: string, roughness = .72, metalness = 0) => {
    const material = new THREE.MeshStandardMaterial({ color, roughness, metalness })
    materials.push(material)
    return material
  }
  const stoneCanvas = document.createElement('canvas')
  stoneCanvas.width = stoneCanvas.height = 512
  const ctx = stoneCanvas.getContext('2d')!
  ctx.fillStyle = '#e6e6e2'; ctx.fillRect(0, 0, 512, 512)
  let seed = 7823
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  for (let i = 0; i < 20000; i++) {
    ctx.fillStyle = `rgba(75,78,76,${random() * .13})`
    ctx.fillRect(random() * 512, random() * 512, .4 + random() * 2, .4 + random() * 2)
  }
  const stoneMap = new THREE.CanvasTexture(stoneCanvas)
  stoneMap.colorSpace = THREE.SRGBColorSpace
  stoneMap.wrapS = stoneMap.wrapT = THREE.RepeatWrapping
  stoneMap.repeat.set(2, 2); textures.push(stoneMap)
  const M = {
    wall: standard('#eff0eb', .92), floor: standard('#dcded9', .85), grout: standard('#b9c0b9'),
    base: standard('#8a948f'), ink: standard('#242f31', .52), black: standard('#111b1d', .34),
    green: standard('#546c62', .58), pale: standard('#c4d0c4', .65), white: standard('#f0f2ed', .28),
    steel: standard('#b9c5c6', .25, .85), brass: standard('#afa780', .35, .6),
    wood: standard('#c6af8e', .68), clay: standard('#c27959', .72), leaf: standard('#4e6b40', .83),
    blue: standard('#426ca4', .4), screen: standard('#193541', .27),
  }
  M.wood.map = woodMap; M.wood.normalMap = woodNormal; M.wood.normalScale.set(.18, .18)
  M.floor.map = stoneMap
  const topMat = standard('#f2f2ed', .4)
  topMat.map = stoneMap
  const mesh = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, at: Vec) => {
    geometries.push(geometry)
    const item = new THREE.Mesh(geometry, material)
    item.position.set(...at); item.castShadow = true; item.receiveShadow = true
    parent.add(item)
    return item
  }
  const box = (parent: THREE.Object3D, size: Vec, at: Vec, mat: THREE.Material, radius = .004) => mesh(parent, radius ? new RoundedBoxGeometry(...size, 2, radius) : new THREE.BoxGeometry(...size), mat, at)
  const cylinder = (parent: THREE.Object3D, r: number, height: number, at: Vec, mat: THREE.Material, top = r) => mesh(parent, new THREE.CylinderGeometry(top, r, height, 32), mat, at)
  const rod = (parent: THREE.Object3D, a: Vec, b: Vec, radius: number, mat: THREE.Material) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b)
    const item = cylinder(parent, radius, start.distanceTo(end), [0, 0, 0], mat)
    item.position.copy(start).add(end).multiplyScalar(.5)
    item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize())
    return item
  }
  const group = (at: Vec, rotation = 0) => { const g = new THREE.Group(); g.position.set(...at); g.rotation.y = rotation; root.add(g); return g }
  const vessel = (parent: THREE.Object3D, at: Vec, profile: [number, number][], mat: THREE.Material) => mesh(parent, new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(...p)), 48), mat, at)
  const cup = (parent: THREE.Object3D, at: Vec, mat: THREE.Material, handle = true) => {
    vessel(parent, at, [[0, 0], [.038, 0], [.043, .01], [.047, .105], [.042, .11], [.039, .104], [.035, .018], [0, .018]], mat)
    if (handle) {
      const ring = mesh(parent, new THREE.TorusGeometry(.034, .008, 12, 32, Math.PI * 1.65), mat, [at[0] + .044, at[1] + .061, at[2]])
      ring.rotation.z = -.82 * Math.PI
    }
  }
  const bowl = (at: Vec, r = .15) => vessel(root, at, [[0, 0], [r * .35, 0], [r * .8, .04], [r, .1], [r - .007, .104], [r * .74, .047], [0, .012]], M.white)
  const bottle = (parent: THREE.Object3D, at: Vec, mat: THREE.Material, h = .25) => {
    vessel(parent, at, [[0, 0], [.043, 0], [.045, .015], [.045, h * .65], [.018, h * .78], [.017, h], [0, h]], mat)
    cylinder(parent, .018, .016, [at[0], at[1] + h, at[2]], M.wood)
  }

  // Scale is in metres. Back/left shell pieces can cut away during full orbit.
  box(root, [5.4, .1, 4.5], [0, -.065, 0], M.base, .02)
  box(root, [5.36, .035, 4.46], [0, -.007, 0], M.floor, .012)
  for (let col = 0; col < 8; col++) for (let row = 0; row < 7; row++) {
    box(root, [.663, .007, .631], [-2.345 + col * .67, .014, -1.908 + row * .636], M.floor, .001)
  }
  const shellStart = root.children.length
  box(root, [5.4, 2.5, .12], [0, 1.25, -2.18], M.wall)
  box(root, [.12, .62, 3.57], [-2.64, .31, -.005], M.wall)
  box(root, [.12, 2.5, .33], [-2.64, 1.25, -1.955], M.wall)
  box(root, [.12, 2.5, .42], [-2.64, 1.25, 1.99], M.wall)
  box(root, [.12, .18, 3.57], [-2.64, 2.41, -.005], M.wall)
  box(root, [5.17, .075, .016], [0, .056, -2.107], M.ink, .001)
  box(root, [.016, .075, 4.18], [-2.565, .056, 0], M.ink, .001)
  // Window opening, sill and slender mullions. No opaque image backdrop.
  box(root, [.23, .045, 3.65], [-2.59, .63, -.005], topMat, .005)
  for (const z of [-1.8, -.61, .59, 1.79]) box(root, [.045, 1.72, .038], [-2.61, 1.51, z], M.ink, .002)
  for (const y of [.665, 2.36]) box(root, [.057, .038, 3.62], [-2.61, y, -.005], M.ink, .002)
  box(root, [.04, .038, 3.62], [-2.61, 1.87, -.005], M.ink, .002)
  root.children.slice(shellStart).forEach(item => { item.userData.cutaway = item.position.x < -2.4 ? 'left' : 'back' })

  // Back cabinetry: recessed plinths, separate doors, hardware and countertop.
  box(root, [3.7, .09, .51], [-.52, .075, -1.79], M.ink)
  box(root, [3.68, .02, .61], [-.52, .118, -1.79], M.green)
  box(root, [3.72, .68, .02], [-.52, .454, -2.08], M.green)
  for (const x of [-2.37, 1.33]) box(root, [.02, .68, .61], [x, .454, -1.79], M.green)
  for (let i = 0; i < 6; i++) {
    const x = -2.06 + i * .618
    box(root, [.603, .665, .026], [x, .46, -1.47], M.green)
    rod(root, [x + .2, .64, -1.444], [x + .2, .77, -1.444], .007, M.brass)
  }
  // Counter is split around the inset sink instead of overlapping its basin.
  box(root, [1.07, .045, .71], [-1.86, .82, -1.78], topMat)
  box(root, [1.94, .045, .71], [.45, .82, -1.78], topMat)
  box(root, [.73, .045, .1], [-.96, .82, -2.085], topMat)
  box(root, [.73, .045, .1], [-.96, .82, -1.475], topMat)
  box(root, [.7, .015, .48], [-.96, .69, -1.78], M.steel, .02)
  for (const x of [-1.302, -.618]) box(root, [.014, .13, .49], [x, .758, -1.78], M.steel)
  for (const z of [-2.02, -1.54]) box(root, [.67, .13, .014], [-.96, .758, z], M.steel)
  cylinder(root, .03, .004, [-.96, .705, -1.78], M.ink)
  const faucetCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-.96, .84, -2.045), new THREE.Vector3(-.96, 1.16, -2.045), new THREE.Vector3(-.96, 1.18, -1.91), new THREE.Vector3(-.96, 1.07, -1.86)])
  mesh(root, new THREE.TubeGeometry(faucetCurve, 30, .014, 10, false), M.steel, [0, 0, 0])
  rod(root, [-.88, .843, -2.03], [-.88, .918, -2.03], .012, M.steel)
  // Ceramic backsplash with quiet grout lines.
  for (let row = 0; row < 3; row++) for (let col = 0; col < 17; col++) {
    box(root, [.213, .143, .018], [-2.27 + col * .22, .925 + row * .15, -2.105], (col + row) % 4 ? M.white : M.pale, .002).userData.cutaway = 'back'
  }
  // Tall pantry and refrigerator.
  box(root, [1, 2.18, .73], [2.01, 1.09, -1.8], M.wood, .012)
  box(root, [.92, 1.34, .025], [2.01, 1.435, -1.418], M.pale)
  box(root, [.92, .66, .025], [2.01, .412, -1.418], M.pale)
  for (const y of [1.2, .67]) rod(root, [1.64, y, -1.39], [1.84, y, -1.39], .01, M.steel)
  for (const y of [1.59, 2.1]) {
    box(root, [2.24, .04, .28], [.1, y, -1.977], M.wood)
    for (const x of [-.76, .98]) box(root, [.025, .15, .2], [x, y - .082, -2.025], M.ink, .001)
  }
  for (let i = 0; i < 5; i++) cylinder(root, .12, .018, [.66, 1.63 + i * .017, -1.95], M.white)
  cup(root, [-.56, 1.62, -1.98], M.clay)
  cup(root, [-.32, 1.62, -1.98], M.white)
  bottle(root, [-.65, 2.125, -1.97], M.green, .24)
  bottle(root, [-.47, 2.125, -1.97], M.white, .17)
  for (let i = 0; i < 3; i++) box(root, [.042, .22 + i * .03, .17], [.66 + i * .057, 2.23 + i * .015, -1.97], [M.ink, M.clay, M.pale][i])
  box(root, [.36, .018, .26], [.35, .854, -1.83], M.wood, .02)
  bottle(root, [.71, .844, -2], M.green, .25)
  bottle(root, [.89, .844, -2], M.white, .18)
  for (const x of [-1.92, -1.63]) {
    cylinder(root, .105, .065, [x, .878, -1.83], M.ink)
    for (let i = 0; i < 4; i++) {
      const ring = mesh(root, new THREE.TorusGeometry(.025 + i * .021, .002, 8, 48), M.steel, [x, .913, -1.83])
      ring.rotation.x = Math.PI / 2
    }
  }
  box(root, [.57, .44, .018], [-2.06, .41, -1.442], M.steel, .012).name = 'oven'
  box(root, [.49, .31, .008], [-2.06, .38, -1.427], M.screen, .009)
  rod(root, [-2.25, .59, -1.398], [-1.87, .59, -1.398], .012, M.steel)
  for (const x of [-2.21, -1.91]) cylinder(root, .023, .015, [x, .59, -1.423], M.black).rotation.x = Math.PI / 2
  box(root, [.58, .64, .018], [.412, .45, -1.443], M.steel, .006).name = 'dishwasher'
  rod(root, [.21, .707, -1.412], [.61, .707, -1.412], .009, M.ink)
  bottle(root, [-.49, .845, -2.035], M.pale, .15)
  rod(root, [-.49, 1.005, -2.035], [-.54, 1.005, -2.035], .006, M.ink)
  const knifeBlock = box(root, [.17, .18, .12], [1.12, .945, -1.98], M.wood, .014); knifeBlock.rotation.x = -.13
  for (let i = 0; i < 3; i++) box(root, [.017, .1, .032], [1.07 + i * .045, 1.075, -1.98], M.ink, .005)

  // Compact task island leaves a full aisle around the G1.
  box(root, [1.34, .075, 1.22], [.12, .055, .43], M.ink)
  box(root, [1.48, .65, 1.34], [.12, .418, .43], M.wood, .009)
  box(root, [1.61, .036, 1.49], [.12, .764, .43], topMat, .008)
  for (let i = 0; i < 3; i++) {
    box(root, [1.43, .194, .024], [.12, .193 + i * .202, 1.111], M.wood)
    rod(root, [-.04, .223 + i * .202, 1.131], [.28, .223 + i * .202, 1.131], .006, M.ink)
  }
  rod(root, [.904, .61, .19], [.904, .61, .65], .01, M.steel)
  for (const z of [.19, .65]) rod(root, [.87, .61, z], [.904, .61, z], .008, M.steel)
  box(root, [.015, .32, .29], [.915, .47, .42], M.pale, .006)
  const taskStart = root.children.length
  const taskCup = new THREE.Group(); taskCup.name = 'task_cup'; taskCup.position.set(-.59, .783, .26); root.add(taskCup)
  cup(taskCup, [0, 0, 0], M.clay)
  const tray = group([.48, .792, .5])
  box(tray, [.46, .017, .36], [0, 0, 0], M.wood, .018)
  for (const x of [-.225, .225]) box(tray, [.012, .028, .35], [x, .02, 0], M.wood)
  for (const z of [-.175, .175]) box(tray, [.45, .028, .012], [0, .02, z], M.wood)
  cup(tray, [-.085, .013, -.02], M.white)
  cup(tray, [.083, .013, .035], M.pale)
  bowl([.39, .783, -.05], .12)
  for (let i = 0; i < 3; i++) {
    const fruit = mesh(root, new THREE.SphereGeometry(.043, 20, 16), i ? M.clay : M.pale, [.34 + i * .044, .823 + (i % 2) * .025, -.05])
    fruit.scale.y = .9
  }
  root.children.slice(taskStart).forEach(node => { node.userData.taskProp = true })

  // A stool and a collection tripod establish scale without adding a dummy human.
  const stool = group([1.41, 0, .98], -.18)
  cylinder(stool, .21, .037, [0, .45, 0], M.wood)
  for (const x of [-1, 1]) for (const z of [-1, 1]) rod(stool, [x * .13, .435, z * .13], [x * .19, .028, z * .19], .019, M.ink)
  const footRing = mesh(stool, new THREE.TorusGeometry(.169, .009, 8, 40), M.ink, [0, .19, 0]); footRing.rotation.x = Math.PI / 2
  const tripod = group([1.77, 0, 1.61], -.85)
  rod(tripod, [0, .12, 0], [0, 1.23, 0], .018, M.ink)
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3
    rod(tripod, [0, .54, 0], [Math.cos(a) * .31, .026, Math.sin(a) * .31], .014, M.ink)
    cylinder(tripod, .024, .025, [Math.cos(a) * .31, .023, Math.sin(a) * .31], M.black)
  }
  box(tripod, [.19, .105, .075], [0, 1.255, 0], M.ink, .012)
  const lens = cylinder(tripod, .03, .045, [0, 1.26, -.05], M.steel); lens.rotation.x = Math.PI / 2
  const glass = cylinder(tripod, .024, .004, [0, 1.26, -.076], M.screen); glass.rotation.x = Math.PI / 2
  box(tripod, [.13, .065, .003], [0, 1.26, .039], M.screen, .003)

  const plant = group([-2.09, 0, 1.53])
  vessel(plant, [0, 0, 0], [[0, 0], [.14, 0], [.2, .34], [.187, .35], [.14, .025], [0, .025]], M.clay)
  cylinder(plant, .174, .008, [0, .31, 0], M.ink)
  for (let i = 0; i < 12; i++) {
    const a = i * 2.4, height = .64 + (i % 4) * .12
    const x = Math.cos(a) * .23, z = Math.sin(a) * .23
    rod(plant, [0, .31, 0], [x, height, z], .004, M.leaf)
    const leaf = mesh(plant, new THREE.SphereGeometry(1, 16, 10), M.leaf, [x, height, z])
    leaf.scale.set(.085, .17, .012); leaf.rotation.set(.4, a, Math.sin(a) * .5)
  }
  return { root, taskCup, dispose: () => { geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()) } }
}

export function poseG1(original: THREE.Group, kind = 'g1', overrides: Record<string, number> = {}) {
  const robot = original.clone(true)
  const poses: Record<string, number> = kind === 'luna' ? {
    luna_left_shoulder_pitch: .12, luna_right_shoulder_pitch: .18,
    luna_left_elbow_pitch: 1.25, luna_right_elbow_pitch: 1.4,
    luna_left_wrist_pitch: .08, luna_right_wrist_pitch: .08,
  } : kind === 's1' ? {
    astribot_torso_joint_1: .65, astribot_torso_joint_2: -1.3, astribot_torso_joint_3: .65,
    astribot_arm_left_joint_1: -.45, astribot_arm_right_joint_1: .45,
    astribot_arm_left_joint_3: -1.57, astribot_arm_right_joint_3: 1.57,
    astribot_arm_left_joint_4: .85, astribot_arm_right_joint_4: .85,
  } : {
    left_hip_pitch_joint: -.08, right_hip_pitch_joint: -.08,
    left_knee_joint: .16, right_knee_joint: .16,
    left_ankle_pitch_joint: -.08, right_ankle_pitch_joint: -.08,
    right_shoulder_pitch_joint: -.52, right_shoulder_roll_joint: -.06,
    right_shoulder_yaw_joint: .08, right_elbow_joint: .7,
    right_wrist_pitch_joint: -.16,
    left_shoulder_pitch_joint: .16, left_elbow_joint: .62,
  }
  Object.assign(poses, overrides)
  robot.traverse(node => {
    if (node instanceof THREE.Mesh) {
      node.castShadow = true; node.receiveShadow = true
      const material = node.material as THREE.MeshStandardMaterial
      const dark = material.color.r < .3
      node.material = material.clone()
      if (!material.userData.keepAppearance) {
        node.material.color.set(material.userData.texture ? '#ffffff' : dark ? '#20292d' : '#b2b7b9')
        node.material.roughness = dark ? .45 : .34
      }
    }
    const joint = node.userData.joint
    if (joint && poses[joint.name] !== undefined) {
      const axis = new THREE.Vector3(...joint.axis.split(' ').map(Number) as Vec)
      const range = joint.range.split(' ').map(Number)
      node.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(axis, THREE.MathUtils.clamp(poses[joint.name], range[0], range[1])))
    }
  })
  robot.position.set(-1.1, 0, .15)
  robot.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(robot)
  robot.position.y += .018 - box.min.y
  robot.updateMatrixWorld(true)
  return robot
}
