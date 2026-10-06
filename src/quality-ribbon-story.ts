// One unit is the original 320svh opening. Extend the story without changing it.
export const RING_START = 1
export const ARCHIVE_START = 1.60
export const ARCHIVE_SETTLED = 2.55
export const GATHER_START = 2.82
export const GROUPS_ALIGNED = 3.18
export const GATHER_SETTLED = 3.92
// The closing ring now starts directly from the archive overview. The previous
// gathered-deck functions remain available for the saved study, not this route.
export const CLOSING_START = 2.82
export const CLOSING_SETTLED = 3.92
export const JOURNEY_END = 4.02
export const JOURNEY_TRACK_SVH = 100 + 320 * JOURNEY_END

export const archiveProgress = (progress: number) => Math.max(0,
  Math.min(1, (progress - ARCHIVE_START) / (ARCHIVE_SETTLED - ARCHIVE_START)))

/** One full circuit plus the final card's travel to the receiving plane. */
export function archiveTravel(progress: number) {
  const t = archiveProgress(progress)
  return (t * t * t * (t * (t * 6 - 15) + 10)) * 1.44
}
