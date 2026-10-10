import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
const Page = /^\/training\/robot-data(?:\/(?:index\.html)?)?$/.test(window.location.pathname)
  ? lazy(() => import('./TrainingDataPage.tsx'))
  : lazy(() => import('./App.tsx'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div aria-label="页面加载中" style={{ minHeight: '100svh', background: '#f3f4f2' }} />}>
      <Page />
    </Suspense>
  </StrictMode>,
)
