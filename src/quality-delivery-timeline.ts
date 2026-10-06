import * as THREE from 'three'
import type { TraceCardId } from './quality-trace-card-art'

export const DELIVERY_COUNT = 79
export const DELIVERY_SELECTED = 39
export const DELIVERY_IDS: Exclude<TraceCardId, 'C00'>[] = [
  'C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07',
  'C08', 'C09', 'C10', 'C11', 'C12', 'C15', 'C16',
]

export type Pose = {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
  scale: number
  visible: boolean
  opacity: number
  /** Continuous bend strength: zero is flat, one is the full rear-sheet curl. */
  curl: number
  /** Printed-face visibility, independent of the solid card body. */
  face: number
}
export type SurfacePose = Omit<Pose, 'scale'> & { scale: THREE.Vector3 }
export type DeliveryFrame = {
  queue: Pose[]
  hero: Pose
  records: Partial<Record<TraceCardId, Pose>>
  board: SurfacePose
  drawer: SurfacePose
  lid: SurfacePose
  cameraPosition: THREE.Vector3
  cameraLook: THREE.Vector3
  phase: 0 | 1 | 2 | 3
  group: number
  reveal: number
  /** Number of rows advanced, not radians. IDs never reorder during rotation. */
  ringTurn: number
  videoTime: number
}

const TAU = Math.PI * 2
const mix = THREE.MathUtils.lerp
const clamp = THREE.MathUtils.clamp
const gaussian = (x: number, center: number, radius: number) => Math.exp(-(((x - center) / radius) ** 2))
const vector = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z)
const rotation = (x = 0, y = 0, z = 0) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z))

/** Quintic easing gives zero first and second derivatives at every endpoint. */
export function deliveryTransition(a: number, b: number, progress: number) {
  const t = clamp((progress - a) / (b - a), 0, 1)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

export const DELIVERY_COORDINATES = (() => {
  const values = new Float64Array(DELIVERY_COUNT)
  for (let i = 1; i < DELIVERY_COUNT; i++) {
    const u = (i - .5) / (DELIVERY_COUNT - 1)
    values[i] = values[i - 1] + .61 + gaussian(u, .12, .075) * .65
      + gaussian(u, .38, .06) * .9 + gaussian(u, .55, .075) * 1.0 + gaussian(u, .88, .08) * .5
  }
  const left = values[DELIVERY_SELECTED], right = values[DELIVERY_COUNT - 1] - left
  for (let i = 0; i < DELIVERY_COUNT; i++) values[i] = i <= DELIVERY_SELECTED
    ? .5 * values[i] / left : .5 + .5 * (values[i] - left) / right
  return values
})()

function pose(position: THREE.Vector3, quaternion: THREE.Quaternion, scale = 1, face = 1, opacity = 1, curl = 0): Pose {
  return { position, quaternion, scale, visible: opacity > 0, opacity, curl, face }
}

function surface(position: THREE.Vector3, quaternion: THREE.Quaternion, scale = vector(1, 1, 1)): SurfacePose {
  return { position, quaternion, scale, visible: true, opacity: 1, curl: 0, face: 0 }
}

function blendPose(from: Pose, to: Pose, amount: number): Pose {
  if (amount <= 0 || amount >= 1) {
    const endpoint = amount <= 0 ? from : to
    return pose(endpoint.position.clone(), endpoint.quaternion.clone(), endpoint.scale, endpoint.face, endpoint.opacity, endpoint.curl)
  }
  return pose(
    from.position.clone().lerp(to.position, amount),
    from.quaternion.clone().slerp(to.quaternion, amount),
    mix(from.scale, to.scale, amount), mix(from.face, to.face, amount),
    mix(from.opacity, to.opacity, amount), mix(from.curl, to.curl, amount),
  )
}

function blendSurface(from: SurfacePose, to: SurfacePose, amount: number): SurfacePose {
  const result = surface(from.position.clone().lerp(to.position, amount), from.quaternion.clone().slerp(to.quaternion, amount), from.scale.clone().lerp(to.scale, amount))
  result.opacity = mix(from.opacity, to.opacity, amount)
  result.visible = result.opacity > 0
  return result
}

function onSurface(base: SurfacePose, x: number, y: number, scale: number, angle = 0, lift = .11): Pose {
  return pose(vector(x, y, lift).applyQuaternion(base.quaternion).add(base.position), base.quaternion.clone().multiply(rotation(0, 0, angle)), scale)
}

const GROUPS: Exclude<TraceCardId, 'C00'>[][] = [
  ['C01', 'C02', 'C03'], ['C04', 'C05', 'C06', 'C07'],
  ['C08', 'C09', 'C10', 'C11', 'C12'], ['C15', 'C16'],
]

/**
 * A reversible spatial score. Progress is its only history; time only advances
 * the slow shared queue field. Every card keeps its identity throughout.
 */
export function deliveryAt(progress: number, time: number, width: number, height: number, motion = true): DeliveryFrame {
  const p = clamp(Number.isFinite(progress) ? progress : 0, 0, 1)
  const safeWidth = Math.max(1, Number.isFinite(width) ? width : 1)
  const safeHeight = Math.max(1, Number.isFinite(height) ? height : 1)
  const mobile = safeWidth < 700, aspect = safeWidth / safeHeight
  const clock = motion && Number.isFinite(time) ? time * .20 : 0
  const strength = motion ? 1 : 0
  const span = mobile ? 22 : Math.max(30, aspect * 14.7)
  const halfHeight = Math.max(4.9, (mobile ? 7.9 : 10.1) / aspect)
  const cameraPosition = vector(0, 0, halfHeight / Math.tan(THREE.MathUtils.degToRad(18)))
  const cameraLook = vector(0, -.30, 0)
  const inspectionView = deliveryTransition(.17, .29, p) * (1 - deliveryTransition(.70, .82, p))
  cameraPosition.add(vector(mobile ? 2.4 : 3.2, mobile ? 1.2 : 2.1, mobile ? -4.5 : 4.8).multiplyScalar(inspectionView))
  cameraLook.add(vector(mobile ? -.2 : .5, -.30, -.5).multiplyScalar(inspectionView))
  if (mobile) cameraPosition.z -= 8.0 * deliveryTransition(.70, .79, p) * (1 - deliveryTransition(.85, .94, p))
  const liftQueue = 20 * deliveryTransition(.18, .29, p) * (1 - deliveryTransition(.875, .94, p))
  const openSlot = deliveryTransition(.08, .18, p) * (1 - deliveryTransition(.975, .995, p))

  function flow(u: number) {
    const d = Math.abs(u - .5), phase = d * TAU * 2.1 + clock + (u > .5 ? .35 : 0)
    const envelope = deliveryTransition(.03, .17, d) * strength
    const hinge = (u - .5) * span * (1 - deliveryTransition(.035, .16, d)) * strength
    return {
      y: Math.sin(phase) * envelope * .39 + hinge * .075 * Math.sin(clock + .25),
      z: Math.cos(phase) * envelope * .38 + hinge * .09 * Math.cos(clock + .25),
    }
  }

  function liveQueue(i: number): Pose {
    const u = DELIVERY_COORDINATES[i], phase = u * TAU, crest = gaussian(u, .5, .073), shoulder = gaussian(u, .60, .115)
    const bend = flow(u), before = flow(u - .003), after = flow(u + .003)
    // The centre's angle follows precisely the same derivatives as its neighbours.
    const roll = .24 * Math.tanh((after.y - before.y) / (.006 * span) * 2.4)
    const yaw = -.26 * Math.tanh((after.z - before.z) / (.006 * span) * 2)
    const position = vector(
      (u - .5) * span + Math.sign(i - DELIVERY_SELECTED) * openSlot * .24,
      -.15 + Math.sin(phase + .6) * .70 + crest * 1.70 + shoulder * .4
        + deliveryTransition(.72, 1, u) * .75 + bend.y + (i === DELIVERY_SELECTED ? .35 : 0),
      Math.cos(phase + .4) * .62 + Math.sin(phase * 2 - .5) * .15 + crest * .30
        + bend.z + (i === DELIVERY_SELECTED ? .38 : 0),
    )
    return pose(position, rotation(.10 + Math.sin(phase + .3) * .24 + bend.z * .10,
      -.88 + Math.sin(phase * 1.55 + .5) * .30 - crest * .30 + yaw,
      .10 + Math.sin(phase + .4) * .30 - crest * .70 + roll), .82, 0)
  }

  const queue = Array.from({ length: DELIVERY_COUNT }, (_, i) => {
    const item = liveQueue(i)
    item.position.y += liftQueue
    return item
  })
  const liveSlot = liveQueue(DELIVERY_SELECTED)
  const coreBoard = surface(vector(0, -1.3, -2.8), rotation(-.48, -.10, -.09))
  coreBoard.position.add(vector(0, 0, -2.15).applyQuaternion(coreBoard.quaternion))
  const archiveBoard = surface(vector(0, -.25, -1.6), rotation(-.32, -.08, -.115), vector(.78, .85, 1))
  const belowFrustum = -3 * halfHeight - 12
  let board = blendSurface(surface(vector(0, belowFrustum, -5.2), coreBoard.quaternion.clone()), coreBoard, deliveryTransition(.12, .22, p))
  board = blendSurface(board, archiveBoard, deliveryTransition(.70, .80, p))
  board.position.y -= 13 * deliveryTransition(.865, .94, p)
  board.position.z -= 3 * deliveryTransition(.865, .94, p)
  // The inspection is a volume of records. A receiving surface only has a job
  // once the records are being filed; it is not an extra object under the loop.
  board.opacity = deliveryTransition(.70, .765, p)
  board.visible = board.opacity > 0

  const drawerSeat = surface(vector(0, -.35, -.82).applyQuaternion(archiveBoard.quaternion).add(archiveBoard.position), archiveBoard.quaternion.clone())
  const closedDrawer = surface(vector(2.7, -5.6, -5.8), rotation(-.88, -.10, -.10), vector(.92, .92, .92))
  let drawer = blendSurface(surface(vector(0, belowFrustum, -7), archiveBoard.quaternion.clone()), drawerSeat, deliveryTransition(.805, .835, p))
  drawer = blendSurface(drawer, closedDrawer, deliveryTransition(.875, .94, p))
  drawer.position.y -= (3 * halfHeight + 10) * deliveryTransition(.94, 1, p)
  drawer.opacity = deliveryTransition(.805, .835, p)
  drawer.visible = drawer.opacity > 0
  const close = deliveryTransition(.885, .925, p)
  const lid = surface(vector(0, mix(7.5, 0, close), mix(1.14, .99, close)).applyQuaternion(drawer.quaternion).add(drawer.position), drawer.quaternion.clone(), drawer.scale.clone())
  // Keep the open lid outside the picture until its physical closing movement.
  lid.opacity = deliveryTransition(.875, .885, p)
  lid.visible = lid.opacity > 0

  const boardHero = pose(vector(mobile ? -2.0 : -4.25, mobile ? -2.15 : -1.65, 3.25), rotation(-.20, -.36, -.29), mobile ? 1.5 : 1.58, 1, 1, .1)
  const archiveHero = onSurface(archiveBoard, mobile ? -2.6 : -2.7, mobile ? -4.0 : -2.45, mobile ? 1.4 : 1.22, .018, .12)
  const pulled = blendPose(liveSlot, liveSlot, 0)
  pulled.position.z += 4.3 * deliveryTransition(.06, .16, p)
  let hero = blendPose(pulled, boardHero, deliveryTransition(.14, .25, p))
  hero = blendPose(hero, archiveHero, deliveryTransition(.70, .80, p))
  const liftedHero = pose(vector(-3.4, -.9, 4), rotation(-.09, -.12, .03), 1.38)
  hero = blendPose(hero, liftedHero, deliveryTransition(.835, .875, p))
  const returnHero = pose(liveSlot.position.clone().add(vector(0, 0, 4)), liveSlot.quaternion.clone(), liveSlot.scale)
  hero = blendPose(hero, returnHero, deliveryTransition(.89, .975, p))
  hero = blendPose(hero, liveSlot, deliveryTransition(.975, .995, p))
  if (p >= .995) hero = liveSlot
  const reveal = deliveryTransition(.235, .27, p) * (1 - deliveryTransition(.95, .978, p))
  hero.face = reveal
  hero.opacity = 1; hero.visible = true
  // The renderer can reuse exactly one mesh: this is not a second hero card.
  queue[DELIVERY_SELECTED] = hero

  const ringTurn = deliveryTransition(.37, .395, p) + deliveryTransition(.445, .47, p)
    + deliveryTransition(.535, .56, p) + deliveryTransition(.615, .64, p)
  const bandQuaternion = rotation(.06, -.58, -.43)
  const bandCenter = vector(mobile ? .4 : .7, mobile ? .15 : -.15, -.9)
  function inRibbon(index: number): Pose {
    const row = Math.floor(index / 3), lane = index % 3 - 1
    const angle = (row - ringTurn) * TAU / 5 + lane * .29 - .10
    const back = (1 - Math.cos(angle)) / 2
    const radius = 3.0 + lane * .12
    return pose(vector(lane * 4.1, radius * Math.sin(angle), radius * Math.cos(angle)).applyQuaternion(bandQuaternion).add(bandCenter),
      bandQuaternion.clone().multiply(rotation(-angle, 0, lane * -.025)), mix(1.22, .87, back), 1, 1, mix(.50, 1, back))
  }
  function archived(id: Exclude<TraceCardId, 'C00'>): Pose {
    if (id === 'C16') return onSurface(archiveBoard, mobile ? 2.6 : 3.25, mobile ? -4.0 : -2.08, mobile ? 1.4 : 1.3, -.022, .16)
    const group = GROUPS.findIndex(ids => ids.includes(id)), index = GROUPS[group].indexOf(id)
    if (mobile) return onSurface(archiveBoard, (group % 2 === 0 ? -2.6 : 2.6) + index * .045, (group < 2 ? 4.4 : .6) - index * .3, 1.35, (index - GROUPS[group].length / 2) * .009, .1 + index * .102)
    return onSurface(archiveBoard, (group - 1.5) * 4.13 + index * .065, 2.2 - index * .48, 1, (index - GROUPS[group].length / 2) * .009, .1 + index * .102)
  }
  const records: Partial<Record<TraceCardId, Pose>> = {}
  DELIVERY_IDS.forEach((id, index) => {
    const group = GROUPS.findIndex(ids => ids.includes(id)), inGroup = GROUPS[group].indexOf(id)
    const start = .28 + index * .0007, emerged = deliveryTransition(start, .312 + index * .0002, p)
    const origin = onSurface(coreBoard, (group - 1.5) * 2.6, 1.7 - inGroup * .2, .72, 0, -.17)
    origin.face = 0; origin.opacity = 0; origin.visible = false
    let record = blendPose(origin, inRibbon(index), emerged)
    record.position.z += 1.45 * 4 * emerged * (1 - emerged)
    const settled = deliveryTransition(.70 + index * .0014, .769 + index * .002, p)
    record = blendPose(record, archived(id), settled)
    // Lift clear of the receding loop, then descend in a staggered sequence.
    record.position.z += (2.2 + index % 3 * .42) * 4 * settled * (1 - settled)
    const packed = deliveryTransition(.835 + index * .00065, .877 + index * .0005, p)
    const stack = onSurface(drawer, group % 2 === 0 ? -1.65 : 1.65, (group < 2 ? .9 : -.9) - inGroup * .035, .77, 0, .10 + inGroup * .155)
    record = blendPose(record, stack, packed)
    record.position.z += .9 * 4 * packed * (1 - packed)
    // Printed records are removed only after the real lid covers every stack.
    const covered = deliveryTransition(.929, .935, p)
    record.opacity *= 1 - covered; record.visible = record.opacity > 0
    record.face *= 1 - covered
    records[id] = record
  })

  return {
    queue, hero, records, board, drawer, lid, cameraPosition, cameraLook,
    phase: p < .275 ? 0 : p < .70 ? 1 : p < .94 ? 2 : 3,
    group: ringTurn < .5 ? 0 : ringTurn < 1.5 ? 1 : ringTurn < 3.5 ? 2 : 3,
    reveal, ringTurn, videoTime: mix(0, 3.95, deliveryTransition(.27, .69, p)),
  }
}
