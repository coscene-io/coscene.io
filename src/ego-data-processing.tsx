import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
export type ProcessingFrame = {
  image: string; time: number; action: string; object: string; state: string; box: number[]
  hands: { label: string; points: number[][] }[]
}
export type ProcessingExample = { id: string; title: string; source: string; sourceUrl: string; frames: ProcessingFrame[] }
export type ProcessingData = { model: string; packageVersion?: string; connections: number[][]; examples: ProcessingExample[] }
type CapabilityId = 'pose' | 'gaze' | 'graph' | 'scene' | 'trajectory' | 'failure'
type Capability = { id: CapabilityId; name: string; english: string; copy: string; status: 'sample' | 'target' }

const CAPABILITIES: Capability[] = [
  { id: 'pose', name: '动作与位姿', english: 'KINEMATICS & POSE', copy: '手部动作、身体位姿与时间轴之间的对齐关系。', status: 'sample' },
  { id: 'gaze', name: '视线与关注点', english: 'GAZE & ATTENTION', copy: '操作过程中的视线方向与注意力焦点。', status: 'target' },
  { id: 'graph', name: '时序知识图谱', english: 'TEMPORAL GRAPH', copy: '物体、环境、动作与状态随时间变化的关系图。', status: 'target' },
  { id: 'scene', name: '3D 场景与元数据', english: '3D SCENE & BODY POSE', copy: '物体、空间和上肢动作处于同一三维坐标中的场景结构。', status: 'target' },
  { id: 'trajectory', name: '轨迹解耦', english: 'MOTION TRANSFER', copy: '脱离具体背景后，可在新环境中重放的人体移动路径。', status: 'target' },
  { id: 'failure', name: '失败与纠错', english: 'FAILURE & CORRECTION', copy: '成功、偏差、原因与修正动作构成的完整过程。', status: 'target' },
]

function SignalOverlay({ capability, frame, frames, connections }: { capability: Capability; frame: ProcessingFrame; frames: ProcessingFrame[]; connections: number[][] }) {
  const [x, y, width, height] = frame.box
  const centerX = (x + width / 2) * 960, centerY = (y + height / 2) * 540
  if (capability.id === 'pose') return <svg className="eg-signal-overlay eg-pose-overlay" viewBox="0 0 960 540" aria-label="手部骨架叠加" role="img">
    {frame.hands.map((hand, index) => <g key={index} stroke={index ? '#20bede' : '#ff5548'} fill="#fff">{connections.map(([a, b]) => <line key={`${a}-${b}`} x1={hand.points[a][0] * 960} y1={hand.points[a][1] * 540} x2={hand.points[b][0] * 960} y2={hand.points[b][1] * 540} strokeWidth="3" />)}{hand.points.map(([px, py], joint) => <circle key={joint} cx={px * 960} cy={py * 540} r="3.7" strokeWidth="2" />)}<text className="eg-pose-label" x={hand.points[0][0] * 960 + 14} y={hand.points[0][1] * 540 - 12}>{hand.label}</text></g>)}
    {frame.hands.length < 2 && <g className="eg-pose-status"><rect x="18" y="18" width="250" height="32" rx="3" /><text x="30" y="39">{`${frame.hands.length} / 2 HANDS DETECTED · ${frame.hands[0]?.label?.toUpperCase() ?? 'NONE'} ONLY`}</text></g>}
  </svg>
  if (capability.id === 'gaze') return <svg className="eg-signal-overlay" viewBox="0 0 960 540" aria-label="关注点目标态示意" role="img"><line x1="480" y1="540" x2={centerX} y2={centerY} stroke="#c7ed38" strokeWidth="2" strokeDasharray="8 8" /><circle cx={centerX} cy={centerY} r="24" fill="none" stroke="#c7ed38" strokeWidth="3" /><circle cx={centerX} cy={centerY} r="4" fill="#c7ed38" /></svg>
  if (capability.id === 'graph') return <svg className="eg-signal-overlay eg-graph-overlay" viewBox="0 0 960 540" aria-label="时序知识图谱目标态示意" role="img"><g fill="#101010" stroke="#c7ed38" strokeWidth="2"><line x1="130" y1="110" x2={centerX - 15} y2={centerY - 10} /><line x1={centerX + 15} y1={centerY} x2="820" y2="130" /><line x1={centerX} y1={centerY + 16} x2="690" y2="430" /><circle cx="130" cy="110" r="24" /><circle cx={centerX} cy={centerY} r="29" fill="#ca2026" stroke="#fff" /><circle cx="820" cy="130" r="24" /><circle cx="690" cy="430" r="24" /></g><g fill="#fff" stroke="none" fontSize="18" textAnchor="middle"><text x="130" y="116">人</text><text x={centerX} y={centerY + 6}>动</text><text x="820" y="136">物</text><text x="690" y="436">状</text></g></svg>
  if (capability.id === 'trajectory') {
    const sourcePoints = frames.map(item => item.hands[0]?.points[0]).filter((point): point is number[] => Boolean(point))
    const points = sourcePoints.map(point => [point[0] * 960, point[1] * 540])
    const path = points.map(point => point.join(',')).join(' ')
    const current = frame.hands[0]?.points[0]
    const hand = frame.hands[0]
    // Keep one projection and one visual legend in all three views.
    return <div className="eg-decouple-overlay" role="img" aria-label="手部轨迹从场景中分离并重放的目标态示意">
      {['01 原始影像', '02 动作提取', '03 异景重放'].map((label, index) => <div className="eg-motion-cell" key={label}>
        <span>{label}</span><svg viewBox="0 0 960 540" aria-hidden="true">
          {index === 0 ? <image href={frame.image} width="960" height="540" /> : <rect width="960" height="540" fill={index === 1 ? '#f0f1ee' : '#e7ece8'} />}
          {index === 2 && <g fill="#cdd8d0" stroke="#a7b7ad" strokeWidth="2"><rect x="60" y="60" width="180" height="400" rx="8" /><rect x="340" y="85" width="160" height="120" rx="8" /><rect x="560" y="70" width="300" height="100" rx="8" /><rect x="680" y="340" width="180" height="110" rx="8" /></g>}
          <polyline className="eg-transfer-path" points={path} fill="none" stroke="#ca2026" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#eg-trajectory-arrow)" />
          {index > 0 && hand && <g fill="none" stroke="#52675b" strokeWidth="3">{connections.map(([a, b]) => <line key={`${a}-${b}`} x1={hand.points[a][0] * 960} y1={hand.points[a][1] * 540} x2={hand.points[b][0] * 960} y2={hand.points[b][1] * 540} />)}</g>}
          {current && <circle cx={current[0] * 960} cy={current[1] * 540} r="16" fill="#fff" stroke="#ca2026" strokeWidth="6" />}
          <defs><marker id="eg-trajectory-arrow" markerWidth="10" markerHeight="10" refX="7" refY="4" orient="auto"><path d="M 0 0 L 8 4 L 0 8 Z" fill="#ca2026" /></marker></defs>
        </svg>
      </div>)}
      <p className="eg-motion-legend"><span><i className="eg-legend-path" />红线：同一段动作轨迹</span><span><i className="eg-legend-point" />圆环：当前帧位置</span></p>
    </div>
  }
  if (capability.id === 'failure') return <div className="eg-signal-branch"><span>成功路径</span><i /><span className="eg-signal-branch-fail">发现偏差</span><i /><span>纠正动作</span></div>
  return null
}

function FrameVisual({ frame, frames, capability, connections, sceneId }: { frame: ProcessingFrame; frames: ProcessingFrame[]; capability: Capability; connections: number[][]; sceneId: string }) {
  const [failed, setFailed] = useState(false)
  if (capability.id === 'scene') return <SpatialSceneVisual frame={frame} sceneId={sceneId} copy={capability.copy} />
  return <div className="eg-process-image" data-capability={capability.id}>
    <img src={frame.image} alt={`${frame.object}：${frame.action}`} width="960" height="540" onError={() => setFailed(true)} />
    {failed ? <p className="eg-image-error" role="status">样例画面暂不可用</p> : <><SignalOverlay capability={capability} frame={frame} frames={frames} connections={connections} /><div className="eg-image-copy">{capability.copy}</div><div className="eg-frame-stamp"><span>{frame.time.toFixed(2)}s</span><span>{capability.id === 'pose' ? '公开模型提取' : capability.status === 'sample' ? '人工标注示意' : '目标态视觉示意'}</span></div></>}
  </div>
}

type SceneKind = 'coffee' | 'metal' | 'restaurant' | 'general'
type SceneJoint = [number, number, number]

const SCENE_DETAILS: Record<SceneKind, { label: string; joints: Record<string, SceneJoint> }> = {
  coffee: {
    label: 'COUNTER / CUP HANDLING',
    joints: { pelvis: [0, 1.6, 1.2], spine: [0, 2.4, 1.1], neck: [0, 3.15, 1.05], head: [0, 3.62, 1.05], leftShoulder: [-.88, 2.95, 1], leftElbow: [-1.2, 2.28, .45], leftWrist: [-.72, 1.62, .2], rightShoulder: [.88, 2.95, 1], rightElbow: [1.2, 2.3, .4], rightWrist: [.72, 1.62, .2], leftHand: [-.62, 1.5, .08], rightHand: [.62, 1.5, .08] },
  },
  metal: {
    label: 'WORKBENCH / PART ALIGNMENT',
    joints: { pelvis: [0, 1.55, 1.3], spine: [0, 2.35, 1.15], neck: [0, 3.08, 1.1], head: [0, 3.55, 1.1], leftShoulder: [-.9, 2.9, 1.05], leftElbow: [-1.35, 2.35, .35], leftWrist: [-.72, 1.55, .05], rightShoulder: [.9, 2.9, 1.05], rightElbow: [1.18, 2.2, .28], rightWrist: [.5, 1.48, .02], leftHand: [-.6, 1.44, -.08], rightHand: [.38, 1.4, -.1] },
  },
  restaurant: {
    label: 'SINK / CUP CLEANING',
    joints: { pelvis: [0, 1.55, 1.35], spine: [0, 2.35, 1.2], neck: [0, 3.12, 1.15], head: [0, 3.6, 1.15], leftShoulder: [-.9, 2.95, 1.05], leftElbow: [-1.18, 2.3, .55], leftWrist: [-.72, 1.62, .15], rightShoulder: [.9, 2.95, 1.05], rightElbow: [1.12, 2.3, .5], rightWrist: [.58, 1.62, .15], leftHand: [-.62, 1.5, .02], rightHand: [.5, 1.5, .02] },
  },
  general: {
    label: 'SPATIAL TASK / TARGET STATE',
    joints: { pelvis: [0, 1.55, 1.2], spine: [0, 2.35, 1.1], neck: [0, 3.1, 1.05], head: [0, 3.58, 1.05], leftShoulder: [-.88, 2.9, 1], leftElbow: [-1.2, 2.25, .4], leftWrist: [-.7, 1.55, .05], rightShoulder: [.88, 2.9, 1], rightElbow: [1.2, 2.25, .4], rightWrist: [.7, 1.55, .05], leftHand: [-.6, 1.45, -.05], rightHand: [.6, 1.45, -.05] },
  },
}

function sceneKindFor(id: string): SceneKind {
  if (id.includes('barista')) return 'coffee'
  if (id.includes('metal')) return 'metal'
  if (id.includes('restaurant')) return 'restaurant'
  return 'general'
}

function SpatialBone({ from, to, color = '#c7ed38' }: { from: SceneJoint; to: SceneJoint; color?: string }) {
  const start = new THREE.Vector3(...from), end = new THREE.Vector3(...to)
  const direction = end.clone().sub(start), quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())
  return <mesh position={start.clone().add(end).multiplyScalar(.5)} quaternion={quaternion} castShadow>
    <cylinderGeometry args={[.045, .045, direction.length(), 10]} />
    <meshStandardMaterial color={color} roughness={.42} />
  </mesh>
}

function UpperBodySkeleton({ kind }: { kind: SceneKind }) {
  const joints = SCENE_DETAILS[kind].joints
  const bones: [string, string][] = [
    ['pelvis', 'spine'], ['spine', 'neck'], ['neck', 'head'],
    ['leftShoulder', 'rightShoulder'], ['leftShoulder', 'leftElbow'], ['leftElbow', 'leftWrist'], ['leftWrist', 'leftHand'],
    ['rightShoulder', 'rightElbow'], ['rightElbow', 'rightWrist'], ['rightWrist', 'rightHand'],
  ]
  return <group position={[0, 0, 1.65]}>{bones.map(([from, to]) => <SpatialBone key={`${from}-${to}`} from={joints[from]} to={joints[to]} />)}{Object.entries(joints).map(([name, point]) => <mesh key={name} position={point} castShadow>
    <sphereGeometry args={[name === 'head' ? .17 : .085, 14, 14]} />
    <meshStandardMaterial color={name === 'head' ? '#ff5548' : '#c7ed38'} roughness={.34} />
  </mesh>)}</group>
}

function SceneEnvironment({ kind }: { kind: SceneKind }) {
  if (kind === 'metal') return <group>
    <mesh position={[0, .48, 0]} receiveShadow castShadow><boxGeometry args={[5.8, .9, 3.2]} /><meshStandardMaterial color="#687b7a" roughness={.64} /></mesh>
    <mesh position={[0, .98, 0]}><boxGeometry args={[5.2, .12, 2.7]} /><meshStandardMaterial color="#b2c1ba" roughness={.48} /></mesh>
    <mesh position={[0, 1.28, -.25]} castShadow><boxGeometry args={[1.65, .5, .72]} /><meshStandardMaterial color="#ca2026" roughness={.38} /></mesh>
    <mesh position={[0, 1.66, -.25]} castShadow><boxGeometry args={[1.1, .32, .64]} /><meshStandardMaterial color="#d9dfd8" roughness={.4} /></mesh>
    <mesh position={[1.72, 1.18, -.42]} castShadow><cylinderGeometry args={[.34, .4, .45, 24]} /><meshStandardMaterial color="#253b45" roughness={.5} /></mesh>
  </group>
  if (kind === 'restaurant') return <group>
    <mesh position={[0, .48, 0]} receiveShadow castShadow><boxGeometry args={[5.8, .9, 3.5]} /><meshStandardMaterial color="#687d7a" roughness={.82} /></mesh>
    <mesh position={[0, .98, 0]}><boxGeometry args={[5.2, .12, 3]} /><meshStandardMaterial color="#cbd7d1" roughness={.58} /></mesh>
    <mesh position={[.15, .96, -.2]} castShadow><boxGeometry args={[1.62, .08, 1.08]} /><meshStandardMaterial color="#40545a" roughness={.32} /></mesh>
    <mesh position={[.15, 1.08, -.865]} castShadow><boxGeometry args={[2.2, .14, .22]} /><meshStandardMaterial color="#cbd7d1" roughness={.52} /></mesh>
    <mesh position={[.15, 1.08, .465]} castShadow><boxGeometry args={[2.2, .14, .22]} /><meshStandardMaterial color="#cbd7d1" roughness={.52} /></mesh>
    <mesh position={[-.84, 1.08, -.2]} castShadow><boxGeometry args={[.22, .14, 1.1]} /><meshStandardMaterial color="#cbd7d1" roughness={.52} /></mesh>
    <mesh position={[1.14, 1.08, -.2]} castShadow><boxGeometry args={[.22, .14, 1.1]} /><meshStandardMaterial color="#cbd7d1" roughness={.52} /></mesh>
    <mesh position={[-1.9, 1.55, -.55]} castShadow><boxGeometry args={[.9, 1.15, .8]} /><meshStandardMaterial color="#718783" roughness={.48} /></mesh>
    <mesh position={[1.7, 1.3, -.5]} castShadow><cylinderGeometry args={[.42, .46, .65, 24]} /><meshStandardMaterial color="#dce3dc" roughness={.4} /></mesh>
  </group>
  return <group>
    <mesh position={[0, .48, 0]} receiveShadow castShadow><boxGeometry args={[5.8, .9, 3.5]} /><meshStandardMaterial color="#697e7c" roughness={.7} /></mesh>
    <mesh position={[0, .98, 0]}><boxGeometry args={[5.2, .12, 3]} /><meshStandardMaterial color="#d3dbd2" roughness={.5} /></mesh>
    <mesh position={[-1.6, 1.82, -.72]} castShadow><boxGeometry args={[1.55, 1.7, 1]} /><meshStandardMaterial color="#36464a" roughness={.58} /></mesh>
    <mesh position={[-.45, 1.35, -.2]} castShadow><cylinderGeometry args={[.38, .44, .66, 24]} /><meshStandardMaterial color="#dce3dc" roughness={.44} /></mesh>
    <mesh position={[-.45, 1.7, -.2]}><cylinderGeometry args={[.29, .29, .025, 24]} /><meshStandardMaterial color="#6b4c3a" roughness={.4} /></mesh>
    <mesh position={[1.62, 1.4, -.36]} castShadow><boxGeometry args={[.76, .8, .76]} /><meshStandardMaterial color="#c7ed38" roughness={.44} /></mesh>
  </group>
}

function SpatialSceneVisual({ frame, sceneId, copy }: { frame: ProcessingFrame; sceneId: string; copy: string }) {
  const kind = sceneKindFor(sceneId), details = SCENE_DETAILS[kind]
  return <div className="eg-process-image eg-spatial-scene" data-capability="scene" data-scene-id={kind} data-skeleton="upper-body" role="img" aria-label={`${details.label} 独立三维场景重建目标态示意`}>
    <Canvas className="eg-spatial-canvas" camera={{ position: [6.4, 5.3, 7.8], fov: 40 }} dpr={[1, 1.5]} fallback={<div className="eg-spatial-fallback">三维场景暂不可用</div>}>
      <color attach="background" args={['#203847']} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[4, 8, 5]} intensity={3.4} castShadow />
      <directionalLight position={[-4, 4, -2]} intensity={1.2} color="#9bc6c2" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[18, 18]} /><meshStandardMaterial color="#294456" roughness={0.86} /></mesh>
      <gridHelper args={[18, 18, '#78a0aa', '#385b6d']} position={[0, 0.012, 0]} />
      <SceneEnvironment kind={kind} />
      <UpperBodySkeleton kind={kind} />
      <OrbitControls enablePan={false} minDistance={5.5} maxDistance={12} target={[0, 1.4, 0]} />
    </Canvas>
    <div className="eg-spatial-stamp"><span>INDEPENDENT SCENE / {details.label}</span><span>3D RECONSTRUCTION / TARGET STATE</span></div>
    <div className="eg-spatial-source"><img src={frame.image} alt="原始影像参照" /><span>SOURCE FRAME / 参照帧</span></div>
    <div className="eg-spatial-skeleton-label">UPPER BODY SKELETON / TARGET POSE</div>
    <div className="eg-spatial-copy">{copy}</div>
    <div className="eg-spatial-caption"><span>空间结构</span><span>物体 · 表面 · 可动部件</span></div>
  </div>
}

export function ProcessingSection({ data, selected, frameIndex, onSelect, onFrame }: { data: ProcessingData; selected: string; frameIndex: number; onSelect: (id: string) => void; onFrame: (index: number) => void }) {
  const [capabilityId, setCapabilityId] = useState<CapabilityId>('pose')
  const rail = useRef<HTMLDivElement>(null)
  const example = data.examples.find(item => item.id === selected) ?? data.examples[0]
  if (!example) return null
  const frame = example.frames[frameIndex] ?? example.frames[0]
  const capability = CAPABILITIES.find(item => item.id === capabilityId)!
  const capabilityIndex = CAPABILITIES.indexOf(capability)
  const selectCapability = (index: number, focus = false) => {
    const next = (index + CAPABILITIES.length) % CAPABILITIES.length
    setCapabilityId(CAPABILITIES[next].id)
    if (focus) rail.current?.querySelectorAll<HTMLButtonElement>('[role=tab]')[next]?.focus({ preventScroll: true })
  }
  return <section className="eg-process-section" id="layers" aria-labelledby="layers-title">
    <div className="eg-section-heading"><h2 id="layers-title">一段操作，<br />多层信号。</h2></div>
    <div className="eg-capability-layout">
      <div ref={rail} className="eg-capability-rail" role="tablist" aria-label="七项数据能力" aria-orientation="vertical">{CAPABILITIES.map((item, index) => <button type="button" role="tab" key={item.id} id={`eg-tab-${item.id}`} aria-controls="eg-signal-panel" tabIndex={capability.id === item.id ? 0 : -1} aria-selected={capability.id === item.id} onClick={() => setCapabilityId(item.id)} onKeyDown={event => {
        if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
          event.preventDefault()
          selectCapability(event.key === 'Home' ? 0 : event.key === 'End' ? CAPABILITIES.length - 1 : index + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1), true)
        }
      }}><span>{item.name}</span></button>)}</div>
      <div className="eg-capability-stage" id="eg-signal-panel" role="tabpanel" aria-labelledby={`eg-tab-${capability.id}`} tabIndex={0}>
        <div className="eg-process-toolbar"><span className="eg-signal-name">{capability.english}</span><div className="eg-example-tabs" role="group" aria-label="加工样例">{data.examples.map(item => <button type="button" key={item.id} aria-pressed={example.id === item.id} onClick={() => onSelect(item.id)}>{item.title}</button>)}</div></div>
        <FrameVisual key={`${frame.image}-${capability.id}`} frame={frame} frames={example.frames} capability={capability} connections={data.connections} sceneId={example.id} />
        <div className="eg-capability-caption"><div className="eg-signal-paging"><button type="button" aria-label="上一项能力" title="上一项能力" onClick={() => selectCapability(capabilityIndex - 1)}><ArrowLeft size={18} /></button><span>{String(capabilityIndex + 1).padStart(2, '0')} / 07</span><button type="button" aria-label="下一项能力" title="下一项能力" onClick={() => selectCapability(capabilityIndex + 1)}><ArrowRight size={18} /></button></div></div>
        <div className="eg-frame-strip" aria-label="关键帧时间序列">{example.frames.map((item, index) => <button type="button" key={item.image} aria-label={`${item.time.toFixed(2)}秒 ${item.action}`} aria-pressed={index === frameIndex} onClick={() => onFrame(index)}><img src={item.image} alt="" width="240" height="135" loading="lazy" /><span><b>{item.time.toFixed(2)}s</b>{item.action}</span></button>)}</div>
      </div>
    </div>
  </section>
}
