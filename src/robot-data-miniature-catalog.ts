export type WorkSceneId = 'garage' | 'warehouse' | 'workcell'
export type OutdoorSceneId = 'cleanup' | 'garden' | 'popup'
export type SceneId = 'kitchen' | 'living' | 'bedroom' | 'bathroom' | 'retail' | 'checkout' | 'cafe' | 'laundry' | 'care' | 'sushi' | 'produce' | 'office' | WorkSceneId | OutdoorSceneId
export type RobotId = 'g1' | 'h2' | 's1' | 'luna'
export type HandConfiguration = 'wuji' | 'reference'
export const GRAPHIC_TONES = [
  { id: 'orange', name: '信号橙' },
  { id: 'red', name: '朱红' },
  { id: 'cobalt', name: '钴蓝' },
  { id: 'lime', name: '酸橙绿' },
] as const
export type GraphicTone = typeof GRAPHIC_TONES[number]['id']
export const HAND_CONFIGURATIONS = [
  { id: 'wuji', name: '舞肌灵巧手' },
  { id: 'reference', name: '厂商参考配置' },
] as const
const collectionRobots: RobotId[] = ['g1', 'h2', 's1', 'luna']
export type Vec3 = [number, number, number]
export type SceneDefinition = {
  id: SceneId; name: string; zone: string; index: string; task: string; value: string
  position: Vec3; width: number; depth: number; robot: RobotId; robots: RobotId[]
  robotPosition: Vec3; target: Vec3; camera: Vec3
  siteDistrict?: 'north'
  environment?: 'outdoor'
}

export const SCENES: SceneDefinition[] = [
  { id: 'kitchen', name: '厨房', zone: '家居', index: '01', task: '杯具整理', value: '从接近台面到杯具归位，记录完整的操作过程。', position: [-8, 0, 5.1], width: 5.4, depth: 4.5, robot: 'g1', robots: collectionRobots, robotPosition: [-1.1, 0, .15], target: [-.58, .94, .05], camera: [.8, 1.95, 3.25] },
  { id: 'living', name: '客厅', zone: '家居', index: '02', task: '桌面归置', value: '低处取物与站位调整，连接移动和操作的连续经验。', position: [-1.6, 0, 5.1], width: 4.8, depth: 4.5, robot: 'g1', robots: collectionRobots, robotPosition: [-.95, 0, .38], target: [-.25, .8, .15], camera: [2.9, 2.9, 5.1] },
  { id: 'bedroom', name: '卧室', zone: '家居', index: '03', task: '床边收纳', value: '在床、边柜与收纳筐之间，组织不同高度的取放任务。', position: [-8, 0, -1.55], width: 5.4, depth: 5.2, robot: 'g1', robots: collectionRobots, robotPosition: [1.25, 0, .28], target: [.3, .85, 0], camera: [3, 3.3, 6.2] },
  { id: 'bathroom', name: '洗漱空间', zone: '家居', index: '04', task: '用品整理', value: '不同形状、材质和摆放位置，构成可重复变化的操作条件。', position: [-1.6, 0, -1.55], width: 4.6, depth: 5.2, robot: 'g1', robots: collectionRobots, robotPosition: [-.6, 0, .1], target: [0, .92, -.25], camera: [2.4, 3.2, 6] },
  { id: 'retail', name: '商品货架', zone: '零售', index: '05', task: '分层取放', value: '改变货位和可达高度，覆盖身体姿态与抓放位置的变化。', position: [5.55, 0, -1.95], width: 5.6, depth: 4.4, robot: 'h2', robots: collectionRobots, robotPosition: [-.75, 0, .1], target: [0, 1.1, -.45], camera: [2.5, 2.8, 5.5] },
  { id: 'checkout', name: '收银区', zone: '零售', index: '06', task: '商品转移', value: '从待结商品到扫描、装袋，保留物体转移与操作顺序。', position: [5.1, 0, 5.1], width: 4.7, depth: 4.5, robot: 'g1', robots: collectionRobots, robotPosition: [-.9, 0, .1], target: [0, .95, .2], camera: [3.3, 2.8, 5.5] },
  { id: 'cafe', name: '咖啡餐饮', zone: '餐饮', index: '07', task: '杯盘归整', value: '双臂分工与连续衔接，让物体状态变化成为任务的一部分。', position: [12.5, 0, 5.1], width: 5.8, depth: 4.5, robot: 's1', robots: collectionRobots, robotPosition: [-.65, 0, .35], target: [.1, 1, .05], camera: [3.8, 3.4, 6] },
  { id: 'laundry', name: '商业洗衣房', zone: '专业服务', index: '08', task: '布草分拣', value: '分拣、洗烘与洁净周转各有位置，连接布草处理的前后环节。', position: [12.7, 0, -1.25], width: 6.2, depth: 5.8, robot: 's1', robots: collectionRobots, robotPosition: [-.8, 0, .25], target: [.1, .98, 0], camera: [2.2, 2.5, 4.8] },
  { id: 'garage', name: '家庭车库', zone: '居住与车库', index: '09', task: '庭院用品准备与归位', value: '从家庭收纳到庭院活动，连接不同用品的取用、准备和回收。', position: [-6.3, 0, -12.65], siteDistrict: 'north', width: 7.6, depth: 6.6, robot: 'g1', robots: collectionRobots, robotPosition: [-1.45, 0, .1], target: [0, .95, 0], camera: [6.3, 5.9, 9.2] },
  { id: 'warehouse', name: '物流仓储', zone: '物流', index: '10', task: '订单拣配与移交', value: '保留来货、分区、包装和出库之间的对象对应与顺序。', position: [2.55, 0, -12.65], siteDistrict: 'north', width: 7.6, depth: 6.6, robot: 'luna', robots: collectionRobots, robotPosition: [-1.45, 0, .15], target: [0, 1, 0], camera: [6, 6.2, 9.3] },
  { id: 'workcell', name: '精密装配区', zone: '工业', index: '11', task: '线束装配与紧固', value: '连接器对位、布线固定与螺钉紧固，将接触过程和装配结果连在一起。', position: [11.4, 0, -12.65], siteDistrict: 'north', width: 7.6, depth: 6.6, robot: 'h2', robots: collectionRobots, robotPosition: [-1.45, 0, .05], target: [0, 1, 0], camera: [6, 6, 9.3] },
  { id: 'care', name: '康养物资服务', zone: '专业服务', index: '12', task: '床旁补给与回收', value: '按床位备齐用品，再衔接配送、摆放与回收。', position: [-15.15, 0, -12.65], siteDistrict: 'north', width: 7.6, depth: 6.6, robot: 's1', robots: collectionRobots, robotPosition: [2.35, 0, -1.23], target: [0, .95, -.05], camera: [5.4, 6.5, 9.8] },
  { id: 'sushi', name: '回转寿司店', zone: '餐饮', index: '13', task: '配盘出餐与前场服务', value: '后厨与前场相连，让配盘、补给和餐具回收保留各自的对象与去向。', position: [21.05, 0, -12.65], siteDistrict: 'north', width: 9.2, depth: 6.6, robot: 's1', robots: collectionRobots, robotPosition: [-1.9, 0, -1.36], target: [0, .9, 0], camera: [6.8, 7.1, 10.6] },
  { id: 'produce', name: '生鲜果蔬', zone: '零售', index: '14', task: '果蔬分拣与补货', value: '形状、品类与货位共同进入分拣和补货的连续任务。', position: [20.85, 0, -1.25], width: 7.6, depth: 5.8, robot: 'g1', robots: collectionRobots, robotPosition: [-1.6, 0, -1.03], target: [0, .9, 0], camera: [5.4, 6.2, 9.3] },
  { id: 'office', name: '开放式办公室', zone: '办公', index: '15', task: '文件处理与工位复位', value: '连接办公设备、文件流转与桌面整理，保留共享空间中的操作上下文。', position: [21.45, 0, 6.65], width: 8.8, depth: 6.6, robot: 's1', robots: collectionRobots, robotPosition: [.9, 0, 1.15], target: [.15, .9, 0], camera: [6.5, 6.8, 10.1] },
  { id: 'cleanup', name: '环境清洁', zone: '室外', index: '16', environment: 'outdoor', task: '垃圾桶清洁与归位', value: '从桶体状态到周边地面，连接清洗、整理与作业收尾。', position: [-15.5, 0, -1.35], width: 6.6, depth: 5.6, robot: 'h2', robots: collectionRobots, robotPosition: [-1.4, 0, .4], target: [0, .8, 0], camera: [6.4, 6.2, 8.5] },
  { id: 'garden', name: '庭院园艺', zone: '室外', index: '17', environment: 'outdoor', task: '庭院整理与工具回收', value: '落叶、盆栽与工具各有去向，整理结果成为下一步操作的起点。', position: [-15.5, 0, 5.9], width: 6.8, depth: 5.8, robot: 'g1', robots: collectionRobots, robotPosition: [-.85, 0, -.85], target: [0, .8, 0], camera: [6.2, 6.9, 8.8] },
  { id: 'popup', name: '快闪运营', zone: '室外', index: '18', environment: 'outdoor', task: '开店布置与闭店回收', value: '临时陈列和周转物料，让开店、补货与闭店保留连续的对象对应。', position: [4.6, 0, 10.75], width: 8, depth: 5.8, robot: 's1', robots: collectionRobots, robotPosition: [-1.3, 0, -.5], target: [0, 1, 0], camera: [7.2, 6.8, 9.8] },
]

export const INDOOR_SCENES = SCENES.filter(scene => scene.environment !== 'outdoor')
export const isOutdoorScene = (id: SceneId): id is OutdoorSceneId => id === 'cleanup' || id === 'garden' || id === 'popup'
export const WORLD_BOUNDS = {
  minX: Math.min(...INDOOR_SCENES.map(s => s.position[0] - s.width / 2)) - 1.5,
  maxX: Math.max(...INDOOR_SCENES.map(s => s.position[0] + s.width / 2)) + 5.5,
  minZ: Math.min(...INDOOR_SCENES.map(s => s.position[2] - s.depth / 2)) - 6.1,
  maxZ: Math.max(...INDOOR_SCENES.map(s => s.position[2] + s.depth / 2)) + 4.3,
}

export type WorldFocus = 'all' | 'neighborhood'
export const NEIGHBORHOOD_SCENES: SceneId[] = ['care', 'garage', 'kitchen', 'bedroom', 'living', 'bathroom', 'cleanup', 'garden']
export const NEIGHBORHOOD_BOUNDS = { minX: WORLD_BOUNDS.minX, maxX: 1.15, minZ: -16.7, maxZ: 10.1 }

export const ROBOTS: Record<RobotId, { name: string; brand: string; value: string; source: string; available: boolean }> = {
  g1: { name: 'G1', brand: '宇树', value: '接近目标后的躯干调整与双臂操作，属于同一段全身协同经验。', source: 'https://github.com/unitreerobotics/unitree_mujoco/tree/main/unitree_robots/g1', available: true },
  h2: { name: 'H2', brand: '宇树', value: '成人尺度的可达范围，让货位高度、取放距离与身体姿态共同进入任务设计。', source: 'https://github.com/unitreerobotics/unitree_mujoco/tree/main/unitree_robots/h2', available: true },
  s1: { name: 'S1', brand: '星尘', value: '绳驱有助于减少非任务性的细微抖动，让连续动作记录更平稳，减少动作监督中的额外噪声。', source: 'https://github.com/Astribot-Dev/astribot_descriptions', available: true },
  luna: { name: 'Luna', brand: '天机', value: '移动、躯干调整与柔顺接触，连接接近工位到完成操作的过程。', source: 'https://cn.gentorobotics.ai/products/gento-luna/', available: true },
}

export const LIGHTS = [
  { id: 'daylight', name: '柔和日光', key: [-3.6, 6.8, 4.5] as Vec3, power: 2.2, color: '#fffaf1', fill: .65, ambient: .75, environment: .4, exposure: 1.05, radius: 3 },
  { id: 'sidelight', name: '侧向日光', key: [-6, 3.8, -1] as Vec3, power: 3.1, color: '#fff5df', fill: .3, ambient: .38, environment: .27, exposure: 1.03, radius: 1 },
  { id: 'interior', name: '室内照明', key: [1, 5.8, -.7] as Vec3, power: 1.65, color: '#ffe0b8', fill: .28, ambient: .5, environment: .32, exposure: 1.13, radius: 5 },
  { id: 'dim', name: '低照度', key: [-3, 4.2, 1] as Vec3, power: .42, color: '#b9cbe7', fill: .16, ambient: .22, environment: .15, exposure: 1.08, radius: 4 },
] as const
export type Lighting = typeof LIGHTS[number]['id']
const OUTDOOR_LIGHTS = LIGHTS.map(light => ({
  ...light,
  name: ({ daylight: '阴天漫射', sidelight: '晴日斜照', interior: '遮荫散射', dim: '傍晚灯光' })[light.id],
  ...(light.id === 'interior' ? { color: '#eff5e8', power: 1.25, ambient: .65, fill: .48, environment: .4, exposure: 1.07 } : {}),
}))
export const sceneLights = (outdoor = false) => outdoor ? OUTDOOR_LIGHTS : LIGHTS
export const sceneById = (id: string | null) => SCENES.find(scene => scene.id === id) ?? SCENES[0]
