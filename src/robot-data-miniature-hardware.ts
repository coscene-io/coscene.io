import * as THREE from 'three'
import { poseG1 } from './robot-data-miniature-world'
import type { RobotId, SceneDefinition, Vec3 } from './robot-data-miniature-catalog'
import type { TaskFrame } from './robot-data-miniature-tasks'

const wristCache = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>()

// H2's source combines the reference hand and wrist. Clip only the distal hand.
function wristOnly(original: THREE.BufferGeometry) {
  const cached = wristCache.get(original)
  if (cached) return cached
  const input = original.index ? original.toNonIndexed() : original.clone()
  const p = input.getAttribute('position'), vertices: number[] = []
  const plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), -.055)
  for (let i = 0; i < p.count; i += 3) {
    const polygon = [0, 1, 2].map(j => new THREE.Vector3().fromBufferAttribute(p, i + j))
    const clipped: THREE.Vector3[] = []
    for (let j = 0; j < 3; j++) {
      const a = polygon[j], b = polygon[(j + 1) % 3]
      const da = plane.distanceToPoint(a), db = plane.distanceToPoint(b)
      if (da <= 0) clipped.push(a)
      if ((da <= 0) !== (db <= 0)) clipped.push(a.clone().lerp(b, da / (da - db)))
    }
    for (let j = 1; j < clipped.length - 1; j++) vertices.push(...clipped[0].toArray(), ...clipped[j].toArray(), ...clipped[j + 1].toArray())
  }
  const output = new THREE.BufferGeometry()
  output.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); output.computeVertexNormals()
  input.dispose(); wristCache.set(original, output)
  return output
}

export function attachWujiHands(robot: THREE.Group, id: RobotId, sources: readonly THREE.Group[], stage = 0) {
  for (const [index, side] of ['left', 'right'].entries()) {
    const toolName = id === 's1' ? `astribot_arm_${side}_tool_link` : id === 'luna' ? `luna_${side}_tool` : `${side}_wrist_yaw_link`
    const tool = robot.getObjectByName(toolName)
    if (!tool) throw new Error(`${id}: missing ${side} hand mount`)
    if (id === 'g1') { const old = robot.getObjectByName(`${side}_rubber_hand_visual`); if (old) old.visible = false }
    if (id === 'h2') {
      const old = tool.getObjectByName(`${side}_wrist_yaw_link_visual`) as THREE.Mesh
      old.geometry = wristOnly(old.geometry)
    }
    if (id === 's1') { const old = robot.getObjectByName(`astribot_gripper_${side}_base`); if (old) old.visible = false }
    const mount = new THREE.Group(); mount.name = `wuji_${side}_mount`
    mount.userData.configuration = 'wuji'; mount.userData.side = side
    const axial = id === 'g1' || id === 'h2'
    if (axial) { mount.position.set(id === 'g1' ? .045 : .055, id === 'g1' ? (index ? -.003 : .003) : 0, 0); mount.rotation.y = Math.PI / 2 }
    if (id === 's1') mount.rotation.z = -Math.PI / 2
    if (id === 'luna') mount.rotation.z = Math.PI
    const adapter = new THREE.Mesh(new THREE.CylinderGeometry(.029, .031, .019, 32), new THREE.MeshStandardMaterial({ color: '#30383c', roughness: .4, metalness: .45 }))
    adapter.rotation.x = Math.PI / 2; adapter.position.z = .004; adapter.name = 'display_wrist_adapter'
    mount.add(adapter)
    const hand = sources[index].clone(true); hand.name = `wuji_${side}_hand`; hand.position.z = .018
    hand.traverse(node => {
      if (node instanceof THREE.Mesh) {
        node.material = new THREE.MeshStandardMaterial({ color: /palm|tip/.test(node.name) ? '#30383d' : '#9da6ab', roughness: .5, metalness: .2 })
        node.castShadow = true; node.receiveShadow = true
      }
      const joint = node.userData.joint
      if (joint) {
        const finger = Number(joint.name.match(/finger(\d)/)?.[1]), part = Number(joint.name.match(/joint(\d)/)?.[1])
        const value = finger === 1 ? [0, .75, .28, .2, .18][part] : part === 2 ? 0 : (stage === 1 ? .30 : .16)
        const range = joint.range.split(' ').map(Number)
        node.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...joint.axis.split(' ').map(Number) as Vec3), THREE.MathUtils.clamp(value, range[0], range[1])))
      }
    })
    mount.add(hand); tool.add(mount)
  }
  robot.updateMatrixWorld(true)
}

export function collectionRobot(original: THREE.Group, id: RobotId, room: SceneDefinition, frame?: TaskFrame) {
  const low = room.id === 'living' || room.id === 'bedroom' || room.id === 'laundry' && frame?.stage === 3 || room.id === 'retail' && frame?.stage === 1 || room.id === 'office' && (frame?.stage === 0 || frame?.stage === 3) || room.id === 'produce' && (frame?.stage === 2 || frame?.stage === 3)
  const lowTorso = room.id === 'living' ? 1.1 : .95
  const poses: Record<string, number> = { ...(frame?.poses[id] ?? (low && id === 'g1' ? { right_shoulder_pitch_joint: .14, right_elbow_joint: .3, left_elbow_joint: .3 } : low && id === 's1' ? { astribot_torso_joint_1: lowTorso, astribot_torso_joint_2: -lowTorso * 2, astribot_torso_joint_3: lowTorso, astribot_arm_left_joint_4: .7, astribot_arm_right_joint_4: .7 } : {})) }
  if (id === 'h2') {
    const bend = low ? .55 : .1
    // H2's hip pitch axes are canted +/-30 degrees in the source MJCF.
    // Resolve a sagittal bend through all three hip joints, keeping the feet level.
    for (const [side, sign] of [['left', 1], ['right', -1]] as const) {
      const cant = sign * Math.PI / 6
      const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), cant)
        .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -bend))
      const hip = new THREE.Euler().setFromQuaternion(rotation, 'YXZ')
      poses[`${side}_hip_pitch_joint`] = hip.y
      poses[`${side}_hip_roll_joint`] = hip.x - cant
      poses[`${side}_hip_yaw_joint`] = hip.z
      poses[`${side}_knee_joint`] = bend * 2
      poses[`${side}_ankle_roll_joint`] = 0
      poses[`${side}_ankle_pitch_joint`] = -bend
    }
  }
  if (id === 'h2') Object.assign(poses, {
    waist_pitch_joint: low ? .24 : .04, head_pitch_joint: low ? .25 : .10,
    right_shoulder_pitch_joint: low ? -.25 : -.4, right_elbow_joint: low ? 1.15 : 1.2,
    left_shoulder_pitch_joint: low ? -.15 : -.28, left_elbow_joint: low ? 1.15 : 1.2,
  })
  if (id === 'luna') Object.assign(poses, {
    luna_lift_pitch: low ? .32 : .04, luna_fold_pitch: low ? -.64 : -.08, luna_waist_pitch: low ? .32 : .04,
    luna_right_shoulder_pitch: low ? .05 : .18, luna_left_shoulder_pitch: low ? .03 : .12,
    luna_right_elbow_pitch: low ? .82 : 1.4, luna_left_elbow_pitch: low ? .78 : 1.25,
    luna_head_pitch: low ? -.13 : 0,
  })
  const robot = poseG1(original, id, poses)
  const station = frame?.step.station ?? room.robotPosition
  const heading = frame?.step.heading ?? (room.id === 'retail' ? Math.PI / 2 : room.id === 'bedroom' ? Math.PI : 0)
  robot.position.x = station[0]; robot.position.z = station[2]
  robot.rotation.y = (id === 's1' ? Math.PI / 2 : 0) + heading
  if (!frame && room.id === 'retail') robot.position.z = -.65
  if (!frame && id === 's1' && room.id === 'living') robot.position.x -= .12
  // Wider wheeled bases stand slightly farther off the work surface; metres remain unchanged.
  const setback = id === 'luna' ? .12 : id === 's1' && room.id === 'bathroom' ? .09 : 0
  robot.position.x -= Math.cos(heading) * setback
  robot.position.z += Math.sin(heading) * setback
  robot.updateMatrixWorld(true)
  return robot
}

export function disposeRobot(robot: THREE.Group) {
  const materials = new Set<THREE.Material>(), owned = new Set<THREE.BufferGeometry>()
  robot.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) materials.add(material)
    if (node.name === 'display_wrist_adapter') owned.add(node.geometry)
  })
  materials.forEach(material => material.dispose()); owned.forEach(geometry => geometry.dispose())
}
