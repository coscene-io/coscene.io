import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { DataAssetsGlobeStudy } from './data-assets-globe-study'
import { STORY_PHASES } from './particle-story-clock'
import { DataValueEnding } from './DataValueEnding'
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
  ending,
  particleHandoff = false,
}: {
  platform?: ReactNode
  ending?: ReactNode
  particleHandoff?: boolean
}) {
  const platformLayerRef = useRef<HTMLDivElement>(null)
  const earthTrackRef = useRef<HTMLElement>(null)
  const [earthStage, setEarthStage] = useState<RevealStage>('covered')
  const [earthRetiring, setEarthRetiring] = useState(false)
  const [earthRendering, setEarthRendering] = useState(true)
  const [earthWarmup, setEarthWarmup] = useState(false)

  useEffect(() => {
    let frame = 0

    const updateHandoff = () => {
      frame = 0
      const platformLayer = platformLayerRef.current
      const earthTrack = earthTrackRef.current
      if (!earthTrack || (!particleHandoff && !platformLayer)) return

      const viewportHeight = Math.max(1, window.innerHeight)
      if (particleHandoff) {
        earthTrack.parentElement?.style.setProperty('--particle-story-viewport', `${viewportHeight}px`)
      }
      const earthRect = earthTrack.getBoundingClientRect()
      const earthBottom = earthRect.bottom

      if (particleHandoff) {
        const hero = document.querySelector<HTMLElement>('#intelligence-study')
        const curtainBottom = hero?.getBoundingClientRect().bottom ?? viewportHeight
        const earthRevealProgress = clamp((viewportHeight - curtainBottom) / viewportHeight)
        const storyUnits = Number.parseFloat(hero?.dataset.narrativeTargetUnits ?? hero?.dataset.narrativeUnits ?? '0')
        // Compile/upload behind the opaque stage while the task becomes data.
        // Once the curtain has fully lifted, normal visibility owns rendering.
        const warmup = storyUnits >= STORY_PHASES.taskHandoff + 0.10 && curtainBottom > 0 && earthBottom > 0
        earthTrack.dataset.earthReveal = earthRevealProgress.toFixed(4)
        setEarthWarmup(warmup)
        setEarthStage(revealStage(earthRevealProgress))
        setEarthRendering(warmup || (earthRect.top < viewportHeight * 1.25 && earthBottom > viewportHeight * 0.32))
      } else {
        const platformBottom = platformLayer!.getBoundingClientRect().bottom
        const earthRevealProgress = clamp((viewportHeight - platformBottom) / viewportHeight)
        setEarthStage(revealStage(earthRevealProgress))
        setEarthRendering(earthBottom > viewportHeight * 0.32)
        setEarthWarmup(false)
      }

      setEarthRetiring(earthBottom <= viewportHeight * 1.16)
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
  }, [particleHandoff])

  return (
    <section
      className={`scene-handoff-sequence${particleHandoff ? ' scene-handoff-sequence--particles' : ''}`}
      aria-label="数据资产与数据交付连续演出"
    >
      {!particleHandoff && <div
        ref={platformLayerRef}
        id="network"
        className="scene-handoff-sequence__platform"
      >
        {platform}
      </div>}

      <section
        ref={earthTrackRef}
        className="scene-handoff-sequence__earth-track"
        aria-label="数据资产地球幕间演出"
      >
        <div
          className="scene-handoff-sequence__earth-pin"
          data-earth-rendering={earthRendering ? 'true' : 'false'}
          data-earth-warmup={earthWarmup ? 'true' : 'false'}
          data-earth-retiring={earthRetiring ? 'true' : 'false'}
          data-earth-stage={earthStage}
        >
          <DataAssetsGlobeStudy embedded renderEnabled={earthRendering} warmup={earthWarmup} />
        </div>
      </section>

      <div className="scene-handoff-sequence__delivery">
        {ending ?? <DataValueEnding handoff />}
      </div>
    </section>
  )
}
