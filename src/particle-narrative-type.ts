import * as THREE from 'three'

const FONT_FAMILY = '"Helvetica Neue", Helvetica, Arial, sans-serif'
const clamp = THREE.MathUtils.clamp
const smoothstep = THREE.MathUtils.smoothstep

type ParticleTypography = {
  group: THREE.Group
  lines: string[]
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
    width: number
    height: number
    centerX: number
    centerY: number
  }
  getTargets: () => Float32Array
  update: (visibility: number, assemble: number, time: number) => void
  dispose: () => void
  height: number
}

type ParticleGainChart = {
  group: THREE.Group
  getTargets: (count: number) => {
    positions: Float32Array
    kind: Float32Array
    parameter: Float32Array
    colors: Float32Array
  }
  update: (progress: number, time: number) => void
  dispose: () => void
}

function seeded(index: number, salt = 0) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453123
  return value - Math.floor(value)
}

function centeredStoryLines(text: string, compact: boolean, fallback: string[]) {
  const arrangements = [
    compact
      ? ['coScene delivers', 'actions and feedback', 'grounded in physics', 'for the most ambitious', 'physical AI companies.']
      : ['coScene delivers actions and feedback', 'grounded in physics for the', 'most ambitious physical AI companies.'],
    compact
      ? ['We partner with', 'robotics leaders, capturing their', 'motion control capabilities', 'in data assets for better', 'training outcomes', 'for our customers.']
      : ['We partner with robotics leaders,', 'capturing their motion control capabilities', 'in data assets for better', 'training outcomes for our customers.'],
  ]
  return arrangements.find(arrangement => arrangement.join(' ') === text) ?? fallback
}

function disposeGroup(group: THREE.Group) {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line)) return
    geometries.add(object.geometry)
    const objectMaterials = Array.isArray(object.material) ? object.material : [object.material]
    objectMaterials.forEach((material) => {
      materials.add(material)
      const map = (material as THREE.MeshBasicMaterial).map
      if (map) textures.add(map)
    })
  })
  textures.forEach((texture) => texture.dispose())
  materials.forEach((material) => material.dispose())
  geometries.forEach((geometry) => geometry.dispose())
  group.clear()
}

/** A stable glyph constellation: individual grains gather, then hold their exact letters. */
export function createParticleTypography(
  text: string,
  lines: string[],
  width: number,
  compact: boolean,
  align: 'left' | 'center' = 'left',
): ParticleTypography {
  const group = new THREE.Group()
  group.name = 'particle-narrative-copy'
  group.userData.text = text
  const canvas = document.createElement('canvas')
  canvas.width = 1536
  const context = canvas.getContext('2d')!
  const suppliedLines = lines.length > 0 ? lines : [text]
  const copyLines = align === 'center' ? centeredStoryLines(text, compact, suppliedLines) : suppliedLines
  let fontSize = 112
  context.font = `400 ${fontSize}px ${FONT_FAMILY}`
  const longestLine = Math.max(...copyLines.map((line) => {
    const metrics = context.measureText(line)
    return align === 'center' ? metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight : metrics.width
  }))
  fontSize *= (canvas.width - 12) / Math.max(1, longestLine)
  const lineHeight = fontSize * 1.19
  canvas.height = Math.ceil(lineHeight * copyLines.length + fontSize * 0.16)
  context.font = `400 ${fontSize}px ${FONT_FAMILY}`
  context.fillStyle = '#f3f5f7'
  context.textBaseline = 'top'
  copyLines.forEach((line, index) => {
    const metrics = context.measureText(line)
    const inkWidth = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight
    const x = align === 'center'
      ? (canvas.width - inkWidth) / 2 + metrics.actualBoundingBoxLeft
      : 3
    context.fillText(line, x, index * lineHeight)
  })
  const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data
  const worldScale = width / canvas.width
  const height = canvas.height * worldScale
  let filledPixels = 0
  let left = canvas.width, right = 0, top = canvas.height, bottom = 0
  for (let index = 3; index < rgba.length; index += 4) {
    if (rgba[index] > 80) {
      filledPixels += 1
      const pixel = (index - 3) / 4
      const x = pixel % canvas.width
      const y = Math.floor(pixel / canvas.width)
      left = Math.min(left, x); right = Math.max(right, x + 1)
      top = Math.min(top, y); bottom = Math.max(bottom, y + 1)
    }
  }
  if (!filledPixels) { left = 0; right = canvas.width; top = 0; bottom = canvas.height }
  const bounds = {
    minX: left * worldScale,
    maxX: right * worldScale,
    minY: -bottom * worldScale,
    maxY: -top * worldScale,
    width: (right - left) * worldScale,
    height: (bottom - top) * worldScale,
    centerX: (left + right) * worldScale / 2,
    centerY: -(top + bottom) * worldScale / 2,
  }
  const pointBudget = compact ? 10500 : 18000
  const sampleSpacing = Math.max(2, Math.sqrt(filledPixels / pointBudget) * 1.04)
  const vertices: number[] = []
  const seeds: number[] = []
  const coverage: number[] = []
  let index = 0
  for (let y = 1; y < canvas.height; y += sampleSpacing) {
    for (let x = 1; x < canvas.width; x += sampleSpacing) {
      const pixelX = Math.floor(x)
      const pixelY = Math.floor(y)
      const alpha = rgba[(pixelY * canvas.width + pixelX) * 4 + 3] / 255
      if (alpha < 0.32 || vertices.length / 3 >= pointBudget) continue
      vertices.push(x * worldScale, -y * worldScale, 0)
      seeds.push(seeded(index, 1), seeded(index, 2), seeded(index, 3))
      coverage.push(alpha)
      index += 1
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 3))
  geometry.setAttribute('aCoverage', new THREE.Float32BufferAttribute(coverage, 1))
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    uniforms: {
      uVisibility: { value: 0 },
      uAssemble: { value: 0 },
      uTime: { value: 0 },
      uWidth: { value: width },
      uHeight: { value: height },
      uPointScale: { value: 1 },
      uMaxSize: { value: 4 },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aSeed;
      attribute float aCoverage;
      uniform float uVisibility;
      uniform float uAssemble;
      uniform float uTime;
      uniform float uWidth;
      uniform float uHeight;
      uniform float uPointScale;
      uniform float uMaxSize;
      varying float vAlpha;
      varying float vSilver;
      void main() {
        float gathered = smoothstep(aSeed.x * 0.20, 0.80 + aSeed.x * 0.20, uAssemble);
        float loose = 1.0 - gathered;
        vec3 target = position;
        vec3 drift = vec3(
          uWidth * (0.24 + aSeed.x * 0.82),
          sin(aSeed.y * 6.28318 + uTime * 0.46) * uHeight * 0.66,
          (aSeed.z - 0.5) * 1.3
        );
        target += drift * loose;
        target.y += sin(position.x * 1.6 + uTime * 0.72 + aSeed.z) * loose * 0.16;
        vec4 viewPosition = modelViewMatrix * vec4(target, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = clamp(uPointScale * projectionMatrix[1][1] / max(0.1, -viewPosition.z), 0.8, uMaxSize);
        vAlpha = uVisibility * aCoverage * (0.58 + gathered * 0.35);
        vSilver = 0.88 + aSeed.z * 0.12;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      varying float vSilver;
      void main() {
        float radius = length(gl_PointCoord - 0.5) * 2.0;
        float alpha = (1.0 - smoothstep(0.48, 1.0, radius)) * vAlpha;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(vec3(0.88, 0.92, 0.98) * vSilver, alpha);
      }
    `,
  })
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  points.renderOrder = 12
  group.add(points)
  group.userData.setExternalParticles = (enabled: boolean) => { points.visible = !enabled }

  // A low-energy glyph silhouette keeps the smallest letter strokes readable;
  // the visible grain, arrival paths, and departure remain actual particles.
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  const silhouetteMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  })
  const silhouette = new THREE.Mesh(new THREE.PlaneGeometry(width, height), silhouetteMaterial)
  silhouette.position.set(width / 2, -height / 2, -0.003)
  silhouette.renderOrder = 11
  group.add(silhouette)

  return {
    group,
    height,
    lines: [...copyLines],
    bounds,
    getTargets: () => new Float32Array(vertices),
    update(visibility, assemble, time) {
      const alpha = clamp(visibility, 0, 1)
      const gathered = clamp(assemble, 0, 1)
      group.visible = alpha > 0.001
      material.uniforms.uVisibility.value = alpha
      material.uniforms.uAssemble.value = gathered
      material.uniforms.uTime.value = time
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      material.uniforms.uPointScale.value = sampleSpacing * worldScale * window.innerHeight * pixelRatio * 0.74
      material.uniforms.uMaxSize.value = 3.5 * pixelRatio
      silhouetteMaterial.opacity = alpha * smoothstep(gathered, 0.98, 1.0) * 0.44
    },
    dispose: () => disposeGroup(group),
  }
}

function makeLabel(text: string, width: number, opacity = 1) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!
  context.font = `400 52px ${FONT_FAMILY}`
  canvas.width = Math.ceil(context.measureText(text).width) + 4
  canvas.height = 76
  context.font = `400 52px ${FONT_FAMILY}`
  context.fillStyle = '#c5cdd7'
  context.textBaseline = 'middle'
  context.fillText(text, 2, 37)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  })
  const height = width * canvas.height / canvas.width
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material)
  mesh.renderOrder = 8
  return mesh
}

function chartHeight(value: number) {
  const trend = (Math.exp(value * 1.8) - 1) / (Math.exp(1.8) - 1)
  const ripple = Math.sin(value * 27) * Math.sin(value * Math.PI) * 0.008
    + Math.sin(value * 61) * Math.sin(value * Math.PI) * 0.002
  return 0.42 + trend * 1.59 + ripple
}

/** A qualitative explanation of training gain; it intentionally contains no benchmark values. */
export function createParticleGainChart(compact: boolean): ParticleGainChart {
  const group = new THREE.Group()
  group.name = 'particle-narrative-gain-chart'
  const axisMaterial = new THREE.LineBasicMaterial({
    color: 0x6d7a8c, transparent: true, opacity: 0, depthWrite: false, toneMapped: false,
  })
  const axisVertices = [
    new THREE.Vector3(0.24, 2.19, 0), new THREE.Vector3(0.24, 0.25, 0),
    new THREE.Vector3(0.24, 0.25, 0), new THREE.Vector3(4.14, 0.25, 0),
  ]
  for (let index = 1; index <= 4; index += 1) {
    const x = 0.24 + index * 0.78
    axisVertices.push(new THREE.Vector3(x, 0.25, 0), new THREE.Vector3(x, 0.205, 0))
    const y = 0.25 + index * 0.388
    axisVertices.push(new THREE.Vector3(0.195, y, 0), new THREE.Vector3(0.24, y, 0))
  }
  const axes = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(axisVertices), axisMaterial)
  group.add(axes)

  const yLabel = makeLabel('Task success rate', 1.24)
  yLabel.position.set(0.87, 2.39, 0)
  const xLabel = makeLabel('Training iterations', 1.29)
  xLabel.position.set(3.49, 0.07, 0)
  const note = makeLabel('Illustrative', 0.65)
  note.position.set(0.58, 0.07, 0)
  group.add(yLabel, xLabel, note)

  const count = compact ? 500 : 850
  const vertexArray = new Float32Array(count * 3)
  const progressArray = new Float32Array(count)
  const seedArray = new Float32Array(count)
  for (let index = 0; index < count; index += 1) {
    const value = index / (count - 1)
    vertexArray[index * 3] = 0.42 + value * 3.59
    vertexArray[index * 3 + 1] = chartHeight(value) + (seeded(index, 4) - 0.5) * 0.012
    vertexArray[index * 3 + 2] = 0.005
    progressArray[index] = value
    seedArray[index] = seeded(index, 5)
  }
  const curveGeometry = new THREE.BufferGeometry()
  curveGeometry.setAttribute('position', new THREE.BufferAttribute(vertexArray, 3))
  curveGeometry.setAttribute('aProgress', new THREE.BufferAttribute(progressArray, 1))
  curveGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seedArray, 1))
  const curveMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    uniforms: {
      uProgress: { value: 0 }, uTime: { value: 0 }, uOpacity: { value: 1 }, uPixelRatio: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute float aProgress;
      attribute float aSeed;
      uniform float uProgress;
      uniform float uPixelRatio;
      varying float vAlpha;
      varying float vSeed;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = (1.5 + aSeed * 1.0) * uPixelRatio;
        vAlpha = 1.0 - smoothstep(uProgress - 0.012, uProgress + 0.006, aProgress);
        vSeed = aSeed;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying float vAlpha;
      varying float vSeed;
      void main() {
        float radius = length(gl_PointCoord - 0.5) * 2.0;
        float alpha = (1.0 - smoothstep(0.24, 1.0, radius)) * vAlpha * uOpacity;
        if (alpha < 0.01) discard;
        vec3 color = mix(vec3(0.16, 0.44, 1.0), vec3(0.82, 0.90, 1.0), 0.25 + vSeed * 0.56);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  })
  const curve = new THREE.Points(curveGeometry, curveMaterial)
  curve.frustumCulled = false
  group.add(curve)

  const headMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uOpacity: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float radius = length(vUv - 0.5) * 2.0;
        float glow = exp(-radius * radius * 7.0) * 0.42;
        float core = 1.0 - smoothstep(0.05, 0.21, radius);
        gl_FragColor = vec4(mix(vec3(1.0, 0.34, 0.08), vec3(1.0, 0.79, 0.44), core), (glow + core * 0.8) * uOpacity);
      }
    `,
  })
  const head = new THREE.Mesh(new THREE.PlaneGeometry(0.23, 0.23), headMaterial)
  head.position.z = 0.015
  group.add(head)
  let opacity = 1
  group.userData.setOpacity = (value: number) => { opacity = clamp(value, 0, 1) }
  group.userData.setExternalParticles = (enabled: boolean) => {
    axes.visible = !enabled
    curve.visible = !enabled
  }

  return {
    group,
    getTargets(requestedCount) {
      const targetCount = Math.max(0, Math.floor(requestedCount))
      const positions = new Float32Array(targetCount * 3)
      const kind = new Float32Array(targetCount)
      const parameter = new Float32Array(targetCount)
      const colors = new Float32Array(targetCount * 3)
      const axisCount = Math.round(targetCount * 0.25)
      const curveCount = targetCount - axisCount
      const axisColor = new THREE.Color(0xa6b3c5)
      const blue = new THREE.Color(0x3274ff)
      const silver = new THREE.Color(0xdde8f4)
      const color = new THREE.Color()
      const segmentLengths: number[] = []
      let totalAxisLength = 0
      for (let segment = 0; segment < axisVertices.length; segment += 2) {
        totalAxisLength += axisVertices[segment].distanceTo(axisVertices[segment + 1])
        segmentLengths.push(totalAxisLength)
      }
      for (let index = 0; index < targetCount; index += 1) {
        if (index < axisCount) {
          const distance = (index / Math.max(1, axisCount - 1)) * totalAxisLength
          let segment = segmentLengths.findIndex((length) => distance <= length)
          if (segment < 0) segment = segmentLengths.length - 1
          const previousLength = segment === 0 ? 0 : segmentLengths[segment - 1]
          const amount = clamp((distance - previousLength) / (segmentLengths[segment] - previousLength), 0, 1)
          const start = axisVertices[segment * 2]
          const end = axisVertices[segment * 2 + 1]
          positions[index * 3] = THREE.MathUtils.lerp(start.x, end.x, amount)
          positions[index * 3 + 1] = THREE.MathUtils.lerp(start.y, end.y, amount)
          positions[index * 3 + 2] = 0
          axisColor.toArray(colors, index * 3)
        } else {
          const value = (index - axisCount) / Math.max(1, curveCount - 1)
          positions[index * 3] = 0.42 + value * 3.59
          positions[index * 3 + 1] = chartHeight(value) + (seeded(index, 4) - 0.5) * 0.008
          positions[index * 3 + 2] = 0.005
          kind[index] = 1
          parameter[index] = value
          color.copy(blue).lerp(silver, 0.25 + seeded(index, 5) * 0.56).toArray(colors, index * 3)
        }
      }
      return { positions, kind, parameter, colors }
    },
    update(progress, time) {
      const value = clamp(progress, 0, 1)
      const appear = smoothstep(value, 0, 0.1) * opacity
      const draw = clamp((value - 0.25) / 0.75, 0, 1)
      const labelOpacity = smoothstep(value, 0.25, 0.32) * opacity
      group.visible = appear > 0.001
      axisMaterial.opacity = appear * 0.42
      yLabel.material.opacity = labelOpacity * 0.68
      xLabel.material.opacity = labelOpacity * 0.68
      note.material.opacity = labelOpacity * 0.40
      curveMaterial.uniforms.uProgress.value = draw
      curveMaterial.uniforms.uTime.value = time
      curveMaterial.uniforms.uOpacity.value = appear
      curveMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2)
      head.position.x = 0.42 + draw * 3.59
      head.position.y = chartHeight(draw)
      headMaterial.uniforms.uOpacity.value = labelOpacity * 0.82
    },
    dispose: () => disposeGroup(group),
  }
}
