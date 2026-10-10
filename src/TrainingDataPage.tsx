import { useEffect } from 'react'
import { SiteNavigation } from './SiteNavigation'
import EgoDataStudy from './ego-data-study'
import './training-data-site.css'

export default function TrainingDataPage() {
  useEffect(() => {
    let frame = 0
    let observer: MutationObserver | null = null
    const alignHash = () => {
      observer?.disconnect()
      observer = null
      cancelAnimationFrame(frame)
      const hash = window.location.hash.slice(1)
      if (!hash) return
      const align = () => {
        const target = document.getElementById(hash)
        if (!target) return false
        frame = requestAnimationFrame(() => {
          target.scrollIntoView({ block: 'start', behavior: 'instant' })
        })
        return true
      }
      if (align()) return
      // Gallery data and the miniature load independently of the page shell.
      observer = new MutationObserver(() => {
        if (!align()) return
        observer?.disconnect()
        observer = null
      })
      observer.observe(document.getElementById('root')!, { childList: true, subtree: true })
    }
    alignHash()
    window.addEventListener('hashchange', alignHash)
    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener('hashchange', alignHash)
    }
  }, [])

  return <div className="training-data-site">
    <SiteNavigation homeHref="/" />
    <EgoDataStudy />
  </div>
}
