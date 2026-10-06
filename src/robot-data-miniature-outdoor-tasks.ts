import { sceneById } from './robot-data-miniature-catalog'
import type { OutdoorSceneId, RobotId, Vec3 } from './robot-data-miniature-catalog'
import type { TaskFrame, TaskObject, TaskSequence, TaskStep, TaskVariant } from './robot-data-miniature-tasks'

const step = (scene: OutdoorSceneId, id: string, name: string, value: string, station: Vec3, heading: number): TaskStep => {
  const definition = sceneById(scene)
  return { id, name, value, station, heading, target: definition.target, camera: definition.camera }
}

export const OUTDOOR_SEQUENCES: Record<OutdoorSceneId, TaskSequence> = {
  cleanup: {
    id: 'bin-cleaning', title: '垃圾桶清洁与归位', goal: '桶体清洁，周边恢复通行，用品回到作业位。',
    variants: [
      { id: 'everyday', name: '两桶日常清洁', value: '两只垃圾桶依次清洗，零散纸屑留在桶前，工具集中在清洁车。' },
      { id: 'busy', name: '三桶集中清洁', value: '增加一只待清洗桶，桶体污迹与地面杂物同步增多。' },
      { id: 'scattered', name: '桶位与污迹变化', value: '仍是两只桶，但初始位置和朝向错开；纸屑与污迹转移到作业区另一侧。' },
    ],
    steps: [
      step('cleanup', 'prepare', '确认桶位与工具', '辨认待清洗桶、地面杂物和工具的位置，确定清洗顺序。', [.3, 0, -.35], Math.PI / 2),
      step('cleanup', 'wash', '清洁桶体', '一只桶进入带排水沟的清洗位，已处理的桶单独归位，剩余对象保持待处理状态。', [-1.8, 0, -.3], Math.PI / 2),
      step('cleanup', 'ground', '整理周边地面', '桶体清洁后回到指定位置，再收集周边杂物，避免混淆桶体与地面的完成状态。', [.15, 0, .5], -Math.PI / 2),
      step('cleanup', 'return', '工具归位与复核', '杂物保留在回收容器中，清洗用品回到清洁车，通行位置重新腾空。', [1.15, 0, 1.7], 0),
    ],
  },
  garden: {
    id: 'garden-reset', title: '庭院整理与工具回收', goal: '落叶收集，盆栽归置，庭院与工具重新就绪。',
    variants: [
      { id: 'everyday', name: '日常庭院', value: '三盆植物、少量落叶，工具留在种植台，保留清晰的作业通道。' },
      { id: 'busy', name: '落叶与盆栽增多', value: '盆栽增至五盆，落叶数量翻倍，收集与归置都需要分批处理。' },
      { id: 'scattered', name: '跨区散落', value: '数量不变，盆栽移到庭院另一侧，落叶集中在花坛边缘，工具转移到侧架。' },
    ],
    steps: [
      step('garden', 'prepare', '取用园艺工具', '确认工具、植物与落叶的初始位置，区分可直接通行和需要先整理的区域。', [-.85, 0, -.85], Math.PI / 2),
      step('garden', 'collect', '收集落叶', '落叶从草地与步道进入收集筐，盆栽继续保留原位，先完成地面整理。', [.05, 0, .3], -Math.PI / 2),
      step('garden', 'arrange', '整理盆栽', '在已清理的路径旁归置植物，保留同一盆植物从初始位置到目标位置的对应。', [1.1, 0, .75], 0),
      step('garden', 'return', '收回工具与用品', '工具回到侧架，落叶留在收集筐，植物留在新位置，以完整的庭院状态收尾。', [-1.25, 0, 1.75], Math.PI),
    ],
  },
  popup: {
    id: 'popup-operation', title: '开店布置与闭店回收', goal: '从周转物料到营业陈列，再回到可运输的状态。',
    variants: [
      { id: 'everyday', name: '单组陈列', value: '一组展架与六件商品，从周转箱转入展示位，闭店后原件回收。' },
      { id: 'busy', name: '双组补货', value: '增加第二组展架，商品增至十二件，同时保留展示与待补货两类位置。' },
      { id: 'scattered', name: '临时布局调整', value: '商品数量不变，展架改到前侧，物料箱换到展亭另一侧，通行和补货位置随之改变。' },
    ],
    steps: [
      step('popup', 'prepare', '清点开店物料', '展架、标牌与商品各有周转位置，先确认数量和布置要求。', [-1.8, 0, .05], Math.PI),
      step('popup', 'display', '展开陈列与补货', '展架进入营业位置，部分商品摆上货架，剩余商品保留在待补货箱。', [1.35, 0, .15], 0),
      step('popup', 'maintain', '营业整理', '补齐陈列，整理服务台与地面，商品、包装和清洁工具保持各自的去向。', [-.5, 0, .05], Math.PI / 2),
      step('popup', 'close', '闭店回收', '同一批商品返回周转箱，展架收拢、标牌归位，恢复广场的通行空间。', [-1.8, 0, .05], Math.PI),
    ],
  },
}

export function outdoorTaskFrame(scene: OutdoorSceneId, stage: number, variant: TaskVariant): TaskFrame {
  const busy = variant === 'busy', scattered = variant === 'scattered', objects: TaskObject[] = []
  const add = (id: string, kind: TaskObject['kind'], position: Vec3, tone = 0, rotation = 0, form?: TaskObject['form']) => {
    objects.push({ id, kind, position, tone, rotation, form })
  }
  let currentStep = OUTDOOR_SEQUENCES[scene].steps[stage]
  if (scene === 'cleanup') {
    const count = busy ? 3 : 2
    for (let i = 0; i < count; i++) {
      const parked: Vec3 = [.15 + i * .98, .018, -1.85]
      const initial: Vec3 = scattered ? [i ? 1.55 : -.05, .018, i ? -.8 : -1.95] : parked
      const at: Vec3 = stage === 0 ? initial : stage === 1 && i === count - 1 ? [-1.8, .018, -1.9] : parked
      add(`collection-bin-${i}`, 'wheelieBin', at, [1, 4, 5][i], scattered && stage === 0 ? (i ? -.45 : .35) : 0, stage >= 2 || stage === 1 && i < count - 1 ? 'cleaned' : undefined)
    }
    add('wash-brush', 'washBrush', stage === 1 ? [-2.33, .02, -1.52] : [2.55, .82, 1.88], 4)
    add('cleaning-broom', 'broom', stage === 2 ? [.8, .018, .8] : [2.65, .018, 2.3], 1, .2)
    add('wash-detergent', 'bottle', [2.12, .82, 1.92], 4)
    add('waste-collector', 'caddy', [2.32, .1, 1.9], 1)
    for (let i = 0; i < (busy ? 14 : 7); i++) {
      const x = scattered ? -.85 - i % 4 * .22 : -.35 + i % 5 * .38
      const z = scattered ? 1.2 + Math.floor(i / 4) * .27 : .65 + Math.floor(i / 5) * .3
      add(`ground-paper-${i}`, 'paperSet', stage >= 2 ? [2.17 + i % 3 * .1, .12 + Math.floor(i / 3) * .018, 1.85 + i % 2 * .1] : [x, .018, z], 2, stage >= 2 ? 0 : i * 1.7, 'shredded')
    }
    for (let i = 0; i < (busy ? 5 : 3); i++) add(`ground-stain-${i}`, 'outdoorStain', [scattered ? -.85 + i * .24 : .3 + i * .32, .018, scattered ? 1.1 : .92], 3, i, stage >= 3 ? 'cleaned' : undefined)
  } else if (scene === 'garden') {
    const count = busy ? 5 : 3
    const places: Vec3[] = [[-.8, .018, .5], [.9, .018, 1.45], [-.1, .018, 2.2], [-1.45, .018, .1], [1.45, .018, .7]]
    for (let i = 0; i < count; i++) {
      const p = places[i], initial: Vec3 = scattered ? [p[0] - .55, p[1], p[2] - .2] : p
      add(`garden-pot-${i}`, 'pottedPlant', stage >= 2 ? [1.9 + i % 2 * .6, .018, .45 + Math.floor(i / 2) * .67] : initial, i % 2 ? 2 : 0, i * .7)
    }
    for (let i = 0; i < (busy ? 28 : 14); i++) {
      const initial: Vec3 = scattered ? [-1.65 + i % 3 * .16, .018, -.75 + Math.floor(i / 3) * .3] : [-.65 + i % 5 * .35, .018, .7 + Math.floor(i / 5) * .4]
      add(`garden-leaf-${i}`, 'gardenLeaf', stage >= 1 ? [2.4 + i % 4 * .065, .094 + Math.floor(i / 8) * .018, 2 + i % 3 * .075] : initial, i % 2 ? 5 : 0, i * 2.1)
    }
    add('garden-broom', 'broom', stage === 1 ? [.48, .018, .4] : [-2.95, .018, 1.95], 1, -.15)
    const toolBase: Vec3 = stage === 3 || scattered ? [-2.5, .8, 1.8] : [0, .9, -2.14]
    add('garden-trowel', 'trowel', toolBase, 6, .3)
    add('garden-gloves', 'gloves', [toolBase[0] + .3, toolBase[1], toolBase[2]], 1)
    add('garden-watering-can', 'wateringCan', stage === 2 ? [1.36, .018, -.12] : [-2.75, .32, 1.8], 1)
    if (scattered && stage === 0) currentStep = { ...currentStep, station: [-1.25, 0, 1.75], heading: Math.PI }
  } else {
    const count = busy ? 12 : 6, deployed = stage === 1 || stage === 2
    for (let rack = 0; rack < (busy ? 2 : 1); rack++) {
      const at: Vec3 = deployed ? scattered ? [.8, .018, 1.85] : [2.6, .018, -.15 + rack * 1.65] : [-3.25, .018, rack * .35]
      add(`popup-rack-${rack}`, 'displayRack', at, 1, 0, deployed ? undefined : 'folded')
    }
    const supply: Vec3 = scattered ? [2.65, .018, -1.93] : [-2.65, .018, -1.93]
    for (let box = 0; box < (busy ? 2 : 1); box++) add(`popup-stock-box-${box}`, 'produceCrate', [supply[0], .018, supply[2] + box * .9], 1)
    for (let i = 0; i < count; i++) {
      const onShelf = stage === 2 || stage === 1 && i % 6 < 3
      const rack = Math.floor(i / 6), column = i % 3, shelf = Math.floor(i % 6 / 3)
      const at: Vec3 = onShelf ? [scattered ? .44 + column * .36 : 2.24 + column * .36, .478 + shelf * .52, scattered ? 1.85 : -.15 + rack * 1.65] : [supply[0] - .24 + column * .24, .038, supply[2] - .16 + shelf * .32 + rack * .9]
      add(`popup-product-${i}`, i % 2 ? 'bottle' : 'carton', at, [0, 4, 5][column])
    }
    add('popup-sign', 'signBoard', deployed ? [-2.4, .018, 1.6] : [1.3, .018, -2.13], 4, deployed ? -.2 : 0, deployed ? undefined : 'folded')
    add('popup-cloth', 'cloth', stage === 2 ? [.28, .91, -.95] : [-.9, .91, -.95], 1)
    for (let i = 0; i < (busy ? 6 : 3); i++) add(`popup-wrap-${i}`, 'paperSet', stage >= 2 ? [3.32, .24 + i * .016, 2.16] : [scattered ? -.7 + i * .16 : -.7 + i * .22, .018, scattered ? 1.9 : .72], 2, .4 * i, 'shredded')
    if (scattered && (stage === 0 || stage === 3)) currentStep = { ...currentStep, station: [1.8, 0, .05], heading: 0 }
    if (scattered && stage === 1) currentStep = { ...currentStep, station: [.8, 0, .72], heading: -Math.PI / 2 }
  }
  return { scene, stage, variant, step: currentStep, objects, poses: {
    g1: { right_shoulder_pitch_joint: -.28, right_elbow_joint: .65, left_shoulder_pitch_joint: -.14, left_elbow_joint: .55 },
    s1: { astribot_torso_joint_1: .65, astribot_torso_joint_2: -1.3, astribot_torso_joint_3: .65, astribot_arm_left_joint_4: .8, astribot_arm_right_joint_4: .8 },
  } }
}

export function outdoorRobotValue(robot: RobotId, scene: OutdoorSceneId) {
  const subject = { cleanup: '桶位与清洗位置', garden: '花坛与用品位置', popup: '展架与周转物料' }[scene]
  if (robot === 's1') return `绳驱有助于减少非任务性的细微抖动，让${subject}之间的操作记录更平稳。室外配置还需按地面条件确认。`
  if (robot === 'h2') return `成人尺度的可达范围，让${subject}之间的高度差、站位与身体姿态共同进入任务设计。`
  if (robot === 'luna') return `围绕${subject}组织移动与操作，轮式路径需结合路面平整度、坡度和通道条件确认。`
  return `在${subject}之间连接转向、接近与双臂操作，保留身体状态和对象转移的对应。`
}
