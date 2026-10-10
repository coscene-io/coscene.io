import * as THREE from 'three'

export const PASSAGE_LANE_COUNT = 6

// The actual globe vertices travel through this passage. One optical axis and
// one particle identity persist from the first frame to the settled surface.
export const passageShader = /* glsl */ `
  uniform float uSeconds;
  uniform float uProgress;
  uniform vec2 uResolution;
  uniform vec2 uPerspectiveScale;
  uniform vec2 uVanishingNdc;
  uniform vec3 uGlobeCenterView;
  uniform float uGlobeRadius;
  uniform vec3 uLightTints[3];

  const float PASSAGE_LENGTH = 94.0;
  const float PASSAGE_LANES = ${PASSAGE_LANE_COUNT.toFixed(1)};
  const float TAU = 6.28318530718;

  float passageEase(float value) {
    float x = clamp(value, 0.0, 1.0);
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
  }

  // Integrate the deceleration so modulo recycling has stopped before capture.
  float passageClock() {
    float x = clamp((uProgress - 0.24) / 0.16, 0.0, 1.0);
    return 5.0 * (uProgress - 0.16 * (x*x*x - 0.5*x*x*x*x)
      - max(0.0, uProgress - 0.4));
  }

  vec2 passageAxis(float depth) {
    return depth * uPerspectiveScale * uVanishingNdc;
  }

  // A branch-free curve in the transverse plane: the controls retain the
  // travelling tangent and enter the destination tangentially. atan/slerp's
  // opposite-angle seam would tear a moving ribbon midway through capture.
  vec3 passageCapture(vec3 source, vec3 target, float amount) {
    float sourceDepth = max(0.2, -source.z);
    float targetDepth = max(0.2, -target.z);
    vec2 a = source.xy - passageAxis(sourceDepth);
    vec2 b = target.xy - passageAxis(targetDepth);
    vec2 controlA = mat2(cos(0.72), sin(0.72), -sin(0.72), cos(0.72)) * a * 0.84;
    vec2 controlB = mat2(cos(-0.34), sin(-0.34), -sin(-0.34), cos(-0.34)) * b * 1.12;
    float inverse = 1.0 - amount;
    vec2 radial = inverse * inverse * inverse * a
      + 3.0 * inverse * inverse * amount * controlA
      + 3.0 * inverse * amount * amount * controlB
      + amount * amount * amount * b;
    float depth = exp(mix(log(sourceDepth), log(targetDepth), amount));
    vec3 gathered = vec3(passageAxis(depth) + radial, -depth);
    return amount >= 0.99999 ? target : gathered;
  }

  vec3 passagePoint(float depth, float lane, vec2 spread) {
    float phase = lane * TAU / PASSAGE_LANES;
    float bend = smoothstep(3.0, 42.0, depth);
    float clock = passageClock();
    float travel = clock * 6.2;
    vec2 center = vec2(
      (sin((depth + travel) * 0.053) - sin(travel * 0.053)) * 2.65,
      (sin((depth + travel) * 0.039 + 1.2) - sin(travel * 0.039 + 1.2)) * 1.75
    ) * bend;
    float turn = phase + depth * 0.066
      + sin(depth * 0.028 - clock * 0.27) * 0.78
      + clock * 0.19;
    float radius = 4.7 + sin((depth + travel) * 0.043 + phase * 1.7) * 0.6;
    vec2 radial = vec2(cos(turn), sin(turn));
    vec2 crossFlow = vec2(-radial.y, radial.x);
    vec2 position = center + radial * (radius + spread.x)
      + crossFlow * spread.y;
    position.x *= 1.14;
    position.y *= 0.86;
    position += passageAxis(depth);
    return vec3(position, -depth);
  }

  float passageLight(float depth, float lane) {
    float leading = pow(0.5 + 0.5 * sin(depth * 0.215 + uSeconds * 2.0 - lane * 1.1), 7.0);
    float echo = pow(0.5 + 0.5 * sin(depth * 0.087 + uSeconds * 0.92 + lane * 1.6), 4.0);
    return 0.12 + leading * 1.7 + echo * 0.3;
  }

  float passageGain(float lane) {
    // Neutral silver is intrinsically brighter. Balance perceived energy,
    // retaining chroma instead of whitening blue and orange highlights.
    float orbitIndex = mod(lane + 1.0, 3.0);
    return orbitIndex < 0.5 ? 0.90 : orbitIndex < 1.5 ? 0.56 : 1.30;
  }

  vec3 passageColor(float depth, float lane, float sparkle) {
    // Keep each lane's spectrum as it bends into its corresponding orbit.
    float orbitIndex = mod(lane + 1.0, 3.0);
    vec3 tint = orbitIndex < 0.5 ? uLightTints[0]
      : orbitIndex < 1.5 ? uLightTints[1] : uLightTints[2];
    float crest = pow(0.5 + 0.5 * sin(depth * 0.215 + uSeconds * 2.0 - lane * 1.1), 12.0);
    return mix(tint, vec3(1.0), (0.025 + crest * 0.095) * sparkle);
  }

`

export const passageProjectionShader = /* glsl */ `
  vec4 passageProject(vec3 viewPosition) {
    vec4 clip = projectionMatrix * vec4(viewPosition, 1.0);
    // The existing hero camera ends at 60 units. The passage deliberately
    // continues farther; it draws behind the globe without writing depth.
    clip.z = clamp(clip.z, -clip.w * 0.999, clip.w * 0.999);
    return clip;
  }
`

const ribbonVertexShader = /* glsl */ `
  attribute float aDepth;
  attribute float aLane;
  attribute float aSide;
  varying float vAcross;
  varying float vDepth;
  varying float vLane;
  varying float vAlpha;
  uniform mat4 uOrbitViews[3];
  uniform float uOrbitRadius;
  ${passageShader}
  ${passageProjectionShader}

  vec3 ribbonPoint(float portion) {
    float depth = 1.5 + portion * PASSAGE_LENGTH;
    vec3 source = passagePoint(depth, aLane, vec2(0.0));
    float angle = portion * TAU + aLane * 0.19;
    vec4 local = vec4(cos(angle) * uOrbitRadius, sin(angle) * uOrbitRadius, 0.0, 1.0);
    // The warm passage strand becomes the warm orbital curve.
    float orbitIndex = mod(aLane + 1.0, 3.0);
    vec3 target = orbitIndex < 0.5 ? (uOrbitViews[0] * local).xyz
      : orbitIndex < 1.5 ? (uOrbitViews[1] * local).xyz : (uOrbitViews[2] * local).xyz;
    float capture = passageEase((uProgress - 0.43) / 0.54);
    return passageCapture(source, target, capture);
  }

  void main() {
    float depth = 1.5 + aDepth * PASSAGE_LENGTH;
    vec3 viewPosition = ribbonPoint(aDepth);
    vec4 clip = passageProject(viewPosition);
    vec4 previousClip = passageProject(ribbonPoint(aDepth - 0.0001));
    vec4 nextClip = passageProject(ribbonPoint(aDepth + 0.0001));
    vec2 tangent = (nextClip.xy / nextClip.w - previousClip.xy / previousClip.w) * uResolution;
    vec2 normal = normalize(vec2(-tangent.y, tangent.x) + vec2(0.00001));
    float laneWidth = 0.90;
    float capture = passageEase((uProgress - 0.43) / 0.54);
    float travelWidth = clamp(0.64 * uResolution.y / (depth * uPerspectiveScale.y), 2.4, 180.0) * laneWidth;
    float width = mix(travelWidth, 4.0 * uResolution.y / 900.0, capture);
    clip.xy += normal * aSide * width * 2.0 / uResolution * clip.w;
    gl_Position = clip;
    vAcross = aSide;
    vDepth = depth;
    vLane = aLane;
    float entrance = smoothstep(0.0, 0.065, uProgress);
    float nearFade = smoothstep(1.5, 6.0, depth);
    float distanceFade = 1.0 - smoothstep(66.0, 95.5, depth);
    float exitFade = (1.0 - smoothstep(0.83, 1.0, uProgress));
    vAlpha = entrance * mix(nearFade * distanceFade, 0.62, capture) * exitFade;
    float front = smoothstep(-0.2, 0.45, (viewPosition.z - uGlobeCenterView.z) / uGlobeRadius);
    vAlpha *= mix(1.0, front, capture);
  }
`

const ribbonFragmentShader = /* glsl */ `
  varying float vAcross;
  varying float vDepth;
  varying float vLane;
  varying float vAlpha;
  ${passageShader}

  void main() {
    float x = vAcross;
    float waviness = sin(vDepth * 0.3 + vLane * 1.2 - uSeconds * 0.3) * 0.018;
    float coreOffset = (x + waviness) * 38.0;
    float filamentOffsetA = (x - 0.18 + waviness) * 65.0;
    float filamentOffsetB = (x + 0.22 - waviness * 0.5) * 72.0;
    float filamentOffsetC = (x - 0.38 - waviness) * 82.0;
    float core = exp(-coreOffset * coreOffset);
    float filamentA = exp(-filamentOffsetA * filamentOffsetA);
    float filamentB = exp(-filamentOffsetB * filamentOffsetB);
    float filamentC = exp(-filamentOffsetC * filamentOffsetC);
    float scatter = exp(-x * x * 7.3);
    float outerScatter = exp(-x * x * 2.8);
    float flow = passageLight(vDepth, vLane);
    float laneEnergy = passageGain(vLane);
    float fibers = core * 1.7 + (filamentA + filamentB) * 0.47 + filamentC * 0.2;
    vec3 color = passageColor(vDepth, vLane, 0.7);
    vec3 light = color * fibers * flow
      + color * scatter * (0.22 + flow * 0.2)
      + color * outerScatter * 0.055;
    float edge = 1.0 - smoothstep(0.72, 1.0, abs(x));
    gl_FragColor = vec4(light, vAlpha * laneEnergy * edge * 0.68);
  }
`

// Used inside the globe's own material; there is no replacement point cloud.
export const passageParticleVertexShader = /* glsl */ `
  if (uProgress < 1.0) {
    float seed = fract(aPhase / TAU);
    float salt = fract(sin(aPhase * 91.37) * 43758.5453);
    float lane = aPassageLane;
    float depth = 1.5 + mod(seed * PASSAGE_LENGTH - passageClock() * (7.6 + salt * 1.2) + 940.0, PASSAGE_LENGTH);
    vec2 spread = vec2(fract(aPhase * 13.37) - 0.5, fract(aPhase * 19.91) - 0.5) * 0.95;
    vec3 travelView = passagePoint(depth, lane, spread);
    float captureStart = 0.42 + salt * 0.09;
    float captureEnd = 0.87 + seed * 0.13;
    float capture = passageEase((uProgress - captureStart) / (captureEnd - captureStart));
    vec3 carriedView = passageCapture(travelView, viewPosition.xyz, capture);
    gl_Position = passageProject(carriedView);
    float near = 1.0 - smoothstep(6.0, 28.0, depth);
    float far = smoothstep(40.0, 90.0, depth);
    float travelDefocus = clamp(near * (0.3 + salt * 0.7) + far * 0.2, 0.0, 0.9);
    float glint = pow(salt, 13.0);
    float flow = passageLight(depth, lane);
    float travelSize = (0.52 + salt * 0.85 + glint * 0.85 + travelDefocus * 3.8)
      * 23.0 / max(1.0, -carriedView.z) * uPixelRatio;
    travelSize = clamp(travelSize, 0.6 * uPixelRatio, 15.0 * uPixelRatio);
    gl_PointSize = mix(travelSize, gl_PointSize, capture);
    float travelAlpha = smoothstep(1.5, 5.0, depth) * (1.0 - smoothstep(78.0, 95.5, depth))
      * (0.36 + flow * 0.38 + glint * 0.45) * (1.0 - travelDefocus * 0.54) * passageGain(lane);
    vAlpha = mix(travelAlpha, vAlpha, capture) * smoothstep(0.0, 0.048, uProgress);
    vColor = mix(passageColor(depth, lane, 0.54 + salt * 0.46), vColor, capture);
    vDefocus = mix(travelDefocus, vDefocus, capture);
    // Fade only particles that have reached the far shell; depth writing starts
    // later, when the same shell would already hide them in the settled render.
    float backShell = 1.0 - smoothstep(-0.1, 0.08, (carriedView.z - uGlobeCenterView.z) / uGlobeRadius);
    vAlpha *= 1.0 - backShell * smoothstep(0.75, 0.99, uProgress) * capture;
  }
`

export function createIntelligenceTunnel(scene: THREE.Scene, compact: boolean, lightTints: THREE.Color[]) {
  const uniforms = {
    uSeconds: { value: 0 },
    uProgress: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uPerspectiveScale: { value: new THREE.Vector2(1, 1) },
    uVanishingNdc: { value: new THREE.Vector2(0.1, 0.05) },
    uGlobeCenterView: { value: new THREE.Vector3() },
    uGlobeRadius: { value: 1 },
    uLightTints: { value: lightTints },
    uOrbitViews: { value: [new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4()] },
    uOrbitRadius: { value: 1.9 },
  }
  const group = new THREE.Group()
  group.name = 'intelligence-depth-passage'
  scene.add(group)

  const lanes = PASSAGE_LANE_COUNT
  // Allocate more samples to the near field, where perspective amplifies each
  // segment. Narrow cells around each filament prevent the two triangles of a
  // wide quad from turning its interpolated light profile into a zigzag.
  const segments = compact ? 512 : 768
  const crossSection = [-1, -0.28, -0.18, -0.06, 0.06, 0.13, 0.23, 0.33, 0.43, 1]
  const columns = crossSection.length
  const vertices = lanes * (segments + 1) * columns
  const ribbonPositions = new Float32Array(vertices * 3)
  const depths = new Float32Array(vertices)
  const laneIndices = new Float32Array(vertices)
  const sides = new Float32Array(vertices)
  const indices = new Uint16Array(lanes * segments * (columns - 1) * 6)
  for (let lane = 0; lane < lanes; lane += 1) {
    for (let segment = 0; segment <= segments; segment += 1) {
      const vertex = (lane * (segments + 1) + segment) * columns
      const depth = Math.pow(segment / segments, 1.7)
      for (let column = 0; column < columns; column += 1) {
        depths[vertex + column] = depth
        laneIndices[vertex + column] = lane
        sides[vertex + column] = crossSection[column]
        if (segment === segments || column === columns - 1) continue
        const index = ((lane * segments + segment) * (columns - 1) + column) * 6
        const start = vertex + column
        indices.set([start, start + 1, start + columns, start + 1, start + columns + 1, start + columns], index)
      }
    }
  }
  const ribbonGeometry = new THREE.BufferGeometry()
  ribbonGeometry.setAttribute('position', new THREE.BufferAttribute(ribbonPositions, 3))
  ribbonGeometry.setAttribute('aDepth', new THREE.BufferAttribute(depths, 1))
  ribbonGeometry.setAttribute('aLane', new THREE.BufferAttribute(laneIndices, 1))
  ribbonGeometry.setAttribute('aSide', new THREE.BufferAttribute(sides, 1))
  ribbonGeometry.setIndex(new THREE.BufferAttribute(indices, 1))
  const ribbonMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: ribbonVertexShader,
    fragmentShader: ribbonFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  })
  const ribbons = new THREE.Mesh(ribbonGeometry, ribbonMaterial)
  ribbons.frustumCulled = false
  ribbons.renderOrder = -20
  group.add(ribbons)

  const globeNdc = new THREE.Vector3()
  let disposed = false
  return {
    uniforms,
    update(
      seconds: number,
      progress: number,
      camera: THREE.PerspectiveCamera,
      globeCenter: THREE.Vector3,
      globeRadius: number,
      orbits: THREE.Group[],
    ) {
      if (disposed) return
      group.visible = progress < 1
      camera.updateMatrixWorld()
      uniforms.uSeconds.value = seconds
      uniforms.uProgress.value = THREE.MathUtils.clamp(progress, 0, 1)
      uniforms.uPerspectiveScale.value.set(
        1 / camera.projectionMatrix.elements[0],
        1 / camera.projectionMatrix.elements[5],
      )
      uniforms.uGlobeCenterView.value.copy(globeCenter).applyMatrix4(camera.matrixWorldInverse)
      uniforms.uGlobeRadius.value = globeRadius
      globeNdc.copy(globeCenter).project(camera)
      uniforms.uVanishingNdc.value.set(globeNdc.x, globeNdc.y)
      orbits.forEach((orbit, index) => {
        uniforms.uOrbitViews.value[index].multiplyMatrices(camera.matrixWorldInverse, orbit.matrixWorld)
      })
    },
    resize(width: number, height: number) {
      uniforms.uResolution.value.set(Math.max(1, width), Math.max(1, height))
    },
    dispose() {
      if (disposed) return
      disposed = true
      scene.remove(group)
      ribbonGeometry.dispose()
      ribbonMaterial.dispose()
    },
  }
}
