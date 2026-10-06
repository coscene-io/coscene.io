import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowUpRight, Focus, Layers, LockKeyhole, Orbit, RotateCcw, Sun, SunDim, LampCeiling, Sunrise, CloudSun, ZoomIn, ZoomOut, Scan } from 'lucide-react'
import type { MiniatureView, CameraRequest } from './robot-data-miniature-scene'
import { GRAPHIC_TONES, HAND_CONFIGURATIONS, LIGHTS, NEIGHBORHOOD_SCENES, ROBOTS, SCENES, sceneById, sceneLights } from './robot-data-miniature-catalog'
import type { GraphicTone, HandConfiguration, Lighting, RobotId, SceneId, WorldFocus } from './robot-data-miniature-catalog'
import { TASK_SEQUENCES, TASK_VARIANTS, taskFrame, taskRobotValue } from './robot-data-miniature-tasks'
import type { TaskVariant } from './robot-data-miniature-tasks'
import wordmark from './assets/kexing-wordmark.svg'
import './robot-data-miniature.css'
import { MiniatureGraphic } from './robot-data-miniature-graphic'
import { MiniatureOverview } from './robot-data-miniature-overview'

const MiniatureScene = lazy(() => import('./robot-data-miniature-scene'))
const lightIcons = [Sun, Sunrise, LampCeiling, SunDim]

export function MiniatureStudy({ study = false }: { study?: boolean }) {
  // Moving the portal host preserves one WebGL context across both page layouts.
  const [sceneHost] = useState(() => { const host = document.createElement('div'); host.style.display = 'contents'; return host })
  const attachScene = useCallback((slot: HTMLDivElement | null) => { if (slot) slot.appendChild(sceneHost) }, [sceneHost])
  const sceneSlot = <div className="ms-scene-slot" ref={attachScene} />
  const [layout] = useState(() => study && new URLSearchParams(location.search).get('layout') === 'classic' ? 'classic' : 'graphic')
  const [tone, setTone] = useState<GraphicTone>(() => GRAPHIC_TONES.find(item => item.id === new URLSearchParams(location.search).get('tone'))?.id ?? 'orange')
  const [view, setView] = useState<MiniatureView>(() => new URLSearchParams(location.search).get('view') === 'close' ? 'close' : 'overview')
  const [worldFocus, setWorldFocus] = useState<WorldFocus>(() => layout === 'classic' && new URLSearchParams(location.search).get('district') === 'neighborhood' ? 'neighborhood' : 'all')
  const [sceneId, setSceneId] = useState<SceneId>(() => sceneById(new URLSearchParams(location.search).get('scene')).id)
  const [hasSelection, setHasSelection] = useState(() => view === 'close' || SCENES.some(item => item.id === new URLSearchParams(location.search).get('scene')))
  const scene = sceneById(sceneId)
  const lights = sceneLights(scene.environment === 'outdoor')
  const sequence = TASK_SEQUENCES[sceneId]
  const variants = sequence.variants ?? TASK_VARIANTS
  const [stage, setStage] = useState(() => {
    const value = Number(new URLSearchParams(location.search).get('step'))
    return Number.isInteger(value) && value >= 0 && value < (sequence?.steps.length ?? 1) ? value : 0
  })
  const [variant, setVariant] = useState<TaskVariant>(() => variants.find(item => item.id === new URLSearchParams(location.search).get('variant'))?.id ?? 'everyday')
  const frame = useMemo(() => view === 'close' ? taskFrame(sceneId, stage, variant) : undefined, [view, sceneId, stage, variant])
  const [robot, setRobot] = useState<RobotId>(() => {
    const id = new URLSearchParams(location.search).get('robot') as RobotId
    return scene.robots.includes(id) && ROBOTS[id].available ? id : scene.robot
  })
  const [lighting, setLighting] = useState<Lighting>(() => LIGHTS.find(l => l.id === new URLSearchParams(location.search).get('light'))?.id ?? 'daylight')
  const [hand, setHand] = useState<HandConfiguration>(() => new URLSearchParams(location.search).get('hand') === 'reference' ? 'reference' : 'wuji')
  const [revision, setRevision] = useState(0)
  const [ready, setReady] = useState(false)
  const [interactive, setInteractive] = useState(false)
  const [exploring, setExploring] = useState(false)
  const [cameraRequest, setCameraRequest] = useState<CameraRequest | null>(null)
  const [distance, setDistance] = useState(0)
  const requestCamera = (action: CameraRequest['action'], value = 0) => setCameraRequest(previous => ({ action, value, serial: (previous?.serial ?? 0) + 1 }))
  const exploreButton = useRef<HTMLButtonElement>(null)
  const onReady = useCallback((loaded: boolean, canInteract = false) => { setReady(loaded); setInteractive(canInteract) }, [])
  const exitExplore = useCallback(() => setExploring(false), [])
  const resetCamera = useCallback(() => { setExploring(false); setRevision(r => r + 1) }, [])
  const choose = (next: MiniatureView) => { if (next === view) return; history.pushState(null, '', location.href); setExploring(false); setView(next); setRevision(r => r + 1) }
  const selectScene = useCallback((id: SceneId) => {
    const next = sceneById(id)
    setExploring(false); setSceneId(id); setHasSelection(true)
    if (!NEIGHBORHOOD_SCENES.includes(id)) setWorldFocus('all')
    if (id !== sceneId) { setStage(0); setVariant('everyday') }
    setRobot(previous => next.robots.includes(previous) && ROBOTS[previous].available ? previous : next.robot)
  }, [sceneId])
  const chooseScene = useCallback((id: SceneId) => {
    if (id !== sceneId || view !== 'close') history.pushState(null, '', location.href)
    selectScene(id); setView('close'); setRevision(r => r + 1)
  }, [selectScene, sceneId, view])
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(media.matches)
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])
  useEffect(() => {
    const params = new URLSearchParams({ view })
    if (hasSelection || layout === 'classic') params.set('scene', sceneId)
    if (layout === 'classic') params.set('layout', 'classic')
    if (tone !== 'orange') params.set('tone', tone)
    if (worldFocus !== 'all') params.set('district', worldFocus)
    if (view === 'close') {
      params.set('robot', robot); params.set('light', lighting)
      params.set('hand', hand)
      if (sequence) { params.set('step', String(stage)); params.set('variant', variant) }
    }
    const saved = new URLSearchParams(params)
    if (hasSelection) {
      saved.set('robot', robot); saved.set('light', lighting); saved.set('hand', hand)
      saved.set('step', String(stage)); saved.set('variant', variant)
    }
    history.replaceState({ miniatureQuery: saved.toString() }, '', `${location.pathname}?${params}`)
  }, [view, sceneId, robot, hand, lighting, sequence, stage, variant, layout, tone, worldFocus, hasSelection])
  useEffect(() => {
    const restore = (event: PopStateEvent) => {
      const params = new URLSearchParams(typeof event.state?.miniatureQuery === 'string' ? event.state.miniatureQuery : location.search)
      const next = sceneById(params.get('scene')), nextView = params.get('view') === 'close' ? 'close' : 'overview'
      const nextVariants = TASK_SEQUENCES[next.id].variants ?? TASK_VARIANTS
      const step = Number(params.get('step')), body = params.get('robot') as RobotId
      setSceneId(next.id); setView(nextView); setExploring(false); setCameraRequest(null)
      setHasSelection(nextView === 'close' || SCENES.some(item => item.id === params.get('scene')))
      setRobot(next.robots.includes(body) && ROBOTS[body].available ? body : next.robot)
      setHand(params.get('hand') === 'reference' ? 'reference' : 'wuji')
      setLighting(LIGHTS.find(item => item.id === params.get('light'))?.id ?? 'daylight')
      setTone(GRAPHIC_TONES.find(item => item.id === params.get('tone'))?.id ?? 'orange')
      setStage(Number.isInteger(step) && step >= 0 && step < TASK_SEQUENCES[next.id].steps.length ? step : 0)
      setVariant(nextVariants.find(item => item.id === params.get('variant'))?.id ?? 'everyday')
      setWorldFocus(layout === 'classic' && params.get('district') === 'neighborhood' ? 'neighborhood' : 'all')
      setRevision(r => r + 1)
    }
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [layout])
  useEffect(() => {
    if (!exploring) return
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { exitExplore(); exploreButton.current?.focus() }
    }
    const outside = (event: PointerEvent | FocusEvent) => {
      if (event.target instanceof Element && !event.target.closest('.ms-canvas, .ms-controls, [data-camera-controls], [data-scene-controls]')) exitExplore()
    }
    const visibility = () => { if (document.hidden) exitExplore() }
    window.addEventListener('keydown', key)
    window.addEventListener('wheel', exitExplore, { passive: true })
    window.addEventListener('scroll', exitExplore, { passive: true })
    window.addEventListener('blur', exitExplore)
    document.addEventListener('pointerdown', outside)
    document.addEventListener('focusin', outside)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      window.removeEventListener('keydown', key)
      window.removeEventListener('wheel', exitExplore)
      window.removeEventListener('scroll', exitExplore)
      window.removeEventListener('blur', exitExplore)
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('focusin', outside)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [exploring, exitExplore])
  const taskActive = !!sequence && interactive
  const contact = `mailto:hello@kexing.space?${new URLSearchParams({ subject: `真机数据采集咨询 / ${scene.name}`, body: `希望进一步了解以下采集方案：\n场景：${scene.name}\n任务：${taskActive ? sequence.title : scene.task}\n机器人：${ROBOTS[robot].brand} ${ROBOTS[robot].name}\n末端配置：${HAND_CONFIGURATIONS.find(item => item.id === hand)?.name}\n${taskActive ? `初始条件：${variants.find(item => item.id === variant)?.name}\n` : ''}光照：${lights.find(item => item.id === lighting)?.name}\n\n训练目标：\n数据需求：\n联系方式：` }).toString().replace(/\+/g, '%20')}`
  let content: ReactNode
  if (layout === 'graphic' && view === 'close') content = <MiniatureGraphic
    scene={scene} sequence={sequence} variants={variants} stage={stage} variant={variant}
    robot={robot} hand={hand} lighting={lighting} tone={tone} onTone={setTone}
    ready={ready} interactive={interactive} exploring={exploring && interactive} distance={distance}
    exploreButton={exploreButton} contact={contact}
    onOverview={() => choose('overview')} onScene={chooseScene}
    onStage={setStage} onVariant={setVariant} onRobot={setRobot} onHand={setHand} onLighting={setLighting}
    onExplore={() => exploring ? exitExplore() : setExploring(true)} onReset={resetCamera}
    onCamera={requestCamera}
  >
    {sceneSlot}
  </MiniatureGraphic>
  else if (layout === 'graphic' && view === 'overview') content = <MiniatureOverview
    scene={scene} task={sequence.title} tone={tone} hasSelection={hasSelection}
    ready={ready} interactive={interactive} onScene={selectScene} onTone={setTone}
    exploring={exploring && interactive} exploreButton={exploreButton} distance={distance}
    onExplore={() => exploring ? exitExplore() : setExploring(true)} onCamera={requestCamera}
    onEnter={() => { if (hasSelection) choose('close') }} onReset={resetCamera}
  >
    {sceneSlot}
  </MiniatureOverview>
  else content = <main className="ms-page" data-view={view} data-district={worldFocus} data-ready={ready} data-exploring={exploring && interactive}>
    <header className="ms-nav">
      <a href="/robot-data-spatial-study.html" aria-label="返回空间研究"><img src={wordmark} alt="刻行时空" /></a>
      <span className="ms-edition">SPATIAL STUDY / 03</span>
      <a className="ms-back" href="/robot-data-spatial-style-study.html"><ArrowLeft size={15} /><span>画风对照</span></a>
    </header>
    <div className="ms-heading">
    <div className="ms-title"><span className="ms-index">{view === 'overview' ? `${String(SCENES.length).padStart(2, '0')} / ENVIRONMENTS` : `${scene.index} / ${scene.zone}`}</span><h1>{view === 'overview' ? '采集世界' : scene.name}</h1><p>{view === 'overview' ? '同一个世界，多种任务经验。' : taskActive ? sequence.goal : scene.task}</p></div>
    <label className="ms-scene-picker"><span className="ms-sr-only">选择场景</span><select value={sceneId} onChange={e => chooseScene(e.target.value as SceneId)}>{SCENES.map(item => <option key={item.id} value={item.id}>{item.index}　{item.name}</option>)}</select></label>
    </div>
    {view === 'overview' && <nav className="ms-world-focus" aria-label="鸟瞰范围">
      <button type="button" aria-pressed={worldFocus === 'all'} onClick={() => setWorldFocus('all')}><Layers size={16} />全域鸟瞰</button>
      <button type="button" aria-pressed={worldFocus === 'neighborhood'} onClick={() => setWorldFocus('neighborhood')}><Focus size={16} />庭院街区</button>
    </nav>}
    <div className="ms-stage">
    {sceneSlot}
    {!ready && <span className="ms-status" role="status">场景加载中</span>}
    <div className="ms-controls">
      {view === 'close' && exploring && interactive && <div className="ms-orbit-tools" role="group" aria-label="空间观察">
        <button type="button" aria-label="拉远" title="拉远" onClick={() => requestCamera('out')} disabled={distance >= 99.5}><ZoomOut size={17} /></button>
        <input type="range" min="0" max="100" step="1" value={100 - distance} aria-label="观察距离" title="观察距离" onChange={e => requestCamera('distance', 100 - Number(e.target.value))} />
        <button type="button" aria-label="拉近" title="拉近" onClick={() => requestCamera('in')} disabled={distance <= .5}><ZoomIn size={17} /></button>
        <button type="button" aria-label="空间全貌" title="空间全貌" onClick={() => requestCamera('fit')}><Scan size={17} /></button>
      </div>}
      <div className="ms-view-switch" role="group" aria-label="观察距离">
        <button type="button" aria-pressed={view === 'overview'} onClick={() => choose('overview')}><Layers size={16} />鸟瞰</button>
        <button type="button" aria-pressed={view === 'close'} onClick={() => choose('close')}><Focus size={17} />进入场景</button>
      </div>
      <button ref={exploreButton} className="ms-reset ms-explore" type="button" aria-label="自由观察" title={exploring ? '结束自由观察' : '自由观察'} aria-pressed={exploring && interactive} disabled={view !== 'close' || !interactive} onClick={() => exploring ? exitExplore() : setExploring(true)}>{exploring ? <LockKeyhole size={17} /> : <Orbit size={17} />}</button>
      <button className="ms-reset" type="button" aria-label="恢复当前视角" title="恢复当前视角" onClick={resetCamera}><RotateCcw size={17} /></button>
    </div>
    </div>
    {view === 'close' && <>
      {taskActive && <nav className="ms-sequence" data-scene-controls aria-label={`${sequence.title}任务阶段`}>
        <div className="ms-sequence-title"><span className="ms-field-label">长序列任务</span><h2>{sequence.title}</h2><span className="ms-sequence-note">{scene.environment === 'outdoor' ? '任务规划 / 关键状态示意' : '关键状态示意'}</span></div>
        <ol>{sequence.steps.map((step, index) => <li key={step.id}><button type="button" aria-current={stage === index ? 'step' : undefined} onClick={() => setStage(index)}><span className="ms-step-index">{String(index + 1).padStart(2, '0')}</span><span>{step.name}</span></button></li>)}</ol>
      </nav>}
      <section className="ms-detail" data-scene-controls aria-label="采集条件">
        <div className="ms-task" aria-live="polite"><span className="ms-field-label">{taskActive ? `${String(stage + 1).padStart(2, '0')} / 任务设计` : '任务设计'}</span><h2>{taskActive ? sequence.steps[stage].name : scene.task}</h2><p>{taskActive ? sequence.steps[stage].value : scene.value}</p><p className="ms-task-context">{taskActive ? '前一步改变环境，下一步从新的状态继续。长序列数据保留的不只是动作，还有动作之间的依赖。' : '围绕物体、空间与操作条件，组织有上下文的任务经验。'}</p></div>
        <div className="ms-robot-context">
          <label className="ms-robot-picker"><span className="ms-field-label">机器人</span><select aria-label="机器人" value={robot} disabled={!interactive} onChange={e => setRobot(e.target.value as RobotId)}>{scene.robots.map(id => <option key={id} value={id} disabled={!ROBOTS[id].available}>{ROBOTS[id].brand} {ROBOTS[id].name}{!ROBOTS[id].available ? ' · 待接入' : ''}</option>)}</select></label>
          <p className="ms-robot-value">{taskActive ? taskRobotValue(robot, sceneId, stage) ?? ROBOTS[robot].value : ROBOTS[robot].value}</p>
          <label className="ms-robot-picker ms-hand-picker"><span className="ms-field-label">末端配置</span><select aria-label="末端配置" value={hand} disabled={!interactive} onChange={e => setHand(e.target.value as HandConfiguration)}>{HAND_CONFIGURATIONS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <div className="ms-configuration"><span>{hand === 'wuji' ? '五指抓持 / 精细操作' : robot === 'luna' ? '腕部法兰' : robot === 's1' ? '原厂夹爪' : '厂商参考手型'}</span><small>{hand === 'wuji' ? '展示级腕部装配' : '参考配置'}{robot === 'luna' ? ' · Luna 外形近似' : ''}</small></div>
        </div>
        <div className="ms-conditions">
          {taskActive && <label className="ms-variant-picker"><span className="ms-field-label">初始条件</span><select aria-label="初始条件" value={variant} onChange={e => setVariant(e.target.value as TaskVariant)}>{variants.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><span className="ms-variant-value">{variants.find(item => item.id === variant)?.value}</span></label>}
          <fieldset className="ms-lighting" disabled={!interactive}><legend className="ms-field-label">光照条件</legend><div className="ms-light-options">{lights.map((light, index) => {
            const Icon = scene.environment === 'outdoor' && index === 2 ? CloudSun : lightIcons[index]
            return <label key={light.id} title={light.name}><input type="radio" name="lighting" value={light.id} checked={lighting === light.id} onChange={() => setLighting(light.id)} /><Icon size={17} /><span>{light.name}</span></label>
          })}</div></fieldset>
        </div>
      </section>
      <section className="ms-inquiry" aria-label="进一步了解"><div><h2>从你的训练目标出发。</h2><p>这里只呈现部分任务组合。更多场景、长序列与采集条件，围绕具体需求展开。</p></div><div className="ms-inquiry-links"><a href="https://data-catalog.coscene.io/en/" target="_blank" rel="noreferrer">查看数据样例 <ArrowUpRight size={18} /></a><a href={contact}>沟通采集方案 <ArrowUpRight size={18} /></a></div></section>
    </>}
    <footer className="ms-footer"><span>{view === 'overview' ? '居住 / 商业 / 物流 / 工业 / 室外' : `${ROBOTS[robot].brand} ${ROBOTS[robot].name} / ${scene.name}`}</span><span>场景与姿态示意</span><a href={ROBOTS[robot].source} target="_blank" rel="noreferrer">{robot === 'luna' ? '外形参考' : '模型来源'} <ArrowUpRight size={13} /></a></footer>
  </main>
  return <>{content}{createPortal(<Suspense fallback={null}>
    <MiniatureScene framing={layout === 'graphic' && view === 'close' ? 'graphic' : undefined} view={view} worldFocus={worldFocus} revision={revision} reduced={reduced} exploring={exploring && interactive} onReady={onReady} scene={scene} robot={robot} hand={hand} lighting={lighting} onScene={layout === 'graphic' && view === 'overview' ? selectScene : chooseScene} selectionOnly={layout === 'graphic'} hasSelection={hasSelection} cameraRequest={cameraRequest} onDistance={setDistance} frame={frame} />
  </Suspense>, sceneHost)}</>
}
