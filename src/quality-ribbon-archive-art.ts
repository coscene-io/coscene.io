import type { TraceCardArt, TraceCardId } from './quality-trace-card-art'
import { COLOR, text, fill, line, dot, type Pen } from './quality-ribbon-card-primitives'
import { TASK_MEDIA_VIEW } from './quality-ribbon-card-layout'

// Summary faces are authored for the archive's actual projected size. The
// inspection keeps the full record; each exposed top strip names its record.
const TITLES: Record<TraceCardId, string> = {
  C00: '果蔬存放至冰箱冷藏室', C01: '训练目标', C02: '需求版本',
  C03: '验收标准', C04: '任务步骤', C05: '场景与多样性',
  C06: '机器人与采集视角', C07: '生产日期与批次', C08: '多视角回放',
  C09: '动作标注', C10: '连续性与完整性', C11: '处理与版本记录',
  C12: '质检结果', C15: '交付文件', C16: '交付对照',
}

function rule(p: Pen, y: number) {
  line(p, [[56, y], [1144, y]], COLOR.ruleStrong, 3)
}

/** Reuse the corresponding real media pane, without resampling its small text. */
function media(p: Pen, art: TraceCardArt, source: number[], destination: number[]) {
  p.drawImage(art.canvas, source[0], source[1], source[2], source[3],
    destination[0], destination[1], destination[2], destination[3])
}

function task(p: Pen, art: TraceCardArt) {
  const view = TASK_MEDIA_VIEW
  // Same media crop and aspect as the inspection face. No extra task copy.
  media(p, art, [view.x, view.y, view.width, view.height], [56, 170, 1088, 523])
}

function training(p: Pen) {
  text(p, '家庭移动操作', 56, 262, 82, COLOR.primary, 600)
  text(p, '任务示教适配 · 保留场景验证', 56, 349, 52)
  fill(p, 56, 412, 1088, 258, COLOR.primary)
  const labels = [['语言', '指令与目标物'], ['观察', '场景与初始条件'], ['动作', '子任务连续衔接']]
  labels.forEach(([label, detail], i) => {
    const x = 82 + i * 362
    text(p, label, x, 495, 65, COLOR.onPrimary, 600)
    text(p, detail, x, 594, 48, COLOR.onPrimaryMuted)
  })
}

function requirement(p: Pen) {
  text(p, 'REQ-FR v1.2', 56, 280, 98, COLOR.primary, 600)
  text(p, '2026-08-21 生效', 56, 369, 52)
  rule(p, 418)
  text(p, '具身模型研发团队 A', 56, 513, 57)
  text(p, '任务规范', 56, 630, 50, COLOR.muted)
  text(p, 'SOP-FR v1.1', 432, 632, 65, COLOR.primary, 600)
}

function acceptance(p: Pen) {
  text(p, '头部 / 左腕 / 右腕 RGB', 56, 217, 51, COLOR.muted)
  fill(p, 56, 256, 1088, 168, COLOR.primary)
  text(p, '720p / 30 fps', 85, 365, 92, COLOR.onPrimary, 600)
  text(p, '最大帧间隔', 56, 508, 49, COLOR.muted)
  text(p, 'P95 时间戳残差', 635, 508, 49, COLOR.muted)
  text(p, '≤100 ms', 56, 598, 81, COLOR.primary, 600)
  text(p, '≤20 ms', 635, 598, 81, COLOR.primary, 600)
  text(p, '动作边界偏差 ≤100 ms', 56, 695, 51)
}

function steps(p: Pen) {
  const labels = ['接近冰箱', '开门', '转向台面', '夹取收纳盒', '搬运与放入', '关门']
  labels.forEach((label, i) => {
    const x = i < 3 ? 56 : 630, y = 255 + (i % 3) * 165
    text(p, String(i + 1).padStart(2, '0'), x, y, 51, COLOR.muted)
    text(p, label, x + 102, y, 57, i === 3 ? COLOR.primary : COLOR.ink, 600)
    line(p, [[x, y + 47], [x + 514, y + 47]], COLOR.ruleStrong, 3)
  })
}

function scene(p: Pen, art: TraceCardArt) {
  media(p, art, [48, 173, 556, 420], [56, 183, 518, 391])
  text(p, '4 种布局', 630, 254, 58, COLOR.primary, 600)
  text(p, '3 个起始位置', 630, 349, 52)
  text(p, '2 种装载', 630, 444, 52)
  text(p, '2 种照明', 630, 539, 52)
  text(p, '训练 180 / 留出 60', 56, 681, 66, COLOR.primary, 600)
}

function equipment(p: Pen, art: TraceCardArt) {
  media(p, art, [44, 174, 582, 520], [56, 175, 553, 494])
  text(p, 'Astribot S1', 648, 252, 65, COLOR.primary, 600)
  text(p, '绳驱双臂', 648, 356, 56)
  text(p, '头部 + 左右腕', 648, 461, 50)
  text(p, '三路 RGB', 648, 546, 60, COLOR.primary, 600)
  text(p, '720p / 30 fps', 648, 631, 50)
}

function batch(p: Pen) {
  fill(p, 56, 174, 352, 514, COLOR.primary)
  text(p, '2026 / 08', 83, 259, 54, COLOR.onPrimaryMuted)
  text(p, '26', 79, 461, 190, COLOR.onPrimary, 500)
  text(p, '采集日期', 85, 554, 51, COLOR.onPrimaryMuted)
  text(p, '第 084 次', 85, 644, 51, COLOR.onPrimary, 600)
  text(p, '采集场景', 470, 238, 49, COLOR.muted)
  text(p, 'KITCHEN-B', 470, 319, 64, COLOR.primary, 600)
  text(p, '生产批次', 470, 414, 49, COLOR.muted)
  text(p, 'BATCH-FR-', 470, 494, 56)
  text(p, '20260826-A', 470, 565, 56)
  text(p, '林* · COL-0**7', 470, 666, 48, COLOR.muted)
}

function views(p: Pen, art: TraceCardArt) {
  text(p, '头部 RGB', 56, 214, 52)
  text(p, '右腕 RGB', 632, 214, 52)
  media(p, art, [48, 161, 532, 270], [56, 255, 512, 260])
  media(p, art, [620, 161, 532, 270], [632, 255, 512, 260])
  text(p, '同一时刻 · 双视角对照', 56, 605, 61, COLOR.primary, 600)
  text(p, '10:56:38.088', 56, 693, 58, COLOR.muted)
}

function annotation(p: Pen) {
  text(p, '夹起果蔬收纳盒', 56, 259, 68, COLOR.primary, 600)
  text(p, 'pick / 4.696 s', 56, 351, 66, COLOR.accent, 600)
  const parts = [{ name: 'navigate', length: 6.007 }, { name: 'pick', length: 4.696 }, { name: 'rotate', length: 4.211 }]
  let x = 56
  parts.forEach((part, i) => {
    const w = 1088 * part.length / 14.914
    fill(p, x, 415, w - 5, 121, i === 1 ? COLOR.primary : COLOR.softStrong)
    text(p, part.name, x + 22, 492, 48, i === 1 ? COLOR.onPrimary : COLOR.ink, 600)
    x += w
  })
  text(p, 'ANN v1.1', 56, 666, 56)
  text(p, '[start, end)', 667, 666, 56, COLOR.muted)
}

function integrity(p: Pen) {
  text(p, '最大帧间隔', 56, 235, 52, COLOR.muted)
  text(p, 'P95 时间戳残差', 632, 235, 49, COLOR.muted)
  text(p, '66.7 ms', 56, 347, 91, COLOR.primary, 600)
  text(p, '16 ms', 632, 347, 91, COLOR.primary, 600)
  rule(p, 405)
  text(p, '三路视频、状态与动作齐备', 56, 500, 61)
  text(p, '关键动作区间完整', 56, 602, 61)
  text(p, '文件可解码 / 解析', 56, 693, 51, COLOR.muted)
}

function versions(p: Pen) {
  text(p, 'RAW v1.0', 56, 247, 71, COLOR.primary, 600)
  text(p, '原始记录', 632, 247, 54, COLOR.muted)
  rule(p, 288)
  text(p, 'OBS v1.0 + ANN v1.1', 56, 385, 67)
  text(p, '观测整理与动作标注', 56, 458, 52, COLOR.muted)
  rule(p, 504)
  text(p, 'DATASET v1.0', 56, 609, 80, COLOR.primary, 600)
  text(p, '2026-08-30 交付', 56, 691, 51, COLOR.muted)
}

function quality(p: Pen, art: TraceCardArt) {
  media(p, art, [48, 154, 532, 270], [56, 179, 520, 264])
  media(p, art, [620, 154, 532, 270], [624, 179, 520, 264])
  text(p, '夹取', 56, 498, 49)
  text(p, '放入', 624, 498, 49)
  text(p, '67 ms', 56, 604, 100, COLOR.primary, 600)
  text(p, '边界偏差', 610, 562, 48, COLOR.muted)
  text(p, '要求 ≤100 ms', 610, 625, 51)
  dot(p, 64, 690, 7, COLOR.accent)
  text(p, '局部遮挡，结合其他视角查看', 86, 708, 49)
}

function manifest(p: Pen) {
  text(p, 'DATASET v1.0', 56, 254, 84, COLOR.primary, 600)
  text(p, '240 条完整执行', 56, 350, 67)
  rule(p, 400)
  const files = [['manifest.json', '记录与版本'], ['splits.json', '训练与留出'],
    ['coverage.csv', '场景覆盖'], ['checksums.sha256', '文件校验']]
  files.forEach(([file, purpose], i) => {
    const y = 469 + i * 75
    text(p, file, 56, y, 49)
    text(p, purpose, 855, y, 49, COLOR.muted)
  })
}

function comparison(p: Pen) {
  text(p, '客户要求', 56, 228, 57)
  text(p, '交付结果', 649, 228, 57, COLOR.primary)
  rule(p, 274)
  const rows = [['最大帧间隔', '≤100 ms', '66.7 ms'], ['标注边界偏差', '≤100 ms', '67 ms']]
  rows.forEach(([label, requirement, result], i) => {
    const y = 365 + i * 211
    text(p, label, 56, y, 51, COLOR.muted)
    text(p, requirement, 56, y + 87, 71)
    text(p, result, 649, y + 87, 80, COLOR.primary, 600)
    line(p, [[535, y + 59], [584, y + 59]], COLOR.ruleStrong, 4)
    line(p, [[572, y + 48], [584, y + 59], [572, y + 70]], COLOR.ruleStrong, 4)
  })
}

const DRAW: Record<TraceCardId, (p: Pen, art: TraceCardArt) => void> = {
  C00: task, C01: training, C02: requirement, C03: acceptance, C04: steps,
  C05: scene, C06: equipment, C07: batch, C08: views, C09: annotation,
  C10: integrity, C11: versions, C12: quality, C15: manifest, C16: comparison,
}

function compactFace(p: Pen, art: TraceCardArt) {
  if (art.id === 'C00') { task(p, art); return }
  if (art.id === 'C03') {
    text(p, '三路 RGB', 56, 264, 102, COLOR.primary, 600)
    fill(p, 56, 307, 1088, 155, COLOR.primary)
    text(p, '720p / 30 fps', 83, 419, 100, COLOR.onPrimary, 600)
    text(p, '帧间隔', 56, 566, 83, COLOR.muted)
    text(p, 'P95 对齐', 639, 566, 83, COLOR.muted)
    text(p, '≤100 ms', 56, 683, 96, COLOR.primary, 600)
    text(p, '≤20 ms', 639, 683, 96, COLOR.primary, 600)
    return
  }
  if (art.id === 'C07') {
    text(p, '2026.08.26', 56, 292, 132, COLOR.primary, 600)
    text(p, 'KITCHEN-B', 56, 434, 110)
    rule(p, 480)
    text(p, 'BATCH-FR-', 56, 587, 99, COLOR.muted)
    text(p, '20260826-A', 56, 705, 105)
    return
  }
  if (art.id === 'C12') {
    media(p, art, [48, 154, 532, 270], [56, 182, 520, 264])
    media(p, art, [620, 154, 532, 270], [624, 182, 520, 264])
    text(p, '67 ms', 56, 560, 128, COLOR.primary, 600)
    text(p, '边界偏差', 644, 557, 86, COLOR.muted)
    text(p, '要求 ≤100 ms', 56, 649, 89)
    text(p, '局部遮挡，需多视角复核', 56, 729, 84, COLOR.muted)
    return
  }
  // Covered records retain their large exposed title and a short factual
  // summary, rather than a shrunken copy of the inspection's detailed layout.
  const summaries: Partial<Record<TraceCardId, string[]>> = {
    C01: ['家庭移动操作', '任务示教适配', '保留场景验证'],
    C02: ['REQ-FR v1.2', '2026-08-21 生效', 'SOP-FR v1.1'],
    C04: ['夹取收纳盒', '搬运与放入', 'SOP-FR v1.1'],
    C05: ['4 种厨房布局', '180 训练', '60 场景留出'],
    C06: ['Astribot S1', '头部 + 左右腕', '三路训练 RGB'],
    C08: ['头部 / 右腕 RGB', '同一时刻对照', '10:56:38.088'],
    C09: ['夹起果蔬收纳盒', 'pick / 4.696 s', 'ANN v1.1'],
    C10: ['帧间隔 66.7 ms', 'P95 残差 16 ms', '文件齐备可读取'],
    C11: ['RAW v1.0', 'OBS + ANN', 'DATASET v1.0'],
    C15: ['DATASET v1.0', '240 条完整执行', '记录、场景与校验'],
    C16: ['要求 ≤100 ms', '帧间隔 66.7 ms', '标注偏差 67 ms'],
  }
  summaries[art.id]?.forEach((value, index) => {
    text(p, value, 56, 300 + index * 167, 96, index === 0 ? COLOR.primary : COLOR.ink, index === 0 ? 600 : 500)
  })
}

export function createArchiveCardCanvas(art: TraceCardArt, canvas = document.createElement('canvas'), compact = false): HTMLCanvasElement {
  canvas.width = 1200; canvas.height = 760
  const p = canvas.getContext('2d', { alpha: false })
  if (!p) throw new Error(`无法创建归档卡面：${art.id}`)
  p.imageSmoothingEnabled = true; p.imageSmoothingQuality = 'high'
  fill(p, 0, 0, 1200, 760, COLOR.paper)
  text(p, TITLES[art.id], 56, compact ? 126 : 111, compact ? 96 : 64, COLOR.ink, 600)
  if (compact) compactFace(p, art)
  else DRAW[art.id](p, art)
  return canvas
}
