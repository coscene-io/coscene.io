import { useEffect, useRef, useState } from 'react'
import { SiteNavigation } from './SiteNavigation'
import AboutTeamMarquee from './AboutTeamMarquee'
import AboutClosingSection from './AboutClosingSection'

const philosophyIntroduction = [
  '对科研机构来说，更重要的是走出实验室，在广泛多样的真实场景与任务中获取数据，检验模型的真实能力。',
  '这正是刻行时空擅长的，通过连接硬件与数据，为前者提供促进智能进化的有利环境。',
]

// Wix wh-1189 media is used directly for this local reference-comparison study.
// Source and release boundaries are recorded in output/about-kexing-first-scene/REFERENCE.md.
const referenceMotion = 'https://video.wixstatic.com/video/11062b_ae5c05a0b1cc439eb4ed8477167d0273/480p/mp4/file.mp4'
const referencePoster = 'https://static.wixstatic.com/media/11062b_ae5c05a0b1cc439eb4ed8477167d0273f000.jpg/v1/fill/w_1920,h_630,fp_0.50_0.50,q_85,enc_auto/11062b_ae5c05a0b1cc439eb4ed8477167d0273f000.jpg'

// Reference geometry for the first two principles; an authored focus mark for data.
function TeamMark({ kind }: { kind: 'outcome' | 'partnership' | 'data' }) {
  return <svg viewBox="0 0 88 88" aria-hidden="true" className="about-team-mark">
    {kind === 'outcome' && <>
      <defs><clipPath id="team-outcome-circle"><circle cx="44" cy="44" r="35" /></clipPath></defs>
      <g clipPath="url(#team-outcome-circle)">
        {Array.from({ length: 8 }, (_, i) => <rect key={i} x="7" y={9 + i * 6.5} width="74" height={1.5 + i * .4} />)}
        <rect x="7" y="61" width="74" height="23" />
      </g>
    </>}
    {kind === 'partnership' && <>
      <ellipse cx="44" cy="15" rx="34" ry="3.5" />
      <ellipse cx="44" cy="27" rx="34" ry="6" />
      <ellipse cx="44" cy="44" rx="34" ry="9" />
      <ellipse cx="44" cy="67" rx="34" ry="13" />
    </>}
    {kind === 'data' && <>
      <circle cx="44" cy="44" r="26" fill="none" stroke="currentColor" strokeWidth="6" />
      <path d="M44 9V30M44 58V79M9 44H30M58 44H79" fill="none" stroke="currentColor" strokeWidth="6" />
      <circle cx="44" cy="44" r="6" />
    </>}
  </svg>
}

function PeopleMark({ kind }: { kind: 'team' | 'founder' | 'style' }) {
  return <svg className="about-people-mark" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'team' && <>
      <circle cx="32" cy="17" r="7" />
      <path d="M19 43V38C19 31 24 27 32 27S45 31 45 38V43" />
      <path d="M17 18A6 6 0 1 0 17 30M15 35C8 35 5 39 5 45V49H16M47 18A6 6 0 1 1 47 30M49 35C56 35 59 39 59 45V49H48M19 50H45" />
    </>}
    {kind === 'founder' && <>
      <rect x="24" y="7" width="16" height="14" />
      <path d="M32 21V31M12 40V31H52V40M32 31V40" />
      <rect x="6" y="40" width="12" height="14" />
      <rect x="26" y="40" width="12" height="14" />
      <rect x="46" y="40" width="12" height="14" />
    </>}
    {kind === 'style' && <>
      <path d="M23 11H11V53H23M41 11H53V53H41" />
      <path d="M19 26H43L37 20M45 38H21L27 44" />
    </>}
  </svg>
}

export default function AboutKexingPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const visibleRef = useRef(true)
  const wantsMotionRef = useRef(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    if (!window.location.hash) return
    const frame = requestAnimationFrame(() => {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' })
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let disposed = false
    const syncPlayback = () => {
      if (wantsMotionRef.current && visibleRef.current && !document.hidden) {
        void video.play().catch(() => { if (!disposed) setPlaying(false) })
      } else video.pause()
    }
    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting
      syncPlayback()
    }, { threshold: 0.05 })
    observer.observe(video)
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => {
      wantsMotionRef.current = !preference.matches
      setReducedMotion(preference.matches)
      syncPlayback()
    }
    document.addEventListener('visibilitychange', syncPlayback)
    preference.addEventListener('change', updatePreference)
    syncPlayback()
    return () => {
      disposed = true
      observer.disconnect()
      document.removeEventListener('visibilitychange', syncPlayback)
      preference.removeEventListener('change', updatePreference)
      video.pause()
    }
  }, [])

  return <div className="about-site">
    <a className="about-skip" href="#philosophy">跳至经营理念</a>
    <SiteNavigation homeHref="/" contactHref="#contact" />
    <main>
      <section className="about-scene about-reference-hero" id="philosophy" aria-labelledby="about-heading">
        <header className="about-scene-copy about-introduction">
          <p className="about-sequence"><span>01</span><span>经营理念</span></p>
          <h1 id="about-heading">为下一代物理AI提供<br />来自真实世界的行动与反馈</h1>
          <div className="about-copy">{philosophyIntroduction.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
        </header>
        <figure className="about-motion-field" aria-label="持续舒展的抽象曲面" data-playing={playing} data-reduced-motion={reducedMotion}>
          <div className="about-reference-media">
            <img src={referencePoster} alt="" fetchPriority="high" />
            <video ref={videoRef} src={referenceMotion} poster={referencePoster} autoPlay={!reducedMotion} muted loop playsInline preload={reducedMotion ? 'none' : 'auto'} aria-hidden="true" hidden={failed} onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => { setFailed(true); setPlaying(false) }} />
          </div>
        </figure>
      </section>
      <section className="about-scene about-team" id="connection" aria-labelledby="connection-heading">
        <header className="about-scene-copy about-team-top">
          <p className="about-sequence"><span>02</span><span>连接与协作</span></p>
          <h2 id="connection-heading">连接领先者，<br />用数据推动物理AI进化</h2>
          <div className="about-copy">
            <p>我们正在和宇树科技等高性能机器公司共同建设新一代物理AI基础设施，承接领先的人工智能公司的训练需求。</p>
            <p>生态中立使得我们能与机器人产业的佼佼者广泛合作，将其运控性能融入数据资产，从而创造更出色的训练成果。</p>
          </div>
        </header>
        <div className="about-team-notes">
          <article className="about-team-note about-team-expertise">
            <div className="about-team-panel-top"><TeamMark kind="outcome" /><span>01</span></div>
            <div className="about-team-panel-copy">
              <h3>以终为始</h3>
              <p>从真实训练需求出发</p>
            </div>
          </article>
          <article className="about-team-note about-team-founder">
            <div className="about-team-panel-top"><TeamMark kind="partnership" /><span>02</span></div>
            <div className="about-team-panel-copy">
              <h3>与本体厂商携手</h3>
              <p>为训练模型找到最佳硬件组合</p>
            </div>
          </article>
          <article className="about-team-note about-team-openness">
            <div className="about-team-panel-top"><TeamMark kind="data" /><span>03</span></div>
            <div className="about-team-panel-copy">
              <h3>专注数据工程</h3>
              <p>横跨软件、硬件、算法的工程支持</p>
            </div>
          </article>
        </div>
      </section>
      <section className="about-scene about-people" id="team" aria-labelledby="team-heading">
        <AboutTeamMarquee />
        <div className="about-people-content">
          <p className="about-sequence about-people-sequence"><span>03</span><span>我们的团队</span></p>
          <p className="about-people-intro">刻行时空成立于2022年，是最早从事多模态时空数据治理的基础设施公司之一。</p>
          <div className="about-people-details">
            <article className="about-people-founder" aria-labelledby="founder-name">
              <PeopleMark kind="founder" />
              <div className="about-team-person"><h3 id="founder-name">黄阳明</h3><span>创始人 / CEO</span></div>
              <p className="about-people-body">大数据、分布式计算、云编排、AI基建领域资深专家。历任苹果手表及自动驾驶部门数据基础设施核心架构师、赢彻科技Infra负责人、高仙机器人云服务与基础设施负责人。</p>
            </article>
            <article className="about-people-members" aria-labelledby="members-heading">
              <PeopleMark kind="team" />
              <h3 id="members-heading">团队成员</h3>
              <p className="about-people-body">团队多名初创成员拥有美国公立常青藤、国内985名校的计算机科学背景及海外工作经历，长期专注于自动驾驶与机器人数据治理，具备横跨软件、硬件、算法的工程经验。</p>
            </article>
            <article className="about-people-openness" id="openness" aria-labelledby="style-heading">
              <PeopleMark kind="style" />
              <h3 id="style-heading">专注数据，开放协作</h3>
              <p className="about-people-body">刻行时空秉持生态开放与科学的市场分工理念，专注于数据，与多家本体及末端执行器企业开展深度合作，让上下游伙伴各展所长，并以扎实的工程能力在业内建立良好口碑。</p>
            </article>
          </div>
        </div>
      </section>
      <AboutClosingSection />
    </main>
  </div>
}
