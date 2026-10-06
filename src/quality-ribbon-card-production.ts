import { COLOR, text, fill, line, dot, image, identity, footer, type Pen, type Images } from './quality-ribbon-card-primitives'

export function taskSteps(p: Pen, images: Images) {
  fill(p, 0, 0, 1200, 760, COLOR.paper)
  identity(p, 'C04', '任务步骤与动作定义')
  text(p, '夹取收纳盒', 48, 161, 42, COLOR.primary, 600)
  image(p, images.evidence, 48, 188, 520, 265)
  text(p, '动作类别', 48, 514, 26, COLOR.muted)
  text(p, 'pick', 226, 515, 36, COLOR.primary, 600)
  text(p, '操作对象', 48, 575, 26, COLOR.muted)
  text(p, '果蔬收纳盒', 226, 575, 34)
  text(p, '起止条件与前后步骤随记录保留', 48, 654, 27, COLOR.muted)
  const steps = ['接近冰箱', '开门', '转向台面', '夹取收纳盒', '搬运与放入', '关门']
  line(p, [[686, 175], [686, 625]], COLOR.ruleStrong, 3)
  steps.forEach((label, i) => {
    const y = 184 + i * 89
    if (i === 3) fill(p, 650, y - 43, 502, 75, COLOR.primary)
    dot(p, 686, y - 5, i === 3 ? 7 : 5, i === 3 ? COLOR.onPrimary : COLOR.primary)
    text(p, String(i + 1).padStart(2, '0'), 721, y + 7, 29, i === 3 ? COLOR.onPrimaryMuted : COLOR.muted)
    text(p, label, 792, y + 8, 35, i === 3 ? COLOR.onPrimary : COLOR.ink, i === 3 ? 600 : 500)
    if (i === 3) text(p, '当前', 1081, y + 6, 23, COLOR.onPrimary)
  })
  footer(p, 'SOP-FR v1.1', 'DEMO-FR-0084')
}

export function sceneCoverage(p: Pen, images: Images) {
  fill(p, 0, 0, 1200, 760, COLOR.paper)
  identity(p, 'C05', '采集场景与多样性设置')
  text(p, 'KITCHEN-B · 台面中央', 48, 148, 32, COLOR.primary, 600)
  image(p, images.scene, 48, 173, 556, 420)
  text(p, '较满装载 / 顶灯照明', 48, 634, 30)
  text(p, '共 240 条完整执行', 48, 676, 28, COLOR.primary, 600)

  text(p, '采集组合', 677, 151, 32, COLOR.ink, 600)
  text(p, '台面起始位置', 801, 200, 25, COLOR.muted)
  const xs = [824, 954, 1084]
  text(p, '布局', 677, 239, 25, COLOR.muted)
  xs.forEach((x, i) => text(p, String(i + 1), x + 2, 239, 25, COLOR.muted))
  ;['A', 'B', 'C', 'D'].forEach((label, i) => {
    const y = 269 + i * 68
    const tone = i === 3 ? COLOR.accent : COLOR.primary
    text(p, label, 685, y + 34, 32, tone, 600)
    xs.forEach(x => {
      fill(p, x - 28, y, 88, 47, i === 3 ? COLOR.accentSoft : COLOR.soft)
      text(p, '20', x - 4, y + 33, 30, tone, 600)
    })
  })
  text(p, '每格 20 条：2 装载 × 2 照明 × 5 次', 677, 580, 24, COLOR.muted)
  dot(p, 687, 626, 5, COLOR.primary)
  text(p, 'A/B/C 训练 180', 705, 636, 26, COLOR.primary)
  dot(p, 987, 626, 5, COLOR.accent)
  text(p, 'D 留出 60', 1005, 636, 26, COLOR.accent)
  footer(p, '4 种布局 · 3 个起始位置 · 2 种装载 · 2 种照明', '按场景隔离')
}

export function productionBatch(p: Pen) {
  fill(p, 0, 0, 1200, 760, COLOR.paper)
  identity(p, 'C07', '数据生产日期及批次')
  fill(p, 48, 138, 336, 533, COLOR.primary)
  text(p, '2026 / 08', 80, 204,  40, COLOR.onPrimaryMuted)
  text(p, '26',  70, 378, 170, COLOR.onPrimary, 500)
  text(p, '采集日期', 80, 442,  30, COLOR.onPrimaryMuted)
  line(p, [[80, 481], [352, 481]], COLOR.onPrimaryLine)
  text(p, '第 084 次执行', 80, 544, 35, COLOR.onPrimary, 600)
  text(p, '林* · COL-0**7', 80, 621, 28, COLOR.onPrimaryMuted)

  text(p, '生产批次', 438, 169, 26, COLOR.muted)
  text(p, 'BATCH-FR-20260826-A', 438, 222,  40, COLOR.primary, 600)
  line(p, [[438, 259], [1152, 259]])
  const rows = [
    ['数据记录', 'DEMO-FR-0084'], ['设备资产', 'AST-S1-DEMO-03'], ['采集场景', 'KITCHEN-B'],
  ]
  rows.forEach(([label, value], i) => {
    const y = 323 + i * 98
    text(p, label, 438, y, 27, COLOR.muted)
    text(p, value, 650, y + 1, 34, COLOR.ink, 500)
    line(p, [[438, y + 34], [1152, y + 34]])
  })
  text(p, '画面定位', 438, 615, 27, COLOR.muted)
  text(p, '10:56:38.088', 650, 615, 36, COLOR.primary, 500)
  text(p, 'UTC+8', 1037, 615, 23, COLOR.muted)
  footer(p, 'REQ-FR v1.2', 'SOP-FR v1.1')
}

export function multiView(p: Pen, images: Images) {
  fill(p, 0, 0, 1200, 760, COLOR.primary)
  identity(p, 'C08', '多视角任务回放', true)
  text(p, '头部 RGB', 48, 138, 29, COLOR.onPrimaryMuted)
  image(p, images.evidence, 48, 161, 532, 270)
  text(p, '右腕 RGB', 620, 138, 29, COLOR.onPrimaryMuted)
  image(p, images.rightWrist, 620, 161, 532, 270)
  text(p, '夹取收纳盒', 48, 509, 41, COLOR.onPrimary, 600)
  text(p, '10:56:38.088', 48, 565, 36, COLOR.onPrimary)
  text(p, '同一时刻 · 双视角对照', 48, 625, 28, COLOR.onPrimaryMuted)
  text(p, '关联视角', 710, 505, 26, COLOR.onPrimaryMuted)
  text(p, '头部 · 左腕 · 右腕', 710, 557, 33, COLOR.onPrimary)
  text(p, '状态 / 示教动作 / 场景信息', 710, 609, 26, COLOR.onPrimaryMuted)
  footer(p, 'DEMO-FR-0084', '关联动作 pick / ANN v1.1', true)
}

export function actionAnnotation(p: Pen) {
  fill(p, 0, 0, 1200, 760, COLOR.paper)
  identity(p, 'C09', '动作标注与时间区间')
  text(p, '夹起果蔬收纳盒', 48, 168, 44, COLOR.ink, 600)
  text(p, 'pick / 4.696 s', 845, 168, 37, COLOR.accent, 600)
  const intervals = [
    {name:'navigate',duration:6.007,color:COLOR.soft,time:'10:56:30.201'},
    {name:'pick',duration:4.696,color:COLOR.primary,time:'10:56:36.208'},
    {name:'rotate',duration:4.211,color:COLOR.softStrong,time:'10:56:40.904'},
  ]
  const total = 14.914, width = 1104
  let x = 48
  intervals.forEach((part, i) => {
    const w = part.duration / total * width
    line(p, [[x, 275], [x, 290]], COLOR.muted)
    text(p, part.time, x, 270, 24, COLOR.muted)
    fill(p, x, 307, w - 5, 134, part.color)
    text(p, part.name, x + 24, 357, 32, i === 1 ? COLOR.onPrimary : COLOR.ink, 600)
    text(p, `${part.duration.toFixed(3)} s`, x + 24, 411, 32, i === 1 ? COLOR.onPrimaryMuted : COLOR.muted)
    x += w
  })
  p.save(); p.textAlign = 'right'
  text(p, '结束 10:56:45.115', 1152, 501, 24, COLOR.muted); p.restore()
  line(p, [[1152, 441], [1152, 461]], COLOR.muted)
  // This cursor matches the actual 45s source frame timestamp, within pick.
  const currentX = 48 + (7.887 / total) * width
  line(p, [[currentX, 290], [currentX, 461]], COLOR.accent, 3)
  line(p, [[currentX, 307], [currentX, 441]], COLOR.onPrimaryAccent, 3)
  dot(p, currentX, 296, 6, COLOR.accent)
  p.save(); p.textAlign = 'center'
  text(p, '当前画面 10:56:38.088', currentX, 501, 27, COLOR.accent); p.restore()
  line(p, [[48, 544], [1152, 544]])
  text(p, '目标对象', 48, 593, 26, COLOR.muted)
  text(p, '果蔬收纳盒', 48, 645, 37)
  text(p, '区间规则', 667, 593, 26, COLOR.muted)
  text(p, '[start, end)', 667, 645, 37, COLOR.primary)
  text(p, '左闭右开', 940, 645, 27, COLOR.muted)
  footer(p, 'ANN v1.1', 'ANN-SPEC v1.0')
}
