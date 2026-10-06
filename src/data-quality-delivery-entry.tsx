import { createRoot } from 'react-dom/client'
import { SiteNavigation } from './SiteNavigation'
import DataQualityRibbon from './data-quality-ribbon'
import './data-quality-ribbon-document.css'
import './data-quality-site.css'

const root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root')!)
if (import.meta.hot) import.meta.hot.data.root = root
root.render(<div className="quality-delivery-site">
  <a className="quality-delivery-skip" href="/quality/delivery/records/">阅读全部任务记录</a>
  <SiteNavigation homeHref="/" contactHref="mailto:hello@kexing.space" />
  <DataQualityRibbon journey />
</div>)
