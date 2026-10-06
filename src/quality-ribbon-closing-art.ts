import type { TraceCardArt, TraceCardId } from './quality-trace-card-art'
import { COLOR, FONT, fill, text, type Pen } from './quality-ribbon-card-primitives'
import { TASK_MEDIA_VIEW } from './quality-ribbon-card-layout'

// The final composition shows every face at once. Give each record a few
// large facts instead of reducing the inspection layout to unreadable type.
const TITLES: Record<TraceCardId, string> = {
  C00: '果蔬存放至冰箱冷藏室', C01: '训练目标', C02: '需求版本',
  C03: '验收标准', C04: '任务步骤', C05: '场景与多样性',
  C06: '机器人与采集视角', C07: '生产日期与批次', C08: '多视角回放',
  C09: '动作标注', C10: '连续性与完整性', C11: '处理与版本记录',
  C12: '质检结果', C15: '交付文件', C16: '交付对照',
}

function fitText(p: Pen, value: string, x: number, y: number, size: number,
  color: string = COLOR.ink, weight = 600, width = 1088) {
  p.font = `${weight} ${size}px ${FONT}`
  const measured = p.measureText(value).width
  text(p, value, x, y, measured > width ? size * width / measured : size, color, weight)
}

type Rect = readonly [number, number, number, number]
function media(p: Pen, art: TraceCardArt, source: Rect, destination: Rect) {
  p.drawImage(art.canvas, source[0], source[1], source[2], source[3],
    destination[0], destination[1], destination[2], destination[3])
}

const DRAW: Record<TraceCardId, (p: Pen, art: TraceCardArt) => void> = {
  C00(p, art) {
    const v = TASK_MEDIA_VIEW
    media(p, art, [v.x, v.y, v.width, v.height], [56, 190, 1088, 523])
  },
  C01(p) {
    fitText(p, '家庭移动操作', 56, 321, 152, COLOR.primary)
    fill(p, 56, 390, 1088, 318, COLOR.primary)
    fitText(p, '任务示教适配', 88, 517, 100, COLOR.onPrimary, 600, 1024)
    fitText(p, '保留场景验证', 88, 661, 100, COLOR.onPrimary, 500, 1024)
  },
  C02(p) {
    fitText(p, 'REQ-FR v1.2', 56, 327, 156, COLOR.primary)
    fitText(p, '2026-08-21 生效', 56, 486, 96, COLOR.ink, 500)
    fill(p, 56, 550, 1088, 158, COLOR.primary)
    fitText(p, 'SOP-FR v1.1', 88, 662, 100, COLOR.onPrimary, 600, 1024)
  },
  C03(p) {
    fitText(p, '三路 RGB', 56, 266, 100)
    fill(p, 56, 310, 1088, 184, COLOR.primary)
    fitText(p, '720p / 30 fps', 88, 442, 148, COLOR.onPrimary, 600, 1024)
    fitText(p, '帧间隔', 56, 581, 96, COLOR.ink, 500, 504)
    fitText(p, 'P95 对齐', 632, 581, 96, COLOR.ink, 500, 512)
    fitText(p, '≤100 ms', 56, 704, 144, COLOR.primary, 600, 504)
    fitText(p, '≤20 ms', 632, 704, 144, COLOR.primary, 600, 512)
  },
  C04(p) {
    fitText(p, '夹取收纳盒', 56, 330, 156, COLOR.primary)
    fitText(p, '搬运与放入', 56, 510, 144)
    fitText(p, 'SOP-FR v1.1', 56, 688, 100, COLOR.ink, 500)
  },
  C05(p) {
    fitText(p, '4 种厨房布局', 56, 322, 152, COLOR.primary)
    fill(p, 56, 391, 1088, 317, COLOR.primary)
    fitText(p, '180 训练', 88, 534, 152, COLOR.onPrimary, 600, 1024)
    fitText(p, '60 场景留出', 88, 665, 100, COLOR.onPrimary, 500, 1024)
  },
  C06(p, art) {
    media(p, art, [44, 174, 582, 520], [56, 196, 470, 420])
    fitText(p, 'Astribot', 580, 323, 144, COLOR.primary, 600, 564)
    fitText(p, 'S1', 580, 474, 160, COLOR.primary, 600, 564)
    fitText(p, '三路 RGB', 580, 594, 100, COLOR.ink, 500, 564)
    fitText(p, '绳驱双臂 · 头部与双腕', 56, 706, 96, COLOR.ink, 500)
  },
  C07(p) {
    fill(p, 56, 193, 480, 515, COLOR.primary)
    fitText(p, '2026.08', 88, 301, 96, COLOR.onPrimary, 500, 416)
    fitText(p, '26', 79, 540, 248, COLOR.onPrimary, 600, 430)
    fitText(p, '采集日期', 88, 667, 96, COLOR.onPrimary, 500, 416)
    fitText(p, '生产批次', 594, 285, 96, COLOR.ink, 500, 550)
    fitText(p, 'BATCH-FR-', 594, 437, 100, COLOR.primary, 600, 550)
    fitText(p, '20260826-A', 594, 565, 100, COLOR.primary, 600, 550)
    fitText(p, '第 084 次', 594, 696, 96, COLOR.ink, 500, 550)
  },
  C08(p, art) {
    fitText(p, '头部 RGB', 56, 259, 96, COLOR.ink, 500, 520)
    fitText(p, '右腕 RGB', 624, 259, 96, COLOR.ink, 500, 520)
    media(p, art, [48, 161, 532, 270], [56, 297, 520, 264])
    media(p, art, [620, 161, 532, 270], [624, 297, 520, 264])
    fitText(p, '同一时刻对照', 56, 708, 144, COLOR.primary)
  },
  C09(p) {
    fitText(p, '夹起果蔬收纳盒', 56, 320, 152, COLOR.primary)
    fill(p, 56, 391, 1088, 184, COLOR.primary)
    fitText(p, 'pick / 4.696 s', 88, 528, 148, COLOR.onPrimary, 600, 1024)
    fitText(p, 'ANN v1.1', 56, 701, 100, COLOR.ink, 500)
  },
  C10(p) {
    fitText(p, '最大帧间隔', 56, 278, 100, COLOR.ink, 500)
    fitText(p, '66.7 ms', 56, 449, 156, COLOR.primary)
    fill(p, 56, 526, 1088, 182, COLOR.primary)
    fitText(p, '关键动作区间完整', 88, 653, 100, COLOR.onPrimary, 600, 1024)
  },
  C11(p) {
    fitText(p, 'RAW v1.0', 56, 319, 152, COLOR.primary)
    fitText(p, 'OBS + ANN', 56, 488, 100, COLOR.ink, 500)
    fitText(p, 'DATASET v1.0', 56, 690, 148, COLOR.primary)
  },
  C12(p, art) {
    media(p, art, [48, 154, 532, 270], [56, 199, 520, 264])
    media(p, art, [620, 154, 532, 270], [624, 199, 520, 264])
    fitText(p, '67 ms', 56, 672, 156, COLOR.primary, 600, 504)
    fitText(p, '边界偏差', 624, 579, 96, COLOR.ink, 500, 520)
    fitText(p, '要求 ≤100 ms', 624, 704, 96, COLOR.ink, 500, 520)
  },
  C15(p) {
    fitText(p, 'DATASET v1.0', 56, 321, 150, COLOR.primary)
    fill(p, 56, 399, 1088, 186, COLOR.primary)
    fitText(p, '240', 88, 541, 156, COLOR.onPrimary, 600, 310)
    fitText(p, '条完整执行', 431, 536, 100, COLOR.onPrimary, 500, 680)
    fitText(p, '记录、场景与校验', 56, 703, 96, COLOR.ink, 500)
  },
  C16(p) {
    fitText(p, '≤100 ms', 56, 326, 156, COLOR.primary, 600, 564)
    fitText(p, '客户要求', 672, 315, 100, COLOR.ink, 500, 472)
    fitText(p, '66.7 ms', 56, 514, 156, COLOR.primary, 600, 564)
    fitText(p, '帧间隔', 672, 501, 100, COLOR.ink, 500, 472)
    fitText(p, '67 ms', 56, 706, 156, COLOR.primary, 600, 564)
    fitText(p, '标注偏差', 672, 694, 100, COLOR.ink, 500, 472)
  },
}

export function createClosingCardCanvas(art: TraceCardArt): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 1200; canvas.height = 760
  const p = canvas.getContext('2d', { alpha: false })
  if (!p) throw new Error(`无法创建收尾卡面：${art.id}`)
  p.imageSmoothingEnabled = true; p.imageSmoothingQuality = 'high'
  fill(p, 0, 0, 1200, 760, COLOR.paper)
  fitText(p, TITLES[art.id], 56, 139, 116)
  DRAW[art.id](p, art)
  return canvas
}
