import {
  COLOR, text, fill, line, dot, identity, footer, type Pen, type Images,
} from './quality-ribbon-card-primitives'
import { DELIVERY_COMPARISONS } from './quality-ribbon-records'

function rightText(p: Pen, value: string, x: number, y: number, size: number,
  color: string = COLOR.muted, weight = 500) {
  p.save()
  p.textAlign = 'right'
  text(p, value, x, y, size, color, weight)
  p.restore()
}

function arrow(p: Pen, points: number[][], color: string = COLOR.primary, width = 3) {
  line(p, points, color, width)
  const end = points[points.length - 1]
  const previous = points[points.length - 2]
  const angle = Math.atan2(end[1] - previous[1], end[0] - previous[0])
  const length = 10
  line(p, [
    [end[0] - Math.cos(angle - 0.55) * length, end[1] - Math.sin(angle - 0.55) * length],
    end,
    [end[0] - Math.cos(angle + 0.55) * length, end[1] - Math.sin(angle + 0.55) * length],
  ], color, width)
}

// These are literal zero-to-limit scales, not fabricated samples over time.
function threshold(p: Pen, x: number, y: number, width: number, measured: number,
  maximum: number) {
  fill(p, x, y, width, 8, COLOR.softStrong)
  fill(p, x, y, width * measured / maximum, 8, COLOR.primary)
  dot(p, x + width * measured / maximum, y + 4, 7, COLOR.primary)
  line(p, [[x + width, y - 9], [x + width, y + 17]], COLOR.accent, 3)
  text(p, '0', x, y + 45, 26, COLOR.muted)
  rightText(p, `${maximum} ms`, x + width, y + 45, 26, COLOR.muted)
}

export function integrityCheck(p: Pen, _images: Images) {
  fill(p, 0, 0, 1200, 760, COLOR.paper)
  identity(p, 'C10', '数据连续性与完整性检查')
  text(p, '三路 RGB · 1280×720', 48, 140, 30, COLOR.muted)
  rightText(p, '逐路均值要求 29.5–30.5 fps', 1152, 140, 30)

  const views = [
    { x: 48, name: '头部 RGB', value: '30.00' },
    { x: 428, name: '左腕 RGB', value: '29.98' },
    { x: 808, name: '右腕 RGB', value: '30.02' },
  ]
  views.forEach(({ x, name, value }) => {
    text(p, name, x, 207, 30, COLOR.ink, 600)
    text(p, value, x - 2, 291, 77, COLOR.primary)
    text(p, 'fps', x + 247, 286, 32, COLOR.muted)
  })
  line(p, [[398, 181], [398, 307]])
  line(p, [[778, 181], [778, 307]])
  line(p, [[48, 339], [1152, 339]])

  text(p, '最大帧间隔', 48, 389, 32, COLOR.ink, 600)
  text(p, '66.7', 45, 473, 78, COLOR.primary)
  text(p, 'ms', 218, 468, 34, COLOR.primary)
  rightText(p, '要求 ≤100 ms', 555, 463, 30, COLOR.ink)
  threshold(p, 48, 504, 507, 66.7, 100)
  text(p, '关键动作区间完整', 48, 589, 29, COLOR.muted)

  line(p, [[603, 371], [603, 596]])
  text(p, 'P95 时间戳残差', 651, 389, 32, COLOR.ink, 600)
  text(p, '16', 648, 473, 78, COLOR.primary)
  text(p, 'ms', 753, 468, 34, COLOR.primary)
  rightText(p, '要求 ≤20 ms', 1152, 463, 30, COLOR.ink)
  threshold(p, 651, 504, 501, 16, 20)
  text(p, '50 Hz 监督时刻匹配最近图像', 651, 589, 28, COLOR.muted)

  line(p, [[48, 620], [1152, 620]])
  dot(p, 56, 659, 6, COLOR.primary)
  text(p, '文件齐备，可解码 / 解析', 78, 669, 30, COLOR.ink, 600)
  rightText(p, '视频 ×3 · state · action · 元信息', 1152, 669, 28)
  footer(p, 'DEMO-FR-0084 · OBS v1.0', 'REQ-FR v1.2 · PIPE-FR v1.0')
}

export function versionHistory(p: Pen, _images: Images) {
  fill(p, 0, 0, 1200, 760, COLOR.silver)
  identity(p, 'C11', '数据处理与版本记录')
  text(p, 'DEMO-FR-0084', 48, 138, 30, COLOR.muted)
  rightText(p, '原始记录 → 并行整理 → 汇合交付', 1152, 138, 28)

  // OBS and ANN share the same RAW source. Neither is drawn as the other's input.
  line(p, [[265, 370], [300, 370], [300, 241]], COLOR.primary, 3)
  arrow(p, [[300, 241], [333, 241]])
  line(p, [[300, 370], [300, 481]], COLOR.primary, 3)
  arrow(p, [[300, 481], [333, 481]])
  dot(p, 300, 370, 5, COLOR.primary)
  line(p, [[656, 241], [704, 241], [704, 266]], COLOR.primary, 3)
  line(p, [[656, 481], [704, 481], [704, 266]], COLOR.primary, 3)
  arrow(p, [[704, 266], [737, 266]])
  dot(p, 704, 266, 5, COLOR.primary)
  arrow(p, [[934, 347], [934, 417]])

  text(p, '原始记录', 48, 325, 30, COLOR.muted)
  text(p, 'RAW v1.0', 48, 381, 39, COLOR.ink, 600)
  text(p, '2026-08-26', 48, 425, 28, COLOR.muted)

  text(p, '观测数据整理', 354, 199, 30, COLOR.muted)
  text(p, 'OBS v1.0', 354, 255, 43, COLOR.primary, 600)
  text(p, '2026-08-27', 354, 298, 28, COLOR.muted)
  text(p, 'PIPE-FR v1.0', 354, 338, 29, COLOR.ink)

  text(p, '动作标注', 354, 439, 30, COLOR.muted)
  text(p, 'ANN v1.1', 354, 495, 43, COLOR.primary, 600)
  text(p, '2026-08-27', 354, 538, 28, COLOR.muted)
  text(p, 'ANN-SPEC v1.0', 354, 578, 29, COLOR.ink)

  dot(p, 762, 217, 5, COLOR.accent)
  text(p, '质量记录', 781, 227, 30, COLOR.accent, 600)
  text(p, 'QC-FR-0084 r1', 754, 282, 35, COLOR.ink, 600)
  text(p, '2026-08-28', 754, 325, 28, COLOR.muted)

  text(p, '交付版本', 754, 467, 30, COLOR.muted)
  text(p, 'DATASET v1.0', 754, 522, 43, COLOR.primary, 600)
  text(p, '2026-08-30', 754, 565, 28, COLOR.muted)

  line(p, [[48, 610], [1152, 610]])
  text(p, 'ADAPTER-FR v0.1', 48, 651, 31, COLOR.ink, 600)
  text(p, '模型适配', 48, 685, 26, COLOR.muted)
  text(p, '224×224 等比缩放留边', 478, 651, 31, COLOR.ink)
  text(p, '三路视角与状态 / 动作映射', 478, 685, 26, COLOR.muted)
  footer(p, '版本来源 / C11', '完整性检查 C10 → 交付清单 C15')
}

export function deliveryManifest(p: Pen, _images: Images) {
  fill(p, 0, 0, 1200, 760, COLOR.primary)
  identity(p, 'C15', '交付文件与版本清单', true)
  text(p, 'DATASET v1.0', 48, 163, 49, COLOR.onPrimary, 600)
  text(p, '2026-08-30', 48, 206, 30, COLOR.onPrimaryMuted)

  const files = [
    { y: 275, name: 'manifest.json', purpose: '数据记录与选用版本' },
    { y: 363, name: 'splits.json', purpose: '训练 / 留出划分' },
    { y: 451, name: 'coverage.csv', purpose: '场景覆盖清单' },
    { y: 539, name: 'checksums.sha256', purpose: '文件校验清单' },
  ]
  line(p, [[61, 238], [61, 539]], COLOR.onPrimaryLine, 2)
  files.forEach(({ y, name, purpose }) => {
    line(p, [[61, y], [91, y]], COLOR.onPrimaryLine, 2)
    dot(p, 61, y, 4, COLOR.onPrimaryLine)
    text(p, name, 112, y + 11, 34, COLOR.onPrimary, 500)
    text(p, purpose, 112, y + 45, 28, COLOR.onPrimaryMuted)
  })

  line(p, [[630, 131], [630, 586]], COLOR.onPrimaryLine)
  text(p, '批次总量', 680, 158, 30, COLOR.onPrimaryMuted)
  text(p, '240', 674, 284, 132, COLOR.onPrimary)
  text(p, '条完整执行', 941, 277, 30, COLOR.onPrimaryMuted)

  text(p, '训练', 680, 342, 30, COLOR.onPrimaryMuted)
  text(p, '180', 676, 408, 67, COLOR.onPrimary)
  text(p, '留出', 977, 342, 30, COLOR.onPrimaryAccent)
  text(p, '60', 973, 408, 67, COLOR.onPrimary)
  // The 3:1 division is the actual 180 / 60 split of the 240-record batch.
  fill(p, 680, 436, 354, 10, COLOR.onPrimaryMuted)
  fill(p, 1034, 436, 118, 10, COLOR.onPrimaryAccent)
  line(p, [[1034, 436], [1034, 446]], COLOR.primary, 3)

  text(p, '本条记录 / train', 680, 498, 28, COLOR.onPrimaryMuted)
  text(p, 'DEMO-FR-0084', 680, 545, 38, COLOR.onPrimary, 600)
  text(p, 'KITCHEN-B', 680, 584, 28, COLOR.onPrimaryMuted)

  line(p, [[48, 610], [1152, 610]], COLOR.onPrimaryLine)
  text(p, '选用版本', 48, 662, 29, COLOR.onPrimaryMuted)
  text(p, 'OBS v1.0 / ANN v1.1 / QC-FR-0084 r1', 227, 662, 33, COLOR.onPrimary)
  footer(p, 'REQ-FR v1.2', 'ORD-DEMO-KITCHEN-0240', true)
}

export function requirementMatch(p: Pen, _images: Images) {
  fill(p, 0, 0, 1200, 760, COLOR.paper)
  identity(p, 'C16', '客户要求与交付结果')
  fill(p, 624, 116, 528, 568, COLOR.silver)
  text(p, '最初需求', 48, 148, 28, COLOR.muted)
  text(p, 'REQ-FR v1.2', 48, 195, 42, COLOR.ink, 600)
  text(p, '当前交付', 650, 148, 28, COLOR.muted)
  text(p, 'DATASET v1.0', 650, 195, 42, COLOR.primary, 600)
  line(p, [[48, 217], [1152, 217]])

  const [frameRate, continuity, boundary] = DELIVERY_COMPARISONS
  const rows = [
    { item: frameRate, y: 263, arrowY: 307 },
    { item: continuity, y: 397, arrowY: 446 },
    { item: boundary, y: 561, arrowY: 648 },
  ]
  rows.forEach(({ item, y, arrowY }) => {
    text(p, `${item.label} · ${item.sourceId}`, 48, y, 29, COLOR.muted)
    text(p, `对应结果 · ${item.resultId}`, 650, y, 29, COLOR.muted)
    arrow(p, [[583, arrowY], [613, arrowY]], COLOR.primary, 2)
  })

  text(p, frameRate.requirement, 48, 312, 33, COLOR.ink, 600)
  text(p, frameRate.result, 650, 312, 33, COLOR.primary, 600)
  line(p, [[48, 351], [1152, 351]])

  text(p, continuity.requirement, 48, 447, 34, COLOR.ink, 600)
  const [interval, completeActions] = continuity.result.split('；')
  text(p, interval, 650, 447, 34, COLOR.primary, 600)
  text(p, completeActions, 650, 488, 28, COLOR.muted)
  line(p, [[48, 516], [1152, 516]])

  const [boundaryReference, boundaryLimit] = boundary.requirement.split('偏差 ')
  text(p, boundaryReference, 48, 608, 30, COLOR.ink)
  text(p, `偏差 ${boundaryLimit}`, 48, 658, 36, COLOR.ink, 600)
  const [boundaryDescription, boundaryValue, boundaryUnit] = boundary.result.split(' ')
  text(p, boundaryDescription, 650, 608, 30, COLOR.ink)
  text(p, boundaryValue, 647, 663, 58, COLOR.primary)
  text(p, boundaryUnit, 728, 659, 33, COLOR.primary)

  footer(p, 'DEMO-FR-0084', 'QC-FR-0084 r1')
}
