import { ArrowUpRight } from 'lucide-react'
import { FaLinkedin } from 'react-icons/fa6'
import { SiTiktok, SiWechat, SiX, SiXiaohongshu, SiYoutube } from 'react-icons/si'

const footerLinks = [
  { label: '加速训练', href: '#platform' },
  { label: '数据质量', href: '#data-assets' },
  { label: '关于刻行', href: '#network' },
]

const fourCapabilities = [
  {
    index: '01',
    phase: '数据准备',
    title: '清洗标注',
    detail: '去噪、对齐与结构化',
    visual: 'cleaning',
    images: [
      {
        className: 'capability-panel__atom--starbase',
        src: '/assets/data-factory/capabilities/cleaning-starbase-v1.webp',
      },
    ],
  },
  {
    index: '02',
    phase: '数据增强',
    title: '数据合成',
    detail: '补足稀缺与长尾样本',
    visual: 'synthesis',
    images: [
      {
        className: 'capability-panel__atom--synthesis',
        src: '/assets/data-factory/capabilities/synthesis-lab-v1.webp',
      },
    ],
  },
  {
    index: '03',
    phase: '训练验证',
    title: '仿真测试',
    detail: '在进入真机前持续验证',
    visual: 'simulation',
    images: [
      {
        className: 'capability-panel__atom--servers',
        src: '/assets/data-factory/capabilities/simulation-servers-v1.webp',
      },
      {
        className: 'capability-panel__atom--regression',
        src: '/assets/data-factory/capabilities/simulation-lab-v1.webp',
      },
    ],
  },
  {
    index: '04',
    phase: '质量闭环',
    title: '质量评估',
    detail: '以模型反馈衡量数据增益',
    visual: 'quality',
    images: [
      {
        className: 'capability-panel__atom--quality',
        src: '/assets/data-factory/capabilities/quality-lab-v1.webp',
      },
    ],
  },
]

const sixCapabilities = [
  {
    index: '01',
    phase: '数据源头',
    title: '数据采集',
    detail: '真实场景与多模态采集',
    visual: 'six',
    images: [
      {
        className: 'capability-panel__atom--six',
        src: '/assets/data-factory/capabilities-six/01-data-collection-v2.webp',
      },
    ],
  },
  {
    index: '02',
    phase: '数据准备',
    title: '清洗标注',
    detail: '去噪、对齐与结构化',
    visual: 'six',
    images: [
      {
        className: 'capability-panel__atom--six',
        src: '/assets/data-factory/capabilities-six/02-cleaning-labeling-polished.webp',
      },
    ],
  },
  {
    index: '03',
    phase: '数据增强',
    title: '数据合成',
    detail: '补足稀缺与长尾样本',
    visual: 'six',
    images: [
      {
        className: 'capability-panel__atom--six',
        src: '/assets/data-factory/capabilities-six/03-data-synthesis-v2.webp',
      },
    ],
  },
  {
    index: '04',
    phase: '训练验证',
    title: '仿真测试',
    detail: '真机前持续回归验证',
    visual: 'six',
    images: [
      {
        className: 'capability-panel__atom--six',
        src: '/assets/data-factory/capabilities-six/04-simulation-testing-v2.webp',
      },
    ],
  },
  {
    index: '05',
    phase: '质量闭环',
    title: '质量评估',
    detail: '以模型反馈衡量增益',
    visual: 'six',
    images: [
      {
        className: 'capability-panel__atom--six',
        src: '/assets/data-factory/capabilities-six/05-quality-evaluation-polished.webp',
      },
    ],
  },
  {
    index: '06',
    phase: '合规流转',
    title: '合规交付',
    detail: '可追溯的数据交付',
    visual: 'six',
    images: [
      {
        className: 'capability-panel__atom--six',
        src: '/assets/data-factory/capabilities-six/06-compliant-delivery-polished.webp',
      },
    ],
  },
]

export function PortraitFooterPanel() {
  const isFourLayout = new URLSearchParams(window.location.search).get('layout') === '4'
  const capabilities = isFourLayout ? fourCapabilities : sixCapabilities
  const layout = isFourLayout ? 'four' : 'six'

  return (
    <div className={`portrait-footer portrait-footer--${layout}`}>
      <div className="portrait-footer__composition">
        <div className="portrait-footer__stage">
          {isFourLayout ? (
            <header className="portrait-footer__heading">
              <h1>以终为始</h1>
              <p>训练前的数据准备与验证</p>
            </header>
          ) : null}

          <div className={`portrait-footer__frame portrait-footer__frame--${layout}`}>
            {capabilities.map((capability) => (
              <article className="capability-panel" key={capability.title}>
                <figure
                  className={`capability-panel__visual capability-panel__visual--${capability.visual}`}
                  aria-label={`${capability.title}能力场景`}
                >
                  {capability.images.map((image) => (
                    <img
                      className={`capability-panel__atom ${image.className}`}
                      src={image.src}
                      alt=""
                      decoding="async"
                      fetchPriority="low"
                      loading="lazy"
                      key={image.src}
                    />
                  ))}
                </figure>

                <div className="capability-panel__copy">
                  <p>
                    <span>{capability.index}</span>
                    {isFourLayout ? capability.phase : null}
                  </p>
                  <h2>{capability.title}</h2>
                  <span>{capability.detail}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="portrait-footer__closing">
        {!isFourLayout ? (
          <section className="portrait-footer__summary" aria-label="数据能力总结">
            <p className="portrait-footer__summary-line portrait-footer__summary-line--quality">
              以终为始的质量管理
            </p>
            <p className="portrait-footer__summary-line portrait-footer__summary-line--craft">
              随时就绪的数据工艺
            </p>
          </section>
        ) : null}

        <footer id="contact" className="portrait-footer__utility" aria-label="刻行时空页脚">
          <div className="portrait-footer__contact">
            <p>与我们讨论模型需要的数据</p>
            <a href="mailto:hello@kexing.space">
              <span>hello@kexing.space</span>
              <ArrowUpRight aria-hidden="true" size={22} strokeWidth={1.2} />
            </a>
          </div>

          <div className="portrait-footer__utility-row">
            <nav className="portrait-footer__navigation" aria-label="页脚导航">
              {footerLinks.map((link) => (
                <a href={link.href} key={link.label}>{link.label}</a>
              ))}
            </nav>

            <ul className="portrait-footer__channels" aria-label="刻行时空社交媒体">
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

          <div className="portrait-footer__legal">© 2026 刻行时空</div>
        </footer>
      </div>
    </div>
  )
}
