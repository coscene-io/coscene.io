import { useId, useState } from 'react'
import { DataValuePointCloud } from './DataValuePointCloud'
import './data-value-cards.css'

const dataValues = [
  {
    title: '高度定制的数据配比',
    lines: ['高度定制的', '数据配比'],
    shape: 'distribution' as const,
    summary: '按本体、模型路线与训练阶段，定制任务、标签和样本配比。',
    detail: [
      '预训练、任务微调与上线前评测，各有不同的数据需求。采集任务、标注规则与样本配比，依据你的机器人本体、模型路线和研发阶段制定。',
      '结合评测口径，从物体、场景、动作阶段等维度检查数据分布。交付前，看清覆盖范围、样本偏向和待补缺口。',
    ],
  },
  {
    title: '更准确的仿真与评测',
    lines: ['更准确的', '仿真与评测'],
    shape: 'correspondence' as const,
    summary: '从真实采集重建仿真环境，拓展测试条件，比较模型表现。',
    detail: [
      'Real2Sim 根据真实采集重建场景与物体，形成对应的仿真环境。物体位置、材质与光照按需调整，覆盖更多测试条件。',
      'DataModel 分析任务成败、执行过程和异常片段，在可重复的测试中形成可比较的评测结果。数据来源、加工过程与版本清晰可追溯。',
    ],
  },
  {
    title: '失败与长尾数据的补齐构造',
    lines: ['失败与长尾数据的', '补齐构造'],
    shape: 'completion' as const,
    summary: '分析已有失败、定向补采；主动构造长尾条件，再训练、再验证。',
    detail: [
      '测试或实际任务中出现失败，先分析物体、视角、操作示范等潜在缺口，再制定针对性的补采计划。',
      '遮挡、异常摆放、操作中断等少见困难条件，主动构造并纳入评测集。补采后再训练、再验证，检查同类问题是否改善，明确下一轮数据需求。',
    ],
  },
]

function DataValueCard({ value }: { value: (typeof dataValues)[number] }) {
  const [expanded, setExpanded] = useState(false)
  const detailId = useId()
  const headingId = useId()
  return (
    <article
      className={`data-value-card${value.shape === 'completion' ? ' data-value-card--dark' : ''}${expanded ? ' is-expanded' : ''}`}
      aria-labelledby={headingId}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && expanded) {
          event.stopPropagation()
          setExpanded(false)
        }
      }}
    >
      <h3 className="data-value-card__title" id={headingId} aria-label={value.title}>
        {value.lines.map((line) => <span key={line}>{line}</span>)}
      </h3>
      <div className="data-value-card__stage">
        <div className="data-value-card__art" aria-hidden="true">
          <DataValuePointCloud shape={value.shape} paused={expanded} />
        </div>
        <div className="data-value-card__detail" id={detailId} aria-hidden={!expanded}>
          {value.detail.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </div>
      <div className="data-value-card__footer">
        <p className="data-value-card__summary">{value.summary}</p>
        <button
          className="data-value-card__toggle"
          type="button"
          aria-expanded={expanded}
          aria-controls={detailId}
          aria-label={`${expanded ? '返回图形' : '展开说明'}：${value.title}`}
          onClick={() => setExpanded(!expanded)}
        >
          <span>{expanded ? '返回图形' : '展开说明'}</span>
          <span className="data-value-card__toggle-mark" aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}

export function DataValueCards() {
  return (
    <section className="data-value-cards" aria-label="高质量数据的更多价值" id="data-value-cards">
      <div className="data-value-cards__grid">
        {dataValues.map((value) => <DataValueCard key={value.shape} value={value} />)}
      </div>
    </section>
  )
}
