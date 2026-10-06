import { COLOR, text, fill, line, dot, image, identity, footer, type Pen, type Images } from './quality-ribbon-card-primitives'

/** Customer instruction and the three parts of the supplied VLA training goal. */
export function trainingGoal(p: Pen, images: Images) {
  fill(p, 0, 0, 1200, 760, COLOR.paper)
  identity(p, 'C01', '训练目标与用途')

  text(p, '把台面上的果蔬收纳盒', 48, 191, 51, COLOR.primary, 600)
  text(p, '放入冰箱，并关好冰箱门', 48, 259, 51, COLOR.primary, 600)
  text(p, '已有基础策略的任务示教适配', 48, 321, 32, COLOR.ink)
  text(p, '另留完整场景用于后续验证', 48, 366, 29, COLOR.muted)
  image(p, images.evidence, 790, 132, 362, 216)
  text(p, '当前任务画面', 790, 379, 26, COLOR.muted)

  // These are semantic relationships, not a fabricated model or progress chart.
  fill(p, 48, 414, 1104, 265, COLOR.primary)
  const stages = [
    { x: 72, title: '语言', lines: ['指令与目标物对应'], color: COLOR.onPrimary },
    { x: 439, title: '观察', lines: ['完整场景', '初始条件变化'], color: COLOR.onPrimary },
    { x: 807, title: '动作', lines: ['子任务衔接', '移动与操作连续'], color: COLOR.onPrimaryAccent },
  ]
  stages.forEach(stage => {
    text(p, stage.title, stage.x, 481, 44, stage.color, 600)
    stage.lines.forEach((value, index) => text(p, value, stage.x, 551 + index * 49, 32, COLOR.onPrimaryMuted))
  })
  for (const x of [351, 718]) {
    line(p, [[x, 466], [x + 40, 466]], COLOR.onPrimaryLine, 2.5)
    line(p, [[x + 30, 456], [x + 40, 466], [x + 30, 476]], COLOR.onPrimaryLine, 2.5)
  }
  footer(p, '面向家庭移动操作的视觉—语言—动作路线', '客户训练目标')
}

/** A requirement version anchors the order, operating specification and execution. */
export function customerRequirement(p: Pen, _images: Images) {
  fill(p, 0, 0, 1200, 760, COLOR.silver)
  identity(p, 'C02', '客户需求与版本')

  text(p, 'REQ-FR v1.2', 48, 220, 82, COLOR.primary, 600)
  text(p, '适用需求', 52, 268, 30, COLOR.muted)
  line(p, [[741, 149], [741, 271]], COLOR.rule, 2)
  text(p, '2026-08-21', 787, 203, 46, COLOR.ink, 600)
  dot(p, 795, 251, 6, COLOR.accent)
  text(p, '生效', 817, 261, 30, COLOR.accent, 600)

  line(p, [[48, 314], [1152, 314]])
  text(p, '具身模型研发团队 A', 48, 381, 43, COLOR.ink, 600)
  text(p, 'PRJ-DEMO-FRIDGE', 48, 428, 32, COLOR.muted)

  // Literal document lineage; node spacing does not encode dates or duration.
  const orderX = 56, specificationX = 566, executionX = 895
  line(p, [[orderX, 499], [executionX, 499]], COLOR.ruleStrong, 3)
  dot(p, orderX, 499, 7, COLOR.primary)
  dot(p, specificationX, 499, 7, COLOR.primary)
  dot(p, executionX, 499, 8, COLOR.accent)
  text(p, '订单', 48, 550, 29, COLOR.muted)
  text(p, '任务规范', 552, 550, 29, COLOR.muted)
  text(p, '当前执行', 881, 550, 29, COLOR.muted)
  text(p, 'ORD-DEMO-KITCHEN-0240', 48, 601, 31, COLOR.ink, 600)
  text(p, 'SOP-FR v1.1', 552, 601, 33, COLOR.ink, 600)
  text(p, 'DEMO-FR-0084', 881, 601, 31, COLOR.primary, 600)
  footer(p, '客户需求与适用版本', 'REQ-FR v1.2')
}

/** Three real acquisition streams and the exact supplied acceptance thresholds. */
export function acceptanceSpec(p: Pen, _images: Images) {
  fill(p, 0, 0, 1200, 760, COLOR.paper)
  identity(p, 'C03', '数据规格与验收标准')

  const streams = [
    { x: 48, key: 'H', title: '头部 RGB' },
    { x: 426, key: 'L', title: '左腕 RGB' },
    { x: 804, key: 'R', title: '右腕 RGB' },
  ]
  streams.forEach(stream => {
    text(p, stream.key, stream.x, 142, 27, COLOR.primary, 600)
    text(p, stream.title, stream.x + 44, 144, 34, COLOR.ink, 600)
    // An exact 16:9 image-format diagram, not a stand-in for a camera image.
    const x = stream.x + 22, y = 164, w = 304, h = 171
    fill(p, x, y, w, h, COLOR.soft)
    line(p, [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], COLOR.ruleStrong, 1.5)
    p.save(); p.textAlign = 'center'
    text(p, '1280 × 720', x + w / 2, 240, 37, COLOR.primary, 600)
    text(p, 'RGB 彩色图像', x + w / 2, 289, 26, COLOR.muted)
    p.restore()
  })

  fill(p, 48, 363, 1104, 110, COLOR.primary)
  text(p, '三路彩色图像 / 30 fps', 72, 409, 40, COLOR.onPrimary, 600)
  text(p, '逐路均值 29.5–30.5 fps', 72, 449, 29, COLOR.onPrimaryMuted)
  line(p, [[738, 382], [738, 452]], COLOR.onPrimaryLine, 2)
  text(p, '监督序列 50 Hz', 770, 407, 37, COLOR.onPrimary, 600)
  text(p, '关节 · 夹爪 · 躯干 · 底盘', 770, 442, 25, COLOR.onPrimaryMuted)
  text(p, '记录字段及单位', 770, 466, 22, COLOR.onPrimaryMuted)

  const thresholds = [
    { x: 48, title: '最大帧间隔', limit: '≤100 ms', note: '完整执行无剪断' },
    { x: 426, title: '时间戳残差 P95', limit: '≤20 ms', note: '观测匹配' },
    { x: 804, title: '动作起止边界偏差', limit: '≤100 ms', note: '对照人工参考' },
  ]
  thresholds.forEach(item => {
    text(p, item.title, item.x, 530, 29, COLOR.muted)
    text(p, item.limit, item.x, 591, 47, COLOR.primary, 600)
    text(p, item.note, item.x, 640, 29, COLOR.ink)
  })
  footer(p, 'ANN-SPEC v1.0', '240 条完整执行 · 180 训练 / 60 留出 · 按场景隔离')
}
