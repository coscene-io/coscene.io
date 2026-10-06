import * as THREE from 'three'
import { GATHER_START, GROUPS_ALIGNED, GATHER_SETTLED } from './quality-ribbon-story'

const smooth = (start: number, end: number, progress: number) => {
  const t = THREE.MathUtils.clamp((progress - start) / (end - start), 0, 1)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/** A shared layer order is established before any two groups overlap. */
export function gatheredPosition(out: THREE.Vector3, original: THREE.Vector3,
  front: THREE.Vector3, group: number, member: number, count: number,
  rank: number, progress: number) {
  const alignStart = GATHER_START + group * .020 + member * .016
  const align = smooth(alignStart, alignStart + .23, progress)
  const back = count - 1 - member
  out.set(front.x - .025 * back, front.y + .055 * back, .10 + .108 * rank)
  out.lerpVectors(original, out, align)
  const groupLift = smooth(GATHER_START + group * .020, GATHER_START + group * .020 + .30, progress)
  out.z = THREE.MathUtils.lerp(original.z, .10 + .108 * rank, groupLift)
  const mergeStart = GROUPS_ALIGNED + group * .115
  const merge = smooth(mergeStart, mergeStart + .395, progress)
  // Four almost aligned signatures make a compact deck. Linear per-card
  // offsets would turn the silhouette into a staircase at the oblique lens.
  const [x, y] = [[-.045, .018], [.030, -.016], [-.018, .026], [.012, -.008]][group]
  const finalX = x - .003 * back, finalY = y + .002 * back
  out.x = THREE.MathUtils.lerp(out.x, finalX, merge)
  out.y = THREE.MathUtils.lerp(out.y, finalY, merge)
  // Centers and physical thickness share exactly the same scale, preserving
  // clearance while the complete deck becomes a slim, tangible object.
  out.z *= gatherDepth(progress)
  return out
}

export const gatherPresentation = (progress: number) => smooth(GROUPS_ALIGNED + .18, GATHER_SETTLED, progress)
export const gatherDepth = (progress: number) => THREE.MathUtils.lerp(1, .34, gatherPresentation(progress))
export const gatheredAngle = (group: number, member: number, count: number, progress: number) =>
  ([-.022, .017, -.012, .009][group] + (count - 1 - member) * .0015) * gatherGroupMerge(group, progress)
export const gatherAlignment = (progress: number) => smooth(GATHER_START, GROUPS_ALIGNED, progress)
export const gatherMerge = (progress: number) => smooth(GROUPS_ALIGNED, GATHER_SETTLED, progress)
export const gatherGroupMerge = (group: number, progress: number) =>
  smooth(GROUPS_ALIGNED + group * .115, GROUPS_ALIGNED + group * .115 + .395, progress)
