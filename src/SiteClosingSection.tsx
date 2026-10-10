import { useEffect, useId, useRef } from 'react'
import { ArrowDown, ArrowUpRight, ChevronDown } from 'lucide-react'
import { SiX } from 'react-icons/si'
import SiteContactForm from './SiteContactForm'
import ClosingWordband from './ClosingWordband'
import ClosingFormReveal from './ClosingFormReveal'
import wordmark from './assets/kexing-wordmark.svg'
import './site-closing.css'

const careersUrl = 'https://www.coscene.cn/join-us'
const wechatQr = 'https://framerusercontent.com/images/1Irkifb4yJdyLk2OQCxNmV7bPAc.png'
// The first two roles are supplied by the user for this local design preview.
const roles = ['数据工程师', '算法工程师', '前端开发工程师', '后端开发工程师', '高级产品经理', '项目经理']
const cities = ['苏州', '上海', '北京', '硅谷']
// Match the approved home footer, which supplies these labels without account URLs.
const socialChannels = ['小红书', '抖音', 'YouTube', 'LinkedIn', 'X']

type SiteClosingSectionProps = {
  variant?: 'frosted' | 'ink'
  priority?: 'balanced' | 'cooperation'
  sequence?: string
  id?: string
}

export default function SiteClosingSection({ variant = 'frosted', priority = 'balanced', sequence, id = 'contact' }: SiteClosingSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const instanceId = useId()
  const contactHeadingId = `${instanceId}-contact-heading`
  const careersHeadingId = `${instanceId}-careers-heading`
  const careersOpeningsId = `${instanceId}-careers-openings`
  useEffect(() => {
    if (window.location.hash !== `#${id}`) return
    const frame = requestAnimationFrame(() => sectionRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' }))
    return () => cancelAnimationFrame(frame)
  }, [id])

  return <section ref={sectionRef} className={`site-closing site-closing--${variant}${priority === 'cooperation' ? ' site-closing--cooperation' : ''}`} id={id} aria-labelledby={contactHeadingId}>
    <div className="site-closing-panel">
      {priority === 'cooperation' ? <div className="site-closing-cooperation">
        <ClosingWordband />
        <ClosingFormReveal>
          <div className="site-closing-form-sheet">
            <h2 className="site-closing-action-heading" id={contactHeadingId}>随时响应您的数据需要</h2>
            <SiteContactForm id="cooperation-form" />
          </div>
        </ClosingFormReveal>
      </div> :
      <div className="site-closing-main">
        <h2 className="site-closing-heading" id={contactHeadingId}>{sequence && <span className="site-closing-sequence">{sequence}</span>}<span>联系与合作</span></h2>
        <SiteContactForm />
        <div className="site-careers" aria-labelledby={careersHeadingId}>
          <div className="site-careers-intro">
            <div className="site-careers-intro-heading">
              <h3 id={careersHeadingId}>期待与你在此相遇</h3>
              <a className="site-careers-link" href={`#${careersOpeningsId}`} aria-label="查看招聘职位" title="查看招聘职位"><ArrowDown size={18} strokeWidth={1.75} aria-hidden="true" /></a>
            </div>
            <ul className="site-careers-cities" aria-label="工作城市">{cities.map(city => <li key={city}>{city}</li>)}</ul>
          </div>
          <div className="site-careers-openings" id={careersOpeningsId}>
            <ul className="site-careers-roles" aria-label="招聘职位">
              {roles.map(role => <li key={role}><a href={careersUrl} target="_blank" rel="noreferrer" title={`查看${role}职位`}>{role}</a></li>)}
            </ul>
          </div>
        </div>
      </div>}
      <footer className="site-closing-footer" aria-label="刻行时空页脚">
        <div className="site-closing-footer-main">
          <div className="site-closing-footer-identity">
            <a className="site-closing-footer-brand" href="/" aria-label="刻行时空首页"><img src={wordmark} alt="刻行时空 coScene" width="160" height="44" /></a>
            {priority === 'cooperation' && <a className="site-closing-footer-careers" href={careersUrl} target="_blank" rel="noreferrer">加入我们 <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden="true" /></a>}
          </div>
          <div className="site-closing-footer-contact">
            <a className="site-closing-footer-email" href="mailto:contact@coscene.io">contact@coscene.io</a>
            <div className="site-closing-footer-contact-links">
              <a className="site-closing-footer-phone" href="tel:+862152300532">021-52300532</a>
              <ul className="site-closing-footer-channels" aria-label="刻行时空社交媒体">
                <li>
                  <details className="site-closing-footer-wechat" onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() } }}>
                    <summary><span>微信</span><ChevronDown size={13} aria-hidden="true" /></summary>
                    <div className="site-closing-footer-qr"><img src={wechatQr} width="160" height="160" alt="刻行时空官方微信公众号二维码" loading="lazy" /><span>微信扫码，关注刻行时空</span></div>
                  </details>
                </li>
                {socialChannels.map(label => <li key={label}>{label === 'X'
                  ? <span className="site-closing-footer-channel site-closing-footer-channel--x" role="img" aria-label="X" title="X"><SiX aria-hidden="true" /></span>
                  : <span className="site-closing-footer-channel">{label}</span>
                }</li>)}
              </ul>
            </div>
          </div>
        </div>
        <div className="site-closing-footer-bottom">
          <span>© {new Date().getFullYear()} 刻行时空</span>
          <nav aria-label="网站条款与备案">
            <a href="https://www.coscene.cn/privacy-policy" target="_blank" rel="noreferrer">隐私政策</a>
            <a href="https://www.coscene.cn/service-terms-and-technical-support" target="_blank" rel="noreferrer">服务协议</a>
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">沪ICP备2022013161号-1</a>
            <a href="https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=31010102007438" target="_blank" rel="noreferrer">沪公网安备31010102007438号</a>
          </nav>
        </div>
      </footer>
    </div>
  </section>
}
