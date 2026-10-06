import * as THREE from 'three'
import type { TraceCardId } from './quality-trace-card-art'
import { GATHER_START, GATHER_SETTLED, archiveProgress, archiveTravel } from './quality-ribbon-story'
import { gatheredPosition, gatheredAngle, gatherDepth, gatherPresentation, gatherAlignment, gatherMerge, gatherGroupMerge } from './quality-ribbon-gather'

type Card = {
  id: TraceCardId
  group: THREE.Group
  body: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>
  face: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>
  archiveMix: { value: number }
}
type Pose = { position: THREE.Vector3; quaternion: THREE.Quaternion; curl: number }
type Target = { position: THREE.Vector3; scale: number; angle: number }
const TAU = Math.PI * 2, W = 4.4, H = W * 760 / 1200
const LANDING_TURNS = .44
const GROUPS: { title: string; ids: TraceCardId[] }[] = [
  { title: '客户需求', ids: ['C01', 'C02', 'C03'] },
  { title: '生产条件', ids: ['C04', 'C05', 'C06', 'C07'] },
  { title: '数据与质检', ids: ['C08', 'C09', 'C10', 'C11', 'C12'] },
  { title: '交付对照', ids: ['C15', 'C16', 'C00'] },
]
const ramp = (a: number, b: number, p: number) => {
  const t = THREE.MathUtils.clamp((p - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

/** All records leave one moving belt at its front tangent, then land on one plane. */
export function createRibbonArchive(host: HTMLElement, scene: THREE.Scene, camera: THREE.PerspectiveCamera,
  belt: THREE.Group, cards: Card[], poseAt: (index: number, phase: number) => Pose) {
  const surface = new THREE.Group(); scene.add(surface); surface.visible = false
  const planeRotation = new THREE.Quaternion(), inversePlane = new THREE.Matrix4()
  const archiveRotation = new THREE.Quaternion(), deckRotation = new THREE.Quaternion()
  const cardRoll = new THREE.Quaternion(), zAxis = new THREE.Vector3(0, 0, 1)
  const inverseBelt = new THREE.Matrix4(), inverseBeltRotation = new THREE.Quaternion()
  const normal = new THREE.Vector3(), tangent = new THREE.Vector3()
  const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), p2 = new THREE.Vector3(), p3 = new THREE.Vector3()
  const point = new THREE.Vector3(), fromRotation = new THREE.Quaternion(), worldRotation = new THREE.Quaternion()
  const gate = new THREE.Vector3(), targetWorld = new THREE.Vector3(), identity = new THREE.Quaternion()
  const curve = new THREE.CubicBezierCurve3(p0, p1, p2, p3)
  const bounds = new THREE.Box3(), center = new THREE.Vector3(), finalEye = new THREE.Vector3()
  const targets = new Map<TraceCardId, Target>()
  const gatheredTargets = new Map<TraceCardId, Target>()
  const gatherEye = new THREE.Vector3(), gatherCorner = new THREE.Vector3()
  // Project native text into the scene instead of shrinking it into a texture
  // and passing its hairlines through the metal's bloom and tone mapping.
  const labelLayer = document.createElement('div')
  labelLayer.className = 'ribbon-archive-labels'; labelLayer.setAttribute('aria-hidden', 'true')
  labelLayer.hidden = true; host.append(labelLayer)
  const labelLeft = new THREE.Vector3(), labelRight = new THREE.Vector3()
  const labels = GROUPS.map(({ title, ids }) => {
    const element = document.createElement('div'); element.className = 'ribbon-archive-label'
    const name = document.createElement('span'), count = document.createElement('span')
    name.textContent = title; count.textContent = `${ids.length} 份记录`
    element.append(name, count); labelLayer.append(element)
    return { position: new THREE.Vector3(), element }
  })
  // A receiving surface is expressed by contact, not a solid grey slab. Soft
  // rounded-rectangle shadows follow each landing; no shadow-map render pass.
  const shadowGeometry = new THREE.PlaneGeometry(1, 1)
  const shadows = cards.map(() => {
    const material = new THREE.ShaderMaterial({
      uniforms: { size: { value: new THREE.Vector2(7, 5) }, halfCard: { value: new THREE.Vector2(W / 2, H / 2) },
        softness: { value: .16 }, alpha: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `varying vec2 vUv; uniform vec2 size; uniform vec2 halfCard; uniform float softness; uniform float alpha;
        void main(){ vec2 p=(vUv-.5)*size; vec2 q=abs(p)-halfCard+vec2(.16);
          float d=length(max(q,0.0))+min(max(q.x,q.y),0.0)-.16;
          float a=alpha*exp(-max(0.0,d)*max(0.0,d)/(softness*softness));
          gl_FragColor=vec4(.13,.15,.22,a); }`,
      transparent: true, depthWrite: false,
    })
    const shadow = new THREE.Mesh(shadowGeometry, material)
    shadow.scale.set(7, 5, 1); surface.add(shadow); return shadow
  })
  let lastWidth = 0, lastHeight = 0, landscape = false
  function layout(width: number, height: number) {
    const mobile = width < 700
    landscape = width >= 1100 && width / height >= 1.4
    surface.position.set(0, 0, -2)
    surface.rotation.set(mobile ? -.16 : -.28, .025, mobile || landscape ? -.025 : -.055)
    archiveRotation.copy(surface.quaternion)
    deckRotation.setFromEuler(new THREE.Euler(mobile ? -.66 : -.76, -.30, -.22, 'XYZ'))
    planeRotation.copy(surface.quaternion); surface.updateMatrixWorld(true)
    inversePlane.copy(surface.matrixWorld).invert()
    normal.set(0, 0, 1).applyQuaternion(planeRotation)
    targets.clear(); gatheredTargets.clear()
    // A landscape screen gets a landscape arrangement. Keeping a tall 2×2
    // matrix here forces the camera backwards despite abundant empty width.
    const anchors = landscape ? [[-7.65, 1.4], [-2.55, 1.4], [2.55, 1.4], [7.65, 1.4]]
      : [[-2.65, 3.10], [2.55, 3.10], [-2.65, -3.40], [2.55, -3.40]]
    GROUPS.forEach((group, g) => {
      const [x, y] = anchors[g]
      group.ids.forEach((id, j) => targets.set(id, {
        position: new THREE.Vector3(x + .14 * j, y - .68 * j, .10 + .108 * j), scale: 1, angle: 0,
      }))
      labels[g].position.set(x, y + H / 2 + .62, .01)
    })
    targets.forEach((target, id) => gatheredTargets.set(id, { position: target.position.clone(), scale: 1, angle: 0 }))
    // Fit actual tilted corners into the space beneath the headline. Keep a
    // parallel camera orientation so labels and card headers share a baseline.
    bounds.makeEmpty()
    const corners: THREE.Vector3[] = []
    targets.forEach(({ position, scale }) => {
      for (const x of [-W / 2, W / 2]) for (const y of [-H / 2, H / 2]) {
        const corner = new THREE.Vector3(x * scale, y * scale, 0).add(position).applyMatrix4(surface.matrixWorld)
        bounds.expandByPoint(corner); corners.push(corner)
      }
    })
    labels.forEach(label => {
      for (const x of [-2.2, 2.2]) {
        const corner = new THREE.Vector3(x, .3, 0).add(label.position).applyMatrix4(surface.matrixWorld)
        bounds.expandByPoint(corner); corners.push(corner)
      }
    })
    bounds.getCenter(center)
    const tan = Math.tan(16 * Math.PI / 180), aspect = width / height
    const centerX = .50, centerY = .565
    const top = landscape ? .19 : .22, bottom = .90
    const left = landscape ? .04 : .055, right = landscape ? .96 : .945
    let distance = 1
    corners.forEach(corner => {
      const dx = corner.x - center.x, dy = corner.y - center.y, dz = corner.z - center.z
      distance = Math.max(distance, dz + Math.abs(dx) / (2 * tan * aspect * (dx >= 0 ? right - centerX : centerX - left)),
        dz + Math.abs(dy) / (2 * tan * (dy >= 0 ? centerY - top : bottom - centerY)))
    })
    distance *= 1.01
    finalEye.set(center.x - distance * tan * aspect * (2 * centerX - 1),
      center.y + distance * tan * (2 * centerY - 1), center.z + distance)
    lastWidth = width; lastHeight = height
  }

  function deckCorner(target: Target, x: number, y: number, z: number) {
    const c = Math.cos(target.angle), s = Math.sin(target.angle)
    return gatherCorner.set(x * c - y * s, x * s + y * c, z).add(target.position).applyMatrix4(surface.matrixWorld)
  }

  function gatherLayout(progress: number, width: number, height: number) {
    let rank = 0
    GROUPS.forEach((group, g) => {
      const front = targets.get(group.ids[group.ids.length - 1])!.position
      group.ids.forEach((id, member) => {
        const target = gatheredTargets.get(id)!
        gatheredPosition(target.position, targets.get(id)!.position,
          front, g, member, group.ids.length, rank++, progress)
        target.angle = gatheredAngle(g, member, group.ids.length, progress)
      })
    })
    // Follow the changing envelope, with a maximum readable card size. The
    // camera only approaches after the four groups have finished aligning.
    const merge = gatherMerge(progress)
    if (merge === 0) return
    const depth = gatherDepth(progress)
    bounds.makeEmpty()
    gatheredTargets.forEach(target => {
      for (const x of [-W / 2, W / 2]) for (const y of [-H / 2, H / 2]) for (const z of [-.046, .052]) {
        bounds.expandByPoint(deckCorner(target, x, y, z * depth))
      }
    })
    bounds.getCenter(center)
    const tan = Math.tan(16 * Math.PI / 180), aspect = width / height
    const screenY = THREE.MathUtils.lerp(.565, .53, merge)
    const cardPixels = Math.min(width * (width < 700 ? .83 : .64), 580, height * .76)
    let distance = W * height / (2 * tan * cardPixels) + bounds.max.z - center.z
    gatheredTargets.forEach(target => {
      for (const x of [-W / 2, W / 2]) for (const y of [-H / 2, H / 2]) for (const z of [-.046, .052]) {
        deckCorner(target, x, y, z * depth).sub(center)
        distance = Math.max(distance, gatherCorner.z + Math.abs(gatherCorner.x) / (2 * tan * aspect * .445),
          gatherCorner.z + Math.abs(gatherCorner.y) / (2 * tan * (gatherCorner.y >= 0 ? screenY - .20 : .88 - screenY)))
      }
    })
    gatherEye.set(center.x, center.y + distance * tan * (2 * screenY - 1), center.z + distance)
    camera.position.lerp(gatherEye, merge)
  }

  function update(progress: number, phase: number, width: number, height: number, departure = 0) {
    const a = archiveProgress(progress)
    surface.visible = a > 0 && departure < 1
    labelLayer.hidden = a <= 0
    cards.forEach(card => { card.archiveMix.value = 0 })
    if (a <= 0) return { settled: 0, gathered: 0 }
    if (width !== lastWidth || height !== lastHeight) layout(width, height)
    // The receiving plane and the complete deck turn together. Recompute from
    // the archive pose on every frame so backward scrolling restores it exactly.
    surface.quaternion.copy(archiveRotation).slerp(deckRotation, gatherPresentation(progress))
    planeRotation.copy(surface.quaternion); surface.updateMatrixWorld(true)
    inversePlane.copy(surface.matrixWorld).invert()
    normal.set(0, 0, 1).applyQuaternion(planeRotation)
    const turns = archiveTravel(progress)
    belt.updateMatrixWorld(true)
    inverseBelt.copy(belt.matrixWorld).invert(); inverseBeltRotation.copy(belt.quaternion).invert()
    camera.position.lerp(finalEye, ramp(0, .72, a)); camera.quaternion.slerp(identity, ramp(0, .72, a))
    if (progress > GATHER_START) {
      gatherLayout(progress, width, height)
      // Raising the outer groups brings them closer to the lens even before
      // convergence. Keep a small frame margin throughout that lift as well.
      const tan = Math.tan(16 * Math.PI / 180)
      gatheredTargets.forEach(target => {
        for (const x of [-W / 2, W / 2]) for (const y of [-H / 2, H / 2]) for (const z of [-.046, .052]) {
          deckCorner(target, x, y, z * gatherDepth(progress))
          const dx = gatherCorner.x - camera.position.x, dy = gatherCorner.y - camera.position.y
          camera.position.z = Math.max(camera.position.z,
            gatherCorner.z + Math.abs(dx) / (2 * tan * camera.aspect * .46),
            gatherCorner.z + Math.abs(dy) / (2 * tan * (dy >= 0 ? .31 : .40)))
        }
      })
    }
    camera.updateMatrixWorld()
    let settled = 0
    cards.forEach((card, i) => {
      const untilFront = THREE.MathUtils.euclideanModulo(i / cards.length + phase / TAU, 1)
      const t = THREE.MathUtils.clamp((turns - untilFront) / LANDING_TURNS, 0, 1)
      // Reveal the readable overview on the same physical face while it lands.
      // Reverse scrolling restores the original detailed artwork on this path.
      card.archiveMix.value = ramp(.48, .86, t)
      const shadow = shadows[i]; shadow.visible = t > .55
      if (t <= 0) return // Still moving along the original belt; no isolated pose.
      const target = (progress > GATHER_START ? gatheredTargets : targets).get(card.id)!
      const groupIndex = GROUPS.findIndex(group => group.ids.includes(card.id))
      const ids = GROUPS[groupIndex]?.ids || []
      const member = ids.indexOf(card.id)
      // An arbitrary browsing phase can split a stack's release order. Such a
      // card approaches from the outside and slides underneath, instead of
      // descending through cards which have already landed above its layer.
      const underlay = ids.slice(member + 1).some(id => {
        const index = cards.findIndex(item => item.id === id)
        return THREE.MathUtils.euclideanModulo(index / cards.length + phase / TAU, 1) < untilFront
      })
      const exit = poseAt(i, phase - untilFront * TAU)
      p0.copy(exit.position).applyMatrix4(belt.matrixWorld)
      fromRotation.copy(belt.quaternion).multiply(exit.quaternion)
      // The front's travelling tangent hands the card to a single shallow arc.
      tangent.set(-1, 0, 0).applyQuaternion(fromRotation)
      const approach = underlay ? .76 : 1
      p1.copy(p0).addScaledVector(tangent, 10.2458 * approach)
      targetWorld.copy(target.position).applyMatrix4(surface.matrixWorld)
      if (underlay) {
        gate.copy(target.position)
        if (landscape) {
          // Above this single row of columns is clear space. A side gate would
          // intersect the neighbouring group in the wider archive arrangement.
          gate.y = Math.max(...ids.map(id => targets.get(id)!.position.y)) + H + .35
        } else {
          const xs = ids.map(id => targets.get(id)!.position.x)
          gate.x = groupIndex % 2 === 0 ? Math.min(...xs) - W - .35 : Math.max(...xs) + W + .35
        }
        p3.copy(gate).applyMatrix4(surface.matrixWorld)
      } else p3.copy(targetWorld)
      p2.copy(p3).addScaledVector(normal, 3.0)
      if (!underlay) p2.addScaledVector(tangent, -1.0)
      // Preserve forward motion at release, decelerate to zero on contact.
      const flightTime = Math.min(1, t / approach)
      const flight = flightTime + flightTime * flightTime - flightTime * flightTime * flightTime
      curve.getPoint(flight, point)
      if (underlay && t > approach) point.lerp(targetWorld, ramp(approach, 1, t))
      card.group.position.copy(point).applyMatrix4(inverseBelt)
      worldRotation.copy(fromRotation).slerp(planeRotation, ramp(0, underlay ? .60 : .90, t))
      if (target.angle) worldRotation.multiply(cardRoll.setFromAxisAngle(zAxis, target.angle))
      card.group.quaternion.copy(inverseBeltRotation).multiply(worldRotation)
      card.group.scale.setScalar(THREE.MathUtils.lerp(1, target.scale, ramp(.25, .95, t)))
      card.group.scale.z *= gatherDepth(progress)
      card.body.morphTargetInfluences![0] = card.face.morphTargetInfluences![0] = exit.curl * (1 - ramp(0, underlay ? .60 : .82, t))
      if (t >= 1) settled++
      const local = point.applyMatrix4(inversePlane)
      shadow.position.set(local.x + .09, local.y - .12, -.055)
      shadow.rotation.z = target.angle
      const lift = Math.max(0, local.z - target.position.z)
      const uniform = shadow.material.uniforms
      // Collapse overlapping shadows along with the records. One soft contact
      // remains beneath the complete task, rather than fifteen dark layers.
      const alignment = gatherAlignment(progress)
      const memberShadow = member === ids.length - 1 ? 1 : 1 - alignment
      const groupShadow = groupIndex === 0 ? 1 : 1 - gatherGroupMerge(groupIndex, progress)
      uniform.alpha.value = ramp(.58, .93, t) * .14 / (1 + lift * .6) * memberShadow * groupShadow * (1 - departure)
      uniform.softness.value = .08 + lift * .20 + target.position.z * .12 + gatherMerge(progress) * .12
      uniform.halfCard.value.set(W / 2 * target.scale, H / 2 * target.scale)
    })
    labelLayer.style.opacity = String(ramp(.25, .72, a) * (1 - gatherAlignment(progress)) * (1 - ramp(0, .12, departure)))
    labels.forEach(({ position, element }) => {
      labelLeft.set(-W / 2, .3, 0).add(position).applyMatrix4(surface.matrixWorld).project(camera)
      labelRight.set(W / 2, .3, 0).add(position).applyMatrix4(surface.matrixWorld).project(camera)
      const x = (labelLeft.x + 1) * width / 2, y = (1 - labelLeft.y) * height / 2
      const dx = (labelRight.x - labelLeft.x) * width / 2, dy = (labelLeft.y - labelRight.y) * height / 2
      const span = Math.hypot(dx, dy)
      element.style.width = `${span}px`
      element.style.fontSize = `${THREE.MathUtils.clamp(span * .061, 13, 19)}px`
      element.style.transform = `translate(${x}px,${y}px) rotate(${Math.atan2(dy, dx)}rad)`
    })
    return { settled, gathered: progress >= GATHER_SETTLED ? cards.length : 0 }
  }
  return { update, dispose() {
    surface.removeFromParent(); labelLayer.remove(); shadowGeometry.dispose()
    shadows.forEach(shadow => shadow.material.dispose())
  } }
}
