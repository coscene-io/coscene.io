import * as THREE from 'three'
import { createParticleRobotPerformance } from './particle-robot-performance'
import { createParticleTypography, createParticleGainChart } from './particle-narrative-type'
import { createParticleTransfer, type ParticleTransfer } from './particle-story-transfer'
import { NARRATIVE_DURATION, STORY_PHASES as S } from './particle-story-clock'
import { buildFlowRoute, makeFlowRouteTexture } from './particle-flow-routes'

const phase = (start: number, end: number, value: number) => THREE.MathUtils.clamp((value - start) / (end - start), 0, 1)
const statements = [
  { text: 'coScene delivers actions and feedback grounded in physics for the most ambitious physical AI companies.', lines: [] },
  { text: 'We partner with robotics leaders, capturing their motion control capabilities in data assets for better training outcomes for our customers.', lines: [] },
  { text: 'Complex actions in real-world environments strengthen robots’ generalization and robustness.', lines: ['Complex actions in', 'real-world environments', 'strengthen robots’', 'generalization and', 'robustness.'] },
]

export type HeroParticleSource = {
  spheres: THREE.Points[]
  trails: THREE.Mesh[]
  destinations: THREE.Vector3[]
}

/** One reversible scroll clock, one particle population, sequential complete compositions. */
export function createParticleNarrative(scene: THREE.Scene, camera: THREE.PerspectiveCamera, root: HTMLElement, source: HeroParticleSource) {
  const frame = new THREE.Group()
  frame.name = 'physical-ai-particle-performance'
  scene.add(frame)
  const compact = root.clientWidth < 700
  const robotLayout = new THREE.Group()
  frame.add(robotLayout)
  const chart = createParticleGainChart(compact)
  chart.group.userData.setExternalParticles(true)
  frame.add(chart.group)
  const copy = statements.map((item, i) => createParticleTypography(item.text, item.lines, i < 2 ? 8.8 : 5, compact, i < 2 ? 'center' : 'left'))
  copy.forEach(item => { item.group.userData.setExternalParticles(true); frame.add(item.group) })
  const glyphs = copy.map(item => item.getTargets())
  let transfer: ParticleTransfer | null = null
  let robot: Awaited<ReturnType<typeof createParticleRobotPerformance>> | null = null
  type RobotSnapshot = { positions: Float32Array; colors: Float32Array; strengths: Float32Array }
  let initial: RobotSnapshot | null = null
  let final: RobotSnapshot | null = null
  let disposed = false
  let sourceCaptured = false
  let layoutKey = ''
  let width = 10, height = 7
  const forward = new THREE.Vector3()
  const point = new THREE.Vector3()
  const inverse = new THREE.Matrix4()
  const copyCenter = new THREE.Vector3()

  function transform(values: Float32Array, matrix: THREE.Matrix4, count: number) {
    const output = new Float32Array(count * 3)
    const available = values.length / 3
    for (let i = 0; i < count; i++) {
      const index = Math.floor(((i * .618033988749895) % 1) * available)
      point.fromArray(values, index * 3).applyMatrix4(matrix).toArray(output, i * 3)
    }
    return output
  }
  function exactTransform(values: Float32Array, matrix: THREE.Matrix4) {
    const output = new Float32Array(values.length)
    for (let i = 0; i < values.length; i += 3) point.fromArray(values, i).applyMatrix4(matrix).toArray(output, i)
    return output
  }
  function capture(pool: ParticleTransfer) {
    const count = pool.geometry.getAttribute('position').count
    const positions = new Float32Array(count * 3)
    const releases = new Float32Array(count), lanes = new Float32Array(count), seeds = new Float32Array(count)
    const attachments = new Float32Array(count), sourceWeights = new Float32Array(count), sourceScales = new Float32Array(count)
    inverse.copy(frame.matrixWorld).invert()
    const routes = source.trails.map(trail => buildFlowRoute(trail, inverse, copyCenter))
    const texture = makeFlowRouteTexture(routes)
    ;(pool.material.uniforms.uRoutes.value as THREE.Texture | null)?.dispose()
    pool.material.uniforms.uRoutes.value = texture
    pool.material.uniforms.uRouteHeads.value = routes.map(route => route.headFraction)
    pool.material.uniforms.uSphereCenter.value.setFromMatrixPosition(source.spheres[0].matrixWorld).applyMatrix4(inverse)
    const sourceToOrbit = source.trails.map(trail => trail.matrixWorld.clone().invert().multiply(frame.matrixWorld))
    const groups: { index: number; angle: number }[][] = [[], [], []]
    const occurrences = source.spheres.map(donor => new Uint32Array(donor.geometry.getAttribute('position').count))
    const identities: [number, number][] = []
    for (let i = 0; i < count; i++) {
      const layer = i % source.spheres.length
      const donor = source.spheres[layer]
      const geometry = donor.geometry
      const attribute = geometry.getAttribute('position')
      const index = Math.floor(i / source.spheres.length) % attribute.count
      const lane = index % 3
      identities.push([layer, index]); occurrences[layer][index]++
      point.fromBufferAttribute(attribute, index)
      const donorTime = (donor.material as THREE.ShaderMaterial).uniforms.uTime.value as number
      const donorPhase = geometry.getAttribute('aPhase').getX(index)
      const wave = Math.sin(donorPhase + donorTime * .52) * .012 + Math.sin(point.y * 8 - donorTime * .28) * .006
      point.setLength(point.length() + wave).applyMatrix4(donor.matrixWorld).applyMatrix4(inverse).toArray(positions, i * 3)
      point.applyMatrix4(sourceToOrbit[lane])
      // Capacity-balanced angular order covers the existing arc instead of clamping
      // a whole hemisphere to its head or tail. No shared point acts as a sink.
      groups[lane].push({ index: i, angle: Math.atan2(point.y, point.x) })
      releases[i] = S.sphereReleaseStart + ((donorPhase / (Math.PI * 2)) % 1) * S.sphereReleaseSpread
      sourceScales[i] = geometry.getAttribute('aScale').getX(index)
      lanes[i] = lane
      seeds[i] = (i * .618033988749895) % 1
    }
    groups.forEach((group, lane) => {
      group.sort((a, b) => a.angle - b.angle || a.index - b.index)
      group.forEach((entry, rank) => { attachments[entry.index] = routes[lane].headFraction * (.025 + .93 * (rank + .5) / group.length) })
    })
    identities.forEach(([layer, index], i) => { sourceWeights[i] = 1 / occurrences[layer][index] })
    pool.set('aSource', positions)
    pool.set('aRelease', releases); pool.set('aLane', lanes); pool.set('aSeed', seeds)
    pool.set('aAttachment', attachments); pool.set('aSourceWeight', sourceWeights); pool.set('aSourceScale', sourceScales)
    root.dataset.narrativeRoute = 'original-arc-to-type'
    root.dataset.narrativeRouteGap = Math.max(...routes.map(route => route.joinGap)).toExponential(2)
    root.dataset.narrativeRouteTangent = Math.min(...routes.map(route => route.tangentDot)).toFixed(5)
  }
  function layout() {
    height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 12.5
    width = height * camera.aspect
    const portrait = root.clientHeight > root.clientWidth
    camera.getWorldDirection(forward)
    frame.position.copy(camera.position).addScaledVector(forward, 12.5)
    frame.quaternion.copy(camera.quaternion)
    copyCenter.set(0, height * .025, .35)
    copy.forEach((item, index) => {
      if (index < 2) {
        const scale = Math.min(width * (portrait ? .85 : .80) / item.bounds.width, height * (portrait ? .52 : .55) / item.bounds.height)
        item.group.scale.setScalar(scale)
        item.group.position.set(copyCenter.x - item.bounds.centerX * scale, copyCenter.y - item.bounds.centerY * scale, .35)
      } else {
        const scale = portrait ? width * .86 / 5 : Math.min(width * .405 / 5, 1.28)
        item.group.position.set(-width * (portrait ? .43 : .447), height * (portrait ? .415 : .285), .35)
        item.group.scale.setScalar(scale)
      }
    })
    // The task gets the whole stage after both sentences have finished.
    robotLayout.position.set(portrait ? width * .06 : 0, -height * (portrait ? .14 : .32), 0)
    robotLayout.scale.setScalar(portrait ? Math.min(width * 1.10 / 3.1, height * .62 / 1.75) : Math.min(width * .82 / 3.1, height * .79 / 1.75))
    robotLayout.rotation.set(.12, -.24, 0)
    chart.group.position.set(portrait ? -width * .40 : width * .065, -height * (portrait ? .28 : .17), .4)
    chart.group.scale.setScalar(portrait ? width * .8 / 4.2 : width * .37 / 4.2)
    frame.updateMatrixWorld(true)
    if (transfer && initial && final) {
      const count = initial.positions.length / 3
      copy.forEach(item => item.group.updateMatrix())
      transfer.set('aFirst', transform(glyphs[0], copy[0].group.matrix, count))
      transfer.set('aSecond', transform(glyphs[1], copy[1].group.matrix, count))
      robotLayout.updateMatrix()
      transfer.set('aTaskStart', exactTransform(initial.positions, robotLayout.matrix))
      transfer.set('aTaskEnd', exactTransform(final.positions, robotLayout.matrix))
      const textCount = Math.min(glyphs[2].length / 3, Math.floor(count * .34))
      const chartCount = count - textCount
      const textTargets = transform(glyphs[2], copy[2].group.matrix, textCount)
      const targets = chart.getTargets(chartCount)
      chart.group.updateMatrix()
      const chartTargets = exactTransform(targets.positions, chart.group.matrix)
      const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3)
      const kinds = new Float32Array(count), parameters = new Float32Array(count)
      // A coprime permutation decouples growth time from the mesh vertex order.
      // Otherwise a late body part can linger as a miniature robot above the chart.
      const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a
      let chartStride = Math.floor(chartCount * .618033988749895)
      while (gcd(chartStride, chartCount) !== 1) chartStride++
      let textIndex = 0, chartIndex = 0
      // Interleave the split so the entire robot AND room feed both destinations.
      for (let i = 0; i < count; i++) {
        const isText = Math.floor((i + 1) * textCount / count) > Math.floor(i * textCount / count)
        if (isText) {
          positions.set(textTargets.subarray(textIndex * 3, textIndex * 3 + 3), i * 3)
          colors.set([.84, .88, .94], i * 3); kinds[i] = 2; textIndex++
        } else {
          const shuffled = chartIndex * chartStride % chartCount
          positions.set(chartTargets.subarray(shuffled * 3, shuffled * 3 + 3), i * 3)
          colors.set(targets.colors.subarray(shuffled * 3, shuffled * 3 + 3), i * 3)
          kinds[i] = targets.kind[shuffled]; parameters[i] = targets.parameter[shuffled]; chartIndex++
        }
      }
      transfer.set('aFinal', positions); transfer.set('aFinalColor', colors)
      transfer.set('aKind', kinds); transfer.set('aParameter', parameters)
      transfer.material.uniforms.uCopyDensity.value = Math.min(1, Math.max(glyphs[0].length, glyphs[1].length) / 3 / count)
      transfer.material.uniforms.uChartDensity.value = Math.min(1, 4200 / chartCount)
      transfer.material.uniforms.uCopyCenter.value.copy(copyCenter)
      transfer.material.uniforms.uSpan.value = height * .65
      transfer.material.uniforms.uPixelRatio.value = Number(root.dataset.pixelRatio ?? Math.min(devicePixelRatio, 1.65))
    }
    source.destinations.forEach((destination, index) => destination.copy(copyCenter).add(new THREE.Vector3(0, (index - 1) * height * .03, 0)).applyMatrix4(frame.matrixWorld))
    layoutKey = `${root.clientWidth},${root.clientHeight},${camera.fov}`
  }
  void createParticleRobotPerformance({ compact }).then(result => {
    if (disposed) { result.dispose(); return }
    robot = result
    robotLayout.add(robot.group)
    robot.update(0, 0); initial = robot.snapshot()
    robot.update(1, 0); final = robot.snapshot()
    robot.update(0, 0)
    transfer = createParticleTransfer(initial.positions.length / 3)
    transfer.set('aNativeColor', initial.colors)
    transfer.set('aStrength', initial.strengths)
    transfer.material.uniforms.uSourceDensity.value = Math.min(1, source.spheres.reduce((sum, donor) => sum + donor.geometry.getAttribute('position').count, 0) / (initial.positions.length / 3))
    frame.add(transfer.points)
    layout()
    sourceCaptured = false
    root.dataset.narrativeReady = 'true'
    root.dataset.narrativeParticles = String(initial.positions.length / 3)
  }).catch(error => {
    console.error('Unable to load the particle robot performance.', error)
    root.dataset.narrativeReady = 'error'
  })
  layout()

  return {
    update(value: number, _time: number) {
      const units = THREE.MathUtils.clamp(value, 0, 1) * NARRATIVE_DURATION
      frame.visible = units > S.copyExit
      const resized = layoutKey !== `${root.clientWidth},${root.clientHeight},${camera.fov}`
      if (resized) { layout(); sourceCaptured = false }
      if (units <= S.copyExit) { sourceCaptured = false; return }
      if (!sourceCaptured && transfer) {
        scene.updateMatrixWorld(true)
        capture(transfer)
        sourceCaptured = true
      }
      if (transfer) transfer.material.uniforms.uUnits.value = units
      const taskProgress = phase(S.taskStart, S.taskEnd, units)
      robot?.update(taskProgress, 0)
      if (robot) {
        robot.group.visible = units >= S.taskAssembled && units < S.taskHandoff
        robot.group.userData.setOpacity(phase(S.taskAssembled, S.taskStart, units) * (1 - phase(S.taskEnd, S.taskHandoff, units)))
        robot.group.userData.setAssemble(1)
        robot.group.userData.setPixelRatio?.(Number(root.dataset.pixelRatio ?? 1.5))
        root.dataset.narrativeTask = String(robot.group.userData.taskStage ?? '')
      }
      const windows = [[S.firstTextStart, S.firstComplete, S.firstRelease], [S.firstRelease, S.secondComplete, S.secondRelease], [S.taskHandoff, S.thirdComplete, Infinity]]
      copy.forEach((item, index) => {
        const [start, complete, release] = windows[index]
        const active = units >= start && units < release
        const reinforcement = index < 2 ? 1 - phase(release - .10, release, units) : 1
        item.update(active ? reinforcement : 0, active ? phase(start, complete, units) : 0, 0)
      })
      const chartProgress = units < S.axesComplete ? phase(S.taskHandoff, S.axesComplete, units) * .25 : .25 + phase(S.axesComplete, S.curveComplete, units) * .75
      chart.group.userData.setOpacity?.(1)
      chart.update(chartProgress, 0)
      root.dataset.narrativeStage = units < S.firstComplete ? 'sphere-to-first-statement' : units < S.firstRelease ? 'first-statement' : units < S.secondComplete ? 'first-to-second-statement' : units < S.secondRelease ? 'second-statement' : units < S.taskStart ? 'statement-to-task' : units < S.taskHandoff ? 'laundry-task' : units < S.thirdComplete ? 'task-to-copy-and-chart' : units < S.curveComplete ? 'growing-gain' : 'curtain-ready'
      root.dataset.narrativeAction = taskProgress.toFixed(4)
      root.dataset.narrativeCurve = phase(S.axesComplete, S.curveComplete, units).toFixed(4)
    },
    dispose() {
      disposed = true
      robot?.dispose(); copy.forEach(item => item.dispose()); chart.dispose()
      transfer?.dispose(); scene.remove(frame)
      delete root.dataset.narrativeReady
      delete root.dataset.narrativeTask
    },
  }
}
