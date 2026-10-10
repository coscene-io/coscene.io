import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Hand,
  MapPin,
  ScanLine,
  Video,
} from 'lucide-react'
import * as THREE from 'three'
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js'
import './data-assets-globe-study.css'

type Coordinate = [number, number]

type GeoGeometry = {
  type: 'Polygon' | 'MultiPolygon'
  coordinates: Coordinate[][] | Coordinate[][][]
}

type GeoFeature = {
  geometry: GeoGeometry
  properties?: {
    adcode?: number
  }
}

type GeoCollection = {
  features: GeoFeature[]
}

type LocationDefinition = {
  administrativeRegion: string
  boundary: string
  coordinates: Coordinate
  dataTypes: string[]
  dexterousHands?: string[]
  featuredScenes?: string[]
  monthlyCapacity?: {
    unit: string
    value: string
  }
  id: string
  name: string
  province: string
  provinceBoundary?: string
  robotModels?: string[]
}

type MediaAssetDefinition = {
  id: string
  locationId: string
  poster: string
  video: string
}

type BoundaryLayer = {
  core: THREE.ShaderMaterial
  coreWidth: number
  group: THREE.Group
  targetCore: number
}

type BoundaryStyle = {
  coreColor: number
  coreOpacity: number
  coreWidth: number
}

type RegionMaskLayer = {
  context: CanvasRenderingContext2D
  intensity: number
  material: THREE.ShaderMaterial
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>
  texture: THREE.CanvasTexture
}

type RegionMaskStyle = {
  baseOpacity: number
  featherOpacity: number
  renderOrder: number
  settledOpacity: number
  sweepOpacity: number
}

type SceneController = {
  destroy: () => void
  setActive: (active: boolean) => void
  setActiveCity: (index: number) => void
}

type EarthTextureSet = {
  cloud: string
  day: string
  dayTiles?: string[]
  elevation: string
  elevationResolution: [number, number]
  quality: '2k' | '4k' | '8k'
  water: string
}

const locations: LocationDefinition[] = [
  {
    administrativeRegion: '上海市',
    boundary: '310000',
    coordinates: [121.473701, 31.230416],
    dataTypes: ['真机数据'],
    id: 'shanghai',
    name: '上海',
    province: '上海市',
  },
  {
    administrativeRegion: '重庆市',
    boundary: '500000',
    coordinates: [106.551556, 29.563009],
    dataTypes: ['真机数据'],
    id: 'chongqing',
    name: '重庆',
    province: '重庆市',
  },
  {
    administrativeRegion: '江西省 · 赣州市',
    boundary: '360700',
    coordinates: [114.940278, 25.85097],
    dataTypes: ['真机数据'],
    id: 'ganzhou',
    name: '赣州',
    province: '江西省',
    provinceBoundary: '360000',
  },
  {
    administrativeRegion: '江苏省 · 扬州市',
    boundary: '321000',
    coordinates: [119.421003, 32.393159],
    dataTypes: ['真机数据'],
    id: 'yangzhou',
    name: '扬州',
    province: '江苏省',
    provinceBoundary: '320000',
  },
  {
    administrativeRegion: '四川省 · 成都市',
    boundary: '510100',
    coordinates: [104.066541, 30.572269],
    dataTypes: ['真机数据'],
    id: 'chengdu',
    name: '成都',
    province: '四川省',
    provinceBoundary: '510000',
  },
  {
    administrativeRegion: '浙江省 · 嘉兴市',
    boundary: '330400',
    coordinates: [120.755486, 30.746129],
    dataTypes: ['真机数据'],
    id: 'jiaxing',
    name: '嘉兴',
    province: '浙江省',
    provinceBoundary: '330000',
  },
  {
    administrativeRegion: '广东省 · 惠州市 · 惠阳区',
    boundary: '441303',
    coordinates: [114.456696, 22.788734],
    dataTypes: ['真机数据'],
    id: 'huiyang',
    name: '惠阳',
    province: '广东省惠阳区',
    provinceBoundary: '440000',
  },
]

const mediaAssets: MediaAssetDefinition[] = [
  {
    id: 'shanghai-collection-checkout',
    locationId: 'shanghai',
    poster: '/assets/platform-bridge/robot-collection-checkout.jpg',
    video: '/assets/platform-bridge/robot-collection-checkout.mp4',
  },
  {
    id: 'chongqing-collection-shelf',
    locationId: 'chongqing',
    poster: '/assets/platform-bridge/robot-collection-shelf.jpg',
    video: '/assets/platform-bridge/robot-collection-shelf.mp4',
  },
  {
    id: 'ganzhou-kitchen-teleop',
    locationId: 'ganzhou',
    poster: '/assets/platform-concept/unitree-task-data-poster.jpg',
    video: '/assets/platform-bridge/unitree-kitchen-teleop.m4v',
  },
  {
    id: 'yangzhou-livingroom-teleop',
    locationId: 'yangzhou',
    poster: '/assets/platform-concept/unitree-official-motion-poster.jpg',
    video: '/assets/platform-bridge/unitree-livingroom-teleop.m4v',
  },
  {
    id: 'chengdu-retail-teleop',
    locationId: 'chengdu',
    poster: '/assets/platform-concept/unitree-motion-composite-v2.jpg',
    video: '/assets/platform-bridge/unitree-retail-teleop.m4v',
  },
  {
    id: 'jiaxing-task-data',
    locationId: 'jiaxing',
    poster: '/assets/platform-concept/unitree-12s.jpg',
    video: '/assets/platform-concept/unitree-task-data.mp4',
  },
  {
    id: 'huiyang-motion',
    locationId: 'huiyang',
    poster: '/assets/platform-concept/unitree-27s.jpg',
    video: '/assets/platform-concept/unitree-official-motion-1080.mp4',
  },
]

const locationIndexById = new Map(locations.map((location, index) => [location.id, index]))

function formatProfileValues(values?: string[]) {
  return values?.length ? values.join(' / ') : '待确认'
}

const globeRadius = 4.25
const atmosphereRadiusScale = 1.05
const baseRotation = {
  x: THREE.MathUtils.degToRad(12),
  y: THREE.MathUtils.degToRad(165),
}

const visualPalette = {
  electricBlue: 0x58bfff,
  iceWhite: 0xe8f8ff,
  ink: 0x020305,
  silver: 0xc6d4dc,
  warmOrange: 0xff9852,
  warmWhite: 0xfff3ea,
}

async function loadTexture(loader: THREE.ImageBitmapLoader, url: string) {
  const image = await loader.loadAsync(url)
  const texture = new THREE.Texture(image)
  texture.needsUpdate = true
  return texture
}

function yieldToMainThread() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, 0))
}

function selectEarthTextureSet(renderer: THREE.WebGLRenderer, compact: boolean): EarthTextureSet {
  if (compact) {
    return {
      cloud: '/assets/data-assets-globe/earth-clouds-1k.png',
      day: '/assets/data-assets-globe/earth-day-summer-2k.jpg',
      elevation: '/assets/data-assets-globe/earth-elevation-2k.jpg',
      elevationResolution: [2048, 1024],
      quality: '2k',
      water: '/assets/data-assets-globe/earth-water-2k.png',
    }
  }

  const useEightK = window.innerWidth >= 1800 && renderer.capabilities.maxTextureSize >= 8192
  return {
    cloud: '/assets/data-assets-globe/earth-clouds-2k.png',
    day: useEightK
      ? '/assets/data-assets-globe/earth-day-summer-8k.jpg'
      : '/assets/data-assets-globe/earth-day-summer-4k.jpg',
    dayTiles: useEightK
      ? [0, 1, 2, 3].map((index) => `/assets/data-assets-globe/earth-day-summer-8k-uastc-${index}.ktx2`)
      : undefined,
    elevation: '/assets/data-assets-globe/earth-elevation-4k.jpg',
    elevationResolution: [4096, 2048],
    quality: useEightK ? '8k' : '4k',
    water: '/assets/data-assets-globe/earth-water-4k.png',
  }
}

function lonLatToVector([longitude, latitude]: Coordinate, radius: number) {
  const phi = THREE.MathUtils.degToRad(90 - latitude)
  const theta = THREE.MathUtils.degToRad(longitude + 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

function getGeometryRings(geometry: GeoGeometry) {
  if (geometry.type === 'Polygon') return geometry.coordinates as Coordinate[][]
  return (geometry.coordinates as Coordinate[][][]).flat()
}

function getGeometryPolygons(geometry: GeoGeometry) {
  if (geometry.type === 'Polygon') return [geometry.coordinates as Coordinate[][]]
  return geometry.coordinates as Coordinate[][][]
}

async function makeBoundarySegmentGeometry(collection: GeoCollection, radius: number) {
  const uniqueSegments = new Map<string, [Coordinate, Coordinate]>()
  let processedSegments = 0
  let sliceStarted = performance.now()
  for (const feature of collection.features) {
    for (const ring of getGeometryRings(feature.geometry)) {
      for (let index = 0; index < ring.length - 1; index += 1) {
        const start = ring[index]
        const end = ring[index + 1]
        const startKey = `${start[0].toFixed(5)},${start[1].toFixed(5)}`
        const endKey = `${end[0].toFixed(5)},${end[1].toFixed(5)}`
        if (startKey === endKey) continue
        const key = startKey < endKey ? `${startKey}|${endKey}` : `${endKey}|${startKey}`
        if (!uniqueSegments.has(key)) uniqueSegments.set(key, [start, end])
        processedSegments += 1
        if (processedSegments % 512 === 0 && performance.now() - sliceStarted >= 8) {
          await yieldToMainThread()
          sliceStarted = performance.now()
        }
      }
    }
  }

  const positions: number[] = []
  processedSegments = 0
  sliceStarted = performance.now()
  for (const [start, end] of uniqueSegments.values()) {
    const span = Math.max(Math.abs(end[0] - start[0]), Math.abs(end[1] - start[1]))
    const steps = Math.max(1, Math.ceil(span / 0.34))
    let previous = lonLatToVector(start, radius)
    for (let step = 1; step <= steps; step += 1) {
      const progress = step / steps
      const current = lonLatToVector([
        THREE.MathUtils.lerp(start[0], end[0], progress),
        THREE.MathUtils.lerp(start[1], end[1], progress),
      ], radius)
      positions.push(previous.x, previous.y, previous.z, current.x, current.y, current.z)
      previous = current
      processedSegments += 1
      if (processedSegments % 512 === 0 && performance.now() - sliceStarted >= 8) {
        await yieldToMainThread()
        sliceStarted = performance.now()
      }
    }
  }

  const geometry = new LineSegmentsGeometry()
  geometry.setPositions(positions)
  geometry.userData.segmentCount = uniqueSegments.size
  return geometry
}

function makeBoundaryLayer(geometry: LineSegmentsGeometry, style: BoundaryStyle) {
  const group = new THREE.Group()
  const coreMaterial = new THREE.ShaderMaterial({
    blending: THREE.NormalBlending,
    depthTest: true,
    depthWrite: false,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vAcross;

      void main() {
        float edgeDistance = abs(vAcross);
        float transition = max(fwidth(edgeDistance), 0.0001);
        float coverage = 1.0 - smoothstep(1.0 - transition, 1.0, edgeDistance);
        float alpha = uOpacity * coverage;
        if (alpha < 0.001) discard;
        gl_FragColor = vec4(uColor, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
    uniforms: {
      uColor: { value: new THREE.Color(style.coreColor) },
      uLineWidth: { value: style.coreWidth },
      uOpacity: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader: `
      uniform float uLineWidth;
      uniform vec2 uResolution;
      attribute vec3 instanceStart;
      attribute vec3 instanceEnd;
      varying float vAcross;

      void main() {
        vec4 viewStart = modelViewMatrix * vec4(instanceStart, 1.0);
        vec4 viewEnd = modelViewMatrix * vec4(instanceEnd, 1.0);
        vec4 clipStart = projectionMatrix * viewStart;
        vec4 clipEnd = projectionMatrix * viewEnd;
        vec2 ndcStart = clipStart.xy / clipStart.w;
        vec2 ndcEnd = clipEnd.xy / clipEnd.w;
        vec2 screenStart = (ndcStart * 0.5 + 0.5) * uResolution;
        vec2 screenEnd = (ndcEnd * 0.5 + 0.5) * uResolution;
        vec2 direction = screenEnd - screenStart;
        float directionLength = max(length(direction), 0.0001);
        vec2 normal = vec2(-direction.y, direction.x) / directionLength;
        float along = clamp(position.y, 0.0, 1.0);
        vec2 screenPosition = mix(screenStart, screenEnd, along);
        screenPosition += normal * position.x * uLineWidth * 0.5;
        vec2 ndcPosition = screenPosition / uResolution * 2.0 - 1.0;
        vec4 clipPosition = mix(clipStart, clipEnd, along);
        clipPosition.xy = ndcPosition * clipPosition.w;
        gl_Position = clipPosition;
        vAcross = position.x;
      }
    `,
  })
  coreMaterial.toneMapped = false
  const coreLine = new THREE.Mesh(geometry, coreMaterial)

  coreLine.renderOrder = 6
  group.add(coreLine)

  return {
    core: coreMaterial,
    coreWidth: style.coreWidth,
    group,
    targetCore: style.coreOpacity,
  } satisfies BoundaryLayer
}

function makeAtmosphereRampTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 2
  const context = canvas.getContext('2d')
  const texture = new THREE.CanvasTexture(canvas)
  if (!context) return texture

  const gradient = context.createLinearGradient(0, 0, canvas.width, 0)
  gradient.addColorStop(0, 'rgba(158, 224, 242, 0.52)')
  gradient.addColorStop(0.03, 'rgba(206, 242, 252, 0.7)')
  gradient.addColorStop(0.12, 'rgba(78, 194, 246, 0.9)')
  gradient.addColorStop(0.3, 'rgba(38, 127, 248, 0.8)')
  gradient.addColorStop(0.56, 'rgba(37, 77, 229, 0.64)')
  gradient.addColorStop(0.8, 'rgba(42, 38, 166, 0.36)')
  gradient.addColorStop(1, 'rgba(8, 11, 42, 0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, canvas.width, canvas.height)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.generateMipmaps = false
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearFilter
  return texture
}

function makeRegionMaskLayer(
  compact: boolean,
  geometry: THREE.SphereGeometry,
  style: RegionMaskStyle,
): RegionMaskLayer {
  const canvas = document.createElement('canvas')
  canvas.width = compact ? 512 : 1024
  canvas.height = compact ? 512 : 1024
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Unable to create city region mask context')

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.NoColorSpace
  texture.generateMipmaps = false
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearFilter

  const material = new THREE.ShaderMaterial({
    depthTest: true,
    depthWrite: false,
    fragmentShader: `
      uniform sampler2D uMask;
      uniform vec4 uMaskBounds;
      uniform vec3 uIce;
      uniform vec3 uWhite;
      uniform float uBaseOpacity;
      uniform float uFeatherOpacity;
      uniform float uIntensity;
      uniform float uOpacity;
      uniform float uProgress;
      uniform float uSettledOpacity;
      uniform float uSweepOpacity;
      varying vec2 vUv;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPosition;

      void main() {
        vec2 boundsMin = uMaskBounds.xy;
        vec2 boundsMax = uMaskBounds.zw;
        vec2 localUv = (vUv - boundsMin) / max(boundsMax - boundsMin, vec2(0.0001));
        if (localUv.x < 0.0 || localUv.x > 1.0 || localUv.y < 0.0 || localUv.y > 1.0) discard;

        float mask = texture2D(uMask, localUv).a;
        if (mask < 0.003) discard;
        float interior = smoothstep(0.58, 0.94, mask);
        float feather = smoothstep(0.015, 0.46, mask) * (1.0 - interior);
        float settled = smoothstep(0.12, 0.7, uProgress);
        float sweepPosition = mix(-0.3, 1.42, smoothstep(0.02, 0.94, uProgress));
        float sweepCoordinate = localUv.x + localUv.y * 0.14;
        float sweep = 1.0 - smoothstep(0.025, 0.17, abs(sweepCoordinate - sweepPosition));
        vec3 normalWorld = normalize(vNormalWorld);
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float frontFacing = smoothstep(0.02, 0.34, dot(normalWorld, viewDirection));
        float alpha = uOpacity * uIntensity * frontFacing * (
          interior * (uBaseOpacity + settled * uSettledOpacity + sweep * uSweepOpacity)
          + feather * (uFeatherOpacity + sweep * uSweepOpacity * 0.34)
        );
        if (alpha < 0.001) discard;
        vec3 color = mix(uIce, uWhite, 0.42 + sweep * 0.48);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    uniforms: {
      uBaseOpacity: { value: style.baseOpacity },
      uFeatherOpacity: { value: style.featherOpacity },
      uIce: { value: new THREE.Color(0xcceeff) },
      uIntensity: { value: 1 },
      uMask: { value: texture },
      uMaskBounds: { value: new THREE.Vector4() },
      uOpacity: { value: 0 },
      uProgress: { value: 0 },
      uSettledOpacity: { value: style.settledOpacity },
      uSweepOpacity: { value: style.sweepOpacity },
      uWhite: { value: new THREE.Color(visualPalette.iceWhite) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPosition;

      void main() {
        vUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
  })
  material.toneMapped = false
  const mesh = new THREE.Mesh(geometry, material)
  mesh.renderOrder = style.renderOrder
  mesh.visible = false
  return { context, intensity: 1, material, mesh, texture }
}

function paintRegionMask(layer: RegionMaskLayer, collection: GeoCollection) {
  const polygons = collection.features.flatMap((feature) => getGeometryPolygons(feature.geometry))
  const coordinates = polygons.flatMap((polygon) => polygon.flat())
  const longitudes = coordinates.map(([longitude]) => longitude)
  const latitudes = coordinates.map(([, latitude]) => latitude)
  const longitudeMin = Math.min(...longitudes)
  const longitudeMax = Math.max(...longitudes)
  const latitudeMin = Math.min(...latitudes)
  const latitudeMax = Math.max(...latitudes)
  const longitudeSpan = Math.max(0.12, longitudeMax - longitudeMin)
  const latitudeSpan = Math.max(0.12, latitudeMax - latitudeMin)
  const longitudePadding = Math.max(0.08, longitudeSpan * 0.16)
  const latitudePadding = Math.max(0.08, latitudeSpan * 0.16)
  const left = longitudeMin - longitudePadding
  const right = longitudeMax + longitudePadding
  const bottom = latitudeMin - latitudePadding
  const top = latitudeMax + latitudePadding
  const path = new Path2D()
  const width = layer.context.canvas.width
  const height = layer.context.canvas.height

  polygons.forEach((polygon) => {
    polygon.forEach((ring) => {
      ring.forEach(([longitude, latitude], index) => {
        const x = ((longitude - left) / (right - left)) * width
        const y = ((top - latitude) / (top - bottom)) * height
        if (index === 0) path.moveTo(x, y)
        else path.lineTo(x, y)
      })
      path.closePath()
    })
  })

  layer.context.clearRect(0, 0, width, height)
  layer.context.save()
  layer.context.fillStyle = 'rgba(220, 246, 255, 0.34)'
  layer.context.shadowBlur = width * 0.022
  layer.context.shadowColor = 'rgba(188, 235, 255, 0.72)'
  layer.context.fill(path, 'evenodd')
  layer.context.restore()
  layer.context.fillStyle = '#ffffff'
  layer.context.fill(path, 'evenodd')
  layer.texture.needsUpdate = true

  const bounds = new THREE.Vector4(
    (left + 180) / 360,
    (bottom + 90) / 180,
    (right + 180) / 360,
    (top + 90) / 180,
  )
  const approximateArea = longitudeSpan * latitudeSpan * Math.cos(THREE.MathUtils.degToRad((top + bottom) * 0.5))
  layer.intensity = THREE.MathUtils.clamp(1.06 - Math.log2(1 + approximateArea) * 0.075, 0.72, 1.04)
  layer.material.uniforms.uMaskBounds.value.copy(bounds)
  layer.material.uniforms.uIntensity.value = layer.intensity
}

async function createScene(
  canvas: HTMLCanvasElement,
  startActive = true,
): Promise<SceneController> {
  const compact = window.matchMedia('(max-width: 700px)').matches
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(visualPalette.ink)

  const camera = new THREE.PerspectiveCamera(compact ? 40 : 35, 1, 0.1, 60)
  camera.position.set(0, 0, compact ? 13.8 : 12)

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
    powerPreference: 'high-performance',
  })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.06
  renderer.setClearColor(visualPalette.ink, 1)
  renderer.info.autoReset = false

  const loader = new THREE.ImageBitmapLoader()
  loader.setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none' })
  const textureSet = selectEarthTextureSet(renderer, compact)
  const compressedTextureLoader = textureSet.dayTiles
    ? new KTX2Loader()
      .setTranscoderPath('/assets/basis/')
      .setWorkerLimit(2)
      .detectSupport(renderer)
    : null
  document.body.dataset.globeTextureQuality = textureSet.quality
  const dayTexturesPromise = compressedTextureLoader && textureSet.dayTiles
    ? Promise.all(textureSet.dayTiles.map((url) => compressedTextureLoader.loadAsync(url)))
        .catch(async () => [await loadTexture(loader, textureSet.day)])
    : loadTexture(loader, textureSet.day).then((texture) => [texture])
  const [dayTextures, cloudTexture, elevationTexture, waterTexture, countryData, provinceData, ...cityData] = await Promise.all([
    dayTexturesPromise,
    loadTexture(loader, textureSet.cloud),
    loadTexture(loader, textureSet.elevation),
    loadTexture(loader, textureSet.water),
    fetch('/assets/data-assets-globe/boundaries/100000.json').then((response) => response.json() as Promise<GeoCollection>),
    fetch('/assets/data-assets-globe/boundaries/100000_full.json').then((response) => response.json() as Promise<GeoCollection>),
    ...locations.map((location) =>
      fetch(`/assets/data-assets-globe/boundaries/${location.boundary}.json`).then(
        (response) => response.json() as Promise<GeoCollection>,
      ),
    ),
  ])
  compressedTextureLoader?.dispose()

  dayTextures.forEach((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
  })
  cloudTexture.colorSpace = THREE.SRGBColorSpace
  elevationTexture.colorSpace = THREE.NoColorSpace
  waterTexture.colorSpace = THREE.NoColorSpace
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()
  dayTextures.forEach((texture) => {
    texture.anisotropy = Math.min(12, maxAnisotropy)
  })
  cloudTexture.anisotropy = Math.min(8, maxAnisotropy)
  elevationTexture.anisotropy = Math.min(8, maxAnisotropy)
  waterTexture.anisotropy = Math.min(8, maxAnisotropy)
  await yieldToMainThread()

  const earthGroup = new THREE.Group()
  earthGroup.rotation.set(baseRotation.x, baseRotation.y, 0)
  scene.add(earthGroup)
  const virtualSunPosition = new THREE.Vector3(-8, 12, 14)
  const atmosphereRampTexture = makeAtmosphereRampTexture()

  const earthUniforms = {
    uDayMap0: { value: dayTextures[0] },
    uDayMap1: { value: dayTextures[1] ?? dayTextures[0] },
    uDayMap2: { value: dayTextures[2] ?? dayTextures[0] },
    uDayMap3: { value: dayTextures[3] ?? dayTextures[0] },
    uDayTiled: { value: dayTextures.length === 4 ? 1 : 0 },
    uElevationMap: { value: elevationTexture },
    uElevationTexel: {
      value: new THREE.Vector2(1 / textureSet.elevationResolution[0], 1 / textureSet.elevationResolution[1]),
    },
    uFade: { value: 0 },
    uLightDirection: { value: new THREE.Vector3(-0.4, 0.72, 0.92).normalize() },
    uRegionCenter: { value: lonLatToVector([104, 35], 1).normalize() },
    uWaterMap: { value: waterTexture },
  }
  const earthMaterial = new THREE.ShaderMaterial({
    depthWrite: true,
    fragmentShader: `
      uniform sampler2D uDayMap0;
      uniform sampler2D uDayMap1;
      uniform sampler2D uDayMap2;
      uniform sampler2D uDayMap3;
      uniform float uDayTiled;
      uniform sampler2D uElevationMap;
      uniform sampler2D uWaterMap;
      uniform vec2 uElevationTexel;
      uniform vec3 uLightDirection;
      uniform vec3 uRegionCenter;
      uniform float uFade;
      varying vec2 vUv;
      varying vec3 vNormalLocal;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPosition;

      vec3 sampleDayMap(vec2 uv) {
        if (uDayTiled < 0.5) return texture2D(uDayMap0, uv).rgb;
        vec2 tileUv = vec2(
          uv.x < 0.5 ? uv.x * 2.0 : (uv.x - 0.5) * 2.0,
          uv.y < 0.5 ? uv.y * 2.0 : (uv.y - 0.5) * 2.0
        );
        if (uv.y >= 0.5) {
          return uv.x < 0.5
            ? texture2D(uDayMap0, tileUv).rgb
            : texture2D(uDayMap1, tileUv).rgb;
        }
        return uv.x < 0.5
          ? texture2D(uDayMap2, tileUv).rgb
          : texture2D(uDayMap3, tileUv).rgb;
      }

      void main() {
        vec3 baseNormal = normalize(vNormalWorld);
        float regionFocus = smoothstep(0.72, 0.88, dot(normalize(vNormalLocal), normalize(uRegionCenter)));
        float elevation = texture2D(uElevationMap, vUv).r;
        float waterMask = smoothstep(0.35, 0.8, texture2D(uWaterMap, vUv).r);
        float landMask = 1.0 - waterMask;
        float elevationLeft = texture2D(uElevationMap, vUv - vec2(uElevationTexel.x, 0.0)).r;
        float elevationRight = texture2D(uElevationMap, vUv + vec2(uElevationTexel.x, 0.0)).r;
        float elevationDown = texture2D(uElevationMap, vUv - vec2(0.0, uElevationTexel.y)).r;
        float elevationUp = texture2D(uElevationMap, vUv + vec2(0.0, uElevationTexel.y)).r;
        vec3 tangentAxis = abs(baseNormal.y) > 0.96 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
        vec3 tangent = normalize(cross(tangentAxis, baseNormal));
        vec3 bitangent = normalize(cross(baseNormal, tangent));
        vec2 reliefSlope = vec2(elevationRight - elevationLeft, elevationUp - elevationDown);
        float reliefStrength = smoothstep(0.08, 0.28, elevation) * landMask * 1.45;
        vec3 normalWorld = normalize(baseNormal - tangent * reliefSlope.x * reliefStrength - bitangent * reliefSlope.y * reliefStrength);
        float lightLevel = dot(normalWorld, normalize(uLightDirection));
        float daylight = smoothstep(-0.18, 0.48, lightLevel);
        vec3 day = sampleDayMap(vUv);
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float rim = pow(1.0 - max(0.0, dot(baseNormal, viewDirection)), 3.2);
        float terrain = dot(day, vec3(0.299, 0.587, 0.114));
        vec3 subduedDay = mix(vec3(terrain), day, 0.64);
        subduedDay *= mix(0.993, 1.008, smoothstep(0.08, 0.72, elevation));
        vec3 recoveredDetail = sqrt(max(subduedDay, vec3(0.0)));
        subduedDay = mix(subduedDay, recoveredDetail, regionFocus * 0.22);
        float upperFill = smoothstep(-0.48, 0.74, dot(baseNormal, normalize(vec3(-0.24, 0.72, 0.65))));
        float landExposure = mix(0.095, 0.68, daylight) * mix(0.94, 1.04, upperFill);
        landExposure = max(landExposure, regionFocus * 0.58);
        vec3 landColor = subduedDay * landExposure * vec3(0.78, 0.87, 0.93);
        vec3 oceanColor = mix(vec3(0.0015, 0.005, 0.009), vec3(0.007, 0.031, 0.044), daylight * 0.84);
        oceanColor += vec3(0.009, 0.03, 0.043) * regionFocus;
        float oceanFresnel = pow(1.0 - max(0.0, dot(baseNormal, viewDirection)), 3.8);
        oceanColor += vec3(0.016, 0.09, 0.115) * oceanFresnel * 0.15;
        vec3 color = mix(landColor, oceanColor, waterMask);
        float solarLimb = pow(rim * daylight * upperFill, 1.1);
        float limbShoulder = 1.0 - pow(rim, 6.0);
        float limbDetail = mix(0.42, 1.0, smoothstep(0.16, 0.72, terrain));
        color += vec3(0.045, 0.16, 0.22) * solarLimb * limbShoulder * limbDetail * 0.18;
        gl_FragColor = vec4(color, uFade);
      }
    `,
    uniforms: earthUniforms,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalLocal;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPosition;

      void main() {
        vUv = uv;
        vNormalLocal = normalize(normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
  })
  const earth = new THREE.Mesh(new THREE.SphereGeometry(globeRadius, 160, 112), earthMaterial)
  earth.renderOrder = 1
  earthGroup.add(earth)
  await yieldToMainThread()

  const cloudUniforms = {
    uBlue: { value: new THREE.Color(visualPalette.silver) },
    uCloudMap: { value: cloudTexture },
    uIce: { value: new THREE.Color(visualPalette.iceWhite) },
    uLightDirection: { value: earthUniforms.uLightDirection.value },
    uOpacity: { value: 0 },
  }
  const cloudMaterial = new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    fragmentShader: `
      uniform vec3 uBlue;
      uniform sampler2D uCloudMap;
      uniform vec3 uIce;
      uniform vec3 uLightDirection;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPosition;

      void main() {
        float cloudSignal = smoothstep(0.08, 0.76, texture2D(uCloudMap, vUv).a);
        if (cloudSignal < 0.003) discard;
        vec3 normalWorld = normalize(vNormalWorld);
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float viewFacing = max(0.0, dot(normalWorld, viewDirection));
        float rim = pow(1.0 - viewFacing, 2.35);
        float horizonFeather = smoothstep(0.08, 0.34, viewFacing);
        float lightFacing = smoothstep(-0.34, 0.72, dot(normalWorld, normalize(uLightDirection)));
        float upperHemisphere = smoothstep(-0.24, 0.7, dot(normalWorld, normalize(vec3(0.0, 1.0, 0.18))));
        float solarCrest = rim * upperHemisphere * smoothstep(0.12, 0.92, lightFacing);
        float illumination = 0.06 + lightFacing * 0.42 + upperHemisphere * 0.1 + solarCrest * 0.46;
        float alpha = cloudSignal * uOpacity * illumination * horizonFeather;
        float iceMix = smoothstep(0.3, 0.9, lightFacing + solarCrest * 0.58) * mix(0.34, 1.0, horizonFeather);
        vec3 color = mix(uBlue * 0.74, uIce, iceMix);
        gl_FragColor = vec4(color, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    uniforms: cloudUniforms,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPosition;

      void main() {
        vUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
  })
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(globeRadius * 1.006, 128, 88), cloudMaterial)
  clouds.renderOrder = 2
  earthGroup.add(clouds)
  await yieldToMainThread()

  const membraneUniforms = {
    uBlue: { value: new THREE.Color(visualPalette.electricBlue) },
    uIce: { value: new THREE.Color(visualPalette.iceWhite) },
    uLightDirection: { value: earthUniforms.uLightDirection.value },
    uOpacity: { value: 0 },
  }
  const membraneMaterial = new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    transparent: true,
    uniforms: membraneUniforms,
    vertexShader: `
      varying vec3 vNormalWorld;
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uBlue;
      uniform vec3 uIce;
      uniform vec3 uLightDirection;
      uniform float uOpacity;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPosition;
      void main() {
        vec3 normalWorld = normalize(vNormalWorld);
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float viewFacing = max(0.0, dot(normalWorld, viewDirection));
        float rim = pow(1.0 - viewFacing, 2.35);
        float lightFacing = smoothstep(-0.34, 0.7, dot(normalWorld, normalize(uLightDirection)));
        float directional = smoothstep(-0.12, 0.72, dot(normalWorld, normalize(vec3(-0.28, 0.78, 0.55))));
        vec3 reflectedLight = reflect(-normalize(uLightDirection), normalWorld);
        float sheen = pow(max(0.0, dot(reflectedLight, viewDirection)), 13.0);
        float alpha = uOpacity * lightFacing * mix(0.3, 1.0, directional) * (rim * 0.2 + sheen * 0.5);
        if (alpha < 0.001) discard;
        vec3 color = mix(uBlue, uIce, smoothstep(0.08, 0.58, sheen));
        gl_FragColor = vec4(color, alpha);
      }
    `,
  })
  const membrane = new THREE.Mesh(
    new THREE.SphereGeometry(globeRadius * 1.009, 128, 88),
    membraneMaterial,
  )
  membrane.renderOrder = 3

  const traceUniforms = {
    uBlue: { value: new THREE.Color(visualPalette.electricBlue) },
    uLightDirection: { value: earthUniforms.uLightDirection.value },
    uOpacity: { value: 0 },
    uTime: { value: 0 },
  }
  const traceMaterial = new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    transparent: true,
    uniforms: traceUniforms,
    vertexShader: `
      varying vec3 vNormalWorld;
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uBlue;
      uniform vec3 uLightDirection;
      uniform float uOpacity;
      uniform float uTime;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPosition;
      void main() {
        vec3 normalWorld = normalize(vNormalWorld);
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float rim = pow(1.0 - max(0.0, dot(normalWorld, viewDirection)), 1.7);
        float lightFacing = smoothstep(-0.22, 0.74, dot(normalWorld, normalize(uLightDirection)));
        float directional = smoothstep(0.02, 0.74, dot(normalWorld, normalize(vec3(-0.22, 0.84, 0.49))));
        float drift = 0.92 + sin(uTime * 0.18 + dot(vWorldPosition, vec3(0.52, 0.86, 0.31))) * 0.08;
        float alpha = uOpacity * rim * lightFacing * directional * drift;
        if (alpha < 0.001) discard;
        gl_FragColor = vec4(uBlue, alpha);
      }
    `,
    wireframe: true,
  })
  const traces = new THREE.Mesh(
    new THREE.IcosahedronGeometry(globeRadius * 1.011, compact ? 4 : 5),
    traceMaterial,
  )
  traces.renderOrder = 3
  earthGroup.add(membrane, traces)
  await yieldToMainThread()

  const atmosphereMaterial = new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
    transparent: true,
    uniforms: {
      uAtmosphereRamp: { value: atmosphereRampTexture },
      uAtmosphereRadius: { value: globeRadius * atmosphereRadiusScale },
      uCloudMap: { value: cloudTexture },
      uEarthRadius: { value: globeRadius },
      uLightDirection: { value: earthUniforms.uLightDirection.value },
      uOpacity: { value: 0 },
      uSphereCenter: { value: new THREE.Vector3() },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPosition;
      void main() {
        vUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtmosphereRamp;
      uniform float uAtmosphereRadius;
      uniform sampler2D uCloudMap;
      uniform float uEarthRadius;
      uniform vec3 uLightDirection;
      uniform float uOpacity;
      uniform vec3 uSphereCenter;
      varying vec2 vUv;
      varying vec3 vNormalWorld;
      varying vec3 vWorldPosition;
      void main() {
        vec3 normalWorld = normalize(vNormalWorld);
        vec3 viewRay = normalize(vWorldPosition - cameraPosition);
        float impactParameter = length(cross(uSphereCenter - cameraPosition, viewRay));
        float opticalHeight = clamp(
          (impactParameter - uEarthRadius) / max(uAtmosphereRadius - uEarthRadius, 0.001),
          0.0,
          1.0
        );
        vec4 spectrum = texture2D(uAtmosphereRamp, vec2(opticalHeight, 0.5));
        float cloudSignal = smoothstep(0.1, 0.72, texture2D(uCloudMap, vUv).a);
        float lightFacing = smoothstep(-0.62, 0.62, dot(normalWorld, normalize(uLightDirection)));
        float upperHemisphere = smoothstep(-0.22, 0.62, dot(normalWorld, normalize(vec3(0.0, 1.0, 0.18))));
        float solarArc = lightFacing * upperHemisphere;
        float solarCrest = pow(clamp(solarArc, 0.0, 1.0), 1.35);
        float tangentDepth = pow(1.0 - opticalHeight, 0.38);
        float innerFeather = smoothstep(0.0, 0.08, opticalHeight);
        float innerBand = 1.0 - smoothstep(0.0, 0.12, opticalHeight);
        float localHighlight = innerBand * solarCrest * mix(0.18, 0.62, cloudSignal);
        float cloudVariation = mix(0.92, 1.08, cloudSignal);
        float visibility = clamp(0.08 + lightFacing * 0.18 + upperHemisphere * 0.12 + solarCrest * 0.62, 0.0, 1.0);
        float innerVisibility = mix(1.0, 0.4 + solarCrest * 0.42 + cloudSignal * 0.18, innerBand);
        vec3 color = mix(spectrum.rgb, vec3(0.86, 0.97, 1.0), localHighlight * 0.42);
        float alpha = spectrum.a * uOpacity * visibility * mix(0.58, 1.0, tangentDepth) * cloudVariation * innerVisibility * innerFeather;
        if (alpha < 0.001) discard;
        gl_FragColor = vec4(color, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(globeRadius * atmosphereRadiusScale, 128, 88),
    atmosphereMaterial,
  )
  atmosphere.renderOrder = 0
  earthGroup.add(atmosphere)
  await yieldToMainThread()

  const regionGeometry = new THREE.SphereGeometry(globeRadius * 1.0138, compact ? 96 : 128, compact ? 64 : 88)
  const provinceRegionLayer = makeRegionMaskLayer(compact, regionGeometry, {
    baseOpacity: 0.032,
    featherOpacity: 0.008,
    renderOrder: 3,
    settledOpacity: 0.03,
    sweepOpacity: 0.025,
  })
  const cityRegionLayer = makeRegionMaskLayer(compact, regionGeometry, {
    baseOpacity: 0.115,
    featherOpacity: 0.024,
    renderOrder: 4,
    settledOpacity: 0.1,
    sweepOpacity: 0.1,
  })
  const regionLayers = [provinceRegionLayer, cityRegionLayer]
  regionLayers.forEach((layer) => earthGroup.add(layer.mesh))
  const provinceFeatures = new Map(
    provinceData.features.flatMap((feature) => {
      const adcode = feature.properties?.adcode
      return adcode ? [[String(adcode), feature] as const] : []
    }),
  )

  const boundaryLayers: BoundaryLayer[] = []
  const provinceGeometry = await makeBoundarySegmentGeometry(provinceData, globeRadius * 1.012)
  const provinceLayer = makeBoundaryLayer(
    provinceGeometry,
    {
      coreColor: visualPalette.silver,
      coreOpacity: compact ? 0.26 : 0.3,
      coreWidth: compact ? 0.94 : 1,
    },
  )
  await yieldToMainThread()
  const countryGeometry = await makeBoundarySegmentGeometry(countryData, globeRadius * 1.013)
  const countryLayer = makeBoundaryLayer(
    countryGeometry,
    {
      coreColor: visualPalette.iceWhite,
      coreOpacity: compact ? 0.46 : 0.54,
      coreWidth: compact ? 1.08 : 1.14,
    },
  )
  boundaryLayers.push(provinceLayer, countryLayer)
  earthGroup.add(provinceLayer.group, countryLayer.group)

  const cityLayers: BoundaryLayer[] = []
  for (const collection of cityData) {
    const cityGeometry = await makeBoundarySegmentGeometry(collection, globeRadius * 1.015)
    const layer = makeBoundaryLayer(
      cityGeometry,
      {
        coreColor: visualPalette.warmWhite,
        coreOpacity: 0,
        coreWidth: compact ? 1.14 : 1.2,
      },
    )
    earthGroup.add(layer.group)
    boundaryLayers.push(layer)
    cityLayers.push(layer)
    await yieldToMainThread()
  }

  let activeCity = -1
  let hasProvinceRegion = false
  let regionTransitionStarted = performance.now() / 1000
  let targetRotationX = baseRotation.x
  let targetRotationY = baseRotation.y
  let pointerX = 0
  let pointerY = 0
  let frame = 0
  let frameCount = 0
  let smoothedFrameMs = 16.7
  let destroyed = false
  let active = startActive
  let startTime = performance.now()
  let lastTime = startTime
  let pausedAt = active ? 0 : startTime

  const setActiveCity = (index: number) => {
    if (index === activeCity && cityRegionLayer.mesh.visible) return
    activeCity = index
    const location = locations[index]
    paintRegionMask(cityRegionLayer, cityData[index])
    cityRegionLayer.material.uniforms.uOpacity.value = 0
    cityRegionLayer.material.uniforms.uProgress.value = 0
    cityRegionLayer.mesh.visible = true
    const provinceFeature = location.provinceBoundary
      ? provinceFeatures.get(location.provinceBoundary)
      : undefined
    hasProvinceRegion = Boolean(provinceFeature)
    provinceRegionLayer.material.uniforms.uOpacity.value = 0
    provinceRegionLayer.material.uniforms.uProgress.value = 0
    provinceRegionLayer.mesh.visible = hasProvinceRegion
    if (provinceFeature) paintRegionMask(provinceRegionLayer, { features: [provinceFeature] })
    regionTransitionStarted = performance.now() / 1000
    targetRotationY = baseRotation.y + THREE.MathUtils.degToRad((112 - location.coordinates[0]) * 0.32)
    targetRotationX = baseRotation.x + THREE.MathUtils.degToRad((location.coordinates[1] - 29) * 0.18)
    cityLayers.forEach((layer, layerIndex) => {
      const active = layerIndex === index
      layer.group.visible = active
      layer.targetCore = active ? 0.56 : 0
    })
  }

  const layoutScene = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    const isCompact = width <= 700
    const isTablet = width > 700 && width <= 1100
    const isWide = width >= 1800
    const viewportScale = Math.max(1, window.visualViewport?.scale ?? 1)
    const supersample = isCompact ? 1.08 : isWide ? 1.2 : 1.15
    const pixelBudget = isCompact ? 8_000_000 : 12_000_000
    const budgetRatio = Math.sqrt(pixelBudget / Math.max(1, width * height))
    const desiredRatio = window.devicePixelRatio * viewportScale * supersample
    const pixelRatio = Math.max(1, Math.min(desiredRatio, budgetRatio, 3))
    renderer.setPixelRatio(pixelRatio)
    renderer.setSize(width, height, false)
    const drawingBufferSize = renderer.getDrawingBufferSize(new THREE.Vector2())
    boundaryLayers.forEach((layer) => {
      layer.core.uniforms.uResolution.value.copy(drawingBufferSize)
      layer.core.uniforms.uLineWidth.value = layer.coreWidth * pixelRatio
    })
    document.body.dataset.globeRenderScale = pixelRatio.toFixed(2)
    camera.aspect = width / height
    camera.fov = isCompact ? 40 : isTablet ? 37 : 35
    camera.position.z = isCompact ? 13.8 : isWide ? 11.4 : 12
    camera.updateProjectionMatrix()

    if (isCompact) {
      earthGroup.position.set(-0.15, -2.24, 0)
      earthGroup.scale.setScalar(0.82)
    } else if (isTablet) {
      earthGroup.position.set(-1.5, -1.74, 0)
      earthGroup.scale.setScalar(0.95)
    } else if (isWide) {
      earthGroup.position.set(-2.35, -1.52, 0)
      earthGroup.scale.setScalar(1.08)
    } else {
      earthGroup.position.set(-2.05, -1.58, 0)
      earthGroup.scale.setScalar(1)
    }

    earthUniforms.uLightDirection.value
      .copy(virtualSunPosition)
      .sub(earthGroup.position)
      .normalize()
    atmosphereMaterial.uniforms.uSphereCenter.value.copy(earthGroup.position)
    atmosphereMaterial.uniforms.uEarthRadius.value = globeRadius * earthGroup.scale.x
    atmosphereMaterial.uniforms.uAtmosphereRadius.value = globeRadius * atmosphereRadiusScale * earthGroup.scale.x
  }

  const handlePointerMove = (event: PointerEvent) => {
    pointerX = event.clientX / window.innerWidth - 0.5
    pointerY = event.clientY / window.innerHeight - 0.5
  }
  window.addEventListener('resize', layoutScene)
  window.visualViewport?.addEventListener('resize', layoutScene)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  layoutScene()
  await renderer.compileAsync(scene, camera)
  const texturesToUpload: THREE.Texture[] = [
    ...dayTextures,
    cloudTexture,
    elevationTexture,
    waterTexture,
    atmosphereRampTexture,
    ...regionLayers.map((layer) => layer.texture),
  ]
  for (const texture of texturesToUpload) {
    renderer.initTexture(texture)
    await yieldToMainThread()
  }
  renderer.render(scene, camera)
  await yieldToMainThread()
  setActiveCity(0)

  const render = (now: number) => {
    if (destroyed || !active) {
      frame = 0
      return
    }
    frame = window.requestAnimationFrame(render)
    const delta = Math.min(0.05, (now - lastTime) / 1000)
    const elapsed = (now - startTime) / 1000
    lastTime = now
    smoothedFrameMs = THREE.MathUtils.lerp(smoothedFrameMs, delta * 1000, 0.05)
    const reveal = THREE.MathUtils.smoothstep(elapsed, 0.1, 2.1)
    const structureReveal = THREE.MathUtils.smoothstep(elapsed, 0.75, 2.65)

    earthUniforms.uFade.value = THREE.MathUtils.lerp(earthUniforms.uFade.value, reveal, 0.08)
    cloudUniforms.uOpacity.value = THREE.MathUtils.lerp(
      cloudUniforms.uOpacity.value,
      (compact ? 0.09 : 0.13) * reveal,
      0.06,
    )
    membraneUniforms.uOpacity.value = THREE.MathUtils.lerp(
      membraneUniforms.uOpacity.value,
      (compact ? 0.055 : 0.07) * structureReveal,
      0.05,
    )
    traceUniforms.uOpacity.value = THREE.MathUtils.lerp(
      traceUniforms.uOpacity.value,
      (compact ? 0.009 : 0.012) * structureReveal,
      0.05,
    )
    traceUniforms.uTime.value = elapsed
    atmosphereMaterial.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      atmosphereMaterial.uniforms.uOpacity.value,
      (compact ? 0.58 : 0.78) * reveal,
      0.06,
    )
    provinceLayer.core.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      provinceLayer.core.uniforms.uOpacity.value,
      provinceLayer.targetCore * structureReveal,
      0.06,
    )
    countryLayer.core.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      countryLayer.core.uniforms.uOpacity.value,
      countryLayer.targetCore * structureReveal,
      0.06,
    )
    cityLayers.forEach((layer) => {
      layer.core.uniforms.uOpacity.value = THREE.MathUtils.lerp(
        layer.core.uniforms.uOpacity.value,
        layer.targetCore * structureReveal,
        0.09,
      )
    })
    const regionAge = now / 1000 - regionTransitionStarted
    const provinceRegionReveal = hasProvinceRegion
      ? THREE.MathUtils.smoothstep(regionAge, 0.12, 0.82) * structureReveal
      : 0
    const cityRegionReveal = THREE.MathUtils.smoothstep(
      regionAge,
      hasProvinceRegion ? 0.34 : 0.18,
      hasProvinceRegion ? 1.16 : 0.94,
    ) * structureReveal
    provinceRegionLayer.material.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      provinceRegionLayer.material.uniforms.uOpacity.value,
      provinceRegionReveal,
      1 - Math.exp(-delta * 5.2),
    )
    provinceRegionLayer.material.uniforms.uProgress.value = THREE.MathUtils.clamp(
      (regionAge - 0.04) / 1.15,
      0,
      1,
    )
    cityRegionLayer.material.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      cityRegionLayer.material.uniforms.uOpacity.value,
      cityRegionReveal,
      1 - Math.exp(-delta * 5.8),
    )
    cityRegionLayer.material.uniforms.uProgress.value = THREE.MathUtils.clamp(
      (regionAge - (hasProvinceRegion ? 0.22 : 0.08)) / 1.18,
      0,
      1,
    )

    earthGroup.rotation.x = THREE.MathUtils.lerp(
      earthGroup.rotation.x,
      targetRotationX + pointerY * 0.025,
      1 - Math.exp(-delta * 2.5),
    )
    earthGroup.rotation.y = THREE.MathUtils.lerp(
      earthGroup.rotation.y,
      targetRotationY + pointerX * 0.018,
      1 - Math.exp(-delta * 2.5),
    )
    clouds.rotation.y += delta * 0.004

    renderer.info.reset()
    renderer.render(scene, camera)
    frameCount += 1
    if (frameCount % 30 === 0) {
      document.body.dataset.globeFps = (1000 / smoothedFrameMs).toFixed(1)
      document.body.dataset.globeDrawCalls = String(renderer.info.render.calls)
    }
    if (elapsed > 0.4 && document.body.dataset.globeReady !== 'true') {
      document.body.dataset.globeReady = 'true'
    }
  }

  if (active) frame = window.requestAnimationFrame(render)
  ;(window as Window & { __dataAssetsGlobeStudy?: unknown }).__dataAssetsGlobeStudy = {
    cityCount: locations.length,
    getActiveCity: () => locations[activeCity].name,
    renderer,
  }

  return {
    destroy: () => {
      destroyed = true
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', layoutScene)
      window.visualViewport?.removeEventListener('resize', layoutScene)
      window.removeEventListener('pointermove', handlePointerMove)
      dayTextures.forEach((texture) => texture.dispose())
      cloudTexture.dispose()
      atmosphereRampTexture.dispose()
      elevationTexture.dispose()
      waterTexture.dispose()
      regionLayers.forEach((layer) => layer.texture.dispose())
      renderer.dispose()
      delete document.body.dataset.globeReady
      delete document.body.dataset.globeFps
      delete document.body.dataset.globeDrawCalls
      delete document.body.dataset.globeRenderScale
      delete document.body.dataset.globeTextureQuality
    },
    setActive: (nextActive: boolean) => {
      if (destroyed || active === nextActive) return
      active = nextActive

      if (!active) {
        pausedAt = performance.now()
        window.cancelAnimationFrame(frame)
        frame = 0
        return
      }

      const now = performance.now()
      const pausedDuration = Math.max(0, now - pausedAt)
      startTime += pausedDuration
      regionTransitionStarted += pausedDuration / 1000
      lastTime = now
      frame = window.requestAnimationFrame(render)
    },
    setActiveCity,
  }
}

type DataAssetsGlobeStudyProps = {
  embedded?: boolean
  renderEnabled?: boolean
  warmup?: boolean
}

export function DataAssetsGlobeStudy({
  embedded = false,
  renderEnabled = true,
  warmup = false,
}: DataAssetsGlobeStudyProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([])
  const controllerRef = useRef<SceneController | null>(null)
  const manualInteractionRef = useRef(0)
  const [shouldInitialize, setShouldInitialize] = useState(!embedded)
  const [isSceneVisible, setIsSceneVisible] = useState(!embedded)
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const sceneActive = (isSceneVisible || warmup) && renderEnabled
  const sceneVisibleRef = useRef(sceneActive)
  sceneVisibleRef.current = sceneActive
  const activeMedia = mediaAssets[activeMediaIndex]
  const activeCityIndex = locationIndexById.get(activeMedia.locationId) ?? 0
  const activeCity = locations[activeCityIndex]

  useEffect(() => {
    if (warmup) setShouldInitialize(true)
  }, [warmup])

  const activateAdjacentCity = useCallback((direction: -1 | 1) => {
    manualInteractionRef.current = Date.now()
    setActiveMediaIndex((currentMediaIndex) => {
      const currentLocationId = mediaAssets[currentMediaIndex].locationId
      const currentLocationIndex = locationIndexById.get(currentLocationId) ?? 0
      const nextLocationIndex = (currentLocationIndex + direction + locations.length) % locations.length
      const nextLocationId = locations[nextLocationIndex].id
      const nextMediaIndex = mediaAssets.findIndex((asset) => asset.locationId === nextLocationId)
      return nextMediaIndex >= 0 ? nextMediaIndex : currentMediaIndex
    })
  }, [])

  useEffect(() => {
    if (!embedded) return
    const section = sectionRef.current
    if (!section) return

    const preloadObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setShouldInitialize(true)
      preloadObserver.disconnect()
    }, { rootMargin: '80% 0px' })
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      setIsSceneVisible(entry.isIntersecting && entry.intersectionRatio >= 0.26)
    }, { threshold: [0, 0.26] })

    preloadObserver.observe(section)
    visibilityObserver.observe(section)
    return () => {
      preloadObserver.disconnect()
      visibilityObserver.disconnect()
    }
  }, [embedded])

  useEffect(() => {
    if (!shouldInitialize || !canvasRef.current) return
    let cancelled = false
    delete document.body.dataset.globeError
    createScene(canvasRef.current, sceneVisibleRef.current)
      .then((controller) => {
        if (cancelled) controller.destroy()
        else {
          delete document.body.dataset.globeError
          controllerRef.current = controller
          controller.setActiveCity(0)
          controller.setActive(sceneVisibleRef.current)
        }
      })
      .catch((error) => {
        console.error('Unable to initialize the data assets globe study.', error)
        document.body.dataset.globeError = 'true'
      })
    return () => {
      cancelled = true
      controllerRef.current?.destroy()
      controllerRef.current = null
    }
  }, [shouldInitialize])

  useEffect(() => {
    controllerRef.current?.setActive(sceneActive)
  }, [sceneActive])

  useEffect(() => {
    controllerRef.current?.setActiveCity(activeCityIndex)
    videoRefs.current.forEach((video, index) => {
      if (!video) return
      if (sceneActive && index === activeMediaIndex) void video.play().catch(() => undefined)
      else video.pause()
    })
  }, [activeCityIndex, activeMediaIndex, sceneActive, shouldInitialize])

  useEffect(() => {
    if (!sceneActive) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const sinceManualInteraction = Date.now() - manualInteractionRef.current
    const delay = sinceManualInteraction < 11000
      ? 11000 - sinceManualInteraction
      : 7200
    const timer = window.setTimeout(() => {
      setActiveMediaIndex((current) => (current + 1) % mediaAssets.length)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [activeMediaIndex, sceneActive])

  return (
    <section
      ref={sectionRef}
      className={`data-assets-study${embedded ? ' data-assets-study--embedded' : ''}`}
      data-scene-active={sceneActive ? 'true' : 'false'}
      id={embedded ? 'data-assets' : 'top'}
      aria-label="中国真机数据资产分布视觉研究"
    >
      <div className="data-assets-viewport">
        <canvas ref={canvasRef} className="data-assets-canvas" aria-hidden="true" />

        <header className="data-assets-copy">
          <h1 aria-label="真实场景与多样性任务设计，对模型训练至关重要">
            <span className="data-assets-copy__statement" aria-hidden="true">
              <span>真实场景与多样性任务设计</span>
              <span>对模型训练至关重要</span>
            </span>
          </h1>
        </header>

        <section
          className="city-title"
          aria-label={`当前采集城市：${activeCity.name}`}
          aria-live="polite"
        >
          <h2 className="city-title__word" key={activeCity.name} aria-label={activeCity.name}>
            <span className="city-title__face" aria-hidden="true">
              {activeCity.name}
            </span>
          </h2>
        </section>

        <aside className="asset-cluster" aria-label="真机数据视频样例">
          <div className="asset-main-screen">
            <div className="asset-main-screen__media">
              {shouldInitialize && mediaAssets.map((asset, index) => (
                <video
                  className={activeMediaIndex === index ? 'is-active' : ''}
                  key={asset.id}
                  loop
                  muted
                  playsInline
                  poster={asset.poster}
                  preload={index === 0 ? 'auto' : 'metadata'}
                  ref={(element) => {
                    videoRefs.current[index] = element
                  }}
                >
                  <source src={asset.video} type="video/mp4" />
                </video>
              ))}
              <div className="asset-main-screen__scan" aria-hidden="true" />
            </div>
            <div className="asset-main-screen__signal" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>

          <section className="asset-intelligence" aria-label={`${activeCity.name}数据资产概览`}>
            <header className="asset-intelligence__heading">
              <div>
                <strong>{activeCity.name}数据概览</strong>
              </div>
              <div className="asset-intelligence__navigation">
                <div
                  aria-label={`第${activeCityIndex + 1}个，共${locations.length}个采集城市`}
                  className="asset-intelligence__position"
                >
                  <b>{String(activeCityIndex + 1).padStart(2, '0')}</b>
                  <i aria-hidden="true" />
                  <small>{String(locations.length).padStart(2, '0')}</small>
                </div>
                <div className="asset-intelligence__controls">
                  <button
                    aria-label="上一个采集城市"
                    onClick={() => activateAdjacentCity(-1)}
                    title="上一个采集城市"
                    type="button"
                  >
                    <ChevronLeft aria-hidden="true" size={15} strokeWidth={1.5} />
                  </button>
                  <button
                    aria-label="下一个采集城市"
                    onClick={() => activateAdjacentCity(1)}
                    title="下一个采集城市"
                    type="button"
                  >
                    <ChevronRight aria-hidden="true" size={15} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </header>

            <div className="asset-intelligence__grid" key={activeCity.name}>
              <div className="asset-intelligence__metric asset-intelligence__metric--capacity">
                <span><Gauge aria-hidden="true" size={13} strokeWidth={1.4} />月数据产能</span>
                <strong>{activeCity.monthlyCapacity?.value ?? '--'}</strong>
                <small>{activeCity.monthlyCapacity?.unit ?? '口径待确认'}</small>
              </div>
              <div className="asset-intelligence__metric">
                <span><Bot aria-hidden="true" size={13} strokeWidth={1.4} />主力机型</span>
                <strong>{formatProfileValues(activeCity.robotModels)}</strong>
              </div>
              <div className="asset-intelligence__metric">
                <span><Hand aria-hidden="true" size={13} strokeWidth={1.4} />灵巧手</span>
                <strong>{formatProfileValues(activeCity.dexterousHands)}</strong>
              </div>
              <div className="asset-intelligence__metric">
                <span><ScanLine aria-hidden="true" size={13} strokeWidth={1.4} />特色场景</span>
                <strong>{formatProfileValues(activeCity.featuredScenes)}</strong>
              </div>
              <div className="asset-intelligence__metric">
                <span><Video aria-hidden="true" size={13} strokeWidth={1.4} />数据类型</span>
                <strong>{formatProfileValues(activeCity.dataTypes)}</strong>
              </div>
              <div className="asset-intelligence__metric">
                <span><MapPin aria-hidden="true" size={13} strokeWidth={1.4} />行政区域</span>
                <strong>{activeCity.administrativeRegion}</strong>
              </div>
            </div>
          </section>

        </aside>

        <div className="data-assets-vignette" aria-hidden="true" />
      </div>
    </section>
  )
}
