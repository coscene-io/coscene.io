import { sceneById } from './robot-data-miniature-catalog'
import type { RobotId, Vec3 } from './robot-data-miniature-catalog'
import type { ProduceKind, TaskFrame, TaskObject, TaskSequence, TaskStep, TaskVariant } from './robot-data-miniature-tasks'

const step = (id: string, name: string, value: string, station: Vec3, heading: number): TaskStep => {
  const room = sceneById('produce')
  return { id, name, value, station, heading, target: room.target, camera: room.camera }
}
export const PRODUCE_SEQUENCE: TaskSequence = {
  id: 'produce-replenishment', title: '果蔬分拣与补货', goal: '从一批来货，到按品类就位的生鲜陈列。',
  variants: [
    { id: 'everyday', name: '日常补货', value: '三类果蔬各两件，按品类归集、称重，再补入对应陈列位。' },
    { id: 'busy', name: '批量补货', value: '三类果蔬各增至四件，称重配选台与陈列位需要容纳更多对象。' },
    { id: 'scattered', name: '混合来货', value: '数量不变，果蔬交错摆放、长条对象转向；空周转筐也换到另一侧。' },
  ],
  steps: [
    step('receive', '来货分类', '辨认果蔬的形状与品类，把物品位置和后续陈列去向对应起来。', [-1.6, 0, -1.03], Math.PI / 2),
    step('select', '称重配选', '同一批果蔬转入配选台，一件进入秤盘，其余按品类等待，保留处理顺序。', [2.23, 0, -1.03], Math.PI / 2),
    step('display', '分类补货', '果蔬进入对应的陈列格，记录从来货位置到最终货位的连续对应。', [.9, 0, .82], Math.PI),
    step('reset', '周转归整', '已补果蔬留在陈列位，空筐进入周转架，来货台完成清理，为下一批留出位置。', [.95, 0, 2.08], Math.PI),
  ],
}
export const PRODUCE_SURFACES = {
  receiving: { center: [-1.6, .94, -2.22] as Vec3, width: 3.15, depth: .8 },
  selecting: { center: [1.73, .94, -2.22] as Vec3, width: 1.6, depth: .8 },
  scale: { center: [2.95, 1.07, -2.22] as Vec3, width: .49, depth: .51 },
  display: { center: [-1.85, .87, 1.055] as Vec3, width: 2.95, depth: .78 },
  emptyA: { center: [-2.52, .018, 2.11] as Vec3, width: .72, depth: .5 },
  emptyB: { center: [-1.55, .018, 2.11] as Vec3, width: .72, depth: .5 },
  returnA: { center: [-.58, .66, 2.12] as Vec3, width: .73, depth: .52 },
  returnB: { center: [-.58, .9, 2.12] as Vec3, width: .73, depth: .52 },
  cleaning: { center: [2.73, .7, 2.1] as Vec3, width: .8, depth: .55 },
}
type Support = keyof typeof PRODUCE_SURFACES

export const PRODUCE_STOCK_BAYS: { id: string; produce: ProduceKind; center: Vec3; width: number; depth: number; layout: 'fruit' | 'replenishment' | 'vegetable' | 'cold' | 'feature' | 'berry' }[] = [
  ...(['apple', 'orange', 'pear'] as const).map((produce, i) => ({ id: `fruit-bay-${i}`, produce, center: [-2.8 + i * .95, .87, .405] as Vec3, width: .91, depth: .35, layout: 'fruit' as const })),
  ...(['apple', 'pear', 'cucumber'] as const).map((produce, i) => ({ id: `replenishment-bay-${i}`, produce, center: [-2.8 + i * .95, .87, 1.055] as Vec3, width: .91, depth: .78, layout: 'replenishment' as const })),
  ...([['cucumber', 'carrot', 'corn'], ['eggplant', 'corn', 'carrot']] as const).flatMap((items, tier) => items.map((produce, i) => ({ id: `vegetable-bay-${tier}-${i}`, produce, center: [-3.36, .81 + tier * .55, -1.28 + i * .56] as Vec3, width: .54, depth: .51, layout: 'vegetable' as const }))),
  ...[.45, .94, 1.43].flatMap((y, tier) => [2.79, 3.28].flatMap((x, col) => [-.02, .4].map((z, row) => ({ id: `cold-bay-${tier}-${col}-${row}`, produce: (tier + col + row) % 2 ? 'broccoli' as const : 'cabbage' as const, center: [x, y + .049, z] as Vec3, width: .38, depth: .34, layout: 'cold' as const })))),
  ...[-2.6, -2.05, -1.5].map((x, i) => ({ id: `wall-melon-${i}`, produce: 'watermelon' as const, center: [x, 1.68, -2.49] as Vec3, width: .48, depth: .48, layout: 'feature' as const })),
  ...[-.75, -.1].map((x, i) => ({ id: `wall-berry-${i}`, produce: 'strawberry' as const, center: [x, 1.7, -2.49] as Vec3, width: .46, depth: .32, layout: 'berry' as const })),
  ...[.85, 1.53, 2.21].map((x, i) => ({ id: `wall-durian-${i}`, produce: 'durian' as const, center: [x, 1.68, -2.49] as Vec3, width: .48, depth: .48, layout: 'feature' as const })),
]

// Stock already on sale is distinct from the incoming task batch and persists at every step.
export function produceStockFrame(): TaskFrame {
  const objects: TaskObject[] = []
  for (const bay of PRODUCE_STOCK_BAYS) {
    const count = bay.layout === 'berry' ? 12 : bay.layout === 'fruit' || bay.layout === 'replenishment' ? 8 : bay.layout === 'vegetable' ? 3 : 1
    for (let i = 0; i < count; i++) objects.push({
      id: `stock-${bay.id}-${i}`, kind: 'fruit', produce: bay.produce, support: bay.id, tone: 1, rotation: 0,
      position: [bay.center[0] + (bay.layout === 'fruit' ? (i % 4 - 1.5) * .2 : bay.layout === 'replenishment' ? (i % 2 - .5) * .62 : bay.layout === 'berry' ? (i % 4 - 1.5) * .085 : 0), bay.center[1], bay.center[2] + (bay.layout === 'fruit' ? (Math.floor(i / 4) - .5) * .18 : bay.layout === 'replenishment' ? (Math.floor(i / 2) - 1.5) * .185 : bay.layout === 'vegetable' ? (i - 1) * .16 : bay.layout === 'berry' ? (Math.floor(i / 4) - 1) * .085 : 0)],
    })
  }
  return { scene: 'produce', stage: 0, variant: 'everyday', step: PRODUCE_SEQUENCE.steps[0], objects, poses: {} }
}

export function produceTaskFrame(stage: number, variant: TaskVariant): TaskFrame {
  const count = variant === 'busy' ? 12 : 6, scattered = variant === 'scattered', objects: TaskObject[] = []
  const add = (id: string, kind: TaskObject['kind'], support: Support, dx: number, dz: number, tone: number, rotation = 0) => {
    const [x, y, z] = PRODUCE_SURFACES[support].center
    objects.push({ id, kind, support, position: [x + dx, y, z + dz], tone, rotation })
  }
  for (let i = 0; i < count; i++) {
    const type = i % 3, row = Math.floor(i / 3)
    const support = stage === 0 ? 'receiving' : stage === 1 ? i === 0 ? 'scale' : 'selecting' : 'display'
    let x = (type - 1) * (stage === 1 ? .46 : .95), z = (row - 1.5) * .19
    if (support === 'scale') { x = 0; z = 0 }
    if (stage === 1 && scattered && support === 'selecting') z = row ? .18 : -.18
    if (stage === 0 && scattered) { x = [-.95, .82, .11, -.53, .58, -1.17][i]; z = i % 2 ? .2 : -.18 }
    add(`produce-${i}`, 'fruit', support, x, z, [0, 5, 1][type], scattered && stage < 2 ? [1.1, -.55, .8, -.3, 1.65, -1.15][i] : 0)
  }
  for (let i = 0; i < 2; i++) add(`empty-crate-${i}`, 'produceCrate', stage === 3 ? i ? 'returnB' : 'returnA' : scattered ? i ? 'emptyA' : 'emptyB' : i ? 'emptyB' : 'emptyA', 0, 0, i ? 1 : 3)
  add('cleaning-pad', 'cleaningPad', stage === 3 ? 'receiving' : 'cleaning', 0, 0, 4)
  return { scene: 'produce', stage, variant, step: PRODUCE_SEQUENCE.steps[stage], objects, poses: {
    g1: { right_shoulder_pitch_joint: -.3, right_elbow_joint: .62, left_shoulder_pitch_joint: -.18, left_elbow_joint: .58 },
    s1: { astribot_torso_joint_1: .66, astribot_torso_joint_2: -1.32, astribot_torso_joint_3: .66, astribot_arm_left_joint_4: .8, astribot_arm_right_joint_4: .8 },
  } }
}
export function produceRobotValue(robot: RobotId) {
  if (robot === 's1') return '绳驱有助于减少非任务性的细微抖动，让果蔬取放中的连续动作记录更平稳，减少动作监督中的额外噪声。'
  if (robot === 'h2') return '从操作台到较低的陈列位，成人尺度的身体需要协调接近距离、躯干姿态与双臂取放。'
  if (robot === 'luna') return '轮式接近与躯干调整连接不同高度的台面，让果蔬分拣和货位转移保留完整上下文。'
  return '面对不同形状和朝向的果蔬，身体站位与双臂操作共同适应目标，连接分拣和补货的前后状态。'
}
