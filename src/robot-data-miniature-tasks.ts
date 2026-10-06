import type { RobotId, SceneId, Vec3 } from './robot-data-miniature-catalog'
import { isOutdoorScene } from './robot-data-miniature-catalog'
import { OUTDOOR_SEQUENCES, outdoorTaskFrame, outdoorRobotValue } from './robot-data-miniature-outdoor-tasks'
import { ADDITIONAL_SEQUENCES, additionalTaskFrame, additionalRobotValue } from './robot-data-miniature-task-library'
import { WORK_SEQUENCES, isWorkScene, workTaskFrame, workRobotValue } from './robot-data-miniature-work-tasks'
import { CARE_SEQUENCE, careTaskFrame, careRobotValue } from './robot-data-miniature-care-tasks'
import { SUSHI_SEQUENCE, sushiTaskFrame, sushiRobotValue } from './robot-data-miniature-sushi-tasks'
import { PRODUCE_SEQUENCE, produceTaskFrame, produceRobotValue } from './robot-data-miniature-produce-tasks'
import { OFFICE_SEQUENCE, officeTaskFrame, officeRobotValue } from './robot-data-miniature-office-tasks'

export type TaskVariant = 'everyday' | 'busy' | 'scattered'
export type TaskVariantOption = { id: TaskVariant; name: string; value: string }
export const TASK_VARIANTS: TaskVariantOption[] = [
  { id: 'everyday', name: '日常摆放', value: '少量杯盘，清晰的取放位置。' },
  { id: 'busy', name: '多人用餐', value: '杯盘增多，分批次保持对象与去向的对应。' },
  { id: 'scattered', name: '交错摆放', value: '数量不变，改变初始位置与杯柄朝向。' },
]
export type TaskStep = { id: string; name: string; value: string; target: Vec3; camera: Vec3; station: Vec3; heading: number }
export type TaskSequence = { id: string; title: string; goal: string; steps: TaskStep[]; variants?: TaskVariantOption[] }

export const TASK_SEQUENCES: Record<SceneId, TaskSequence> = {
  ...OUTDOOR_SEQUENCES,
  ...ADDITIONAL_SEQUENCES,
  ...WORK_SEQUENCES,
  care: CARE_SEQUENCE,
  sushi: SUSHI_SEQUENCE,
  produce: PRODUCE_SEQUENCE,
  office: OFFICE_SEQUENCE,
  kitchen: {
    id: 'after-meal', title: '餐后整理', goal: '从散落杯盘，到重新就绪的厨房。',
    steps: [
      { id: 'collect', name: '收集杯盘', value: '识别分散的对象与可抓取部位，让取物顺序对应真实的初始状态。', target: [-.4, .85, .15], camera: [3.4, 3.8, 6.5], station: [-1.1, 0, .35], heading: 0 },
      { id: 'sort', name: '分类归整', value: '杯与盘分别归置，持续跟踪已经处理和仍待处理的对象。', target: [-.1, .85, .3], camera: [3.1, 3.8, 6.5], station: [-1.1, 0, .7], heading: 0 },
      { id: 'wash', name: '送至清洗位', value: '前一阶段的整理结果成为下一阶段的起点，连接取放与跨工位转移。', target: [-.55, .9, -.65], camera: [3.4, 4.2, 6.3], station: [-.94, 0, -.84], heading: Math.PI / 2 },
      { id: 'reset', name: '台面复位', value: '餐具离开台面后再进行清洁，以完整的目标状态判断任务是否结束。', target: [-.3, .85, .2], camera: [3.4, 3.8, 6.5], station: [-1.1, 0, .65], heading: 0 },
    ],
  },
  cafe: {
    id: 'table-reset', title: '餐后复位', goal: '一次服务结束，为下一位顾客做好准备。',
    steps: [
      { id: 'collect', name: '回收杯盘', value: '从顾客桌面识别待回收物品，组织接近、取物与回收的先后关系。', target: [-.65, .9, .3], camera: [3.6, 4.2, 6.8], station: [-1.14, 0, .68], heading: Math.PI + .45 },
      { id: 'sort', name: '分类转移', value: '将杯盘集中至回收托盘，保持物品身份、位置和去向的连续记录。', target: [-.05, .95, .2], camera: [3.8, 4, 6.6], station: [-.78, 0, .3], heading: 0 },
      { id: 'clean', name: '清洁桌面', value: '先确认物品已移走，再处理桌面；动作顺序由环境状态决定。', target: [-.65, .9, .3], camera: [3.6, 4.2, 6.8], station: [-1.14, 0, .68], heading: Math.PI + .45 },
      { id: 'reset', name: '恢复摆台', value: '回收器皿保留在处理区，使用另一组洁净杯具摆台，让两类对象的状态保持可追溯。', target: [-.6, .9, .25], camera: [3.6, 4.2, 6.8], station: [-1.14, 0, .68], heading: Math.PI + .45 },
    ],
  },
}

export type ProduceKind = 'apple' | 'pear' | 'orange' | 'cucumber' | 'carrot' | 'eggplant' | 'corn' | 'cabbage' | 'broccoli' | 'watermelon' | 'strawberry' | 'durian'
export type OutdoorPropKind = 'wheelieBin' | 'pottedPlant' | 'gardenLeaf' | 'broom' | 'wateringCan' | 'displayRack' | 'signBoard' | 'washBrush' | 'outdoorStain'
export type TaskObject = { id: string; kind: OutdoorPropKind | 'cup' | 'plate' | 'tray' | 'cloth' | 'book' | 'remote' | 'bottle' | 'carton' | 'can' | 'garment' | 'linen' | 'caddy' | 'bag' | 'receipt' | 'wrench' | 'screwdriver' | 'fastener' | 'parcel' | 'component' | 'tissueBox' | 'harnessModule' | 'torqueDriver' | 'trowel' | 'gloves' | 'seedPacket' | 'sushiPlate' | 'usedSushiPlate' | 'fruit' | 'produceCrate' | 'cleaningPad' | 'paperSet' | 'fileFolder' | 'penPot' | 'deskMark'; position: Vec3; rotation: number; tone: number; produce?: ProduceKind; form?: 'spread' | 'folded' | 'sealed' | 'connected' | 'secured' | 'tested' | 'printed' | 'shredded' | 'cleaned'; support?: string }
export type TaskFrame = { scene: SceneId; stage: number; variant: TaskVariant; step: TaskStep; objects: TaskObject[]; poses: Partial<Record<RobotId, Record<string, number>>> }

export function taskFrame(scene: SceneId, stage: number, variant: TaskVariant): TaskFrame | undefined {
  const sequence = TASK_SEQUENCES[scene]
  if (!sequence) return
  const index = Math.min(sequence.steps.length - 1, Math.max(0, stage))
  if (isOutdoorScene(scene)) return outdoorTaskFrame(scene, index, variant)
  if (scene === 'care') return careTaskFrame(index, variant)
  if (scene === 'sushi') return sushiTaskFrame(index, variant)
  if (scene === 'produce') return produceTaskFrame(index, variant)
  if (scene === 'office') return officeTaskFrame(index, variant)
  if (isWorkScene(scene)) return workTaskFrame(scene, index, variant)
  if (scene !== 'kitchen' && scene !== 'cafe') return additionalTaskFrame(scene, index, variant)
  const count = variant === 'busy' ? 6 : 3
  const objects: TaskObject[] = []
  const add = (id: string, kind: TaskObject['kind'], position: Vec3, tone = 0, rotation = 0) => objects.push({ id, kind, position, tone, rotation })
  const kitchen = scene === 'kitchen'
  const scattered = kitchen ? [[-.34, -.40], [.49, -.16], [-.19, .37]] : [[-.23, .03], [.08, -.22], [.18, .18]]
  for (let i = 0; i < count; i++) {
    const x = (i % 3 - 1) * .18, z = (Math.floor(i / 3) - .5) * .22
    const offset = variant === 'scattered' ? scattered[i % 3] : kitchen ? [x * 1.7, z * 2] : [x, z]
    let at: Vec3
    if (kitchen) at = index === 0 ? [-.13 + offset[0], .791, .45 + offset[1]] : index === 1 ? [.23 + x, .801, .35 + z] : [-.96 + x, .7, -1.78 + z]
    else at = index === 0 ? [-1.98 + offset[0], .759, 1.18 + offset[1]] : index === 1 ? [.26 + x, .865, .48 + z] : [1.4 + x, .893, -1.7 + z]
    add(`used-cup-${i}`, 'cup', at, i % 3, variant === 'scattered' && index === 0 ? [.8, -1.6, 2.5][i] : 0)
    const plate: Vec3 = index === 0 ? [at[0], at[1] - .008, at[2]] : kitchen ? [index === 1 ? -.3 : -.25, (index === 1 ? .783 : .844) + i * .018, index === 1 ? .58 : -1.69] : [index === 1 ? .71 : 2.0, (index === 1 ? .849 : .876) + i * .018, index === 1 ? .56 : -1.66]
    add(`used-plate-${i}`, 'plate', plate)
  }
  add('return-tray', 'tray', kitchen ? index === 0 ? [.57, .792, .85] : [.23, .792, .35] : index === 1 ? [.26, .856, .48] : [1.4, .884, -1.7])
  if (kitchen) add('cleaning-cloth', 'cloth', index === 3 ? [-.36, .79, .57] : [.75, .849, -1.63], 1)
  else {
    add('cleaning-cloth', 'cloth', index === 2 ? [-1.81, .76, 1.1] : [1.02, .88, -1.75], 1)
    // Clean replacement cups are distinct objects, not the used cups changing state without washing.
    for (let i = 0; i < count; i++) {
      const x = (i % 3 - 1) * .15, z = (Math.floor(i / 3) - .5) * .2
      add(`clean-cup-${i}`, 'cup', index === 3 ? [-1.98 + x, .752, 1.18 + z] : [-.98 + x, .876, -1.76 + z], 2)
    }
  }
  const low = !kitchen && index !== 1
  return {
    scene, stage: index, variant, step: sequence.steps[index], objects,
    poses: {
      g1: { right_shoulder_pitch_joint: low ? -.22 : -.42, right_elbow_joint: low ? .38 : .62, left_shoulder_pitch_joint: index === 1 ? -.2 : .12 },
      s1: { astribot_torso_joint_1: low ? .9 : .65, astribot_torso_joint_2: low ? -1.8 : -1.3, astribot_torso_joint_3: low ? .9 : .65, astribot_arm_left_joint_4: low ? .58 : .85, astribot_arm_right_joint_4: low ? .58 : .85 },
    },
  }
}

export function taskRobotValue(robot: RobotId, scene: SceneId, stage: number) {
  if (isOutdoorScene(scene)) return outdoorRobotValue(robot, scene)
  if (scene === 'care') return careRobotValue(robot, stage)
  if (scene === 'sushi') return sushiRobotValue(robot)
  if (scene === 'produce') return produceRobotValue(robot)
  if (scene === 'office') return officeRobotValue(robot)
  if (isWorkScene(scene)) return workRobotValue(robot, scene, stage)
  if (scene !== 'kitchen' && scene !== 'cafe') return additionalRobotValue(robot, scene, stage)
  if (robot === 's1') return stage === 2 ? '连续操作中的平稳动作记录，有助于减少非任务性抖动带来的监督噪声。' : '绳驱有助于减少非任务性的细微抖动，让双臂连续取放的动作记录更平稳。'
  if (robot === 'g1') return stage === 2 ? '工位之间的接近与转向，将身体调整和物体操作放在同一段经验中。' : scene === 'cafe' ? '面对较低的顾客桌面，身体姿态与双臂操作需要共同适应目标位置。' : '围绕台面位置组织躯干调整与双臂取放，保留全身协同的上下文。'
  if (robot === 'h2') return scene === 'cafe' ? '从低桌到服务台，成人尺度的身体需要随目标高度调整站位、俯身与双臂操作。' : '在台面与清洗位之间组织全身协同，让接近距离、躯干姿态与器皿转移共同进入记录。'
  if (robot === 'luna') return '轮式接近与折叠躯干连接不同高度的工位，让移动、取放与接触过程保留在连续的任务上下文中。'
  return undefined
}
