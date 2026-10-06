import { Component, Suspense, useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { CameraControls, CameraControlsImpl, ContactShadows, Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { buildMiniatureRoom } from './robot-data-miniature-world'
import { attachWujiHands, collectionRobot, disposeRobot } from './robot-data-miniature-hardware'
import { buildCollectionRoom } from './robot-data-miniature-rooms'
import { sceneLights, isOutdoorScene, ROBOTS, SCENES, WORLD_BOUNDS, NEIGHBORHOOD_BOUNDS, NEIGHBORHOOD_SCENES } from './robot-data-miniature-catalog'
import type { HandConfiguration, Lighting, RobotId, SceneDefinition, SceneId, WorldFocus } from './robot-data-miniature-catalog'
import type { TaskFrame } from './robot-data-miniature-tasks'
import { taskFrame } from './robot-data-miniature-tasks'
import { buildTaskProps } from './robot-data-miniature-task-props'
import { isWorkScene, workTaskFrame } from './robot-data-miniature-work-tasks'
import { buildMiniatureSite } from './robot-data-miniature-site'
import { careTaskFrame } from './robot-data-miniature-care-tasks'
import { batchMiniature } from './robot-data-miniature-batch'

export type MiniatureView = 'overview' | 'close'
export type CameraRequest = { action: 'in' | 'out' | 'fit' | 'distance'; value: number; serial: number }
type Props = { view: MiniatureView; revision: number; reduced: boolean; exploring: boolean; scene: SceneDefinition; robot: RobotId; hand: HandConfiguration; lighting: Lighting; onScene: (id: SceneId) => void; onReady: (ready: boolean, interactive?: boolean) => void; cameraRequest: CameraRequest | null; onDistance: (value: number) => void; frame?: TaskFrame; framing?: 'graphic'; worldFocus?: WorldFocus; selectionOnly?: boolean; hasSelection?: boolean }
const { NONE, ROTATE, TOUCH_ROTATE } = CameraControlsImpl.ACTION
const mouseButtons = { left: ROTATE, middle: NONE, right: NONE, wheel: NONE }
const touches = { one: TOUCH_ROTATE, two: NONE, three: NONE }
let webglSupport: boolean | undefined

function supportsWebGL() {
  if (webglSupport !== undefined) return webglSupport
  try { const gl = document.createElement('canvas').getContext('webgl2'); gl?.getExtension('WEBGL_lose_context')?.loseContext(); return webglSupport = !!gl } catch { return webglSupport = false }
}

function fitPerspective(points: THREE.Vector3[], target: THREE.Vector3, direction: THREE.Vector3, aspect: number, margin = .93) {
  const rotation = new THREE.Matrix4().lookAt(direction, new THREE.Vector3(), new THREE.Vector3(0, 1, 0))
  const inverse = rotation.clone().invert()
  const projected = points.map(point => point.clone().sub(target).applyMatrix4(inverse))
  const tangent = Math.tan(THREE.MathUtils.degToRad(17)) * margin
  const fit = (distance: number) => {
    let left = -Infinity, right = Infinity, bottom = -Infinity, top = Infinity
    for (const point of projected) {
      const halfHeight = (distance - point.z) * tangent
      left = Math.max(left, point.x - halfHeight * aspect); right = Math.min(right, point.x + halfHeight * aspect)
      bottom = Math.max(bottom, point.y - halfHeight); top = Math.min(top, point.y + halfHeight)
    }
    return { valid: left <= right && bottom <= top, x: (left + right) / 2, y: (bottom + top) / 2 }
  }
  let near = Math.max(...projected.map(point => point.z)) + .1, far = 240
  for (let iteration = 0; iteration < 24; iteration++) {
    const middle = (near + far) / 2
    if (fit(middle).valid) far = middle
    else near = middle
  }
  const center = fit(far)
  target.add(new THREE.Vector3(center.x, center.y, 0).applyMatrix4(rotation))
  return direction.clone().multiplyScalar(far).add(target)
}

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onFallback: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFallback() }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function Robot({ id, definition, record, overview, hand, frame }: { id: RobotId; definition: SceneDefinition; record: boolean; overview: boolean; hand: HandConfiguration; frame?: TaskFrame }) {
  const poseFrame = useMemo(() => overview && (isOutdoorScene(definition.id) || ['bedroom', 'bathroom', 'sushi', 'produce', 'office'].includes(definition.id)) ? taskFrame(definition.id, 0, 'everyday') : overview && definition.id === 'care' ? careTaskFrame(0, 'everyday') : overview && isWorkScene(definition.id) ? workTaskFrame(definition.id, 0, 'everyday') : frame, [overview, definition.id, frame])
  const model = useGLTF(`/assets/robot-data-spatial/miniature/${id}/${id}${id === 'h2' ? '-mannequin' : ''}-${overview ? 'overview' : 'web'}.glb${id === 'h2' ? '?v=mannequin-v6' : ''}`)
  const hands = useGLTF(hand === 'wuji' ? ['left', 'right'].map(side => `/assets/robot-data-spatial/miniature/wuji-${side}/wuji-${side}-${overview ? 'overview' : 'web'}.glb`) : [])
  const { gl, invalidate } = useThree()
  const urls = useMemo(() => {
    const paths = new Set<string>()
    model.scene.traverse(node => { if (node instanceof THREE.Mesh && node.material.userData.texture) paths.add(node.material.userData.texture) })
    return [...paths]
  }, [model.scene])
  const originals = useLoader(THREE.TextureLoader, urls)
  const maps = useMemo(() => originals.map(texture => { const copy = texture.clone(); copy.colorSpace = THREE.SRGBColorSpace; copy.flipY = true; copy.needsUpdate = true; return copy }), [originals])
  const robot = useMemo(() => {
    const result = collectionRobot(model.scene, id, definition, poseFrame)
    result.traverse(node => { if (node instanceof THREE.Mesh && node.material.userData.texture) node.material.map = maps[urls.indexOf(node.material.userData.texture)] })
    if (hand === 'wuji') attachWujiHands(result, id, hands.map(model => model.scene), frame?.stage)
    result.updateMatrixWorld(true)
    return result
  }, [model.scene, definition, id, maps, urls, frame, poseFrame, hand, hands])
  const batched = useMemo(() => overview ? batchMiniature([{ root: robot }]) : null, [overview, robot])
  useEffect(() => () => batched?.dispose(), [batched])
  useEffect(() => {
    const loaded = JSON.parse(gl.domElement.dataset.loadedModels || '{}')
    loaded[definition.id] = id
    gl.domElement.dataset.loadedModels = JSON.stringify(loaded)
    invalidate()
    return () => {
      const remaining = JSON.parse(gl.domElement.dataset.loadedModels || '{}')
      delete remaining[definition.id]
      gl.domElement.dataset.loadedModels = JSON.stringify(remaining)
    }
  }, [gl, id, definition.id, overview, invalidate])
  useEffect(() => {
    if (!record) return
    const bounds = new THREE.Box3().setFromObject(robot)
    gl.domElement.dataset.robotBounds = JSON.stringify({ min: bounds.min.toArray(), max: bounds.max.toArray() })
    gl.domElement.dataset.model = id
    gl.domElement.dataset.hand = hand
    const mounts: unknown[] = []
    robot.traverse(node => {
      if (node.userData.configuration !== 'wuji') return
      const box = new THREE.Box3().setFromObject(node)
      mounts.push({ side: node.userData.side, parent: node.parent?.name, scale: node.getWorldScale(new THREE.Vector3()).toArray(), min: box.min.toArray(), max: box.max.toArray() })
    })
    gl.domElement.dataset.handMounts = JSON.stringify(mounts)
    gl.domElement.dataset.headDetail = String(!!robot.getObjectByName('h2_sculpted_features'))
    invalidate()
    return () => { delete gl.domElement.dataset.robotBounds; delete gl.domElement.dataset.model; delete gl.domElement.dataset.hand; delete gl.domElement.dataset.handMounts; delete gl.domElement.dataset.headDetail }
  }, [gl, record, robot, id, hand, invalidate])
  useEffect(() => () => disposeRobot(robot), [robot])
  useEffect(() => () => {
    if (overview) return
    const geometries = new Set<THREE.BufferGeometry>()
    for (const source of [model.scene, ...hands.map(hand => hand.scene)]) source.traverse(node => { if (node instanceof THREE.Mesh) geometries.add(node.geometry) })
    // Retain cached CPU meshes, but release GPU buffers for the body leaving the view.
    geometries.forEach(geometry => geometry.dispose())
  }, [model.scene, hands, overview])
  useEffect(() => () => maps.forEach(texture => texture.dispose()), [maps])
  return <primitive object={batched?.root ?? robot} />
}

function Room({ view, scene: selected, robot, hand, onScene, lighting, frame, framing, worldFocus, selectionOnly, hasSelection = true, onFitPoints }: Props & { onFitPoints: (points: THREE.Vector3[], scene: SceneId) => void }) {
  const originals = useLoader(THREE.TextureLoader, ['/assets/robot-data-spatial/miniature/oak.webp', '/assets/robot-data-spatial/styles/textures/wood-normal.jpg'])
  const { gl, scene, invalidate } = useThree()
  const definitions = useMemo(() => view === 'close' ? [selected] : worldFocus === 'neighborhood' ? SCENES.filter(s => NEIGHBORHOOD_SCENES.includes(s.id)) : SCENES, [view, selected, worldFocus])
  const textures = useMemo(() => originals.map((texture, index) => {
    const copy = texture.clone(); copy.wrapS = copy.wrapT = THREE.RepeatWrapping
    copy.repeat.set(1.2, 1.7); copy.anisotropy = 8
    if (!index) copy.colorSpace = THREE.SRGBColorSpace
    copy.needsUpdate = true
    return copy
  }), [originals])
  const rooms = useMemo(() => definitions.map(definition => definition.id === 'kitchen' ? buildMiniatureRoom(textures[0], textures[1]) : buildCollectionRoom(definition, textures[0], textures[1])), [textures, definitions])
  const batchedRooms = useMemo(() => view === 'overview' ? batchMiniature(rooms.map((room, i) => ({ root: room.root, placement: new THREE.Matrix4().makeTranslation(...definitions[i].position) }))) : null, [rooms, definitions, view])
  useEffect(() => () => batchedRooms?.dispose(), [batchedRooms])
  useEffect(() => {
    if ((framing !== 'graphic' && selected.environment !== 'outdoor') || view !== 'close') return
    const root = rooms[definitions.findIndex(definition => definition.id === selected.id)].root
    root.updateWorldMatrix(true, true)
    const local = root.matrixWorld.clone().invert()
    const points: THREE.Vector3[] = []
    // A cutaway room is not a solid cuboid: fit its built surfaces, not phantom front walls.
    root.traverse(node => {
      if (!(node instanceof THREE.Mesh)) return
      node.geometry.computeBoundingBox()
      const bounds = node.geometry.boundingBox
      if (!bounds || bounds.isEmpty()) return
      const matrix = local.clone().multiply(node.matrixWorld)
      for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) points.push(new THREE.Vector3(x, y, z).applyMatrix4(matrix))
    })
    onFitPoints(points, selected.id)
  }, [rooms, definitions, selected.id, selected.environment, view, framing, onFitPoints])
  const site = useMemo(() => view === 'overview' ? buildMiniatureSite(worldFocus) : null, [view, worldFocus])
  useEffect(() => () => site?.dispose(), [site])
  const taskProps = useMemo(() => frame && view === 'close' ? buildTaskProps(frame) : undefined, [frame, view])
  useEffect(() => () => taskProps?.dispose(), [taskProps])
  useEffect(() => {
    rooms.forEach((room, index) => room.root.traverse(node => {
      if (node.userData.taskProp) node.visible = !(view === 'close' && frame && definitions[index].id === selected.id)
    }))
    gl.domElement.dataset.taskState = JSON.stringify(frame && view === 'close' ? { scene: frame.scene, stage: frame.stage, variant: frame.variant, objects: frame.objects } : null)
    if (taskProps) {
      taskProps.root.updateWorldMatrix(true, true)
      gl.domElement.dataset.taskBounds = JSON.stringify(taskProps.root.children.map(node => {
        const box = new THREE.Box3().setFromObject(node)
        return { id: node.name, min: box.min.toArray(), max: box.max.toArray() }
      }))
    } else delete gl.domElement.dataset.taskBounds
    invalidate()
  }, [rooms, definitions, selected.id, view, frame, taskProps, gl, invalidate])
  const shells = useMemo(() => rooms.map(room => {
    const nodes: THREE.Object3D[] = []
    room.root.traverse(node => { if (node.userData.cutaway) nodes.push(node) })
    return nodes
  }), [rooms])
  const light = sceneLights(view === 'close' && selected.environment === 'outdoor').find(l => l.id === (view === 'overview' ? 'daylight' : lighting))!
  const shadowExtent = selected.id === 'sushi' || selected.id === 'office' || selected.environment === 'outdoor' ? 7.6 : isWorkScene(selected.id) || selected.id === 'produce' ? 6.2 : 4.4
  useFrame(({ camera }) => {
    const hidden: string[] = []
    for (const [index, nodes] of shells.entries()) {
      nodes.forEach(node => {
        const side = node.userData.cutaway
        if (!side) return
        const cut = view === 'close' && definitions[index].id === selected.id
        node.visible = !cut || (side === 'back' ? camera.position.z > -selected.depth / 2 + .25 : side === 'front' ? camera.position.z < selected.depth / 2 - .25 : camera.position.x > -selected.width / 2 + .25)
        if (!node.visible && !hidden.includes(side)) hidden.push(side)
      })
    }
    gl.domElement.dataset.hiddenWalls = hidden.join(',')
  })

  useEffect(() => {
    const environment = new RoomEnvironment()
    const generator = new THREE.PMREMGenerator(gl)
    const target = generator.fromScene(environment, .035)
    const previous = scene.environment
    scene.environment = target.texture
    environment.dispose(); generator.dispose()
    return () => { scene.environment = previous; target.dispose() }
  }, [gl, scene])
  useEffect(() => {
    scene.environmentIntensity = light.environment
    gl.toneMappingExposure = light.exposure
    gl.domElement.dataset.lighting = light.id
    gl.domElement.dataset.scene = selected.id
    gl.domElement.dataset.sceneCount = String(definitions.length)
    invalidate()
  }, [scene, gl, light, selected.id, definitions, invalidate])
  useEffect(() => {
    gl.domElement.dataset.ready = 'true'
    return () => { delete gl.domElement.dataset.ready }
  }, [gl])
  useEffect(() => () => rooms.forEach(room => room.dispose()), [rooms])
  useEffect(() => () => textures.forEach(t => t.dispose()), [textures])
  return <>
    {definitions.map((definition, index) => {
      if (view === 'close' && definition.id !== selected.id) return null
      const currentRobot = view === 'close' ? robot : definition.robot
      return <group key={definition.id} position={view === 'overview' ? definition.position : [0, 0, 0]}>
        {view === 'close' && <primitive object={rooms[index].root} />}
        {view === 'close' && taskProps && <primitive object={taskProps.root} />}
        {ROBOTS[currentRobot].available && <Suspense fallback={view === 'close' ? <Html center><span className="ms-robot-loading" role="status">机器人加载中</span></Html> : null}><Robot id={currentRobot} definition={definition} record={view === 'close'} overview={view === 'overview'} hand={view === 'overview' ? 'wuji' : hand} frame={view === 'close' ? frame : undefined} /></Suspense>}
        {view === 'overview' && (worldFocus !== 'neighborhood' || NEIGHBORHOOD_SCENES.includes(definition.id)) && <Html position={definition.position[2] < 0 ? [0, 2.65, -definition.depth / 2 + .1] : [0, .08, definition.depth / 2 + .12]} center zIndexRange={[2, 1]}>
          <button className="ms-hotspot" data-scene={definition.id} type="button" onClick={() => onScene(definition.id)} aria-current={hasSelection && definition.id === selected.id ? 'location' : undefined} aria-label={`${selectionOnly ? '选择' : '进入'}${definition.name}`}><span>{definition.index}</span>{definition.name}</button>
        </Html>}
      </group>
    })}
    {batchedRooms && <primitive object={batchedRooms.root} />}
    {view === 'overview' && site && <primitive object={site.root} />}
    <hemisphereLight args={['#f6f7f4', '#9da49d', light.ambient]} />
    <directionalLight position={view === 'overview' ? [-18, 34, 22] : [...light.key]} intensity={light.power} color={light.color} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={view === 'overview' ? -38 : -shadowExtent} shadow-camera-right={view === 'overview' ? 38 : shadowExtent} shadow-camera-top={view === 'overview' ? 30 : shadowExtent} shadow-camera-bottom={view === 'overview' ? -30 : -shadowExtent} shadow-camera-near={.1} shadow-camera-far={100} shadow-normalBias={.01} shadow-bias={-.00015} shadow-radius={light.radius} />
    <directionalLight position={[4, 3, 1]} intensity={light.fill} color="#e4edff" />
    {view === 'close' && (lighting === 'dim' || lighting === 'interior' && selected.environment !== 'outdoor') && <pointLight position={[.2, 2.25, -1.5]} intensity={lighting === 'dim' ? 2.5 : 5} color="#ffe2b7" distance={6} decay={2} />}
    {view === 'close' && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.128, 0]} receiveShadow><planeGeometry args={[200, 200]} /><shadowMaterial transparent opacity={.15} /></mesh>}
    {view === 'close' && <ContactShadows key={`${selected.id}-${robot}-${hand}-${frame?.stage}-${frame?.variant}`} position={[0, -.125, 0]} opacity={.28} scale={12} blur={2.5} far={4} resolution={512} frames={1} color="#4c5951" />}
  </>
}

function CameraRig({ view, revision, reduced, exploring, scene: selectedScene, cameraRequest, onDistance, frame, framing, fitPoints, fitScene, worldFocus }: Props & { fitPoints: THREE.Vector3[]; fitScene: SceneId | null }) {
  // Selecting a map label must not reset the overview camera or its zoom limits.
  const scene = view === 'close' ? selectedScene : SCENES[0]
  // Task/condition changes update the world, not the visitor's chosen camera.
  const currentTaskStep = useEffectEvent(() => frame?.step)
  const controls = useRef<CameraControls>(null)
  const overviewPose = useRef<THREE.Vector3 | null>(null)
  const { size, gl, invalidate, camera } = useThree()
  useEffect(() => {
    // The overview sits 60-90 m away; a close-up near plane loses millimetre-scale depth separation.
    camera.near = view === 'overview' ? 2 : .05
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, view, invalidate])
  const minDistance = view === 'overview' ? 18 : 2.1
  const halfFov = Math.atan(Math.tan(THREE.MathUtils.degToRad(17)) * Math.min(1, size.width / size.height))
  const bounds = worldFocus === 'neighborhood' ? NEIGHBORHOOD_BOUNDS : WORLD_BOUNDS
  const radius = view === 'overview' ? Math.hypot((bounds.maxX - bounds.minX) / 2, 4, (bounds.maxZ - bounds.minZ) / 2) : Math.hypot(scene.width / 2, 1.4, scene.depth / 2)
  const fitDistance = radius / Math.sin(halfFov) * 1.06
  const maxDistance = view === 'overview' ? Math.min(210, fitDistance * 1.2) : fitDistance * 1.2
  useEffect(() => {
    const current = controls.current
    if (!current) return
    current.enabled = exploring
    const record = () => {
      const position = current.getPosition(new THREE.Vector3())
      // Keep the selected label, not a stack of overlapping names at oblique angles.
      gl.domElement.dataset.overviewLabels = view === 'overview' && overviewPose.current && position.distanceTo(overviewPose.current) > 1 ? 'focused' : 'all'
      gl.domElement.dataset.cameraState = JSON.stringify({ enabled: current.enabled, buttons: current.mouseButtons, position: position.toArray(), target: current.getTarget(new THREE.Vector3()).toArray(), azimuth: current.azimuthAngle, polar: current.polarAngle, distance: current.distance, minDistance, maxDistance, viewport: gl.getSize(new THREE.Vector2()).toArray() })
      onDistance(Math.round(THREE.MathUtils.clamp(Math.log(current.distance / minDistance) / Math.log(maxDistance / minDistance) * 100, 0, 100)))
    }
    record()
    current.addEventListener('update', record)
    return () => current.removeEventListener('update', record)
  }, [exploring, view, gl, minDistance, maxDistance, onDistance])
  const consumedRequest = useRef<CameraRequest | null>(null)
  useEffect(() => {
    if (!cameraRequest || cameraRequest === consumedRequest.current) return
    const current = controls.current
    if (!current || !exploring) return
    consumedRequest.current = cameraRequest
    if (cameraRequest.action === 'fit') {
      const target = view === 'overview' ? new THREE.Vector3((bounds.minX + bounds.maxX) / 2, 1.3, (bounds.minZ + bounds.maxZ) / 2) : new THREE.Vector3(0, 1, 0)
      const position = new THREE.Vector3(.85, 1.05, 1.2).normalize().multiplyScalar(fitDistance).add(target)
      void current.setLookAt(...position.toArray(), ...target.toArray(), !reduced)
    } else {
      const distance = cameraRequest.action === 'distance' ? minDistance * (maxDistance / minDistance) ** (cameraRequest.value / 100) : current.distance * (cameraRequest.action === 'in' ? .78 : 1.28)
      void current.dollyTo(THREE.MathUtils.clamp(distance, minDistance, maxDistance), !reduced)
    }
    gl.domElement.dataset.cameraCommand = `${cameraRequest.action}:${current.distance}`
    invalidate()
  }, [cameraRequest, exploring, fitDistance, minDistance, maxDistance, bounds, view, reduced, invalidate, gl])
  useEffect(() => {
    const current = controls.current
    if (!current) return
    if (view === 'close' && (framing === 'graphic' || scene.environment === 'outdoor') && fitScene !== scene.id) {
      gl.domElement.dataset.cameraSettled = 'false'
      return
    }
    const taskStep = currentTaskStep()
    const aspect = size.width / size.height
    const bounds = worldFocus === 'neighborhood' ? NEIGHBORHOOD_BOUNDS : WORLD_BOUNDS
    const target = view === 'overview' ? new THREE.Vector3((bounds.minX + bounds.maxX) / 2, 1.3, (bounds.minZ + bounds.maxZ) / 2) : new THREE.Vector3(...(taskStep?.target ?? scene.target))
    const position = new THREE.Vector3(...(taskStep?.camera ?? scene.camera))
    if (view === 'overview') {
      const direction = new THREE.Vector3(...(aspect < 1 && worldFocus !== 'neighborhood' ? [21, 29, 5] : [12, 19, 22]) as [number, number, number]).normalize()
      const points: THREE.Vector3[] = []
      for (const x of [bounds.minX - .8, bounds.maxX + .8]) for (const z of [bounds.minZ - .8, bounds.maxZ + .8]) points.push(new THREE.Vector3(x, -.28, z))
      for (const s of SCENES.filter(s => worldFocus !== 'neighborhood' || NEIGHBORHOOD_SCENES.includes(s.id))) {
        for (const x of [-s.width / 2, s.width / 2]) for (const y of [0, 3.1]) for (const z of [-s.depth / 2, s.depth / 2]) points.push(new THREE.Vector3(s.position[0] + x, y, s.position[2] + z))
      }
      for (const x of [bounds.minX + 1, bounds.maxX - 1]) for (const z of [bounds.minZ + 1, bounds.maxZ - 1]) points.push(new THREE.Vector3(x, 4, z))
      position.copy(fitPerspective(points, target, direction, aspect, .94))
    } else if ((framing === 'graphic' || scene.environment === 'outdoor') && fitPoints.length) {
      if (framing === 'graphic' && aspect > 1.6) position.y -= 1.35
      const direction = position.clone().sub(target).normalize()
      position.copy(fitPerspective(fitPoints, target, direction, aspect))
    } else if (taskStep) {
      const direction = position.clone().sub(target).normalize()
      const basis = new THREE.Matrix4().lookAt(direction, new THREE.Vector3(), new THREE.Vector3(0, 1, 0)).invert()
      const tangent = Math.tan(THREE.MathUtils.degToRad(17))
      let distance = 0
      for (const x of [-scene.width / 2, scene.width / 2]) for (const y of [-.13, isWorkScene(scene.id) ? 3.1 : 2.5]) for (const z of [-scene.depth / 2, scene.depth / 2]) {
        const corner = new THREE.Vector3(x, y, z).sub(target).applyMatrix4(basis)
        distance = Math.max(distance, corner.z + Math.abs(corner.x) / (tangent * aspect), corner.z + Math.abs(corner.y) / tangent)
      }
      position.copy(direction).multiplyScalar(distance * 1.055).add(target)
    } else position.sub(target).multiplyScalar(Math.max(1, 1.4 / aspect)).add(target)
    overviewPose.current = view === 'overview' ? position.clone() : null
    gl.domElement.dataset.cameraSettled = 'false'
    gl.domElement.dataset.cameraResets = String(Number(gl.domElement.dataset.cameraResets || 0) + 1)
    let cancelled = false
    current.setLookAt(...position.toArray(), ...target.toArray(), !reduced).then(() => {
      if (!cancelled) {
        gl.domElement.dataset.cameraLayout = JSON.stringify({ view, scene: scene.id, width: size.width, height: size.height })
        gl.domElement.dataset.cameraSettled = 'true'
        invalidate()
      }
    })
    invalidate()
    return () => { cancelled = true }
  }, [view, revision, reduced, size.width, size.height, gl, invalidate, scene, framing, fitPoints, fitScene, worldFocus])
  const startControl = useCallback(() => { controls.current?.update(0); invalidate() }, [invalidate])
  return <CameraControls ref={controls} domElement={gl.domElement} enabled={exploring} mouseButtons={mouseButtons} touches={touches} onControlStart={startControl} makeDefault smoothTime={.7} draggingSmoothTime={.18} minDistance={minDistance} maxDistance={exploring ? maxDistance : 240} minPolarAngle={.18} maxPolarAngle={view === 'overview' ? 1.3 : 1.48} minAzimuthAngle={-Infinity} maxAzimuthAngle={Infinity} dollyToCursor={false} />
}

function DisplayReady({ onReady, onFailure, expected, hand, view }: { onReady: () => void; onFailure: () => void; expected: Record<string, RobotId>; hand?: HandConfiguration; view: MiniatureView }) {
  const firstFrame = useRef(false)
  const { gl } = useThree()
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onFailure() }
    gl.domElement.addEventListener('webglcontextlost', lost)
    return () => gl.domElement.removeEventListener('webglcontextlost', lost)
  }, [gl, onFailure])
  useFrame(() => {
    if (firstFrame.current) return
    const canvas = gl.domElement
    const loaded = JSON.parse(canvas.dataset.loadedModels || '{}')
    const layout = JSON.parse(canvas.dataset.cameraLayout || 'null')
    const bounds = canvas.closest('.ms-canvas')?.getBoundingClientRect()
    const fitted = canvas.dataset.cameraSettled === 'true' && layout?.view === view && (view === 'overview' || expected[layout.scene]) && bounds && Math.abs(layout.width - bounds.width) < 1 && Math.abs(layout.height - bounds.height) < 1
    if (fitted && canvas.dataset.ready && Object.keys(loaded).length === Object.keys(expected).length && Object.entries(expected).every(([id, body]) => loaded[id] === body) && (!hand || canvas.dataset.hand === hand)) {
      firstFrame.current = true
      onReady()
    }
  })
  return null
}

export default function MiniatureScene(props: Props) {
  const { onReady } = props
  const [fit, setFit] = useState<{ points: THREE.Vector3[]; scene: SceneId | null }>({ points: [], scene: null })
  const fitRoom = useCallback((points: THREE.Vector3[], scene: SceneId) => setFit({ points, scene }), [])
  const [supported] = useState(supportsWebGL)
  const [displayed, setDisplayed] = useState(false)
  const [failed, setFailed] = useState(false)
  const displayKey = props.view === 'close' ? props.scene.id : props.worldFocus === 'neighborhood' ? 'neighborhood' : 'overview'
  const display = useCallback(() => { setDisplayed(true); onReady(true, true) }, [onReady])
  const fail = useCallback(() => { setFailed(true); setDisplayed(true); onReady(true, false) }, [onReady])
  useEffect(() => { setDisplayed(!supported || failed); onReady(!supported || failed, false) }, [supported, failed, displayKey, onReady])
  useEffect(() => {
    if (!supported || displayed) return
    let timer: number | undefined
    const schedule = () => { window.clearTimeout(timer); if (!document.hidden) timer = window.setTimeout(fail, 45000) }
    schedule(); document.addEventListener('visibilitychange', schedule)
    return () => { window.clearTimeout(timer); document.removeEventListener('visibilitychange', schedule) }
  }, [supported, displayed, fail])
  const still = `/assets/robot-data-spatial/miniature/stills/${props.view === 'overview' ? props.worldFocus === 'neighborhood' ? 'neighborhood' : 'overview' : `${props.scene.id}-${props.robot}-${props.hand}`}.webp`
  const fallback = <img className="ms-still" src={still} alt={`${props.view === 'overview' ? props.worldFocus === 'neighborhood' ? '庭院街区' : '多场景鸟瞰' : props.scene.name}采集空间示意`} />
  return <div className="ms-canvas" data-supported={supported}>
    {supported && !displayed && <img className="ms-still ms-poster" src={still} alt="" aria-hidden="true" fetchPriority="high" />}
    {!supported || failed ? fallback : <SceneBoundary fallback={fallback} onFallback={fail}>
      <Canvas shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 1.65]} frameloop="demand" camera={{ fov: 34, position: [6.6, 6.6, 8.2], near: .05, far: 250 }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, localClippingEnabled: true }}>
        <Suspense fallback={null}><Room {...props} onFitPoints={fitRoom} /></Suspense>
        <CameraRig {...props} fitPoints={fit.points} fitScene={fit.scene} />
        <DisplayReady key={displayKey} onReady={display} onFailure={fail} view={props.view} expected={props.view === 'close' ? { [props.scene.id]: props.robot } : Object.fromEntries(SCENES.filter(scene => props.worldFocus !== 'neighborhood' || NEIGHBORHOOD_SCENES.includes(scene.id)).map(scene => [scene.id, scene.robot]))} hand={props.view === 'close' ? props.hand : undefined} />
      </Canvas>
    </SceneBoundary>}
  </div>
}
