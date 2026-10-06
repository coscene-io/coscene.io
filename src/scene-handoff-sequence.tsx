import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { DataAssetsGlobeStudy } from './data-assets-globe-study'
import { DeliveryFooterSequence } from './delivery-footer-handoff-study'
import { DeliveryMaterialStudy } from './delivery-material-study'
import './scene-handoff-study.css'

type RevealStage = 'covered' | 'copy' | 'full'

function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}

function revealStage(progress: number): RevealStage {
  if (progress >= 0.78) return 'full'
  if (progress >= 0.52) return 'copy'
  return 'covered'
}

export function SceneHandoffSequence({
  platform,
  includeFooter = true,
  footerVariant = 'horizontal',
}: {
  platform: ReactNode
  includeFooter?: boolean
  footerVariant?: 'horizontal' | 'portrait'
}) {
  const platformLayerRef = useRef<HTMLDivElement>(null)
  const earthTrackRef = useRef<HTMLElement>(null)
  const [earthStage, setEarthStage] = useState<RevealStage>('covered')
  const [earthRetiring, setEarthRetiring] = useState(false)
  const [earthRendering, setEarthRendering] = useState(true)

  useEffect(() => {
    let frame = 0

    const updateHandoff = () => {
      frame = 0
      const platformLayer = platformLayerRef.current
      const earthTrack = earthTrackRef.current
      if (!platformLayer || !earthTrack) return

      const viewportHeight = Math.max(1, window.innerHeight)
      const platformBottom = platformLayer.getBoundingClientRect().bottom
      const earthBottom = earthTrack.getBoundingClientRect().bottom
      const earthRevealProgress = clamp((viewportHeight - platformBottom) / viewportHeight)

      setEarthStage(revealStage(earthRevealProgress))
      setEarthRetiring(earthBottom <= viewportHeight * 1.16)
      setEarthRendering(earthBottom > viewportHeight * 0.32)
    }

    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateHandoff)
    }

    updateHandoff()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <section className="scene-handoff-sequence" aria-label="数据资产与数据交付连续演出">
      <div
        ref={platformLayerRef}
        id={includeFooter ? 'network' : undefined}
        className="scene-handoff-sequence__platform"
      >
        {platform}
      </div>

      <section
        ref={earthTrackRef}
        className="scene-handoff-sequence__earth-track"
        aria-label="数据资产地球幕间演出"
      >
        <div
          className="scene-handoff-sequence__earth-pin"
          data-earth-rendering={earthRendering ? 'true' : 'false'}
          data-earth-retiring={earthRetiring ? 'true' : 'false'}
          data-earth-stage={earthStage}
        >
          <DataAssetsGlobeStudy embedded renderEnabled={earthRendering} />
        </div>
      </section>

      <div className="scene-handoff-sequence__delivery">
        {includeFooter
          ? <DeliveryFooterSequence footerVariant={footerVariant} />
          : <DeliveryMaterialStudy handoff />}
      </div>
    </section>
  )
}
