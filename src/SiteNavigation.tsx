import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react'
import kexingWordmark from './assets/kexing-wordmark.svg'
import { SITE_ROUTES } from './site-routes'
import './site-navigation.css'

const navigationGroups = [
  {
    label: '加速训练',
    eyebrow: 'TRAINING DATA',
    title: '让真实世界行动，更快成为训练信号',
    image: '/assets/navigation/training-real-task.jpg',
    imageAlt: '机器人在真实任务环境中完成布料操作',
    imagePosition: '50% 48%',
    links: [
      { label: '真机数据', description: '来自机器人真实任务的观测、动作与状态数据', href: '/training/robot-data/#robot' },
      { label: '无本体数据', description: '覆盖预训练阶段的第一人称真实环境数据', href: '/training/robot-data/#experience' },
      { label: '数据基础设施', description: '连接采集、治理、交付与训练使用', href: '/training/robot-data/#infrastructure' },
    ],
  },
  {
    label: '数据质量',
    eyebrow: 'DATA QUALITY',
    title: '让交付结果，更接近模型训练可用',
    image: '/assets/kexing-robot-data-interface.jpg',
    imageAlt: '机器人多模态数据界面示意',
    imagePosition: '50% 50%',
    links: [
      { label: '交付保障', description: '从任务设计到数据交付的过程保障', href: '/quality/delivery/' },
      { label: '质量评估测试', description: '以评测与反馈校准数据可用性', href: '#platform' },
      { label: '数据样例', description: '查看不同场景与模态的数据样例', href: 'https://data-catalog.coscene.io/en/' },
    ],
  },
  {
    label: '关于刻行',
    eyebrow: 'ABOUT KEXING',
    title: '在真实世界，建设数据基础设施',
    image: '/assets/navigation/about-office.jpg',
    imageAlt: '人物从刻行时空办公室会议室外经过',
    imagePosition: '50% 55%',
    links: [
      { label: '我们的经营理念', description: '为物理AI提供真实世界的行动与反馈', href: `${SITE_ROUTES.about}#philosophy` },
      { label: '连接与协作', description: '连接领先者，用数据推动物理AI进化', href: `${SITE_ROUTES.about}#connection` },
      { label: '我们的团队', description: '长期专注数据，开放协作', href: `${SITE_ROUTES.about}#team` },
    ],
  },
]

const desktopMediaQuery = '(min-width: 961px)'

export function SiteNavigation({ homeHref = '', contactHref = SITE_ROUTES.contact }: { homeHref?: string; contactHref?: string } = {}) {
  const resolveHref = (href: string) => href.startsWith('#') ? `${homeHref}${href}` : href
  const navRef = useRef<HTMLElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedMenu, setExpandedMenu] = useState<number | null>(null)

  const cancelScheduledClose = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const closeNavigation = () => {
    cancelScheduledClose()
    setMobileOpen(false)
    setExpandedMenu(null)
  }

  const openDesktopMenu = (groupIndex: number) => {
    cancelScheduledClose()
    if (window.matchMedia(desktopMediaQuery).matches) setExpandedMenu(groupIndex)
  }

  const scheduleDesktopClose = () => {
    cancelScheduledClose()
    if (!window.matchMedia(desktopMediaQuery).matches) return
    closeTimerRef.current = window.setTimeout(() => {
      setExpandedMenu(null)
      closeTimerRef.current = null
    }, 120)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        setExpandedMenu(null)
      }
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMobileOpen(false)
        setExpandedMenu(null)
      }
    }
    const mediaQuery = window.matchMedia('(max-width: 960px)')
    const handleMediaChange = () => {
      setMobileOpen(false)
      setExpandedMenu(null)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    mediaQuery.addEventListener('change', handleMediaChange)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
      mediaQuery.removeEventListener('change', handleMediaChange)
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current)
      delete document.body.dataset.siteNavOpen
    }
  }, [])

  useEffect(() => {
    if (mobileOpen) document.body.dataset.siteNavOpen = 'true'
    else delete document.body.dataset.siteNavOpen
  }, [mobileOpen])

  const desktopMegaOpen = expandedMenu !== null && !mobileOpen

  return (
    <nav
      ref={navRef}
      className={`site-navigation site-navigation--fixed site-navigation--light${mobileOpen ? ' is-mobile-open' : ''}${desktopMegaOpen ? ' has-mega-open' : ''}`}
      aria-label="主要导航"
      onMouseEnter={cancelScheduledClose}
      onMouseLeave={scheduleDesktopClose}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) scheduleDesktopClose()
      }}
    >
      <a className="site-navigation__brand" href={`${homeHref}#top`} aria-label="刻行时空首页" onClick={closeNavigation}>
        <img className="site-navigation__wordmark" src={kexingWordmark} alt="刻行时空" width={144} height={35} />
      </a>

      <div className="site-navigation__content">
        <div className="site-navigation__links">
          {navigationGroups.map((group, groupIndex) => {
            const expanded = expandedMenu === groupIndex
            return (
              <div
                className={`site-navigation__item${expanded ? ' is-expanded' : ''}`}
                key={group.label}
                onMouseEnter={() => openDesktopMenu(groupIndex)}
              >
                <button
                  className="site-navigation__trigger"
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={`site-navigation-menu-${groupIndex} site-navigation-panel-${groupIndex}`}
                  onFocus={() => openDesktopMenu(groupIndex)}
                  onClick={() => {
                    if (window.matchMedia('(max-width: 960px)').matches) {
                      setExpandedMenu(expanded ? null : groupIndex)
                    } else {
                      openDesktopMenu(groupIndex)
                    }
                  }}
                >
                  <span>{group.label}</span>
                  <ChevronDown aria-hidden="true" size={14} strokeWidth={1.5} />
                </button>
                <div className="site-navigation__menu" id={`site-navigation-menu-${groupIndex}`}>
                  {group.links.map((link, linkIndex) => (
                    <a href={resolveHref(link.href)} target={link.href.startsWith('https:') ? '_blank' : undefined} rel={link.href.startsWith('https:') ? 'noreferrer' : undefined} key={link.label} onClick={closeNavigation}>
                      <span>{link.label}</span>
                      <span className="site-navigation__menu-index" aria-hidden="true">
                        {String(linkIndex + 1).padStart(2, '0')}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <a className="site-navigation__contact" href={contactHref} onClick={closeNavigation}>
          <span>联系我们</span>
          <ArrowUpRight aria-hidden="true" size={15} strokeWidth={1.5} />
        </a>
      </div>

      <div className="site-navigation__mega" id="site-navigation-mega" aria-hidden={!desktopMegaOpen}>
        {navigationGroups.map((group, groupIndex) => {
          const active = desktopMegaOpen && expandedMenu === groupIndex
          return (
            <section
              className={`site-navigation__mega-panel${active ? ' is-active' : ''}`}
              id={`site-navigation-panel-${groupIndex}`}
              key={group.label}
              aria-label={group.label}
              aria-hidden={!active}
              inert={!active}
            >
              <header className="site-navigation__mega-intro">
                <span>{group.eyebrow}</span>
                <h2>{group.title}</h2>
              </header>

              <div className="site-navigation__mega-links">
                {group.links.map((link, linkIndex) => (
                  <a href={resolveHref(link.href)} target={link.href.startsWith('https:') ? '_blank' : undefined} rel={link.href.startsWith('https:') ? 'noreferrer' : undefined} key={link.label} onClick={closeNavigation}>
                    <span className="site-navigation__mega-index" aria-hidden="true">
                      {String(linkIndex + 1).padStart(2, '0')}
                    </span>
                    <span className="site-navigation__mega-link-copy">
                      <strong>{link.label}</strong>
                      <span>{link.description}</span>
                    </span>
                    <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.35} />
                  </a>
                ))}
              </div>

              <figure className="site-navigation__mega-visual">
                <img
                  src={group.image}
                  alt={group.imageAlt}
                  style={{ objectPosition: group.imagePosition }}
                />
              </figure>
            </section>
          )
        })}
      </div>

      <button
        className="site-navigation__toggle"
        type="button"
        aria-label={mobileOpen ? '关闭导航' : '打开导航'}
        aria-expanded={mobileOpen}
        onClick={() => {
          setMobileOpen((open) => !open)
          if (mobileOpen) setExpandedMenu(null)
        }}
      >
        {mobileOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
      </button>
    </nav>
  )
}
