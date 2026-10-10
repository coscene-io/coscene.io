import { useEffect, useRef, useState } from 'react'

const keywords = ['真实环境', '长尾场景', '多样性', '泛化能力', '鲁棒性', '数据飞轮']
const heading = keywords.join('、')

export default function AboutTeamMarquee() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [pageVisible, setPageVisible] = useState(() =>
    typeof document === 'undefined' || !document.hidden,
  )

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting)
    })
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(preference.matches)
    const updateVisibility = () => setPageVisible(!document.hidden)

    observer.observe(root)
    preference.addEventListener('change', updatePreference)
    document.addEventListener('visibilitychange', updateVisibility)

    return () => {
      observer.disconnect()
      preference.removeEventListener('change', updatePreference)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])

  const running = !reducedMotion && inView && pageVisible

  return <div
    ref={rootRef}
    className="about-people-marquee"
    data-running={running}
    data-reduced-motion={reducedMotion}
  >
    <h2 id="team-heading" aria-label={heading}>
      <span className="about-people-marquee-track" aria-hidden="true">
        {[0, 1].map(group => <span className="about-people-marquee-group" key={group}>
          {keywords.map(keyword => <span key={keyword}>{keyword}</span>)}
        </span>)}
      </span>
    </h2>
  </div>
}
