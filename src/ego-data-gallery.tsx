import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Play, X } from 'lucide-react'

export type GalleryClip = {
  id: string; title: string; category: string; source: string; sourceUrl: string; license: string
  poster: string; preview: string; video: string; duration: number; start: number; processing?: boolean
}

export function EgoGallery({ clips, onProcess }: { clips: GalleryClip[]; onProcess: (id: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null), player = useRef<HTMLVideoElement>(null)
  const [small, setSmall] = useState(() => matchMedia('(max-width: 699px)').matches)
  const [expanded, setExpanded] = useState(false)
  const expandButton = useRef<HTMLButtonElement>(null)
  const collapsePending = useRef(false)
  const [opened, setOpened] = useState<string | null>(null), [mediaFailed, setMediaFailed] = useState(false)
  const filtered = clips
  const shown = useMemo(() => !expanded ? filtered.slice(0, small ? 12 : 24) : filtered, [expanded, filtered, small])
  const current = clips.find(clip => clip.id === opened)
  const leadCount = small ? 6 : 10
  useEffect(() => {
    const media = matchMedia('(max-width: 699px)'), resize = () => setSmall(media.matches)
    media.addEventListener('change', resize)
    return () => media.removeEventListener('change', resize)
  }, [])
  useEffect(() => {
    if (opened && !dialog.current?.open) dialog.current?.showModal()
    if (!opened && dialog.current?.open) dialog.current.close()
    setMediaFailed(false)
  }, [opened])
  useLayoutEffect(() => {
    if (!expanded && collapsePending.current) {
      collapsePending.current = false
      expandButton.current?.scrollIntoView({ block: 'end', behavior: 'instant' })
    }
  }, [expanded])
  useEffect(() => {
    if (!opened) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [opened])
  const close = () => { player.current?.pause(); setOpened(null) }
  const move = (step: number) => {
    const index = clips.findIndex(clip => clip.id === opened)
    setOpened(clips[(index + step + clips.length) % clips.length].id)
  }
  const toggleExpanded = () => {
    collapsePending.current = expanded
    setExpanded(value => !value)
  }
  const tile = (clip: GalleryClip, index: number) => <button type="button" className="eg-wall-tile" data-slot={index} data-clip={clip.id} key={clip.id} aria-label={`查看${clip.title}视频`} onClick={() => setOpened(clip.id)}>
    <span className="eg-wall-media"><img src={clip.poster} alt={clip.title} loading="lazy" decoding="async" width="480" height="270" /><span className="eg-wall-play"><Play size={16} /></span></span>
  </button>
  return <section className="eg-wall-section" id="experience" aria-labelledby="eg-title">
    <div className="eg-wall-grid" data-playback-budget="0">
      <div className="eg-film-composition">
        <div className="eg-film-title"><h2 id="eg-title"><span>第一人称</span><span>视频数据</span></h2></div>
        <div className="eg-film-thesis"><p>更广泛的人类经验，<br />与真机数据互补。</p><p>以规模化的第一人称影像扩展场景与操作经验，与真机执行反馈共同进入训练。</p></div>
        {shown.slice(0, leadCount).map(tile)}
      </div>
      <div className="eg-film-contact" id="eg-film-contact">{shown.slice(leadCount).map(tile)}</div>
    </div>
    {shown.length < filtered.length || expanded ? <button ref={expandButton} type="button" className="eg-wall-expand" aria-expanded={expanded} aria-controls="eg-film-contact" onClick={toggleExpanded}>{expanded ? '收回影像' : '展示更多影像'} {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button> : null}
    <dialog ref={dialog} className="eg-sample-dialog" aria-label={current ? `${current.title}公开样例` : '公开样例'} onClose={close} onCancel={close} onClick={event => { if (event.target === event.currentTarget) close() }}>
      {current && <div className="eg-dialog-content"><header><div><small>{current.category} / 公开样例</small><h3>{current.title}</h3></div><button type="button" aria-label="关闭样例" title="关闭样例" onClick={close}><X size={21} /></button></header>
        <div className="eg-dialog-video"><video key={current.id} ref={player} src={current.video} poster={current.poster} muted controls playsInline autoPlay onError={() => setMediaFailed(true)} />{mediaFailed && <p role="status">视频暂不可用 <a href={current.sourceUrl} target="_blank" rel="noreferrer">查看数据源</a></p>}</div>
        <div className="eg-dialog-meta"><a href={current.sourceUrl} target="_blank" rel="noreferrer">{current.source} / {current.license} <ArrowUpRight size={13} /></a><span>{current.duration.toFixed(1)} 秒样例片段</span></div>
        <footer><div><button type="button" aria-label="上一个样例" title="上一个样例" onClick={() => move(-1)}><ChevronLeft size={20} /></button><button type="button" aria-label="下一个样例" title="下一个样例" onClick={() => move(1)}><ChevronRight size={20} /></button></div><button type="button" className="eg-dialog-process" onClick={() => { const id = current.id; close(); onProcess(id) }}>{current.processing ? '查看这个样本的加工' : '查看数据加工样例'}<ArrowDown size={16} /></button></footer>
      </div>}
    </dialog>
  </section>
}
