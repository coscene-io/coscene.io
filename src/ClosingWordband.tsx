import { useEffect, useRef, useState } from 'react'
import './closing-wordband.css'

const repetitions = [0, 1, 2, 3]

export default function ClosingWordband() {
  const bandRef = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const band = bandRef.current
    if (!band || !('IntersectionObserver' in window)) return

    let isVisible = false
    const updatePlayback = () => {
      setIsActive(isVisible && document.visibilityState === 'visible')
    }
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
      updatePlayback()
    })

    observer.observe(band)
    document.addEventListener('visibilitychange', updatePlayback)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', updatePlayback)
    }
  }, [])

  return <div ref={bandRef} className="site-closing-wordband" data-paused={!isActive} aria-hidden="true">
    <div className="closing-wordband-track">
      {[0, 1].map(group => <div className="closing-wordband-group" key={group}>
        {repetitions.map(repetition => <span key={repetition}>coScene</span>)}
      </div>)}
    </div>
  </div>
}
