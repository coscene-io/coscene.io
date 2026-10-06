import * as THREE from 'three'
import { CLOSING_START, CLOSING_SETTLED } from './quality-ribbon-story'
import type { TraceCardId } from './quality-trace-card-art'

const TAN = Math.tan(16 * Math.PI / 180)
export const CLOSING_CAMERA_Z = 44
export const CLOSING_IDS: TraceCardId[] = ['C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09', 'C10', 'C11', 'C12', 'C15', 'C16', 'C00']
const GROUP_STARTS = [0, 3, 7, 12], GROUP_COUNTS = [3, 4, 5, 3]
const smooth = (start: number, end: number, progress: number) => {
  const t = THREE.MathUtils.clamp((progress - start) / (end - start), 0, 1)
  return t * t * t * (t * (t * 6 - 15) + 10)
}
export const closingAmount = (progress: number) => smooth(CLOSING_START, CLOSING_SETTLED, progress)

type ClosingPose = { position: THREE.Vector3; quaternion: THREE.Quaternion; scale: number; curl: number }
// Compose the resting front view first, then place each card in real depth.
// Six staggered height bands leave a stable opening for the closing statement.
// Columns: screen x/y, world depth, yaw, pitch, roll, size, printed side.
const SLOTS = [
  [.49, .105, -8, -.18, -.04, -.035, .98, 1], // C01
  [.085, .285, -2, -.72, .06, .03, 1.00, -1], // C02
  [.095, .620, 5, .38, -.06, -.025, .98, 1], // C03
  [.34, .225, -3, .28, .05, .025, .94, 1], // C04
  [.82, .125, 3, .50, -.07, -.04, 1.00, -1], // C05
  [.69, .235, -6, -.30, -.04, .035, 1.00, 1], // C06
  [.885, .430, 6, -.43, .045, -.035, 1.03, 1], // C07
  [.32, .710, -3, .24, -.045, .02, 1.00, 1], // C08
  [.90, .775, 1, .76, -.04, .04, .96, -1], // C09
  [.78, .610, -8, -.36, .065, -.025, 1.05, 1], // C10
  [.17, .125, 6, -.34, .03, .045, 1.00, -1], // C11
  [.205, .445, 8, .25, -.045, -.035, 1.03, 1], // C12
  [.14, .800, 4, -.38, .04, .035, 1.00, -1], // C15
  [.53, .715, -7, -.22, .055, -.025, .96, 1], // C16
  [.67, .800, 6, .24, -.04, .025, 1.05, 1], // C00
] as const
const COMPACT_ANCHORS = [
  [.50, .10], [.18, .22], [.18, .62], [.47, .23], [.82, .095],
  [.79, .24], [.82, .33], [.43, .69], [.83, .80], [.80, .66],
  [.17, .10], [.18, .32], [.18, .83], [.54, .83], [.50, .58],
] as const
let layoutKey = '', baseLayout: ClosingPose[] = [], layoutSeparation = 1

/** The fixed composition reserves the complete headline plus breathing room. */
export function closingTitleBounds(width: number, height: number) {
  const compact = width < 700
  const font = compact ? THREE.MathUtils.clamp(width * .086, 28, 37) : THREE.MathUtils.clamp(width * .038, 36, 60)
  const gap = compact ? 20 : 28, halfWidth = (font * 7 / 2 + gap) / width
  const halfHeight = (font * (compact ? 1.3 : 1.25) + gap) / height
  return { left: .5 - halfWidth, right: .5 + halfWidth, top: .44 - halfHeight, bottom: .44 + halfHeight }
}

function closingLayout(width: number, height: number) {
  const key = `${width}:${height}`
  if (layoutKey === key) return baseLayout
  const aspect = width / height, compact = width < 700
  const scale = compact ? .50 : THREE.MathUtils.clamp(aspect * .58, .88, 1.22)
  baseLayout = SLOTS.map(([x, y, depth, yaw, pitch, roll, size, side], i) => {
    const anchor = compact ? COMPACT_ANCHORS[i] : [x, y]
    // Short phones need a little more vertical air around the two-line caption.
    const copyClearance = compact
      ? i === 14 ? 8 + (height < 700 ? 8 : 0) : height < 700 && (i === 6 || i === 11) ? -10 : 0
      : 0
    const distance = CLOSING_CAMERA_Z - depth
    const position = new THREE.Vector3((anchor[0] - .5) * 2 * TAN * distance * aspect,
      (.5 - anchor[1] - copyClearance / height) * 2 * TAN * distance, depth)
    return { position, quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(
      pitch, yaw + (side < 0 ? Math.PI : 0), roll, 'YXZ')),
    scale: scale * size, curl: .045 }
  })
  layoutSeparation = separateClosingCards(baseLayout)
  layoutKey = key
  return baseLayout
}

/** All cards stay near their authored positions. Phase starts at the exact
 * resting pose, preserving the archive handoff and reverse-scroll continuity.
 */
export function closingOrbitPose(rank: number, phase: number, width: number, height: number): ClosingPose {
  const base = closingLayout(width, height)[rank]
  const offset = rank * 2.399963
  const sway = Math.sin(phase + offset) - Math.sin(offset)
  const lift = Math.sin(phase + offset * .71) - Math.sin(offset * .71)
  const breathe = Math.cos(phase + offset) - Math.cos(offset)
  const worldPixel = 2 * TAN * (CLOSING_CAMERA_Z - base.position.z) / height
  // Keep a visible, unhurried float while preserving the tighter phone layout.
  const compact = width < 700
  // Neighbours with little projected space share a smaller motion envelope.
  // Blend out the constraint as the viewport gives them room to move.
  const clearance = compact
    ? rank === 1 || rank === 5 || rank === 6 || rank === 11
      ? THREE.MathUtils.lerp(.28, 1, smooth(640, 780, height)) : 1
    : rank === 13 || rank === 14
      ? THREE.MathUtils.lerp(.25, 1, smooth(1.2, 1.5, width / height)) : 1
  const travel = (compact ? .55 : 1) * clearance
  const tilt = (compact ? .75 : 1) * clearance
  const position = base.position.clone().add(new THREE.Vector3(sway * 6 * travel * worldPixel,
    lift * 9 * travel * worldPixel, breathe * .16 * travel))
  const attitude = new THREE.Quaternion().setFromEuler(new THREE.Euler(
    lift * .024 * tilt, sway * .035 * tilt, breathe * .014 * tilt, 'YXZ'))
  return { position, quaternion: base.quaternion.clone().multiply(attitude), scale: base.scale, curl: base.curl }
}

/** Resolve any authored face intersections once, before rigid rotation. */
export function separateClosingCards(poses: ClosingPose[], horizontalOnly = false) {
  const basis = poses.map(pose => [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)]
    .map(axis => axis.applyQuaternion(pose.quaternion)))
  const radii = poses.map(pose => new THREE.Vector3(2.2, 1.394,
    .052 + 5.2 * (1 - Math.cos(2.2 / 5.2)) * pose.curl).multiplyScalar(pose.scale))
  const factors = poses.map(() => 1), delta = new THREE.Vector3(), cross = new THREE.Vector3()
  for (let i = 0; i < poses.length; i++) for (let j = i + 1; j < poses.length; j++) {
    delta.subVectors(poses[i].position, poses[j].position)
    let critical = 0
    const test = (axis: THREE.Vector3) => {
      if (horizontalOnly) axis = new THREE.Vector3(axis.x, 0, axis.z)
      if (axis.lengthSq() < 1e-10) return
      const radius = Math.abs(axis.dot(basis[i][0])) * radii[i].x + Math.abs(axis.dot(basis[i][1])) * radii[i].y
        + Math.abs(axis.dot(basis[i][2])) * radii[i].z + Math.abs(axis.dot(basis[j][0])) * radii[j].x
        + Math.abs(axis.dot(basis[j][1])) * radii[j].y + Math.abs(axis.dot(basis[j][2])) * radii[j].z
      critical = Math.max(critical, Math.abs(delta.dot(axis)) / Math.max(1e-12, radius))
    }
    for (const axis of basis[i]) test(axis)
    for (const axis of basis[j]) test(axis)
    for (const a of basis[i]) for (const b of basis[j]) test(cross.crossVectors(a, b))
    const factor = Math.min(1, critical * .97)
    factors[i] = Math.min(factors[i], factor); factors[j] = Math.min(factors[j], factor)
  }
  poses.forEach((pose, index) => { pose.scale *= factors[index] })
  return Math.min(...factors)
}

/** Keep the flying faces at their authored size. Any crossed paths take
 * separate depth lanes instead of making a record shrink through its neighbour.
 * This is recomputed from progress, so reverse scrolling retraces the same pose.
 */
export function clearClosingFlights(poses: ClosingPose[], mobility: number[], ranks: number[]) {
  const basis = poses.map(pose => [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)]
    .map(axis => axis.applyQuaternion(pose.quaternion)))
  const radii = poses.map(pose => new THREE.Vector3(2.2, 1.394,
    .052 + 5.2 * (1 - Math.cos(2.2 / 5.2)) * pose.curl).multiplyScalar(pose.scale))
  const pairs: { i: number; j: number; axes: THREE.Vector3[]; radii: number[] }[] = []
  for (let i = 0; i < poses.length; i++) for (let j = i + 1; j < poses.length; j++) {
    if (mobility[i] + mobility[j] === 0) continue
    const axes = [...basis[i], ...basis[j]]
    for (const a of basis[i]) for (const b of basis[j]) {
      const cross = new THREE.Vector3().crossVectors(a, b)
      if (cross.lengthSq() > 1e-10) axes.push(cross.normalize())
    }
    const support = axes.map(axis => Math.abs(axis.dot(basis[i][0])) * radii[i].x + Math.abs(axis.dot(basis[i][1])) * radii[i].y
      + Math.abs(axis.dot(basis[i][2])) * radii[i].z + Math.abs(axis.dot(basis[j][0])) * radii[j].x
      + Math.abs(axis.dot(basis[j][1])) * radii[j].y + Math.abs(axis.dot(basis[j][2])) * radii[j].z + .014)
    pairs.push({ i, j, axes, radii: support })
  }
  const delta = new THREE.Vector3()
  for (let pass = 0; pass < 10; pass++) {
    let moved = false
    for (const pair of pairs) {
      const { i, j, axes, radii: support } = pair
      delta.subVectors(poses[i].position, poses[j].position)
      if (axes.some((axis, k) => Math.abs(delta.dot(axis)) >= support[k])) continue
      // Semantic order is stable even as two centres pass one another.
      const direction = ranks[i] > ranks[j] ? 1 : -1
      let depth = Infinity
      axes.forEach((axis, k) => {
        const dz = axis.z * direction
        if (Math.abs(dz) > 1e-6) depth = Math.min(depth, (Math.sign(dz) * support[k] - delta.dot(axis)) / dz)
      })
      const total = mobility[i] + mobility[j]
      poses[i].position.z += direction * depth * mobility[i] / total
      poses[j].position.z -= direction * depth * mobility[j] / total
      moved = true
    }
    if (!moved) break
  }
}

type Card = { id: TraceCardId; group: THREE.Group;
  body: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>;
  face: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial> }

function flightPose(source: ClosingPose, target: ClosingPose, rank: number, progress: number) {
  const group = rank < 3 ? 0 : rank < 7 ? 1 : rank < 12 ? 2 : 3
  const member = rank - GROUP_STARTS[group]
  const start = CLOSING_START + group * .025 + (GROUP_COUNTS[group] - 1 - member) * .10
  const t = smooth(start, start + .62, progress), u = 1 - t
  const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(source.quaternion)
  const p1 = source.position.clone().addScaledVector(normal, 3.2)
  const p2 = target.position.clone().lerp(source.position, .16)
  p2.y += target.position.z < 0 ? 1.35 : -.30; p2.z += 1.3
  return {
    position: source.position.clone().multiplyScalar(u * u * u)
      .addScaledVector(p1, 3 * u * u * t).addScaledVector(p2, 3 * u * t * t)
      .addScaledVector(target.position, t * t * t),
    quaternion: source.quaternion.clone().slerp(target.quaternion, smooth(.35, .95, t)),
    scale: THREE.MathUtils.lerp(1, target.scale, smooth(.05, .9, t)),
    curl: target.curl * smooth(.4, 1, t), t,
  }
}

// Anticipate each close pass instead of reacting at the instant of contact.
// Signed envelopes retain the full depth clearance and soften its entry/exit.
function flightLanes(sources: ClosingPose[], targets: ClosingPose[], ranks: number[]) {
  const samples = 160, radius = 8
  const offsets = sources.map(() => new Float64Array(samples + 1))
  for (let s = 0; s <= samples; s++) {
    const progress = THREE.MathUtils.lerp(CLOSING_START, CLOSING_SETTLED, s / samples)
    const poses = sources.map((source, i) => flightPose(source, targets[i], ranks[i], progress))
    const depths = poses.map(pose => pose.position.z)
    clearClosingFlights(poses, poses.map(pose => pose.t > 0 && pose.t < 1 ? Math.sin(Math.PI * pose.t) : 0), ranks)
    poses.forEach((pose, i) => { offsets[i][s] = pose.position.z - depths[i] })
  }
  return offsets.map(values => {
    const envelope = new Float64Array(samples + 1)
    for (let s = 1; s < samples; s++) {
      let positive = 0, negative = 0
      for (let j = Math.max(0, s - radius); j <= Math.min(samples, s + radius); j++) {
        const weight = .5 + .5 * Math.cos(Math.PI * (s - j) / radius)
        positive = Math.max(positive, values[j] * weight)
        negative = Math.min(negative, values[j] * weight)
      }
      envelope[s] = positive + negative
    }
    return envelope
  })
}

function sampleLane(values: Float64Array, progress: number) {
  const x = THREE.MathUtils.clamp((progress - CLOSING_START) / (CLOSING_SETTLED - CLOSING_START), 0, 1) * (values.length - 1)
  const i = Math.min(values.length - 2, Math.floor(x)), t = x - i
  const a = values[Math.max(0, i - 1)], b = values[i], c = values[i + 1], d = values[Math.min(values.length - 1, i + 2)]
  return b + .5 * t * (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a)))
}

/** The existing archive meshes lift into one shared space; none are replaced. */
export function createRibbonClosing(host: HTMLElement, camera: THREE.PerspectiveCamera, belt: THREE.Group, cards: Card[]) {
  const inverseBelt = new THREE.Matrix4(), inverseRotation = new THREE.Quaternion()
  const point = new THREE.Vector3()
  const eye = new THREE.Vector3(0, 0, CLOSING_CAMERA_Z), identity = new THREE.Quaternion()
  const ranks = cards.map(card => CLOSING_IDS.indexOf(card.id))
  const text = host.parentElement?.querySelectorAll('.ribbon-journey-closing-heading h2, .ribbon-journey-closing-heading p')
  let laneKey = '', lanes: Float64Array[] = []

  function update(progress: number, phase: number, width: number, height: number) {
    const amount = closingAmount(progress)
    if (amount <= 0) return { orbiting: 0 }
    belt.updateMatrixWorld(true)
    inverseBelt.copy(belt.matrixWorld).invert(); inverseRotation.copy(belt.quaternion).invert()
    camera.position.lerp(eye, smooth(CLOSING_START, CLOSING_START + .85, progress))
    camera.quaternion.slerp(identity, amount); camera.updateMatrixWorld()
    const textRects = Array.from(text ?? [], element => element.getBoundingClientRect())
    const hostRect = host.getBoundingClientRect()
    let orbiting = 0, textOverlaps = 0
    const targets = ranks.map(rank => closingOrbitPose(rank, phase, width, height))
    const sources: ClosingPose[] = cards.map(card => {
      card.group.updateMatrixWorld(true)
      return { position: card.group.getWorldPosition(new THREE.Vector3()),
        quaternion: card.group.getWorldQuaternion(new THREE.Quaternion()), scale: 1, curl: 0 }
    })
    const poses = sources.map((source, i) => flightPose(source, targets[i], ranks[i], progress))
    if (progress < CLOSING_SETTLED) {
      const key = `${width}:${height}:${phase.toFixed(5)}`
      if (laneKey !== key) { lanes = flightLanes(sources, targets, ranks); laneKey = key }
      poses.forEach((pose, i) => { pose.position.z += sampleLane(lanes[i], progress) })
    }
    orbiting = poses.filter(pose => pose.t >= 1).length
    cards.forEach((card, index) => {
      const pose = poses[index]
      card.group.position.copy(pose.position).applyMatrix4(inverseBelt)
      card.group.quaternion.copy(inverseRotation).multiply(pose.quaternion)
      card.group.scale.setScalar(pose.scale)
      card.body.morphTargetInfluences![0] = card.face.morphTargetInfluences![0] = pose.curl
      // Diagnostic only: retain a checkable text-clearance signal for QA.
      if (textRects.length && progress >= CLOSING_SETTLED) {
        card.group.updateMatrixWorld(true)
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const x of [-2.2, 2.2]) for (const y of [-1.394, 1.394]) {
          point.set(x, y, .052).applyMatrix4(card.group.matrixWorld).project(camera)
          const sx = (point.x + 1) * width / 2, sy = (1 - point.y) * height / 2
          minX = Math.min(minX, sx); maxX = Math.max(maxX, sx); minY = Math.min(minY, sy); maxY = Math.max(maxY, sy)
        }
        if (textRects.some(rect => maxX > rect.left - hostRect.left && minX < rect.right - hostRect.left
          && maxY > rect.top - hostRect.top && minY < rect.bottom - hostRect.top)) textOverlaps++
      }
    })
    host.dataset.closingPhase = phase.toFixed(5)
    host.dataset.closingSeparation = layoutSeparation.toFixed(4)
    host.dataset.closingLayout = 'layered-floating-field'
    host.dataset.closingTextOverlaps = String(textOverlaps)
    return { orbiting }
  }
  return { update, prepare: closingLayout }
}
