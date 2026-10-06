import { sceneById } from './robot-data-miniature-catalog'
import type { RobotId, Vec3 } from './robot-data-miniature-catalog'
import type { TaskFrame, TaskObject, TaskSequence, TaskStep, TaskVariant } from './robot-data-miniature-tasks'

const step = (id: string, name: string, value: string, station: Vec3, heading: number): TaskStep => {
  const room = sceneById('sushi')
  return { id, name, value, station, heading, target: room.target, camera: room.camera }
}

export const SUSHI_SEQUENCE: TaskSequence = {
  id: 'sushi-service', title: '配盘出餐与前场服务', goal: '一份出餐从后厨走向前场，补给与回收在同一空间中衔接。',
  variants: [
    { id: 'everyday', name: '日常出餐', value: '三份配盘、两处茶杯补给，回收两处就餐位的已用餐盘。' },
    { id: 'busy', name: '集中出餐', value: '配盘增至六份，覆盖不同品类；四处就餐位同时补给，待回收餐盘也随之增加。' },
    { id: 'scattered', name: '换位补给', value: '出餐数量不变，配盘位置与朝向交错；茶杯补给和待回收餐盘换至另一组就餐位。' },
  ],
  steps: [
    step('plate', '后厨配盘', '已备好的寿司按盘归集，保留品类、餐盘与出餐顺序的对应。', [-1.9, 0, -1.36], Math.PI / 2),
    step('pass', '出餐交接', '同一组配盘到达出餐口，后厨的准备结果成为前场上带的起点。', [.55, 0, -1.8], -Math.PI / 2),
    step('supply', '上带与补给', '配盘转入回转台，茶杯补至指定就餐位；出餐与服务用品分别核对去向。', [3.45, 0, 1.05], Math.PI),
    step('return', '餐具回收', '已用餐盘进入独立洗消区，出餐和洁净补给保持原位，避免洁污对象混用。', [3.6, 0, -1.32], Math.PI / 2),
  ],
}

// Named, metre-scale support planes are shared by geometry and task-state verification.
export const SUSHI_SURFACES = {
  prep: { center: [-1.9, .94, -2.69] as Vec3, width: 2.8, depth: .74 },
  pass: { center: [.55, 1.0, -.58] as Vec3, width: 1.8, depth: .72 },
  belt: { center: [-.65, 1.018, 1.66] as Vec3, width: 3.5, depth: .34 },
  clean: { center: [.64, .94, -2.69] as Vec3, width: 1.65, depth: .74 },
  dining: { center: [-.65, .91, 2.12] as Vec3, width: 4.6, depth: .46 },
  returns: { center: [3.6, .94, -2.69] as Vec3, width: 1.32, depth: .74 },
}
type Support = keyof typeof SUSHI_SURFACES

export function sushiTaskFrame(stage: number, variant: TaskVariant): TaskFrame {
  const count = variant === 'busy' ? 6 : 3, seats = variant === 'busy' ? 4 : 2, scattered = variant === 'scattered'
  const objects: TaskObject[] = []
  const add = (id: string, kind: TaskObject['kind'], support: Support, dx: number, dz: number, tone: number, rotation = 0) => {
    const [x, y, z] = SUSHI_SURFACES[support].center
    objects.push({ id, kind, support, position: [x + dx, y, z + dz], tone, rotation })
  }
  for (let i = 0; i < count; i++) {
    const support = stage === 0 ? 'prep' : stage === 1 ? 'pass' : 'belt'
    const dx = stage < 2 ? (i % 3 - 1) * (stage === 0 ? .78 : .55) : -1.45 + i * .57
    const dz = stage < 2 ? (Math.floor(i / 3) - .5) * .34 : 0
    add(`fresh-sushi-${i}`, 'sushiPlate', support, scattered && stage === 0 ? -dx : dx, scattered && stage === 0 ? -dz : dz, i % 3, scattered ? .65 + i * .8 : 0)
  }
  const positions = scattered ? [-.55, 1.65] : [-1.65, .55, -.55, 1.65]
  for (let i = 0; i < seats; i++) {
    add(`clean-tea-${i}`, 'cup', stage < 2 ? 'clean' : 'dining', stage < 2 ? -.55 + i * .35 : positions[i] - .19, stage < 2 ? 0 : -.1, 1)
    add(`used-dish-${i}`, 'usedSushiPlate', stage === 3 ? 'returns' : 'dining', stage === 3 ? -.43 + i % 2 * .64 : positions[i] + .1, stage === 3 ? -.17 + Math.floor(i / 2) * .34 : .05, 4)
  }
  return {
    scene: 'sushi', stage, variant, step: SUSHI_SEQUENCE.steps[stage], objects,
    poses: {
      g1: { right_shoulder_pitch_joint: -.3, right_elbow_joint: .62, left_shoulder_pitch_joint: -.18, left_elbow_joint: .58 },
      s1: { astribot_torso_joint_1: .66, astribot_torso_joint_2: -1.32, astribot_torso_joint_3: .66, astribot_arm_left_joint_4: .8, astribot_arm_right_joint_4: .8 },
    },
  }
}

export function sushiRobotValue(robot: RobotId) {
  if (robot === 's1') return '绳驱有助于减少非任务性的细微抖动，让配盘与杯具取放的连续记录更平稳，减少动作监督中的额外噪声。'
  if (robot === 'h2') return '成人尺度的身体在后厨台面、出餐口与前场之间调整站位，将全身协调与双臂取放保留在同一段任务经验中。'
  if (robot === 'luna') return '轮式底盘衔接前后场，躯干调整适应不同操作高度，连接接近工位、定位与器皿转移。'
  return '从后厨到前场，接近距离、身体转向与双臂操作共同适应任务，保留配盘和服务用品各自的去向。'
}
