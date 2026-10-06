import type { ReactNode, RefObject } from 'react'
import { ArrowRight, ArrowUpRight, Layers, Orbit, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { SCENES } from './robot-data-miniature-catalog'
import type { GraphicTone, SceneDefinition, SceneId } from './robot-data-miniature-catalog'
import type { CameraRequest } from './robot-data-miniature-scene'
import { MiniatureMasthead } from './robot-data-miniature-masthead'
import { MiniatureSelect } from './robot-data-miniature-select'
import './robot-data-miniature-overview.css'

type Props = {
  children: ReactNode
  scene: SceneDefinition
  task: string
  tone: GraphicTone
  hasSelection: boolean
  exploring: boolean
  distance: number
  exploreButton: RefObject<HTMLButtonElement | null>
  ready: boolean
  interactive: boolean
  onScene: (id: SceneId) => void
  onTone: (tone: GraphicTone) => void
  onExplore: () => void
  onCamera: (action: CameraRequest['action'], value?: number) => void
  onEnter: () => void
  onReset: () => void
}

export function MiniatureOverview(props: Props) {
  return <main className="mg-page mo-page" data-view="overview" data-layout="graphic" data-tone={props.tone} data-district="all" data-ready={props.ready} data-interactive={props.interactive} data-exploring={props.exploring} data-selection={props.hasSelection ? props.scene.id : ''}>
    <MiniatureMasthead scene={props.scene.id} hasSelection={props.hasSelection} tone={props.tone} onScene={props.onScene} onTone={props.onTone}>
      <a className="mg-back" href="https://data-catalog.coscene.io/en/" target="_blank" rel="noreferrer" aria-label="查看数据样例"><span>数据样例</span><ArrowUpRight size={20} aria-hidden="true" /></a>
    </MiniatureMasthead>

    <section className="mo-heading" aria-label="真机数据总览">
      <div className="mo-title"><h1>真机数据</h1><p>人工智能需要了解物理世界如何运转</p></div>
      <div className="mo-world-tools" data-camera-controls>
        <nav className="mo-focus" aria-label="观察方式">
          <button type="button" aria-pressed={!props.exploring} onClick={props.onReset}><Layers size={16} aria-hidden="true" />全局鸟瞰</button>
          <button ref={props.exploreButton} type="button" aria-pressed={props.exploring} disabled={!props.interactive} onClick={props.onExplore}><Orbit size={16} aria-hidden="true" />自由视角</button>
        </nav>
        <button className="mo-reset" type="button" aria-label="恢复当前视角" title="恢复当前视角" disabled={!props.interactive} onClick={props.onReset}><RotateCcw size={20} /></button>
      </div>
    </section>

    <section className="mo-world" aria-label="全域采集空间">
      {props.children}
      <p className="mo-count"><strong>{String(SCENES.length).padStart(2, '0')}</strong><span>个场景</span></p>
      {props.exploring && <div className="mo-zoom mg-zoom" data-camera-controls role="group" aria-label="空间观察">
        <button type="button" aria-label="拉远" title="拉远" disabled={props.distance >= 99.5} onClick={() => props.onCamera('out')}><ZoomOut size={19} /></button>
        <input type="range" min="0" max="100" step="1" value={100 - props.distance} aria-label="观察距离" onChange={event => props.onCamera('distance', 100 - Number(event.target.value))} />
        <button type="button" aria-label="拉近" title="拉近" disabled={props.distance <= .5} onClick={() => props.onCamera('in')}><ZoomIn size={19} /></button>
      </div>}
      {!props.ready && <p className="mo-status" role="status">场景加载中</p>}
      {props.ready && !props.interactive && <p className="mo-fallback" role="status">静态预览<button type="button" onClick={() => location.reload()}><RotateCcw size={14} />重新加载</button></p>}
    </section>

    <section className="mo-entry" aria-label="当前场景">
      <div className="mo-selection"><span className="mo-scene-index" aria-hidden="true">{props.hasSelection ? props.scene.index : '--'}</span><div>
        <MiniatureSelect className="mo-scene-select" label="待进入的场景" side="top" value={props.hasSelection ? props.scene.id : ''} placeholder="选择场景" onChange={props.onScene} options={SCENES.map(item => ({ value: item.id, label: item.name, index: item.index }))} />
        {props.hasSelection && <p aria-live="polite">{props.task}</p>}
      </div></div>
      <button className="mo-enter" type="button" disabled={!props.hasSelection} onClick={props.onEnter}><span>进入场景</span><span className="mo-enter-icon"><ArrowRight size={23} aria-hidden="true" /></span></button>
    </section>
    <footer className="mo-footer"><a href="/">刻行时空 / 真机数据</a><span>居住 / 商业 / 物流 / 工业 / 室外</span><a href="/training/robot-data/sources/">场景与姿态示意</a></footer>
  </main>
}
