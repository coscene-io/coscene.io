import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import * as THREE from 'three'
import './delivery-material-study.css'

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uProgress;
  uniform float uContinuation;
  uniform float uAspect;
  uniform sampler2D uDensityMap;

  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.52;
    mat2 rotation = mat2(0.80, -0.60, 0.60, 0.80);

    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p = rotation * p * 2.03 + vec2(1.7, 4.2);
      amplitude *= 0.49;
    }

    return value;
  }

  float smoothRange(float edge0, float edge1, float value) {
    return smoothstep(edge0, edge1, value);
  }

  void main() {
    float settle = smoothRange(0.26, 0.76, uProgress);
    float finalSettle = smoothRange(0.54, 0.92, uProgress);
    float depthExplore = smoothRange(0.82, 1.0, uProgress);
    float continuation = smoothRange(0.0, 1.0, uContinuation);
    float driftTime = uTime * mix(0.0055, 0.0008, settle);
    float microTime = uTime * mix(0.0090, 0.0014, settle);
    float safeAspect = max(uAspect, 0.72);

    vec2 centered = vec2((vUv.x - 0.5) * safeAspect, vUv.y - 0.5);
    vec2 flowSpace = vec2(centered.x * 1.22, centered.y * 0.72);
    flowSpace.x += sin(centered.y * 2.1) * 0.055;

    vec2 firstWarp = vec2(
      fbm(flowSpace),
      fbm(flowSpace + vec2(5.2, 0.0))
    );

    vec2 secondWarp = vec2(
      fbm(flowSpace * 1.42 + firstWarp * 2.65 + vec2(1.7, 0.0)),
      fbm(flowSpace * 1.31 + firstWarp * 2.35 + vec2(7.8, 0.0))
    );

    float macroFold = fbm(flowSpace + secondWarp * 3.05);
    vec2 movingFlowSpace = flowSpace + vec2(
      sin(centered.y * 1.7 + driftTime * 0.35) * 0.012,
      driftTime
    );
    float softFold = fbm(movingFlowSpace * 2.38 + firstWarp * 1.8 - vec2(driftTime * 0.2, driftTime * 0.62));
    float fineFold = fbm(vec2(
      movingFlowSpace.x * 2.4 + secondWarp.x * 1.7,
      movingFlowSpace.y * 3.3 + firstWarp.y * 1.35 - microTime * 0.28
    ));
    float ribbon = 0.5 + 0.5 * sin(
      flowSpace.x * 5.4 +
      secondWarp.x * 7.2 +
      softFold * 2.1 -
      flowSpace.y * 0.9
    );

    vec2 densityUv = vec2(
      clamp(vUv.x + (secondWarp.x - 0.5) * 0.018, 0.0, 1.0),
      clamp(
        mix(0.045, 0.41, 1.0 - vUv.y) +
        (firstWarp.y - 0.5) * 0.016,
        0.035,
        0.48
      )
    );
    vec3 densitySample = texture2D(uDensityMap, densityUv).rgb;
    float densityLuma = dot(densitySample, vec3(0.2126, 0.7152, 0.0722));
    vec2 densityTexel = vec2(1.0 / 2944.0, 1.0 / 5232.0);
    float densityEast = dot(
      texture2D(uDensityMap, densityUv + vec2(densityTexel.x, 0.0)).rgb,
      vec3(0.2126, 0.7152, 0.0722)
    );
    float densityWest = dot(
      texture2D(uDensityMap, densityUv - vec2(densityTexel.x, 0.0)).rgb,
      vec3(0.2126, 0.7152, 0.0722)
    );
    float densityNorth = dot(
      texture2D(uDensityMap, densityUv + vec2(0.0, densityTexel.y)).rgb,
      vec3(0.2126, 0.7152, 0.0722)
    );
    float densitySouth = dot(
      texture2D(uDensityMap, densityUv - vec2(0.0, densityTexel.y)).rgb,
      vec3(0.2126, 0.7152, 0.0722)
    );
    float densityNeighbour =
      (densityEast + densityWest + densityNorth + densitySouth) * 0.25;
    vec2 coarseTexel = densityTexel * 3.5;
    float densityCoarseNeighbour = (
      dot(texture2D(uDensityMap, densityUv + vec2(coarseTexel.x, 0.0)).rgb, vec3(0.2126, 0.7152, 0.0722)) +
      dot(texture2D(uDensityMap, densityUv - vec2(coarseTexel.x, 0.0)).rgb, vec3(0.2126, 0.7152, 0.0722)) +
      dot(texture2D(uDensityMap, densityUv + vec2(0.0, coarseTexel.y)).rgb, vec3(0.2126, 0.7152, 0.0722)) +
      dot(texture2D(uDensityMap, densityUv - vec2(0.0, coarseTexel.y)).rgb, vec3(0.2126, 0.7152, 0.0722))
    ) * 0.25;
    float macroLuma = densityLuma * 0.62 + densityNeighbour * 0.26 + densityCoarseNeighbour * 0.12;
    float densityDetail = densityNeighbour - densityLuma;
    float sourceRelief = clamp((macroLuma - densityLuma) * 4.2, -0.16, 0.16);
    float horizontalSourceDetail = (densityEast + densityWest) * 0.5 - densityLuma;
    float verticalSourceDetail = (densityNorth + densitySouth) * 0.5 - densityLuma;
    float directionalPreference = smoothstep(
      abs(verticalSourceDetail) * 0.85 + 0.0006,
      abs(verticalSourceDetail) * 2.60 + 0.0040,
      abs(horizontalSourceDetail)
    );
    float directionalSourceRelief =
      clamp(horizontalSourceDetail * 9.0, -0.14, 0.14) *
      directionalPreference;
    float authoredDensity = clamp((1.0 - macroLuma) * 1.14 + densityDetail * 0.28, 0.0, 1.0);
    float rightArtifact = 1.0 - smoothstep(0.10, 0.22, length(vec2((vUv.x - 0.80) * 1.55, vUv.y - 0.08)));
    float leftArtifact = 1.0 - smoothstep(0.08, 0.19, length(vec2((vUv.x - 0.04) * 1.7, vUv.y - 0.07)));
    float artifactCleanup = max(rightArtifact, leftArtifact);
    float proceduralDensity = clamp(macroFold * 0.58 + softFold * 0.42, 0.0, 1.0);
    authoredDensity = mix(authoredDensity, proceduralDensity, artifactCleanup * 0.82);

    float compositionSettle = smoothRange(0.42, 0.92, uProgress);
    vec2 compositionUvA = vec2(
      clamp(
        mix(0.07, 0.93, vUv.x) +
        (secondWarp.x - 0.5) * 0.032,
        0.035,
        0.965
      ),
      clamp(
        mix(0.085, 0.68, 1.0 - vUv.y) +
        (firstWarp.y - 0.5) * 0.055 +
        (secondWarp.y - 0.5) * 0.018 +
        depthExplore * 0.028,
        0.055,
        0.735
      )
    );
    vec2 compositionUvB = vec2(
      clamp(
        compositionUvA.x + 0.105 + (firstWarp.x - 0.5) * 0.018,
        0.045,
        0.955
      ),
      clamp(
        compositionUvA.y - 0.020 + (secondWarp.y - 0.5) * 0.018,
        0.060,
        0.730
      )
    );
    float compositionLumaA = dot(
      texture2D(uDensityMap, compositionUvA, 3.10).rgb,
      vec3(0.2126, 0.7152, 0.0722)
    );
    float compositionLumaB = dot(
      texture2D(uDensityMap, compositionUvB, 3.55).rgb,
      vec3(0.2126, 0.7152, 0.0722)
    );
    float compositionLuma = mix(
      compositionLumaA,
      min(compositionLumaA + 0.035, compositionLumaB),
      0.26
    );
    float rawAccumulation = clamp((1.0 - compositionLuma) * 1.10, 0.0, 1.0);
    float accumulationDensity = smoothRange(0.28, 0.68, rawAccumulation);
    float accumulationWeight = mix(
      0.06,
      0.94,
      1.0 - smoothRange(0.08, 0.60, vUv.y)
    );
    float reservoirWarp =
      (macroFold - 0.5) * 0.030 +
      (softFold - 0.5) * 0.016;
    float bottomSupport =
      (1.0 - smoothRange(0.015, 0.18 + reservoirWarp, vUv.y)) *
      mix(0.86, 0.96, macroFold);
    float compositionDensity = clamp(
      max(accumulationDensity * accumulationWeight, bottomSupport),
      0.0,
      1.0
    );

    float darkGrowth = smoothRange(0.22, 0.68, uProgress);
    float growthFront = mix(-0.16, 0.89, darkGrowth) + finalSettle * 0.38;
    float frontAspect = smoothRange(0.75, 1.90, safeAspect);
    float broadFront = sin(
      centered.x * 2.35 +
      firstWarp.x * 1.70 +
      darkGrowth * 0.85
    ) * mix(0.025, 0.062, frontAspect);
    float secondaryFront = sin(
      centered.x * 4.65 -
      secondWarp.y * 1.35 -
      0.70
    ) * mix(0.012, 0.028, frontAspect);
    float frontUndulation =
      broadFront +
      secondaryFront +
      (macroFold - 0.5) * 0.090 +
      (softFold - 0.5) * 0.045 +
      (authoredDensity - 0.5) * 0.055;
    float growthField =
      growthFront - vUv.y +
      frontUndulation;
    float frontFeather = mix(
      0.018,
      0.032,
      smoothRange(0.28, 0.78, softFold)
    );
    float frontPixelWidth = fwidth(growthField) * 1.15;
    float growthMask = smoothstep(
      -frontFeather - frontPixelWidth,
      frontFeather + frontPixelWidth,
      growthField
    );
    float lowerDensity = smoothstep(-0.12, 0.54, 0.48 - vUv.y);
    float portraitWeight = 1.0 - smoothstep(0.72, 1.08, uAspect);
    float lowerWeight = mix(0.16, 0.31, portraitWeight);
    float referenceBase = authoredDensity * (1.0 - lowerWeight) + lowerDensity * lowerWeight;
    float upperCalm = smoothRange(0.58, 0.90, vUv.y);
    referenceBase *= mix(1.0, 0.38, upperCalm);
    float settledDensity =
      referenceBase * mix(1.0, 1.05, finalSettle) +
      finalSettle * (0.025 + lowerDensity * 0.035);
    float referencePhase = clamp(
      max(settledDensity, compositionDensity * compositionSettle),
      0.0,
      1.0
    );
    float darkPhase = clamp(referencePhase * growthMask, 0.0, 1.0);
    darkPhase = max(darkPhase, lowerDensity * portraitWeight * darkGrowth * 0.52);
    darkPhase *= mix(1.0, 0.18, upperCalm);
    float compositionGradient = fwidth(compositionDensity);
    float compositionInterface =
      smoothRange(0.004, 0.055, compositionGradient) *
      smoothRange(0.20, 0.58, compositionDensity) *
      (1.0 - smoothRange(0.80, 0.98, compositionDensity)) *
      compositionSettle;
    float interfaceBand = max(
      4.0 * darkPhase * (1.0 - darkPhase),
      compositionInterface * 0.72
    );
    float compositionInterior =
      compositionSettle * smoothRange(0.44, 0.82, compositionDensity);
    float authoredFold =
      clamp(abs(densityDetail) * 8.5, 0.0, 1.0) *
      interfaceBand *
      mix(1.0, 0.24, compositionInterior);

    float depthVariation = clamp(macroFold * 0.34 + softFold * 0.28 + authoredDensity * 0.38, 0.0, 1.0);

    vec2 detailSpace = vec2(centered.x * 1.62, centered.y * 1.18);
    float outerFlowRelief =
      sin(
        (detailSpace.x * 4.30 +
        secondWarp.x * 5.20 +
        softFold * 1.25 +
        detailSpace.y * 0.24) * 6.2831853
      ) * 0.62 +
      sin(
        (detailSpace.x * 8.40 +
        firstWarp.x * 6.10 +
        fineFold * 1.45 -
        detailSpace.y * 0.18) * 6.2831853
      ) * 0.38;

    vec3 pearl = vec3(0.825, 0.865, 0.875);
    vec3 pearlLight = vec3(0.955, 0.972, 0.972);
    vec3 settledPearl = vec3(0.79, 0.82, 0.85);
    vec3 settledPearlLight = vec3(0.91, 0.93, 0.94);
    vec3 iceBlue = vec3(0.46, 0.64, 0.84);
    vec3 steelMist = vec3(0.36, 0.48, 0.64);
    vec3 graphite = vec3(0.020, 0.027, 0.043);
    vec3 deepIndigo = vec3(0.052, 0.086, 0.270);
    vec3 cobalt = vec3(0.11, 0.28, 0.74);

    float verticalDepth = 1.0 - smoothRange(0.06, 0.72, vUv.y);
    float iceField =
      smoothRange(0.12, 0.42, vUv.y) *
      (1.0 - smoothRange(0.68, 0.90, vUv.y));

    vec3 activePearl = mix(pearl, settledPearl, finalSettle);
    vec3 activePearlLight = mix(pearlLight, settledPearlLight, finalSettle);
    float lightContrast = mix(0.68, 0.46, finalSettle);
    vec3 lightMaterial = mix(activePearl, activePearlLight, depthVariation * lightContrast);
    lightMaterial = mix(
      lightMaterial,
      iceBlue,
      iceField * (mix(0.085, 0.14, finalSettle) + softFold * 0.035) * darkGrowth
    );

    vec3 darkMaterial = mix(
      deepIndigo,
      graphite,
      smoothRange(0.44, 0.92, verticalDepth)
    );
    float cobaltBody = depthVariation * (1.0 - verticalDepth * 0.78);
    darkMaterial = mix(darkMaterial, cobalt, cobaltBody * mix(0.20, 0.30, finalSettle));
    darkMaterial += vec3(0.018, 0.032, 0.078) * softFold;

    vec3 color = mix(lightMaterial, darkMaterial, darkPhase);
    float settledBottom = (1.0 - smoothRange(0.08, 0.44, vUv.y)) * darkGrowth;
    vec3 bottomTone = mix(deepIndigo, graphite, smoothRange(0.52, 0.94, darkPhase));
    color = mix(color, bottomTone, settledBottom * (0.055 + darkPhase * 0.085));
    vec3 settledDepthTone = mix(
      deepIndigo,
      graphite,
      smoothRange(0.20, 0.92, verticalDepth)
    );
    float settledDepthGrade = finalSettle * (
      0.015 +
      verticalDepth * 0.050 +
      smoothRange(0.35, 0.90, darkPhase) * 0.025
    );
    color = mix(color, settledDepthTone, settledDepthGrade);
    float boundaryTexture =
      smoothRange(0.57, 0.82, fineFold) *
      interfaceBand *
      mix(1.0, 0.42, compositionInterior);
    vec3 interfaceTone = mix(steelMist, cobalt, finalSettle * 0.42);
    color = mix(color, interfaceTone, interfaceBand * mix(0.055, 0.075, finalSettle));
    color = mix(color, mix(activePearlLight, steelMist, darkPhase), authoredFold * 0.11);
    float reliefCoverage =
      darkGrowth *
      mix(0.38, 0.86, darkPhase) *
      mix(1.0, 0.76, interfaceBand) *
      mix(1.0, 0.20, compositionInterior);
    color -=
      sourceRelief *
      vec3(0.16, 0.21, 0.34) *
      reliefCoverage *
      0.65;
    float directionalReliefCoverage =
      darkGrowth *
      smoothRange(0.30, 0.88, darkPhase) *
      mix(1.0, 0.55, interfaceBand) *
      mix(1.0, 0.18, compositionInterior);
    color -=
      directionalSourceRelief *
      vec3(0.28, 0.36, 0.62) *
      directionalReliefCoverage *
      1.35;
    color += cobalt * boundaryTexture * mix(0.062, 0.078, finalSettle) * darkGrowth;

    float outerMaterialMask = smoothRange(0.24, 0.78, darkPhase);
    float outerVeilMask =
      darkGrowth *
      outerMaterialMask *
      mix(1.0, 0.68, interfaceBand);
    vec3 outerReliefTint = mix(vec3(0.08, 0.13, 0.28), vec3(0.12, 0.18, 0.30), 1.0 - darkPhase);
    color += outerFlowRelief * outerReliefTint * outerVeilMask * 0.072;

    float brokenHighlight = interfaceBand * smoothRange(0.63, 0.84, softFold) * smoothRange(0.30, 0.82, ribbon);
    color += activePearlLight * brokenHighlight * 0.12;

    float translucentThread = interfaceBand * smoothRange(0.60, 0.84, fineFold) * (0.35 + ribbon * 0.65);
    color = mix(color, deepIndigo, translucentThread * 0.12 * darkGrowth);

    float verticalLight = smoothstep(-0.28, 0.82, vUv.y);
    color *= mix(0.91, 1.035, verticalLight);

    float edgeCalm = 1.0 - smoothstep(0.16, 0.58, abs(vUv.x - 0.5));
    color += activePearlLight * edgeCalm * (1.0 - darkPhase) * 0.012;

    float continuationLeftField = 1.0 - smoothRange(
      0.30,
      0.92,
      vUv.x + (macroFold - 0.5) * 0.075
    );
    float continuationField = clamp(
      0.15 +
      continuationLeftField * 0.48 +
      verticalDepth * 0.24 +
      smoothRange(0.22, 0.88, darkPhase) * 0.22 +
      smoothRange(0.34, 0.82, compositionDensity) * 0.13,
      0.0,
      0.94
    );
    vec3 continuationTone = mix(
      vec3(0.065, 0.10, 0.18),
      graphite,
      clamp(verticalDepth * 0.64 + darkPhase * 0.32, 0.0, 1.0)
    );
    color = mix(
      color,
      continuationTone,
      continuation * continuationField * mix(0.62, 0.74, continuation)
    );
    float continuationSheen =
      continuation *
      interfaceBand *
      (1.0 - continuationField) *
      smoothRange(0.36, 0.82, fineFold);
    color += steelMist * continuationSheen * 0.035;

    float grain = hash21(gl_FragCoord.xy) - 0.5;
    color += grain / 620.0;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`

function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const progress = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0))
  return progress * progress * (3 - 2 * progress)
}

export function DeliveryMaterialCanvas({
  progressRef,
  continuationRef,
  active,
}: {
  progressRef: React.RefObject<number>
  continuationRef?: React.RefObject<number>
  active: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeRef = useRef(active)
  const controllerRef = useRef<{ setActive: (nextActive: boolean) => void } | null>(null)

  useEffect(() => {
    activeRef.current = active
    controllerRef.current?.setActive(active)
  }, [active])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance',
    })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0xecefee, 1)
    const optimizedForHandoff = continuationRef != null

    const scene = new THREE.Scene()
    const camera = new THREE.Camera()
    const geometry = new THREE.PlaneGeometry(2, 2)
    const uniforms = {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uContinuation: { value: 0 },
      uAspect: { value: 1 },
      uDensityMap: { value: null as THREE.Texture | null },
    }

    const densityTexture = new THREE.TextureLoader().load('/assets/delivery-material/density-reference-sr4x.png')
    densityTexture.colorSpace = THREE.SRGBColorSpace
    densityTexture.wrapS = THREE.MirroredRepeatWrapping
    densityTexture.wrapT = THREE.ClampToEdgeWrapping
    densityTexture.minFilter = THREE.LinearMipmapLinearFilter
    densityTexture.magFilter = THREE.LinearFilter
    densityTexture.anisotropy = optimizedForHandoff
      ? Math.min(2, renderer.capabilities.getMaxAnisotropy())
      : renderer.capabilities.getMaxAnisotropy()
    uniforms.uDensityMap.value = densityTexture
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
    })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let animationFrame = 0
    let startedAt = performance.now()
    let previousFrameAt = startedAt
    let lastRenderedAt = startedAt
    let displayedProgress = progressRef.current ?? 0
    let displayedContinuation = continuationRef?.current ?? 0
    let requestedActive = activeRef.current

    const resize = () => {
      const width = Math.max(1, canvas.clientWidth)
      const height = Math.max(1, canvas.clientHeight)
      const area = width * height
      const maxPixelRatio = optimizedForHandoff
        ? width <= 760
          ? 1.2
          : area >= 2_600_000
            ? 1.15
            : width >= 1680
              ? 1.25
              : 1.35
        : width >= 2200
          ? 1.75
          : 1.9
      const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio)
      renderer.setPixelRatio(pixelRatio)
      renderer.setSize(width, height, false)
      uniforms.uAspect.value = width / height
    }

    const render = (now: number) => {
      animationFrame = 0
      const deltaSeconds = Math.min(0.05, Math.max(0, (now - previousFrameAt) / 1000))
      const progressResponse = 1 - Math.exp(-deltaSeconds / 0.16)
      const targetProgress = progressRef.current ?? 0
      const targetContinuation = continuationRef?.current ?? 0
      displayedProgress += (targetProgress - displayedProgress) * progressResponse
      displayedContinuation += (
        targetContinuation - displayedContinuation
      ) * progressResponse
      if (Math.abs(targetProgress - displayedProgress) < 0.0001) displayedProgress = targetProgress
      if (Math.abs(targetContinuation - displayedContinuation) < 0.0001) {
        displayedContinuation = targetContinuation
      }

      const stateMoving =
        Math.abs(targetProgress - displayedProgress) >= 0.0001 ||
        Math.abs(targetContinuation - displayedContinuation) >= 0.0001
      const idleFrameInterval = displayedProgress > 0.9 ? 1000 / 30 : 1000 / 45
      const shouldRender =
        !optimizedForHandoff ||
        stateMoving ||
        now - lastRenderedAt >= idleFrameInterval

      if (shouldRender) {
        uniforms.uTime.value = reducedMotion.matches ? 0 : (now - startedAt) / 1000
        uniforms.uProgress.value = displayedProgress
        uniforms.uContinuation.value = displayedContinuation
        renderer.render(scene, camera)
        lastRenderedAt = now
      }
      previousFrameAt = now
      if (requestedActive && !document.hidden) {
        animationFrame = window.requestAnimationFrame(render)
      }
    }

    const syncAnimation = () => {
      const shouldRun = requestedActive && !document.hidden
      if (shouldRun && !animationFrame) {
        const now = performance.now()
        startedAt = now - uniforms.uTime.value * 1000
        previousFrameAt = now
        animationFrame = window.requestAnimationFrame(render)
      } else if (!shouldRun && animationFrame) {
        window.cancelAnimationFrame(animationFrame)
        animationFrame = 0
      }
    }

    const handleVisibility = () => syncAnimation()

    resize()
    renderer.render(scene, camera)
    controllerRef.current = {
      setActive: (nextActive) => {
        requestedActive = nextActive
        syncAnimation()
      },
    }
    syncAnimation()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      controllerRef.current = null
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', handleVisibility)
      geometry.dispose()
      material.dispose()
      densityTexture.dispose()
      renderer.dispose()
    }
  }, [continuationRef, progressRef])

  return (
    <canvas
      ref={canvasRef}
      className="delivery-material-canvas"
      data-render-active={active ? 'true' : 'false'}
      aria-hidden="true"
    />
  )
}

export function DeliveryMaterialValues() {
  return (
    <section className="delivery-material-values" aria-label="数据附加值能力">
      <article className="delivery-material-value delivery-material-value--semantic">
        <div className="delivery-material-value__content">
          <div className="delivery-material-value__heading">
            <h2><span>让原始采集</span><span>成为有效信号</span></h2>
            <ArrowUpRight
              className="delivery-material-value__arrow"
              aria-hidden="true"
              strokeWidth={0.4}
              viewBox="4.5 4.5 15 15"
            />
          </div>
          <p>标注 · 清洗 · 对齐</p>
        </div>
      </article>

      <article className="delivery-material-value delivery-material-value--synthesis">
        <div className="delivery-material-value__content">
          <div className="delivery-material-value__heading">
            <h2><span>让稀缺数据</span><span>进入更多训练</span></h2>
            <ArrowUpRight
              className="delivery-material-value__arrow"
              aria-hidden="true"
              strokeWidth={0.4}
              viewBox="4.5 4.5 15 15"
            />
          </div>
          <p>稀缺真机 · 合成 · 增广</p>
        </div>
      </article>

      <article className="delivery-material-value delivery-material-value--evaluation">
        <div className="delivery-material-value__content">
          <div className="delivery-material-value__heading">
            <h2><span>用模型反馈</span><span>定义下一轮数据</span></h2>
            <ArrowUpRight
              className="delivery-material-value__arrow"
              aria-hidden="true"
              strokeWidth={0.4}
              viewBox="4.5 4.5 15 15"
            />
          </div>
          <p>质量分析 · 增益评估 · 目标定义</p>
        </div>
      </article>
    </section>
  )
}

export function DeliveryMaterialStudy({ handoff = false }: { handoff?: boolean }) {
  const trackRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)
  const [canvasActive, setCanvasActive] = useState(false)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const observer = new IntersectionObserver(([entry]) => {
      setCanvasActive(entry.isIntersecting)
    }, { rootMargin: '40% 0px' })

    observer.observe(track)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let animationFrame = 0

    const update = () => {
      animationFrame = 0
      const track = trackRef.current
      const pin = pinRef.current
      if (!track || !pin) return

      const rect = track.getBoundingClientRect()
      const scrollDistance = Math.max(1, track.offsetHeight - window.innerHeight)
      const progress = clamp(-rect.top / scrollDistance)
      const coverProgress = smoothstep(0.015, handoff ? 0.21 : 0.24, progress)
      const materialProgress = clamp(progress / 0.86)
      const semanticProgress = smoothstep(0.46, 0.62, progress)
      const synthesisProgress = smoothstep(0.58, 0.74, progress)
      const evaluationProgress = smoothstep(0.70, 0.86, progress)
      const semanticHeading = smoothstep(0.62, 0.68, progress)
      const semanticDetail = smoothstep(0.65, 0.71, progress)
      const synthesisHeading = smoothstep(0.74, 0.80, progress)
      const synthesisDetail = smoothstep(0.77, 0.83, progress)
      const evaluationHeading = smoothstep(0.86, 0.92, progress)
      const evaluationDetail = smoothstep(0.89, 0.95, progress)
      progressRef.current = materialProgress
      pin.style.setProperty('--cover-offset', `${coverProgress * -105}%`)
      pin.style.setProperty('--semantic-scale', semanticProgress.toFixed(4))
      pin.style.setProperty('--synthesis-scale', synthesisProgress.toFixed(4))
      pin.style.setProperty('--evaluation-scale', evaluationProgress.toFixed(4))
      pin.style.setProperty('--semantic-heading', semanticHeading.toFixed(4))
      pin.style.setProperty('--semantic-detail', semanticDetail.toFixed(4))
      pin.style.setProperty('--synthesis-heading', synthesisHeading.toFixed(4))
      pin.style.setProperty('--synthesis-detail', synthesisDetail.toFixed(4))
      pin.style.setProperty('--evaluation-heading', evaluationHeading.toFixed(4))
      pin.style.setProperty('--evaluation-detail', evaluationDetail.toFixed(4))
      pin.style.setProperty('--semantic-offset', `${(1 - semanticHeading) * 14}px`)
      pin.style.setProperty('--synthesis-offset', `${(1 - synthesisHeading) * 14}px`)
      pin.style.setProperty('--evaluation-offset', `${(1 - evaluationHeading) * 14}px`)
      pin.dataset.materialStage = materialProgress < 0.24
        ? 'light'
        : materialProgress < 0.70
          ? 'separating'
          : 'settled'
    }

    const scheduleUpdate = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [handoff])

  return (
    <div className="delivery-material-study">
      <section ref={trackRef} className="delivery-material-track" aria-label="数据后处理材质与流动研究">
        <div ref={pinRef} className="delivery-material-pin" data-material-stage="light">
          <DeliveryMaterialCanvas progressRef={progressRef} active={canvasActive} />
          <DeliveryMaterialValues />
          <div className="delivery-material-cover" aria-hidden="true" />
          <div className="delivery-material-surface" aria-hidden="true" />
        </div>
      </section>
    </div>
  )
}
