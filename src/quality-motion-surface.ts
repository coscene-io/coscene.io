import * as THREE from 'three'

type Point2 = { x: number; y: number }

const CORNER_SEGMENTS = 6
const EDGE_SEGMENTS = 6
const SURFACE_RINGS = 12
const BEVEL_SEGMENTS = 4
const FACE_EDGE_Z = .024
const FACE_CROWN_Z = .022
const WALL_Z = .012

function roundedOutline(width: number, height: number, radius: number): Point2[] {
  const halfW = width / 2, halfH = height / 2
  const centers = [
    { x: halfW - radius, y: halfH - radius },
    { x: -halfW + radius, y: halfH - radius },
    { x: -halfW + radius, y: -halfH + radius },
    { x: halfW - radius, y: -halfH + radius },
  ]
  const result: Point2[] = []
  for (let corner = 0; corner < 4; corner++) {
    const center = centers[corner], next = centers[(corner + 1) % 4]
    const start = corner * Math.PI / 2, end = start + Math.PI / 2
    for (let segment = 0; segment < CORNER_SEGMENTS; segment++) {
      const angle = start + segment / CORNER_SEGMENTS * Math.PI / 2
      result.push({ x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius })
    }
    const from = { x: center.x + Math.cos(end) * radius, y: center.y + Math.sin(end) * radius }
    const to = { x: next.x + Math.cos(end) * radius, y: next.y + Math.sin(end) * radius }
    for (let segment = 0; segment < EDGE_SEGMENTS; segment++) {
      const t = segment / EDGE_SEGMENTS
      result.push({ x: THREE.MathUtils.lerp(from.x, to.x, t), y: THREE.MathUtils.lerp(from.y, to.y, t) })
    }
  }
  return result
}

// UV islands duplicate seam vertices. Accumulate triangle areas by position so
// those duplicates keep the same smooth normal across the face, bevel and wall.
function setSeamlessNormals(geometry: THREE.BufferGeometry) {
  const position = geometry.getAttribute('position'), index = geometry.getIndex()!
  const sums = new Map<string, THREE.Vector3>()
  const keys = Array.from({ length: position.count }, (_, i) =>
    `${Math.round(position.getX(i) * 1e8)},${Math.round(position.getY(i) * 1e8)},${Math.round(position.getZ(i) * 1e8)}`)
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), normal = new THREE.Vector3()
  for (let i = 0; i < index.count; i += 3) {
    const ia = index.getX(i), ib = index.getX(i + 1), ic = index.getX(i + 2)
    a.fromBufferAttribute(position, ia); b.fromBufferAttribute(position, ib); c.fromBufferAttribute(position, ic)
    normal.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a))
    for (const vertex of [ia, ib, ic]) {
      const key = keys[vertex]
      if (!sums.has(key)) sums.set(key, new THREE.Vector3())
      sums.get(key)!.add(normal)
    }
  }
  for (const sum of sums.values()) sum.normalize()
  const normals = new Float32Array(position.count * 3)
  for (let i = 0; i < position.count; i++) sums.get(keys[i])!.toArray(normals, i * 3)
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
}

/**
 * A closed, gently crowned card with a matching front print surface.
 * Body bounds are width × height × .092. Place front print at z +.0006;
 * rotate the same face by PI around Y and place at z -.0006 for its reverse.
 * Both print offsets remain inside an overall depth of .094.
 */
export function createQualityCardGeometry(width = 1.92, height = 2.56): { body: THREE.BufferGeometry; face: THREE.BufferGeometry } {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new RangeError('Card width and height must be finite positive numbers.')
  }
  const minDimension = Math.min(width, height)
  const bevelXY = Math.min(.025, minDimension * .06)
  const radius = Math.min(.14, minDimension * .2)
  const innerW = width - bevelXY * 2, innerH = height - bevelXY * 2
  const innerRadius = radius - bevelXY
  const outline = roundedOutline(innerW, innerH, innerRadius)
  const count = outline.length
  const domeZ = (x: number, y: number) => FACE_EDGE_Z + FACE_CROWN_Z
    * Math.max(0, 1 - (x / (innerW / 2)) ** 2)
    * Math.max(0, 1 - (y / (innerH / 2)) ** 2)

  const frontPositions = [0, 0, FACE_EDGE_Z + FACE_CROWN_Z]
  const frontUvs = [.5, .5]
  const frontIndices: number[] = []
  for (let ring = 1; ring <= SURFACE_RINGS; ring++) {
    const scale = ring / SURFACE_RINGS
    for (const p of outline) {
      const x = p.x * scale, y = p.y * scale
      frontPositions.push(x, y, domeZ(x, y))
      frontUvs.push(x / width + .5, y / height + .5)
    }
    for (let i = 0; i < count; i++) {
      const next = (i + 1) % count, outer = 1 + (ring - 1) * count
      if (ring === 1) frontIndices.push(0, outer + i, outer + next)
      else {
        const inner = outer - count
        frontIndices.push(inner + i, outer + i, outer + next, inner + i, outer + next, inner + next)
      }
    }
  }

  const positions = [...frontPositions], uvs = [...frontUvs], indices = [...frontIndices]
  const frontVertexCount = frontPositions.length / 3
  // Rotate the complete front mesh by PI around Y, exactly like the reverse
  // print mesh. Reflecting only Z would change each quad's diagonal under the
  // print rotation and let its interpolation cross the body between vertices.
  for (let i = 0; i < frontVertexCount; i++) {
    positions.push(-frontPositions[i * 3], frontPositions[i * 3 + 1], -frontPositions[i * 3 + 2])
    uvs.push(frontUvs[i * 2], frontUvs[i * 2 + 1])
  }
  for (let i = 0; i < frontIndices.length; i += 3) {
    indices.push(frontVertexCount + frontIndices[i], frontVertexCount + frontIndices[i + 1], frontVertexCount + frontIndices[i + 2])
  }

  const outerOutline = roundedOutline(width, height, radius)
  const perimeter = [0]
  for (let i = 0; i < count; i++) {
    const a = outerOutline[i], b = outerOutline[(i + 1) % count]
    perimeter.push(perimeter[i] + Math.hypot(b.x - a.x, b.y - a.y))
  }
  const bandStart = positions.length / 3
  const bandRingSize = count + 1
  const profile: { angle: number; side: number }[] = []
  for (let i = 0; i <= BEVEL_SEGMENTS; i++) profile.push({ angle: i / BEVEL_SEGMENTS * Math.PI / 2, side: 1 })
  for (let i = BEVEL_SEGMENTS; i >= 0; i--) profile.push({ angle: i / BEVEL_SEGMENTS * Math.PI / 2, side: -1 })
  for (let ring = 0; ring < profile.length; ring++) {
    const { angle, side } = profile[ring]
    const insetOffset = bevelXY * Math.sin(angle)
    const bandOutline = roundedOutline(innerW + insetOffset * 2, innerH + insetOffset * 2, innerRadius + insetOffset)
    for (let i = 0; i <= count; i++) {
      const p = bandOutline[i % count], inner = outline[i % count]
      const z = side * (WALL_Z + (domeZ(inner.x, inner.y) - WALL_Z) * Math.cos(angle))
      positions.push(p.x, p.y, z)
      uvs.push(perimeter[i] / perimeter[count], ring / (profile.length - 1))
      if (ring < profile.length - 1 && i < count) {
        const a = bandStart + ring * bandRingSize + i, b = a + bandRingSize
        indices.push(a, b, b + 1, a, b + 1, a + 1)
      }
    }
  }

  const body = new THREE.BufferGeometry()
  body.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  body.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  body.setIndex(indices)
  setSeamlessNormals(body)
  body.computeTangents(); body.computeBoundingBox(); body.computeBoundingSphere()

  const face = new THREE.BufferGeometry()
  face.setAttribute('position', new THREE.Float32BufferAttribute(frontPositions, 3))
  face.setAttribute('uv', new THREE.Float32BufferAttribute(frontUvs, 2))
  face.setAttribute('normal', new THREE.Float32BufferAttribute(Array.from(body.getAttribute('normal').array.slice(0, frontPositions.length)), 3))
  face.setIndex(frontIndices)
  face.computeTangents(); face.computeBoundingBox(); face.computeBoundingSphere()
  return { body, face }
}
