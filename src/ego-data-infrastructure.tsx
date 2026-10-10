import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { SITE_ROUTES } from './site-routes'

const OVERLAY_ANCHORS: Record<string, { x: string; y: string }> = {
  'overlay-a': { x: '76%', y: '26%' },
  'overlay-b': { x: '24%', y: '74%' },
  'overlay-c': { x: '24%', y: '28%' },
  'overlay-d': { x: '76%', y: '74%' },
}
const motionFrames = (phase: number, sequence: number) => Array.from({ length: 20 }, (_, index) => `/assets/ego-data-study/infrastructure/starbase-seq-${phase}-${sequence}-${String(index + 1).padStart(2, '0')}.webp`)
const motionOverlay = (phase: number, sequence: number, label: string, className: string, anchor: { x: string; y: string }) => {
  const frames = motionFrames(phase, sequence)
  return { src: frames[0], frames, label, className, anchor }
}

export function DataInfrastructureSection() {
  const phases = useMemo(() => [
    { id: 'production', role: '生产编排', english: 'PRODUCTION / EXECUTION', copy: '任务、场景、步骤与质检节点。', image: '/assets/ego-data-study/infrastructure/main-starbase-dashboard.webp', overlays: [motionOverlay(1, 1, '生产流程配置', 'overlay-a', { x: '76%', y: '26%' }), motionOverlay(1, 2, '需求订单配置', 'overlay-c', { x: '24%', y: '28%' }), motionOverlay(1, 3, '场景与采集要求', 'overlay-b', { x: '24%', y: '74%' }), motionOverlay(1, 4, '质检订单配置', 'overlay-d', { x: '76%', y: '74%' })] },
    { id: 'definition', role: '任务定义', english: 'SCENES / REQUIREMENTS', copy: '场景要求与动作目标。', image: '/assets/ego-data-study/infrastructure/main-starbase-scenes.webp', overlays: [motionOverlay(2, 1, '按场景筛选任务', 'overlay-b', { x: '24%', y: '74%' }), motionOverlay(2, 2, '任务需求详情', 'overlay-d', { x: '76%', y: '74%' }), motionOverlay(2, 4, '机器人开门回放', 'overlay-a', { x: '76%', y: '26%' }), motionOverlay(2, 5, '双臂操作回放', 'overlay-c', { x: '24%', y: '28%' })] },
    { id: 'governance', role: '数据治理', english: 'RECORDS / GOVERNANCE', copy: '记录、版本、权限与状态。', image: '/assets/ego-data-study/infrastructure/main-coscene-console.webp', overlays: [motionOverlay(3, 1, '子场景与步骤配置', 'overlay-c', { x: '24%', y: '28%' }), motionOverlay(3, 2, '头部与腕部视角', 'overlay-a', { x: '76%', y: '26%' }), motionOverlay(3, 3, '多相机同步回放', 'overlay-d', { x: '76%', y: '74%' })] },
    { id: 'evaluation', role: '回放与评测', english: 'PLAYBACK / EVALUATION', copy: '相机、关节、空间模型与时间轴。', image: '/assets/ego-data-study/infrastructure/main-coscene-player.webp', overlays: [motionOverlay(4, 1, '任务量趋势', 'overlay-d', { x: '76%', y: '74%' }), motionOverlay(4, 2, '生产时长与任务总览', 'overlay-b', { x: '24%', y: '74%' }), motionOverlay(4, 3, '按子场景筛选统计', 'overlay-c', { x: '24%', y: '28%' })] },
  ], [])
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [hasInteracted, setHasInteracted] = useState(true)
  const [overlayIndex, setOverlayIndex] = useState(0)
  const [contentFrameIndex, setContentFrameIndex] = useState(0)
  const active = phases[phaseIndex]
  const activeOverlay = active.overlays[overlayIndex % active.overlays.length]
  const choosePhase = (index: number) => { setPhaseIndex(index); setOverlayIndex(0); setContentFrameIndex(0); setHasInteracted(true) }
  useEffect(() => {
    setOverlayIndex(0)
    if (!hasInteracted) return
    const timer = window.setInterval(() => setOverlayIndex(index => (index + 1) % active.overlays.length), 3000)
    return () => window.clearInterval(timer)
  }, [active.id, active.overlays.length, hasInteracted])
  useEffect(() => {
    setContentFrameIndex(0)
    const frames = activeOverlay.frames ?? [activeOverlay.src]
    if (frames.length < 2) return
    const timer = window.setInterval(() => setContentFrameIndex(index => Math.min(index + 1, frames.length - 1)), 130)
    return () => window.clearInterval(timer)
  }, [active.id, overlayIndex, activeOverlay.frames, activeOverlay.src])
  return <section className="eg-infra-section" id="infrastructure" aria-labelledby="infrastructure-title">
    <header className="eg-infra-heading">
      <h2 id="infrastructure-title">数据基础设施</h2>
    </header>
    <div className="eg-infra-stage">
      <div className="eg-infra-lab" aria-live="polite">
        <div className="eg-infra-screen">
          <div className="eg-infra-screen-frame">
            <img className="eg-infra-base" key={active.id} src={active.image} alt={`${active.role}界面示意`} />
            {hasInteracted && <><span className="eg-infra-cursor" aria-hidden="true" style={{ left: OVERLAY_ANCHORS[activeOverlay.className].x, top: OVERLAY_ANCHORS[activeOverlay.className].y }} /><div className={`eg-infra-overlay ${activeOverlay.className}`} key={`${active.id}-${overlayIndex}`}><img src={activeOverlay.frames?.[contentFrameIndex] ?? activeOverlay.src} alt={`${active.role}${activeOverlay.label}画面`} /><span className="eg-infra-overlay-label">{activeOverlay.label}</span></div></>}
          </div>
        </div>
      </div>
      <nav className="eg-infra-targets" role="tablist" aria-label="数据基础设施环节" style={{ '--infra-phase-index': phaseIndex } as CSSProperties}>
        <div className="eg-infra-target-lens" aria-hidden="true" />
        {phases.map((phase, index) => <button type="button" role="tab" key={phase.id} aria-label={`${phase.role}：${phase.copy}`} aria-selected={active.id === phase.id} onClick={() => choosePhase(index)} onMouseEnter={() => choosePhase(index)} onFocus={() => choosePhase(index)}><span>{phase.role}</span></button>)}
      </nav>
    </div>
    <div className="eg-infra-purchase">
      <p>同一套数据基础设施，也可供您的团队使用。</p>
      <a href={SITE_ROUTES.contact}>咨询产品与采购 <ArrowUpRight size={17} aria-hidden="true" /></a>
    </div>
  </section>
}
