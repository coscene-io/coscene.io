import { ArrowDown } from 'lucide-react'
import { DataValueCards } from './DataValueCards'
import { DataValueFluid } from './DataValueFluid'
import SiteClosingSection from './SiteClosingSection'
import './data-value-ending.css'

export function DataValueEnding({ handoff = false }: { handoff?: boolean }) {
  return <div className={`data-value-ending${handoff ? ' data-value-ending--handoff' : ''}`}>
    <div className="data-value-hero-track">
    <section className="data-value-hero" id="data-value" aria-labelledby="data-value-heading">
      <div className="data-value-hero__material"><DataValueFluid /></div>
      <div className="data-value-hero__shade" aria-hidden="true" />
      <div className="data-value-hero__copy">
        <h2 id="data-value-heading" lang="en">
          <span>HIGH-QUALITY DATA.</span>
          <span>VALUE THAT GOES FURTHER.</span>
        </h2>
        <a className="data-value-hero__explore" href="#data-value-capabilities">
          <span className="data-value-hero__arrow"><ArrowDown size={19} strokeWidth={1.6} aria-hidden="true" /></span>
          探索数据价值
        </a>
      </div>
    </section>
    </div>

    <section className="data-value-capabilities" id="data-value-capabilities" aria-label="数据的三项延伸价值">
      <DataValueCards />
    </section>

    <SiteClosingSection variant="ink" priority="cooperation" />
  </div>
}
