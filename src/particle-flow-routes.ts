import * as THREE from 'three'

export const FLOW_ROUTE_SAMPLES = 256
export type FlowRoute = { points: THREE.Vector3[]; headFraction: number; length: number; joinGap: number; tangentDot: number }

/** Exact ribbon centreline, followed by a tangent-matched exit; sampled by distance. */
export function buildFlowRoute(trail: THREE.Mesh, frameInverse: THREE.Matrix4, destination: THREE.Vector3): FlowRoute {
  const positions = trail.geometry.getAttribute('position')
  const progress = trail.geometry.getAttribute('aProgress')
  const matrix = new THREE.Matrix4().multiplyMatrices(frameInverse, trail.matrixWorld)
  const sample = (value: number) => {
    let upper = 2
    while (upper < progress.count - 2 && progress.getX(upper) < value) upper += 2
    const lower = upper - 2
    const t = THREE.MathUtils.clamp((value - progress.getX(lower)) / Math.max(.00001, progress.getX(upper) - progress.getX(lower)), 0, 1)
    return new THREE.Vector3().fromBufferAttribute(positions, lower).lerp(new THREE.Vector3().fromBufferAttribute(positions, upper), t).applyMatrix4(matrix)
  }
  const arc = Array.from({ length: 97 }, (_, index) => sample(.08 + .92 * index / 96))
  const head = arc[arc.length - 1]
  const tangent = head.clone().sub(sample(.995)).normalize()
  const distance = head.distanceTo(destination)
  const extension = new THREE.CubicBezierCurve3(
    head.clone(), head.clone().addScaledVector(tangent, distance * .32),
    destination.clone().lerp(head, .24), destination.clone(),
  )
  const exit = extension.getPoints(128)
  const path = [...arc, ...exit.slice(1)]
  const lengths = [0]
  for (let index = 1; index < path.length; index++) lengths.push(lengths[index - 1] + path[index].distanceTo(path[index - 1]))
  const length = lengths[lengths.length - 1]
  const headFraction = lengths[arc.length - 1] / length
  let cursor = 1
  const points = Array.from({ length: FLOW_ROUTE_SAMPLES }, (_, index) => {
    const distanceAlong = index / (FLOW_ROUTE_SAMPLES - 1) * length
    while (cursor < lengths.length - 1 && lengths[cursor] < distanceAlong) cursor++
    const t = (distanceAlong - lengths[cursor - 1]) / Math.max(.000001, lengths[cursor] - lengths[cursor - 1])
    return path[cursor - 1].clone().lerp(path[cursor], t)
  })
  return { points, headFraction, length, joinGap: head.distanceTo(exit[0]), tangentDot: tangent.dot(extension.getTangent(0)) }
}

export function makeFlowRouteTexture(routes: FlowRoute[]) {
  const data = new Float32Array(FLOW_ROUTE_SAMPLES * 3 * 4)
  routes.forEach((route, lane) => route.points.forEach((point, index) => {
    point.toArray(data, (lane * FLOW_ROUTE_SAMPLES + index) * 4)
    data[(lane * FLOW_ROUTE_SAMPLES + index) * 4 + 3] = 1
  }))
  const texture = new THREE.DataTexture(data, FLOW_ROUTE_SAMPLES, 3, THREE.RGBAFormat, THREE.FloatType)
  // The vertex shader interpolates adjacent texels; no float-filter extension is needed.
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.needsUpdate = true
  return texture
}
