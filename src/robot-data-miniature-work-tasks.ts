import { sceneById } from './robot-data-miniature-catalog'
import type { RobotId, SceneId, Vec3, WorkSceneId } from './robot-data-miniature-catalog'
import type { TaskFrame, TaskObject, TaskSequence, TaskStep, TaskVariant } from './robot-data-miniature-tasks'

export const isWorkScene = (id: SceneId): id is WorkSceneId => id === 'garage' || id === 'warehouse' || id === 'workcell'
const step = (scene: WorkSceneId, id: string, name: string, value: string, station: Vec3, heading: number): TaskStep => {
  const room = sceneById(scene)
  return { id, name, value, station, heading, target: room.target, camera: room.camera }
}

export const WORK_SEQUENCES: Record<WorkSceneId, TaskSequence> = {
  garage: {
    id: 'garden-preparation', title: '庭院用品准备与归位', goal: '从车库收纳出发，为一次庭院种植备齐用品。',
    variants: [
      { id: 'everyday', name: '单人种植', value: '一把手铲、一副手套与一包种子，按用途备齐，再回到各自的收纳位。' },
      { id: 'busy', name: '双人协作', value: '增加一套手铲、手套和种子，分别备齐两人的用品，回收时逐组清点。' },
      { id: 'scattered', name: '用后散放', value: '手套留在园艺台，手铲与种子散放在收纳车，取用位置和朝向同时改变。' },
    ],
    steps: [
      step('garage', 'identify', '清点庭院用品', '区分手铲、手套与种子，确认它们当前的收纳位置与可抓取部位。', [-1.48, 0, .05], Math.PI),
      step('garage', 'retrieve', '分类取用', '先将种子送到园艺台，再归集工具；柔软的手套与刚性的手铲采用不同的整理方式。', [-1.6, 0, -.75], Math.PI / 2),
      step('garage', 'prepare', '备齐种植用品', '按人份把用品排在园艺台上，核对每组是否齐备，为进入庭院做好准备。', [-1.55, 0, -1.23], Math.PI / 2),
      step('garage', 'return', '清点收纳', '将用品归回收纳车，清空准备台；识别物品的用途，也记住它下一次取用的位置。', [-1.48, 0, .05], Math.PI),
    ],
  },
  warehouse: {
    id: 'order-consolidation', title: '订单拣配与移交', goal: '从入库货件，到可核对、可移交的出库批次。',
    variants: [
      { id: 'everyday', name: '小批来货', value: '三件不同尺寸的货件，经分区、包装与出库移交。' },
      { id: 'busy', name: '批量来货', value: '来货增至六件，分别对应两个分区，并分批完成包装移交。' },
      { id: 'scattered', name: '混合到货', value: '货件在收货台与侧架交错到达，标签方向和取件位置不同。' },
    ],
    steps: [
      step('warehouse', 'receive', '识别来货', '确认货件尺寸与标签朝向，建立入库对象和目标分区的对应关系。', [-1.5, 0, .12], Math.PI),
      step('warehouse', 'sort', '按区拣配', '将同一批货件分至两个拣配位置，保留货件身份与目标区域的对应。', [-1.1, 0, -1.38], Math.PI / 2),
      step('warehouse', 'pack', '包装与复核', '货件进入打包台，封装后再核对标签，让包装状态和对象位置共同进入记录。', [.12, 0, -.18], -Math.PI / 2),
      // Approach from the front aisle; the west side of outbound is occupied by the packing bench.
      step('warehouse', 'handover', '集中移交', '封装货件移至出库滚筒台，以批次完整和收货区清空核对结束状态。', [1.87, 0, 2.3], Math.PI / 2),
    ],
  },
  workcell: {
    id: 'harness-assembly', title: '线束装配与紧固', goal: '从连接器对位，到布线固定与装配复核。',
    variants: [
      { id: 'everyday', name: '单套装配', value: '一套模块与线束，依次完成插接、沿槽布线、压线固定和螺钉紧固。' },
      { id: 'busy', name: '双套并行', value: '增加一套独立编号的模块与线束，在双夹具上并行组织，避免线束与目标模块错配。' },
      { id: 'scattered', name: '来料转向', value: '模块转向后放在后侧备料台，线束保持松散；重新识别接口方向，再恢复一致的装配目标。' },
    ],
    steps: [
      step('workcell', 'identify', '套件核对', '核对连接器键位、模块接口与螺钉位置。松散来料先建立对应关系，再进入装配夹具。', [-1.4, 0, .02], Math.PI),
      step('workcell', 'connect', '对位插接', '模块进入定位板，连接器沿键位插入。到达目标位置与真正插接到位，是两个不同的状态。', [-.1, 0, 1.2], Math.PI / 2),
      step('workcell', 'fasten', '布线与紧固', '沿导向槽整理线束，压线夹固定走向，再紧固安装螺钉；保留顺序、接触与形变的关系。', [.34, 0, 1.2], Math.PI / 2),
      step('workcell', 'inspect', '检测与复核', '装配件转入通断检测位，复核连接、布线和紧固状态，区分过程完成与结果合格。', [2.45, 0, .28], Math.PI / 2),
    ],
  },
}

// Surface coordinates are shared by the room builders and task states, in metres.
export const WORK_SURFACES = {
  garage: {
    intake: { center: [-2.65, .86, .08] as Vec3, width: .9, depth: 1.12 },
    bench: { center: [-1.6, .98, -2.42] as Vec3, width: 2.75, depth: .94 },
  },
  warehouse: {
    intake: { center: [-2.65, .86, .1] as Vec3, width: 1.05, depth: 1.75 },
    buffer: { center: [-1.1, .96, -2.45] as Vec3, width: 3.8, depth: 1.0 },
    packing: { center: [-.55, .94, 1.0] as Vec3, width: 2.6, depth: 1.05 },
    outbound: { center: [1.87, .8, .78] as Vec3, width: 1.8, depth: 1.55 },
  },
  workcell: {
    intake: { center: [-2.65, .88, .08] as Vec3, width: 1.05, depth: 1.45 },
    buffer: { center: [-.65, .98, -2.54] as Vec3, width: 4.55, depth: .9 },
    fixture: { center: [.15, 1.006, -.25] as Vec3, width: 2.15, depth: 1.08 },
    output: { center: [2.45, .98, -1.3] as Vec3, width: 1.75, depth: 1.12 },
  },
}

export function workTaskFrame(scene: WorkSceneId, stage: number, variant: TaskVariant): TaskFrame {
  const count = variant === 'busy' ? 6 : 3, scattered = variant === 'scattered'
  const objects: TaskObject[] = []
  const add = (id: string, kind: TaskObject['kind'], position: Vec3, tone: number, rotation: number, support: string, form?: TaskObject['form']) => objects.push({ id, kind, position, tone, rotation, support, form })
  if (scene === 'workcell') {
    for (let i = 0; i < (variant === 'busy' ? 2 : 1); i++) {
      let at: Vec3 = [-2.65, .88, -.29 + i * .7], support = 'intake'
      if (!stage && scattered) { at = [-1.45, .98, -2.54]; support = 'buffer' }
      if (stage === 1 || stage === 2) { at = [-.36 + i * 1.0, 1.006, -.25]; support = 'fixture' }
      if (stage === 3) { at = [2.03 + i * .83, .98, -1.3]; support = 'output' }
      add(`harness-module-${i}`, 'harnessModule', at, i ? 4 : 1, !stage && scattered ? Math.PI / 2 : 0, support, stage === 0 ? 'spread' : stage === 1 ? 'connected' : stage === 2 ? 'secured' : 'tested')
    }
    add('torque-driver', 'torqueDriver', [-2.13, .98, -2.54], 4, 0, 'buffer')
  }
  for (let i = 0; scene !== 'workcell' && i < count; i++) {
    const col = i % 2, row = Math.floor(i / 2)
    let at: Vec3, support = 'intake', rotation = 0
    if (scene === 'garage') {
      at = [-2.84 + col * .36, .86, -.23 + row * .3]
      if (stage < 2 && scattered) { at = i === 1 ? [-1.45, .98, -2.43] : [-2.78 + (i ? .26 : 0), .86, i ? -.26 : .31]; support = i === 1 ? 'bench' : 'intake'; rotation = [.65, -.9, 1.1][i] }
      if (stage === 1 && i % 3 === 2 || stage === 2) { at = [-2.42 + i % 3 * .73, .98, -2.6 + Math.floor(i / 3) * .35]; support = 'bench'; rotation = 0 }
      if (stage === 3) at = [-2.92 + i % 3 * .27, .86, -.18 + Math.floor(i / 3) * .46]
      add(`garden-item-${i}`, (['trowel', 'gloves', 'seedPacket'] as const)[i % 3], at, i % 3 === 1 ? 0 : 1, rotation, support)
    } else if (scene === 'warehouse') {
      at = [-2.9 + col * .48, .86, -.44 + row * .5]
      if (!stage && scattered) { at = i === 1 ? [-1.85, .96, -2.44] : [-2.79 + (i ? .34 : 0), .86, i ? -.42 : .51]; support = i === 1 ? 'buffer' : 'intake'; rotation = [.5, -.7, 1.0][i] }
      if (stage === 1) { at = [-2.55 + i % 3 * 1.0, .96, -2.68 + Math.floor(i / 3) * .46]; support = 'buffer' }
      if (stage === 2) { at = [-1.47 + i % 3 * .69, .94, .78 + Math.floor(i / 3) * .46]; support = 'packing' }
      if (stage === 3) { at = [1.34 + i % 3 * .51, .8, .47 + Math.floor(i / 3) * .59]; support = 'outbound' }
      add(`shipment-${i}`, 'parcel', at, i % 3, rotation, support, stage >= 2 ? 'sealed' : undefined)
    }
  }
  return {
    scene, stage, variant, step: WORK_SEQUENCES[scene].steps[stage], objects,
    poses: {
      g1: { right_shoulder_pitch_joint: -.38, right_elbow_joint: .65, left_shoulder_pitch_joint: -.18, left_elbow_joint: .6 },
      s1: { astribot_torso_joint_1: .62, astribot_torso_joint_2: -1.24, astribot_torso_joint_3: .62, astribot_arm_left_joint_4: .82, astribot_arm_right_joint_4: .82 },
    },
  }
}

export function workRobotValue(robot: RobotId, scene: WorkSceneId, stage: number): string {
  if (scene === 'workcell') {
    if (robot === 's1') return '插接和布线中的细微抖动可能进入动作监督。绳驱有助于减少非任务性抖动，让接触前后的连续动作记录更平稳。'
    if (robot === 'h2') return '成人尺度的身体适应装配台和检测位，站位、双臂协同与末端精细操作共同构成装配经验。'
    if (robot === 'luna') return '轮式底盘衔接备料、装配和检测位，折叠躯干适应台面高度，让移动与接触操作保留在同一序列中。'
    return stage === 2 ? '布线与紧固同时涉及柔性线束、刚性夹具和工具，让双手分工与全身稳定共同参与操作。' : '从接口方向到插接到位，站位与双臂姿态随装配目标调整，保留接近、接触和结果之间的关系。'
  }
  if (robot === 's1') return '工具与零件的连续取放，对非任务性抖动更敏感。绳驱有助于减少细微抖动，保留平稳的动作记录与对象衔接。'
  if (robot === 'h2') return scene === 'garage' ? '成人尺度的身体在家庭收纳车与园艺台之间调整站位，让接近距离、用品形态和全身姿态共同进入任务。' : '工位、物料和通道共同约束成人尺度的操作空间，身体调整与取放顺序属于同一段经验。'
  if (robot === 'luna') return '轮式底盘连接分散工位，躯干调整适应台面高度，让接近、定位与双臂操作保留在同一任务上下文中。'
  return '在收纳位与操作台之间组织全身协同，让物体转移、身体朝向和下一步操作相互衔接。'
}
