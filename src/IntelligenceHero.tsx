import { useEffect, useRef } from 'react'
import { mountIntelligenceOrbit } from './intelligence-orbit-wow-study'
import { HERO_COPY_EXIT, HERO_TRACK_VIEWPORTS, NARRATIVE_DURATION, smoothStoryUnits, storyUnitsFromScroll } from './particle-story-clock'
import './intelligence-orbit-wow-study.css'

export function IntelligenceHero({ narrative = false }: { narrative?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const root = rootRef.current
    if (!section || !root) return

    const cleanupScene = mountIntelligenceOrbit(root)
    let animationFrame = 0
    let storyUnits = 0
    let clockInitialized = false
    let clockUpdatedAt = performance.now()
    let currentViewport = 0
    const orbitLabels = Array.from(root.querySelectorAll<HTMLElement>('.orbit-label'))
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (narrative) section.style.setProperty('--particle-story-track-units', String(HERO_TRACK_VIEWPORTS))

    const updateExit = (now = performance.now()) => {
      animationFrame = 0
      const navigation = document.querySelector<HTMLElement>('.site-navigation')
      const navigationHeight = navigation
        ? Number.parseFloat(getComputedStyle(navigation).getPropertyValue('--navigation-height')) || 0
        : 0
      const distance = Math.max(0, navigationHeight - section.getBoundingClientRect().top)
      if (narrative) {
        const viewport = Math.max(1, window.innerHeight)
        const viewportChanged = viewport !== currentViewport
        if (viewportChanged) {
          currentViewport = viewport
          section.style.setProperty('--particle-story-viewport', `${viewport}px`)
        }
        const requestedTarget = storyUnitsFromScroll(distance, viewport)
        const narrativeReady = root.dataset.narrativeReady === 'true'
        // Keep the donor scene intact until the receiving particle pool exists.
        // Its ready attribute wakes this clock without a loading-time RAF loop.
        const target = narrativeReady ? requestedTarget : 0
        // A fast jump into the physical curtain lift must show the completed
        // chart, not a smoothing tail from an earlier action still catching up.
        const curtainLifting = target === NARRATIVE_DURATION && root.getBoundingClientRect().bottom < viewport - 0.5
        storyUnits = !clockInitialized || reducedMotion || viewportChanged || curtainLifting
          ? target
          : smoothStoryUnits(storyUnits, target, now - clockUpdatedAt)
        clockInitialized = true
        clockUpdatedAt = now
        const copyExit = Math.min(1, storyUnits / HERO_COPY_EXIT)
        root.dataset.narrativeTargetUnits = requestedTarget.toFixed(5)
        root.dataset.narrativeWaiting = String(!narrativeReady && requestedTarget > 0)
        root.dataset.narrativeUnits = storyUnits.toFixed(5)
        root.dataset.narrativeProgress = (storyUnits / NARRATIVE_DURATION).toFixed(6)
        root.dataset.narrativeActive = String(storyUnits > 0.001)
        root.dataset.narrativeCopyRetired = String(storyUnits >= HERO_COPY_EXIT)
        root.style.setProperty('--intelligence-exit-content-opacity', (1 - copyExit).toFixed(4))
        root.style.setProperty('--intelligence-exit-copy-y', `${-18 * copyExit}px`)
        root.style.pointerEvents = storyUnits > 0.001 ? 'none' : ''
        orbitLabels.forEach(label => { label.inert = storyUnits > 0.001 || root.dataset.orbitsReady !== 'true' })
        if ((storyUnits !== target || viewportChanged) && document.visibilityState === 'visible') {
          animationFrame = window.requestAnimationFrame(updateExit)
        }
        return
      }
      const exitDistance = Math.max(1, section.clientHeight - root.clientHeight)
      const linearProgress = Math.min(1, distance / exitDistance)
      const easedProgress = linearProgress * linearProgress * (3 - 2 * linearProgress)
      const contentOpacity = Math.max(0, 1 - linearProgress * 1.45)

      root.style.setProperty('--intelligence-exit-scale', (1 - easedProgress * 0.035).toFixed(4))
      root.style.setProperty('--intelligence-exit-brightness', (1 - easedProgress * 0.24).toFixed(4))
      root.style.setProperty('--intelligence-exit-dim', (easedProgress * 0.16).toFixed(4))
      root.style.setProperty('--intelligence-exit-content-opacity', contentOpacity.toFixed(4))
      root.style.setProperty('--intelligence-exit-copy-y', `${(-18 * easedProgress).toFixed(2)}px`)
      root.dataset.exitProgress = linearProgress.toFixed(3)
      root.dataset.exiting = String(linearProgress > 0.001)
    }

    const scheduleExitUpdate = () => {
      if (animationFrame) return
      clockUpdatedAt = performance.now()
      animationFrame = window.requestAnimationFrame(updateExit)
    }

    const updateVisibility = () => {
      if (document.visibilityState === 'visible') scheduleExitUpdate()
      else if (animationFrame) {
        window.cancelAnimationFrame(animationFrame)
        animationFrame = 0
      }
    }

    const readinessObserver = narrative ? new MutationObserver(scheduleExitUpdate) : null
    readinessObserver?.observe(root, { attributes: true, attributeFilter: ['data-narrative-ready'] })
    updateExit()
    window.addEventListener('scroll', scheduleExitUpdate, { passive: true })
    window.addEventListener('resize', scheduleExitUpdate)
    document.addEventListener('visibilitychange', updateVisibility)

    return () => {
      window.removeEventListener('scroll', scheduleExitUpdate)
      window.removeEventListener('resize', scheduleExitUpdate)
      document.removeEventListener('visibilitychange', updateVisibility)
      readinessObserver?.disconnect()
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
      cleanupScene()
    }
  }, [narrative])

  return (
    <section ref={sectionRef} id="top" className={`intelligence-home-section${narrative ? ' intelligence-home-section--narrative' : ''}`} aria-label="物理世界的行动、数据与模型进化">
      {narrative && <div id="platform" className="particle-narrative-anchor" />}
      <div ref={rootRef} id="intelligence-study" data-particle-narrative={narrative ? 'true' : undefined}>
        <canvas id="intelligence-canvas" aria-hidden="true" />

        <header className="intelligence-hero-copy">
          <h1><span>让物理世界数据，</span><span>更快进入模型训练</span></h1>
        </header>

        <div className="intelligence-label" aria-label="中央粒子智能体">
          <strong>模型智能</strong>
          <span>MODEL INTELLIGENCE</span>
        </div>

        <ul className="orbit-labels" aria-label="围绕模型智能运行的三个等权条件">
          <li className="orbit-label" data-orbit-label="0">
            <button className="orbit-trigger" type="button" aria-expanded="false" aria-controls="orbit-detail-home-0">
              <strong>真实环境</strong>
              <span className="orbit-label-en">REAL ENVIRONMENTS</span>
            </button>
            <div className="orbit-detail" id="orbit-detail-home-0">
              <p>训练价值来自真实世界中的连续变化，而不是被简化的单帧样本。保留场景、时序、动作与任务结果之间的关系，数据才能反映真实执行条件。</p>
              <a href="#platform">进一步了解 <span aria-hidden="true">↗</span></a>
            </div>
          </li>
          <li className="orbit-label" data-orbit-label="1">
            <button className="orbit-trigger" type="button" aria-expanded="false" aria-controls="orbit-detail-home-1">
              <strong>全身可动机器人</strong>
              <span className="orbit-label-en">WHOLE-BODY ROBOTS</span>
            </button>
            <div className="orbit-detail" id="orbit-detail-home-1">
              <p>全身可动带来更完整的感知与运动状态，也能覆盖更复杂的采集任务。机器人的运控能力因此进入数据资产，成为模型可学习的有效信号。</p>
              <a href="#platform">进一步了解 <span aria-hidden="true">↗</span></a>
            </div>
          </li>
          <li className="orbit-label" data-orbit-label="2">
            <button className="orbit-trigger" type="button" aria-expanded="false" aria-controls="orbit-detail-home-2">
              <strong>多样化任务设计</strong>
              <span className="orbit-label-en">DIVERSE TASK DESIGN</span>
            </button>
            <div className="orbit-detail" id="orbit-detail-home-2">
              <p>多样化不是简单增加数量，而是围绕模型缺口组织任务、变量与失败样本。通过持续评估与迭代，让每轮采集都更接近训练需要。</p>
              <a href="#platform">进一步了解 <span aria-hidden="true">↗</span></a>
            </div>
          </li>
        </ul>

        <div className="scene-vignette" aria-hidden="true" />
        {narrative && <section className="particle-narrative-accessible" aria-label="Physical AI: actions, data and model improvement">
          <h2>coScene delivers actions and feedback grounded in physics for the most ambitious physical AI companies.</h2>
          <p>We partner with robotics leaders, capturing their motion control capabilities in data assets for better training outcomes for our customers.</p>
          <p>Complex actions in real-world environments strengthen robots’ generalization and robustness.</p>
          <p>The particle animation illustrates a robot performing tasks, motion becoming training data, and a qualitative model improvement curve. The chart is illustrative and does not display measured benchmark results.</p>
        </section>}
      </div>
    </section>
  )
}
