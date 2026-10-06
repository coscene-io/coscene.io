import { useEffect, useRef, useState } from 'react'
import { DeliveryMaterialCanvas, DeliveryMaterialValues } from './delivery-material-study'
import { createDominoRevealClip } from './footer-domino'
import { FooterPanel } from './footer-study'
import { PortraitFooterPanel } from './delivery-footer-portrait-study'
import { SiteNavigation } from './SiteNavigation'
import './delivery-material-study.css'
import './footer-study.css'
import './delivery-footer-handoff-study.css'
import './delivery-footer-portrait-study.css'

function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const progress = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0))
  return progress * progress * (3 - 2 * progress)
}

export function DeliveryFooterSequence({
  footerVariant = 'horizontal',
}: {
  footerVariant?: 'horizontal' | 'portrait'
} = {}) {
  const continuumRef = useRef<HTMLDivElement>(null)
  const actTrackRef = useRef<HTMLElement>(null)
  const actPinRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLElement>(null)
  const progressRef = useRef(0)
  const continuationRef = useRef(0)
  const [canvasActive, setCanvasActive] = useState(false)

  useEffect(() => {
    const continuum = continuumRef.current
    if (!continuum) return

    const observer = new IntersectionObserver(([entry]) => {
      setCanvasActive(entry.isIntersecting)
    }, { rootMargin: '40% 0px' })

    observer.observe(continuum)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let animationFrame = 0
    let lastDominoProgress = -1
    const metrics = {
      actTop: 0,
      actDistance: 1,
      footerTop: 0,
      footerHeight: 1,
      portraitRevealStart: 0.67,
      portraitFlow: false,
      portraitFlowStart: 0,
      portraitFlowEnd: 1,
    }

    const measure = () => {
      const track = actTrackRef.current
      const footer = footerRef.current
      if (!track || !footer) return

      metrics.actTop = track.getBoundingClientRect().top + window.scrollY
      metrics.actDistance = Math.max(1, track.offsetHeight - window.innerHeight)
      metrics.footerTop = footer.getBoundingClientRect().top + window.scrollY
      metrics.footerHeight = Math.max(1, footer.offsetHeight)
      metrics.portraitRevealStart = clamp(window.innerHeight / metrics.footerHeight)
      metrics.portraitFlow = window.matchMedia('(max-width: 760px), (max-height: 680px)').matches
      const navigationHeight = document.querySelector('.site-navigation')?.getBoundingClientRect().height ?? 0
      metrics.portraitFlowEnd = metrics.footerTop - navigationHeight
      metrics.portraitFlowStart = metrics.portraitFlowEnd - Math.min(300, window.innerHeight * 0.32)
    }

    const update = () => {
      animationFrame = 0
      const pin = actPinRef.current
      const footer = footerRef.current
      if (!pin || !footer) return

      const scrollY = window.scrollY
      const progress = clamp((scrollY - metrics.actTop) / metrics.actDistance)
      const coverProgress = smoothstep(0.015, 0.24, progress)
      const materialProgress = clamp(progress / 0.86)
      const semanticProgress = smoothstep(0.46, 0.62, progress)
      const synthesisProgress = smoothstep(0.58, 0.74, progress)
      const evaluationProgress = smoothstep(0.70, 0.86, progress)
      const semanticHeading = smoothstep(0.62, 0.68, progress)
      const semanticDetail = smoothstep(0.65, 0.71, progress)
      const synthesisHeading = smoothstep(0.74, 0.80, progress)
      const synthesisDetail = smoothstep(0.77, 0.83, progress)
      const evaluationHeading = smoothstep(0.86, 0.92, progress)
      const evaluationDetail = smoothstep(0.89, 0.95, progress)
      progressRef.current = materialProgress
      pin.style.setProperty('--cover-offset', `${coverProgress * -105}%`)
      pin.style.setProperty('--semantic-scale', semanticProgress.toFixed(4))
      pin.style.setProperty('--synthesis-scale', synthesisProgress.toFixed(4))
      pin.style.setProperty('--evaluation-scale', evaluationProgress.toFixed(4))
      pin.style.setProperty('--semantic-heading', semanticHeading.toFixed(4))
      pin.style.setProperty('--semantic-detail', semanticDetail.toFixed(4))
      pin.style.setProperty('--synthesis-heading', synthesisHeading.toFixed(4))
      pin.style.setProperty('--synthesis-detail', synthesisDetail.toFixed(4))
      pin.style.setProperty('--evaluation-heading', evaluationHeading.toFixed(4))
      pin.style.setProperty('--evaluation-detail', evaluationDetail.toFixed(4))
      pin.style.setProperty('--semantic-offset', `${(1 - semanticHeading) * 14}px`)
      pin.style.setProperty('--synthesis-offset', `${(1 - synthesisHeading) * 14}px`)
      pin.style.setProperty('--evaluation-offset', `${(1 - evaluationHeading) * 14}px`)
      pin.dataset.materialStage = materialProgress < 0.24
        ? 'light'
        : materialProgress < 0.70
          ? 'separating'
          : 'settled'

      const footerProgress = clamp(
        (scrollY + window.innerHeight - metrics.footerTop) / metrics.footerHeight,
      )
      const footerTitle = smoothstep(0.10, 0.42, footerProgress)
      const footerTitleSplit = smoothstep(0.76, 0.96, footerProgress)
      const dominoProgress = smoothstep(0.05, 0.90, footerProgress)
      const footerCopy = smoothstep(0.58, 0.94, footerProgress)
      // A tall, normal-flow mobile frame must finish opening before its first row leaves.
      const portraitInputReveal = metrics.portraitFlow
        ? smoothstep(metrics.portraitFlowStart, metrics.portraitFlowEnd, scrollY)
        : smoothstep(metrics.portraitRevealStart, 0.99, footerProgress)
      const portraitLinkOne = smoothstep(0.39, 0.50, footerProgress)
      const portraitCoreReveal = smoothstep(0.47, 0.62, footerProgress)
      const portraitLinkTwo = smoothstep(0.59, 0.69, footerProgress)
      const portraitDeliveryReveal = smoothstep(0.66, 0.79, footerProgress)
      const portraitEnd = smoothstep(0.28, 0.46, footerProgress)
      const portraitStart = smoothstep(0.72, 0.84, footerProgress)
      const portraitSummary = smoothstep(0.91, 0.965, footerProgress)
      const portraitCopy = smoothstep(0.96, 0.995, footerProgress)
      continuationRef.current = smoothstep(0.04, 0.98, footerProgress)

      footer.style.setProperty('--footer-title', footerTitle.toFixed(4))
      footer.style.setProperty('--footer-title-shift', `${((1 - footerTitle) * 24).toFixed(2)}px`)
      footer.style.setProperty('--footer-title-split', footerTitleSplit.toFixed(4))
      footer.style.setProperty('--footer-copy', footerCopy.toFixed(4))
      footer.style.setProperty('--footer-copy-shift', `${((1 - footerCopy) * 18).toFixed(2)}px`)
      footer.style.setProperty('--portrait-input-conceal', `${((1 - portraitInputReveal) * 100).toFixed(3)}%`)
      footer.style.setProperty('--portrait-link-one', portraitLinkOne.toFixed(4))
      footer.style.setProperty('--portrait-core-conceal', `${((1 - portraitCoreReveal) * 100).toFixed(3)}%`)
      footer.style.setProperty('--portrait-link-two', portraitLinkTwo.toFixed(4))
      footer.style.setProperty('--portrait-delivery-conceal', `${((1 - portraitDeliveryReveal) * 100).toFixed(3)}%`)
      footer.style.setProperty('--portrait-end', portraitEnd.toFixed(4))
      footer.style.setProperty('--portrait-start', portraitStart.toFixed(4))
      footer.style.setProperty('--portrait-summary-one', portraitSummary.toFixed(4))
      footer.style.setProperty('--portrait-summary-two', portraitSummary.toFixed(4))
      footer.style.setProperty('--portrait-summary-one-shift', `${((1 - portraitSummary) * 18).toFixed(2)}px`)
      footer.style.setProperty('--portrait-summary-two-shift', `${((1 - portraitSummary) * 18).toFixed(2)}px`)
      footer.style.setProperty('--portrait-copy', portraitCopy.toFixed(4))
      footer.style.setProperty('--portrait-copy-shift', `${((1 - portraitCopy) * 18).toFixed(2)}px`)
      footer.dataset.revealComplete = footerProgress > 0.985 ? 'true' : 'false'

      if (footerVariant === 'horizontal' && (
        Math.abs(dominoProgress - lastDominoProgress) >= 0.004 ||
        dominoProgress === 0 ||
        dominoProgress === 1
      )) {
        footer.style.setProperty(
          '--domino-reveal-clip',
          createDominoRevealClip(dominoProgress, window.innerWidth),
        )
        lastDominoProgress = dominoProgress
      }
    }

    const scheduleUpdate = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(update)
    }

    const handleResize = () => {
      measure()
      lastDominoProgress = -1
      scheduleUpdate()
    }

    const resizeObserver = new ResizeObserver(handleResize)
    if (actTrackRef.current) resizeObserver.observe(actTrackRef.current)
    if (footerRef.current) resizeObserver.observe(footerRef.current)

    measure()
    update()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', handleResize)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', handleResize)
    }
  }, [footerVariant])

  return (
    <div ref={continuumRef} className="delivery-footer-handoff__continuum">
      <div className="delivery-footer-handoff__background" aria-hidden="true">
        <DeliveryMaterialCanvas
          progressRef={progressRef}
          continuationRef={continuationRef}
          active={canvasActive}
        />
        <div className="delivery-material-surface" />
      </div>

      <section
        ref={actTrackRef}
        className="delivery-material-track delivery-footer-handoff__act"
        aria-label="数据后处理材质与流动研究"
      >
        <div
          ref={actPinRef}
          className="delivery-material-pin delivery-footer-handoff__act-pin"
          data-material-stage="light"
        >
          <DeliveryMaterialValues />
          <div className="delivery-material-cover" aria-hidden="true" />
        </div>
      </section>

      <section
        ref={footerRef}
        id={footerVariant === 'horizontal' ? 'contact' : undefined}
        className={`footer-study__final delivery-footer-handoff__footer delivery-footer-handoff__footer--${footerVariant}`}
        aria-label="数据工厂与网站页脚"
      >
        {footerVariant === 'portrait'
          ? <PortraitFooterPanel />
          : <FooterPanel fullFactoryImage showRevealCover={false} />}
      </section>
    </div>
  )
}

export function DeliveryFooterHandoffStudy() {
  return (
    <main id="top" className="delivery-footer-handoff">
      <SiteNavigation />
      <DeliveryFooterSequence footerVariant="portrait" />
    </main>
  )
}
