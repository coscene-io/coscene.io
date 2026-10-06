import * as THREE from 'three'
import { createQualityFinish } from './quality-motion-finish'
import { DELIVERY_COORDINATES, DELIVERY_COUNT, DELIVERY_SELECTED, deliveryAt, deliveryTransition as ramp } from './quality-delivery-timeline'

type Card = {
  group: THREE.Group
  body: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>
  face: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>
}

/** The original queue and the accepted belt share C00, one camera and one renderer. */
export function createRibbonJourney(scene: THREE.Scene, renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera, belt: THREE.Group, cards: Card[]) {
  const finish = createQualityFinish(renderer)
  const queue = new THREE.Group(); scene.add(queue)
  const colors = ['#39418f', '#e4eaf0', '#d24443', '#b9aacb'].map(value => new THREE.Color(value))
  const stops = [[0, 0], [.02, 0], [.25, 1], [.34, 1], [.54, 2], [.56, 2], [.77, 3], [.98, 0], [1, 0]]
  const silverWeights = [0, 1, 0, .35]
  const materials: THREE.MeshPhysicalMaterial[] = []
  const mix = THREE.MathUtils.lerp
  function openingMaterial(u: number) {
    const t = THREE.MathUtils.euclideanModulo((u - .5) * 4, 1)
    let right = stops.findIndex(([at]) => at >= t); if (right < 1) right = 1
    const [a, from] = stops[right - 1], [b, to] = stops[right]
    const local = THREE.MathUtils.clamp((t - a) / (b - a), 0, 1)
    const blend = mix(local, local * local * (3 - 2 * local), .3)
    const silver = mix(silverWeights[from], silverWeights[to], blend)
    const material = new THREE.MeshPhysicalMaterial({
      color: colors[from].clone().lerp(colors[to], blend), metalness: mix(.28, .88, silver),
      roughness: mix(.26, .23, silver), clearcoat: mix(.9, .35, silver), clearcoatRoughness: mix(.16, .20, silver),
      roughnessMap: finish.roughnessMap, normalMap: finish.normalMap, normalScale: new THREE.Vector2(.055, .025),
      anisotropy: mix(.10, .30, silver), anisotropyRotation: Math.PI / 2,
      envMap: finish.ribbonEnvironment.texture, envMapIntensity: mix(.45, 1.05, silver),
    })
    materials.push(material); return material
  }
  const hero = cards[0], originalMaterial = hero.body.material
  const heroMaterial = openingMaterial(.5)
  const finishUniform = { value: 0 }
  heroMaterial.onBeforeCompile = shader => {
    shader.uniforms.journeyFinish = finishUniform
    shader.fragmentShader = 'uniform float journeyFinish;\n' + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>',
      THREE.ShaderChunk.roughnessmap_fragment.replace('texelRoughness.g', 'mix(texelRoughness.g, 1.0, journeyFinish)'))
  }
  // No second C00: slot 39 is left for the existing task mesh.
  const members = Array.from({ length: DELIVERY_COUNT }, (_, index) => {
    if (index === DELIVERY_SELECTED) return null
    const mesh = new THREE.Mesh(hero.body.geometry, openingMaterial(DELIVERY_COORDINATES[index]))
    queue.add(mesh); return mesh
  })
  const inverseBelt = new THREE.Matrix4(), inverseRotation = new THREE.Quaternion()
  const shown = new THREE.Vector3(), pulled = new THREE.Vector3(), target = new THREE.Vector3()
  const look = new THREE.Vector3(), savedEye = new THREE.Vector3(), savedUp = new THREE.Vector3()
  const shownRotation = new THREE.Quaternion(), targetRotation = new THREE.Quaternion(), heroRotation = new THREE.Quaternion()
  const ringScale = 3.32 / 4.4
  const offset = new THREE.Vector3()

  function update(p: number, time: number, width: number, height: number, motion: boolean) {
    if (p >= 1) {
      queue.visible = false; hero.body.material = originalMaterial
      hero.group.scale.setScalar(1); hero.face.visible = true
      hero.face.material.transparent = false; hero.face.material.opacity = 1
      cards.forEach(card => { card.group.visible = true })
      camera.fov = 32; camera.updateProjectionMatrix()
      return { reveal: 1, light: 1, preview: false }
    }
    const mobile = width < 700
    // Sample the accepted opening field, including its live shared derivatives.
    const opening = deliveryAt(0, time, width, height, motion)
    queue.visible = p < .56
    const clear = ramp(.23, .53, p)
    members.forEach((mesh, index) => {
      if (!mesh) return
      const pose = opening.queue[index]
      mesh.position.copy(pose.position)
      mesh.position.x += Math.sign(index - DELIVERY_SELECTED) * .24 * ramp(.07, .23, p)
      mesh.position.y += clear * (mobile ? 44 : 24)
      mesh.quaternion.copy(pose.quaternion); mesh.scale.setScalar(pose.scale * ringScale)
    })

    // The camera travels once, then stays in the accepted ribbon coordinate system.
    savedEye.copy(camera.position); savedUp.copy(camera.up)
    const cameraMove = ramp(.18, .42, p)
    camera.fov = mix(36, 32, cameraMove)
    camera.position.lerpVectors(opening.cameraPosition, savedEye, cameraMove)
    camera.up.set(0, 1, 0).lerp(savedUp, cameraMove)
    look.copy(opening.cameraLook).multiplyScalar(1 - cameraMove)
    camera.lookAt(look); camera.updateProjectionMatrix()
    belt.updateMatrixWorld(true)
    inverseBelt.copy(belt.matrixWorld).invert(); inverseRotation.copy(belt.quaternion).invert()
    target.copy(hero.group.position).applyMatrix4(belt.matrixWorld)
    targetRotation.copy(belt.quaternion).multiply(hero.group.quaternion)

    // Related records arrive as a common curved run, not separate floating panels.
    cards.forEach((card, index) => {
      if (index === 0) return
      const arrival = ramp(.48 + index * .003, .90 + index * .004, p)
      card.group.visible = p > .48
      offset.set(22 * (1 - arrival), -26 * (1 - arrival), -9 * (1 - arrival)).applyQuaternion(inverseRotation)
      card.group.position.add(offset)
    })

    const slot = opening.queue[DELIVERY_SELECTED]
    // First move clear of neighbouring faces; only then turn toward the viewer.
    pulled.copy(slot.position); pulled.z += 4.3 * ramp(.06, .21, p)
    const viewScale = mobile ? 1 : 1.08
    const halfFov = Math.tan(16 * Math.PI / 180)
    // A legible passing view: modest projected size, with a continuously changing
    // position and angle. There is no fixed presentation pose between two eases.
    const passage = ramp(.18, .90, p)
    const fraction = Math.min(mobile ? .86 : .62, .62 * (1200 / 760) / camera.aspect,
      mobile ? 1 : 860 / width)
    const distance = 4.4 * viewScale / (2 * halfFov * camera.aspect * fraction) * (1 + passage * .10)
    const centerX = mobile ? mix(.48, .52, passage) : mix(.46, .53, passage)
    const centerY = mix(.46, .52, passage)
    shown.set((centerX * 2 - 1) * distance * halfFov * camera.aspect,
      (1 - centerY * 2) * distance * halfFov, savedEye.z - distance)
    shownRotation.setFromEuler(new THREE.Euler(mix(-.12, -.04, passage),
      mix(-.32, .10, passage), mix(-.12, .12, passage)))
    const present = ramp(.16, .45, p)
    hero.group.position.lerpVectors(pulled, shown, present)
    heroRotation.copy(slot.quaternion).slerp(shownRotation, present)
    let scale = mix(slot.scale * ringScale, viewScale, present)
    const curl = hero.body.morphTargetInfluences![0]
    // Capture the ring's unmodified C00 target before converting to its local space.
    const enter = ramp(.42, 1, p)
    hero.group.position.lerp(target, enter)
    hero.group.position.y -= Math.sin(Math.PI * enter) * .18
    hero.group.position.z += Math.sin(Math.PI * enter) * .25
    heroRotation.slerp(targetRotation, enter)
    scale = mix(scale, 1, enter)
    hero.group.position.applyMatrix4(inverseBelt)
    hero.group.quaternion.copy(inverseRotation).multiply(heroRotation)
    hero.group.scale.setScalar(scale)
    hero.body.morphTargetInfluences![0] = hero.face.morphTargetInfluences![0] = curl * enter
    const print = ramp(.32, .40, p)
    hero.face.visible = print > 0
    hero.face.material.opacity = print
    hero.face.material.transparent = print < .999

    // Let the metal reflection diminish before changing environments, then reopen
    // the accepted studio highlight. This avoids a material pop at the join.
    const finishBlend = ramp(.34, .92, p)
    finishUniform.value = finishBlend
    heroMaterial.color.copy(colors[0]).lerp(originalMaterial.color, finishBlend)
    heroMaterial.metalness = mix(.28, originalMaterial.metalness, finishBlend)
    heroMaterial.roughness = mix(.26, originalMaterial.roughness, finishBlend)
    heroMaterial.clearcoat = mix(.9, originalMaterial.clearcoat, finishBlend)
    heroMaterial.clearcoatRoughness = mix(.16, originalMaterial.clearcoatRoughness, finishBlend)
    heroMaterial.normalScale.set(.055 * (1 - finishBlend), .025 * (1 - finishBlend))
    heroMaterial.anisotropy = .10 * (1 - finishBlend)
    heroMaterial.envMap = p < .55 ? finish.ribbonEnvironment.texture : scene.environment
    heroMaterial.envMapIntensity = p < .55 ? .45 * (1 - ramp(.40, .55, p)) : scene.environmentIntensity * ramp(.55, .88, p)
    hero.body.material = heroMaterial
    return { reveal: print, light: ramp(.20, .65, p), preview: p >= .40 && p < .86 }
  }

  return { update, dispose() { queue.removeFromParent(); materials.forEach(m => m.dispose()); finish.dispose() } }
}
