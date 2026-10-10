import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type ValueShape = 'distribution' | 'correspondence' | 'completion'
type Point3 = { x: number; y: number; z: number }
type Sample = Point3 & { nx: number; ny: number; nz: number }
type Surface = (u: number, v: number) => Point3

const TAU = Math.PI * 2

const pointVertexShader = /* glsl */ `
  uniform float uPointScale;
  uniform float uTwoSided;
  varying float vOpacity;
  varying float vVisible;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vec3 viewNormal = normalize(normalMatrix * normal);
    vec3 viewDirection = normalize(-viewPosition.xyz);
    float facing = dot(viewNormal, viewDirection);
    if (uTwoSided > 0.5 && facing < 0.0) viewNormal *= -1.0;
    float front = uTwoSided > 0.5 ? abs(facing) : facing;
    float light = max(0.0, dot(viewNormal, normalize(vec3(-0.45, 0.65, 1.0))));
    // Keep the sculpture's dots substantial. Only the grazing samples become
    // lighter, before their tighter projected spacing produces a dark seam.
    vOpacity = (0.87 + 0.13 * (1.0 - light))
      * mix(0.48, 1.0, smoothstep(0.0, 0.16, front));
    vVisible = step(0.0, front);
    gl_PointSize = uPointScale * (1.8 + (1.0 - light) * 1.3) * 3.8 / -viewPosition.z;
    // A point sprite has one depth across its circular footprint. Move it
    // slightly toward the camera so its own sloping surface does not clip
    // half the dot; this offset is much smaller than the sculpture's depth.
    viewPosition.z += 0.010;
    gl_Position = projectionMatrix * viewPosition;
  }
`

const pointFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vOpacity;
  varying float vVisible;

  void main() {
    if (vVisible < 0.5) discard;
    float distanceToCenter = length(gl_PointCoord - vec2(0.5));
    float edge = 1.0 - smoothstep(0.37, 0.5, distanceToCenter);
    float alpha = edge * vOpacity;
    if (alpha < 0.015) discard;
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`

function sampleSurface(surface: Surface, u: number, v: number): Sample {
  const point = surface(u, v)
  const du = surface(u + 0.0001, v)
  const dv = surface(u, v + 0.0001)
  const tangentU = new THREE.Vector3(du.x - point.x, du.y - point.y, du.z - point.z)
  const tangentV = new THREE.Vector3(dv.x - point.x, dv.y - point.y, dv.z - point.z)
  const normal = tangentU.cross(tangentV).normalize()
  return { ...point, nx: normal.x, ny: normal.y, nz: normal.z }
}

function pointsGeometry(samples: Sample[]) {
  const positions = new Float32Array(samples.length * 3)
  const normals = new Float32Array(samples.length * 3)
  samples.forEach((sample, index) => {
    positions.set([sample.x, sample.y, sample.z], index * 3)
    normals.set([sample.nx, sample.ny, sample.nz], index * 3)
  })
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  return geometry
}

function surfaceGeometry(surface: Surface, uSteps: number, vSteps: number, uMin: number, uMax: number, vMin: number, vMax: number) {
  const samples: Sample[] = []
  const indices: number[] = []
  for (let i = 0; i <= uSteps; i++) {
    for (let j = 0; j <= vSteps; j++) {
      samples.push(sampleSurface(surface, uMin + (uMax - uMin) * i / uSteps, vMin + (vMax - vMin) * j / vSteps))
      if (i < uSteps && j < vSteps) {
        const a = i * (vSteps + 1) + j
        const b = a + vSteps + 1
        indices.push(a, b, a + 1, b, b + 1, a + 1)
      }
    }
  }
  const geometry = pointsGeometry(samples)
  geometry.setIndex(indices)
  return geometry
}

// Sutherland–Hodgman clipping preserves an exact shared cut boundary between
// the sphere and its detached piece, including the far hemisphere.
function clipPolygon(polygon: Point3[], distance: (point: Point3) => number, inside: boolean) {
  if (!polygon.length) return []
  const clipped: Point3[] = []
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    const da = distance(a)
    const db = distance(b)
    const aIn = inside ? da >= 0 : da <= 0
    const bIn = inside ? db >= 0 : db <= 0
    if (aIn) clipped.push(a)
    if (aIn !== bIn) {
      const t = da / (da - db)
      clipped.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t })
    }
  }
  return clipped
}

const cutPlanes = [
  (point: Point3) => point.x - 0.22,
  (point: Point3) => point.y + 0.18,
  (point: Point3) => 0.62 - point.y,
]
const inDetachedPiece = (point: Point3) => cutPlanes.every((plane) => plane(point) >= 0)

function buildSphereSurfaces() {
  const retained: number[] = []
  const detached: number[] = []
  const addPolygon = (target: number[], polygon: Point3[]) => {
    for (let i = 1; i + 1 < polygon.length; i++) {
      for (const point of [polygon[0], polygon[i], polygon[i + 1]]) target.push(point.x, point.y, point.z)
    }
  }
  const splitTriangle = (triangle: Point3[]) => {
    let remainder = triangle
    for (const plane of cutPlanes) {
      addPolygon(retained, clipPolygon(remainder, plane, false))
      remainder = clipPolygon(remainder, plane, true)
      if (!remainder.length) break
    }
    addPolygon(detached, remainder)
  }
  const sphere = (latitude: number, longitude: number): Point3 => ({
    x: Math.sin(latitude) * Math.cos(longitude) * 0.97,
    y: Math.cos(latitude) * 0.97,
    z: Math.sin(latitude) * Math.sin(longitude) * 0.97,
  })
  for (let i = 0; i < 88; i++) {
    for (let j = 0; j < 176; j++) {
      const a = sphere(i / 88 * Math.PI, j / 176 * TAU)
      const b = sphere((i + 1) / 88 * Math.PI, j / 176 * TAU)
      const c = sphere((i + 1) / 88 * Math.PI, (j + 1) / 176 * TAU)
      const d = sphere(i / 88 * Math.PI, (j + 1) / 176 * TAU)
      splitTriangle([a, b, d])
      splitTriangle([b, c, d])
    }
  }
  const makeGeometry = (positions: number[]) => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geometry
  }
  const retainedPoints: Sample[] = []
  const detachedPoints: Sample[] = []
  for (let i = 1; i < 88; i++) {
    const latitude = i / 88 * Math.PI
    const count = Math.max(12, Math.round(176 * Math.sin(latitude)))
    for (let j = 0; j < count; j++) {
      const point = sphere(latitude, j / count * TAU)
      const sample = { ...point, nx: point.x / 0.97, ny: point.y / 0.97, nz: point.z / 0.97 }
      ;(inDetachedPiece(point) ? detachedPoints : retainedPoints).push(sample)
    }
  }
  return {
    retainedSurface: makeGeometry(retained),
    detachedSurface: makeGeometry(detached),
    retainedPoints: pointsGeometry(retainedPoints),
    detachedPoints: pointsGeometry(detachedPoints),
  }
}

export function DataValuePointCloud({ shape, paused }: { shape: ValueShape; paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pausedRef = useRef(paused)
  const playbackRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    pausedRef.current = paused
    playbackRef.current?.()
  }, [paused])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
    } catch {
      return
    }
    renderer.setClearColor(0x000000, 0)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 20)
    camera.position.z = 3.8
    const screenOrientation = new THREE.Group()
    screenOrientation.scale.y = -1
    const sculpture = new THREE.Group()
    sculpture.rotation.order = 'ZYX'
    screenOrientation.add(sculpture)
    scene.add(screenOrientation)

    const pointMaterial = new THREE.ShaderMaterial({
      vertexShader: pointVertexShader,
      fragmentShader: pointFragmentShader,
      uniforms: {
        uPointScale: { value: 1 },
        uTwoSided: { value: shape === 'correspondence' ? 1 : 0 },
        uColor: { value: new THREE.Color(shape === 'completion' ? '#f4f6f7' : '#111315') },
      },
      transparent: true,
      depthTest: true,
      depthWrite: false,
    })
    // All surfaces fill depth before any dots are drawn. Using the exact same
    // geometry for the visible sampling and the occluder prevents rear dots
    // showing through a front surface, even across gaps between front dots.
    const depthMaterial = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthTest: true,
      depthWrite: true,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    })
    const geometries: THREE.BufferGeometry[] = []
    const addSurface = (parent: THREE.Group, surface: THREE.BufferGeometry, points: THREE.BufferGeometry) => {
      const occluder = new THREE.Mesh(surface, depthMaterial)
      occluder.renderOrder = -10
      const cloud = new THREE.Points(points, pointMaterial)
      cloud.renderOrder = 10
      cloud.frustumCulled = false
      parent.add(occluder, cloud)
      geometries.push(surface, points)
    }
    const detachedGroup = new THREE.Group()
    if (shape === 'distribution') {
      const ring: Surface = (u, v) => {
        const radius = 0.83 + Math.cos(u * 3) * 0.035
        const thickness = 0.33 + Math.sin(u * 2 + 0.4) * 0.09
        return {
          x: (radius + thickness * Math.cos(v)) * Math.cos(u),
          y: (radius + thickness * Math.cos(v)) * Math.sin(u),
          z: thickness * Math.sin(v) + Math.sin(u * 2) * 0.16,
        }
      }
      const samples: Sample[] = []
      for (let i = 0; i < 138; i++) {
        for (let j = 0; j < 45; j++) samples.push(sampleSurface(ring, i / 138 * TAU, j / 45 * TAU))
      }
      addSurface(sculpture, surfaceGeometry(ring, 276, 90, 0, TAU, 0, TAU), pointsGeometry(samples))
    } else if (shape === 'correspondence') {
      for (let layer = 0; layer < 2; layer++) {
        // One smooth height field, repeated at a constant distance. This is a
        // corresponding pair with no self-intersection or artificial crease.
        const sheet: Surface = (u, v) => ({
          x: u,
          y: v,
          z: Math.sin(u * 1.85 + v * 0.5) * 0.18 + Math.cos(v * 2.1) * 0.085 + (layer - 0.5) * 0.64,
        })
        const samples: Sample[] = []
        for (let i = 0; i < 77; i++) {
          for (let j = 0; j < 58; j++) samples.push(sampleSurface(sheet, (i / 76 - 0.5) * 2.14, (j / 57 - 0.5) * 1.6))
        }
        addSurface(sculpture, surfaceGeometry(sheet, 152, 114, -1.07, 1.07, -0.8, 0.8), pointsGeometry(samples))
      }
    } else {
      const sphere = buildSphereSurfaces()
      addSurface(sculpture, sphere.retainedSurface, sphere.retainedPoints)
      addSurface(detachedGroup, sphere.detachedSurface, sphere.detachedPoints)
      sculpture.add(detachedGroup)
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reducedMotion = mediaQuery.matches
    let inView = false
    let contextLost = false
    let frameId = 0
    let previousFrame = 0
    let phase = 0
    let disposed = false

    const draw = () => {
      if (disposed || contextLost) return
      if (shape === 'distribution') {
        sculpture.rotation.set(0.82, -0.2 + Math.sin(phase * 0.42) * 0.10, -0.24, 'ZYX')
      } else if (shape === 'correspondence') {
        sculpture.rotation.set(0.70, -0.28 + Math.sin(phase * 0.35) * 0.055, -0.33, 'ZYX')
      } else {
        // Keep the cut aligned through the viewing depth; rotating the sphere
        // behind the cut would bring a real remaining edge into the opening.
        sculpture.rotation.set(0, 0, -0.12 + Math.sin(phase * 0.3) * 0.018, 'ZYX')
        sculpture.position.x = -0.12
        const distance = 0.34 + (1 + Math.sin(phase * 0.58)) * 0.035
        detachedGroup.position.set(distance, distance * 0.40, 0.12)
      }
      renderer.render(scene, camera)
    }
    const shouldAnimate = () => inView && !pausedRef.current && !reducedMotion && !document.hidden && !contextLost
    const tick = (timestamp: number) => {
      frameId = 0
      if (disposed || !shouldAnimate()) return
      if (timestamp - previousFrame >= 1000 / 24) {
        phase += previousFrame ? Math.min(0.08, (timestamp - previousFrame) / 1000) : 0
        previousFrame = timestamp
        draw()
      }
      frameId = window.requestAnimationFrame(tick)
    }
    const updatePlayback = () => {
      window.cancelAnimationFrame(frameId)
      frameId = 0
      previousFrame = 0
      if (shouldAnimate()) frameId = window.requestAnimationFrame(tick)
      else if (inView && !pausedRef.current) draw()
    }
    playbackRef.current = updatePlayback
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const width = Math.max(1, rect.width)
      const height = Math.max(1, rect.height)
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
      renderer.setPixelRatio(dpr)
      renderer.setSize(width, height, false)
      const scale = Math.min(width * 0.4, height * 0.4)
      camera.aspect = width / height
      camera.fov = 2 * Math.atan(height / (2 * scale * camera.position.z)) * 180 / Math.PI
      camera.updateProjectionMatrix()
      pointMaterial.uniforms.uPointScale.value = Math.max(0.7, width / 340) * dpr
      draw()
    }
    const onMotionPreference = () => {
      reducedMotion = mediaQuery.matches
      updatePlayback()
    }
    const onContextLost = (event: Event) => {
      event.preventDefault()
      contextLost = true
      updatePlayback()
    }
    const onContextRestored = () => {
      contextLost = false
      resize()
      updatePlayback()
    }
    const intersection = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      updatePlayback()
    }, { threshold: 0.01 })
    const resizeObserver = new ResizeObserver(resize)
    intersection.observe(canvas)
    resizeObserver.observe(canvas)
    mediaQuery.addEventListener('change', onMotionPreference)
    document.addEventListener('visibilitychange', updatePlayback)
    canvas.addEventListener('webglcontextlost', onContextLost)
    canvas.addEventListener('webglcontextrestored', onContextRestored)
    resize()

    return () => {
      disposed = true
      playbackRef.current = null
      window.cancelAnimationFrame(frameId)
      intersection.disconnect()
      resizeObserver.disconnect()
      mediaQuery.removeEventListener('change', onMotionPreference)
      document.removeEventListener('visibilitychange', updatePlayback)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      geometries.forEach((geometry) => geometry.dispose())
      pointMaterial.dispose()
      depthMaterial.dispose()
      renderer.dispose()
    }
  }, [shape])

  return <canvas className="data-value-card__canvas" ref={canvasRef} aria-hidden="true" />
}
