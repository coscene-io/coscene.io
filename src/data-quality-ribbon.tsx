import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronDown, Maximize2, Pause, Play, X } from 'lucide-react'
import { TRACE_CARD_IDS } from './quality-trace-card-art'
import { createRibbonCardArt } from './quality-ribbon-card-art'
import type { TraceCardArt, TraceCardId } from './quality-trace-card-art'
import { createRibbonScene } from './quality-ribbon-scene'
import type { RibbonScene, RibbonInspection } from './quality-ribbon-scene'
import { JOURNEY_END, JOURNEY_TRACK_SVH, RING_START, ARCHIVE_START, ARCHIVE_SETTLED, CLOSING_START, CLOSING_SETTLED } from './quality-ribbon-story'
import { RECORD_GROUPS, RECORD_INSPECTIONS, DELIVERY_COMPARISONS } from './quality-ribbon-records'
import type { RecordContent } from './quality-ribbon-records'
import { SITE_ROUTES } from './site-routes'
import './data-quality-ribbon.css'
import './data-quality-journey.css'

const transition = (start: number, end: number, value: number) => {
  const p = Math.max(0, Math.min(1, (value - start) / (end - start)))
  return p * p * (3 - 2 * p)
}

export default function DataQualityRibbon({ journey = false }: { journey?: boolean }) {
  const track = useRef<HTMLDivElement>(null), journeyProgressRef = useRef(0)
  const host = useRef<HTMLDivElement>(null), scene = useRef<RibbonScene | null>(null)
  const dialog = useRef<HTMLDialogElement>(null), image = useRef<HTMLCanvasElement>(null), readButton = useRef<HTMLButtonElement>(null)
  const backButton = useRef<HTMLButtonElement>(null), inspectionPanel = useRef<HTMLDivElement>(null)
  const recordPicker = useRef<HTMLSelectElement>(null)
  const browseButton = useRef<HTMLButtonElement>(null), browseContinue = useRef<HTMLButtonElement>(null)
  const browseFocus = useRef<HTMLElement | null>(null), browseExitTimer = useRef(0), browseFrame = useRef(0)
  const browseExitMaxTimer = useRef(0), browseExitWheel = useRef<((event: WheelEvent) => void) | null>(null)
  const browseExitAction = useRef<'advance' | 'restore' | null>(null)
  const [art, setArt] = useState<TraceCardArt[]>([]), [records, setRecords] = useState<RecordContent[]>([])
  const [status, setStatus] = useState('loading'), [retry, setRetry] = useState(0)
  const [active, setActive] = useState<TraceCardId>('C00'), [selected, setSelected] = useState<TraceCardId | null>(null)
  const [inspection, setInspection] = useState<RibbonInspection | null>(null)
  const [requestedRecord, setRequestedRecord] = useState<TraceCardId>('C00')
  const [videoState, setVideoState] = useState({ playing: false, error: false })
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [journeyProgress, setJourneyProgress] = useState(0)
  const [browsing, setBrowsing] = useState(false), [browseExiting, setBrowseExiting] = useState(false)
  const [playing, setPlaying] = useState(() => !reducedMotion)
  const playingRef = useRef(playing); playingRef.current = playing
  const openRecord = useCallback((id: TraceCardId) => {
    if (journey && (journeyProgressRef.current < RING_START || journeyProgressRef.current > ARCHIVE_START)) return
    if (inspectionPanel.current?.contains(document.activeElement)) recordPicker.current?.focus({ preventScroll: true })
    setRequestedRecord(id); scene.current?.inspect(id)
  }, [journey])
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => { setReducedMotion(preference.matches); setPlaying(!preference.matches) }
    preference.addEventListener('change', change); return () => preference.removeEventListener('change', change)
  }, [])
  useEffect(() => {
    if (!journey) return
    let frame = 0
    const update = () => {
      frame = 0
      if (!track.current || !host.current) return
      const inset = parseFloat(getComputedStyle(host.current.parentElement!).top) || 0
      const start = track.current.getBoundingClientRect().top + window.scrollY - inset
      const distance = Math.max(1, track.current.offsetHeight - host.current.clientHeight)
      const position = Math.max(0, Math.min(1, (window.scrollY - start) / distance)) * JOURNEY_END
      const progress = reducedMotion ? position < .24 ? 0 : position < .74 ? .48
        : position < ARCHIVE_START ? RING_START : position < 3.35 ? ARCHIVE_SETTLED : JOURNEY_END : position
      journeyProgressRef.current = progress
      setJourneyProgress(progress)
      scene.current?.setJourneyProgress(progress)
      if (progress < RING_START || progress > ARCHIVE_START) {
        setSelected(null); setBrowsing(false); scene.current?.setBrowsing(false)
      }
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [journey, reducedMotion])

  const scrollToStage = useCallback((progress: number) => {
    if (!track.current || !host.current) return
    const inset = parseFloat(getComputedStyle(host.current.parentElement!).top) || 0
    const start = track.current.getBoundingClientRect().top + window.scrollY - inset
    const distance = Math.max(1, track.current.offsetHeight - host.current.clientHeight)
    window.scrollTo({ top: start + distance * progress / JOURNEY_END, behavior: reducedMotion ? 'instant' : 'smooth' })
  }, [reducedMotion])
  const clearBrowseTransition = useCallback(() => {
    window.clearTimeout(browseExitTimer.current); window.clearTimeout(browseExitMaxTimer.current)
    if (browseExitWheel.current) window.removeEventListener('wheel', browseExitWheel.current, true)
    cancelAnimationFrame(browseFrame.current)
    browseExitTimer.current = 0; browseExitMaxTimer.current = 0; browseExitWheel.current = null
    browseFrame.current = 0; browseExitAction.current = null
  }, [])
  const leaveBrowsing = useCallback((advance: boolean) => {
    clearBrowseTransition()
    scene.current?.setBrowsing(false); setBrowsing(false); setBrowseExiting(true)
    browseExitAction.current = advance ? 'advance' : 'restore'
    const finish = () => {
      window.clearTimeout(browseExitTimer.current); window.clearTimeout(browseExitMaxTimer.current)
      if (browseExitWheel.current) window.removeEventListener('wheel', browseExitWheel.current, true)
      browseExitTimer.current = 0; browseExitMaxTimer.current = 0; browseExitWheel.current = null
      setBrowseExiting(false)
    }
    // Absorb inertia until the wheel is quiet, with a bounded wait for deliberate continued input.
    browseExitWheel.current = (event: WheelEvent) => {
      if (event.ctrlKey) return
      event.preventDefault()
      window.clearTimeout(browseExitTimer.current)
      browseExitTimer.current = window.setTimeout(finish, 180)
    }
    window.addEventListener('wheel', browseExitWheel.current, { capture: true, passive: false })
    browseExitTimer.current = window.setTimeout(finish, 180)
    browseExitMaxTimer.current = window.setTimeout(finish, 800)
  }, [clearBrowseTransition])
  function enterBrowsing() {
    if (!journey || status !== 'ready' || inspection || journeyProgress < RING_START || journeyProgress > ARCHIVE_START) return
    clearBrowseTransition(); setBrowseExiting(false)
    browseFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : browseButton.current
    setBrowsing(true); scene.current?.setBrowsing(true)
    browseFrame.current = requestAnimationFrame(() => { browseFrame.current = 0; browseContinue.current?.focus({ preventScroll: true }) })
  }
  useEffect(() => () => clearBrowseTransition(), [clearBrowseTransition])
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    clearBrowseTransition(); setBrowsing(false); setBrowseExiting(false)
    setInspection(null); setSelected(null); setActive('C00'); setVideoState({ playing: false, error: false })
    setStatus('loading')
    const timer = window.setTimeout(() => { cancelled = true; controller.abort(); setStatus('error') }, 14000)
    async function init() {
      try {
        const content = fetch('/assets/quality-trace/content.json', { signal: controller.signal }).then(response => {
          if (!response.ok) throw new Error('记录未能加载'); return response.json() as Promise<RecordContent[]>
        })
        await document.fonts.load('500 40px MotionGrotesque').catch(() => [])
        const [artwork, data] = await Promise.all([createRibbonCardArt(), content])
        if (cancelled || !host.current) return
        setArt(artwork); setRecords(data)
        scene.current = createRibbonScene(host.current, artwork, openRecord, setActive, () => {
          clearBrowseTransition(); setBrowsing(false); setBrowseExiting(false)
          setStatus('error'); setInspection(null); setSelected(null); setVideoState({ playing: false, error: false })
        }, setInspection, setVideoState, { journey })
        scene.current.setPlaying(playingRef.current)
        if (journey) scene.current.setJourneyProgress(journeyProgressRef.current)
        setStatus('ready')
      } catch (error) { if (!cancelled) { console.error(error); setStatus('error') } }
      finally { window.clearTimeout(timer) }
    }
    void init()
    return () => { cancelled = true; controller.abort(); clearTimeout(timer); scene.current?.dispose(); scene.current = null }
  }, [retry, journey, openRecord, clearBrowseTransition])
  useEffect(() => { scene.current?.setPlaying(playing) }, [playing])
  const inspecting = inspection !== null
  const readerOpen = selected !== null
  const scrollLocked = journey && (inspecting || readerOpen || browsing || browseExiting)
  useEffect(() => {
    if (!scrollLocked) return
    const root = document.documentElement, previous = root.style.getPropertyValue('overflow')
    const priority = root.style.getPropertyPriority('overflow'), hadClass = root.classList.contains('ribbon-journey-reading')
    root.classList.add('ribbon-journey-reading'); root.style.overflow = 'hidden'
    return () => {
      if (previous) root.style.setProperty('overflow', previous, priority)
      else root.style.removeProperty('overflow')
      if (!hadClass) root.classList.remove('ribbon-journey-reading')
    }
  }, [scrollLocked])
  useEffect(() => {
    if (scrollLocked || !browseExitAction.current) return
    const action = browseExitAction.current
    browseExitAction.current = null
    browseFrame.current = requestAnimationFrame(() => {
      browseFrame.current = 0
      const previous = browseFocus.current
      if (action === 'advance') {
        track.current?.focus({ preventScroll: true }); scrollToStage(1.72)
      } else (previous?.isConnected ? previous : browseButton.current)?.focus({ preventScroll: true })
    })
    return () => { cancelAnimationFrame(browseFrame.current); browseFrame.current = 0 }
  }, [scrollLocked, scrollToStage])
  useEffect(() => {
    if (!browsing || inspecting || readerOpen) return
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || dialog.current?.open) return
      event.preventDefault(); leaveBrowsing(false)
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [browsing, inspecting, readerOpen, leaveBrowsing])
  useEffect(() => {
    if (!inspecting) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : readButton.current
    const frame = requestAnimationFrame(() => backButton.current?.focus({ preventScroll: true }))
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !dialog.current?.open) { event.preventDefault(); scene.current?.leaveInspection() }
    }
    window.addEventListener('keydown', escape)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('keydown', escape); requestAnimationFrame(() => previous?.focus({ preventScroll: true })) }
  }, [inspecting])
  useEffect(() => { if (inspectionPanel.current) inspectionPanel.current.scrollTop = 0 }, [inspection?.id])
  useEffect(() => {
    if (!readerOpen || !dialog.current) return
    const node = dialog.current, focusTarget = document.activeElement instanceof HTMLElement ? document.activeElement : readButton.current
    scene.current?.setSuspended(true); node.showModal()
    return () => { node.close(); scene.current?.setSuspended(false); focusTarget?.focus({ preventScroll: true }) }
  }, [readerOpen])
  const selectedArt = art.find(item => item.id === selected), selectedRecord = records.find(item => item.id === selected)
  useEffect(() => {
    if (!selectedArt || !image.current) return
    image.current.width = 1200; image.current.height = 760
    image.current.getContext('2d')?.drawImage(selectedArt.canvas, 0, 0)
  }, [selectedArt])
  const current = art.find(item => item.id === active)
  const inspectionRecord = records.find(item => item.id === inspection?.id)
  const inspectionArt = art.find(item => item.id === inspection?.id)
  const inspectionConfig = inspection ? RECORD_INSPECTIONS[inspection.id] : null
  const requestedIndex = TRACE_CARD_IDS.indexOf(requestedRecord)
  const nextRecord = (direction: number) => openRecord(TRACE_CARD_IDS[(requestedIndex + direction + TRACE_CARD_IDS.length) % TRACE_CARD_IDS.length])
  const ringInteractive = (!journey || (journeyProgress >= RING_START && journeyProgress <= ARCHIVE_START)) && status === 'ready'
  const ringOpacity = inspecting ? 0 : journey ? transition(.90, RING_START, journeyProgress) * (1 - transition(ARCHIVE_START, 1.76, journeyProgress)) : 1
  const archiveOpacity = transition(ARCHIVE_SETTLED - .10, ARCHIVE_SETTLED, journeyProgress)
  const archiveHeadingOpacity = archiveOpacity * (1 - transition(CLOSING_START, CLOSING_START + .26, journeyProgress))
  const archiveReady = journeyProgress >= ARCHIVE_SETTLED && status === 'ready'
  const closingReady = journeyProgress >= CLOSING_SETTLED
  const closingOpacity = transition(CLOSING_SETTLED - .26, CLOSING_SETTLED, journeyProgress)
  const openingOpacity = 1 - transition(.12, .21, journeyProgress)
  const taskOpacity = transition(.40, .43, journeyProgress) * (1 - transition(.74, .79, journeyProgress))
  const taskRecord = records.find(item => item.id === 'C00')
  const taskDescription = taskRecord?.fields.find(field => field.label === '任务')?.value
  const taskMoment = taskRecord?.fields.find(field => field.label === '当前片段')?.value.split(' · ')[0]
  const page = <main className="ribbon-page" data-state={status} data-inspecting={inspecting}
    data-journey={journey || undefined} data-ring-ready={journey ? ringInteractive : undefined} data-browsing={journey ? browsing : undefined}>
    {journey && <>
      <header className="ribbon-journey-opening" aria-hidden={openingOpacity < .01}
        style={{ opacity: openingOpacity, visibility: openingOpacity < .01 ? 'hidden' : 'visible' }}>
        <h1>以终为始的<br />数据生产与治理</h1>
        <p>从训练目标出发，确定采集任务、场景与验收标准。</p>
      </header>
      <div className="ribbon-journey-playback" aria-label="任务视频" aria-hidden={taskOpacity < .01} inert={taskOpacity < .99}
        style={{ opacity: taskOpacity, visibility: taskOpacity < .01 ? 'hidden' : 'visible' }}>
        <p className="ribbon-sr-only">{taskDescription}。当前片段：{taskMoment}</p>
        <button className="ribbon-journey-video" onClick={() => scene.current?.toggleVideo()} disabled={status !== 'ready' || videoState.error}>
          {videoState.playing ? <Pause size={15} /> : <Play size={15} />}{videoState.playing ? '暂停片段' : '播放片段'}
        </button>
        {videoState.error && <p className="ribbon-video-error" role="status">视频暂时无法播放，当前显示任务画面。</p>}
      </div>
      <header className="ribbon-journey-archive-heading" aria-hidden={archiveHeadingOpacity < .01}
        style={{ opacity: archiveHeadingOpacity, visibility: archiveHeadingOpacity < .01 ? 'hidden' : 'visible' }}>
        <h2>关系完整保留，<br />质量分析有迹可循</h2>
        <p>客户需求、生产记录、质量检查与交付结果，统一归档。</p>
      </header>
      <header className="ribbon-journey-closing-heading" aria-hidden={closingOpacity < .01}
        style={{ opacity: closingOpacity, visibility: closingOpacity < .01 ? 'hidden' : 'visible', transform: `translate(-50%, calc(-50% + ${(1 - closingOpacity) * 12}px))` }}>
        <h2>为你的训练目标<br />准备就绪</h2>
        <p><a href={SITE_ROUTES.contact} aria-label="填写数据合作需求">告诉我们你的数据需要，</a><br />我们将带着专业的数据生产与管理方案联系您。</p>
      </header>
      <footer className="ribbon-journey-archive-footer" data-closing={closingReady} inert={!archiveReady} aria-hidden={!archiveReady}
        style={{ opacity: archiveOpacity, visibility: archiveOpacity < .01 ? 'hidden' : 'visible' }}>
        <p><span>DEMO-FR-0084</span><span>{TRACE_CARD_IDS.length} 份关联记录</span></p>
        <nav aria-label="归档记录">
          {closingReady && <button aria-label={playing ? '暂停浮动' : '继续浮动'} aria-pressed={!playing} onClick={() => setPlaying(value => !value)}>
            {playing ? <Pause size={15} /> : <Play size={15} />}<span className="ribbon-closing-play-label">{playing ? '暂停浮动' : '继续浮动'}</span>
          </button>}
          {!closingReady && <button onClick={() => { scrollToStage(1.35); track.current?.focus({ preventScroll: true }) }}>返回查看<ArrowUp size={15} /></button>}
          <button onClick={() => { scrollToStage(closingReady ? ARCHIVE_SETTLED + .10 : JOURNEY_END); track.current?.focus({ preventScroll: true }) }}>
            {closingReady ? '返回归档' : '继续'}{closingReady ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
          </button>
        </nav>
      </footer>
    </>}
    <header className="ribbon-heading" aria-hidden={inspecting || (journey && ringOpacity < .01)}
      style={journey ? { opacity: ringOpacity, visibility: ringOpacity < .01 ? 'hidden' : 'visible' } : undefined}>
      {journey ? <h2>数据的每一次流转，<br />都更接近最终交付质量</h2> : <h1>数据的每一次流转，<br />都更接近最终交付质量</h1>}
      <p>统一管理客户需求、采集记录、<br />标注与质检结果。</p>
    </header>
    <div ref={host} className="ribbon-stage" tabIndex={inspecting || !ringInteractive ? -1 : 0} inert={journey && !ringInteractive}
      role="region" aria-label={journey ? browsing ? '自由查看任务记录。拖动或滚动查看，方向键切换，回车打开当前记录，Escape 退出自由查看。' : '连续任务记录。拖动查看，滚动继续，方向键切换，回车打开当前记录。' : '连续卷动的任务记录。拖动或滚动查看，方向键切换，回车打开当前记录。'} />
    {status === 'loading' && <p className="ribbon-status" role="status">正在展开任务记录</p>}
    {status === 'error' && <div className="ribbon-status" role="alert"><p>画面暂时未能加载</p><button onClick={() => setRetry(value => value + 1)}>重新加载</button><a href="/quality/delivery/records/">查看任务记录</a><a href={SITE_ROUTES.contact}>联系我们</a></div>}
    <footer className="ribbon-footer" inert={inspecting || (journey && !ringInteractive)} aria-hidden={inspecting || (journey && !ringInteractive)}
      style={journey ? { opacity: ringOpacity, visibility: ringOpacity < .01 ? 'hidden' : 'visible' } : undefined}>
      <div className="ribbon-caption"><span>DEMO-FR-0084</span><p>果蔬存放至冰箱冷藏室</p></div>
      <div className="ribbon-current"><span>{current ? RECORD_GROUPS[current.group] : '任务记录'}</span><button ref={readButton} onClick={() => openRecord(active)} disabled={!ringInteractive}>{current?.title || '任务名称及介绍'}<Maximize2 size={14} /></button></div>
      <div className="ribbon-controls" style={journey && !ringInteractive ? { visibility: 'hidden' } : undefined}>
        <span className="ribbon-gesture">{journey ? browsing ? '拖动或滚动查看 · Esc 退出' : '拖动查看 · 滚动继续' : '拖动或滚动，查看记录'}</span>
        <button aria-label="上一条记录" disabled={!ringInteractive} onClick={() => scene.current?.step(-1)}><ArrowLeft size={17} /></button>
        <button aria-label={playing ? '暂停自旋' : '继续自旋'} aria-pressed={!playing} disabled={!ringInteractive} onClick={() => setPlaying(value => !value)}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
        <button aria-label="下一条记录" disabled={!ringInteractive} onClick={() => scene.current?.step(1)}><ArrowRight size={17} /></button>
      </div>
    </footer>
    {journey && ringInteractive && !inspecting && <nav className="ribbon-journey-browse-actions" aria-label="卡带浏览方式" inert={browseExiting}>
      {!browsing && <button ref={browseButton} onClick={enterBrowsing}>自由查看</button>}
      <button ref={browseContinue} onClick={() => browsing ? leaveBrowsing(true) : scrollToStage(1.72)}>继续归档<ArrowDown size={15} /></button>
    </nav>}
    {journey && status === 'ready' && !inspecting && journeyProgress < RING_START &&
      <button className="ribbon-journey-next" onClick={() => scrollToStage(journeyProgress < .40 ? .48 : RING_START + .01)}>
        {journeyProgress < .40 ? '查看任务' : '进入任务记录'}<ArrowDown size={15} />
      </button>}
    {inspection && <section className="ribbon-inspection" data-stage={inspection.stage} aria-label="查看任务记录">
      <div className="ribbon-inspection-toolbar">
        <button ref={backButton} onClick={() => scene.current?.leaveInspection()}><ArrowLeft size={17} />返回卡带</button>
        <nav className="ribbon-record-navigation" aria-label="浏览全部任务记录">
          <button aria-label="查看上一份记录" onClick={() => nextRecord(-1)}><ArrowLeft size={17} /></button>
          <div className="ribbon-record-picker">
            <select ref={recordPicker} aria-label="选择任务记录" value={requestedRecord} onChange={event => openRecord(event.target.value as TraceCardId)}>
              {TRACE_CARD_IDS.map((id, index) => <option key={id} value={id}>{String(index + 1).padStart(2, '0')} / {TRACE_CARD_IDS.length}　{art.find(item => item.id === id)?.title}</option>)}
            </select><ChevronDown size={14} aria-hidden="true" />
          </div>
          <button aria-label="查看下一份记录" onClick={() => nextRecord(1)}><ArrowRight size={17} /></button>
        </nav>
      </div>
      <p className="ribbon-sr-only" role="status">{inspection.stage === 'reading' ? '当前记录：' : '正在切换记录：'}{art.find(item => item.id === requestedRecord)?.title}</p>
      <div ref={inspectionPanel} className="ribbon-inspection-panel" inert={inspection.stage !== 'reading'} aria-hidden={inspection.stage !== 'reading'}>
        <h2>{inspectionArt?.title}</h2>
        {inspection.id === 'C16' ? <div className="ribbon-delivery-comparison">
          <p className="ribbon-delivery-versions">{inspectionRecord?.fields.find(field => field.label === '最初需求')?.value}<ArrowRight size={14} aria-hidden="true" />{inspectionRecord?.fields.find(field => field.label === '当前交付')?.value}</p>
          <dl>{DELIVERY_COMPARISONS.map(item => <div key={item.label}>
            <dt>{item.label}</dt>
            <dd><button onClick={() => openRecord(item.sourceId)}><span>客户要求</span>{item.requirement}<ArrowRight size={13} /></button>
              <button onClick={() => openRecord(item.resultId)}><span>检查结果</span>{item.result}<ArrowRight size={13} /></button></dd>
          </div>)}</dl>
        </div> : <dl>{inspectionConfig?.fields.map(label => {
          const field = inspectionRecord?.fields.find(item => item.label === label)
          if (!field) return null
          const value = inspection.id === 'C00' && label === '当前片段' ? field.value.split(' · ')[0] : field.value
          return <div key={label}><dt>{label === 'pick' ? '夹取动作' : label}</dt><dd>{value}</dd></div>
        })}</dl>}
        <nav className="ribbon-related-records" aria-label="关联记录">
          <span>关联记录</span>
          {inspectionConfig?.links.map(link => <button key={link.id} onClick={() => openRecord(link.id)}>{link.label}<ArrowRight size={14} /></button>)}
        </nav>
        <div className="ribbon-inspection-actions">
          {inspection.id === 'C00' && <button onClick={() => scene.current?.toggleVideo()} disabled={videoState.error}>{videoState.playing ? <Pause size={15} /> : <Play size={15} />}{videoState.playing ? '暂停片段' : '播放片段'}</button>}
          <button onClick={() => setSelected(inspection.id)}>查看完整记录<Maximize2 size={14} /></button>
        </div>
        {inspection.id === 'C00' && videoState.error && <p className="ribbon-video-error" role="status">视频暂时无法播放，当前显示任务画面。</p>}
      </div>
    </section>}
    <dialog ref={dialog} className="ribbon-reader" aria-labelledby="ribbon-record-title" onCancel={() => setSelected(null)} onClose={() => setSelected(null)}>
      <div className="ribbon-reader-bar"><label htmlFor="ribbon-select">任务记录</label><select id="ribbon-select" value={selected || 'C00'} onChange={event => setSelected(event.target.value as TraceCardId)}>
        {TRACE_CARD_IDS.map(id => <option key={id} value={id}>{id} · {art.find(item => item.id === id)?.title || '任务记录'}</option>)}
      </select><button aria-label="关闭记录" autoFocus onClick={() => setSelected(null)}><X size={20} /></button></div>
      <div className="ribbon-reader-body"><figure><canvas ref={image} aria-label={selectedArt?.title} role="img" /><figcaption>{selected} · {selectedArt?.title}</figcaption></figure>
        <section><h2 id="ribbon-record-title">{selectedRecord?.headline || selectedArt?.title}</h2><dl>{selectedRecord?.fields.map(field => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl></section>
      </div>
    </dialog>
  </main>
  return journey ? <div ref={track} className="ribbon-journey-track" style={{ height: `${JOURNEY_TRACK_SVH}svh` }} tabIndex={-1}>{page}</div> : page
}
