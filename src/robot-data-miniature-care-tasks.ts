import { sceneById } from './robot-data-miniature-catalog'
import type { RobotId, Vec3 } from './robot-data-miniature-catalog'
import type { TaskFrame, TaskObject, TaskSequence, TaskStep, TaskVariant } from './robot-data-miniature-tasks'

const step = (id: string, name: string, value: string, station: Vec3, heading: number): TaskStep => {
  const room = sceneById('care')
  return { id, name, value, station, heading, target: room.target, camera: room.camera }
}

export const CARE_SEQUENCE: TaskSequence = {
  id: 'bedside-replenishment', title: '床旁补给与回收', goal: '用品按床位备齐，洁净补给与使用后回收各有去向。',
  variants: [
    { id: 'everyday', name: '单床补给', value: '为一处床位准备毛巾、饮水杯和纸巾盒，回收原有杯具与布草。' },
    { id: 'busy', name: '双床补给', value: '用品增至两组，分别对应两处床位；服务车分区装载，回收数量同步增加。' },
    { id: 'scattered', name: '跨区备料', value: '用品数量不变，饮水杯已在服务车上，毛巾与纸巾盒分置柜台两端；待回收杯具也换了位置。' },
  ],
  steps: [
    step('identify', '核对床位用品', '将毛巾、饮水杯和纸巾盒对应到待补床位，同时确认洁净用品与待回收物品的位置。', [2.35, 0, -1.23], Math.PI / 2),
    step('prepare', '分区备齐上车', '用品归集到服务车，按床位分组，保留每件物品与配送目标的对应。', [1.17, 0, .45], 0),
    step('deliver', '床旁分类摆放', '用品从服务车转入各床旁桌，既核对送到哪里，也核对是否配齐；原有杯具与布草仍待回收。', [-2.25, 0, 1.0], Math.PI / 2),
    step('recover', '回收并复核', '原有杯具与布草分别进入回收车的器皿区和布草区，已补用品留在床旁，洁净服务车恢复空闲。', [1.17, 0, 2.15], 0),
  ],
}

// Tops and footprints are also used by the room builder and support checks.
export const CARE_SURFACES = {
  storage: { center: [2.35, .94, -2.5] as Vec3, width: 2.2, depth: .68 },
  service: { center: [2.55, .9, .45] as Vec3, width: 1.12, depth: .8 },
  bedsideA: { center: [-2.25, .94, -.18] as Vec3, width: 1.08, depth: .52 },
  bedsideB: { center: [.05, .94, -.18] as Vec3, width: 1.08, depth: .52 },
  cabinetA: { center: [-1.32, .76, -1.89] as Vec3, width: .62, depth: .64 },
  cabinetB: { center: [.98, .76, -1.89] as Vec3, width: .62, depth: .64 },
  returnCups: { center: [2.28, .9, 2.15] as Vec3, width: .43, depth: .6 },
  returnLinen: { center: [2.82, .9, 2.15] as Vec3, width: .43, depth: .6 },
}
type Support = keyof typeof CARE_SURFACES

export function careTaskFrame(stage: number, variant: TaskVariant): TaskFrame {
  const count = variant === 'busy' ? 2 : 1, scattered = variant === 'scattered'
  const objects: TaskObject[] = []
  const add = (id: string, kind: TaskObject['kind'], support: Support, dx: number, dz: number, tone: number, rotation = 0) => {
    const [x, y, z] = CARE_SURFACES[support].center
    objects.push({ id, kind, support, position: [x + dx, y, z + dz], tone, rotation, form: kind === 'linen' ? 'folded' : undefined })
  }
  for (let bed = 0; bed < count; bed++) {
    const bedside = bed ? 'bedsideB' : 'bedsideA', cabinet = bed ? 'cabinetB' : 'cabinetA'
    const items = ['linen', 'cup', 'tissueBox'] as const
    for (let i = 0; i < items.length; i++) {
      let support: Support = stage === 0 ? 'storage' : stage === 1 ? 'service' : bedside
      let dx = stage === 0 ? -.73 + i * .62 : -.33 + i * .32
      let dz = stage < 2 ? (bed ? .19 : -.19) : 0, rotation = 0
      if (stage === 0 && scattered) {
        support = i === 1 ? 'service' : 'storage'
        dx = i === 0 ? .77 : i === 1 ? .33 : -.73
        dz = i === 1 ? .2 : i === 0 ? .12 : -.12
        rotation = [.42, 1.8, -.62][i]
      }
      add(`clean-${items[i]}-${bed}`, items[i], support, dx, dz, i === 0 ? 2 : i === 1 ? 4 : 5, rotation)
    }
    // Used objects retain their identity; clean replacements never become the returned set.
    add(`used-cup-${bed}`, 'cup', stage === 3 ? 'returnCups' : scattered ? bedside : cabinet,
      stage === 3 ? 0 : scattered ? .41 : .2, stage === 3 ? -.14 + bed * .28 : scattered ? -.17 : -.2, 0)
    add(`used-linen-${bed}`, 'linen', stage === 3 ? 'returnLinen' : cabinet,
      stage === 3 ? 0 : -.09, stage === 3 ? -.14 + bed * .28 : .13, 1)
  }
  return {
    scene: 'care', stage, variant, step: CARE_SEQUENCE.steps[stage], objects,
    poses: {
      g1: { right_shoulder_pitch_joint: -.3, right_elbow_joint: .62, left_shoulder_pitch_joint: -.18, left_elbow_joint: .58 },
      s1: { astribot_torso_joint_1: .66, astribot_torso_joint_2: -1.32, astribot_torso_joint_3: .66, astribot_arm_left_joint_4: .8, astribot_arm_right_joint_4: .8 },
    },
  }
}

export function careRobotValue(robot: RobotId, stage: number) {
  if (robot === 's1') return '从分组备料到床旁取放，绳驱有助于减少非任务性的细微抖动，让连续动作记录更平稳，减少动作监督中的额外噪声。'
  if (robot === 'h2') return '成人尺度的身体需要协调床旁空间、台面高度与接近距离，让站位调整和用品转移保留在同一段任务经验中。'
  if (robot === 'luna') return '轮式底盘衔接柜台、服务车与床位，躯干调整适应操作高度，保留接近、定位和双臂取放的上下文。'
  return stage === 3 ? '洁净用品与回收物品有不同去向，全身转向与双臂取放共同维持任务中的对象对应。' : '从储物区到床旁，身体朝向、接近距离与双臂操作共同适应目标，不把移动和取放拆成孤立动作。'
}
