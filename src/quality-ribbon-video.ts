import { drawTaskMedia } from './quality-ribbon-card-layout'

export type TaskCardVideoState = { playing: boolean; error: boolean }

export type TaskCardVideo = {
  setActive(active: boolean, autoplay?: boolean, preserveFrame?: boolean): void
  wantsToPlay(): boolean
  toggle(): void
  /** Called by the scene frame loop; true means the canvas texture is dirty. */
  update(): boolean
  dispose(): void
}

const VIDEO_URL = '/assets/quality-trace/task-grasp-motion.mp4'
const PREVIEW_FPS = 24

export function createTaskCardVideo(canvas: HTMLCanvasElement,
  onState: (state: TaskCardVideoState) => void): TaskCardVideo {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Task card requires a 2D canvas context')
  const original = document.createElement('canvas')
  original.width = canvas.width; original.height = canvas.height
  const originalContext = original.getContext('2d')
  if (!originalContext) throw new Error('Task card backup requires a 2D canvas context')
  originalContext.drawImage(canvas, 0, 0)

  const video = document.createElement('video')
  video.muted = true; video.defaultMuted = true
  video.loop = true; video.playsInline = true; video.preload = 'auto'
  let active = false, loaded = false, disposed = false, dirty = false
  let wantsPlay = false, failed = false, revision = 0
  let drawnFrame = -1, state: TaskCardVideoState = { playing: false, error: false }

  function publish(playing: boolean) {
    if (disposed || (state.playing === playing && state.error === failed)) return
    state = { playing, error: failed }
    onState({ ...state })
  }

  function restore() {
    context!.save()
    context!.setTransform(1, 0, 0, 1, 0, 0)
    context!.globalAlpha = 1; context!.globalCompositeOperation = 'copy'
    context!.drawImage(original, 0, 0)
    context!.restore()
    drawnFrame = -1; dirty = true
  }

  function pause() {
    wantsPlay = false; revision += 1
    video.pause(); publish(false)
  }

  function play() {
    if (!active || disposed || failed) return
    wantsPlay = true
    const request = ++revision
    void video.play().then(() => {
      // A stale promise must not pause a later successful reopen/play request.
      if (disposed || !active || !wantsPlay) { video.pause(); return }
      if (request === revision) publish(!video.paused)
    }).catch(() => {
      if (disposed || request !== revision) return
      wantsPlay = false
      // Permission/gesture rejection is a paused preview, not a media error.
      failed = video.error !== null
      publish(false)
    })
  }

  function onPlaying() {
    if (disposed || !active || !wantsPlay) { video.pause(); return }
    publish(true)
  }
  function onPause() { if (video.paused) publish(false) }
  function onError() {
    if (disposed) return
    failed = true; pause()
    if (active) restore()
  }
  video.addEventListener('playing', onPlaying)
  video.addEventListener('pause', onPause)
  video.addEventListener('error', onError)

  return {
    wantsToPlay() { return wantsPlay && active && !disposed && !failed },
    setActive(next, autoplay = true, preserveFrame = false) {
      if (disposed || next === active) return
      active = next
      if (!active) { pause(); if (!preserveFrame) restore(); return }
      drawnFrame = -1
      if (!loaded) {
        loaded = true; video.src = VIDEO_URL; video.load()
      }
      if (autoplay) play()
    },
    toggle() {
      if (!active || disposed || failed) return
      if (wantsPlay || !video.paused) pause()
      else play()
    },
    update() {
      if (disposed) return false
      if (active && !failed && video.readyState >= 2 && video.videoWidth && video.videoHeight) {
        const decodedFrames = video.getVideoPlaybackQuality?.().totalVideoFrames ?? 0
        const frame = decodedFrames > 0 ? decodedFrames : Math.floor(video.currentTime * PREVIEW_FPS)
        if (frame !== drawnFrame) {
          context.save(); context.setTransform(1, 0, 0, 1, 0, 0)
          context.globalAlpha = 1; context.globalCompositeOperation = 'source-over'
          drawTaskMedia(context, video, video.videoWidth, video.videoHeight)
          context.restore()
          drawnFrame = frame; dirty = true
        }
      }
      const changed = dirty; dirty = false
      return changed
    },
    dispose() {
      if (disposed) return
      restore()
      disposed = true; active = false; wantsPlay = false; revision += 1
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('error', onError)
      video.pause(); video.removeAttribute('src'); video.load()
      original.width = 0; original.height = 0
    },
  }
}
