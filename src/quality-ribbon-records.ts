import type { TraceCardId } from './quality-trace-card-art'

export type RecordContent = {
  id: TraceCardId
  title: string
  headline: string
  fields: { label: string; value: string }[]
}

// Indices match the approved artwork groups in quality-trace-card-art.ts.
export const RECORD_GROUPS: string[] = ['客户需求', '生产条件', '数据与质检', '交付对照']

export const RECORD_INSPECTIONS: Record<TraceCardId, {
  fields: string[]
  links: { id: TraceCardId; label: string }[]
}> = {
  C00: {
    fields: ['任务', '当前片段', '记录编号'],
    links: [{ id: 'C01', label: '训练目标' }, { id: 'C07', label: '生产批次' }],
  },
  C01: {
    fields: ['目标指令', '训练用途', '关注能力'],
    links: [{ id: 'C03', label: '验收标准' }, { id: 'C05', label: '采集场景' }],
  },
  C02: {
    fields: ['适用需求', '任务规范', '当前执行'],
    links: [{ id: 'C01', label: '训练目标' }, { id: 'C03', label: '验收标准' }],
  },
  C03: {
    fields: ['视频规格', '连续与对齐', '标注标准'],
    links: [{ id: 'C10', label: '规格检查' }, { id: 'C16', label: '交付对照' }],
  },
  C04: {
    fields: ['任务规范', '任务步骤', '动作信息'],
    links: [{ id: 'C02', label: '需求版本' }, { id: 'C09', label: '动作标注' }],
  },
  C05: {
    fields: ['本次场景', '变化维度', '集合划分'],
    links: [{ id: 'C01', label: '训练目标' }, { id: 'C07', label: '生产批次' }],
  },
  C06: {
    fields: ['机器人', '操作结构', '训练视角配置'],
    links: [{ id: 'C03', label: '验收标准' }, { id: 'C08', label: '任务回放' }],
  },
  C07: {
    fields: ['记录 / 批次', '采集日期', '场景 / 资产'],
    links: [{ id: 'C06', label: '设备配置' }, { id: 'C11', label: '处理版本' }],
  },
  C08: {
    fields: ['片段 A', '片段 B', '关联维度'],
    links: [{ id: 'C04', label: '任务步骤' }, { id: 'C12', label: '质检结果' }],
  },
  C09: {
    fields: ['pick', '标注规范', '当前文件'],
    links: [{ id: 'C04', label: '动作定义' }, { id: 'C12', label: '标注核对' }],
  },
  C10: {
    fields: ['视频规格', '连续性', '时间匹配'],
    links: [{ id: 'C03', label: '验收标准' }, { id: 'C12', label: '质检结果' }],
  },
  C11: {
    fields: ['观测数据整理', '动作标注', '交付版本'],
    links: [{ id: 'C10', label: '完整性检查' }, { id: 'C15', label: '交付清单' }],
  },
  C12: {
    fields: ['检查对象', '标注核对', '可见性说明'],
    links: [{ id: 'C03', label: '验收标准' }, { id: 'C08', label: '原始画面' }],
  },
  C15: {
    fields: ['交付版本', '对应需求', '选用版本'],
    links: [{ id: 'C12', label: '质检结果' }, { id: 'C16', label: '交付对照' }],
  },
  C16: {
    fields: ['最初需求', '当前交付', '关联记录'],
    links: [{ id: 'C03', label: '验收标准' }, { id: 'C15', label: '交付清单' }],
  },
}

export const DELIVERY_COMPARISONS: {
  label: string
  requirement: string
  result: string
  sourceId: TraceCardId
  resultId: TraceCardId
}[] = [
  {
    // C03 视频规格 → C10 视频规格.
    label: '视频帧率',
    requirement: '逐路均值 29.5–30.5 fps',
    result: '30.00 / 29.98 / 30.02 fps',
    sourceId: 'C03', resultId: 'C10',
  },
  {
    // C03 连续与对齐 → C10 连续性.
    label: '连续性',
    requirement: '最大帧间隔 ≤100 ms',
    result: '最大帧间隔 66.7 ms；关键动作区间完整',
    sourceId: 'C03', resultId: 'C10',
  },
  {
    // C03 标注标准 → C12 标注核对.
    label: '标注边界',
    requirement: '动作起止与人工参考边界偏差 ≤100 ms',
    result: '人工复核边界最大偏差 67 ms',
    sourceId: 'C03', resultId: 'C12',
  },
]
