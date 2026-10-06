function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const progress = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0))
  return progress * progress * (3 - 2 * progress)
}

export function createDominoClip(progress: number, viewportWidth: number) {
  if (progress >= 0.985) return 'inset(0 100% 0 0)'

  const stripCount = viewportWidth < 760 ? 14 : viewportWidth < 1200 ? 18 : 24
  const pitch = 100 / stripCount
  const staggerSpan = viewportWidth < 760 ? 0.34 : 0.42
  const revealDuration = 1 - staggerSpan
  const points: string[] = []

  for (let index = 0; index < stripCount; index += 1) {
    const position = index / Math.max(1, stripCount - 1)
    const delay = Math.pow(1 - position, 1.12) * staggerSpan
    const stripProgress = smoothstep(delay, delay + revealDuration, progress)
    const start = index * pitch
    const width = Math.max(0.01, (pitch + 0.12) * (1 - stripProgress))
    const end = Math.min(100, start + width)

    points.push(
      `${start.toFixed(3)}% 0%`,
      `${start.toFixed(3)}% 100%`,
      `${end.toFixed(3)}% 100%`,
      `${end.toFixed(3)}% 0%`,
    )
  }

  return `polygon(${points.join(', ')})`
}

export function createDominoRevealClip(progress: number, viewportWidth: number) {
  if (progress <= 0.015) return 'inset(0 100% 0 0 round 6px)'
  if (progress >= 0.985) return 'inset(0 round 6px)'

  const stripCount = viewportWidth < 760 ? 10 : viewportWidth < 1200 ? 14 : 18
  const pitch = 100 / stripCount
  const staggerSpan = viewportWidth < 760 ? 0.32 : 0.40
  const revealDuration = 1 - staggerSpan
  const points: string[] = []

  for (let index = 0; index < stripCount; index += 1) {
    const position = index / Math.max(1, stripCount - 1)
    const delay = Math.pow(1 - position, 1.12) * staggerSpan
    const stripProgress = smoothstep(delay, delay + revealDuration, progress)
    const end = Math.min(100, (index + 1) * pitch + 0.08)
    const width = Math.max(0.01, (pitch + 0.12) * stripProgress)
    const start = Math.max(index * pitch, end - width)

    points.push(
      `${start.toFixed(3)}% 0%`,
      `${start.toFixed(3)}% 100%`,
      `${end.toFixed(3)}% 100%`,
      `${end.toFixed(3)}% 0%`,
    )
  }

  return `polygon(${points.join(', ')})`
}
