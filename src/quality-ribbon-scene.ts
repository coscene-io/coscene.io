import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js'
import { createQualityCardGeometry } from './quality-motion-surface'
import { createTaskCardVideo } from './quality-ribbon-video'
import { createRibbonJourney } from './quality-ribbon-journey'
import { createRibbonArchive } from './quality-ribbon-archive'
import { createRibbonClosing, closingAmount } from './quality-ribbon-closing'
import { createArchiveCardCanvas } from './quality-ribbon-archive-art'
import { createClosingCardCanvas } from './quality-ribbon-closing-art'
import { ARCHIVE_START, ARCHIVE_SETTLED, CLOSING_START, CLOSING_SETTLED, JOURNEY_END, archiveTravel } from './quality-ribbon-story'
import type { TraceCardArt, TraceCardId } from './quality-trace-card-art'

const TAU = Math.PI * 2
const TURN_SECONDS = 150
const COLORS = ['#eef2f6', '#d3334d', '#3544b5', '#8eaceb', '#e8edf4']
// Inverse of r185's ACES + sRGB output at exposure .94: #f8f9fc, matching
// --ribbon-ground. Keep the backdrop stable while the card lighting changes.
const STUDIO_EXPOSURE = .94
const STUDIO_BACKGROUND = new THREE.Color(3.36802428, 3.94334679, 6.49747934)
export type RibbonInspection = { id: TraceCardId; stage: 'entering' | 'reading' | 'leaving' }
export type RibbonScene = {
  setJourneyProgress(value: number): void
  setBrowsing(value: boolean): void
  setPlaying(value: boolean): void
  setSuspended(value: boolean): void
  step(direction: number): void
  inspect(id: TraceCardId): void
  leaveInspection(): void
  toggleVideo(): void
  dispose(): void
}

// One closed belt: every record has the same physical size and follows the
// same arc-length parameter, tangent, normal and curvature. No lane transforms.
const profile = new THREE.EllipseCurve(0, 0, 10.2, 12, Math.PI / 2, Math.PI / 2 - TAU, true)
profile.arcLengthDivisions = 720
profile.updateArcLengths()
const CARD_WIDTH = 4.40, CARD_HEIGHT = CARD_WIDTH * 760 / 1200
const RECORD_COUNT = 15
const STEP = TAU / RECORD_COUNT

export function ribbonPose(index: number, phase: number) {
  const u = THREE.MathUtils.euclideanModulo(index / RECORD_COUNT + phase / TAU, 1)
  const p = profile.getPointAt(u), t = profile.getTangentAt(u)
  const before = profile.getTangentAt(THREE.MathUtils.euclideanModulo(u - .004, 1))
  const after = profile.getTangentAt(THREE.MathUtils.euclideanModulo(u + .004, 1))
  const tangent = new THREE.Vector3(t.x, 0, t.y), up = new THREE.Vector3(0, 1, 0)
  const normal = new THREE.Vector3().crossVectors(tangent, up).normalize()
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(tangent, up, normal))
  const curvature = Math.acos(THREE.MathUtils.clamp(before.dot(after), -1, 1)) / (.008 * profile.getLength())
  return { position: new THREE.Vector3(p.x, 0, p.y), quaternion, curl: THREE.MathUtils.clamp(curvature * 5.2, .10, 1.10) }
}

function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#5d626c')
  const geometries: THREE.BufferGeometry[] = [], materials: THREE.Material[] = []
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128
  const pen = canvas.getContext('2d')!, gradient = pen.createRadialGradient(64, 64, 14, 64, 64, 64)
  gradient.addColorStop(0, '#fff'); gradient.addColorStop(.65, '#fff'); gradient.addColorStop(1, '#ffffff00')
  pen.fillStyle = gradient; pen.fillRect(0, 0, 128, 128)
  const texture = new THREE.CanvasTexture(canvas)
  function panel(w: number, h: number, xyz: [number, number, number], color: string, strength: number) {
    const geometry = new THREE.PlaneGeometry(w, h)
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength), map: texture,
      side: THREE.DoubleSide, transparent: true, depthWrite: false, toneMapped: false })
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(...xyz); mesh.lookAt(0, 0, 0)
    scene.add(mesh); geometries.push(geometry); materials.push(material)
  }
  panel(11, 13, [-6, 9, 9], '#fcfdff', 5)
  panel(1.6, 14, [8, 1, -4], '#e7edff', 8)
  panel(13, 2, [-3, -6, -5], '#f4dadd', 2)
  panel(18, 1.8, [-2, 4, -8], '#d6e1ff', 5)
  panel(15, 1.5, [-1, -3, 5], '#f8faff', 3.8)
  panel(8, 4, [3, 3, 10], '#f8faff', 2.1)
  const generator = new THREE.PMREMGenerator(renderer), target = generator.fromScene(scene, .035)
  generator.dispose(); texture.dispose(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose())
  return target
}

export function createRibbonScene(host: HTMLElement, artwork: TraceCardArt[], onSelect: (id: TraceCardId) => void,
  onActive: (id: TraceCardId) => void, onLost: () => void,
  onInspection: (state: RibbonInspection | null) => void,
  onVideoState: (state: { playing: boolean; error: boolean }) => void,
  options: { journey?: boolean } = {}): RibbonScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  let detailSampling = false
  const screenRatio = () => {
    const base = Math.min(2, Math.max(1.5, devicePixelRatio || 1))
    if (!detailSampling) return base
    // Small printed cards benefit from extra coverage before browser downsampling.
    // Bound the additional framebuffer cost and retain the opening's resolution.
    const pixels = Math.max(1, host.clientWidth * host.clientHeight)
    return Math.max(base, Math.min(2.5, Math.max(2, (devicePixelRatio || 1) * 1.25), Math.sqrt(8_000_000 / pixels)))
  }
  renderer.setPixelRatio(screenRatio())
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = STUDIO_EXPOSURE
  renderer.domElement.setAttribute('aria-hidden', 'true'); host.append(renderer.domElement)
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, .5, 100)
  scene.background = STUDIO_BACKGROUND.clone()
  const environment = studioEnvironment(renderer)
  scene.environment = environment.texture; scene.environmentIntensity = .6
  const key = new THREE.DirectionalLight('#fcfdff', 3.6); key.position.set(-7, 9, 12)
  const edge = new THREE.DirectionalLight('#d5dfff', 1.6); edge.position.set(7, 3, -6)
  const fill = new THREE.HemisphereLight('#f6f8ff', '#858790', .50)
  const bounce = new THREE.DirectionalLight('#f8faff', 1.2); bounce.position.set(0, -1, 14)
  scene.add(key, edge, fill, bounce)
  const belt = new THREE.Group(); scene.add(belt)
  const geometries: THREE.BufferGeometry[] = [], materials: THREE.Material[] = [], textures: THREE.Texture[] = []
  const geometry = createQualityCardGeometry(CARD_WIDTH, CARD_HEIGHT)
  geometries.push(geometry.body, geometry.face)
  for (const base of [geometry.body, geometry.face]) {
    const position = base.getAttribute('position').clone(), normal = base.getAttribute('normal').clone(), radius = 5.2
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i), z = position.getZ(i), a = x / radius, nx = normal.getX(i), nz = normal.getZ(i)
      position.setXYZ(i, (radius + z) * Math.sin(a), position.getY(i), (radius + z) * Math.cos(a) - radius)
      normal.setXYZ(i, nx * Math.cos(a) + nz * Math.sin(a), normal.getY(i), -nx * Math.sin(a) + nz * Math.cos(a))
    }
    base.morphAttributes.position = [position]; base.morphAttributes.normal = [normal]
    base.computeBoundingBox(); base.computeBoundingSphere()
  }
  const cards = artwork.map((art, i) => {
    const silver = i % 5 === 0 || i % 5 === 4
    const material = new THREE.MeshPhysicalMaterial({ color: COLORS[i % 5], roughness: silver ? .19 : .24,
      metalness: silver ? .90 : .36, clearcoat: .75, clearcoatRoughness: .16, envMapIntensity: 1.1 })
    const closingMix = { value: 0 }
    // Only the front bevel becomes a neutral satin edge. Original local Z
    // survives curling; the coloured back keeps its established finish.
    material.onBeforeCompile = shader => {
      shader.uniforms.closingEdgeMix = closingMix
      shader.uniforms.closingEdgeColor = { value: new THREE.Color('#9ca5b8') }
      shader.vertexShader = 'varying float vCardSide;\n' + shader.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\nvCardSide = position.z;')
      shader.fragmentShader = 'varying float vCardSide; uniform float closingEdgeMix; uniform vec3 closingEdgeColor;\n' + shader.fragmentShader
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\nfloat edgeFinish = closingEdgeMix * smoothstep(.004, .020, vCardSide); diffuseColor.rgb = mix(diffuseColor.rgb, closingEdgeColor, edgeFinish);')
      shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, .68, edgeFinish);')
      shader.fragmentShader = shader.fragmentShader.replace('#include <metalnessmap_fragment>',
        '#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, .12, edgeFinish);')
    }
    const texture = new THREE.CanvasTexture(art.canvas); texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
    const archiveTexture = options.journey ? new THREE.CanvasTexture(createArchiveCardCanvas(art)) : texture
    archiveTexture.colorSpace = THREE.SRGBColorSpace; archiveTexture.anisotropy = texture.anisotropy
    const closingTexture = options.journey ? new THREE.CanvasTexture(createClosingCardCanvas(art)) : texture
    closingTexture.colorSpace = THREE.SRGBColorSpace; closingTexture.anisotropy = texture.anisotropy
    const archiveMix = { value: 0 }
    const ink = new THREE.MeshPhysicalMaterial({ map: texture, color: '#ffffff', metalness: 0,
      roughness: .72, clearcoat: 0, specularIntensity: .06,
      emissiveMap: texture, emissive: '#ffffff', emissiveIntensity: .12,
      envMapIntensity: .18, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
    // Preserve a print mask in the base target alpha, so scattered light does
    // not erase dark type when it crosses a white printed face.
    ink.onBeforeCompile = shader => {
      if (options.journey) {
        shader.uniforms.archiveMap = { value: archiveTexture }
        shader.uniforms.archiveMix = archiveMix
        shader.uniforms.closingMap = { value: closingTexture }
        shader.uniforms.closingMix = closingMix
        shader.fragmentShader = 'uniform sampler2D archiveMap; uniform float archiveMix; uniform sampler2D closingMap; uniform float closingMix;\n' + shader.fragmentShader
        shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>',
          THREE.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )',
            'mix(mix(texture2D(map, vMapUv), texture2D(archiveMap, vMapUv), archiveMix), texture2D(closingMap, vMapUv), closingMix)'))
        shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>',
          THREE.ShaderChunk.emissivemap_fragment.replace('texture2D( emissiveMap, vEmissiveMapUv )',
            'mix(mix(texture2D(emissiveMap, vEmissiveMapUv), texture2D(archiveMap, vEmissiveMapUv), archiveMix), texture2D(closingMap, vEmissiveMapUv), closingMix)'))
      }
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', '#include <opaque_fragment>\ngl_FragColor.a = opacity < .999 ? opacity : 0.0;')
    }
    const body = new THREE.Mesh(geometry.body, material), face = new THREE.Mesh(geometry.face, ink)
    // Keep the ink above its matching crowned shell even at the archive's
    // longer camera distance; sub-depth-pixel overlap makes coloured edges crawl.
    face.position.z = .006; body.userData.recordId = face.userData.recordId = art.id
    const group = new THREE.Group(); group.add(body, face); belt.add(group)
    materials.push(material, ink); textures.push(texture)
    if (archiveTexture !== texture) textures.push(archiveTexture)
    if (closingTexture !== texture) textures.push(closingTexture)
    return { group, body, face, texture, archiveTexture, closingTexture, archiveMix, closingMix, id: art.id }
  })
  const bodyFinishes = cards.map(({ body }) => ({ material: body.material,
    roughness: body.material.roughness, clearcoat: body.material.clearcoat,
    clearcoatRoughness: body.material.clearcoatRoughness, color: body.material.color.clone(),
    metalness: body.material.metalness, envMapIntensity: body.material.envMapIntensity,
    specularIntensity: body.material.specularIntensity }))
  const archiveEdge = new THREE.Color('#777f96')
  let archiveCompact = false
  const taskCard = cards.find(card => card.id === 'C00')!
  const journey = options.journey ? createRibbonJourney(scene, renderer, camera, belt, cards) : null
  const archive = journey ? createRibbonArchive(host, scene, camera, belt, cards, ribbonPose) : null
  const closing = journey ? createRibbonClosing(host, camera, belt, cards) : null
  let closingPhase = 0
  let journeyProgress = journey ? 0 : 1, journeyTime = 0, previewVideo = false
  let browsing = false
  const ringInteractive = () => journeyProgress >= 1 && journeyProgress <= ARCHIVE_START
  let resumeVideo = false
  const taskVideo = createTaskCardVideo(artwork.find(art => art.id === 'C00')!.canvas, onVideoState)
  // Photograph the metal reflections separately, with opaque black prints as
  // occluders. Bloom can then spread from a curl without washing out the text.
  const glowComposer = new EffectComposer(renderer); glowComposer.renderToScreen = false
  glowComposer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .70, .36, .92)
  glowComposer.addPass(bloom)
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 })); composer.addPass(new RenderPass(scene, camera))
  const combine = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, glowTexture: { value: null }, glowStrength: { value: .22 } },
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'uniform sampler2D tDiffuse; uniform sampler2D glowTexture; uniform float glowStrength; varying vec2 vUv; void main(){vec4 base=texture2D(tDiffuse,vUv);vec3 light=texture2D(glowTexture,vUv).rgb;float mask=.06+.94*base.a;gl_FragColor=vec4(base.rgb+light*glowStrength*mask,1.0);}',
  })
  composer.addPass(combine)
  // r185 SMAA expects linear-sRGB: resolve thin reflected edges before output.
  const antialias = new SMAAPass(); composer.addPass(antialias)
  const output = new OutputPass(); composer.addPass(output)
  const black = new THREE.MeshBasicMaterial({ color: 0 }); materials.push(black)
  const printMaterials = cards.map(card => card.face.material)
  const background = scene.background, darkness = new THREE.Color(0)
  const openingGround = new THREE.Color('#a4abb6'), ribbonGround = fill.groundColor.clone()
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), world = new THREE.Vector3()
  const projected = new THREE.Vector3(), corner = new THREE.Vector3(), normal = new THREE.Vector3(), view = new THREE.Vector3(), rotation = new THREE.Quaternion()
  const hitObjects = cards.flatMap(card => [card.face, card.body])
  let width = 1, height = 1, phase = 0, playing = true, suspended = false, dead = false, frame = 0
  let stageVisible = true, available = !document.hidden
  let then = performance.now(), resumeAt = then, pointerId = -1, downX = 0, downY = 0, startPhase = 0, dragged = false
  let active: TraceCardId = 'C00', dirty = true
  let inspection: RibbonInspection | null = null, pendingInspection: TraceCardId | null = null
  let focusAmount = 0, focusStarted = 0, focusFromPhase = 0, focusToPhase = 0, alignDuration = 0, returnFrom = 0
  let inactiveAt = available ? 0 : performance.now()
  const baseEye = new THREE.Vector3(), aim = new THREE.Vector3(), focusEye = new THREE.Vector3(), focusAim = new THREE.Vector3()
  const worldUp = new THREE.Vector3(0, 1, 0), focusRight = new THREE.Vector3()
  const focusDirection = new THREE.Vector3(), focusUp = new THREE.Vector3()
  let overviewRoll = .40
  const frontCenter = new THREE.Vector3()
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
  const ease = (t: number) => { t = THREE.MathUtils.clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10) }
  function signalInspection() { onInspection(inspection ? { ...inspection } : null) }
  function beginInspection(id: TraceCardId) {
    const index = cards.findIndex(card => card.id === id)
    if (index < 0) return
    pendingInspection = null
    inspection = { id, stage: 'entering' }; focusStarted = performance.now(); focusFromPhase = phase
    const offset = THREE.MathUtils.euclideanModulo(-index * STEP - phase + Math.PI, TAU) - Math.PI
    focusToPhase = phase + offset; alignDuration = 1000 + Math.abs(offset) / STEP * 160
    focusAmount = 0; active = id; onActive(id); signalInspection(); dirty = true
    if (pointerId >= 0 && host.hasPointerCapture(pointerId)) host.releasePointerCapture(pointerId)
    pointerId = -1; host.classList.remove('is-dragging')
  }
  function beginReturn() {
    if (!inspection || inspection.stage === 'leaving') return
    taskVideo.setActive(false, false, Boolean(journey))
    returnFrom = focusAmount; focusStarted = performance.now()
    inspection = { ...inspection, stage: 'leaving' }; signalInspection(); dirty = true
  }
  function inspect(id: TraceCardId) {
    if (!ringInteractive()) return
    if (inspection?.id === id && inspection.stage !== 'leaving') return
    if (inspection) { pendingInspection = id; beginReturn() }
    else beginInspection(id)
  }
  function updateInspection(now: number) {
    if (!inspection) return
    const elapsed = now - focusStarted
    if (inspection.stage === 'entering') {
      const align = reduced() ? 1 : elapsed / alignDuration
      const approach = reduced() ? 1 : (elapsed - alignDuration * .65) / 1200
      phase = THREE.MathUtils.lerp(focusFromPhase, focusToPhase, ease(align))
      focusAmount = ease(approach); dirty = true
      if (align >= 1 && approach >= 1) {
        phase = focusToPhase; focusAmount = 1; inspection = { ...inspection, stage: 'reading' }
        if (inspection.id === 'C00') taskVideo.setActive(true, !reduced())
        signalInspection()
      }
    } else if (inspection.stage === 'leaving') {
      const t = reduced() ? 1 : elapsed / (950 * Math.max(.3, returnFrom))
      focusAmount = returnFrom * (1 - ease(t)); dirty = true
      if (t >= 1) {
        inspection = null; focusAmount = 0
        if (pendingInspection) beginInspection(pendingInspection)
        else { resumeAt = now + 300; signalInspection() }
      }
    }
  }
  function frameCamera() {
    if (focusAmount <= 0) { camera.up.copy(worldUp); camera.position.copy(baseEye); camera.lookAt(0, 0, 0); return }
    const portrait = width < 700, cardFraction = portrait ? .90 : width < 1000 ? .53 : .49
    const centerX = portrait ? .5 : .31, centerY = portrait ? Math.max(.30, 250 / height) : .53
    const halfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const distance = CARD_WIDTH / (2 * halfFov * camera.aspect * cardFraction)
    belt.updateMatrixWorld(true)
    // Read along the front card's own basis. The camera rolls into alignment;
    // the cards keep their common tilted path throughout the entire approach.
    focusDirection.set(0, .48, 1).normalize().applyQuaternion(belt.quaternion)
    focusUp.set(0, 1, -.48).normalize().applyQuaternion(belt.quaternion)
    focusRight.set(1, 0, 0).applyQuaternion(belt.quaternion)
    frontCenter.set(0, 0, 12).applyMatrix4(belt.matrixWorld)
    focusAim.copy(frontCenter)
    focusAim.addScaledVector(focusRight, -(centerX * 2 - 1) * distance * halfFov * camera.aspect)
    focusAim.addScaledVector(focusUp, (centerY * 2 - 1) * distance * halfFov)
    focusEye.copy(focusAim).addScaledVector(focusDirection, distance)
    camera.position.lerpVectors(baseEye, focusEye, focusAmount)
    camera.up.lerpVectors(worldUp, focusUp, focusAmount).normalize()
    aim.set(0, 0, 0).lerp(focusAim, focusAmount); camera.lookAt(aim)
  }
  function resize() {
    width = host.clientWidth; height = host.clientHeight
    if (!width || !height) return
    const portrait = width < 700
    if (journey && archiveCompact !== portrait) {
      archiveCompact = portrait
      artwork.forEach((art, index) => {
        createArchiveCardCanvas(art, cards[index].archiveTexture.image, archiveCompact)
        cards[index].archiveTexture.needsUpdate = true
      })
    }
    const ratio = screenRatio()
    if (renderer.getPixelRatio() !== ratio) { renderer.setPixelRatio(ratio); composer.setPixelRatio(ratio) }
    renderer.setSize(width, height); composer.setSize(width, height)
    glowComposer.setPixelRatio(Math.min(renderer.getPixelRatio(), 1)); glowComposer.setSize(width, height)
    camera.aspect = width / height
    host.dataset.pixelRatio = String(ratio)
    host.dataset.renderSize = `${renderer.domElement.width}x${renderer.domElement.height}`
    host.dataset.detailSampling = String(detailSampling)
    // A low sightline compresses the empty centre; the world-space roll makes
    // the front run travel diagonally. Its continuation exits the frame.
    overviewRoll = portrait ? .38 : .40
    belt.rotation.set(portrait ? .23 : .24, 0, overviewRoll, 'ZYX')
    belt.position.set(portrait ? .10 : 3.0, portrait ? 1.90 : 2.50, 0)
    const cardFraction = portrait ? .67 : .34
    const distance = 12 + CARD_WIDTH / (2 * Math.tan(16 * Math.PI / 180) * camera.aspect * cardFraction)
    baseEye.set(0, 0, distance)
    frameCamera(); camera.updateProjectionMatrix()
    closing?.prepare(width, height)
    dirty = true
  }
  function draw() {
    // Grazing metal reflections belong to the moving belt. Once the records
    // settle, a satin finish keeps their narrow, overlapping contours readable.
    const archiveFinish = journey ? ease((journeyProgress - ARCHIVE_START) / .70) : 0
    const finale = journey ? closingAmount(journeyProgress) : 0
    cards.forEach(card => { card.closingMix.value = finale })
    bodyFinishes.forEach(({ material, roughness, clearcoat, clearcoatRoughness, color, metalness, envMapIntensity, specularIntensity }) => {
      material.color.copy(color).lerp(archiveEdge, archiveFinish)
      material.roughness = THREE.MathUtils.lerp(roughness, .72, archiveFinish)
      material.clearcoat = THREE.MathUtils.lerp(clearcoat, .08, archiveFinish)
      material.clearcoatRoughness = THREE.MathUtils.lerp(clearcoatRoughness, .32, archiveFinish)
      material.metalness = THREE.MathUtils.lerp(metalness, .08, archiveFinish)
      material.envMapIntensity = THREE.MathUtils.lerp(envMapIntensity, .25, archiveFinish)
      material.specularIntensity = THREE.MathUtils.lerp(specularIntensity, .12, archiveFinish)
      if (finale > 0) {
        // Broader reflections remain stable on the floating card's small rim.
        material.color.lerp(color, finale * .90)
        material.roughness = THREE.MathUtils.lerp(material.roughness, .38, finale)
        material.metalness = THREE.MathUtils.lerp(material.metalness, metalness, finale)
        material.clearcoat = THREE.MathUtils.lerp(material.clearcoat, .30, finale)
        material.envMapIntensity = THREE.MathUtils.lerp(material.envMapIntensity, .85, finale)
      }
    })
    camera.fov = 32
    frameCamera(); camera.updateMatrixWorld()
    const displayedPhase = phase - (journey ? archiveTravel(journeyProgress) * TAU : 0)
    cards.forEach((card, i) => {
      const pose = ribbonPose(i, displayedPhase)
      card.group.position.copy(pose.position); card.group.quaternion.copy(pose.quaternion)
      card.group.scale.setScalar(1)
      card.body.morphTargetInfluences![0] = pose.curl; card.face.morphTargetInfluences![0] = pose.curl
    })
    if (journey) {
      const state = journey.update(journeyProgress, journeyTime, width, height, playing && !reduced())
      const light = state.light, mix = THREE.MathUtils.lerp
      key.intensity = mix(2.05, 3.6, light); edge.intensity = mix(1.4, 1.6, light)
      fill.intensity = mix(.85, .50, light); bounce.intensity = 1.2 * light
      key.position.set(mix(-6, -7, light), mix(8, 9, light), 12)
      edge.position.set(mix(8, 7, light), mix(2, 3, light), mix(-5, -6, light))
      renderer.toneMappingExposure = mix(.92, STUDIO_EXPOSURE, light)
      background.copy(STUDIO_BACKGROUND).multiplyScalar(STUDIO_EXPOSURE / renderer.toneMappingExposure)
      fill.groundColor.copy(openingGround).lerp(ribbonGround, light)
      // The established opening does not use the inspection reflection bloom.
      combine.uniforms.glowStrength.value = mix(.22, .04, archiveFinish) * light * (1 - finale)
      if (state.preview !== previewVideo) {
        previewVideo = state.preview
        if (!inspection) taskVideo.setActive(previewVideo, !reduced(), true)
      }
      host.dataset.journeyProgress = journeyProgress.toFixed(5)
      host.dataset.heroObject = taskCard.group.uuid
      host.dataset.heroReveal = state.reveal.toFixed(5)
      // The closing lifts directly from the spread records, before the former
      // deck-consolidation path. Recompute that exact source pose every frame.
      const archiveState = archive!.update(Math.min(journeyProgress, CLOSING_START), phase, width, height, finale)
      const closingState = closing!.update(journeyProgress, closingPhase, width, height)
      host.dataset.settledRecords = String(archiveState.settled)
      host.dataset.orbitingRecords = String(closingState.orbiting)
      host.dataset.overviewRecords = String(cards.filter(card => card.archiveMix.value > .999).length)
      host.dataset.browsing = String(browsing)
      host.dataset.journeyStage = journeyProgress < .32 ? 'production' : journeyProgress < .60 ? 'task' : journeyProgress < 1 ? 'joining'
        : journeyProgress <= ARCHIVE_START ? 'ribbon' : journeyProgress < ARCHIVE_SETTLED ? 'archiving'
          : journeyProgress <= CLOSING_START ? 'archive' : journeyProgress < CLOSING_SETTLED ? 'closing' : 'complete'
    }
    camera.updateMatrixWorld()
    scene.updateMatrixWorld()
    let nearest: TraceCardId = active, best = -Infinity
    const safeTop = (host.parentElement?.querySelector('.ribbon-heading')?.getBoundingClientRect().bottom || height * .16) + 20
    const safeBottom = (host.parentElement?.querySelector('.ribbon-footer')?.getBoundingClientRect().top || height * .86) - 18
    for (const card of cards) {
      card.group.getWorldPosition(world); projected.copy(world).project(camera)
      card.group.getWorldQuaternion(rotation); normal.set(0, 0, 1).applyQuaternion(rotation)
      view.copy(camera.position).sub(world).normalize()
      const facing = normal.dot(view)
      if (facing < .25) continue
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      for (const x of [-CARD_WIDTH / 2, CARD_WIDTH / 2]) for (const y of [-CARD_HEIGHT / 2, CARD_HEIGHT / 2]) {
        corner.set(x, y, .05); card.group.localToWorld(corner); corner.project(camera)
        const px = (corner.x + 1) * width / 2, py = (1 - corner.y) * height / 2
        minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py)
      }
      const visibleArea = Math.max(0, Math.min(width - 12, maxX) - Math.max(12, minX)) * Math.max(0, Math.min(safeBottom, maxY) - Math.max(safeTop, minY))
      const coverage = visibleArea / Math.max(1, (maxX - minX) * (maxY - minY))
      const score = coverage * 60 + facing * 12 - Math.abs(projected.x) * 6 - Math.abs(projected.y) * 2
      if (score > best) { best = score; nearest = card.id }
    }
    if (ringInteractive() && !inspection && nearest !== active) { active = nearest; onActive(active) }
    host.dataset.phase = phase.toFixed(5); host.dataset.activeRecord = active
    host.dataset.inspection = inspection?.stage || 'idle'; host.dataset.focusAmount = focusAmount.toFixed(4)
    host.style.setProperty('--ribbon-focus', focusAmount.toFixed(4))
    if (combine.uniforms.glowStrength.value > .001) {
      scene.background = darkness
      cards.forEach(card => { card.face.material = black as unknown as THREE.MeshPhysicalMaterial })
      glowComposer.render()
      cards.forEach((card, i) => { card.face.material = printMaterials[i] })
    }
    scene.background = background
    combine.uniforms.glowTexture.value = bloom.renderTargetsHorizontal[0].texture
    composer.render(); dirty = false
  }
  function tick(now: number) {
    if (dead) return
    const dt = Math.min((now - then) / 1000, .05); then = now
    if (available) {
      updateInspection(now)
      if (taskVideo.update()) { taskCard.texture.needsUpdate = true; dirty = true }
      if (journey && journeyProgress < 1 && playing && !reduced()) { journeyTime += dt; dirty = true }
      // React defaults to paused for reduced motion; an explicit play still works.
      if (journey && journeyProgress >= CLOSING_SETTLED && playing) {
        closingPhase = (closingPhase + dt * TAU / 26) % TAU; dirty = true
      }
      if (ringInteractive() && !inspection && playing && pointerId < 0 && now > resumeAt) {
        const gain = Math.min(1, (now - resumeAt) / 1200)
        phase -= dt * TAU / TURN_SECONDS * gain; phase %= TAU; dirty = true
      }
      if (dirty) draw()
    }
    frame = requestAnimationFrame(tick)
  }
  function manipulate(delta: number) { if (inspection || !ringInteractive()) return; phase += delta; resumeAt = performance.now() + 2800; dirty = true }
  function down(event: PointerEvent) {
    if (event.button !== 0 || !available || inspection || !ringInteractive()) return
    pointerId = event.pointerId; downX = event.clientX; downY = event.clientY; startPhase = phase; dragged = false
    host.setPointerCapture(pointerId); host.classList.add('is-dragging')
  }
  function move(event: PointerEvent) {
    if (event.pointerId !== pointerId || !available) return
    const dx = event.clientX - downX, dy = event.clientY - downY
    // Native vertical touch moves the story. Horizontal dragging remains a
    // direct way to turn the belt; free browsing restores the full gesture.
    if (journey && !browsing && event.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx) * 1.15) {
      if (host.hasPointerCapture(pointerId)) host.releasePointerCapture(pointerId)
      pointerId = -1; host.classList.remove('is-dragging'); return
    }
    if (Math.hypot(dx, dy) > 5) dragged = true
    if (dragged) {
      const vertical = journey && !browsing && event.pointerType === 'touch' ? 0 : dy
      phase = startPhase + (dx * Math.cos(overviewRoll) - vertical * Math.sin(overviewRoll)) * .003
      dirty = true; resumeAt = performance.now() + 2800
    }
  }
  function up(event: PointerEvent) {
    if (event.pointerId !== pointerId) return
    if (!dragged && event.type !== 'pointercancel' && available) {
      const rect = host.getBoundingClientRect()
      pointer.set((event.clientX - rect.left) / width * 2 - 1, -(event.clientY - rect.top) / height * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(hitObjects, false)[0]
      if (hit) onSelect(hit.object.userData.recordId as TraceCardId)
    }
    if (host.hasPointerCapture(pointerId)) host.releasePointerCapture(pointerId)
    pointerId = -1; host.classList.remove('is-dragging'); resumeAt = performance.now() + 2800
  }
  function wheel(event: WheelEvent) {
    if (!available || inspection || event.ctrlKey || !ringInteractive()) return
    if (journey && !browsing) return
    event.preventDefault()
    const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1
    manipulate(-Math.max(-240, Math.min(240, delta * unit)) * .0010)
  }
  function keydown(event: KeyboardEvent) {
    if (!available || inspection || !ringInteractive()) return
    if (journey && !browsing && ['ArrowUp', 'ArrowDown'].includes(event.key)) return
    if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)) {
      event.preventDefault(); manipulate((event.key === 'ArrowRight' || event.key === 'ArrowDown' ? -1 : 1) * STEP)
    } else if (event.key === 'Enter') { event.preventDefault(); onSelect(active) }
  }
  function lost(event: Event) { event.preventDefault(); suspended = true; visibility(); onLost() }
  function visibility() {
    if (dead) return
    const next = !document.hidden && stageVisible && !suspended
    if (next === available) return
    const now = performance.now()
    available = next
    if (!available) {
      inactiveAt = now
      // Capture the user's video choice once, even when pause reasons overlap.
      resumeVideo = taskVideo.wantsToPlay(); taskVideo.setActive(false, false, true)
      if (pointerId >= 0 && host.hasPointerCapture(pointerId)) host.releasePointerCapture(pointerId)
      pointerId = -1; host.classList.remove('is-dragging')
    } else {
      if (inactiveAt) {
        if (inspection) focusStarted += Math.max(0, now - Math.max(inactiveAt, focusStarted))
        resumeAt += now - inactiveAt; inactiveAt = 0
      }
      then = now
      if (previewVideo || inspection?.stage === 'reading' && inspection.id === 'C00') taskVideo.setActive(true, resumeVideo)
      dirty = true
    }
  }
  host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move)
  host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up)
  host.addEventListener('wheel', wheel, { passive: false }); host.addEventListener('keydown', keydown)
  renderer.domElement.addEventListener('webglcontextlost', lost)
  document.addEventListener('visibilitychange', visibility)
  const observer = new ResizeObserver(resize); observer.observe(host); resize()
  const bounds = host.getBoundingClientRect()
  stageVisible = bounds.bottom > 0 && bounds.right > 0 && bounds.top < innerHeight && bounds.left < innerWidth
  visibility()
  if (available) draw()
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    if (dead) return
    stageVisible = entry.isIntersecting
    visibility()
  })
  visibilityObserver.observe(host)
  frame = requestAnimationFrame(tick)
  return {
    setJourneyProgress(value) {
      if (!journey) return
      let next = THREE.MathUtils.clamp(Number.isFinite(value) ? value : 0, 0, JOURNEY_END)
      if (next >= .999 && next < 1) next = 1
      if ((next < 1 || next > ARCHIVE_START) && inspection) {
        inspection = null; pendingInspection = null; focusAmount = 0; taskVideo.setActive(false, false, true); signalInspection()
      }
      // Reset a previously rotated belt only before the task card begins to
      // share its target pose; backward scrolling must retain that same target.
      if (next < .42) phase = 0
      if (journeyProgress < 1 && next >= 1) resumeAt = performance.now() + 600
      if (journeyProgress > ARCHIVE_START && next <= ARCHIVE_START) resumeAt = performance.now() + 800
      if (next > ARCHIVE_START && pointerId >= 0) {
        if (host.hasPointerCapture(pointerId)) host.releasePointerCapture(pointerId)
        pointerId = -1; host.classList.remove('is-dragging')
      }
      if (next > ARCHIVE_START && journeyProgress <= ARCHIVE_START) {
        // Carry the last viewed video frame into C00's overview, not a new still.
        createArchiveCardCanvas(artwork.find(art => art.id === 'C00')!, taskCard.archiveTexture.image, archiveCompact)
        taskCard.archiveTexture.needsUpdate = true
        taskCard.closingTexture.image = createClosingCardCanvas(artwork.find(art => art.id === 'C00')!)
        taskCard.closingTexture.needsUpdate = true
      }
      journeyProgress = next; dirty = true
      const detailed = next >= ARCHIVE_SETTLED ? true : next < ARCHIVE_START ? false : detailSampling
      if (detailed !== detailSampling) { detailSampling = detailed; resize() }
    },
    setBrowsing(value) { browsing = value; dirty = true },
    setPlaying(value) { playing = value; resumeAt = performance.now(); dirty = true },
    setSuspended(value) {
      suspended = value; visibility()
      if (!value && available) resumeAt = performance.now() + 2200
      dirty = true
    },
    step(direction) { manipulate(-direction * STEP) },
    inspect,
    leaveInspection() { pendingInspection = null; beginReturn() },
    toggleVideo() { if (previewVideo || inspection?.stage === 'reading' && inspection.id === 'C00') taskVideo.toggle() },
    dispose() {
      dead = true; cancelAnimationFrame(frame); observer.disconnect(); visibilityObserver.disconnect()
      taskVideo.dispose(); journey?.dispose(); archive?.dispose()
      host.removeEventListener('pointerdown', down); host.removeEventListener('pointermove', move)
      host.removeEventListener('pointerup', up); host.removeEventListener('pointercancel', up)
      host.removeEventListener('wheel', wheel); host.removeEventListener('keydown', keydown)
      renderer.domElement.removeEventListener('webglcontextlost', lost)
      document.removeEventListener('visibilitychange', visibility)
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose())
      bloom.dispose(); antialias.dispose(); output.dispose(); combine.material.dispose(); glowComposer.dispose(); composer.dispose(); environment.dispose(); renderer.dispose(); renderer.domElement.remove()
    },
  }
}
