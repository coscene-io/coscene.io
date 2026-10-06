import type { ReactNode } from 'react'
import { Box, Check } from 'lucide-react'
import { GRAPHIC_TONES, SCENES } from './robot-data-miniature-catalog'
import type { GraphicTone, SceneId } from './robot-data-miniature-catalog'
import { MiniatureSelect } from './robot-data-miniature-select'
import './robot-data-miniature-graphic.css'

type Props = {
  scene: SceneId
  hasSelection?: boolean
  tone: GraphicTone
  onScene: (id: SceneId) => void
  onTone: (tone: GraphicTone) => void
  children: ReactNode
}

export function MiniatureMasthead({ scene, hasSelection = true, tone, onScene, onTone, children }: Props) {
  return <header className="mg-masthead">
    <a className="mg-brand" href="/" aria-label="刻行时空首页">KEXING SPACE</a>
    <div className="mg-scene-picker"><Box size={19} aria-hidden="true" />
      <MiniatureSelect label="选择场景" value={hasSelection ? scene : ''} placeholder="选择场景" onChange={onScene} options={SCENES.map(item => ({ value: item.id, label: item.name, index: item.index }))} />
    </div>
    <div className="mg-nav-tools">
      <div className="mg-swatches" data-scene-controls role="group" aria-label="舞台配色">
        {GRAPHIC_TONES.map(({ id, name }) => <button type="button" key={id} data-swatch={id} aria-label={name} title={name} aria-pressed={tone === id} onClick={() => onTone(id)}>{tone === id && <Check size={12} aria-hidden="true" />}</button>)}
      </div>
      {children}
    </div>
  </header>
}
