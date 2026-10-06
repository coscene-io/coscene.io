import { useLayoutEffect, useRef } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { FaLinkedin } from 'react-icons/fa6'
import { SiTiktok, SiWechat, SiX, SiXiaohongshu, SiYoutube } from 'react-icons/si'
import { createDominoClip } from './footer-domino'
import { SiteNavigation } from './SiteNavigation'
import './footer-study.css'

const footerLinks = [
  { label: '加速训练', href: '/#platform' },
  { label: '数据质量', href: '/#data-assets' },
  { label: '关于刻行', href: '/#network' },
]

function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const progress = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0))
  return progress * progress * (3 - 2 * progress)
}

export function FooterPositioning() {
  return (
    <h1
      className="site-footer__positioning"
      aria-label="贯穿始终的数据基础设施，加速模型训练"
    >
      <span className="site-footer__positioning-lead" aria-hidden="true">
        贯穿始终的数据基础设施
      </span>
      <span className="site-footer__positioning-bridge" aria-hidden="true">
        <span className="site-footer__positioning-light">加速模型训练</span>
        <span className="site-footer__positioning-dark">加速模型训练</span>
      </span>
    </h1>
  )
}

export function FooterPanel({
  fullFactoryImage = false,
  showRevealCover = true,
}: {
  fullFactoryImage?: boolean
  showRevealCover?: boolean
}) {
  return (
    <>
      <FooterPositioning />

      <div className="footer-study__factory-reveal">
        <footer className="site-footer" aria-label="刻行时空页脚">
          <div className="site-footer__information">
            <div className="site-footer__contact">
              <p>与我们讨论模型需要的数据</p>
              <a href="mailto:hello@kexing.space">
                <span>hello@kexing.space</span>
                <ArrowUpRight aria-hidden="true" size={23} strokeWidth={1.2} />
              </a>
            </div>

            <div className="site-footer__secondary">
              <nav className="site-footer__navigation" aria-label="页脚导航">
                {footerLinks.map((link) => (
                  <a href={link.href} key={link.label}>{link.label}</a>
                ))}
              </nav>

              <div className="site-footer__channels" aria-label="刻行时空社交媒体">
                <ul>
                  <li aria-label="微信" title="微信">
                    <SiWechat aria-hidden="true" />
                  </li>
                  <li aria-label="小红书" title="小红书">
                    <SiXiaohongshu aria-hidden="true" />
                  </li>
                  <li aria-label="抖音" title="抖音">
                    <SiTiktok aria-hidden="true" />
                  </li>
                  <li aria-label="YouTube" title="YouTube">
                    <SiYoutube aria-hidden="true" />
                  </li>
                  <li aria-label="LinkedIn" title="LinkedIn">
                    <FaLinkedin aria-hidden="true" />
                  </li>
                  <li aria-label="X" title="X">
                    <SiX aria-hidden="true" />
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="site-footer__legal">
            <span>© 2026 刻行时空</span>
          </div>
        </footer>

        <figure className="data-factory" aria-label="刻行数据工厂全景图">
          {fullFactoryImage ? (
            <img
              className="data-factory__field"
              src="/assets/data-factory/factory-web-grade-preview-v2.webp"
              alt="刻行数据工厂全景图，展示真实场景数据进入标注、清洗、对齐、合成、质量分析与交付体系的完整路径"
            />
          ) : (
            <picture>
              <source
                media="(min-width: 1200px)"
                srcSet="/assets/data-factory/factory-web-grade-crop-v2.webp"
              />
              <img
                className="data-factory__field"
                src="/assets/data-factory/factory-web-grade-preview-v2.webp"
                alt="刻行数据工厂全景图，展示真实场景数据进入标注、清洗、对齐、合成、质量分析与交付体系的完整路径"
              />
            </picture>
          )}
        </figure>

        {showRevealCover && (
          <div className="footer-study__cover" aria-hidden="true">
            <img src="/assets/delivery-material/density-reference-sr4x.png" alt="" />
          </div>
        )}
      </div>
    </>
  )
}

export function FooterStudy() {
  const finalRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const section = finalRef.current
      if (!section) return

      const rect = section.getBoundingClientRect()
      const viewportHeight = Math.max(1, window.innerHeight)
      const progress = clamp((viewportHeight - rect.top) / (viewportHeight * 0.62))
      const footerTitle = smoothstep(0.38, 0.78, progress)
      const footerTitleSplit = smoothstep(0.68, 0.95, progress)
      const footerCopy = smoothstep(0.64, 0.92, progress)

      section.style.setProperty('--footer-reveal', progress.toFixed(4))
      section.style.setProperty('--domino-clip', createDominoClip(progress, window.innerWidth))
      section.style.setProperty('--footer-title', footerTitle.toFixed(4))
      section.style.setProperty('--footer-title-shift', `${((1 - footerTitle) * 24).toFixed(2)}px`)
      section.style.setProperty('--footer-title-split', footerTitleSplit.toFixed(4))
      section.style.setProperty('--footer-copy', footerCopy.toFixed(4))
      section.style.setProperty('--footer-copy-shift', `${((1 - footerCopy) * 18).toFixed(2)}px`)
      section.dataset.revealComplete = progress > 0.985 ? 'true' : 'false'
    }

    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [])

  return (
    <main id="top" className="footer-study">
      <SiteNavigation />

      <section className="footer-study__previous" aria-label="第四幕沉淀画面结束状态">
        <img
          className="footer-study__material"
          src="/assets/delivery-material/density-reference-sr4x.png"
          alt=""
        />
        <div className="footer-study__material-tone" aria-hidden="true" />
      </section>

      <section ref={finalRef} id="contact" className="footer-study__final" aria-label="数据工厂与网站页脚">
        <div className="footer-study__final-material" aria-hidden="true">
          <img src="/assets/delivery-material/density-reference-sr4x.png" alt="" />
          <span />
        </div>

        <FooterPanel />
      </section>
    </main>
  )
}
