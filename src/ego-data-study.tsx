import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { ArrowUp, ArrowUpRight, RotateCcw } from 'lucide-react'
import { EgoGallery } from './ego-data-gallery'
import type { GalleryClip } from './ego-data-gallery'
import { ProcessingSection } from './ego-data-processing'
import type { ProcessingData } from './ego-data-processing'
import { SITE_ROUTES } from './site-routes'
import { DataInfrastructureSection } from './ego-data-infrastructure'
import './index.css'
import './ego-data-study.css'

const RobotData = lazy(() => import('./robot-data-miniature-page').then(module => ({ default: module.MiniatureStudy })))
type Catalog = { clips: GalleryClip[]; sources: { name: string; url: string; license: string }[] }

export default function EgoDataStudy() {
  const [catalog, setCatalog] = useState<Catalog | null>(null), [processing, setProcessing] = useState<ProcessingData | null>(null)
  const [selected, setSelected] = useState(''), [frameIndex, setFrameIndex] = useState(0)
  const [failed, setFailed] = useState(false), [revision, setRevision] = useState(0)
  useEffect(() => {
    document.title = '加速训练 | 刻行时空'
    const controller = new AbortController()
    setFailed(false)
    const read = async (path: string) => { const response = await fetch(path, { signal: controller.signal }); if (!response.ok) throw new Error(path); return response.json() }
    Promise.allSettled([read('/assets/ego-data-study/wall/catalog.json'), read('/assets/ego-data-study/wall/processing.json')]).then(([gallery, records]) => {
      if (controller.signal.aborted) return
      if (gallery.status === 'fulfilled') setCatalog(gallery.value as Catalog)
      if (records.status === 'fulfilled') { const data = records.value as ProcessingData; setProcessing(data); setSelected(data.examples[0]?.id ?? '') }
      setFailed(gallery.status === 'rejected' || records.status === 'rejected')
    })
    return () => controller.abort()
  }, [revision])
  const choose = (id: string) => { setSelected(id); setFrameIndex(0) }
  const process = (id: string) => {
    choose(processing?.examples.find(example => example.id === id)?.id ?? processing?.examples[0]?.id ?? '')
    requestAnimationFrame(() => document.getElementById('layers')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }))
  }
  const galleryClips = useMemo(() => {
    const clips = catalog?.clips.map(clip => {
      const example = processing?.examples.find(item => item.id === clip.id)
      return { ...clip, poster: example?.frames[0]?.image ?? clip.poster, processing: Boolean(example) }
    }) ?? []
    const groups = [...new Set(clips.map(clip => clip.category))].map(category => clips.filter(clip => clip.category === category).sort((a, b) => Number(b.processing) - Number(a.processing)))
    const interleaved: GalleryClip[] = []
    for (let index = 0; index < Math.max(0, ...groups.map(group => group.length)); index++) for (const group of groups) if (group[index]) interleaved.push(group[index])
    return interleaved
  }, [catalog, processing])
  return <div className="eg-connected">
    <section id="robot" className="eg-robot-section" aria-label="真机数据"><Suspense fallback={<div className="eg-robot-loading"><h1>真机数据</h1><p role="status">场景加载中</p></div>}><RobotData /></Suspense></section>
    <div className="eg-page"><nav className="eg-chapter-nav" aria-label="返回真机数据"><a href="#robot"><ArrowUp size={14} />真机数据</a></nav>
      {catalog ? <EgoGallery clips={galleryClips} onProcess={process} /> : <div className="eg-data-loading" role="status">{failed ? <>公开样例暂不可用<button type="button" onClick={() => setRevision(value => value + 1)}><RotateCcw size={16} />重新加载</button></> : '公开样例加载中'}</div>}
      {processing ? <ProcessingSection data={processing} selected={selected} frameIndex={frameIndex} onSelect={choose} onFrame={setFrameIndex} /> : failed && <section id="layers" className="eg-data-loading" role="status">加工样例暂不可用<button type="button" onClick={() => setRevision(value => value + 1)}><RotateCcw size={16} />重新加载加工样例</button></section>}
      <DataInfrastructureSection />
      <section className="eg-closing"><div><h2>从具体的训练目标，<br />组织下一组数据。</h2><p>真机经验与人类经验，在同一条数据生产链中形成互补。</p></div><div className="eg-closing-actions"><a href="https://data-catalog.coscene.io/en/" target="_blank" rel="noreferrer">查看数据样例 <ArrowUpRight size={18} /></a><a href={SITE_ROUTES.contact}>沟通采集方案 <ArrowUpRight size={18} /></a></div></section>
      <footer className="eg-footer"><a href="/">KEXING SPACE / 刻行时空</a><span>物理世界数据基础设施</span><a href="#robot">返回真机数据 <ArrowUp size={14} /></a></footer>
    </div>
  </div>
}
