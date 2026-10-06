import { sceneById } from './robot-data-miniature-catalog'
import type { RobotId, SceneId, Vec3, WorkSceneId, OutdoorSceneId } from './robot-data-miniature-catalog'
import type { TaskFrame, TaskObject, TaskSequence, TaskStep, TaskVariant } from './robot-data-miniature-tasks'

type AdditionalScene = Exclude<SceneId, 'kitchen' | 'cafe' | 'care' | 'sushi' | 'produce' | 'office' | WorkSceneId | OutdoorSceneId>
const step = (scene: AdditionalScene, id: string, name: string, value: string, station: Vec3, heading = 0): TaskStep => {
  const room = sceneById(scene)
  return { id, name, value, station, heading, target: room.target, camera: room.camera }
}

const cartPosition = (center: Vec3, heading: number, x: number, z: number, stack = 0): Vec3 => [
  center[0] + x * Math.cos(heading) + z * Math.sin(heading),
  .532 + stack * .061,
  center[2] - x * Math.sin(heading) + z * Math.cos(heading),
]

export const ADDITIONAL_SEQUENCES: Record<AdditionalScene, TaskSequence> = {
  living: {
    id: 'living-reset', title: '会客后归置', goal: '从使用后的客厅，到各归其位的日常。',
    variants: [
      { id: 'everyday', name: '日常使用', value: '两本书、一只杯，保留清晰的归置关系。' },
      { id: 'busy', name: '多人会客', value: '书刊与杯具增加，分别归整并核对去向。' },
      { id: 'scattered', name: '分散摆放', value: '数量不变，改变书刊位置和杯柄朝向。' },
    ],
    steps: [
      step('living', 'identify', '识别归类', '区分书刊、杯具与遥控器，为不同对象确定各自的归置目标。', [-.95, 0, .38]),
      step('living', 'books', '书刊归整', '先归拢同类书刊，避免把物体的位置变化误判为任务已经完成。', [-.97, 0, .66]),
      step('living', 'transfer', '分区归位', '书刊进入收纳筐，杯具移至边柜，将类别判断连接到不同的放置位置。', [-1.03, 0, .87], Math.PI),
      step('living', 'reset', '桌面复位', '在物品转移后清理桌面，保留遥控器的固定位置，形成可核对的结束状态。', [-.96, 0, .38]),
    ],
  },
  bedroom: {
    id: 'clothes-away', title: '衣物整理收纳', goal: '让不同形态的衣物，走向有序的收纳。',
    variants: [
      { id: 'everyday', name: '日常衣物', value: '少量衣物与毛巾，连接分类、折叠和收纳。' },
      { id: 'busy', name: '集中整理', value: '处理数量加倍，按类别分别堆叠。' },
      { id: 'scattered', name: '混合摆放', value: '改变初始朝向与散放位置，归置目标不变。' },
    ],
    steps: [
      step('bedroom', 'collect', '确认待整衣物', '区分衣物与毛巾，观察展开程度与可接近的位置。', [.98, 0, -.59], Math.PI),
      step('bedroom', 'sort', '按类归拢', '把分类结果落实到床面的两个整理区域，为后续折叠保留操作空间。', [1.02, 0, -1.14], Math.PI),
      step('bedroom', 'fold', '折叠成组', '展开物体转为紧凑形态，关注形态变化、放置方向与堆叠关系。', [.95, 0, -.46], Math.PI),
      step('bedroom', 'store', '入筐收纳', '将折叠后的衣物按组放入收纳筐，以床面清空和物品去向共同判断完成。', [.76, 0, 1.3]),
    ],
  },
  bathroom: {
    id: 'vanity-reset', title: '洗漱台整理', goal: '在有限台面上，重新组织日常用品。',
    variants: [
      { id: 'everyday', name: '基础用品', value: '三件瓶装用品与毛巾，完成分区归置。' },
      { id: 'busy', name: '多人共用', value: '瓶罐与毛巾增加，保持台面分区与对象对应。' },
      { id: 'scattered', name: '位置打散', value: '改变瓶罐的摆放与朝向，保留同一套归置目标。' },
    ],
    steps: [
      step('bathroom', 'survey', '清点用品', '沿洗漱台确认瓶罐和毛巾，区分不同区域内的待整理对象。', [-.3, 0, -1.05], Math.PI / 2),
      step('bathroom', 'gather', '分类集中', '将分散的瓶装用品集中至收纳盘，持续保持对象身份与类别的对应。', [-.3, 0, -1.19], Math.PI / 2),
      step('bathroom', 'zone', '分区归位', '瓶罐与毛巾分别归置，给水盆和前沿台面留出使用空间。', [.25, 0, -1.13], Math.PI / 2),
      step('bathroom', 'wipe', '台面复位', '在归位后清理空出的台面，将物体整理与空间恢复连接起来。', [.5, 0, -1.11], Math.PI / 2),
    ],
  },
  retail: {
    id: 'shelf-restock', title: '分拣补货上架', goal: '从待补货品，到有序可取的货架。',
    variants: [
      { id: 'everyday', name: '常规补货', value: '三件待补商品，分别对应指定货位。' },
      { id: 'busy', name: '增加批量', value: '补货数量加倍，覆盖两层货位与分批转移。' },
      { id: 'scattered', name: '交错货位', value: '改变来货摆放与目标层位，保持商品和货位的对应。' },
    ],
    steps: [
      step('retail', 'collect', '确认来货', '从周转车识别待补商品，将对象类别与目标货位建立对应。', [-1.04, 0, .78], Math.PI),
      step('retail', 'sort', '按类分拣', '在周转筐中按类归集，明确待上架和已归类的对象。', [.1, 0, 1.39]),
      step('retail', 'shelve', '分层上架', '同一批商品转移至不同层位，让可达高度与身体调整进入任务上下文。', [-1.2, 0, -.87], Math.PI / 2),
      step('retail', 'face', '朝向理齐', '商品到达货位后再调整朝向与前沿位置，把放入货架和摆放完成区分开。', [-1.07, 0, -.81], Math.PI / 2),
    ],
  },
  checkout: {
    id: 'checkout-handover', title: '商品结账装袋', goal: '从待结商品，到可以移交的购物袋。',
    variants: [
      { id: 'everyday', name: '日常购物', value: '少量盒装与罐装商品，经过扫描后分类装袋。' },
      { id: 'busy', name: '满筐商品', value: '商品数量加倍，重复执行扫描与装袋环节。' },
      { id: 'scattered', name: '交错摆放', value: '改变商品初始位置与朝向，扫描位置保持固定。' },
    ],
    steps: [
      step('checkout', 'queue', '确认待结商品', '识别输送台上的商品，区分当前对象与后续待处理队列。', [-.64, 0, -.63]),
      step('checkout', 'scan', '逐件扫描', '每次将一件商品送至扫描位，再继续处理队列中的下一件，保留重复子任务的顺序。', [-.63, 0, .13]),
      step('checkout', 'bag', '分类装袋', '在扫描完成后按类别装入不同纸袋，避免遗漏、重复与对象去向混淆。', [-.64, 0, .67]),
      step('checkout', 'handover', '移交就绪', '购物袋集中到取货端，收据与商品一起构成可核对的交接状态。', [-.65, 0, 1.08]),
    ],
  },
  laundry: {
    id: 'linen-turnover', title: '布草整理周转', goal: '把待整布草，组织成可接续的周转单元。',
    variants: [
      { id: 'everyday', name: '少量布草', value: '三件待整布草，依次分类、折叠与装筐。' },
      { id: 'busy', name: '集中周转', value: '处理数量加倍，保持每一组布草的去向。' },
      { id: 'scattered', name: '混合堆放', value: '展开布草与折叠堆放混合，改变朝向和接取次序。' },
    ],
    steps: [
      step('laundry', 'receive', '接取待整布草', '从周转车接取布草，观察初始堆叠与可接近的位置。', [-.46, 0, 1.34], Math.PI),
      step('laundry', 'sort', '分类摊放', '在工作台上展开并分区，让类别判断转化为后续操作的起点。', [-.82, 0, .37]),
      step('laundry', 'fold', '折叠成组', '按组折叠并堆叠，保留柔性物体由展开到紧凑形态的状态关系。', [-.82, 0, .66]),
      step('laundry', 'dispatch', '装筐周转', '分类后的布草进入不同周转筐，核对台面是否清空以及各组是否齐备。', [.75, 0, 1.48], -Math.PI / 2),
    ],
  },
}

export function additionalTaskFrame(scene: AdditionalScene, stage: number, variant: TaskVariant): TaskFrame {
  const count = variant === 'busy' ? 6 : 3
  const scattered = variant === 'scattered'
  const objects: TaskObject[] = []
  const add = (id: string, kind: TaskObject['kind'], position: Vec3, tone = 0, rotation = 0, form?: TaskObject['form']) => objects.push({ id, kind, position, tone, rotation, ...(form ? { form } : {}) })

  if (scene === 'living') {
    const bookCount = variant === 'busy' ? 4 : 2, cups = variant === 'busy' ? 2 : 1
    for (let i = 0; i < bookCount; i++) {
      const spread: Vec3[] = [[-.38, .494, .46], [.34, .494, .17]]
      const at: Vec3 = stage === 0 ? scattered ? spread[i] : [-.35 + i % 2 * .4, .494, .15 + Math.floor(i / 2) * .3] : stage === 1 ? [-.25, .494 + i * .026, .3] : [-1.21, .043 + i * .026, 1.76]
      add(`book-${i}`, 'book', at, i % 2 ? 0 : 4, scattered && stage === 0 ? (i % 2 ? -.55 : .6) : 0)
    }
    for (let i = 0; i < cups; i++) add(`cup-${i}`, 'cup', stage < 2 ? [.61, .494, scattered ? .51 : .17 + i * .3] : [-1.89, .391, .35 + i * .15], i, scattered && stage < 2 ? 1.7 : 0)
    add('remote', 'remote', stage === 3 ? [.52, .494, .48] : [-.12, .494, .59], 7, stage === 3 ? 0 : -.4)
    add('wipe-cloth', 'cloth', stage === 3 ? [-.15, .5, .39] : [-1.88, .398, -.85], 1)
  } else if (scene === 'bedroom') {
    for (let i = 0; i < count; i++) {
      const folded = stage >= 2
      const z = [-.4, 0, .42][Math.floor(i / 2)]
      const x = -.77 + i % 2 * .64
      const spread: Vec3[] = [[-.84, .632, -.1], [.14, .632, -.44], [-.13, .677, .4]]
      let at: Vec3 = scattered && stage === 0 ? spread[i] : [x, z > .17 ? .677 : .632, z]
      if (stage === 1) at = [-.79 + i % 2 * .77, z > .17 ? .677 : .632, z]
      if (stage === 2) at = [-.73 + i % 2 * .65, .677 + Math.floor(i / 2) * .061, .42]
      if (stage === 3) at = [1.4, .045 + Math.floor(i / 2) * .061, .88 + i % 2 * .22]
      else at[2] -= .86
      add(`clothes-${i}`, i % 2 ? 'linen' : 'garment', at, i % 2 ? 2 : 4, scattered && !stage ? [.52, -.6, -.22][i] : 0, folded ? 'folded' : 'spread')
    }
  } else if (scene === 'bathroom') {
    const caddyX = stage < 2 ? .99 : -.16
    add('toiletry-caddy', 'caddy', [caddyX, .814, -1.68], 3)
    for (let i = 0; i < count; i++) {
      const spread: Vec3[] = [[-.31, .815, -1.42], [.1, .815, -1.83], [.83, .815, -1.36]]
      const at: Vec3 = stage === 0 ? scattered ? spread[i] : [-.3 + i % 2 * .19, .815, -1.81 + Math.floor(i / 2) * .19] : [caddyX - .09 + i % 2 * .17, .824, -1.82 + Math.floor(i / 2) * .14]
      add(`toiletry-${i}`, 'bottle', at, i % 2 ? 4 : 0, scattered && !stage ? [-1.2, .9, 2.3][i] : 0)
    }
    for (let i = 0; i < (variant === 'busy' ? 3 : 1); i++) add(`towel-${i}`, 'linen', stage < 2 ? [-.98, .045 + i * .061, 1.52] : [.99, .814 + i * .061, -1.77], 2, 0, 'folded')
    add('wipe-cloth', 'cloth', stage === 3 ? [.97, .82, -1.36] : [.65, .594, 1.03], 1)
    for (const object of objects) {
      if (object.position[2] < -1.2) object.position[2] -= .4
      else if (object.id === 'wipe-cloth') { object.position[0] += .55; object.position[1] += .014 }
    }
  } else if (scene === 'retail') {
    for (let i = 0; i < count; i++) {
      const col = i % 3, row = Math.floor(i / 3)
      let at: Vec3 = [-1.99 + i % 2 * .18, .532, .72 + Math.floor(i / 2) * .18]
      if (!stage && scattered) {
        const [x, z] = [[.07, -.21], [-.1, .17], [.1, .06]][i]
        at = cartPosition([-1.9, 0, .9], .12, x, z)
      }
      if (stage === 1) at = [.78 + col * .24, .045, 1.49 + row * .22]
      if (stage >= 2) at = [-1.9267 + col * .3183, .636 + (scattered ? 1 - row : row) * .4575, stage === 2 ? -1.74 : -1.58]
      add(`stock-${i}`, i % 2 ? 'can' : 'carton', at, i % 2 ? 0 : 4, stage === 3 ? 0 : stage === 2 ? Math.PI / 2 : scattered && !stage ? [.8, -.7, 1.3][i] : 0)
    }
  } else if (scene === 'checkout') {
    const bagPositions: Vec3[] = stage === 2 ? [[.51, .916, .39], [.65, .916, .99]] : [[.39, .916, 1.05], [.87, .916, 1.05]]
    bagPositions.forEach((at, i) => add(`shopping-bag-${i}`, 'bag', at, 3))
    for (let i = 0; i < count; i++) {
      let at: Vec3 = [.4 + i % 2 * .23, .936, -.72 + Math.floor(i / 2) * .22]
      if (scattered && stage < 2) at = [[.77, .936, -.67], [.27, .936, -.4], [.69, .936, -.12]][i] as Vec3
      if (stage === 1 && i === 0) at = [.12, .947, .2]
      if (stage >= 2) {
        const bag = bagPositions[i % 2], slot = Math.floor(i / 2)
        at = [bag[0] + (slot % 2 ? .065 : -.065), bag[1] + .012, bag[2] + (slot < 2 ? -.055 : .055)]
      }
      add(`purchase-${i}`, i % 2 ? 'can' : 'carton', at, i % 2 ? 0 : 4, stage === 1 && !i ? Math.PI / 2 : scattered && stage < 2 ? [.9, -.8, 1.7][i] : 0)
    }
    add('receipt', 'receipt', stage === 3 ? [.12, .916, 1.05] : [.27, 1.042, .765], 2)
  } else {
    for (let i = 0; i < count; i++) {
      const col = i % 3, row = Math.floor(i / 3)
      let at: Vec3 = [-1.46, .532 + i * .061, 1.45]
      if (scattered && !stage) at = cartPosition([-1.46, 0, 1.45], .1, i ? .01 : 0, i ? .14 : -.14, i === 2 ? 1 : 0)
      if (stage === 1) at = [.14 + col * .41, .854, .2 + row * .43]
      if (stage === 2) at = [.18 + i % 2 * .65, .854 + Math.floor(i / 2) * .061, .43]
      if (stage === 3) at = [i % 2 ? 1.52 : -.53, .056 + Math.floor(i / 2) * .061, 2.2]
      add(`linen-${i}`, 'linen', at, i % 2 ? 4 : 2, scattered && !stage ? (i ? -.08 : .2) : 0, stage === 1 || scattered && !stage && i === 0 ? 'spread' : 'folded')
    }
  }
  const low = scene === 'living' || scene === 'bedroom' || scene === 'laundry' && stage === 3 || scene === 'retail' && stage === 1
  const torso = low ? 1 : .65
  return {
    scene, stage, variant, step: ADDITIONAL_SEQUENCES[scene].steps[stage], objects,
    poses: {
      g1: { right_shoulder_pitch_joint: low ? .14 : -.42, right_elbow_joint: low ? .3 : .62, left_shoulder_pitch_joint: .1, left_elbow_joint: low ? .3 : .55 },
      s1: { astribot_torso_joint_1: torso, astribot_torso_joint_2: -2 * torso, astribot_torso_joint_3: torso, astribot_arm_left_joint_4: low ? .58 : .85, astribot_arm_right_joint_4: low ? .58 : .85 },
      h2: { right_shoulder_pitch_joint: low ? .12 : -.4, right_elbow_joint: low ? .28 : .6, left_shoulder_pitch_joint: .1 },
    },
  }
}

export function additionalRobotValue(robot: RobotId, scene: AdditionalScene, stage: number): string | undefined {
  if (robot === 's1') return scene === 'laundry' || scene === 'bedroom' ? '柔性物体的连续整理需要双臂协同。绳驱有助于减少细微抖动，让动作监督少一些非任务噪声。' : '绳驱有助于减少非任务性的细微抖动；在连续取放中，保留更平稳的动作记录与对象衔接。'
  if (robot === 'h2') {
    if (scene === 'retail') return stage < 2 ? '从周转容器到货架前的站位调整，将成人尺度的全身姿态与物体转移放在同一段任务中。' : '不同层位对应不同可达高度，让上肢操作、躯干姿态和接近距离共同进入任务设计。'
    if (scene === 'living' || scene === 'bedroom') return '成人尺度的身体面对低处物品时，需要协调屈膝、俯身与双臂操作；高度差也是任务经验的一部分。'
    if (scene === 'bathroom') return '围绕有限台面调整站位与躯干姿态，让对象位置和全身可达范围共同约束取放顺序。'
    if (scene === 'checkout') return '沿输送台、扫描位与取货端调整站位，将重复操作连接成完整的全身任务经验。'
    return '工作台与低处周转筐之间的高度变化，把身体调整、双臂整理和对象转移放在同一段经验中。'
  }
  if (robot === 'luna') return scene === 'living' || scene === 'bedroom' || scene === 'laundry' ? '折叠躯干改变操作高度，轮式底盘连接整理区与收纳区，让空间接近与双臂操作形成连续经验。' : '轮式移动与躯干调整连接不同工位，围绕接近位置、操作高度和接触过程组织任务记录。'
  if (robot === 'g1') {
    if (scene === 'living' || scene === 'bedroom') return '较低的桌面、床面与收纳筐，让接近位置、躯干调整和双臂操作形成连续的全身协同经验。'
    if (scene === 'bathroom') return '有限的台面与通行空间，让站位、可达范围和取放顺序一起参与任务组织。'
    if (scene === 'checkout') return '沿输送、扫描与装袋工位调整身体位置，将重复子任务与整体目标连接起来。'
    return '货位高度与对象位置变化时，身体调整和双臂操作属于同一段任务上下文。'
  }
}
