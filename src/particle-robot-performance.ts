import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js'
import { createParticleLaundryCloth } from './particle-laundry-cloth'

type Joint = {
  node: THREE.Object3D
  rest: THREE.Quaternion
  axis: THREE.Vector3
  min: number
  max: number
  angle: number
}

export type ParticleRobotPerformance = {
  group: THREE.Group
  update: (progress: number, time: number) => void
  dispose: () => void
  getTracePoints: () => THREE.Vector3[]
  snapshot: () => { positions: Float32Array; colors: Float32Array; strengths: Float32Array }
}

const clamp = THREE.MathUtils.clamp
const smooth = (a: number, b: number, value: number) => {
  const t = clamp((value - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

function randomSequence(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

function surfaceArea(mesh: THREE.Mesh) {
  const position = mesh.geometry.getAttribute('position')
  const indices = mesh.geometry.index
  const count = indices?.count ?? position.count
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
  let area = 0
  for (let i = 0; i < count; i += 3) {
    a.fromBufferAttribute(position, indices ? indices.getX(i) : i)
    b.fromBufferAttribute(position, indices ? indices.getX(i + 1) : i + 1)
    c.fromBufferAttribute(position, indices ? indices.getX(i + 2) : i + 2)
    area += b.sub(a).cross(c.sub(a)).length() * 0.5
  }
  return area
}

/** A sampled, articulated G1 performance. Metres, Y up, facing +Z at rest. */
export async function createParticleRobotPerformance({ compact }: { compact: boolean }): Promise<ParticleRobotPerformance> {
  const group = new THREE.Group()
  group.name = 'particle-robot-performance'
  const stage = new THREE.Group()
  // The source robot faces +X. This wrapper gives the public group a +Z front.
  stage.rotation.y = -Math.PI / 2
  group.add(stage)
  const ownedGeometries = new Set<THREE.BufferGeometry>()
  const ownedMaterials = new Set<THREE.Material>()
  const random = randomSequence(741933)
  const particleMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    uniforms: {
      uOpacity: { value: 1 },
      uAssemble: { value: 1 },
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2) },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aNormal;
      attribute vec3 aColor;
      attribute float aSeed;
      attribute float aStrength;
      attribute float aSize;
      uniform float uAssemble;
      uniform float uTime;
      uniform float uPixelRatio;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float phase = aSeed * 6.2831853;
        float loose = pow(1.0 - uAssemble, 1.7);
        vec3 release = vec3(cos(phase * 3.0), sin(phase * 2.0), sin(phase * 4.0));
        vec3 p = position + release * loose * (0.28 + aSeed * 0.7);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vec3 n = normalize(normalMatrix * aNormal);
        float edge = pow(1.0 - abs(dot(n, normalize(-mv.xyz))), 1.4);
        float faceLight = 0.62 + 0.38 * abs(dot(n, normalize(vec3(-0.35, 0.7, 0.6))));
        float scintillation = 0.96 + 0.04 * sin(uTime * 0.8 + phase * 4.0);
        vColor = aColor * (faceLight + edge * 0.2);
        vAlpha = aStrength * scintillation * mix(0.24, 1.0, uAssemble);
        float size = mix(0.85, 1.35, aSeed) * uPixelRatio * aSize;
        gl_PointSize = clamp(size * (8.5 / max(2.0, -mv.z)), 0.72 * uPixelRatio * aSize, 2.65 * uPixelRatio * aSize);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float radius = length(gl_PointCoord - 0.5) * 2.0;
        if (radius > 1.0) discard;
        float disc = exp(-radius * radius * 3.5) * (1.0 - smoothstep(0.65, 1.0, radius));
        gl_FragColor = vec4(vColor, disc * vAlpha * uOpacity * 0.9);
      }
    `,
  })
  ownedMaterials.add(particleMaterial)

  function sampledSurface(mesh: THREE.Mesh, count: number, color: THREE.Color, strength = 0.8, pointScale = 1) {
    const sampler = new MeshSurfaceSampler(mesh)
    // Three r185 exposes this field; the installed supplemental types predate it.
    ;(sampler as MeshSurfaceSampler & { randomFunction: () => number }).randomFunction = random
    sampler.build()
    const position = new Float32Array(count * 3)
    const normals = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    const strengths = new Float32Array(count)
    const sizes = new Float32Array(count).fill(pointScale)
    const point = new THREE.Vector3(), normal = new THREE.Vector3()
    for (let i = 0; i < count; i++) {
      sampler.sample(point, normal)
      point.toArray(position, i * 3)
      normal.toArray(normals, i * 3)
      const brightness = 0.68 + random() * 0.32
      colors[i * 3] = color.r * brightness
      colors[i * 3 + 1] = color.g * brightness
      colors[i * 3 + 2] = color.b * brightness
      seeds[i] = random()
      strengths[i] = strength * (0.7 + random() * 0.3)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
    geometry.setAttribute('aNormal', new THREE.BufferAttribute(normals, 3))
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    geometry.setAttribute('aStrength', new THREE.BufferAttribute(strengths, 1))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geometry.computeBoundingSphere()
    ownedGeometries.add(geometry)
    const points = new THREE.Points(geometry, particleMaterial)
    points.name = mesh.name
    points.position.copy(mesh.position)
    points.quaternion.copy(mesh.quaternion)
    points.scale.copy(mesh.scale)
    points.frustumCulled = false
    return points
  }

  function sampledPrimitive(name: string, geometry: THREE.BufferGeometry, color: string, count: number, strength: number, parent: THREE.Object3D = environment) {
    const mesh = new THREE.Mesh(geometry)
    mesh.name = name
    const structural = /washer|hanger|clothesline/.test(name)
    const points = sampledSurface(mesh, Math.round(count * (compact ? 0.58 : 1)), new THREE.Color(color), strength, structural ? 1.2 : 1)
    parent.add(points)
    geometry.dispose()
    return points
  }
  const environment = new THREE.Group()
  environment.name = 'particle-laundry-room'
  stage.add(environment)
  function environmentBox(name: string, size: [number, number, number], position: [number, number, number], density: number, strength = 0.24) {
    const washer = name.startsWith('washer')
    const floor = name === 'laundry-floor'
    const points = sampledPrimitive(name, new THREE.BoxGeometry(...size), washer ? '#c2d5ed' : '#adc4df', density, floor ? strength : Math.min(0.94, strength * (washer ? 2.5 : 1.7)))
    points.position.set(...position)
    return points
  }
  function rod(name: string, from: THREE.Vector3, to: THREE.Vector3, radius: number, count: number, color = '#adc4df', parent: THREE.Object3D = environment) {
    const points = sampledPrimitive(name, new THREE.CylinderGeometry(radius, radius, from.distanceTo(to), 8), color, count, /hanger|clothesline/.test(name) ? 0.82 : 0.64, parent)
    points.position.copy(from).add(to).multiplyScalar(0.5)
    points.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize())
    return points
  }
  environmentBox('laundry-floor', [1.85, 0.008, 2.55], [0.02, -0.012, 0], 2700, 0.10)
  // An open front and an actual drum keep the circular door readable in particles.
  environmentBox('washer-left-side', [0.58, 0.84, 0.025], [0.51, 0.43, 0.295], 1050, 0.27)
  environmentBox('washer-right-side', [0.58, 0.84, 0.025], [0.51, 0.43, 0.905], 1050, 0.27)
  environmentBox('washer-top', [0.60, 0.035, 0.63], [0.51, 0.867, 0.60], 1000, 0.34)
  environmentBox('washer-back', [0.018, 0.82, 0.60], [0.8, 0.43, 0.60], 650, 0.13)
  environmentBox('washer-control-panel', [0.035, 0.14, 0.61], [0.205, 0.778, 0.60], 850, 0.47)
  environmentBox('washer-lower-front', [0.035, 0.24, 0.61], [0.205, 0.135, 0.60], 800, 0.30)
  environmentBox('washer-front-left-edge', [0.03, 0.46, 0.058], [0.205, 0.495, 0.322], 360, 0.35)
  environmentBox('washer-front-right-edge', [0.03, 0.46, 0.058], [0.205, 0.495, 0.878], 360, 0.35)
  const drum = sampledPrimitive('washer-open-drum', new THREE.CylinderGeometry(0.223, 0.223, 0.32, 48, 1, true), '#82a9db', 2100, 0.43)
  drum.rotation.z = Math.PI / 2
  drum.position.set(0.375, 0.515, 0.60)
  const rim = sampledPrimitive('washer-drum-rim', new THREE.TorusGeometry(0.233, 0.012, 8, 96), '#a1bfff', 1100, 0.98)
  rim.rotation.y = Math.PI / 2
  rim.position.set(0.18, 0.515, 0.60)
  const dial = sampledPrimitive('washer-control-dial', new THREE.TorusGeometry(0.032, 0.006, 8, 32), '#e1e4e8', 160, 0.71)
  dial.rotation.y = Math.PI / 2
  dial.position.set(0.18, 0.784, 0.744)
  environmentBox('washer-display', [0.005, 0.027, 0.108], [0.181, 0.784, 0.51], 110, 0.62)

  const door = new THREE.Group()
  door.name = 'washer-hinged-door'
  door.position.set(0.158, 0.515, 0.365)
  environment.add(door)
  const doorRim = sampledPrimitive('washer-door-rim', new THREE.TorusGeometry(0.232, 0.016, 8, 96), '#d7e3f2', 1250, 0.98, door)
  doorRim.rotation.y = Math.PI / 2
  doorRim.position.z = 0.235
  const glass = sampledPrimitive('washer-door-glass', new THREE.CircleGeometry(0.212, 64), '#87a8d2', 560, 0.21, door)
  glass.rotation.y = Math.PI / 2
  glass.position.set(-0.012, 0, 0.235)
  const doorHandle = new THREE.Object3D()
  doorHandle.position.set(-0.017, 0.070, 0.445)
  door.add(doorHandle)
  rod('washer-door-handle', new THREE.Vector3(-0.024, 0.033, 0.438), new THREE.Vector3(-0.024, 0.106, 0.438), 0.013, 130, '#edf0f4', door)

  // A compact stand stores the hanger beside the machine at a reachable height.
  environmentBox('folding-table-top', [0.32, 0.026, 0.32], [-0.015, 0.646, 1.00], 800, 0.23)
  for (const x of [-0.15, 0.12]) {
    for (const z of [0.865, 1.135]) environmentBox('folding-table-leg', [0.022, 0.635, 0.022], [x, 0.319, z], 100, 0.18)
  }
  rod('hanger-stand', new THREE.Vector3(0.21, 0.65, 0.91), new THREE.Vector3(0.21, 1.15, 0.91), 0.008, 190)
  rod('hanger-stand-peg', new THREE.Vector3(0.21, 1.15, 0.91), new THREE.Vector3(0.075, 1.15, 0.91), 0.006, 110)

  // The line crosses the hanger plane, making the final hook/line contact explicit.
  const lineA = new THREE.Vector3(0.60, 1.36, -0.92)
  const lineB = new THREE.Vector3(0.02, 1.36, -0.40)
  for (const point of [lineA, lineB]) {
    rod('clothesline-upright', new THREE.Vector3(point.x, 0, point.z), new THREE.Vector3(point.x, 1.56, point.z), 0.011, 620)
    rod('clothesline-foot', new THREE.Vector3(point.x - 0.14, 0.012, point.z), new THREE.Vector3(point.x + 0.14, 0.012, point.z), 0.012, 160)
  }
  const lineCurve = new THREE.QuadraticBezierCurve3(lineA, new THREE.Vector3(0.31, 1.335, -0.66), lineB)
  const line = sampledPrimitive('clothesline', new THREE.TubeGeometry(lineCurve, 90, 0.0028, 5, false), '#d3dff0', 880, 0.91)
  line.name = 'clothesline'
  const hangingPoint = lineCurve.getPoint(0.56)

  const hanger = new THREE.Group()
  hanger.name = 'laundry-wire-hanger'
  stage.add(hanger)
  const hangerShape = [new THREE.Vector3(-0.158, -0.058, 0), new THREE.Vector3(0, 0.002, 0), new THREE.Vector3(0.158, -0.058, 0), new THREE.Vector3(-0.158, -0.058, 0)]
  for (let i = 0; i < hangerShape.length - 1; i++) rod('hanger-shoulder-wire', hangerShape[i], hangerShape[i + 1], 0.003, 180, '#edf0f4', hanger)
  const hookCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.002, 0), new THREE.Vector3(0, 0.052, 0),
    new THREE.Vector3(-0.026, 0.078, 0), new THREE.Vector3(-0.023, 0.108, 0),
    new THREE.Vector3(0.008, 0.119, 0), new THREE.Vector3(0.032, 0.098, 0),
    new THREE.Vector3(0.024, 0.084, 0),
  ])
  sampledPrimitive('hanger-open-hook', new THREE.TubeGeometry(hookCurve, 36, 0.0032, 6, false), '#edf0f4', 280, 0.88, hanger)
  const hangerGrip = new THREE.Object3D()
  hangerGrip.position.set(0, 0.06, 0)
  hanger.add(hangerGrip)
  hanger.position.set(0.105, 1.035, 0.91)
  hanger.rotation.y = Math.PI / 2

  const cloth = createParticleLaundryCloth({ compact, material: particleMaterial, random })
  stage.add(cloth.points)

  const gltf = await new GLTFLoader().loadAsync('/assets/robot-data-spatial/miniature/g1/g1-web.glb')
  const robot = gltf.scene
  robot.name = 'articulated-particle-g1'
  stage.add(robot)
  const importedRobotQuaternion = robot.quaternion.clone()
  const meshes: THREE.Mesh[] = []
  const joints = new Map<string, Joint>()
  robot.traverse(node => {
    if (node instanceof THREE.Mesh) meshes.push(node)
    const source = node.userData.joint as { name: string; axis: string; range: string } | undefined
    if (source) {
      const range = source.range.split(' ').map(Number)
      joints.set(source.name, {
        node, rest: node.quaternion.clone(),
        axis: new THREE.Vector3().fromArray(source.axis.split(' ').map(Number)),
        min: range[0], max: range[1], angle: 0,
      })
    }
  })
  const areas = meshes.map(surfaceArea)
  const totalArea = areas.reduce((sum, area) => sum + area, 0)
  const particleBudget = compact ? 18000 : 34000
  for (const [index, mesh] of meshes.entries()) {
    const originalMaterial = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
    const dark = originalMaterial instanceof THREE.MeshStandardMaterial && originalMaterial.color.r < 0.3
    const accent = /hip_roll|knee_link|shoulder_roll|elbow_link|wrist_pitch/.test(mesh.name)
    const color = new THREE.Color(accent ? '#598fff' : dark ? '#8996a8' : '#e1e4e8')
    const points = sampledSurface(mesh, Math.max(110, Math.round(particleBudget * areas[index] / totalArea)), color, accent ? 0.86 : dark ? 0.66 : 0.91, 1.2)
    mesh.parent?.add(points)
    mesh.removeFromParent()
    mesh.geometry.dispose()
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) material.dispose()
  }

  const temporaryQuaternion = new THREE.Quaternion()
  function setJoint(name: string, angle: number) {
    const joint = joints.get(name)
    if (!joint) return
    joint.angle = clamp(angle, joint.min, joint.max)
    joint.node.quaternion.copy(joint.rest).multiply(temporaryQuaternion.setFromAxisAngle(joint.axis, joint.angle))
  }
  const leftPalm = new THREE.Object3D(), rightPalm = new THREE.Object3D()
  leftPalm.position.x = 0.10
  rightPalm.position.x = 0.10
  robot.getObjectByName('left_wrist_yaw_link')?.add(leftPalm)
  robot.getObjectByName('right_wrist_yaw_link')?.add(rightPalm)
  const leftAnkle = robot.getObjectByName('left_ankle_roll_link')!
  const rightAnkle = robot.getObjectByName('right_ankle_roll_link')!
  const head = robot.getObjectByName('head_link_visual')!
  const leftShoulder = robot.getObjectByName('left_shoulder_pitch_link')!
  const rightShoulder = robot.getObjectByName('right_shoulder_pitch_link')!
  const tempA = new THREE.Vector3(), tempB = new THREE.Vector3(), jointPosition = new THREE.Vector3()
  const jointAxis = new THREE.Vector3(), cross = new THREE.Vector3()
  const worldQuaternion = new THREE.Quaternion()
  const targetWorld = new THREE.Vector3()
  const worldMatrixInverse = new THREE.Matrix4()

  // Constrained CCD operates on the real joint axes; each frame starts from the
  // authored pose so reverse scrolling reaches exactly the same configuration.
  function solve(end: THREE.Object3D, names: string[], target: THREE.Vector3, iterations = 7) {
    targetWorld.copy(target)
    stage.localToWorld(targetWorld)
    for (let iteration = 0; iteration < iterations; iteration++) {
      for (const name of names) {
        const joint = joints.get(name)
        if (!joint) continue
        joint.node.getWorldPosition(jointPosition)
        joint.node.getWorldQuaternion(worldQuaternion)
        jointAxis.copy(joint.axis).applyQuaternion(worldQuaternion).normalize()
        end.getWorldPosition(tempA).sub(jointPosition)
        tempB.copy(targetWorld).sub(jointPosition)
        tempA.addScaledVector(jointAxis, -tempA.dot(jointAxis)).normalize()
        tempB.addScaledVector(jointAxis, -tempB.dot(jointAxis)).normalize()
        const angle = Math.atan2(jointAxis.dot(cross.crossVectors(tempA, tempB)), clamp(tempA.dot(tempB), -1, 1))
        setJoint(name, joint.angle + clamp(angle, -0.24, 0.24) * 0.72)
        joint.node.updateWorldMatrix(false, true)
      }
    }
  }

  const footUp = new THREE.Vector3(), desiredUp = new THREE.Vector3()
  const sourceUp = new THREE.Vector3(0, 0, 1)
  function levelFoot(side: string, ankle: THREE.Object3D) {
    stage.getWorldQuaternion(worldQuaternion)
    desiredUp.set(0, 1, 0).applyQuaternion(worldQuaternion)
    for (let pass = 0; pass < 4; pass++) {
      for (const suffix of ['pitch', 'roll']) {
        const joint = joints.get(`${side}_ankle_${suffix}_joint`)!
        joint.node.getWorldQuaternion(worldQuaternion)
        jointAxis.copy(joint.axis).applyQuaternion(worldQuaternion).normalize()
        ankle.getWorldQuaternion(worldQuaternion)
        footUp.copy(sourceUp).applyQuaternion(worldQuaternion)
        tempA.copy(footUp).addScaledVector(jointAxis, -footUp.dot(jointAxis)).normalize()
        tempB.copy(desiredUp).addScaledVector(jointAxis, -desiredUp.dot(jointAxis)).normalize()
        const angle = Math.atan2(jointAxis.dot(cross.crossVectors(tempA, tempB)), clamp(tempA.dot(tempB), -1, 1))
        setJoint(`${side}_ankle_${suffix}_joint`, joint.angle + angle * 0.85)
        joint.node.updateWorldMatrix(false, true)
      }
    }
  }

  type LegSide = 'left' | 'right'
  group.updateWorldMatrix(true, true)
  const legDimensions = Object.fromEntries((['left', 'right'] as const).map(side => {
    const hip = robot.getObjectByName(`${side}_hip_roll_link`)!.getWorldPosition(new THREE.Vector3())
    const knee = robot.getObjectByName(`${side}_knee_link`)!.getWorldPosition(new THREE.Vector3())
    const ankle = robot.getObjectByName(`${side}_ankle_pitch_link`)!.getWorldPosition(new THREE.Vector3())
    return [side, { upper: hip.distanceTo(knee), lower: knee.distanceTo(ankle) }]
  })) as Record<LegSide, { upper: number; lower: number }>
  const legPosition = new THREE.Vector3(), perturbedPosition = new THREE.Vector3()
  const legError = new THREE.Vector3(), correction = new THREE.Vector3()
  const jacobian = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
  const normalMatrix = new THREE.Matrix3()
  const angleLimits: Array<[number, number]> = [[-1.04, 0.52], [-0.24, 0.24], [0.025, 1.36]]
  function solveLeg(side: LegSide, ankle: THREE.Object3D, target: THREE.Vector3) {
    // The pelvis stays upright. Only sagittal flexion and limited lateral balance
    // move the legs: yaw cannot drift while trying to compensate for an unreachable foot.
    const names = [`${side}_hip_pitch_joint`, `${side}_hip_roll_joint`, `${side}_knee_joint`]
    const angles = [-0.10, 0, 0.20]
    const hip = robot.getObjectByName(`${side}_hip_roll_link`)!
    hip.getWorldPosition(localPoint); stage.worldToLocal(localPoint)
    localPoint2.copy(target).sub(localPoint).applyAxisAngle(yAxis, -robot.rotation.y)
    const { upper, lower } = legDimensions[side]
    const reach = Math.min(Math.hypot(localPoint2.x, localPoint2.y, localPoint2.z), upper + lower - 0.001)
    angles[2] = clamp(Math.acos(clamp((reach * reach - upper * upper - lower * lower) / (2 * upper * lower), -1, 1)), 0.025, 1.36)
    angles[0] = clamp(-Math.atan2(localPoint2.x, -localPoint2.y) - Math.atan2(lower * Math.sin(angles[2]), upper + lower * Math.cos(angles[2])), -1.04, 0.52)
    angles[1] = clamp(-Math.atan2(localPoint2.z, -localPoint2.y), -0.24, 0.24)
    function forward(out: THREE.Vector3) {
      names.forEach((name, i) => setJoint(name, angles[i]))
      setJoint(`${side}_hip_yaw_joint`, 0)
      setJoint(`${side}_ankle_pitch_joint`, -angles[0] - angles[2])
      setJoint(`${side}_ankle_roll_joint`, -angles[1])
      robot.updateWorldMatrix(false, true)
      ankle.getWorldPosition(out)
      stage.worldToLocal(out)
    }
    for (let iteration = 0; iteration < 22; iteration++) {
      forward(legPosition)
      legError.copy(target).sub(legPosition)
      if (legError.lengthSq() < 0.00000016) break
      for (let j = 0; j < 3; j++) {
        angles[j] += 0.001
        forward(perturbedPosition)
        jacobian[j].copy(perturbedPosition).sub(legPosition).multiplyScalar(1000)
        angles[j] -= 0.001
      }
      const a = jacobian[0], b = jacobian[1], c = jacobian[2]
      const damping = 0.00008
      normalMatrix.set(a.dot(a) + damping, a.dot(b), a.dot(c), a.dot(b), b.dot(b) + damping, b.dot(c), a.dot(c), b.dot(c), c.dot(c) + damping).invert()
      correction.set(a.dot(legError), b.dot(legError), c.dot(legError)).applyMatrix3(normalMatrix)
      correction.multiplyScalar(Math.min(1, 0.15 / Math.max(Math.abs(correction.x), Math.abs(correction.y), Math.abs(correction.z), 0.00001)))
      const previous = angles.slice()
      const previousError = legError.lengthSq()
      let accepted = false
      for (let trial = 0; trial < 7; trial++) {
        const fraction = 2 ** -trial
        for (let j = 0; j < 3; j++) angles[j] = clamp(previous[j] + correction.getComponent(j) * fraction, ...angleLimits[j])
        forward(perturbedPosition)
        if (perturbedPosition.distanceToSquared(target) < previousError) { accepted = true; break }
      }
      if (!accepted) { previous.forEach((angle, i) => { angles[i] = angle }); break }
    }
    forward(legPosition)
    levelFoot(side, ankle)
  }

  const armJoints = (side: string) => ['wrist_pitch', 'elbow', 'shoulder_yaw', 'shoulder_roll', 'shoulder_pitch'].map(name => `${side}_${name}_joint`)
  const leftArm = armJoints('left'), rightArm = armJoints('right')
  type RootPose = { t: number; x: number; z: number; heading: number }
  const rootKeys: RootPose[] = [
    { t: 0, x: -0.57, z: 0.60, heading: 0 },
    { t: 0.105, x: -0.14, z: 0.60, heading: 0 },
    { t: 0.165, x: -0.14, z: 0.60, heading: 0 },
    { t: 0.24, x: -0.40, z: 0.36, heading: 0 },
    { t: 0.285, x: -0.12, z: 0.60, heading: 0 },
    { t: 0.46, x: -0.12, z: 0.60, heading: 0 },
    { t: 0.52, x: -0.20, z: 0.64, heading: -0.04 },
    { t: 0.66, x: -0.20, z: 0.64, heading: 0 },
    { t: 0.69, x: -0.20, z: 0.60, heading: 1.48 },
    { t: 0.735, x: -0.20, z: 0.15, heading: 1.48 },
    { t: 0.78, x: -0.20, z: -0.43, heading: 1.35 },
    { t: 0.815, x: 0.005, z: -0.71, heading: 0 },
    { t: 0.935, x: 0.005, z: -0.71, heading: 0 },
    { t: 0.958, x: -0.22, z: -0.59, heading: 0 },
    { t: 0.99, x: -0.32, z: -0.18, heading: 0 },
    { t: 1, x: -0.32, z: -0.18, heading: 0 },
    { t: 1.035, x: -0.34, z: -0.14, heading: -1.38 },
    { t: 1.105, x: -0.37, z: 0.15, heading: -1.38 },
    { t: 1.17, x: -0.40, z: 0.36, heading: 0 },
    { t: 1.215, x: -0.40, z: 0.36, heading: 0 },
    { t: 1.29, x: -0.14, z: 0.60, heading: 0 },
    { t: 4 / 3, x: -0.27, z: 0.60, heading: 0 },
  ]
  function rootPose(p: number): RootPose {
    for (let i = 1; i < rootKeys.length; i++) {
      if (p <= rootKeys[i].t) {
        const from = rootKeys[i - 1], to = rootKeys[i]
        const t = smooth(from.t, to.t, p)
        return { t: p, x: THREE.MathUtils.lerp(from.x, to.x, t), z: THREE.MathUtils.lerp(from.z, to.z, t), heading: THREE.MathUtils.lerp(from.heading, to.heading, t) }
      }
    }
    return rootKeys[rootKeys.length - 1]
  }
  const steps: Array<{ start: number; end: number; side: 'left' | 'right' }> = [
    ...Array.from({ length: 6 }, (_, index) => ({
      start: 0.006 + index * 0.018, end: 0.023 + index * 0.018,
      side: (index % 2 === 0 ? 'left' : 'right') as 'left' | 'right',
    })),
    ...Array.from({ length: 6 }, (_, index) => ({
      start: 0.168 + index * 0.0125, end: 0.1795 + index * 0.0125,
      side: (index % 2 === 0 ? 'left' : 'right') as 'left' | 'right',
    })),
    ...Array.from({ length: 6 }, (_, index) => ({
      start: 0.243 + index * 0.010, end: 0.252 + index * 0.010,
      side: (index % 2 === 0 ? 'left' : 'right') as 'left' | 'right',
    })),
    { start: 0.472, end: 0.498, side: 'left' }, { start: 0.500, end: 0.526, side: 'right' },
    ...Array.from({ length: 14 }, (_, index) => ({
      start: 0.662 + index * 0.0123, end: 0.6735 + index * 0.0123,
      side: (index % 2 === 0 ? 'left' : 'right') as 'left' | 'right',
    })),
    ...Array.from({ length: 8 }, (_, index) => ({
      start: 0.936 + index * 0.0085, end: 0.9438 + index * 0.0085,
      side: (index % 2 === 0 ? 'right' : 'left') as 'left' | 'right',
    })),
    ...Array.from({ length: 10 }, (_, index) => ({
      start: 1.005 + index * 0.017, end: 1.021 + index * 0.017,
      side: (index % 2 === 0 ? 'right' : 'left') as 'left' | 'right',
    })),
    { start: 1.216, end: 1.234, side: 'right' }, { start: 1.235, end: 1.253, side: 'left' },
    { start: 1.254, end: 1.272, side: 'right' }, { start: 1.273, end: 1.29, side: 'left' },
    { start: 1.294, end: 1.312, side: 'right' }, { start: 1.313, end: 4 / 3, side: 'left' },
  ]
  const footTarget = new THREE.Vector3(), footFrom = new THREE.Vector3(), footTo = new THREE.Vector3()
  function nominalFoot(pose: RootPose, sign: number, out: THREE.Vector3) {
    return out.set(pose.x + Math.sin(pose.heading) * sign * 0.1185, 0.03614, pose.z + Math.cos(pose.heading) * sign * 0.1185)
  }
  function plannedFoot(side: 'left' | 'right', p: number) {
    const sign = side === 'left' ? -1 : 1
    nominalFoot(rootKeys[0], sign, footFrom)
    for (const step of steps) {
      if (step.side !== side) continue
      nominalFoot(rootPose(step.end), sign, footTo)
      if (p < step.start) break
      if (p < step.end) {
        const t = smooth(step.start, step.end, p)
        footTarget.copy(footFrom).lerp(footTo, t)
        const squattingStep = step.start >= 0.16 && step.end <= 0.31 || step.start >= 1.21
        footTarget.y += Math.sin(t * Math.PI) * (squattingStep ? 0.012 : 0.026)
        return footTarget
      }
      footFrom.copy(footTo)
    }
    return footTarget.copy(footFrom)
  }
  const leftTarget = new THREE.Vector3(), rightTarget = new THREE.Vector3()
  const neutralLeft = new THREE.Vector3(), neutralRight = new THREE.Vector3()
  const localPoint = new THREE.Vector3(), localPoint2 = new THREE.Vector3(), shoulderOffset = new THREE.Vector3()
  const clothOrigin = new THREE.Vector3(), hangerOrigin = new THREE.Vector3()
  const carryOrigin = new THREE.Vector3(), contactOrigin = new THREE.Vector3()
  const clothRotation = new THREE.Quaternion(), hangerRotation = new THREE.Quaternion()
  const rotationY = new THREE.Quaternion(), rotationZ = new THREE.Quaternion()
  const yAxis = new THREE.Vector3(0, 1, 0), zAxis = new THREE.Vector3(0, 0, 1)
  const initialCloth = new THREE.Vector3(0.265, 0.63, 0.60)
  const extractedCloth = new THREE.Vector3(0.035, 0.85, 0.60)
  const openedCloth = new THREE.Vector3(0.065, 1.04, 0.60)
  const guidedCloth = new THREE.Vector3(0.070, 1.015, 0.53)
  const rackHanger = new THREE.Vector3(0.105, 1.035, 0.91)
  const lineDirection = lineB.clone().sub(lineA).normalize()
  const hangingYaw = Math.atan2(lineDirection.x, lineDirection.z) + Math.PI
  const seatedRotation = new THREE.Quaternion().setFromAxisAngle(yAxis, hangingYaw)
  const seatedOrigin = hangingPoint.clone().sub(new THREE.Vector3(0.007, 0.110, 0).applyQuaternion(seatedRotation))
  const cachedTraces = Array.from({ length: 6 }, () => new THREE.Vector3())
  const traceObjects = [leftPalm, rightPalm, cloth.points, hanger, head, leftShoulder]
  let lastProgress = -1

  function orient(out: THREE.Quaternion, yaw: number, lean = 0) {
    return out.copy(rotationY.setFromAxisAngle(yAxis, yaw)).multiply(rotationZ.setFromAxisAngle(zAxis, lean))
  }
  function targetFromObject(object: THREE.Object3D, local: THREE.Vector3, out: THREE.Vector3) {
    out.copy(local)
    object.localToWorld(out)
    stage.worldToLocal(out)
    return out
  }

  function update(progress: number, time: number) {
    const overallProgress = clamp(progress, 0, 1)
    const timeline = overallProgress / 0.75
    const p = Math.min(timeline, 1)
    particleMaterial.uniforms.uTime.value = time
    if (lastProgress === overallProgress) return
    lastProgress = overallProgress
    for (const joint of joints.values()) {
      joint.angle = 0
      joint.node.quaternion.copy(joint.rest)
    }
    const root = rootPose(timeline)
    const openingSquat = smooth(0.105, 0.155, p) * (1 - smooth(0.355, 0.44, p))
    const closingSquat = smooth(1.145, 1.20, timeline) * (1 - smooth(1.29, 4 / 3, timeline))
    const squat = Math.max(openingSquat, closingSquat)
    const leftFootTarget = plannedFoot('left', timeline).clone()
    const rightFootTarget = plannedFoot('right', timeline).clone()
    // The pelvis follows the support feet, not an independently accelerating path.
    // This keeps the complete silhouette balanced while each foot remains planted.
    const supportX = (leftFootTarget.x + rightFootTarget.x) * 0.5
    const supportZ = (leftFootTarget.z + rightFootTarget.z) * 0.5
    root.x = supportX + clamp(root.x - supportX, -0.022, 0.022)
    root.z = supportZ + clamp(root.z - supportZ, -0.022, 0.022)
    nominalFoot(root, -1, localPoint)
    nominalFoot(root, 1, localPoint2)
    const legReachSquared = Math.max((leftFootTarget.x - localPoint.x) ** 2 + (leftFootTarget.z - localPoint.z) ** 2, (rightFootTarget.x - localPoint2.x) ** 2 + (rightFootTarget.z - localPoint2.z) ** 2)
    const strideDrop = Math.min(0.034, legReachSquared / 1.20) * (1 - squat)
    robot.position.set(root.x, -0.006 - squat * 0.117 - strideDrop, root.z)
    robot.quaternion.copy(rotationY.setFromAxisAngle(yAxis, root.heading)).multiply(importedRobotQuaternion)
    setJoint('waist_pitch_joint', 0.018 + squat * 0.16)
    setJoint('waist_yaw_joint', 0)
    for (const [side, sign] of [['left', 1], ['right', -1]] as const) {
      setJoint(`${side}_shoulder_pitch_joint`, -0.13)
      setJoint(`${side}_shoulder_roll_joint`, sign * 0.035)
      setJoint(`${side}_elbow_joint`, 0.42)
      setJoint(`${side}_wrist_pitch_joint`, -0.12)
    }
    door.rotation.y = -1.78 * smooth(0.17, 0.24, timeline) * (1 - smooth(1.215, 1.29, timeline))
    group.updateWorldMatrix(true, true)
    solveLeg('left', leftAnkle, leftFootTarget)
    solveLeg('right', rightAnkle, rightFootTarget)
    group.updateWorldMatrix(true, true)
    leftPalm.getWorldPosition(neutralLeft); stage.worldToLocal(neutralLeft)
    rightPalm.getWorldPosition(neutralRight); stage.worldToLocal(neutralRight)
    leftTarget.copy(neutralLeft)
    rightTarget.copy(neutralRight)

    // One garment retains its particles from the drum through its final drape.
    const unfold = smooth(0.335, 0.475, p)
    clothOrigin.copy(initialCloth).lerp(extractedCloth, smooth(0.285, 0.38, p))
    if (p >= 0.38) clothOrigin.lerpVectors(extractedCloth, openedCloth, smooth(0.38, 0.46, p))
    if (p >= 0.46) clothOrigin.lerpVectors(openedCloth, guidedCloth, smooth(0.46, 0.52, p))
    const shirtLean = -0.20 * smooth(0.49, 0.545, p) * (1 - smooth(0.585, 0.64, p))
    orient(clothRotation, Math.PI / 2, shirtLean)

    hangerOrigin.copy(rackHanger).lerp(guidedCloth, smooth(0.55, 0.61, p))
    hangerOrigin.y += Math.sin(smooth(0.55, 0.61, p) * Math.PI) * 0.072
    const insertionTilt = -0.72 * smooth(0.55, 0.58, p) * (1 - smooth(0.595, 0.65, p))
    orient(hangerRotation, Math.PI / 2, insertionTilt)
    const mounted = smooth(0.59, 0.66, p)
    if (p >= 0.59) {
      clothOrigin.lerp(hangerOrigin, mounted)
      clothRotation.slerp(hangerRotation, mounted)
    }
    if (p >= 0.66) {
      carryOrigin.set(root.x + Math.cos(root.heading) * 0.29, 1.04, root.z - Math.sin(root.heading) * 0.29)
      hangerOrigin.lerp(carryOrigin, smooth(0.66, 0.685, p))
      orient(hangerRotation, Math.PI / 2 + root.heading)
      clothOrigin.copy(hangerOrigin)
      clothRotation.copy(hangerRotation)
    }
    if (p >= 0.80) {
      const lift = smooth(0.80, 0.863, p)
      localPoint.copy(seatedOrigin).add(new THREE.Vector3(-0.025, 0.053, 0).applyQuaternion(seatedRotation))
      hangerOrigin.lerp(localPoint, lift)
      hangerRotation.slerp(seatedRotation, lift)
      if (p >= 0.863) {
        const across = smooth(0.863, 0.887, p)
        localPoint2.copy(seatedOrigin).add(new THREE.Vector3(0.018, 0.035, 0).applyQuaternion(seatedRotation))
        hangerOrigin.lerpVectors(localPoint, localPoint2, across)
        if (p >= 0.887) hangerOrigin.lerpVectors(localPoint2, seatedOrigin, smooth(0.887, 0.916, p))
      }
      clothOrigin.copy(hangerOrigin)
      clothRotation.copy(hangerRotation)
    }
    cloth.update({ unfold, hanger: mounted, time: p * 38 })
    cloth.points.position.copy(clothOrigin)
    cloth.points.quaternion.copy(clothRotation)
    hanger.position.copy(hangerOrigin)
    hanger.quaternion.copy(hangerRotation)
    group.updateWorldMatrix(true, true)

    // The opening hand stays on the moving physical handle until release.
    const openingContact = smooth(0.115, 0.167, p) * (1 - smooth(0.24, 0.266, p))
    const closingContact = smooth(1.17, 1.21, timeline) * (1 - smooth(1.29, 1.32, timeline))
    const doorContact = Math.max(openingContact, closingContact)
    if (doorContact > 0) {
      doorHandle.getWorldPosition(localPoint); stage.worldToLocal(localPoint)
      rightTarget.lerp(localPoint, doorContact)
    }
    const garmentContact = smooth(0.253, 0.291, p)
    const shoulderWidth = cloth.shoulderHalfWidth * (0.25 + 0.75 * unfold)
    const shoulderY = -0.032 * (0.39 + 0.61 * unfold)
    shoulderOffset.set(shoulderWidth, shoulderY, 0)
    targetFromObject(cloth.points, shoulderOffset, localPoint)
    const leftGuide = garmentContact * (1 - smooth(0.805, 0.853, p))
    leftTarget.lerp(localPoint, leftGuide)
    shoulderOffset.x = -shoulderWidth
    targetFromObject(cloth.points, shoulderOffset, localPoint)
    const rightCloth = garmentContact * (1 - smooth(0.49, 0.537, p))
    rightTarget.lerp(localPoint, rightCloth)
    const hangerContact = smooth(0.50, 0.55, p) * (1 - smooth(0.927, 0.973, p))
    if (hangerContact > 0) {
      hangerGrip.getWorldPosition(localPoint); stage.worldToLocal(localPoint)
      rightTarget.lerp(localPoint, hangerContact)
    }
    solve(leftPalm, leftArm, leftTarget, 16)
    solve(rightPalm, rightArm, rightTarget, doorContact > 0.99 ? 30 : 16)
    group.updateWorldMatrix(true, true)

    // Attachments use solved palm positions while held and relinquish control only
    // when a physical support (the hanger or the clothesline) takes their weight.
    const twoHandAttachment = smooth(0.288, 0.315, p) * (1 - smooth(0.48, 0.515, p))
    if (twoHandAttachment > 0) {
      leftPalm.getWorldPosition(tempA); rightPalm.getWorldPosition(tempB)
      contactOrigin.copy(tempA).add(tempB).multiplyScalar(0.5)
      stage.worldToLocal(contactOrigin)
      localPoint.set(0, shoulderY, 0).applyQuaternion(clothRotation)
      contactOrigin.sub(localPoint)
      cloth.points.position.lerp(contactOrigin, twoHandAttachment)
    }
    const oneHandAttachment = smooth(0.49, 0.53, p) * (1 - smooth(0.585, 0.63, p))
    if (oneHandAttachment > 0) {
      leftPalm.getWorldPosition(contactOrigin); stage.worldToLocal(contactOrigin)
      localPoint.set(shoulderWidth, shoulderY, 0).applyQuaternion(clothRotation)
      cloth.points.position.lerp(contactOrigin.sub(localPoint), oneHandAttachment)
    }
    const carriedHanger = smooth(0.55, 0.57, p) * (1 - smooth(0.888, 0.916, p))
    if (carriedHanger > 0) {
      rightPalm.getWorldPosition(contactOrigin); stage.worldToLocal(contactOrigin)
      localPoint.copy(hangerGrip.position).applyQuaternion(hangerRotation)
      contactOrigin.sub(localPoint)
      hanger.position.lerp(contactOrigin, carriedHanger)
      if (mounted > 0) cloth.points.position.lerp(hanger.position, mounted)
    }
    group.updateWorldMatrix(true, true)
    worldMatrixInverse.copy(group.matrixWorld).invert()
    for (let i = 0; i < traceObjects.length; i++) traceObjects[i].getWorldPosition(cachedTraces[i]).applyMatrix4(worldMatrixInverse)
    rightShoulder.getWorldPosition(tempA).applyMatrix4(worldMatrixInverse)
    cachedTraces[5].lerp(tempA, 0.5)
    group.userData.taskStage = timeline >= 1.29 ? 'release-door-and-stand' : timeline >= 1.21 ? 'close-door' : timeline >= 1.17 ? 'reach-door-handle' : timeline >= 1 ? 'return-to-washer' : p < 0.105 ? 'approach' : p < 0.25 ? 'open-door' : p < 0.38 ? 'retrieve-garment' : p < 0.50 ? 'unfold' : p < 0.66 ? 'fit-hanger' : p < 0.815 ? 'walk-to-line' : p < 0.93 ? 'hang-garment' : 'release-and-step-back'
    group.userData.taskProgress = overallProgress
    group.userData.motionDiagnostics = {
      timeline, authoredProgress: p, squat, pelvisHeight: robot.position.y,
      leftFootTarget: leftFootTarget.toArray(), rightFootTarget: rightFootTarget.toArray(),
      leftSwing: steps.some(step => step.side === 'left' && timeline > step.start && timeline < step.end),
      rightSwing: steps.some(step => step.side === 'right' && timeline > step.start && timeline < step.end),
      doorContact, openingContact, closingContact,
      jointAngles: Object.fromEntries([...joints.entries()].map(([name, joint]) => [name, joint.angle])),
    }
  }

  function snapshot() {
    group.updateWorldMatrix(true, true)
    const inverse = new THREE.Matrix4().copy(group.matrixWorld).invert()
    const matrix = new THREE.Matrix4()
    const point = new THREE.Vector3()
    const pointMeshes: THREE.Points[] = []
    let count = 0
    group.traverse(object => {
      if (object instanceof THREE.Points) {
        pointMeshes.push(object)
        count += object.geometry.getAttribute('position').count
      }
    })
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const strengths = new Float32Array(count)
    let offset = 0
    for (const mesh of pointMeshes) {
      matrix.multiplyMatrices(inverse, mesh.matrixWorld)
      const sourcePosition = mesh.geometry.getAttribute('position')
      const sourceColor = mesh.geometry.getAttribute('aColor')
      const sourceStrength = mesh.geometry.getAttribute('aStrength')
      for (let i = 0; i < sourcePosition.count; i++) {
        point.fromBufferAttribute(sourcePosition, i).applyMatrix4(matrix).toArray(positions, (offset + i) * 3)
        colors[(offset + i) * 3] = sourceColor.getX(i)
        colors[(offset + i) * 3 + 1] = sourceColor.getY(i)
        colors[(offset + i) * 3 + 2] = sourceColor.getZ(i)
        strengths[offset + i] = sourceStrength.getX(i)
      }
      offset += sourcePosition.count
    }
    return { positions, colors, strengths }
  }

  group.userData.setOpacity = (opacity: number) => { particleMaterial.uniforms.uOpacity.value = clamp(opacity, 0, 1) }
  group.userData.setAssemble = (assemble: number) => { particleMaterial.uniforms.uAssemble.value = clamp(assemble, 0, 1) }
  group.userData.setPixelRatio = (pixelRatio: number) => { particleMaterial.uniforms.uPixelRatio.value = pixelRatio }
  group.userData.forward = '+Z'
  group.userData.height = 1.324
  group.userData.robot = robot
  group.userData.environment = environment
  group.userData.door = door
  group.userData.doorHandle = doorHandle
  group.userData.legDimensions = legDimensions
  group.userData.hanger = hanger
  group.userData.cloth = cloth.points
  group.userData.leftPalm = leftPalm
  group.userData.rightPalm = rightPalm
  update(0, 0)

  return {
    group,
    update,
    getTracePoints: () => cachedTraces.map(point => point.clone()),
    snapshot,
    dispose: () => {
      cloth.dispose()
      ownedGeometries.forEach(geometry => geometry.dispose())
      ownedMaterials.forEach(material => material.dispose())
      group.clear()
    },
  }
}
