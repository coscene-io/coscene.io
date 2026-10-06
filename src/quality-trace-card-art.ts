/** Display summaries for the approved content-v2 case. Full records live in the review board. */
export const TRACE_CARD_IDS = ['C00', 'C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09', 'C10', 'C11', 'C12', 'C15', 'C16'] as const;
export type TraceCardId = (typeof TRACE_CARD_IDS)[number];
export interface TraceCardArt {
  id: TraceCardId;
  title: string;
  group: 0 | 1 | 2 | 3;
  canvas: HTMLCanvasElement;
}

const W = 1200;
const H = 760;
const C = {
  paper: '#f5f5f1', ink: '#23282a', muted: '#626970', rule: '#cbd0d0',
  indigo: '#39418f', red: '#d24443', pale: '#e9eaf1', blue: '#bbc8e2', silver: '#e0e5e5',
};
const FONT = '"MotionGrotesque", "PingFang SC", "Microsoft YaHei", sans-serif';
const ROOT = '/assets/quality-trace/';
type Pen = CanvasRenderingContext2D;
type Images = Record<string, HTMLImageElement>;

function text(p: Pen, value: string, x: number, y: number, size = 28, color = C.ink, weight = 400, maxWidth = 1088) {
  p.fillStyle = color;
  p.font = `${weight} ${size}px ${FONT}`;
  p.textBaseline = 'alphabetic';
  const measured = p.measureText(value).width;
  if (measured > maxWidth) p.font = `${weight} ${Math.max(16, size * maxWidth / measured)}px ${FONT}`;
  p.fillText(value, x, y);
}

function line(p: Pen, x1: number, y1: number, x2: number, y2: number, color = C.rule, width = 2) {
  p.strokeStyle = color; p.lineWidth = width;
  p.beginPath(); p.moveTo(x1, y1); p.lineTo(x2, y2); p.stroke();
}

function dot(p: Pen, x: number, y: number, r: number, fill = C.indigo) {
  p.fillStyle = fill; p.beginPath(); p.arc(x, y, r, 0, Math.PI * 2); p.fill();
}

function rect(p: Pen, x: number, y: number, w: number, h: number, color: string, radius = 0) {
  p.fillStyle = color;
  if (radius) { p.beginPath(); p.roundRect(x, y, w, h, radius); p.fill(); }
  else p.fillRect(x, y, w, h);
}

function arrow(p: Pen, x1: number, y: number, x2: number, color = C.indigo) {
  line(p, x1, y, x2, y, color, 3);
  line(p, x2 - 12, y - 8, x2, y, color, 3);
  line(p, x2 - 12, y + 8, x2, y, color, 3);
}

function tick(p: Pen, x: number, y: number, color = C.indigo) {
  p.strokeStyle = color; p.lineWidth = 4; p.lineCap = 'round';
  p.beginPath(); p.moveTo(x, y); p.lineTo(x + 7, y + 7); p.lineTo(x + 22, y - 11); p.stroke();
  p.lineCap = 'butt';
}

function caption(p: Pen, left: string, right = '') {
  text(p, left, 56, 658, 25, C.muted, 400, right ? 650 : 1088);
  if (right) {
    p.font = `400 24px ${FONT}`;
    text(p, right, 1144 - p.measureText(right).width, 658, 24, C.muted);
  }
}

function photo(p: Pen, image: HTMLImageElement, x: number, y: number, width: number, height: number, background = C.silver) {
  rect(p, x, y, width, height, background, 4);
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const dw = image.naturalWidth * scale, dh = image.naturalHeight * scale;
  p.drawImage(image, x + (width - dw) / 2, y + (height - dh) / 2, dw, dh);
}

function header(p: Pen, id: TraceCardId, title: string, group: number) {
  rect(p, 0, 0, W, H, C.paper);
  text(p, title, 56, 89, 49, C.ink, 600, 985);
  text(p, id, 1079, 84, 24, C.muted, 500, 70);
  line(p, 56, 122, 1144, 122);
  line(p, 56, 695, 1144, 695);
  text(p, 'DEMO-FR-0084', 56, 734, 23, C.ink, 500);
  const groupLabels = ['客户需求', '生产条件', '数据与质检', '交付对照'];
  text(p, groupLabels[group], 928, 734, 23, C.muted, 400, 220);
}

function drawC00(p: Pen, images: Images) {
  photo(p, images.grasp, 56, 150, 1088, 456);
  // One quiet viewing marker belongs to the record, not to a playback control.
  rect(p, 78, 171, 230, 41, '#f5f5f1', 3);
  dot(p, 99, 192, 5, C.red);
  text(p, '夹取果蔬收纳盒', 116, 201, 22, C.ink, 500, 180);
  caption(p, '家庭厨房 · 果蔬存放至冰箱冷藏室', '第 084 次执行');
}

function drawC01(p: Pen) {
  text(p, '把台面上的果蔬收纳盒', 56, 204, 36, C.ink, 500);
  text(p, '放入冰箱，并关好冰箱门。', 56, 256, 36, C.ink, 500);
  const xs = [56, 457, 858];
  const stages = [['语言', '目标与对象'], ['观察', '三路视觉 + 状态'], ['动作', '连续动作监督']];
  stages.forEach((s, i) => {
    const x = xs[i];
    line(p, x, 349, x + 285, 349, i === 2 ? C.red : C.indigo, 4);
    text(p, s[0], x, 420, 48, i === 2 ? C.red : C.indigo, 500, 280);
    text(p, s[1], x, 467, 25, C.muted, 400, 285);
    if (i < 2) arrow(p, x + 306, 409, x + 370, C.muted);
  });
  text(p, '子任务衔接 / 移动与操作连续 / 初始条件变化', 56, 583, 29, C.ink);
  caption(p, '家庭移动操作 · 视觉—语言—动作适配训练');
}

function drawC02(p: Pen) {
  text(p, '家庭冰箱收纳数据采集', 56, 204, 37, C.ink, 500);
  const rows = [
    ['订单', 'ORD-DEMO-KITCHEN-0240', '08.20'],
    ['需求', 'REQ-FR v1.2', '08.21'],
    ['规范', 'SOP-FR v1.1', '适用版本'],
    ['执行', 'DEMO-FR-0084', '08.26'],
  ];
  line(p, 85, 291, 85, 563, C.indigo, 3);
  rows.forEach((r, i) => {
    const y = 295 + i * 89;
    dot(p, 85, y - 8, i === 3 ? 10 : 6, i === 3 ? C.red : C.indigo);
    text(p, r[0], 124, y, 28, C.muted, 400, 110);
    text(p, r[1], 286, y, 34, C.ink, 500, 630);
    text(p, r[2], 1000, y, 24, C.muted, 400, 144);
    if (i < 3) line(p, 124, y + 29, 1144, y + 29);
  });
  caption(p, '具身模型研发团队 A', 'PRJ-DEMO-FRIDGE');
}

function drawC03(p: Pen) {
  text(p, '30', 50, 340, 182, C.indigo, 500, 400);
  text(p, 'fps', 317, 336, 52, C.indigo, 400, 150);
  text(p, '1280 × 720', 565, 263, 67, C.ink, 500, 578);
  text(p, '头部 RGB / 左腕 RGB / 右腕 RGB', 569, 317, 28, C.muted, 400, 570);
  line(p, 56, 385, 1144, 385);
  const cells = [
    { x: 56, value: '50 Hz', label: '状态与动作监督' },
    { x: 439, value: '≤100 ms', label: '最大帧间隔' },
    { x: 822, value: '≤20 ms', label: '匹配残差 P95' },
  ];
  cells.forEach(({ x, value, label }) => {
    text(p, value, x, 496, 52, C.ink, 500, 323);
    text(p, label, x, 542, 25, C.muted, 400, 323);
  });
  caption(p, '完整任务记录 · 原始时间戳', 'REQ-FR v1.2');
}

function drawC04(p: Pen) {
  const steps = [
    ['接近冰箱', 'navigate'], ['开门', 'open'], ['转向台面', 'rotate'],
    ['夹取收纳盒', 'pick'], ['搬运与放入', 'navigate / place'], ['关门', 'close'],
  ];
  steps.forEach(([label, skill], i) => {
    const x = 56 + (i % 3) * 386, y = 199 + Math.floor(i / 3) * 221;
    text(p, String(i + 1).padStart(2, '0'), x, y + 41, 54, i === 3 ? C.red : C.indigo, 500, 100);
    line(p, x + 102, y + 21, x + 326, y + 21, C.rule, 2);
    text(p, label, x, y + 101, 34, C.ink, 500, 330);
    text(p, skill, x, y + 145, 25, C.muted, 400, 330);
  });
  caption(p, '动作对象 / 起止条件 / 前后步骤', 'SOP-FR v1.1');
}

function drawC05(p: Pen, images: Images) {
  photo(p, images.scene, 56, 157, 1088, 289);
  text(p, '4 × 3 × 2 × 2 × 5', 56, 538, 62, C.indigo, 500, 740);
  text(p, '240 条', 904, 538, 50, C.ink, 500, 240);
  text(p, '布局 / 起始位置 / 装载 / 照明 / 执行次数', 56, 588, 27, C.muted);
  caption(p, 'KITCHEN-B · 台面中央 · 较满装载 · 顶灯', '180 训练 / 60 留出');
}

function drawC06(p: Pen) {
  text(p, 'Astribot S1', 56, 220, 59, C.indigo, 500, 600);
  text(p, '绳驱双臂移动操作平台', 56, 264, 27, C.muted);
  text(p, '7 DoF / 臂', 770, 214, 40, C.ink, 500, 374);
  text(p, '5 kg / 臂额定负载', 770, 263, 27, C.muted, 400, 374);
  // This is a sensor topology, deliberately not a robot silhouette.
  const sensorY = 362;
  line(p, 235, 416, 968, 416, C.indigo, 3);
  const sensors = [
    { x: 235, label: '头部', model: 'Femto Bolt', desc: 'RGB 彩色图像' },
    { x: 601, label: '左腕', model: 'RealSense D401', desc: '局部操作视角' },
    { x: 968, label: '右腕', model: 'RealSense D401', desc: '局部操作视角' },
  ];
  sensors.forEach((s) => {
    dot(p, s.x, 416, 9, C.indigo);
    line(p, s.x, 396, s.x, sensorY + 5, C.indigo, 3);
    text(p, s.label, s.x - 45, sensorY, 29, C.ink, 500, 200);
    text(p, s.model, s.x - 152, 480, 31, C.ink, 500, 318);
    text(p, s.desc, s.x - 105, 522, 24, C.muted, 400, 290);
  });
  text(p, '辅助回看：头部双目 RGB / 胸部 Gemini 335', 56, 603, 26, C.muted);
  caption(p, '三路训练 RGB · 720p / 30 fps', 'AST-S1-DEMO-03');
}

function drawC07(p: Pen) {
  text(p, '2026.08.26', 52, 272, 103, C.indigo, 500, 1050);
  text(p, 'BATCH-FR-20260826-A', 56, 324, 32, C.ink, 500);
  line(p, 56, 367, 1144, 367);
  const rows = [['采集人员', '林* · COL-0**7'], ['设备资产', 'AST-S1-DEMO-03'], ['执行场景', 'KITCHEN-B']];
  rows.forEach(([label, value], i) => {
    const y = 429 + i * 74;
    text(p, label, 56, y, 27, C.muted, 400, 220);
    text(p, value, 303, y, 34, C.ink, 500, 840);
  });
  caption(p, '适用需求 REQ-FR v1.2', 'SOP-FR v1.1');
}

function drawC08(p: Pen, images: Images) {
  photo(p, images.multiview, 56, 150, 1088, 454, '#dce0e0');
  caption(p, '按时间同步查看多个视角', '10:56:38.088');
}

function drawC09(p: Pen) {
  text(p, '夹起果蔬收纳盒', 56, 214, 40, C.ink, 500);
  text(p, 'pick', 894, 214, 50, C.red, 500, 250);
  const start = 56, top = 317, widths = [438, 342, 308];
  const entries = [
    ['navigate', '6.007 s', C.silver], ['pick', '4.696 s', C.indigo], ['rotate', '4.211 s', C.blue],
  ];
  let x = start;
  entries.forEach(([label, duration, color], i) => {
    const width = widths[i];
    rect(p, x, top, width - 8, 120, color, 4);
    text(p, label, x + 24, top + 48, 31, i === 1 ? '#ffffff' : C.ink, 500, width - 50);
    text(p, duration, x + 24, top + 91, 25, i === 1 ? '#e5e8ff' : C.muted, 400, width - 50);
    x += width;
  });
  line(p, 56 + 438, 286, 56 + 438, 474, C.red, 3);
  text(p, '10:56:36.208', 56 + 438, 519, 33, C.ink, 500, 380);
  text(p, '起止时间 / 技能 / 目标对象 / 关联视角', 56, 593, 27, C.muted);
  caption(p, 'ANN-SPEC v1.0', 'ANN v1.1');
}

function drawC10(p: Pen) {
  text(p, '验收标准', 521, 193, 25, C.muted, 400, 245);
  text(p, '检查结果', 868, 193, 25, C.muted, 400, 276);
  const rows = [
    ['三路视频', '720p / 30 fps', '29.98–30.02 fps'],
    ['最大帧间隔', '≤100 ms', '66.7 ms'],
    ['匹配残差 P95', '≤20 ms', '16 ms'],
    ['状态 / 动作监督', '50 Hz', '50 Hz'],
    ['文件完整性', '齐备、能解析', '清单齐备'],
  ];
  rows.forEach(([label, request, result], i) => {
    const y = 267 + i * 76;
    text(p, label, 56, y, 28, C.ink, 500, 422);
    text(p, request, 521, y, 28, C.muted, 400, 316);
    text(p, result, 868, y, 28, C.indigo, 500, 277);
    if (i < rows.length - 1) line(p, 56, y + 24, 1144, y + 24);
  });
  caption(p, 'OBS v1.0 · 2026.08.27', '依据 REQ-FR v1.2');
}

function drawC11(p: Pen) {
  const stages = [
    { day: '08.26', name: '原始记录', ver: 'RAW v1.0' },
    { day: '08.27', name: '整理与标注', ver: 'OBS v1.0 + ANN v1.1' },
    { day: '08.28', name: '质量检查', ver: 'QC-FR-0084 r1' },
    { day: '08.30', name: '交付版本', ver: 'DATASET v1.0' },
  ];
  line(p, 75, 200, 75, 545, C.indigo, 3);
  stages.forEach((s, i) => {
    const y = 217 + i * 109;
    dot(p, 75, y - 10, i === 3 ? 10 : 6, i === 3 ? C.red : C.indigo);
    text(p, s.day, 115, y, 33, C.muted, 400, 163);
    text(p, s.name, 310, y, 33, C.ink, 500, 315);
    text(p, s.ver, 675, y, 32, i === 3 ? C.indigo : C.ink, 500, 470);
  });
  caption(p, '原始时间戳 / 处理参数 / 版本记录', 'PIPE-FR v1.0');
}

function drawC12(p: Pen, images: Images) {
  photo(p, images.proof, 56, 154, 1088, 289);
  text(p, '关键动作检查', 56, 510, 34, C.ink, 500);
  text(p, '夹取 / 放入', 807, 510, 28, C.indigo, 500, 338);
  text(p, '局部遮挡，结合其他视角查看', 56, 563, 28, C.muted);
  text(p, '标注边界偏差 67 ms', 807, 563, 28, C.ink, 400, 338);
  caption(p, 'QC-FR-0084 r1 · 周*', 'OBS v1.0 + ANN v1.1');
}

function drawC15(p: Pen) {
  text(p, 'DATASET v1.0', 56, 228, 64, C.indigo, 500, 760);
  text(p, '240 条', 925, 220, 46, C.ink, 500, 219);
  text(p, '180 训练 / 60 留出', 854, 261, 24, C.muted, 400, 290);
  const rows = [
    ['视频', 'head_rgb / left_wrist_rgb / right_wrist_rgb'],
    ['状态与动作', 'state.parquet / action.parquet'],
    ['标注与元信息', 'annotation_v1.1.json / metadata.json'],
    ['质量报告', 'qc_r1.json / 关键片段索引'],
    ['交付清单', 'manifest.json / splits.json / checksums.sha256'],
  ];
  rows.forEach(([type, files], i) => {
    const y = 340 + i * 61;
    text(p, type, 56, y, 24, C.muted, 500, 256);
    text(p, files, 346, y, 27, C.ink, 400, 800);
    if (i < rows.length - 1) line(p, 346, y + 21, 1144, y + 21);
  });
  caption(p, 'REQ-FR v1.2', '2026.08.30');
}

function drawC16(p: Pen) {
  text(p, 'REQ-FR v1.2', 56, 217, 45, C.ink, 500, 453);
  arrow(p, 516, 200, 667, C.red);
  text(p, 'DATASET v1.0', 729, 217, 45, C.indigo, 500, 415);
  const rows = [
    ['视频规格', '三路 720p / 30 fps', 'video/ + metadata'],
    ['连续与对齐', '完整执行 / 50 Hz 监督', 'state + action + QC'],
    ['步骤与对象', '时间区间标注', 'ANN v1.1'],
    ['场景覆盖', '240 条 / 4 种布局', 'coverage + splits'],
  ];
  rows.forEach(([label, requirement, delivery], i) => {
    const y = 332 + i * 83;
    text(p, label, 56, y, 27, C.muted, 400, 235);
    text(p, requirement, 292, y, 31, C.ink, 500, 430);
    tick(p, 763, y - 9);
    text(p, delivery, 822, y, 28, C.indigo, 400, 324);
    if (i < rows.length - 1) line(p, 56, y + 28, 1144, y + 28);
  });
  caption(p, '规格、连续性、标注与场景覆盖逐项核对');
}

const SPECS: Array<{ id: TraceCardId; title: string; group: 0 | 1 | 2 | 3; draw: (p: Pen, images: Images) => void }> = [
  { id: 'C00', title: '任务名称及介绍', group: 2, draw: drawC00 },
  { id: 'C01', title: '训练目标与用途', group: 0, draw: drawC01 },
  { id: 'C02', title: '客户需求与版本', group: 0, draw: drawC02 },
  { id: 'C03', title: '数据规格与验收标准', group: 0, draw: drawC03 },
  { id: 'C04', title: '任务步骤与动作定义', group: 1, draw: drawC04 },
  { id: 'C05', title: '采集场景与多样性设置', group: 1, draw: drawC05 },
  { id: 'C06', title: '机器人型号与传感器配置', group: 1, draw: drawC06 },
  { id: 'C07', title: '数据生产日期及批次', group: 1, draw: drawC07 },
  { id: 'C08', title: '多视角任务回放', group: 2, draw: drawC08 },
  { id: 'C09', title: '动作标注与时间区间', group: 2, draw: drawC09 },
  { id: 'C10', title: '数据连续性与完整性检查', group: 2, draw: drawC10 },
  { id: 'C11', title: '数据处理与版本记录', group: 2, draw: drawC11 },
  { id: 'C12', title: '质检结果与原始画面', group: 2, draw: drawC12 },
  { id: 'C15', title: '交付文件与版本清单', group: 3, draw: drawC15 },
  { id: 'C16', title: '客户要求与交付结果', group: 3, draw: drawC16 },
];

export const TRACE_CARD_METADATA = SPECS.map(({ id, title, group }) => ({ id, title, group }));

async function loadImage(filename: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = 'async';
  return new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`无法加载追溯卡片素材：${ROOT}${filename}`));
    image.src = ROOT + filename;
  });
}

export async function createTraceCardArt(): Promise<TraceCardArt[]> {
  const [grasp, scene, multiview, proof] = await Promise.all([
    loadImage('grasp-head-45.png'), loadImage('scene-pair.png'),
    loadImage('multiview-45.png'), loadImage('proof-pair.png'),
  ]);
  const images: Images = { grasp, scene, multiview, proof };
  return SPECS.map(({ id, title, group, draw }) => {
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const p = canvas.getContext('2d', { alpha: false });
    if (!p) throw new Error(`无法创建追溯卡片画布：${id}`);
    p.imageSmoothingEnabled = true;
    p.imageSmoothingQuality = 'high';
    header(p, id, title, group);
    draw(p, images);
    return { id, title, group, canvas };
  });
}
