import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

/** Small, deterministic surface variation; it changes highlights, not the base color. */
function finishMaps(renderer: THREE.WebGLRenderer) {
  const size = 256, roughness = new Uint8Array(size * size * 4), normal = new Uint8Array(size * size * 4)
  const random = (x: number, y: number) => {
    const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
    return value - Math.floor(value)
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const index = (y * size + x) * 4, strand = random(x, 0), grain = random(x, y + 1)
    const value = Math.round(228 + strand * 18 + grain * 9)
    roughness.set([value, value, value, 255], index)
    normal.set([Math.round(128 + (strand - .5) * 6), Math.round(128 + (grain - .5) * 2), 255, 255], index)
  }
  const roughnessMap = new THREE.DataTexture(roughness, size, size)
  const normalMap = new THREE.DataTexture(normal, size, size)
  for (const texture of [roughnessMap, normalMap]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2, 2)
    texture.magFilter = THREE.LinearFilter
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.generateMipmaps = true
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())
    texture.needsUpdate = true
  }
  return { roughnessMap, normalMap }
}

/** Soft reflection sources are baked once; no extra lights or objects run in the animation. */
export function createQualityFinish(renderer: THREE.WebGLRenderer) {
  const studio = new RoomEnvironment(), pmrem = new THREE.PMREMGenerator(renderer)
  const environment = pmrem.fromScene(studio, .025)
  const size = 128, pixels = new Uint8Array(size * size * 4)
  const smooth = (value: number) => { const t = THREE.MathUtils.clamp(value, 0, 1); return t * t * (3 - 2 * t) }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / (size - 1), v = y / (size - 1)
    const alpha = smooth(Math.min(u, 1 - u) / .20) * smooth(Math.min(v, 1 - v) / .13)
    pixels.set([255, 255, 255, Math.round(alpha * 255)], (y * size + x) * 4)
  }
  const softboxMap = new THREE.DataTexture(pixels, size, size)
  softboxMap.magFilter = softboxMap.minFilter = THREE.LinearFilter
  softboxMap.needsUpdate = true
  const softbox = (width: number, height: number, position: [number, number, number], intensity: number) => {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(intensity, intensity, intensity), map: softboxMap,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    })
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material)
    panel.position.set(...position); panel.lookAt(0, 3.5, 0); studio.add(panel)
  }
  softbox(5.2, 10, [-9, 3.5, -2], 3.2)
  softbox(4.5, 10, [-2, 4, -9], 3.2)
  softbox(1.15, 8, [7, 5, -6], 2.4)
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 10), new THREE.MeshBasicMaterial({
    color: '#85898f', side: THREE.DoubleSide, toneMapped: false,
  }))
  flag.position.set(-5.7, 3.5, -8.8); flag.lookAt(0, 3.5, 0); studio.add(flag)
  const ribbonEnvironment = pmrem.fromScene(studio, .035)
  studio.dispose(); softboxMap.dispose(); pmrem.dispose()
  const maps = finishMaps(renderer)
  return {
    environment, ribbonEnvironment, ...maps,
    dispose() {
      environment.dispose(); ribbonEnvironment.dispose()
      maps.roughnessMap.dispose(); maps.normalMap.dispose()
    },
  }
}
