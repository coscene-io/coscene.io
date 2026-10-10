import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

type RevealPhase = 'idle' | 'pending' | 'entering' | 'done'

export default function ClosingFormReveal({ children }: { children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null)
  const focusedFieldRef = useRef<HTMLElement | null>(null)
  const [phase, setPhase] = useState<RevealPhase>('idle')

  useLayoutEffect(() => {
    const frame = frameRef.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!frame || reducedMotion.matches || !('IntersectionObserver' in window)) return

    setPhase('pending')
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setPhase(current => current === 'pending' ? 'entering' : current)
      observer.disconnect()
    }, { threshold: 0.05 })
    observer.observe(frame)

    const finishForReducedMotion = () => {
      if (!reducedMotion.matches) return
      setPhase('done')
      observer.disconnect()
    }
    reducedMotion.addEventListener('change', finishForReducedMotion)
    return () => {
      observer.disconnect()
      reducedMotion.removeEventListener('change', finishForReducedMotion)
    }
  }, [])

  useLayoutEffect(() => {
    const field = focusedFieldRef.current
    if (phase !== 'done' || !field) return
    focusedFieldRef.current = null
    const bounds = field.getBoundingClientRect()
    if (bounds.top < 72 || bounds.bottom > window.innerHeight) field.scrollIntoView({ block: 'center', behavior: 'instant' })
  }, [phase])

  return <div ref={frameRef} className="site-closing-form-reveal" data-phase={phase} onFocusCapture={event => {
    if (phase === 'done') return
    focusedFieldRef.current = event.target as HTMLElement
    setPhase('done')
  }}>
    <div className="site-closing-form-reveal-motion" onAnimationEnd={event => {
      if (event.target === event.currentTarget && event.animationName === 'closing-form-extract') setPhase('done')
    }}>
      {children}
    </div>
  </div>
}
