import { sceneById } from './robot-data-miniature-catalog'
import type { RobotId, Vec3 } from './robot-data-miniature-catalog'
import type { TaskFrame, TaskObject, TaskSequence, TaskStep, TaskVariant } from './robot-data-miniature-tasks'

const step = (id: string, name: string, value: string, station: Vec3, heading: number): TaskStep => {
  const room = sceneById('office')
  return { id, name, value, station, heading, target: room.target, camera: room.camera }
}
export const OFFICE_SEQUENCE: TaskSequence = {
  id: 'office-document-reset', title: '文件处理与工位复位', goal: '文件各有去向，设备和工位重新就绪。',
  variants: [
    { id: 'everyday', name: '单组文件', value: '处理一组原稿与输出件，归档后移开桌面用品，再清洁操作区域。' },
    { id: 'busy', name: '双组文件', value: '原稿、输出件和归档文件夹各增至两组，废纸数量同步增加，保持不同文件的归档对应。' },
    { id: 'scattered', name: '跨工位补纸', value: '原稿分置另一工位，打印机供纸位为空，备用纸留在共享柜台；桌面用品和待清洁位置也有变化。' },
  ],
  steps: [
    step('prepare', '备齐文件与纸张', '区分原稿、待输出用纸与废纸，确认设备供纸和桌面物品的初始状态。', [.9, 0, 1.15], Math.PI),
    step('print', '打印与取件', '原稿进入扫描位，输出件出现在接纸盘；缺纸条件下先补纸，再继续文件处理。', [2.82, 0, -.84], Math.PI / 2),
    step('file', '分类归档', '原稿、输出件与对应文件夹转入归档区，废纸进入碎纸回收区；笔记本和笔筒暂移到整理车，腾出清洁区域。', [1.46, 0, .45], 0),
    step('clean', '清洁并复位', '在已腾空的区域清洁，污迹消退后恢复笔记本和文具的位置，文件仍留在归档区。', [.9, 0, 1.15], Math.PI),
  ],
}
export const OFFICE_SURFACES = {
  desk: { center: [-.7, .78, 1.15] as Vec3, width: 1.55, depth: .8 },
  otherDesk: { center: [-2.7, .78, 1.15] as Vec3, width: 1.55, depth: .8 },
  feed: { center: [2.82, .845, -1.73] as Vec3, width: .61, depth: .32 },
  scanner: { center: [2.82, 1.19, -2.28] as Vec3, width: .82, depth: .5 },
  output: { center: [2.82, 1.015, -1.71] as Vec3, width: .72, depth: .34 },
  archive: { center: [3.0, .94, .45] as Vec3, width: 1.6, depth: .74 },
  supplies: { center: [1.49, .94, -2.4] as Vec3, width: .85, depth: .6 },
  shredBin: { center: [3.47, .4, 1.91] as Vec3, width: .43, depth: .32 },
  cart: { center: [.55, .8, 2.51] as Vec3, width: 1.12, depth: .68 },
}
type Support = keyof typeof OFFICE_SURFACES
export function officeTaskFrame(stage: number, variant: TaskVariant): TaskFrame {
  const count = variant === 'busy' ? 2 : 1, scattered = variant === 'scattered', objects: TaskObject[] = []
  const add = (id: string, kind: TaskObject['kind'], support: Support, dx: number, dz: number, tone: number, form?: TaskObject['form'], rotation = 0) => {
    const [x, y, z] = OFFICE_SURFACES[support].center
    objects.push({ id, kind, support, position: [x + dx, y, z + dz], tone, form, rotation })
  }
  for (let i = 0; i < count; i++) {
    add(`source-file-${i}`, 'paperSet', stage === 0 ? scattered ? 'otherDesk' : 'desk' : stage === 1 ? 'scanner' : 'archive', stage === 0 ? -.46 + i * .92 : stage === 1 ? -.2 + i * .4 : -.49 + i * .5, stage === 0 ? .18 : stage === 1 ? 0 : -.17, 4, 'printed', scattered && stage === 0 ? .24 : 0)
    add(`output-file-${i}`, 'paperSet', stage === 0 ? scattered ? 'supplies' : 'feed' : stage === 1 ? 'output' : 'archive', stage < 2 ? -.16 + i * .32 : -.49 + i * .5, stage < 2 ? 0 : .17, 1, stage === 0 ? undefined : 'printed')
    add(`waste-paper-${i}`, 'paperSet', stage < 2 ? 'otherDesk' : 'shredBin', stage < 2 ? .04 + i * .4 : -.1 + i * .2, stage < 2 ? .14 : 0, 3, stage < 2 ? 'printed' : 'shredded', stage < 2 ? -.18 : 0)
    add(`file-folder-${i}`, 'fileFolder', stage < 2 ? 'supplies' : 'archive', stage < 2 ? scattered ? .23 : -.22 + i * .44 : .5, stage < 2 ? 0 : -.18 + i * .36, i ? 0 : 4)
  }
  add('work-notebook', 'book', stage === 2 ? 'cart' : 'desk', stage === 2 ? -.31 : 0, stage === 2 ? 0 : .21, 4, undefined, scattered && stage === 0 ? -.35 : 0)
  add('work-pen-cup', 'penPot', stage === 2 ? 'cart' : 'desk', stage === 2 ? .05 : scattered && stage < 2 ? .54 : -.57, stage === 2 ? 0 : -.23, 1)
  add('cleaning-pad', 'cleaningPad', stage === 3 ? 'desk' : 'cart', stage === 3 ? scattered ? -.43 : .46 : .38, stage === 3 ? .19 : .05, 4)
  add('desk-mark', 'deskMark', 'desk', scattered ? -.43 : .46, .19, 3, stage === 3 ? 'cleaned' : undefined)
  return { scene: 'office', stage, variant, step: OFFICE_SEQUENCE.steps[stage], objects, poses: {
    g1: { right_shoulder_pitch_joint: -.28, right_elbow_joint: .65, left_shoulder_pitch_joint: -.1, left_elbow_joint: .6 },
    s1: { astribot_torso_joint_1: stage === 0 || stage === 3 ? .85 : .66, astribot_torso_joint_2: stage === 0 || stage === 3 ? -1.7 : -1.32, astribot_torso_joint_3: stage === 0 || stage === 3 ? .85 : .66, astribot_arm_left_joint_4: .8, astribot_arm_right_joint_4: .8 },
  } }
}
export function officeRobotValue(robot: RobotId) {
  if (robot === 's1') return '绳驱有助于减少非任务性的细微抖动，让纸张、文具和设备界面的连续操作记录更平稳，减少动作监督中的额外噪声。'
  if (robot === 'h2') return '成人尺度的身体需要适应桌椅间距与设备高度，把站位调整、俯身和双臂操作连在一起。'
  if (robot === 'luna') return '轮式底盘衔接工位与共享设备，躯干调整适应桌面和接纸盘的不同高度，保留移动到操作的上下文。'
  return '桌面整理与设备操作需要协调身体朝向、手部接近和物品转移，让小物件处理保留全身状态的对应。'
}
