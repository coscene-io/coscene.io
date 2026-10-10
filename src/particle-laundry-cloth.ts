import * as THREE from 'three'

export type ParticleLaundryCloth = {
  points: THREE.Points
  update: (options: { unfold: number; hanger: number; time: number }) => void
  dispose: () => void
  shoulderHalfWidth: number
  height: number
}

const SHIRT_HEIGHT = 0.39
const SHOULDER_HALF_WIDTH = 0.15
const COLLAR_X = 0.061
const COLLAR_Y = 0.029
const COLLAR_CENTRE_Y = -0.026

// Metres, neckline centred at the local origin. A broad collar and short sleeves
// preserve the silhouette when the garment is viewed at the robot's scale.
const outline: ReadonlyArray<readonly [number, number]> = [
  [-0.078, 0.007], [-0.15, -0.032], [-0.23, -0.086],
  [-0.201, -0.173], [-0.131, -0.139], [-0.138, -0.383],
  [-0.075, -0.39], [0, -0.386], [0.078, -0.39],
  [0.138, -0.383], [0.131, -0.139], [0.201, -0.173],
  [0.23, -0.086], [0.15, -0.032], [0.078, 0.007],
]

function insideOutline(x: number, y: number) {
  let inside = false
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [xi, yi] = outline[i]
    const [xj, yj] = outline[j]
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside
  }
  const collarDistance = (x / COLLAR_X) ** 2 + ((y - COLLAR_CENTRE_Y) / COLLAR_Y) ** 2
  return inside && collarDistance >= 1
}

function foldDepth(x: number, y: number) {
  const depth = THREE.MathUtils.clamp(-y / SHIRT_HEIGHT, 0, 1)
  const broad = Math.sin(x * 39 + depth * 2.6) * 0.0055 * depth
  const diagonal = Math.sin(x * 52 - depth * 7.2 + 0.8) * 0.0033 * Math.sin(depth * Math.PI)
  return broad + diagonal
}

/** One cloth surface, continuously unfolded and supported by a hanger.
 * The supplied material is shared and remains owned by the caller.
 */
export function createParticleLaundryCloth({ compact, material, random }: {
  compact: boolean
  material: THREE.ShaderMaterial
  random: () => number
}): ParticleLaundryCloth {
  const samples: Array<{ x: number; y: number; z: number; side: number; edge: boolean }> = []
  const surfaceCount = compact ? 1560 : 2760
  for (let i = 0; i < surfaceCount; i++) {
    let x: number, y: number
    do {
      x = (random() - 0.5) * 0.46
      y = 0.007 - random() * 0.397
    } while (!insideOutline(x, y))
    const side = i % 2 === 0 ? 1 : -1
    samples.push({ x, y, z: side * (0.0045 + random() * 0.0018), side, edge: false })
  }

  // Slightly denser stitching keeps the collar, sleeve openings and hem legible
  // without turning the whole fabric into an opaque luminous sheet.
  const edgeSpacing = compact ? 0.008 : 0.0057
  for (let i = 0; i < outline.length; i++) {
    const start = outline[i]
    const end = outline[(i + 1) % outline.length]
    const count = Math.ceil(Math.hypot(end[0] - start[0], end[1] - start[1]) / edgeSpacing)
    for (let step = 0; step < count; step++) {
      const t = step / count
      const side = step % 2 === 0 ? 1 : -1
      samples.push({
        x: THREE.MathUtils.lerp(start[0], end[0], t),
        y: THREE.MathUtils.lerp(start[1], end[1], t),
        z: side * 0.0045, side, edge: true,
      })
    }
  }
  const collarCount = compact ? 66 : 94
  for (let i = 0; i < collarCount; i++) {
    const angle = i / collarCount * Math.PI * 2
    samples.push({
      x: Math.cos(angle) * COLLAR_X,
      y: COLLAR_CENTRE_Y + Math.sin(angle) * COLLAR_Y,
      z: (i % 2 === 0 ? 1 : -1) * 0.0045,
      side: i % 2 === 0 ? 1 : -1, edge: true,
    })
  }

  const count = samples.length
  const position = new Float32Array(count * 3)
  const gathered = new Float32Array(count * 3)
  const unfolded = new Float32Array(count * 3)
  const supported = new Float32Array(count * 3)
  const normals = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const strengths = new Float32Array(count)
  const movementWeights = new Float32Array(count)
  const orange = new THREE.Color('#ff914b')

  for (let i = 0; i < count; i++) {
    const { x, y, z, side, edge } = samples[i]
    const offset = i * 3
    const depth = THREE.MathUtils.clamp(-y / SHIRT_HEIGHT, 0, 1)
    const bell = Math.sin(depth * Math.PI)
    const fold = foldDepth(x, y)
    unfolded[offset] = x
    unfolded[offset + 1] = y
    unfolded[offset + 2] = z + fold

    // Accordion folds retain the topology and point identity inside a compact,
    // downward-hanging bundle. Unfolding opens those folds rather than replacing it.
    gathered[offset] = x * 0.25 + Math.sin(depth * 13.8) * 0.024 * (0.2 + bell * 0.8)
    gathered[offset + 1] = y * 0.39 + Math.sin(x * 30 + depth * 6.3) * 0.006 * bell
    gathered[offset + 2] = z + Math.sin(x * 31 + depth * 14) * 0.052 * Math.sin(Math.PI * Math.min(0.95, depth + 0.08))

    const belowShoulders = THREE.MathUtils.smoothstep(-y, 0.04, 0.15)
    const sleeve = THREE.MathUtils.smoothstep(Math.abs(x), 0.13, 0.23)
    const collarAnchor = 1 - THREE.MathUtils.smoothstep(-y, 0.055, 0.12)
    supported[offset] = x * (1 - 0.024 * belowShoulders)
    supported[offset + 1] = y - 0.016 * sleeve * (1 - collarAnchor) - 0.004 * depth * depth
    supported[offset + 2] = z + fold * 1.45 + Math.sin(x * 25 + 0.45) * 0.004 * belowShoulders
    movementWeights[i] = THREE.MathUtils.smoothstep(depth, 0.32, 1) ** 2

    const epsilon = 0.0005
    const dzdx = (foldDepth(x + epsilon, y) - foldDepth(x - epsilon, y)) / (epsilon * 2)
    const dzdy = (foldDepth(x, y + epsilon) - foldDepth(x, y - epsilon)) / (epsilon * 2)
    const normalLength = Math.hypot(dzdx, dzdy, 1)
    normals[offset] = -dzdx * side / normalLength
    normals[offset + 1] = -dzdy * side / normalLength
    normals[offset + 2] = side / normalLength
    const brightness = (edge ? 1.15 : 0.96) + random() * 0.22
    colors[offset] = orange.r * brightness
    colors[offset + 1] = orange.g * brightness
    colors[offset + 2] = orange.b * brightness
    seeds[i] = random()
    strengths[i] = (edge ? 1.0 : 0.90) * (0.88 + random() * 0.12)
  }

  const geometry = new THREE.BufferGeometry()
  const positionAttribute = new THREE.BufferAttribute(position, 3)
  positionAttribute.setUsage(THREE.DynamicDrawUsage)
  geometry.setAttribute('position', positionAttribute)
  geometry.setAttribute('aNormal', new THREE.BufferAttribute(normals, 3))
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geometry.setAttribute('aStrength', new THREE.BufferAttribute(strengths, 1))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(count).fill(1.40), 1))
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -0.19, 0), 0.32)
  const points = new THREE.Points(geometry, material)
  points.name = 'particle-laundry-shirt'
  points.frustumCulled = false

  function update({ unfold, hanger, time }: { unfold: number; hanger: number; time: number }) {
    const open = THREE.MathUtils.smoothstep(unfold, 0, 1)
    const support = THREE.MathUtils.smoothstep(hanger, 0, 1)
    for (let i = 0; i < count; i++) {
      const offset = i * 3
      for (let axis = 0; axis < 3; axis++) {
        const target = THREE.MathUtils.lerp(unfolded[offset + axis], supported[offset + axis], support)
        position[offset + axis] = THREE.MathUtils.lerp(gathered[offset + axis], target, open)
      }
      // Only the lower hem breathes; neckline and shoulder grasp anchors stay still.
      position[offset + 2] += Math.sin(time * 1.7 + unfolded[offset] * 10) * 0.0008 * movementWeights[i] * open
    }
    positionAttribute.needsUpdate = true
  }

  update({ unfold: 0, hanger: 0, time: 0 })
  return {
    points, update,
    dispose: () => geometry.dispose(),
    shoulderHalfWidth: SHOULDER_HALF_WIDTH,
    height: SHIRT_HEIGHT,
  }
}
