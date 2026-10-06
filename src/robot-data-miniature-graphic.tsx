import type { ReactNode, RefObject } from 'react'
import { ArrowLeft, ArrowUpRight, Layers, LockKeyhole, Orbit, RotateCcw, Scan, ZoomIn, ZoomOut } from 'lucide-react'
import { HAND_CONFIGURATIONS, ROBOTS, sceneLights } from './robot-data-miniature-catalog'
import type { GraphicTone, HandConfiguration, Lighting, RobotId, SceneDefinition, SceneId } from './robot-data-miniature-catalog'
import { taskRobotValue } from './robot-data-miniature-tasks'
import type { TaskSequence, TaskVariant } from './robot-data-miniature-tasks'
import type { CameraRequest } from './robot-data-miniature-scene'
import { MiniatureMasthead } from './robot-data-miniature-masthead'
import { MiniatureSelect } from './robot-data-miniature-select'
import './robot-data-miniature-graphic.css'

const SCENE_ACTIONS: Record<SceneId, string> = {
  kitchen: 'RESET', living: 'RESET', bedroom: 'FOLD', bathroom: 'TIDY',
  retail: 'RESTOCK', checkout: 'CHECKOUT', cafe: 'RESET', laundry: 'LAUNDRY',
  garage: 'PREPARE', warehouse: 'DISPATCH', workcell: 'ASSEMBLE', care: 'SUPPLY',
  sushi: 'SERVE', produce: 'RESTOCK', office: 'RESET', cleanup: 'CLEAN',
  garden: 'TEND', popup: 'SETUP',
}

type Props = {
  children: ReactNode
  scene: SceneDefinition
  sequence: TaskSequence
  variants: { id: TaskVariant; name: string; value: string }[]
  stage: number
  variant: TaskVariant
  robot: RobotId
  hand: HandConfiguration
  lighting: Lighting
  tone: GraphicTone
  ready: boolean
  interactive: boolean
  exploring: boolean
  distance: number
  exploreButton: RefObject<HTMLButtonElement | null>
  contact: string
  onOverview: () => void
  onScene: (id: SceneId) => void
  onStage: (stage: number) => void
  onVariant: (variant: TaskVariant) => void
  onRobot: (robot: RobotId) => void
  onHand: (hand: HandConfiguration) => void
  onLighting: (lighting: Lighting) => void
  onTone: (tone: GraphicTone) => void
  onExplore: () => void
  onReset: () => void
  onCamera: (action: CameraRequest['action'], value?: number) => void
}

export function MiniatureGraphic(props: Props) {
  const { scene, sequence, variants, robot, hand, lighting, stage, variant, interactive, exploring } = props
  const current = sequence.steps[stage]
  const outdoor = scene.environment === 'outdoor'
  const action = SCENE_ACTIONS[scene.id]
  const lights = sceneLights(outdoor)
  return <main className="mg-page" data-view="close" data-layout="graphic" data-scene={scene.id} data-tone={props.tone} data-ready={props.ready} data-interactive={interactive} data-exploring={exploring}>
    <MiniatureMasthead scene={scene.id} tone={props.tone} onScene={props.onScene} onTone={props.onTone}>
      <button className="mg-back" type="button" onClick={props.onOverview}><span>场景库</span><ArrowLeft size={20} aria-hidden="true" /></button>
    </MiniatureMasthead>

    <div className="mg-heading">
      <p className="mg-display" data-compact={action.length > 7} aria-hidden="true">{action}</p>
      <div className="mg-subtitle"><div><h1>{sequence.title}</h1><span>{outdoor ? '长序列任务规划' : '长序列任务'}</span></div>
        <button ref={props.exploreButton} data-camera-controls className="mg-observe" type="button" aria-label="自由观察" aria-pressed={exploring} disabled={!interactive} onClick={props.onExplore}>
          <span className="mg-observe-label">{exploring ? '结束观察' : '自由观察'}</span><span className="mg-observe-icon">{exploring ? <LockKeyhole size={23} /> : <Orbit size={24} />}</span>
        </button>
      </div>
    </div>

    <section className="mg-stage" aria-label={`${scene.name}场景与任务`}>
      <nav className="mg-sequence" data-scene-controls aria-label={`${sequence.title}任务阶段`}>
        <h2>任务流程</h2>
        <ol>{sequence.steps.map((step, index) => <li key={step.id}>
          <button className="mg-step" type="button" disabled={!interactive} aria-current={interactive && stage === index ? 'step' : undefined} onClick={() => props.onStage(index)}>
            <span className="mg-step-index">{String(index + 1).padStart(2, '0')}</span><span>{step.name}</span>
          </button>
        </li>)}</ol>
        <span className="mg-state-note">{outdoor ? '任务规划 / 关键状态示意' : '关键状态示意'}</span>
      </nav>

      <div className="mg-viewer">
        {props.children}
        {!props.ready && <p className="mg-loading" role="status">场景加载中</p>}
        {props.ready && !interactive && <div className="mg-fallback" role="status"><span>三维场景暂不可用，当前为静态预览。</span><button type="button" onClick={() => location.reload()}><RotateCcw size={15} />重新加载</button></div>}
        <div className="mg-camera-tools" data-camera-controls>
          {exploring && <div className="mg-zoom" role="group" aria-label="空间观察">
            <button type="button" aria-label="拉远" title="拉远" disabled={props.distance >= 99.5} onClick={() => props.onCamera('out')}><ZoomOut size={20} /></button>
            <input type="range" min="0" max="100" step="1" value={100 - props.distance} aria-label="观察距离" onChange={event => props.onCamera('distance', 100 - Number(event.target.value))} />
            <button type="button" aria-label="拉近" title="拉近" disabled={props.distance <= .5} onClick={() => props.onCamera('in')}><ZoomIn size={20} /></button>
            <button type="button" aria-label="空间全貌" title="空间全貌" onClick={() => props.onCamera('fit')}><Scan size={20} /></button>
          </div>}
          <button className="mg-camera-toggle" type="button" aria-label="切换自由观察" title={exploring ? '结束自由观察' : '自由观察'} aria-pressed={exploring} disabled={!interactive} onClick={props.onExplore}>{exploring ? <LockKeyhole size={20} /> : <Orbit size={21} />}</button>
          <button type="button" aria-label="恢复当前视角" title="恢复当前视角" disabled={!interactive} onClick={props.onReset}><RotateCcw size={20} /></button>
          <button type="button" aria-label="返回鸟瞰图" title="返回鸟瞰图" onClick={props.onOverview}><Layers size={20} /></button>
        </div>
      </div>

      <aside className="mg-conditions" data-scene-controls aria-label="场景条件">
        <h2>场景条件</h2>
        <div className="mg-field"><span>机器人</span><MiniatureSelect className="mg-select" label="机器人" value={robot} disabled={!interactive} onChange={props.onRobot} options={scene.robots.map(id => ({ value: id, label: `${ROBOTS[id].brand} ${ROBOTS[id].name}`, disabled: !ROBOTS[id].available }))} /></div>
        <div className="mg-field"><span>末端配置</span><MiniatureSelect className="mg-select" label="末端配置" value={hand} disabled={!interactive} onChange={props.onHand} options={HAND_CONFIGURATIONS.map(item => ({ value: item.id, label: item.name }))} /></div>
        <div className="mg-field"><span>初始条件</span><MiniatureSelect className="mg-select" label="初始条件" value={variant} disabled={!interactive} onChange={props.onVariant} options={variants.map(item => ({ value: item.id, label: item.name }))} /></div>
        <div className="mg-field"><span>光照条件</span><MiniatureSelect className="mg-select" label="光照条件" value={lighting} disabled={!interactive} onChange={props.onLighting} options={lights.map(item => ({ value: item.id, label: item.name }))} /></div>
      </aside>
    </section>

    <section className="mg-context" aria-label="采集设计">
      <div className="mg-task-value" aria-live="polite"><h2>{interactive ? current.name : sequence.title}</h2><p>{interactive ? current.value : sequence.goal}</p></div>
      <div className="mg-model-value" aria-live="polite"><h2>{ROBOTS[robot].brand} {ROBOTS[robot].name}</h2><p>{taskRobotValue(robot, scene.id, stage) ?? ROBOTS[robot].value}</p><span className="mg-config-note">{hand === 'wuji' ? '舞肌灵巧手 · 展示级腕部装配' : robot === 'luna' ? '腕部法兰 · 参考配置' : robot === 's1' ? '原厂夹爪 · 参考配置' : '厂商参考手型'}{robot === 'luna' ? ' · Luna 外形近似' : ''}</span></div>
      <div className="mg-condition-value" aria-live="polite"><h2>{variants.find(item => item.id === variant)?.name}</h2><p>{variants.find(item => item.id === variant)?.value}</p></div>
    </section>
    <section className="mg-inquiry" aria-label="进一步了解">
      <div><h2>从你的训练目标出发。</h2><p>这里只呈现部分任务组合。更多场景、长序列与采集条件，围绕具体需求展开。</p></div>
      <div className="mg-inquiry-links"><a href="https://data-catalog.coscene.io/en/" target="_blank" rel="noreferrer">查看数据样例<ArrowUpRight size={22} /></a><a href={props.contact}>沟通采集方案<ArrowUpRight size={22} /></a></div>
    </section>
    <footer className="mg-footer"><a href="/">刻行时空 / 真机数据</a><span>场景与姿态示意</span><a href="/training/robot-data/sources/">模型与素材说明<ArrowUpRight size={15} /></a></footer>
  </main>
}
