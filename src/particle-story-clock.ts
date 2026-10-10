/** Shared scroll units for JS and particle shaders. One unit is one viewport height. */
export const STORY_PHASES = {
  copyExit: 0.32,
  sphereReleaseStart: 0.38,
  sphereReleaseSpread: 0.42,
  sphereReleaseFade: 0.06,
  sphereJoinDuration: 0.30,
  orbitDetailsEnd: 0.50,
  heroAuxiliaryEnd: 0.56,
  sphereColorComplete: 0.62,
  heroOccluderEnd: 0.70,
  trailTakeoverStart: 0.85,
  trailTakeoverEnd: 1.10,
  firstTextStart: 0.80,
  firstArrivalStart: 1.45,
  firstComplete: 1.85,
  firstRelease: 2.40,
  secondComplete: 3.30,
  secondRelease: 4.05,
  taskAssembled: 5.05,
  taskStart: 5.15,
  // 5.8 * .75 = 4.35: keep the original laundry action speed, then return to close the washer.
  taskEnd: 10.95,
  taskHandoff: 11.05,
  axesComplete: 11.80,
  thirdComplete: 12.10,
  curveComplete: 13.90,
  end: 14.50,
} as const

/** Decimal literals make the same phase boundaries safe to interpolate into GLSL. */
export const STORY_GLSL = Object.fromEntries(
  Object.entries(STORY_PHASES).map(([name, value]) => [name, value.toFixed(5)]),
) as Record<keyof typeof STORY_PHASES, string>

export const NARRATIVE_DURATION = STORY_PHASES.end
export const HERO_LEAD = 0.45
export const HERO_TRACK_VIEWPORTS = HERO_LEAD + NARRATIVE_DURATION + 1
export const HERO_COPY_EXIT = STORY_PHASES.copyExit
export const STORY_SMOOTHING_MS = 90

export function storyUnitsFromScroll(distance: number, viewportHeight: number) {
  return Math.min(NARRATIVE_DURATION, Math.max(0, distance / Math.max(1, viewportHeight) - HERO_LEAD))
}

/** The only temporal smoothing in the story; independent of refresh rate. */
export function smoothStoryUnits(current: number, target: number, deltaMs: number) {
  const next = current + (target - current) * (1 - Math.exp(-Math.max(0, deltaMs) / STORY_SMOOTHING_MS))
  return Math.abs(target - next) < 0.0001 ? target : next
}
