import { TRACE_CARD_METADATA, type TraceCardArt, type TraceCardId } from './quality-trace-card-art'
import { drawTaskMedia } from './quality-ribbon-card-layout'
import { COLOR, text, fill, line, dot, image, identity, footer, type Pen, type Images } from './quality-ribbon-card-primitives'
import { trainingGoal, customerRequirement, acceptanceSpec } from './quality-ribbon-card-requirements'
import { taskSteps, sceneCoverage, productionBatch, multiView, actionAnnotation } from './quality-ribbon-card-production'
import { integrityCheck, versionHistory, deliveryManifest, requirementMatch } from './quality-ribbon-card-delivery'

// Ribbon-specific faces; the original shared artwork remains intact for the storyboard.

function task(p: Pen, images: Images) {
  fill(p, 0, 0, 1200, 760, COLOR.primary)
  text(p, '果蔬存放至冰箱冷藏室', 48, 68, 53, COLOR.onPrimary, 600)
  text(p, '家庭厨房 · 第 084 次执行', 48, 109, 27, COLOR.onPrimaryMuted)
  p.save(); p.textAlign = 'right'
  text(p, 'DEMO-FR-0084', 1152, 60, 28, COLOR.onPrimary)
  text(p, 'C00 / 任务回放', 1152, 103, 24, COLOR.onPrimaryMuted)
  p.restore()
  drawTaskMedia(p, images.grasp, images.grasp.naturalWidth, images.grasp.naturalHeight)
  // Task stages, not a fabricated playback/production progress indicator.
  const labels = ['开门', '夹取', '搬运', '放入', '关门']
  labels.forEach((label, index) => {
    const x = 70 + index * 222
    dot(p, x, 723, index === 1 ? 7 : 4, index === 1 ? COLOR.onPrimaryAccent : COLOR.onPrimaryLine)
    text(p, label, x + 22, 733, 29, index === 1 ? COLOR.onPrimary : COLOR.onPrimaryMuted, index === 1 ? 600 : 400)
    if (index < 4) line(p, [[x + 113, 723], [x + 184, 723]], COLOR.onPrimaryLine, 2)
    if (index === 1) fill(p, x - 8, 689, 117, 3, COLOR.onPrimaryAccent)
  })
}

function sensorMarker(p: Pen, letter: string, x: number, y: number, labelX: number, labelY: number) {
  p.strokeStyle = COLOR.primary; p.lineWidth = 2.5
  p.beginPath(); p.arc(x, y, 17, 0, Math.PI * 2); p.stroke()
  const end = labelX < x ? labelX + 16 : labelX - 16
  line(p, [[x + (labelX < x ? -17 : 17), y], [end, labelY]], COLOR.primary, 2)
  fill(p, labelX - 16, labelY - 16, 32, 32, COLOR.primary)
  p.save(); p.textAlign = 'center'; text(p, letter, labelX, labelY + 9, 24, COLOR.onPrimary, 600); p.restore()
}
function equipment(p: Pen, images: Images) {
  fill(p, 0, 0, 1200, 760, COLOR.silver)
  identity(p, 'C06', '机器人与采集视角')
  text(p, 'Astribot S1', 48, 149, 58, COLOR.primary, 600)
  text(p, '绳驱双臂移动操作平台', 698, 145, 29, COLOR.muted)
  image(p, images.robot, 44, 174, 582, 520)
  // H/L/R are acquisition-view keys. Left/right follow the robot's own frame.
  sensorMarker(p, 'H', 334, 219, 501, 223)
  sensorMarker(p, 'L', 525, 585, 609, 603)
  sensorMarker(p, 'R', 156, 585, 70, 603)
  fill(p, 674, 187, 478, 93, COLOR.soft)
  text(p, '三路训练 RGB', 698, 228, 30, COLOR.primary, 600)
  text(p, '720p / 30 fps', 698, 265, 28, COLOR.muted)
  text(p, 'H', 698, 332, 27, COLOR.primary, 600)
  text(p, '头部 RGB', 749, 332, 35, COLOR.ink, 600)
  text(p, 'Orbbec Femto Bolt', 749, 370, 28, COLOR.muted)
  line(p, [[698, 396], [1152, 396]])
  text(p, 'L / R', 698, 446, 24, COLOR.primary, 600)
  text(p, '左右腕 RGB', 784, 446, 35, COLOR.ink, 600)
  text(p, 'Intel RealSense D401 × 2', 698, 487, 28, COLOR.muted)
  line(p, [[698, 517], [1152, 517]])
  text(p, '辅助视角', 698, 561, 25, COLOR.muted)
  text(p, '头部双目 / 胸部 RGB-D', 698, 603, 30, COLOR.ink)
  text(p, '胸部：Orbbec Gemini 335', 698, 643, 26, COLOR.muted)
  footer(p, 'AST-S1-DEMO-03', '单臂 7 DoF · 平举额定负载 5 kg / 臂')
}

function quality(p: Pen, images: Images) {
  fill(p, 0, 0, 1200, 760, COLOR.paper)
  identity(p, 'C12', '质检结果与原始画面')
  text(p, '头部 RGB / 片段 A', 48, 133, 25, COLOR.muted)
  text(p, '头部 RGB / 片段 B', 620, 133, 25, COLOR.muted)
  image(p, images.evidence, 48, 154, 532, 270)
  image(p, images.place, 620, 154, 532, 270)
  dot(p, 58, 459, 5, COLOR.accent); dot(p, 630, 459, 5, COLOR.accent)
  text(p, '夹取收纳盒', 78, 471, 32, COLOR.ink, 600)
  text(p, '放入冰箱', 650, 471, 32, COLOR.ink, 600)
  line(p, [[48, 516], [1152, 516]])
  text(p, '标注边界最大偏差', 48, 576, 26, COLOR.muted)
  text(p, '67', 44, 665, 95, COLOR.primary, 500)
  text(p, 'ms', 170, 663, 35, COLOR.primary, 400)
  text(p, '要求 ≤100 ms', 335, 576, 29, COLOR.ink, 500)
  // Measured boundary deviation and its agreed limit share a literal 0–100 ms scale.
  fill(p, 337, 603, 326, 9, COLOR.softStrong)
  fill(p, 337, 603, 326 * .67, 9, COLOR.primary)
  dot(p, 337 + 326 * .67, 607.5, 7, COLOR.primary)
  line(p, [[663, 597], [663, 619]], COLOR.muted, 2)
  text(p, '人工复核 · ANN v1.1', 335, 659, 25, COLOR.muted)
  line(p, [[735, 559], [735, 671]])
  text(p, '局部遮挡', 783, 578, 30, COLOR.accent, 600)
  text(p, '结合其他视角查看', 783, 622, 28, COLOR.ink)
  text(p, '保留说明与证据索引', 783, 660, 26, COLOR.muted)
  footer(p, 'QC-FR-0084 r1', '检查依据 REQ-FR v1.2')
}

async function load(filename: string) {
  const result = new Image(); result.decoding = 'async'
  result.src = `/assets/quality-trace/${filename}`
  await result.decode(); return result
}

export async function createRibbonCardArt(): Promise<TraceCardArt[]> {
  const [grasp, robot, evidence, place, rightWrist, scene] = await Promise.all([
    load('grasp-head-45.png'), load('ribbon/astribot-s1-front.webp'),
    load('ribbon/grasp-evidence.webp'), load('ribbon/place-evidence.webp'),
    load('ribbon/right-wrist-45.webp'), load('ribbon/kitchen-scene.webp'),
  ])
  const images = { grasp, robot, evidence, place, rightWrist, scene }
  const finishes: Record<TraceCardId, (p: Pen, images: Images) => void> = {
    C00: task, C01: trainingGoal, C02: customerRequirement, C03: acceptanceSpec,
    C04: taskSteps, C05: sceneCoverage, C06: equipment, C07: productionBatch,
    C08: multiView, C09: actionAnnotation, C10: integrityCheck, C11: versionHistory,
    C12: quality, C15: deliveryManifest, C16: requirementMatch,
  }
  return TRACE_CARD_METADATA.map(meta => {
    const canvas = document.createElement('canvas')
    canvas.width = 1200; canvas.height = 760
    const p = canvas.getContext('2d', { alpha: false })
    if (!p) throw new Error(`无法创建卡面：${meta.id}`)
    p.imageSmoothingEnabled = true; p.imageSmoothingQuality = 'high'
    finishes[meta.id](p, images)
    return { ...meta, canvas }
  })
}
