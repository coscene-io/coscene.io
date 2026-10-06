import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

type PresentationTier = 'standard' | 'large' | 'ultra'

const presentationProfiles = {
  standard: {
    arrivalCountScale: 1,
    arrivalPointScale: 1,
    globeCount: 13000,
    globePointScale: 1,
    pixelRatioCap: 1.55,
    pulseCoreWidth: 1.2,
    pulseHazeWidth: 4.5,
    pulseTailLength: 0.36,
    streamCount: 4000,
    streamPointScale: 1,
  },
  large: {
    arrivalCountScale: 1.35,
    arrivalPointScale: 1.22,
    globeCount: 18000,
    globePointScale: 1.18,
    pixelRatioCap: 1.65,
    pulseCoreWidth: 2.1,
    pulseHazeWidth: 7.5,
    pulseTailLength: 0.4,
    streamCount: 5400,
    streamPointScale: 1.26,
  },
  ultra: {
    arrivalCountScale: 1.55,
    arrivalPointScale: 1.34,
    globeCount: 24000,
    globePointScale: 1.32,
    pixelRatioCap: 1.65,
    pulseCoreWidth: 2.6,
    pulseHazeWidth: 8.5,
    pulseTailLength: 0.42,
    streamCount: 6200,
    streamPointScale: 1.42,
  },
} as const

function getPresentationTier(width: number, height: number): PresentationTier {
  if (width >= 2400 && height >= 1200) return 'ultra'
  if (width >= 1800 && height >= 1000) return 'large'
  return 'standard'
}

class OrbitCurve extends THREE.Curve<THREE.Vector3> {
  radius: number

  constructor(radius: number) {
    super()
    this.radius = radius
  }

  getPoint(progress: number, target = new THREE.Vector3()) {
    const angle = progress * Math.PI * 2
    return target.set(Math.cos(angle) * this.radius, Math.sin(angle) * this.radius, 0)
  }
}

type GlobeMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uAttachmentProgress: { value: number }
    uAttachmentStrength: { value: number }
    uConvergence: { value: number }
    uEnergy: { value: number }
    uFocusDirection: { value: THREE.Vector3 }
    uFocusStrength: { value: number }
    uIntroWaveColors: { value: THREE.Color[] }
    uIntroWaveDirections: { value: THREE.Vector3[] }
    uIntroWaveTangents: { value: THREE.Vector3[] }
    uIntroWaveProgress: { value: number }
    uIntroWaveStrength: { value: number }
    uPixelRatio: { value: number }
    uPointScale: { value: number }
    uPulseDirection: { value: THREE.Vector3 }
    uPulseProgress: { value: number }
    uPulseStrength: { value: number }
    uReveal: { value: number }
    uTime: { value: number }
  }
}

type StreamMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uEnergy: { value: number }
    uPhaseOffset: { value: number }
    uPixelRatio: { value: number }
    uPointScale: { value: number }
    uPrototype: { value: number }
    uRadius: { value: number }
    uReveal: { value: number }
    uSpeed: { value: number }
    uTime: { value: number }
    uTint: { value: THREE.Color }
  }
}

type ArrivalMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uApproachDuration: { value: number }
    uCharacter: { value: number }
    uCoherentSurface: { value: number }
    uContactAngle: { value: number }
    uContactOverride: { value: number }
    uContactPoint: { value: THREE.Vector3 }
    uContactTangent: { value: THREE.Vector3 }
    uDirection: { value: number }
    uEmergePoint: { value: THREE.Vector3 }
    uGlobeToOrbit: { value: THREE.Matrix4 }
    uGlobeRadius: { value: number }
    uHidePoint: { value: THREE.Vector3 }
    uPixelRatio: { value: number }
    uPointScale: { value: number }
    uProgress: { value: number }
    uRadius: { value: number }
    uSourceDepth: { value: THREE.Vector3 }
    uSourcePosition: { value: THREE.Vector3 }
    uSourceTangent: { value: THREE.Vector3 }
    uSpread: { value: number }
    uStrength: { value: number }
    uSurfaceMode: { value: number }
    uTime: { value: number }
    uTint: { value: THREE.Color }
  }
}

type ReplayMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uBackPoint: { value: THREE.Vector3 }
    uCharacter: { value: number }
    uContactPoint: { value: THREE.Vector3 }
    uContactTangent: { value: THREE.Vector3 }
    uGlobeRadius: { value: number }
    uPixelRatio: { value: number }
    uPointScale: { value: number }
    uProgress: { value: number }
    uSourceDepth: { value: THREE.Vector3 }
    uSourcePosition: { value: THREE.Vector3 }
    uSourceTangent: { value: THREE.Vector3 }
    uSpread: { value: number }
    uStrength: { value: number }
    uTime: { value: number }
    uTint: { value: THREE.Color }
  }
}

type PulseTrail = {
  geometry: THREE.BufferGeometry
  material: PulseTrailMaterial
  mesh: THREE.Mesh<THREE.BufferGeometry, PulseTrailMaterial>
  speed: number
}

type PulseTrailMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uCoreOpacity: { value: number }
    uCoreWidth: { value: number }
    uHazeOpacity: { value: number }
    uHazeWidth: { value: number }
    uOpacity: { value: number }
    uResolution: { value: THREE.Vector2 }
  }
}

type OrbitState = {
  arrivalMaterial: ArrivalMaterial
  baseQuaternion: THREE.Quaternion
  contactAngle: number
  energy: number
  group: THREE.Group
  index: number
  lift: number
  lineMaterial: THREE.LineBasicMaterial
  precessionPhase: number
  precessionSpeed: number
  pulseTrail: PulseTrail
  replayMaterial: ReplayMaterial
  streamMaterial: StreamMaterial
  targetEnergy: number
  targetLift: number
}

type Diagnostics = {
  averageLuma: number
  fps: number
  hovered: number
  motionDelta: number
  nonDarkRatio: number
  rendered: boolean
  ringLifts: number[]
}

function requireElement<ElementType extends Element>(scope: ParentNode, selector: string) {
  const element = scope.querySelector<ElementType>(selector)
  if (!element) throw new Error(`Intelligence study element is missing: ${selector}`)
  return element
}

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5)
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function smoothStep(edgeStart: number, edgeEnd: number, value: number) {
  const progress = THREE.MathUtils.clamp((value - edgeStart) / (edgeEnd - edgeStart), 0, 1)
  return progress * progress * (3 - 2 * progress)
}

function createSymmetricQuaternion(azimuth: number, polarAngle: number) {
  const normal = new THREE.Vector3(
    Math.sin(polarAngle) * Math.cos(azimuth),
    Math.sin(polarAngle) * Math.sin(azimuth),
    Math.cos(polarAngle),
  )
  return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
}

export function mountIntelligenceOrbit(root: HTMLElement) {
const eventController = new AbortController()
const eventOptions = { signal: eventController.signal }
const canvas = requireElement<HTMLCanvasElement>(root, '#intelligence-canvas')
const intelligenceLabel = requireElement<HTMLElement>(root, '.intelligence-label')
const orbitLabels = Array.from(root.querySelectorAll<HTMLElement>('[data-orbit-label]'))
const portraitViewport = window.innerHeight > window.innerWidth
const compact = portraitViewport && window.innerWidth <= 700
const tablet = portraitViewport && window.innerWidth > 700 && window.innerWidth <= 900
const wideDesktop = window.innerWidth >= 1280
const shortViewport = window.innerHeight <= 760
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const presentationTier = getPresentationTier(window.innerWidth, window.innerHeight)
const presentationProfile = presentationProfiles[presentationTier]
root.dataset.presentationTier = presentationTier

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x020305)
scene.fog = new THREE.FogExp2(0x020305, compact ? 0.021 : 0.016)

const camera = new THREE.PerspectiveCamera(compact ? 40 : 34, 1, 0.1, 60)
camera.position.set(0, compact ? 0.15 : 0.25, compact ? 13.6 : 12.8)
camera.lookAt(0, compact ? -0.75 : -0.25, 0)

const renderer = new THREE.WebGLRenderer({
  alpha: false,
  antialias: true,
  canvas,
  powerPreference: 'high-performance',
})
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.08
renderer.setClearColor(0x020305, 1)

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), compact ? 0.31 : 0.4, 0.66, 0.76)
composer.addPass(bloomPass)

const random = mulberry32(260816)
const rig = new THREE.Group()
if (compact) {
  rig.position.set(0, -1.28, 0)
  rig.scale.setScalar(0.82)
} else if (tablet) {
  rig.position.set(0, -1.28, 0)
  rig.scale.setScalar(0.94)
} else {
  rig.position.set(wideDesktop ? 2.72 : 2.55, shortViewport ? -0.22 : -0.12, 0)
  rig.scale.setScalar(wideDesktop ? (shortViewport ? 1.92 : 2.02) : shortViewport ? 1.72 : 1.84)
}
const baseRigPosition = rig.position.clone()
let baseRigScale = rig.scale.x
let baseCameraFov = camera.fov
rig.rotation.set(-0.08, 0.12, -0.035)
scene.add(rig)

const backgroundGeometry = new THREE.BufferGeometry()
const backgroundCount = compact ? 520 : 1050
const backgroundPositions = new Float32Array(backgroundCount * 3)
const backgroundColors = new Float32Array(backgroundCount * 3)
const backgroundScales = new Float32Array(backgroundCount)
const backgroundGlow = new Float32Array(backgroundCount)
const backgroundCyan = new THREE.Color(0x7daeb4)
const backgroundSilver = new THREE.Color(0xc8d0d2)
for (let index = 0; index < backgroundCount; index += 1) {
  const radius = 6 + random() * 8
  const theta = random() * Math.PI * 2
  const phi = Math.acos(2 * random() - 1)
  const offset = index * 3
  backgroundPositions[offset] = Math.sin(phi) * Math.cos(theta) * radius
  backgroundPositions[offset + 1] = Math.cos(phi) * radius
  backgroundPositions[offset + 2] = Math.sin(phi) * Math.sin(theta) * radius - 2
  const cyanMix = random() < 0.24 ? 0.18 + random() * 0.28 : random() * 0.08
  const color = backgroundSilver.clone().lerp(backgroundCyan, cyanMix)
  backgroundColors[offset] = color.r
  backgroundColors[offset + 1] = color.g
  backgroundColors[offset + 2] = color.b
  backgroundScales[index] = 0.62 + random() ** 2 * 0.92
  backgroundGlow[index] = 0.42 + random() * 0.58
}
backgroundGeometry.setAttribute('position', new THREE.BufferAttribute(backgroundPositions, 3))
backgroundGeometry.setAttribute('color', new THREE.BufferAttribute(backgroundColors, 3))
backgroundGeometry.setAttribute('aScale', new THREE.BufferAttribute(backgroundScales, 1))
backgroundGeometry.setAttribute('aGlow', new THREE.BufferAttribute(backgroundGlow, 1))
const backgroundMaterial = new THREE.ShaderMaterial({
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true,
  toneMapped: false,
  uniforms: {
    uOpacity: { value: compact ? 0.105 : 0.12 },
    uPixelRatio: {
      value: Math.min(window.devicePixelRatio, compact ? 1.25 : presentationProfile.pixelRatioCap),
    },
  },
  vertexShader: /* glsl */ `
    attribute float aScale;
    attribute float aGlow;

    varying vec3 vColor;
    varying float vAlpha;

    uniform float uPixelRatio;

    void main() {
      vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
      float perspective = 10.0 / max(4.0, -viewPosition.z);

      vColor = color;
      vAlpha = aGlow;
      gl_PointSize = clamp(
        aScale * uPixelRatio * perspective,
        0.42 * uPixelRatio,
        1.55 * uPixelRatio
      );
      gl_Position = projectionMatrix * viewPosition;
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vColor;
    varying float vAlpha;

    uniform float uOpacity;

    void main() {
      float distanceToCenter = length(gl_PointCoord - 0.5);
      if (distanceToCenter > 0.5) discard;

      float halo = 1.0 - smoothstep(0.12, 0.5, distanceToCenter);
      float core = 1.0 - smoothstep(0.0, 0.16, distanceToCenter);
      float alpha = (halo * 0.46 + core * 0.54) * vAlpha * uOpacity;

      gl_FragColor = vec4(vColor * (0.72 + core * 0.48), alpha);
    }
  `,
  vertexColors: true,
})
const backgroundStars = new THREE.Points(backgroundGeometry, backgroundMaterial)
scene.add(backgroundStars)

const globeGroup = new THREE.Group()
rig.add(globeGroup)

const globeRadius = 1.55
const coreGeometry = new THREE.SphereGeometry(globeRadius, 80, 56)
const coreMaterial = new THREE.MeshBasicMaterial({
  color: 0x020709,
  depthWrite: reducedMotion,
  opacity: reducedMotion ? 1 : 0,
  transparent: !reducedMotion,
})
const core = new THREE.Mesh(coreGeometry, coreMaterial)
core.renderOrder = 1
globeGroup.add(core)

const wireGeometry = new THREE.IcosahedronGeometry(globeRadius * 1.015, 5)
const wireMaterial = new THREE.MeshBasicMaterial({
  blending: THREE.AdditiveBlending,
  color: 0x5d9298,
  depthWrite: false,
  opacity: 0.012,
  transparent: true,
  wireframe: true,
})
const wire = new THREE.Mesh(wireGeometry, wireMaterial)
wire.renderOrder = 2
globeGroup.add(wire)

const globeVertexShader = `
  attribute float aPhase;
  attribute float aScale;
  uniform float uAttachmentProgress;
  uniform float uAttachmentStrength;
  uniform float uConvergence;
  uniform float uEnergy;
  uniform vec3 uFocusDirection;
  uniform float uFocusStrength;
  uniform vec3 uIntroWaveColors[3];
  uniform vec3 uIntroWaveDirections[3];
  uniform vec3 uIntroWaveTangents[3];
  uniform float uIntroWaveProgress;
  uniform float uIntroWaveStrength;
  uniform float uPixelRatio;
  uniform float uPointScale;
  uniform vec3 uPulseDirection;
  uniform float uPulseProgress;
  uniform float uPulseStrength;
  uniform float uReveal;
  uniform float uTime;
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    float wave = sin(aPhase + uTime * 0.52) * 0.012;
    wave += sin(position.y * 8.0 - uTime * 0.28) * 0.006;
    float revealSeed = fract(aPhase / 6.28318530718);
    float releaseStart = 0.06 + revealSeed * 0.16;
    float releaseEnd = 0.48 + revealSeed * 0.2;
    float revealRaw = clamp((uReveal - releaseStart) / max(0.001, releaseEnd - releaseStart), 0.0, 1.0);
    float reveal = revealRaw * revealRaw * (3.0 - 2.0 * revealRaw);
    vec3 spherePosition = normalize(position) * (length(position) + wave);
    vec3 displaced = spherePosition * mix(0.965, 1.0, reveal);
    float pulseDistance = acos(clamp(dot(normalize(position), normalize(uPulseDirection)), -1.0, 1.0)) / 3.14159265359;
    float pulseBand = exp(-pow((pulseDistance - uPulseProgress) * 15.0, 2.0)) * uPulseStrength;
    float focusDistance = acos(clamp(dot(normalize(position), normalize(uFocusDirection)), -1.0, 1.0)) / 3.14159265359;
    float focusGlow = exp(-pow(focusDistance * 4.2, 2.0)) * uFocusStrength;
    float introWave = 0.0;
    float nearestIntroDistance = 1.0;
    vec3 introWaveColor = vec3(0.0);
    vec3 localDirection = normalize(position);
    float waveViewFacing = max(0.0, normalize(normalMatrix * localDirection).z);
    for (int waveIndex = 0; waveIndex < 3; waveIndex++) {
      vec3 waveDirection = normalize(uIntroWaveDirections[waveIndex]);
      float introDistance = acos(clamp(dot(localDirection, waveDirection), -1.0, 1.0)) / 3.14159265359;
      float waveCoherence = 1.0;
      if (waveIndex == 1) {
        vec3 tangentProjection = localDirection - waveDirection * dot(localDirection, waveDirection);
        float projectionLength = length(tangentProjection);
        float forwardAlignment = projectionLength > 0.0001
          ? dot(tangentProjection / projectionLength, normalize(uIntroWaveTangents[waveIndex]))
          : 1.0;
        float forwardMask = smoothstep(-0.16, 0.3, forwardAlignment);
        float frontMask = smoothstep(0.015, 0.24, waveViewFacing);
        waveCoherence = forwardMask * frontMask;
        introDistance += (1.0 - waveCoherence) * 0.82;
      }
      nearestIntroDistance = min(nearestIntroDistance, introDistance);
      float introBand = exp(-pow((introDistance - uIntroWaveProgress) * 18.0, 2.0)) * uIntroWaveStrength * waveCoherence;
      introWave += introBand;
      introWaveColor += uIntroWaveColors[waveIndex] * introBand;
    }
    introWaveColor /= max(0.001, introWave);
    vec4 viewPosition = modelViewMatrix * vec4(displaced, 1.0);
    float energy = 1.0 + uEnergy * 0.18 + uConvergence * 0.16;
    float introScale = mix(1.18, 1.0, reveal);
    gl_PointSize = aScale * introScale * energy * (1.0 + pulseBand * 0.72 + focusGlow * 0.16 + introWave * 0.42) * uPixelRatio * uPointScale * (30.0 / max(1.0, -viewPosition.z));
    gl_Position = projectionMatrix * viewPosition;
    vColor = mix(color, vec3(0.76, 0.92, 1.0), focusGlow * 0.58);
    vColor = mix(vColor, vec3(1.0, 0.7, 0.38), pulseBand * 0.72);
    vColor = mix(vColor, introWaveColor, min(0.76, introWave * 0.58));
    vColor = mix(vColor, vec3(0.9, 0.96, 1.0), uConvergence * 0.24);
    float viewFacing = max(0.0, normalize(normalMatrix * normalize(displaced)).z);
    float directionalReveal = smoothstep(-1.45, 1.05, position.x + position.y * 0.16);
    vAlpha = (0.4 + 0.56 * pow(viewFacing, 0.4));
    vAlpha *= (0.62 + 0.26 * sin(aPhase * 0.7 + uTime * 0.4));
    vAlpha *= mix(0.42, 1.0, directionalReveal);
    float introVisibility = smoothstep(0.08, 0.34, uReveal);
    float attachmentReveal = (1.0 - smoothstep(uAttachmentProgress - 0.015, uAttachmentProgress + 0.055, nearestIntroDistance)) * uAttachmentStrength;
    float formed = max(reveal, attachmentReveal);
    float formedVisibility = max(introVisibility, attachmentReveal);
    vAlpha *= mix(0.04, 1.0, formed) * formedVisibility * (1.0 + pulseBand * 0.64 + focusGlow * 0.34 + introWave * 0.5 + uConvergence * 0.18);
  }
`

const globeFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    float distanceToCenter = length(gl_PointCoord - 0.5);
    if (distanceToCenter > 0.5) discard;
    float edge = 1.0 - smoothstep(0.18, 0.5, distanceToCenter);
    float coreLight = 1.0 - smoothstep(0.0, 0.24, distanceToCenter);
    gl_FragColor = vec4(vColor * (0.76 + coreLight * 1.06), edge * vAlpha);
  }
`

function createGlobePoints(count: number, radius: number, halo = false) {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  const phases = new Float32Array(count)
  const cyan = new THREE.Color(0x58bfff)
  const silver = new THREE.Color(0xc6d4dc)
  const warm = new THREE.Color(0xff9852)
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))

  for (let index = 0; index < count; index += 1) {
    const y = 1 - (index / Math.max(1, count - 1)) * 2
    const radial = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = goldenAngle * index
    const direction = new THREE.Vector3(Math.cos(theta) * radial, y, Math.sin(theta) * radial)
      .add(new THREE.Vector3((random() - 0.5) * 0.018, (random() - 0.5) * 0.018, (random() - 0.5) * 0.018))
      .normalize()
    const scatter = halo ? (random() - 0.5) * 0.26 : (random() - 0.5) * 0.055
    const pointRadius = radius + scatter
    const offset = index * 3
    positions[offset] = direction.x * pointRadius
    positions[offset + 1] = direction.y * pointRadius
    positions[offset + 2] = direction.z * pointRadius

    const warmRegion = Math.max(0, direction.x * 0.75 - direction.y * 0.62)
    let color = silver.clone().lerp(cyan, 0.42 + random() * 0.5)
    if (!halo && warmRegion > 0.24 && random() < warmRegion * 0.46) {
      color = color.lerp(warm, 0.82 + random() * 0.16)
    }
    colors[offset] = color.r
    colors[offset + 1] = color.g
    colors[offset + 2] = color.b
    scales[index] = halo ? 0.34 + random() * 0.5 : 0.48 + random() * 0.78
    phases[index] = random() * Math.PI * 2
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))

  const material = new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    fragmentShader: globeFragmentShader,
    transparent: true,
    uniforms: {
      uAttachmentProgress: { value: 0 },
      uAttachmentStrength: { value: 0 },
      uConvergence: { value: 0 },
      uEnergy: { value: 0 },
      uFocusDirection: { value: new THREE.Vector3(0, 0, 1) },
      uFocusStrength: { value: 0 },
      uIntroWaveColors: {
        value: [new THREE.Color(0xff9852), new THREE.Color(0xc6d4dc), new THREE.Color(0x58bfff)],
      },
      uIntroWaveDirections: {
        value: [
          new THREE.Vector3(0.8, 0.2, 0.56).normalize(),
          new THREE.Vector3(-0.42, 0.72, 0.56).normalize(),
          new THREE.Vector3(-0.46, -0.68, 0.58).normalize(),
        ],
      },
      uIntroWaveTangents: {
        value: [
          new THREE.Vector3(-0.2, 0.96, 0.18).normalize(),
          new THREE.Vector3(0.72, -0.42, 0.56).normalize(),
          new THREE.Vector3(-0.68, -0.46, 0.58).normalize(),
        ],
      },
      uIntroWaveProgress: { value: 2 },
      uIntroWaveStrength: { value: 0 },
      uPixelRatio: { value: 1 },
      uPointScale: { value: presentationProfile.globePointScale },
      uPulseDirection: { value: new THREE.Vector3(0.7, 0.2, 0.68).normalize() },
      uPulseProgress: { value: 2 },
      uPulseStrength: { value: 0 },
      uReveal: { value: reducedMotion ? 1 : 0 },
      uTime: { value: 0 },
    },
    vertexColors: true,
    vertexShader: globeVertexShader,
  }) as GlobeMaterial
  material.toneMapped = false
  const points = new THREE.Points(geometry, material)
  points.renderOrder = halo ? 4 : 3
  return { geometry, material, points }
}

const globePointCount = compact ? 6200 : presentationProfile.globeCount
const globeSurface = createGlobePoints(globePointCount, globeRadius * 1.025)
globeGroup.add(globeSurface.points)

const arrivalVertexShader = `
  attribute float aDelay;
  attribute float aPhase;
  attribute float aScale;
  attribute vec3 aSpread;
  attribute vec3 aSurfaceTarget;
  uniform float uApproachDuration;
  uniform float uCharacter;
  uniform float uCoherentSurface;
  uniform float uContactAngle;
  uniform float uContactOverride;
  uniform vec3 uContactPoint;
  uniform vec3 uContactTangent;
  uniform float uDirection;
  uniform vec3 uEmergePoint;
  uniform mat4 uGlobeToOrbit;
  uniform float uGlobeRadius;
  uniform vec3 uHidePoint;
  uniform float uPixelRatio;
  uniform float uPointScale;
  uniform float uProgress;
  uniform float uRadius;
  uniform vec3 uSourceDepth;
  uniform vec3 uSourcePosition;
  uniform vec3 uSourceTangent;
  uniform float uSpread;
  uniform float uStrength;
  uniform float uSurfaceMode;
  uniform float uTime;
  uniform vec3 uTint;
  varying float vAlpha;
  varying vec3 vColor;

  vec3 cubicBezier(vec3 a, vec3 b, vec3 c, vec3 d, float progress) {
    float inverse = 1.0 - progress;
    return inverse * inverse * inverse * a
      + 3.0 * inverse * inverse * progress * b
      + 3.0 * inverse * progress * progress * c
      + progress * progress * progress * d;
  }

  vec3 slerpDirection(vec3 startDirection, vec3 endDirection, float progress) {
    float cosine = clamp(dot(startDirection, endDirection), -0.9995, 0.9995);
    float angle = acos(cosine);
    float angleSine = max(0.001, sin(angle));
    return normalize(
      startDirection * (sin((1.0 - progress) * angle) / angleSine)
      + endDirection * (sin(progress * angle) / angleSine)
    );
  }

  void main() {
    float particleClock = uProgress - 0.06 - aDelay * 0.22;
    float localProgress = clamp(particleClock / uApproachDuration, 0.0, 1.0);
    float captureAngle = uContactAngle - uDirection * 0.94;
    vec3 outerPoint = uSourcePosition;
    outerPoint += uSourceTangent * aSpread.x * uSpread * 1.46;
    outerPoint += uSourceDepth * aSpread.z * uSpread * 0.74;
    vec3 captureGuide = vec3(
      cos(captureAngle - uDirection * 0.28) * (uRadius + 0.3),
      sin(captureAngle - uDirection * 0.28) * (uRadius + 0.3),
      0.0
    );
    vec3 capturePoint = vec3(cos(captureAngle) * uRadius, sin(captureAngle) * uRadius, 0.0);
    vec3 orbitContactPoint = vec3(cos(uContactAngle) * uGlobeRadius, sin(uContactAngle) * uGlobeRadius, 0.0);
    vec3 contactPoint = mix(orbitContactPoint, uContactPoint, uContactOverride);
    vec3 captureNormal = normalize(vec3(-sin(captureAngle), cos(captureAngle), 0.0)) * uDirection;
    vec3 guidePoint = mix(outerPoint, captureGuide, 0.44) + captureNormal * (0.92 + uCharacter * 0.22);
    guidePoint.z *= 0.52;
    vec3 defaultPositionOnPath;
    if (localProgress < 0.62) {
      float approachProgress = localProgress / 0.62;
      defaultPositionOnPath = cubicBezier(outerPoint, guidePoint, captureGuide, capturePoint, approachProgress);
    } else if (localProgress < 0.84) {
      float captureProgress = (localProgress - 0.62) / 0.22;
      float orbitAngle = mix(captureAngle, uContactAngle, captureProgress);
      defaultPositionOnPath = vec3(cos(orbitAngle) * uRadius, sin(orbitAngle) * uRadius, 0.0);
    } else {
      float contactProgress = (localProgress - 0.84) / 0.16;
      vec3 orbitContact = vec3(cos(uContactAngle) * uRadius, sin(uContactAngle) * uRadius, 0.0);
      defaultPositionOnPath = mix(orbitContact, contactPoint, contactProgress);
      defaultPositionOnPath.z += sin(contactProgress * 3.14159265359) * 0.08;
    }

    vec3 coherentApproachDirection = normalize(uHidePoint - outerPoint);
    vec3 coherentPositionOnPath;
    if (localProgress < 0.58) {
      float approachProgress = localProgress / 0.58;
      vec3 approachControlA = outerPoint + coherentApproachDirection * (0.72 + uCharacter * 0.2);
      vec3 approachControlB = uHidePoint - coherentApproachDirection * 0.46;
      coherentPositionOnPath = cubicBezier(
        outerPoint,
        approachControlA,
        approachControlB,
        uHidePoint,
        approachProgress
      );
    } else if (localProgress < 0.7) {
      float hiddenProgress = (localProgress - 0.58) / 0.12;
      vec3 hiddenControlA = uHidePoint + uSourceDepth * 0.72;
      vec3 hiddenControlB = uEmergePoint + uSourceDepth * 0.58;
      coherentPositionOnPath = cubicBezier(
        uHidePoint,
        hiddenControlA,
        hiddenControlB,
        uEmergePoint,
        hiddenProgress
      );
    } else {
      float emergeProgress = (localProgress - 0.7) / 0.3;
      vec3 towardCamera = normalize(-uSourceDepth);
      vec3 emergeControlA = uEmergePoint + towardCamera * 0.6;
      vec3 emergeControlB = contactPoint - normalize(uContactTangent) * 0.42;
      coherentPositionOnPath = cubicBezier(
        uEmergePoint,
        emergeControlA,
        emergeControlB,
        contactPoint,
        emergeProgress
      );
    }

    vec3 positionOnPath = mix(defaultPositionOnPath, coherentPositionOnPath, uCoherentSurface);

    float width = mix(1.0, 0.14, smoothstep(0.12, 0.96, localProgress));
    positionOnPath.z += aSpread.z * uSpread * width;
    vec2 pathNormal = normalize(vec2(-positionOnPath.y, positionOnPath.x));
    positionOnPath.xy += pathNormal * aSpread.y * uSpread * 0.1 * width;
    float branch = sin(aPhase * 2.0 + localProgress * 7.0) * uCharacter * 0.065;
    positionOnPath.xy += pathNormal * branch * sin(localProgress * 3.14159265359);
    positionOnPath.z += sin(aPhase * 1.7 + uTime * 0.16) * 0.018 * width;

    float defaultSurfaceProgressRaw = clamp((uProgress - 0.68 - aDelay * 0.115) / 0.205, 0.0, 1.0);
    float coherentSurfaceProgressRaw = clamp((particleClock - 0.575) / 0.15, 0.0, 1.0);
    float surfaceProgressRaw = mix(
      defaultSurfaceProgressRaw,
      coherentSurfaceProgressRaw,
      uCoherentSurface
    );
    float surfaceProgress = surfaceProgressRaw * surfaceProgressRaw * (3.0 - 2.0 * surfaceProgressRaw);
    vec3 contactDirection = normalize(contactPoint);
    vec3 targetDirection = normalize((uGlobeToOrbit * vec4(normalize(aSurfaceTarget), 0.0)).xyz);
    vec3 orbitIncomingTangent = vec3(-sin(uContactAngle), cos(uContactAngle), 0.0) * uDirection;
    vec3 incomingTangent = normalize(mix(orbitIncomingTangent, uContactTangent, uCoherentSurface));
    vec3 frontDirection = normalize(-uSourceDepth);
    vec3 surfaceInwardRaw = frontDirection - contactDirection * dot(frontDirection, contactDirection);
    vec3 surfaceInwardTangent = surfaceInwardRaw / max(0.001, length(surfaceInwardRaw));
    vec3 surfaceSideTangent = normalize(cross(contactDirection, surfaceInwardTangent));
    float forwardSeed = 0.5 + 0.5 * aSurfaceTarget.y;
    float lateralSeed = clamp(aSurfaceTarget.x * 0.74 + aSurfaceTarget.z * 0.58, -1.0, 1.0);
    float forwardAngle = mix(0.34, 2.45, pow(forwardSeed, 0.88));
    float lateralAngle = lateralSeed * 0.98;
    vec3 surfaceFlowTangent = normalize(
      surfaceInwardTangent * cos(lateralAngle) + surfaceSideTangent * sin(lateralAngle)
    );
    vec3 coherentTarget = normalize(
      contactDirection * cos(forwardAngle) + surfaceFlowTangent * sin(forwardAngle)
    );
    float frontFacing = dot(coherentTarget, frontDirection);
    coherentTarget = normalize(
      coherentTarget + frontDirection * max(0.0, 0.06 - frontFacing) * 1.35
    );
    targetDirection = normalize(mix(targetDirection, coherentTarget, uCoherentSurface));
    vec3 surfaceDirection = slerpDirection(contactDirection, targetDirection, surfaceProgress);
    float surfaceLift = sin(surfaceProgress * 3.14159265359) * (0.08 + abs(aSpread.z) * 0.055);
    vec3 surfacePoint = surfaceDirection * (uGlobeRadius + surfaceLift);

    float coreProgressRaw = clamp((uProgress - 0.72 - aDelay * 0.08) / 0.2, 0.0, 1.0);
    float coreProgress = coreProgressRaw * coreProgressRaw * (3.0 - 2.0 * coreProgressRaw);
    vec3 corePoint = contactDirection * mix(uGlobeRadius, 0.08, coreProgress);
    corePoint += targetDirection * sin(coreProgress * 3.14159265359) * 0.055;

    if (uSurfaceMode > 0.5) {
      positionOnPath = mix(positionOnPath, surfacePoint, smoothstep(0.0, 0.075, surfaceProgressRaw));
    } else {
      positionOnPath = mix(positionOnPath, corePoint, smoothstep(0.0, 0.08, coreProgressRaw));
    }

    vec4 viewPosition = modelViewMatrix * vec4(positionOnPath, 1.0);
    float fieldReveal = smoothstep(0.015, 0.11, uProgress);
    float launchReveal = 0.24 + smoothstep(-0.025, 0.055, particleClock) * 0.76;
    float headLight = smoothstep(0.54, 0.82, localProgress) * (1.0 - smoothstep(0.88, 1.0, localProgress));
    float surfaceLight = smoothstep(0.02, 0.74, surfaceProgressRaw) * uSurfaceMode;
    float coreLight = smoothstep(0.04, 0.78, coreProgressRaw) * (1.0 - uSurfaceMode);
    float surfaceFade = 1.0 - smoothstep(0.92, 1.0, surfaceProgressRaw);
    float coreFade = 1.0 - smoothstep(0.72, 1.0, coreProgressRaw);
    float resolutionFade = mix(coreFade, surfaceFade, uSurfaceMode);
    float coherentApproach = 1.0 - smoothstep(0.54, 0.6, localProgress);
    float coherentEmergence = smoothstep(0.7, 0.86, localProgress);
    float coherentRouteVisibility = max(coherentApproach, coherentEmergence);
    float coherentPointScale = mix(
      1.0,
      mix(0.58, 1.0, coherentEmergence),
      uCoherentSurface * step(0.69, localProgress)
    );
    gl_PointSize = aScale * (1.0 + headLight * 0.32 + surfaceLight * 0.28 + coreLight * 0.46) * coherentPointScale * uPixelRatio * uPointScale * (28.0 / max(1.0, -viewPosition.z));
    gl_Position = projectionMatrix * viewPosition;
    vAlpha = fieldReveal * launchReveal * resolutionFade * (0.2 + headLight * 0.68 + surfaceLight * 0.5 + coreLight * 0.5) * uStrength;
    vAlpha *= mix(1.0, coherentRouteVisibility, uCoherentSurface);
    vColor = mix(uTint, vec3(0.94, 0.98, 1.0), headLight * 0.56);
    vColor = mix(vColor, vec3(0.96, 0.99, 1.0), coherentEmergence * uCoherentSurface * 0.42);
    vColor = mix(vColor, vec3(0.7, 0.88, 0.96), surfaceLight * 0.38);
    vColor = mix(vColor, vec3(1.0, 0.92, 0.78), coreLight * 0.58);
  }
`

const arrivalFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    float distanceToCenter = length(gl_PointCoord - 0.5);
    if (distanceToCenter > 0.5) discard;
    float edge = 1.0 - smoothstep(0.1, 0.5, distanceToCenter);
    float coreLight = 1.0 - smoothstep(0.0, 0.2, distanceToCenter);
    gl_FragColor = vec4(vColor * (0.8 + coreLight * 1.45), edge * vAlpha);
  }
`

const replayVertexShader = `
  attribute float aDelay;
  attribute float aPhase;
  attribute float aScale;
  attribute vec3 aSpread;
  uniform vec3 uBackPoint;
  uniform float uCharacter;
  uniform vec3 uContactPoint;
  uniform vec3 uContactTangent;
  uniform float uGlobeRadius;
  uniform float uPixelRatio;
  uniform float uPointScale;
  uniform float uProgress;
  uniform vec3 uSourceDepth;
  uniform vec3 uSourcePosition;
  uniform vec3 uSourceTangent;
  uniform float uSpread;
  uniform float uStrength;
  uniform float uTime;
  uniform vec3 uTint;
  varying float vAlpha;
  varying vec3 vColor;

  vec3 cubicBezier(vec3 a, vec3 b, vec3 c, vec3 d, float progress) {
    float inverse = 1.0 - progress;
    return inverse * inverse * inverse * a
      + 3.0 * inverse * inverse * progress * b
      + 3.0 * inverse * progress * progress * c
      + progress * progress * progress * d;
  }

  vec3 slerpDirection(vec3 startDirection, vec3 endDirection, float progress) {
    float cosine = clamp(dot(startDirection, endDirection), -0.9995, 0.9995);
    float angle = acos(cosine);
    float angleSine = max(0.001, sin(angle));
    return normalize(
      startDirection * (sin((1.0 - progress) * angle) / angleSine)
      + endDirection * (sin(progress * angle) / angleSine)
    );
  }

  void main() {
    float particleClock = uProgress - 0.025 - aDelay * 0.17;
    float routeProgress = clamp(particleClock / 0.82, 0.0, 1.0);
    float approachRaw = clamp(routeProgress / 0.72, 0.0, 1.0);
    float approachProgress = approachRaw * approachRaw * (3.0 - 2.0 * approachRaw);
    vec3 contactDirection = normalize(uContactPoint);
    vec3 contactTangent = normalize(uContactTangent);
    vec3 towardCamera = normalize(-uSourceDepth);
    vec3 sourceToContact = normalize(uContactPoint - uSourcePosition);
    vec3 outerPoint = uSourcePosition;
    outerPoint += uSourceTangent * aSpread.x * uSpread * 1.34;
    outerPoint += uSourceDepth * aSpread.z * uSpread * 0.68;
    vec3 approachControlA = outerPoint + sourceToContact * (0.82 + uCharacter * 0.22);
    approachControlA += uSourceTangent * aSpread.y * uSpread * 0.18;
    vec3 approachControlB = uContactPoint - contactTangent * (0.7 + uCharacter * 0.16);
    approachControlB += towardCamera * 0.12;
    vec3 approachPoint = cubicBezier(
      outerPoint,
      approachControlA,
      approachControlB,
      uContactPoint,
      approachProgress
    );

    float wrapRaw = clamp((routeProgress - 0.72) / 0.28, 0.0, 1.0);
    float wrapEntrySpeed = 0.55;
    float wrapProgress = wrapRaw * (wrapEntrySpeed
      + wrapRaw * ((3.0 - 2.0 * wrapEntrySpeed) + wrapRaw * (wrapEntrySpeed - 2.0)));
    vec3 backDirection = normalize(uBackPoint);
    vec3 sphereDirection = slerpDirection(contactDirection, backDirection, wrapProgress);
    vec3 surfaceForwardRaw = backDirection - sphereDirection * dot(backDirection, sphereDirection);
    vec3 surfaceForward = surfaceForwardRaw / max(0.001, length(surfaceForwardRaw));
    vec3 entryForward = normalize(backDirection - contactDirection * dot(backDirection, contactDirection));
    vec3 surfaceSide = normalize(cross(contactDirection, entryForward));
    float settling = smoothstep(0.0, 1.0, wrapProgress);
    float surfaceScatter = mix(0.028, 0.012, settling);
    float surfaceLift = mix(0.006, 0.004, settling);
    vec3 wrapPoint = sphereDirection * (uGlobeRadius + surfaceLift);
    wrapPoint += surfaceSide * aSpread.y * surfaceScatter;
    wrapPoint += surfaceForward * aSpread.x * surfaceScatter * 0.42;

    // Preserve the outer route; join its final quarter to the surface with matching position and velocity.
    if (approachRaw > 0.75) {
      float joinPhase = 0.84375;
      float joinInverse = 1.0 - joinPhase;
      vec3 joinPoint = cubicBezier(outerPoint, approachControlA, approachControlB, uContactPoint, joinPhase);
      vec3 joinVelocity = 3.0 * (
        joinInverse * joinInverse * (approachControlA - outerPoint)
        + 2.0 * joinInverse * joinPhase * (approachControlB - approachControlA)
        + joinPhase * joinPhase * (uContactPoint - approachControlB)
      ) * 1.125 * 0.25;
      float arcAngle = acos(clamp(dot(contactDirection, backDirection), -0.9995, 0.9995));
      float entryScatter = aSpread.x * 0.028 * 0.42;
      vec3 entryPoint = contactDirection * (uGlobeRadius + 0.006)
        + surfaceSide * aSpread.y * 0.028 + entryForward * entryScatter;
      vec3 entryVelocity = (entryForward * (uGlobeRadius + 0.006) - contactDirection * entryScatter)
        * arcAngle * wrapEntrySpeed * (0.72 * 0.25 / 0.28);
      float t = (approachRaw - 0.75) / 0.25;
      float t2 = t * t;
      float t3 = t2 * t;
      approachPoint = (2.0 * t3 - 3.0 * t2 + 1.0) * joinPoint
        + (t3 - 2.0 * t2 + t) * joinVelocity
        + (-2.0 * t3 + 3.0 * t2) * entryPoint
        + (t3 - t2) * entryVelocity;
    }
    vec3 positionOnPath = routeProgress < 0.72 ? approachPoint : wrapPoint;
    positionOnPath += contactTangent
      * sin(aPhase * 1.8 + uTime * 0.18)
      * 0.012
      * (1.0 - smoothstep(0.5, 0.72, routeProgress));

    vec4 viewPosition = modelViewMatrix * vec4(positionOnPath, 1.0);
    float fieldReveal = smoothstep(0.012, 0.09, uProgress);
    float launchReveal = 0.2 + smoothstep(-0.02, 0.05, particleClock) * 0.8;
    float contactLight = exp(-pow((routeProgress - 0.72) * 5.2, 2.0));
    float wrapLight = smoothstep(0.02, 0.4, wrapRaw)
      * (1.0 - smoothstep(0.72, 1.0, wrapRaw));
    float surfaceAbsorption = 1.0 - smoothstep(0.56, 0.8, routeProgress) * 0.68;
    float endFade = 1.0 - smoothstep(0.9, 1.0, routeProgress);
    gl_PointSize = aScale
      * (0.96 + contactLight * 0.2 + wrapLight * 0.18)
      * uPixelRatio
      * uPointScale
      * (28.0 / max(1.0, -viewPosition.z));
    gl_Position = projectionMatrix * viewPosition;
    vAlpha = fieldReveal
      * launchReveal
      * endFade
      * surfaceAbsorption
      * (0.22 + contactLight * 0.48 + wrapLight * 0.42)
      * uStrength;
    vColor = mix(uTint, vec3(0.94, 0.98, 1.0), contactLight * 0.56);
    vColor = mix(vColor, vec3(0.76, 0.9, 1.0), wrapLight * 0.24);
  }
`

const rimVertexShader = `
  uniform float uCoreRadius;
  varying float vCoreRadiusView;
  varying vec3 vCenterView;
  varying vec3 vLocalDirection;
  varying vec3 vViewPosition;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vCenterView = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 radiusPointView = (modelViewMatrix * vec4(uCoreRadius, 0.0, 0.0, 1.0)).xyz;
    vCoreRadiusView = length(radiusPointView - vCenterView);
    vLocalDirection = normalize(position);
    vViewPosition = viewPosition.xyz;
    gl_Position = projectionMatrix * viewPosition;
  }
`

const rimFragmentShader = `
  uniform float uEnergy;
  uniform float uReveal;
  uniform float uTime;
  varying float vCoreRadiusView;
  varying vec3 vCenterView;
  varying vec3 vLocalDirection;
  varying vec3 vViewPosition;

  vec3 energyColor(vec3 direction) {
    float angle = atan(direction.y, direction.x) + direction.z * 0.52 - uTime * 0.018;
    float warmWeight = exp(cos(angle + 0.78) * 2.35);
    float silverWeight = exp(cos(angle - 1.314) * 2.35);
    float blueWeight = exp(cos(angle - 3.408) * 2.35);
    float weightSum = warmWeight + silverWeight + blueWeight;
    vec3 warm = vec3(1.0, 0.43, 0.16);
    vec3 silver = vec3(0.78, 0.86, 0.9);
    vec3 blue = vec3(0.18, 0.62, 1.0);
    return (warm * warmWeight + silver * silverWeight + blue * blueWeight) / weightSum;
  }

  void main() {
    vec3 rayDirection = normalize(vViewPosition);
    vec3 closestPoint = rayDirection * dot(vCenterView, rayDirection);
    float distanceFromCenter = length(closestPoint - vCenterView);
    float signedDistance = (distanceFromCenter - vCoreRadiusView) / vCoreRadiusView;
    float antialiasWidth = max(fwidth(signedDistance) * 1.2, 0.0008);

    float coreWidth = 0.0038 + antialiasWidth;
    float electricCore = exp(-pow(abs(signedDistance) / coreWidth, 1.72));
    float innerDistance = max(-signedDistance, 0.0);
    float outerDistance = max(signedDistance, 0.0);
    float outerMask = smoothstep(-antialiasWidth, antialiasWidth, signedDistance);
    float innerMask = 1.0 - outerMask;
    float innerScatter = exp(-pow(innerDistance / 0.016, 1.45)) * innerMask;
    float outerMist = exp(-pow(outerDistance / 0.052, 1.3)) * outerMask;

    vec3 direction = normalize(vLocalDirection);
    float slowField =
      sin(dot(direction, vec3(2.3, -1.7, 2.8)) + uTime * 0.075) * 0.5 +
      sin(dot(direction, vec3(-3.7, 2.1, 1.4)) - uTime * 0.047) * 0.3 +
      sin(dot(direction, vec3(1.2, 3.4, -2.6)) + uTime * 0.031) * 0.2;
    float fogDensity = 0.72 + slowField * 0.24;
    float gathering = pow(
      0.5 + 0.5 * sin(atan(direction.y, direction.x) * 2.0 - uTime * 0.12 + direction.z),
      7.0
    );

    vec3 tint = energyColor(direction);
    vec3 iceWhite = vec3(0.82, 0.96, 1.0);
    vec3 coreColor = mix(iceWhite, tint, 0.38 + gathering * 0.1);
    vec3 innerColor = mix(iceWhite, tint, 0.58);
    vec3 mistColor = mix(vec3(0.34, 0.72, 0.84), tint, 0.86);

    float energyLift = 1.0 + uEnergy * 0.22;
    vec3 light = coreColor * electricCore * (2.6 + gathering * 0.54) * energyLift;
    light += innerColor * innerScatter * 0.7 * fogDensity;
    light += mistColor * outerMist * (0.54 + gathering * 0.36) * fogDensity;
    float alpha = electricCore * 0.26 + innerScatter * 0.07 + outerMist * 0.058 * fogDensity;
    gl_FragColor = vec4(light, alpha * uReveal);
  }
`

const rimScale = 1.09
const rimCoreScale = 1.025

const rimMaterial = new THREE.ShaderMaterial({
  blending: THREE.AdditiveBlending,
  depthTest: true,
  depthWrite: false,
  fragmentShader: rimFragmentShader,
  side: THREE.FrontSide,
  transparent: true,
  uniforms: {
    uCoreRadius: { value: globeRadius * rimCoreScale },
    uEnergy: { value: 0 },
    uReveal: { value: reducedMotion ? 1 : 0 },
    uTime: { value: 0 },
  },
  vertexShader: rimVertexShader,
})
rimMaterial.toneMapped = false
const rimGeometry = new THREE.SphereGeometry(
  globeRadius * rimScale,
  compact ? 128 : 192,
  compact ? 88 : 128,
)
const rim = new THREE.Mesh(rimGeometry, rimMaterial)
rim.renderOrder = 5
globeGroup.add(rim)

const orbitOccluderGeometry = new THREE.SphereGeometry(
  globeRadius * rimCoreScale,
  compact ? 96 : 144,
  compact ? 64 : 96,
)
const orbitOccluderMaterial = new THREE.MeshBasicMaterial({
  colorWrite: false,
  depthTest: true,
  depthWrite: true,
  side: THREE.FrontSide,
})
const orbitOccluder = new THREE.Mesh(orbitOccluderGeometry, orbitOccluderMaterial)
orbitOccluder.renderOrder = 5.5
globeGroup.add(orbitOccluder)

const globeHitGeometry = new THREE.SphereGeometry(globeRadius * 1.08, 36, 24)
const globeHitMaterial = new THREE.MeshBasicMaterial({
  colorWrite: false,
  depthWrite: false,
  opacity: 0,
  side: THREE.DoubleSide,
  transparent: true,
})
const globeHitTarget = new THREE.Mesh(globeHitGeometry, globeHitMaterial)
globeGroup.add(globeHitTarget)

const orbitRadius = 1.9
const orbitCurve = new OrbitCurve(orbitRadius)
const orbitLineGeometry = new THREE.BufferGeometry().setFromPoints(
  Array.from({ length: 1025 }, (_, index) => orbitCurve.getPoint(index / 1024)),
)
orbitLineGeometry.setAttribute(
  'aPhase',
  new THREE.BufferAttribute(Float32Array.from({ length: 1025 }, (_, index) => index / 1024), 1),
)
const orbitStates: OrbitState[] = []
const orbitTints = [new THREE.Color(0xff9852), new THREE.Color(0xc6d4dc), new THREE.Color(0x58bfff)]
const orbitPolarAngles = [68, 55, 55].map(THREE.MathUtils.degToRad)
const arrivalContactAngles = [154, 64, 226].map(THREE.MathUtils.degToRad)
const arrivalDirections = [1, 1, -1]
const arrivalSpreads = [0.76, 0.54, 0.64]
const arrivalCharacters = [0.24, 0.04, 0.72]
const pulsePhaseOffset = 0.27

const streamVertexShader = `
  attribute float aPhase;
  attribute float aScale;
  attribute vec2 aSpread;
  uniform float uEnergy;
  uniform float uPhaseOffset;
  uniform float uPixelRatio;
  uniform float uPointScale;
  uniform float uPrototype;
  uniform float uRadius;
  uniform float uReveal;
  uniform float uSpeed;
  uniform float uTime;
  uniform vec3 uTint;
  varying float vAlpha;
  varying vec3 vColor;
  varying float vPrototype;

  void main() {
    float movingPhase = fract(aPhase + uTime * uSpeed);
    float phase = mix(movingPhase, aPhase, uPrototype);
    float angle = phase * 6.28318530718;
    float vibration = sin(aPhase * 43.0 + uTime * 0.72) * 0.012;
    vec3 radialDirection = vec3(cos(angle), sin(angle), 0.0);
    vec3 movingPosition = radialDirection * (uRadius + vibration);

    float headPhase = fract(uTime * uSpeed + uPhaseOffset);
    float trailDistance = fract(headPhase - aPhase + 1.0);
    float head = exp(-pow(trailDistance / 0.034, 1.55));
    float activeTrail = 1.0 - smoothstep(0.045, 0.34, trailDistance);
    float memoryTrail = (1.0 - smoothstep(0.68, 0.84, trailDistance)) * 0.048;
    float spreadProgress = smoothstep(0.018, 0.56, trailDistance);
    float spread = mix(0.0035, 0.058, spreadProgress);
    float radialScatter = aSpread.x * spread;
    float depthScatter = aSpread.y * spread * 0.72;
    vec3 prototypePosition = radialDirection * (uRadius + radialScatter);
    prototypePosition.z += depthScatter;

    vec3 positionOnOrbit = mix(movingPosition, prototypePosition, uPrototype);
    vec4 viewPosition = modelViewMatrix * vec4(positionOnOrbit, 1.0);
    float cluster = pow(0.5 + 0.5 * sin(aPhase * 18.8495559 - uTime * 0.82), 5.0);
    float energy = 1.0 + max(uEnergy, 0.0) * 0.38;
    float originalSize = aScale * energy * uPixelRatio * uPointScale * (32.0 / max(1.0, -viewPosition.z));
    float prototypeSize = aScale * (0.86 + head * 0.72 + activeTrail * 0.18) * energy * uPixelRatio * uPointScale
      * (30.0 / max(1.0, -viewPosition.z));
    gl_PointSize = mix(originalSize, prototypeSize, uPrototype);
    gl_Position = projectionMatrix * viewPosition;
    float originalAlpha = 0.18 + cluster * 0.82;
    float traceGrain = 0.92 + sin(aPhase * 289.0 + aSpread.x * 7.0) * 0.06;
    float prototypeAlpha = (head * 0.76 + activeTrail * 0.3 + memoryTrail) * traceGrain;
    vAlpha = mix(originalAlpha, prototypeAlpha, uPrototype) * (1.0 + uEnergy * 0.16) * uReveal;
    vec3 originalColor = mix(uTint, vec3(1.0), cluster * 0.62);
    vec3 prototypeColor = mix(uTint, vec3(0.9, 0.97, 1.0), min(0.82, head * 0.72 + activeTrail * 0.18));
    vColor = mix(originalColor, prototypeColor, uPrototype);
    vPrototype = uPrototype;
  }
`

const streamFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  varying float vPrototype;

  void main() {
    float distanceToCenter = length(gl_PointCoord - 0.5);
    if (distanceToCenter > 0.5) discard;
    float edgeStart = mix(0.12, 0.035, vPrototype);
    float edge = 1.0 - smoothstep(edgeStart, 0.5, distanceToCenter);
    float coreLight = 1.0 - smoothstep(0.0, mix(0.2, 0.16, vPrototype), distanceToCenter);
    float brightness = mix(0.72 + coreLight * 1.8, 0.94 + coreLight * 1.68, vPrototype);
    gl_FragColor = vec4(vColor * brightness, edge * vAlpha);
  }
`

function createPulseTrail(tint: THREE.Color, phaseOffset: number) {
  const sampleCount = presentationTier === 'ultra' ? 257 : presentationTier === 'large' ? 193 : 145
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(sampleCount * 2 * 3)
  const previous = new Float32Array(sampleCount * 2 * 3)
  const next = new Float32Array(sampleCount * 2 * 3)
  const colors = new Float32Array(sampleCount * 2 * 3)
  const sides = new Float32Array(sampleCount * 2)
  const progressValues = new Float32Array(sampleCount * 2)
  const trailAlphas = new Float32Array(sampleCount * 2)
  const widthProfiles = new Float32Array(sampleCount * 2)
  const indices = new Uint16Array((sampleCount - 1) * 6)
  const color = new THREE.Color()
  const iceWhite = new THREE.Color(0xe8f8ff)
  const angleStep = (presentationProfile.pulseTailLength / (sampleCount - 1)) * Math.PI * 2

  for (let index = 0; index < sampleCount; index += 1) {
    const progress = index / (sampleCount - 1)
    const angle = (phaseOffset - presentationProfile.pulseTailLength * (1 - progress)) * Math.PI * 2
    const pointX = Math.cos(angle) * orbitRadius
    const pointY = Math.sin(angle) * orbitRadius
    const previousX = Math.cos(angle - angleStep) * orbitRadius
    const previousY = Math.sin(angle - angleStep) * orbitRadius
    const nextX = Math.cos(angle + angleStep) * orbitRadius
    const nextY = Math.sin(angle + angleStep) * orbitRadius
    const visibility = smoothStep(0.08, 0.48, progress) * Math.pow(progress, 2.05)
    const headLift = smoothStep(0.78, 1, progress)
    const widthProfile = THREE.MathUtils.lerp(0.46, 1, smoothStep(0.08, 0.82, progress))
    color.copy(tint).lerp(iceWhite, headLift * 0.74)

    for (let sideIndex = 0; sideIndex < 2; sideIndex += 1) {
      const vertexIndex = index * 2 + sideIndex
      const offset = vertexIndex * 3
      positions[offset] = pointX
      positions[offset + 1] = pointY
      positions[offset + 2] = 0
      previous[offset] = previousX
      previous[offset + 1] = previousY
      previous[offset + 2] = 0
      next[offset] = nextX
      next[offset + 1] = nextY
      next[offset + 2] = 0
      colors[offset] = color.r
      colors[offset + 1] = color.g
      colors[offset + 2] = color.b
      sides[vertexIndex] = sideIndex === 0 ? -1 : 1
      progressValues[vertexIndex] = progress
      trailAlphas[vertexIndex] = visibility
      widthProfiles[vertexIndex] = widthProfile
    }

    if (index < sampleCount - 1) {
      const left = index * 2
      const right = left + 1
      const nextLeft = left + 2
      const nextRight = left + 3
      const indexOffset = index * 6
      indices[indexOffset] = left
      indices[indexOffset + 1] = right
      indices[indexOffset + 2] = nextLeft
      indices[indexOffset + 3] = right
      indices[indexOffset + 4] = nextRight
      indices[indexOffset + 5] = nextLeft
    }
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aPrevious', new THREE.BufferAttribute(previous, 3))
  geometry.setAttribute('aNext', new THREE.BufferAttribute(next, 3))
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aSide', new THREE.BufferAttribute(sides, 1))
  geometry.setAttribute('aProgress', new THREE.BufferAttribute(progressValues, 1))
  geometry.setAttribute('aTrailAlpha', new THREE.BufferAttribute(trailAlphas, 1))
  geometry.setAttribute('aWidthProfile', new THREE.BufferAttribute(widthProfiles, 1))
  geometry.setIndex(new THREE.BufferAttribute(indices, 1))
  geometry.computeBoundingSphere()

  // Shared strip vertices remove segment caps; clip-space extrusion keeps the width stable in perspective.
  const material = new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    fog: true,
    side: THREE.DoubleSide,
    transparent: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uCoreOpacity: { value: 0.48 },
        uCoreWidth: { value: presentationProfile.pulseCoreWidth },
        uHazeOpacity: { value: 0.045 },
        uHazeWidth: { value: presentationProfile.pulseHazeWidth },
        uOpacity: { value: reducedMotion ? 1 : 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
      },
    ]),
    vertexShader: /* glsl */ `
      attribute vec3 aPrevious;
      attribute vec3 aNext;
      attribute vec3 aColor;
      attribute float aSide;
      attribute float aProgress;
      attribute float aTrailAlpha;
      attribute float aWidthProfile;

      uniform float uHazeWidth;
      uniform vec2 uResolution;

      varying float vAcross;
      varying vec3 vColor;
      varying float vProgress;
      varying float vTrailAlpha;

      #include <fog_pars_vertex>

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vec4 currentClip = projectionMatrix * mvPosition;
        vec4 previousClip = projectionMatrix * modelViewMatrix * vec4(aPrevious, 1.0);
        vec4 nextClip = projectionMatrix * modelViewMatrix * vec4(aNext, 1.0);

        vec2 currentPixel = (currentClip.xy / currentClip.w) * uResolution * 0.5;
        vec2 previousPixel = (previousClip.xy / previousClip.w) * uResolution * 0.5;
        vec2 nextPixel = (nextClip.xy / nextClip.w) * uResolution * 0.5;
        vec2 incoming = currentPixel - previousPixel;
        vec2 outgoing = nextPixel - currentPixel;
        incoming = length(incoming) > 0.0001 ? normalize(incoming) : vec2(1.0, 0.0);
        outgoing = length(outgoing) > 0.0001 ? normalize(outgoing) : incoming;

        vec2 tangent = incoming + outgoing;
        tangent = length(tangent) > 0.0001 ? normalize(tangent) : outgoing;
        vec2 miter = vec2(-tangent.y, tangent.x);
        vec2 incomingNormal = vec2(-incoming.y, incoming.x);
        float miterScale = min(1.7, 1.0 / max(0.42, abs(dot(miter, incomingNormal))));
        vec2 offsetPixel = miter * aSide * uHazeWidth * 0.5 * aWidthProfile * miterScale;
        currentClip.xy += (offsetPixel * 2.0 / uResolution) * currentClip.w;

        gl_Position = currentClip;
        vAcross = aSide;
        vColor = aColor;
        vProgress = aProgress;
        vTrailAlpha = aTrailAlpha;

        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uCoreOpacity;
      uniform float uCoreWidth;
      uniform float uHazeOpacity;
      uniform float uHazeWidth;
      uniform float uOpacity;

      varying float vAcross;
      varying vec3 vColor;
      varying float vProgress;
      varying float vTrailAlpha;

      #include <fog_pars_fragment>

      void main() {
        float across = abs(vAcross);
        float edgeWidth = max(fwidth(across) * 1.35, 0.012);
        float stripEdge = 1.0 - smoothstep(1.0 - edgeWidth, 1.0, across);
        float haze = pow(max(0.0, 1.0 - across), 2.2) * stripEdge;
        float coreRatio = clamp(uCoreWidth / max(uHazeWidth, 0.001), 0.08, 0.72);
        float coreDistance = across / coreRatio;
        float coreEdgeWidth = max(fwidth(coreDistance) * 1.25, 0.018);
        float core = 1.0 - smoothstep(1.0 - coreEdgeWidth, 1.0, coreDistance);
        float coreCenter = 1.0 - smoothstep(0.0, 0.78, coreDistance);
        float intensity = uHazeOpacity * haze + uCoreOpacity * core * (0.7 + coreCenter * 0.3);
        float headEnergy = smoothstep(0.74, 1.0, vProgress);
        vec3 lightColor = mix(vColor, vec3(0.94, 0.99, 1.0), core * (0.18 + headEnergy * 0.18));
        gl_FragColor = vec4(lightColor * (0.86 + core * 1.34), vTrailAlpha * intensity * uOpacity);

        #include <fog_fragment>
      }
    `,
  }) as PulseTrailMaterial
  material.toneMapped = false

  const mesh = new THREE.Mesh(geometry, material)
  mesh.frustumCulled = false
  mesh.renderOrder = 6.8

  return {
    geometry,
    material,
    mesh,
    speed: 0.045,
  } satisfies PulseTrail
}

function updatePulseTrail(trail: PulseTrail, time: number, energy: number, reveal: number) {
  const positiveEnergy = Math.max(0, energy)
  trail.mesh.rotation.z = time * trail.speed * Math.PI * 2
  trail.material.uniforms.uCoreOpacity.value = 0.48 + positiveEnergy * 0.08
  trail.material.uniforms.uHazeOpacity.value = 0.045 + positiveEnergy * 0.02
  trail.material.uniforms.uOpacity.value = reveal
  trail.mesh.visible = reveal > 0.001
}

function createStreamMaterial(
  tint: THREE.Color,
  speed: number,
  prototype = false,
  phaseOffset = pulsePhaseOffset,
) {
  const material = new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    fragmentShader: streamFragmentShader,
    transparent: true,
    uniforms: {
      uEnergy: { value: 0 },
      uPhaseOffset: { value: prototype ? phaseOffset : 0 },
      uPixelRatio: { value: 1 },
      uPointScale: { value: presentationProfile.streamPointScale },
      uPrototype: { value: prototype ? 1 : 0 },
      uRadius: { value: orbitRadius },
      uReveal: { value: reducedMotion ? 1 : 0 },
      uSpeed: { value: speed },
      uTime: { value: 0 },
      uTint: { value: tint },
    },
    vertexShader: streamVertexShader,
  }) as StreamMaterial
  material.toneMapped = false
  return material
}

function createArrivalMaterial(index: number) {
  const contactAngle = arrivalContactAngles[index]
  const direction = arrivalDirections[index]
  const material = new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    fragmentShader: arrivalFragmentShader,
    transparent: true,
    uniforms: {
      uApproachDuration: { value: index === 0 ? 0.62 : 0.57 },
      uCharacter: { value: arrivalCharacters[index] },
      uCoherentSurface: { value: index === 1 ? 1 : 0 },
      uContactAngle: { value: contactAngle },
      uContactOverride: { value: index <= 1 ? 1 : 0 },
      uContactPoint: {
        value: new THREE.Vector3(
          Math.cos(contactAngle) * globeRadius * 1.035,
          Math.sin(contactAngle) * globeRadius * 1.035,
          0,
        ),
      },
      uContactTangent: {
        value: new THREE.Vector3(-Math.sin(contactAngle), Math.cos(contactAngle), 0)
          .multiplyScalar(direction)
          .normalize(),
      },
      uDirection: { value: direction },
      uEmergePoint: {
        value: new THREE.Vector3(
          Math.cos(contactAngle) * globeRadius * 1.08,
          Math.sin(contactAngle) * globeRadius * 1.08,
          0,
        ),
      },
      uGlobeToOrbit: { value: new THREE.Matrix4() },
      uGlobeRadius: { value: globeRadius * 1.035 },
      uHidePoint: {
        value: new THREE.Vector3(
          Math.cos(contactAngle) * globeRadius * 1.035,
          Math.sin(contactAngle) * globeRadius * 1.035,
          0,
        ),
      },
      uPixelRatio: { value: 1 },
      uPointScale: { value: presentationProfile.arrivalPointScale },
      uProgress: { value: reducedMotion ? 2 : 0 },
      uRadius: { value: orbitRadius },
      uSourceDepth: { value: new THREE.Vector3(0, 0, 1) },
      uSourcePosition: { value: new THREE.Vector3() },
      uSourceTangent: { value: new THREE.Vector3(1, 0, 0) },
      uSpread: { value: arrivalSpreads[index] },
      uStrength: { value: reducedMotion ? 0 : 1 },
      uSurfaceMode: { value: 1 },
      uTime: { value: 0 },
      uTint: { value: orbitTints[index] },
    },
    vertexShader: arrivalVertexShader,
  }) as ArrivalMaterial
  material.toneMapped = false
  return material
}

function createReplayMaterial(index: number) {
  const contactAngle = arrivalContactAngles[index]
  const direction = arrivalDirections[index]
  const replayTint = orbitTints[index].clone()
  if (index === 2) replayTint.lerp(new THREE.Color(0xe8f8ff), 0.38)
  const contactPoint = new THREE.Vector3(
    Math.cos(contactAngle) * globeRadius * 1.035,
    Math.sin(contactAngle) * globeRadius * 1.035,
    0,
  )
  const contactTangent = new THREE.Vector3(-Math.sin(contactAngle), Math.cos(contactAngle), 0)
    .multiplyScalar(direction)
    .normalize()
  const material = new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    fragmentShader: arrivalFragmentShader,
    transparent: true,
    uniforms: {
      uBackPoint: { value: new THREE.Vector3(0, 0, -globeRadius * 1.035) },
      uCharacter: { value: arrivalCharacters[index] },
      uContactPoint: { value: contactPoint },
      uContactTangent: { value: contactTangent },
      uGlobeRadius: { value: globeRadius * 1.035 },
      uPixelRatio: { value: 1 },
      uPointScale: { value: presentationProfile.arrivalPointScale },
      uProgress: { value: 2 },
      uSourceDepth: { value: new THREE.Vector3(0, 0, 1) },
      uSourcePosition: { value: new THREE.Vector3() },
      uSourceTangent: { value: new THREE.Vector3(1, 0, 0) },
      uSpread: { value: index === 2 ? arrivalSpreads[index] * 0.72 : arrivalSpreads[index] },
      uStrength: { value: 0 },
      uTime: { value: 0 },
      uTint: { value: replayTint },
    },
    vertexShader: replayVertexShader,
  }) as ReplayMaterial
  material.toneMapped = false
  return material
}

for (let index = 0; index < 3; index += 1) {
  const group = new THREE.Group()
  const baseQuaternion = createSymmetricQuaternion(
    THREE.MathUtils.degToRad(-90 + index * 120),
    orbitPolarAngles[index],
  )
  group.quaternion.copy(baseQuaternion)
  rig.add(group)

  const lineMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(0xd8dfe0).lerp(orbitTints[index], 0.42),
    depthTest: true,
    depthWrite: false,
    fog: true,
    opacity: reducedMotion ? 0.24 : 0,
    transparent: true,
  })
  const line = new THREE.LineLoop(orbitLineGeometry, lineMaterial)
  line.renderOrder = 6
  group.add(line)

  const orbitPhaseOffset = (pulsePhaseOffset + index / 3) % 1
  const pulseTrail = createPulseTrail(orbitTints[index], orbitPhaseOffset)
  group.add(pulseTrail.mesh)
  const streamCount = compact ? 1800 : presentationProfile.streamCount
  const streamGeometry = new THREE.BufferGeometry()
  const streamPositions = new Float32Array(streamCount * 3)
  const streamPhases = new Float32Array(streamCount)
  const streamScales = new Float32Array(streamCount)
  const streamSpread = new Float32Array(streamCount * 2)
  for (let pointIndex = 0; pointIndex < streamCount; pointIndex += 1) {
    streamPhases[pointIndex] = pointIndex / streamCount + (random() - 0.5) * 0.002
    streamScales[pointIndex] = 0.16 + random() * 0.3
    streamSpread[pointIndex * 2] = random() + random() - 1
    streamSpread[pointIndex * 2 + 1] = random() + random() - 1
  }
  streamGeometry.setAttribute('position', new THREE.BufferAttribute(streamPositions, 3))
  streamGeometry.setAttribute('aPhase', new THREE.BufferAttribute(streamPhases, 1))
  streamGeometry.setAttribute('aScale', new THREE.BufferAttribute(streamScales, 1))
  streamGeometry.setAttribute('aSpread', new THREE.BufferAttribute(streamSpread, 2))
  const streamMaterial = createStreamMaterial(orbitTints[index], 0.045, true, orbitPhaseOffset)
  const stream = new THREE.Points(streamGeometry, streamMaterial)
  stream.renderOrder = 8
  group.add(stream)

  const baseArrivalCount = compact
    ? index === 1
      ? 400
      : 280
    : index === 1
      ? 800
      : 560
  const arrivalCount = compact
    ? baseArrivalCount
    : Math.round(baseArrivalCount * presentationProfile.arrivalCountScale)
  const arrivalGeometry = new THREE.BufferGeometry()
  const arrivalPositions = new Float32Array(arrivalCount * 3)
  const arrivalDelays = new Float32Array(arrivalCount)
  const arrivalPhases = new Float32Array(arrivalCount)
  const arrivalScales = new Float32Array(arrivalCount)
  const arrivalSpread = new Float32Array(arrivalCount * 3)
  const arrivalSurfaceTargets = new Float32Array(arrivalCount * 3)
  const arrivalGoldenAngle = Math.PI * (3 - Math.sqrt(5))
  for (let pointIndex = 0; pointIndex < arrivalCount; pointIndex += 1) {
    const offset = pointIndex * 3
    arrivalDelays[pointIndex] = random()
    arrivalPhases[pointIndex] = random() * Math.PI * 2
    arrivalScales[pointIndex] = 0.4 + random() * 0.7
    arrivalSpread[offset] = random() + random() - 1
    arrivalSpread[offset + 1] = random() + random() - 1
    arrivalSpread[offset + 2] = random() + random() - 1
    const targetY = 1 - ((pointIndex + 0.5) / arrivalCount) * 2
    const targetRadial = Math.sqrt(Math.max(0, 1 - targetY * targetY))
    const targetTheta = arrivalGoldenAngle * pointIndex + index * (Math.PI * 2) / 3
    arrivalSurfaceTargets[offset] = Math.cos(targetTheta) * targetRadial
    arrivalSurfaceTargets[offset + 1] = targetY
    arrivalSurfaceTargets[offset + 2] = Math.sin(targetTheta) * targetRadial
  }
  arrivalGeometry.setAttribute('position', new THREE.BufferAttribute(arrivalPositions, 3))
  arrivalGeometry.setAttribute('aDelay', new THREE.BufferAttribute(arrivalDelays, 1))
  arrivalGeometry.setAttribute('aPhase', new THREE.BufferAttribute(arrivalPhases, 1))
  arrivalGeometry.setAttribute('aScale', new THREE.BufferAttribute(arrivalScales, 1))
  arrivalGeometry.setAttribute('aSpread', new THREE.BufferAttribute(arrivalSpread, 3))
  arrivalGeometry.setAttribute(
    'aSurfaceTarget',
    new THREE.BufferAttribute(arrivalSurfaceTargets, 3),
  )
  const arrivalMaterial = createArrivalMaterial(index)
  const arrival = new THREE.Points(arrivalGeometry, arrivalMaterial)
  arrival.frustumCulled = false
  arrival.renderOrder = 8
  group.add(arrival)
  const replayMaterial = createReplayMaterial(index)
  const replay = new THREE.Points(arrivalGeometry, replayMaterial)
  replay.frustumCulled = false
  replay.renderOrder = 8
  group.add(replay)

  orbitStates.push({
    arrivalMaterial,
    baseQuaternion,
    contactAngle: arrivalContactAngles[index],
    energy: 0,
    group,
    index,
    lift: 0,
    lineMaterial,
    precessionPhase: index * (Math.PI * 2) / 3,
    precessionSpeed: 0.18 + index * 0.012,
    pulseTrail,
    replayMaterial,
    streamMaterial,
    targetEnergy: 0,
    targetLift: 0,
  })
}
root.dataset.globePointCount = String(globePointCount)
root.dataset.streamPointCount = String(compact ? 1800 : presentationProfile.streamCount)
root.dataset.arrivalPointScale = presentationProfile.arrivalCountScale.toFixed(2)

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2(10, 10)
const pointerTarget = new THREE.Vector2(0, 0)
const pointerMotion = new THREE.Vector2(0, 0)
const globeCenterWorld = new THREE.Vector3()
const focusDirectionWorld = new THREE.Vector3(0, 0, 1)
const focusDirectionLocal = new THREE.Vector3(0, 0, 1)
const pulseDirectionLocal = new THREE.Vector3(0.7, 0.2, 0.68).normalize()
const focusGlobeRotations = [
  new THREE.Vector2(-0.18, -0.72),
  new THREE.Vector2(0.08, 0.62),
  new THREE.Vector2(0.24, 1.88),
]
const focusRigOffsets = [
  new THREE.Vector2(-0.025, -0.08),
  new THREE.Vector2(0.005, 0.075),
  new THREE.Vector2(0.05, -0.02),
]
let hoveredOrbit = -1
let lockedOrbit = -1
let clearOrbitTimer: number | undefined
let overviewReturnTimer: number | undefined
let returningToOverview = false
let pendingOrbit = -1
let pointerOrbit = -1
let keyboardOrbit = -1
let pulseProgress = 2
let focusStrength = 0
let focusStrengthTarget = 0
let globeHovered = false
let activePointerId = -1
let pointerDownX = 0
let pointerDownY = 0
let pointerLastX = 0
let pointerLastY = 0
let pointerLastTime = 0
let dragDistance = 0
let draggingGlobe = false
let globeRotationX = 0
let globeRotationY = 0
let focusGlobeRotationX = 0
let focusGlobeRotationY = 0
let dragVelocityX = 0
let dragVelocityY = 0
root.dataset.globeHover = 'false'
root.dataset.interaction = 'idle'

function nearestEquivalentAngle(target: number, current: number) {
  return target + Math.round((current - target) / (Math.PI * 2)) * Math.PI * 2
}

function setHoveredOrbit(nextHoveredOrbit: number) {
  if (nextHoveredOrbit === hoveredOrbit) return
  hoveredOrbit = nextHoveredOrbit
  root.dataset.hovered = String(nextHoveredOrbit)
  if (nextHoveredOrbit >= 0) {
    root.dataset.focusDimension = String(nextHoveredOrbit)
    const rotation = focusGlobeRotations[nextHoveredOrbit]
    focusGlobeRotationX = rotation.x
    focusGlobeRotationY = nearestEquivalentAngle(rotation.y, globeRotationY)
    dragVelocityX = 0
    dragVelocityY = 0
    focusStrengthTarget = 0.86
  } else {
    delete root.dataset.focusDimension
    focusStrengthTarget = globeHovered ? 1 : 0
  }
  orbitLabels.forEach((label) => {
    const selected = Number(label.dataset.orbitLabel) === nextHoveredOrbit
    label.classList.toggle('is-active', selected)
    label.classList.toggle('is-muted', nextHoveredOrbit >= 0 && !selected)
    label.querySelector<HTMLButtonElement>('.orbit-trigger')?.setAttribute(
      'aria-expanded',
      String(selected),
    )
  })
}

function cancelOrbitClear() {
  if (clearOrbitTimer === undefined) return
  window.clearTimeout(clearOrbitTimer)
  clearOrbitTimer = undefined
}

function cancelOverviewReturn() {
  if (overviewReturnTimer !== undefined) window.clearTimeout(overviewReturnTimer)
  overviewReturnTimer = undefined
  returningToOverview = false
  pendingOrbit = -1
  delete root.dataset.returningToOverview
}

function hasOrbitIntent(index: number) {
  return pointerOrbit === index || keyboardOrbit === index
}

function requestOrbitFocus(index: number) {
  cancelOrbitClear()
  if (lockedOrbit >= 0) return
  if (returningToOverview) {
    pendingOrbit = index
    return
  }
  if (hoveredOrbit >= 0 && hoveredOrbit !== index) {
    pendingOrbit = index
    startOverviewReturn()
    return
  }
  setHoveredOrbit(index)
}

function startOverviewReturn() {
  cancelOrbitClear()
  if (lockedOrbit >= 0 || returningToOverview) return
  returningToOverview = true
  root.dataset.returningToOverview = 'true'
  globeHovered = false
  focusStrengthTarget = 0
  root.dataset.globeHover = 'false'
  root.dataset.interaction = 'return'
  setHoveredOrbit(-1)
  overviewReturnTimer = window.setTimeout(() => {
    overviewReturnTimer = undefined
    returningToOverview = false
    delete root.dataset.returningToOverview
    const nextOrbit = pendingOrbit
    pendingOrbit = -1
    if (nextOrbit >= 0 && hasOrbitIntent(nextOrbit)) requestOrbitFocus(nextOrbit)
    else root.dataset.interaction = 'idle'
  }, 760)
}

function scheduleOrbitClear() {
  cancelOrbitClear()
  if (lockedOrbit >= 0 || returningToOverview) return
  clearOrbitTimer = window.setTimeout(() => {
    clearOrbitTimer = undefined
    if (hoveredOrbit >= 0) startOverviewReturn()
  }, 160)
}

function clearOrbitFocus() {
  cancelOrbitClear()
  cancelOverviewReturn()
  lockedOrbit = -1
  pointerOrbit = -1
  keyboardOrbit = -1
  delete root.dataset.focusLocked
  setHoveredOrbit(-1)
}

orbitLabels.forEach((label) => {
  const index = Number(label.dataset.orbitLabel)
  const trigger = requireElement<HTMLButtonElement>(
    root,
    `[data-orbit-label='${index}'] .orbit-trigger`,
  )

  label.addEventListener('pointerenter', () => {
    pointerOrbit = index
    requestOrbitFocus(index)
  }, eventOptions)
  label.addEventListener('pointerleave', () => {
    if (pointerOrbit === index) pointerOrbit = -1
    if (pendingOrbit === index && !hasOrbitIntent(index)) pendingOrbit = -1
    scheduleOrbitClear()
  }, eventOptions)
  label.addEventListener('focusin', () => {
    keyboardOrbit = index
    requestOrbitFocus(index)
  }, eventOptions)
  label.addEventListener('focusout', (event) => {
    if (event.relatedTarget instanceof Node && label.contains(event.relatedTarget)) return
    if (keyboardOrbit === index) keyboardOrbit = -1
    if (pendingOrbit === index && !hasOrbitIntent(index)) pendingOrbit = -1
    scheduleOrbitClear()
  }, eventOptions)
  trigger.addEventListener('click', () => {
    cancelOrbitClear()
    cancelOverviewReturn()
    lockedOrbit = lockedOrbit === index ? -1 : index
    if (lockedOrbit >= 0) root.dataset.focusLocked = 'true'
    else delete root.dataset.focusLocked
    setHoveredOrbit(index)
  }, eventOptions)
})

root.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && (hoveredOrbit >= 0 || returningToOverview)) clearOrbitFocus()
}, eventOptions)

function setPointerCoordinates(clientX: number, clientY: number) {
  const bounds = root.getBoundingClientRect()
  pointer.x = ((clientX - bounds.left) / bounds.width) * 2 - 1
  pointer.y = -(((clientY - bounds.top) / bounds.height) * 2 - 1)
  pointerTarget.set(pointer.x, pointer.y)
}

function updatePointer(clientX: number, clientY: number, updateFocus = true) {
  setPointerCoordinates(clientX, clientY)
  if (returningToOverview) {
    globeHovered = false
    root.dataset.globeHover = 'false'
    focusStrengthTarget = 0
    if (activePointerId < 0) root.dataset.interaction = 'return'
    return false
  }
  if (hoveredOrbit >= 0) {
    globeHovered = false
    root.dataset.globeHover = 'false'
    focusStrengthTarget = 0.86
    if (activePointerId < 0) root.dataset.interaction = 'focus'
    return false
  }
  scene.updateMatrixWorld(true)
  raycaster.setFromCamera(pointer, camera)
  const globeHit = raycaster.intersectObject(globeHitTarget, false)[0]

  globeHovered = Boolean(globeHit)
  root.dataset.globeHover = String(globeHovered)
  if (updateFocus) {
    focusStrengthTarget = globeHit ? 1 : 0
    if (globeHit) {
      globeGroup.getWorldPosition(globeCenterWorld)
      focusDirectionWorld.copy(globeHit.point).sub(globeCenterWorld).normalize()
    }
  }
  if (activePointerId < 0) root.dataset.interaction = globeHit ? 'hover' : 'idle'
  return globeHit
}

function triggerPulse(hit: THREE.Intersection<THREE.Object3D>) {
  pulseDirectionLocal.copy(globeGroup.worldToLocal(hit.point.clone())).normalize()
  pulseProgress = 0
  root.dataset.interaction = 'pulse'
}

root.addEventListener('pointerdown', (event) => {
  const target = event.target as Element
  if (event.button !== 0 || target.closest('a, button, [data-orbit-label]')) return
  if (hoveredOrbit >= 0) {
    clearOrbitFocus()
    return
  }
  const globeHit = updatePointer(event.clientX, event.clientY)
  if (!globeHit) return

  activePointerId = event.pointerId
  pointerDownX = event.clientX
  pointerDownY = event.clientY
  pointerLastX = event.clientX
  pointerLastY = event.clientY
  pointerLastTime = event.timeStamp
  dragDistance = 0
  draggingGlobe = false
  dragVelocityX = 0
  dragVelocityY = 0
  focusStrengthTarget = 0.82
  root.dataset.interaction = 'pressed'
  root.setPointerCapture(event.pointerId)
}, eventOptions)

root.addEventListener('pointermove', (event) => {
  if (event.pointerId !== activePointerId) {
    updatePointer(event.clientX, event.clientY)
    return
  }

  const deltaX = event.clientX - pointerLastX
  const deltaY = event.clientY - pointerLastY
  const deltaTime = Math.max(8, event.timeStamp - pointerLastTime)
  dragDistance = Math.hypot(event.clientX - pointerDownX, event.clientY - pointerDownY)
  if (dragDistance > 5) draggingGlobe = true

  if (draggingGlobe) {
    globeRotationY += deltaX * 0.0042
    globeRotationX = THREE.MathUtils.clamp(globeRotationX + deltaY * 0.0035, -0.46, 0.46)
    dragVelocityY = THREE.MathUtils.clamp((deltaX / deltaTime) * 4.2, -1.35, 1.35)
    dragVelocityX = THREE.MathUtils.clamp((deltaY / deltaTime) * 3.5, -1.1, 1.1)
    focusStrengthTarget = 0.72
    root.dataset.interaction = 'drag'
    event.preventDefault()
  }

  pointerLastX = event.clientX
  pointerLastY = event.clientY
  pointerLastTime = event.timeStamp
}, eventOptions)

function finishPointer(event: PointerEvent, cancelled = false) {
  if (event.pointerId !== activePointerId) return
  const wasClick = !cancelled && !draggingGlobe && dragDistance <= 6
  const globeHit = updatePointer(event.clientX, event.clientY)
  if (wasClick && globeHit) triggerPulse(globeHit)
  if (root.hasPointerCapture(event.pointerId)) root.releasePointerCapture(event.pointerId)
  activePointerId = -1
  draggingGlobe = false
  focusStrengthTarget = globeHit ? 1 : 0
  if (!wasClick) root.dataset.interaction = globeHit ? 'hover' : 'idle'
}

root.addEventListener('pointerup', (event) => finishPointer(event), eventOptions)
root.addEventListener('pointercancel', (event) => finishPointer(event, true), eventOptions)
root.addEventListener('pointerleave', () => {
  if (activePointerId >= 0) return
  pointer.set(10, 10)
  pointerTarget.set(0, 0)
  focusStrengthTarget = 0
  globeHovered = false
  root.dataset.globeHover = 'false'
  root.dataset.interaction = 'idle'
  pointerOrbit = -1
  if (lockedOrbit < 0) {
    if (hoveredOrbit >= 0) startOverviewReturn()
    else if (!returningToOverview) setHoveredOrbit(-1)
  }
}, eventOptions)

function positionHtmlLabels() {
  rig.updateWorldMatrix(true, true)
  const width = root.clientWidth
  const height = root.clientHeight

  const globeCenter = new THREE.Vector3(0, 0, 0)
  rig.localToWorld(globeCenter)
  globeCenter.project(camera)
  intelligenceLabel.style.left = `${(globeCenter.x * 0.5 + 0.5) * width}px`
  intelligenceLabel.style.top = `${(-globeCenter.y * 0.5 + 0.5) * height}px`
}

const pulseSizingCenter = new THREE.Vector3()
const pulseSizingScale = new THREE.Vector3()

function resizePulseTrails(width: number, height: number, compactLayout: boolean) {
  rig.updateWorldMatrix(true, true)
  camera.updateMatrixWorld(true)
  globeGroup.getWorldPosition(pulseSizingCenter)
  globeGroup.getWorldScale(pulseSizingScale)
  pulseSizingCenter.applyMatrix4(camera.matrixWorldInverse)
  const depth = Math.max(1, -pulseSizingCenter.z)
  const focalLength = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)))
  const projectedDiameter =
    (2 * globeRadius * Math.abs(pulseSizingScale.x) * focalLength) / depth
  const coreWidth = THREE.MathUtils.clamp(projectedDiameter * 0.00218, compactLayout ? 1 : 1.1, 2.85)
  const hazeWidth = THREE.MathUtils.clamp(projectedDiameter * 0.00715, compactLayout ? 3.8 : 4, 9.4)

  orbitStates.forEach((orbit) => {
    orbit.pulseTrail.material.uniforms.uResolution.value.set(width, height)
    orbit.pulseTrail.material.uniforms.uCoreWidth.value = coreWidth
    orbit.pulseTrail.material.uniforms.uHazeWidth.value = hazeWidth
  })
  root.dataset.pulseWidths = `${coreWidth.toFixed(2)},${hazeWidth.toFixed(2)}`
}

function resize() {
  const width = root.clientWidth
  const height = root.clientHeight
  const portraitLayout = height > width
  const compactLayout = portraitLayout && width <= 700
  const tabletLayout = portraitLayout && width > 700 && width <= 900
  const wideDesktopLayout = width >= 1280
  const shortLayout = window.innerHeight <= 760
  if (compactLayout) {
    baseRigPosition.set(0, -1.28, 0)
    baseRigScale = 0.82
    baseCameraFov = 40
    camera.position.set(0, 0.15, 13.6)
    camera.lookAt(0, -0.75, 0)
  } else if (tabletLayout) {
    baseRigPosition.set(0, -1.52, 0)
    baseRigScale = 0.9
    baseCameraFov = 34
    camera.position.set(0, 0.2, 13.2)
    camera.lookAt(0, -0.5, 0)
  } else {
    baseRigPosition.set(wideDesktopLayout ? 2.72 : 2.55, shortLayout ? -0.22 : -0.12, 0)
    baseRigScale = wideDesktopLayout
      ? shortLayout
        ? 1.92
        : 2.02
      : shortLayout
        ? 1.72
        : 1.84
    baseCameraFov = 34
    camera.position.set(0, 0.25, 12.8)
    camera.lookAt(0, -0.25, 0)
  }
  rig.position.copy(baseRigPosition)
  rig.scale.setScalar(baseRigScale)
  camera.fov = baseCameraFov
  const pixelRatio = Math.min(
    window.devicePixelRatio,
    compactLayout ? 1.25 : presentationProfile.pixelRatioCap,
  )
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  resizePulseTrails(width, height, compactLayout)
  renderer.setPixelRatio(pixelRatio)
  renderer.setSize(width, height, false)
  composer.setPixelRatio(pixelRatio)
  composer.setSize(width, height)
  backgroundMaterial.uniforms.uPixelRatio.value = pixelRatio
  globeSurface.material.uniforms.uPixelRatio.value = pixelRatio
  orbitStates.forEach((orbit) => {
    orbit.streamMaterial.uniforms.uPixelRatio.value = pixelRatio
    orbit.arrivalMaterial.uniforms.uPixelRatio.value = pixelRatio
    orbit.replayMaterial.uniforms.uPixelRatio.value = pixelRatio
  })
  root.dataset.pixelRatio = pixelRatio.toFixed(2)
  positionHtmlLabels()
}

const resizeObserver = new ResizeObserver(resize)
resizeObserver.observe(root)
resize()

const introDuration = 4.2
const orbitCopyRevealDelay = 0.26
const orbitRevealDelay = 0.48
const orbitRevealDuration = 1.5
const replayDelay = 8.5
const replayDuration = 3.4
let elapsed = 0
let introElapsed = reducedMotion ? introDuration : 0
let orbitRevealElapsed = reducedMotion ? orbitRevealDuration : 0
let introStarted = reducedMotion
let orbitsReady = reducedMotion
let sceneVisible = document.visibilityState === 'visible'
const initialHeroRect = root.getBoundingClientRect()
const initialVisibleHeight = Math.max(
  0,
  Math.min(initialHeroRect.bottom, window.innerHeight) - Math.max(initialHeroRect.top, 0),
)
let heroVisible = initialVisibleHeight / Math.max(1, initialHeroRect.height) >= 0.3
let heroHasLeft = !heroVisible
let replayClock = 0
let replayElapsed = replayDuration + 1
let frame = 0
let lastFrameTime = performance.now()
let frameWindowStart = lastFrameTime
let framesInWindow = 0
let measuredFps = 0
let previousSample: Uint8Array | null = null
let diagnosticsSamples = 0
let animationLoopRunning = false
let disposed = false

function updateSceneVisibility() {
  root.dataset.sceneVisible = String(sceneVisible && heroVisible)
}

function syncAnimationLoop() {
  const shouldRun = !disposed && sceneVisible && heroVisible
  if (shouldRun === animationLoopRunning) return

  animationLoopRunning = shouldRun
  if (shouldRun) {
    lastFrameTime = performance.now()
    frameWindowStart = lastFrameTime
    framesInWindow = 0
    renderer.setAnimationLoop(animate)
    root.dataset.animationLoop = 'running'
  } else {
    renderer.setAnimationLoop(null)
    root.dataset.animationLoop = 'paused'
  }
}

function restartIntro() {
  if (reducedMotion) return
  introElapsed = 0
  orbitRevealElapsed = 0
  replayClock = 0
  replayElapsed = replayDuration + 1
  pulseProgress = 2
  introStarted = false
  orbitsReady = false
  delete root.dataset.introStarted
  delete root.dataset.orbitsReady
  void root.offsetWidth
}

updateSceneVisibility()
if (introStarted) root.dataset.introStarted = 'true'
if (orbitsReady) root.dataset.orbitsReady = 'true'
document.addEventListener('visibilitychange', () => {
  sceneVisible = document.visibilityState === 'visible'
  updateSceneVisibility()
  syncAnimationLoop()
}, eventOptions)

const heroObserver = new IntersectionObserver(
  ([entry]) => {
    const visibilityThreshold = heroVisible ? 0.18 : 0.3
    const nextVisible = entry.isIntersecting && entry.intersectionRatio >= visibilityThreshold
    if (!nextVisible) heroHasLeft = true
    if (nextVisible && heroHasLeft) {
      restartIntro()
      heroHasLeft = false
    }
    heroVisible = nextVisible
    updateSceneVisibility()
    syncAnimationLoop()
  },
  { threshold: [0, 0.18, 0.3] },
)
heroObserver.observe(root)

function publishDiagnostics(diagnostics: Diagnostics) {
  root.dataset.rendered = String(diagnostics.rendered)
  root.dataset.fps = String(diagnostics.fps)
  root.dataset.hovered = String(diagnostics.hovered)
  root.dataset.motionDelta = String(diagnostics.motionDelta)
  root.dataset.nonDarkRatio = String(diagnostics.nonDarkRatio)
  root.dataset.averageLuma = String(diagnostics.averageLuma)
  root.dataset.ringLifts = diagnostics.ringLifts.join(',')
}

publishDiagnostics({
  averageLuma: 0,
  fps: 0,
  hovered: -1,
  motionDelta: 0,
  nonDarkRatio: 0,
  rendered: false,
  ringLifts: [0, 0, 0],
})

function sampleCanvas() {
  const context = renderer.getContext()
  const bufferWidth = context.drawingBufferWidth
  const bufferHeight = context.drawingBufferHeight
  const sampleWidth = Math.min(520, bufferWidth)
  const sampleHeight = Math.min(360, bufferHeight)
  const sampleX = Math.max(0, Math.floor((bufferWidth - sampleWidth) * 0.62))
  const sampleY = Math.max(0, Math.floor((bufferHeight - sampleHeight) * 0.42))
  const pixels = new Uint8Array(sampleWidth * sampleHeight * 4)
  context.readPixels(sampleX, sampleY, sampleWidth, sampleHeight, context.RGBA, context.UNSIGNED_BYTE, pixels)

  let difference = 0
  let compared = 0
  let lumaTotal = 0
  let nonDark = 0
  for (let index = 0; index < pixels.length; index += 16) {
    const luma = pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722
    lumaTotal += luma
    if (luma > 7) nonDark += 1
    if (previousSample) {
      difference += Math.abs(pixels[index] - previousSample[index])
      difference += Math.abs(pixels[index + 1] - previousSample[index + 1])
      difference += Math.abs(pixels[index + 2] - previousSample[index + 2])
      compared += 3
    }
  }

  const samples = pixels.length / 16
  previousSample = pixels
  publishDiagnostics({
    averageLuma: Number((lumaTotal / samples).toFixed(2)),
    fps: Number(measuredFps.toFixed(1)),
    hovered: hoveredOrbit,
    motionDelta: Number((compared > 0 ? difference / compared : 0).toFixed(3)),
    nonDarkRatio: Number((nonDark / samples).toFixed(3)),
    rendered: nonDark > samples * 0.004,
    ringLifts: orbitStates.map((orbit) => Number(orbit.lift.toFixed(3))),
  })
}

const precessionQuaternion = new THREE.Quaternion()
const precessionEuler = new THREE.Euler()
const rigWorldQuaternion = new THREE.Quaternion()
const inverseRigWorldQuaternion = new THREE.Quaternion()
const globeWorldQuaternion = new THREE.Quaternion()
const inverseGlobeWorldQuaternion = new THREE.Quaternion()
const rigWorldPosition = new THREE.Vector3()
const cameraWorldPosition = new THREE.Vector3()
const viewTowardCamera = new THREE.Vector3()
const screenRight = new THREE.Vector3()
const screenUp = new THREE.Vector3()
const pairNormalWorld = new THREE.Vector3()
const pairNormalLocal = new THREE.Vector3()
const localOrbitNormal = new THREE.Vector3(0, 0, 1)
const redContactWorldDirection = new THREE.Vector3()
const redContactOrbitDirection = new THREE.Vector3()
const silverContactWorldDirection = new THREE.Vector3()
const silverContactOrbitDirection = new THREE.Vector3()
const silverContactTangentWorld = new THREE.Vector3()
const silverContactTangentOrbit = new THREE.Vector3()
const silverHideWorldDirection = new THREE.Vector3()
const silverHideOrbitDirection = new THREE.Vector3()
const silverEmergeWorldDirection = new THREE.Vector3()
const silverEmergeOrbitDirection = new THREE.Vector3()
const arrivalContactWorld = new THREE.Vector3()
const arrivalContactDirections = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
const arrivalContactTangentWorld = new THREE.Vector3()
const arrivalContactTangents = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
const silverSurfaceInwardWorld = new THREE.Vector3()
const silverSurfaceInwardLocal = new THREE.Vector3()
const cameraForward = new THREE.Vector3()
const sourceRayPoint = new THREE.Vector3()
const sourceRayDirection = new THREE.Vector3()
const sourceWorld = new THREE.Vector3()
const sourceLocal = new THREE.Vector3()
const sourceTangentLocal = new THREE.Vector3()
const replaySourceTangentLocal = new THREE.Vector3()
const sourceDepthLocal = new THREE.Vector3()
const replayContactDirectionOrbit = new THREE.Vector3()
const replayIncomingTangentOrbit = new THREE.Vector3()
const replayBackOrbitDirection = new THREE.Vector3()
const orbitWorldQuaternion = new THREE.Quaternion()
const inverseOrbitWorldQuaternion = new THREE.Quaternion()
const globeToOrbitMatrix = new THREE.Matrix4()
const landscapeSourceAnchors = [
  new THREE.Vector2(-1.08, -0.82),
  new THREE.Vector2(-0.58, 1.08),
  new THREE.Vector2(-0.12, -1.08),
]
const portraitSourceAnchors = [
  new THREE.Vector2(-1.08, -0.34),
  new THREE.Vector2(-0.62, 1.08),
  new THREE.Vector2(-0.88, -0.62),
]

function setSourceWorldFromNdc(ndc: THREE.Vector2, planeDistance: number) {
  sourceRayPoint.set(ndc.x, ndc.y, 0.2).unproject(camera)
  sourceRayDirection.copy(sourceRayPoint).sub(cameraWorldPosition).normalize()
  const rayDistance = planeDistance / Math.max(0.001, sourceRayDirection.dot(cameraForward))
  sourceWorld.copy(cameraWorldPosition).addScaledVector(sourceRayDirection, rayDistance)
}

function animate(time: number) {
  const currentTime = time || performance.now()
  const delta = Math.min(0.05, Math.max(0.001, (currentTime - lastFrameTime) / 1000))
  lastFrameTime = currentTime
  const canAnimate = sceneVisible && heroVisible
  if (!canAnimate) return
  elapsed += delta * (reducedMotion ? 0.2 : 1)
  if (canAnimate && !introStarted) {
    introStarted = true
    root.dataset.introStarted = 'true'
  }
  if (canAnimate) introElapsed = Math.min(introDuration, introElapsed + delta)
  frame += 1
  framesInWindow += 1
  const introProgress = reducedMotion ? 1 : Math.min(1, introElapsed / introDuration)
  const globeReveal = smoothStep(0.86, 0.998, introProgress)
  root.dataset.introProgress = introProgress.toFixed(3)
  if (canAnimate && introProgress >= 1) {
    orbitRevealElapsed = Math.min(orbitRevealDuration, orbitRevealElapsed + delta)
  }
  const orbitRevealProgress = reducedMotion
    ? 1
    : smoothStep(orbitRevealDelay, orbitRevealDuration, orbitRevealElapsed)
  root.dataset.orbitReveal = orbitRevealProgress.toFixed(3)
  if (!orbitsReady && orbitRevealElapsed >= orbitCopyRevealDelay) {
    orbitsReady = true
    root.dataset.orbitsReady = 'true'
  }

  const now = performance.now()
  if (now - frameWindowStart >= 1000) {
    measuredFps = (framesInWindow * 1000) / (now - frameWindowStart)
    frameWindowStart = now
    framesInWindow = 0
  }

  pointerMotion.x = THREE.MathUtils.damp(pointerMotion.x, pointerTarget.x, 3.4, delta)
  pointerMotion.y = THREE.MathUtils.damp(pointerMotion.y, pointerTarget.y, 3.4, delta)
  const focusActive = hoveredOrbit >= 0
  const focusRigOffset = focusActive ? focusRigOffsets[hoveredOrbit] : null
  const idleTurn = reducedMotion ? 0 : Math.sin(elapsed * 0.12) * 0.055
  rig.rotation.x = THREE.MathUtils.damp(
    rig.rotation.x,
    -0.08 - pointerMotion.y * 0.04 + (focusRigOffset?.x ?? 0),
    3.1,
    delta,
  )
  rig.rotation.y = THREE.MathUtils.damp(
    rig.rotation.y,
    0.12 + idleTurn + pointerMotion.x * 0.045 + (focusRigOffset?.y ?? 0),
    3.1,
    delta,
  )
  rig.rotation.z = THREE.MathUtils.damp(rig.rotation.z, -0.035 + pointerMotion.x * 0.009, 3, delta)
  const cameraTargetFov = baseCameraFov * (focusActive ? (root.clientHeight > root.clientWidth ? 0.94 : 0.9) : 1)
  const nextCameraFov = THREE.MathUtils.damp(camera.fov, cameraTargetFov, 3.8, delta)
  if (Math.abs(nextCameraFov - camera.fov) > 0.0001) {
    camera.fov = nextCameraFov
    camera.updateProjectionMatrix()
  }
  const rigFocusShift = focusActive && root.clientWidth >= root.clientHeight ? 1.05 : 0
  rig.position.x = THREE.MathUtils.damp(
    rig.position.x,
    baseRigPosition.x + rigFocusShift,
    3.8,
    delta,
  )
  rig.position.y = THREE.MathUtils.damp(rig.position.y, baseRigPosition.y, 3.8, delta)

  rig.updateWorldMatrix(true, false)
  rig.getWorldQuaternion(rigWorldQuaternion)
  inverseRigWorldQuaternion.copy(rigWorldQuaternion).invert()
  rig.getWorldPosition(rigWorldPosition)
  camera.getWorldPosition(cameraWorldPosition)
  camera.getWorldDirection(cameraForward)
  viewTowardCamera.copy(cameraWorldPosition).sub(rigWorldPosition).normalize()
  screenRight.set(1, 0, 0).applyQuaternion(camera.quaternion)
  screenRight.addScaledVector(viewTowardCamera, -screenRight.dot(viewTowardCamera)).normalize()
  screenUp.crossVectors(viewTowardCamera, screenRight).normalize()

  const pairScreenAngle = THREE.MathUtils.degToRad(
    45 + Math.sin(elapsed * 0.18) + pointerMotion.x * 0.6,
  )
  const pairPolarAngle = THREE.MathUtils.degToRad(
    62 + Math.sin(elapsed * 0.14 + 0.7) * 1.3 - pointerMotion.y * 0.6,
  )
  const pairProjectedMagnitude = Math.sin(pairPolarAngle)
  const pairFacingMagnitude = Math.cos(pairPolarAngle)
  const pairHorizontalMagnitude = Math.cos(pairScreenAngle) * pairProjectedMagnitude
  const pairVerticalMagnitude = Math.sin(pairScreenAngle) * pairProjectedMagnitude

  if (focusActive) {
    globeRotationX = THREE.MathUtils.damp(globeRotationX, focusGlobeRotationX, 3.6, delta)
    globeRotationY = THREE.MathUtils.damp(globeRotationY, focusGlobeRotationY, 3.6, delta)
  } else if (!draggingGlobe) {
    globeRotationY += dragVelocityY * delta
    globeRotationX = THREE.MathUtils.clamp(globeRotationX + dragVelocityX * delta, -0.46, 0.46)
    dragVelocityX = THREE.MathUtils.damp(dragVelocityX, 0, 4.2, delta)
    dragVelocityY = THREE.MathUtils.damp(dragVelocityY, 0, 4.2, delta)
  }
  if (!focusActive) globeRotationY += delta * (reducedMotion ? 0.008 : 0.035)
  globeGroup.rotation.y = globeRotationY
  globeGroup.rotation.x = globeRotationX + Math.sin(elapsed * 0.16) * (focusActive ? 0.008 : 0.025)
  root.dataset.globeRotation = `${globeGroup.rotation.x.toFixed(3)},${globeGroup.rotation.y.toFixed(3)}`
  wire.rotation.y -= delta * 0.018
  wire.rotation.z += delta * 0.01
  backgroundStars.rotation.y = elapsed * 0.0012

  globeGroup.updateWorldMatrix(true, false)
  globeGroup.getWorldQuaternion(globeWorldQuaternion)
  inverseGlobeWorldQuaternion.copy(globeWorldQuaternion).invert()
  if (focusActive && arrivalContactDirections[hoveredOrbit].lengthSq() > 0.5) {
    focusDirectionLocal.copy(arrivalContactDirections[hoveredOrbit]).normalize()
  } else {
    focusDirectionLocal.copy(focusDirectionWorld).applyQuaternion(inverseGlobeWorldQuaternion).normalize()
  }
  focusStrength = THREE.MathUtils.damp(focusStrength, focusStrengthTarget, 4.8, delta)

  globeSurface.material.uniforms.uTime.value = elapsed
  globeSurface.material.uniforms.uFocusDirection.value.copy(focusDirectionLocal)
  globeSurface.material.uniforms.uFocusStrength.value = focusStrength
  globeSurface.material.uniforms.uReveal.value = globeReveal
  rimMaterial.uniforms.uReveal.value = smoothStep(0.76, 0.985, introProgress)
  rimMaterial.uniforms.uTime.value = elapsed
  const coreReveal = smoothStep(0.62, 0.94, introProgress)
  core.visible = coreReveal > 0.001
  coreMaterial.opacity = coreReveal
  coreMaterial.depthWrite = coreReveal > 0.88
  wireMaterial.opacity = 0.012 * smoothStep(0.9, 0.998, introProgress)

  pulseProgress = Math.min(2, pulseProgress + delta / 1.35)
  const pulseStrength = pulseProgress < 1 ? Math.pow(Math.sin(pulseProgress * Math.PI), 1.2) : 0
  globeSurface.material.uniforms.uPulseDirection.value.copy(pulseDirectionLocal)
  globeSurface.material.uniforms.uPulseProgress.value = pulseProgress
  globeSurface.material.uniforms.uPulseStrength.value = pulseStrength
  if (pulseProgress >= 1 && root.dataset.interaction === 'pulse') {
    root.dataset.interaction = globeHovered ? 'hover' : 'idle'
  }

  if (canAnimate && introProgress >= 1) {
    replayClock += delta
    if (replayClock >= replayDelay && replayElapsed > replayDuration) {
      replayClock = 0
      replayElapsed = 0
    }
  }
  if (canAnimate && replayElapsed <= replayDuration) replayElapsed += delta
  const replayActive = replayElapsed <= replayDuration
  const replayProgress = Math.min(1, replayElapsed / replayDuration)
  root.dataset.replayProgress = replayActive ? replayProgress.toFixed(3) : 'idle'
  const introActive = introProgress < 1
  const arrivalProgress = introActive ? introProgress : 2
  const arrivalStrength = introActive ? 1 : 0
  const replayParticleProgress = replayActive ? replayProgress : 2
  const resonanceProgress = introActive ? introProgress : replayActive ? replayProgress : 2
  const resonanceStrength = introActive ? 1 : replayActive ? 0.66 : 0
  const introWaveProgress = 0.015 + smoothStep(0.79, 0.995, resonanceProgress) * 0.58
  const introWaveStrength =
    smoothStep(0.76, 0.84, resonanceProgress) *
    (1 - smoothStep(0.95, 1, resonanceProgress)) *
    resonanceStrength
  const resonancePulse =
    smoothStep(0.82, 0.9, resonanceProgress) *
    (1 - smoothStep(0.965, 1, resonanceProgress)) *
    resonanceStrength
  const settledConvergence = introActive ? smoothStep(0.89, 1, introProgress) * 0.16 : 0.16
  const attachmentStrength = introActive ? smoothStep(0.62, 0.73, introProgress) : 0
  const attachmentProgress = 0.015 + smoothStep(0.66, 1, introProgress) * 0.64
  const sourcePlaneDistance = sourceRayPoint
    .copy(rigWorldPosition)
    .sub(cameraWorldPosition)
    .dot(cameraForward)
  const sourceAnchors = root.clientHeight > root.clientWidth ? portraitSourceAnchors : landscapeSourceAnchors

  orbitStates.forEach((orbit) => {
    const selected = orbit.index === hoveredOrbit
    orbit.targetEnergy = selected ? 1 : hoveredOrbit >= 0 ? -0.16 : 0
    orbit.targetLift = selected ? 0.08 : 0
    orbit.energy = THREE.MathUtils.damp(orbit.energy, orbit.targetEnergy, 5.2, delta)
    orbit.lift = THREE.MathUtils.damp(orbit.lift, orbit.targetLift, 5.6, delta)

    if (orbit.index === 0) {
      const precessionTime = elapsed * orbit.precessionSpeed + orbit.precessionPhase
      precessionEuler.set(
        Math.sin(precessionTime) * 0.055,
        Math.cos(precessionTime * 0.86) * 0.048,
        Math.sin(precessionTime * 0.63) * 0.025,
      )
      precessionQuaternion.setFromEuler(precessionEuler)
      orbit.group.quaternion.copy(orbit.baseQuaternion).premultiply(precessionQuaternion)
    } else {
      const horizontalDirection = orbit.index === 1 ? 1 : -1
      pairNormalWorld
        .copy(viewTowardCamera)
        .multiplyScalar(pairFacingMagnitude)
        .addScaledVector(screenRight, pairHorizontalMagnitude * horizontalDirection)
        .addScaledVector(screenUp, pairVerticalMagnitude)
        .normalize()
      pairNormalLocal.copy(pairNormalWorld).applyQuaternion(inverseRigWorldQuaternion).normalize()
      orbit.group.quaternion.setFromUnitVectors(localOrbitNormal, pairNormalLocal)
    }
    orbit.group.position.z = orbit.lift
    const lineOpacity = 0.016 + orbit.energy * 0.024
    orbit.lineMaterial.opacity = lineOpacity * orbitRevealProgress
    orbit.streamMaterial.uniforms.uEnergy.value = orbit.energy
    orbit.streamMaterial.uniforms.uReveal.value = orbitRevealProgress
    orbit.streamMaterial.uniforms.uTime.value = elapsed
    updatePulseTrail(orbit.pulseTrail, elapsed, orbit.energy, orbitRevealProgress)
    orbit.arrivalMaterial.uniforms.uProgress.value = arrivalProgress
    orbit.arrivalMaterial.uniforms.uStrength.value = arrivalStrength
    orbit.arrivalMaterial.uniforms.uSurfaceMode.value = 1
    orbit.arrivalMaterial.uniforms.uTime.value = elapsed
    orbit.replayMaterial.uniforms.uProgress.value = replayParticleProgress
    orbit.replayMaterial.uniforms.uStrength.value = replayActive
      ? orbit.index === 1
        ? 0.64
        : orbit.index === 2
          ? 0.76
          : 0.48
      : 0
    orbit.replayMaterial.uniforms.uTime.value = elapsed

    orbit.group.updateWorldMatrix(true, false)
    setSourceWorldFromNdc(sourceAnchors[orbit.index], sourcePlaneDistance)
    sourceLocal.copy(sourceWorld)
    orbit.group.worldToLocal(sourceLocal)
    orbit.group.getWorldQuaternion(orbitWorldQuaternion)
    inverseOrbitWorldQuaternion.copy(orbitWorldQuaternion).invert()
    sourceTangentLocal
      .copy(orbit.index === 2 ? screenUp : screenRight)
      .applyQuaternion(inverseOrbitWorldQuaternion)
      .normalize()
    replaySourceTangentLocal
      .copy(screenRight)
      .applyQuaternion(inverseOrbitWorldQuaternion)
      .normalize()
    sourceDepthLocal.copy(cameraForward).applyQuaternion(inverseOrbitWorldQuaternion).normalize()
    globeToOrbitMatrix.copy(orbit.group.matrixWorld).invert().multiply(globeGroup.matrixWorld)
    orbit.arrivalMaterial.uniforms.uSourcePosition.value.copy(sourceLocal)
    orbit.arrivalMaterial.uniforms.uSourceTangent.value.copy(sourceTangentLocal)
    orbit.arrivalMaterial.uniforms.uSourceDepth.value.copy(sourceDepthLocal)
    orbit.arrivalMaterial.uniforms.uGlobeToOrbit.value.copy(globeToOrbitMatrix)
    orbit.replayMaterial.uniforms.uSourcePosition.value.copy(sourceLocal)
    orbit.replayMaterial.uniforms.uSourceTangent.value.copy(replaySourceTangentLocal)
    orbit.replayMaterial.uniforms.uSourceDepth.value.copy(sourceDepthLocal)

    if (orbit.index === 0) {
      redContactWorldDirection
        .copy(viewTowardCamera)
        .multiplyScalar(0.14)
        .addScaledVector(screenRight, -0.9)
        .addScaledVector(screenUp, 0.32)
        .normalize()
      redContactOrbitDirection
        .copy(redContactWorldDirection)
        .applyQuaternion(inverseOrbitWorldQuaternion)
        .normalize()
      orbit.arrivalMaterial.uniforms.uContactPoint.value
        .copy(redContactOrbitDirection)
        .multiplyScalar(globeRadius * 1.035)
    }

    if (orbit.index === 1) {
      silverContactWorldDirection
        .copy(viewTowardCamera)
        .multiplyScalar(0.14)
        .addScaledVector(screenRight, 0.88)
        .addScaledVector(screenUp, 0.42)
        .normalize()
      silverContactOrbitDirection
        .copy(silverContactWorldDirection)
        .applyQuaternion(inverseOrbitWorldQuaternion)
        .normalize()
      silverHideWorldDirection
        .copy(viewTowardCamera)
        .multiplyScalar(-0.08)
        .addScaledVector(screenRight, -0.78)
        .addScaledVector(screenUp, 0.62)
        .normalize()
      silverHideOrbitDirection
        .copy(silverHideWorldDirection)
        .applyQuaternion(inverseOrbitWorldQuaternion)
        .normalize()
      silverEmergeWorldDirection
        .copy(viewTowardCamera)
        .multiplyScalar(-0.18)
        .addScaledVector(screenRight, 0.86)
        .addScaledVector(screenUp, -0.38)
        .normalize()
      silverEmergeOrbitDirection
        .copy(silverEmergeWorldDirection)
        .applyQuaternion(inverseOrbitWorldQuaternion)
        .normalize()
      silverContactTangentWorld
        .copy(screenRight)
        .multiplyScalar(-0.42)
        .addScaledVector(screenUp, 0.88)
      silverContactTangentWorld.addScaledVector(
        silverContactWorldDirection,
        -silverContactTangentWorld.dot(silverContactWorldDirection),
      )
      silverContactTangentWorld.normalize()
      silverContactTangentOrbit
        .copy(silverContactTangentWorld)
        .applyQuaternion(inverseOrbitWorldQuaternion)
        .normalize()
      orbit.arrivalMaterial.uniforms.uContactPoint.value
        .copy(silverContactOrbitDirection)
        .multiplyScalar(globeRadius * 1.035)
      orbit.arrivalMaterial.uniforms.uContactTangent.value.copy(silverContactTangentOrbit)
      orbit.arrivalMaterial.uniforms.uHidePoint.value
        .copy(silverHideOrbitDirection)
        .multiplyScalar(globeRadius * 1.035)
      orbit.arrivalMaterial.uniforms.uEmergePoint.value
        .copy(silverEmergeOrbitDirection)
        .multiplyScalar(globeRadius * 1.13)
    }

    replayContactDirectionOrbit
      .copy(orbit.arrivalMaterial.uniforms.uContactPoint.value)
      .normalize()
    replayIncomingTangentOrbit
      .copy(orbit.arrivalMaterial.uniforms.uContactPoint.value)
      .sub(sourceLocal)
      .addScaledVector(
        replayContactDirectionOrbit,
        -replayIncomingTangentOrbit.dot(replayContactDirectionOrbit),
      )
      .normalize()
    replayBackOrbitDirection
      .copy(replayContactDirectionOrbit)
      .multiplyScalar(0.2)
      .addScaledVector(sourceDepthLocal, 0.96)
      .addScaledVector(replayIncomingTangentOrbit, 0.1)
      .normalize()
    orbit.replayMaterial.uniforms.uContactPoint.value.copy(
      orbit.arrivalMaterial.uniforms.uContactPoint.value,
    )
    orbit.replayMaterial.uniforms.uContactTangent.value.copy(replayIncomingTangentOrbit)
    orbit.replayMaterial.uniforms.uBackPoint.value
      .copy(replayBackOrbitDirection)
      .multiplyScalar(globeRadius * 1.035)

    arrivalContactWorld.copy(orbit.arrivalMaterial.uniforms.uContactPoint.value)
    orbit.group.localToWorld(arrivalContactWorld)
    globeGroup.worldToLocal(arrivalContactWorld)
    arrivalContactDirections[orbit.index].copy(arrivalContactWorld).normalize()
    arrivalContactTangentWorld
      .copy(orbit.arrivalMaterial.uniforms.uContactTangent.value)
      .applyQuaternion(orbitWorldQuaternion)
      .applyQuaternion(inverseGlobeWorldQuaternion)
      .normalize()
    if (orbit.index === 1) {
      silverSurfaceInwardWorld
        .copy(viewTowardCamera)
        .addScaledVector(
          silverContactWorldDirection,
          -viewTowardCamera.dot(silverContactWorldDirection),
        )
        .normalize()
      silverSurfaceInwardLocal
        .copy(silverSurfaceInwardWorld)
        .applyQuaternion(inverseGlobeWorldQuaternion)
        .normalize()
      arrivalContactTangents[orbit.index].copy(silverSurfaceInwardLocal)
    } else {
      arrivalContactTangents[orbit.index].copy(arrivalContactTangentWorld)
    }
  })

  for (let index = 0; index < 3; index += 1) {
    globeSurface.material.uniforms.uIntroWaveDirections.value[index].copy(
      arrivalContactDirections[index],
    )
    globeSurface.material.uniforms.uIntroWaveTangents.value[index].copy(
      arrivalContactTangents[index],
    )
  }
  globeSurface.material.uniforms.uIntroWaveProgress.value = introWaveProgress
  globeSurface.material.uniforms.uIntroWaveStrength.value = introWaveStrength
  globeSurface.material.uniforms.uAttachmentProgress.value = attachmentProgress
  globeSurface.material.uniforms.uAttachmentStrength.value = attachmentStrength
  globeSurface.material.uniforms.uConvergence.value = settledConvergence + resonancePulse * 0.72

  const totalEnergy = orbitStates.reduce((sum, orbit) => sum + Math.max(0, orbit.energy), 0) / 3
  const resonanceEnergy = resonancePulse * 0.58
  globeSurface.material.uniforms.uEnergy.value = totalEnergy + resonanceEnergy
  rimMaterial.uniforms.uEnergy.value = totalEnergy + resonanceEnergy * 0.5
  positionHtmlLabels()
  composer.render()

  if (frame === 2) root.dataset.renderReady = 'true'
  if ((diagnosticsSamples === 0 && elapsed > 1.45) || (diagnosticsSamples === 1 && elapsed > 2.9)) {
    sampleCanvas()
    diagnosticsSamples += 1
  } else {
    root.dataset.fps = String(Number(measuredFps.toFixed(1)))
    root.dataset.hovered = String(hoveredOrbit)
    root.dataset.ringLifts = orbitStates.map((orbit) => Number(orbit.lift.toFixed(3))).join(',')
  }
}

syncAnimationLoop()

const cleanup = () => {
  if (disposed) return
  disposed = true
  renderer.setAnimationLoop(null)
  animationLoopRunning = false
  eventController.abort()
  cancelOrbitClear()
  cancelOverviewReturn()
  resizeObserver.disconnect()
  heroObserver.disconnect()
  backgroundGeometry.dispose()
  backgroundMaterial.dispose()
  coreGeometry.dispose()
  coreMaterial.dispose()
  wireGeometry.dispose()
  wireMaterial.dispose()
  globeSurface.geometry.dispose()
  globeSurface.material.dispose()
  rimGeometry.dispose()
  rimMaterial.dispose()
  orbitOccluderGeometry.dispose()
  orbitOccluderMaterial.dispose()
  globeHitGeometry.dispose()
  globeHitMaterial.dispose()
  orbitLineGeometry.dispose()
  orbitStates.forEach((orbit) => {
    orbit.lineMaterial.dispose()
    orbit.pulseTrail.geometry.dispose()
    orbit.pulseTrail.material.dispose()
    orbit.streamMaterial.dispose()
    orbit.arrivalMaterial.dispose()
    orbit.replayMaterial.dispose()
    const geometries = new Set<THREE.BufferGeometry>()
    orbit.group.children.forEach((child) => {
      if (child instanceof THREE.Points) geometries.add(child.geometry)
    })
    geometries.forEach((geometry) => geometry.dispose())
  })
  bloomPass.dispose()
  composer.dispose()
  renderer.dispose()
  delete root.dataset.renderReady
  delete root.dataset.introStarted
  delete root.dataset.orbitsReady
  delete root.dataset.sceneVisible
  delete root.dataset.animationLoop
}

return cleanup
}
