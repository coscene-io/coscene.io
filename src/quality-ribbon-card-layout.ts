import { COLOR } from './quality-ribbon-card-palette'

/** One media viewport shared by the C00 poster and its live video texture. */
export const TASK_MEDIA_VIEW = { x: 32, y: 134, width: 1136, height: 546 }
// Both the poster and the supplied clip are a 632×304 recording pane. Exclude
// its blank side gutters and the 30px FPS overlay row, keeping both grippers
// and the task object. Fractions preserve the crop if media resolution changes.
const TASK_SOURCE_CROP = { x: 55 / 632, y: 30 / 304, width: 539 / 632, height: 274 / 304 }

export function drawTaskMedia(context: CanvasRenderingContext2D, source: CanvasImageSource,
  sourceWidth: number, sourceHeight: number) {
  const view = TASK_MEDIA_VIEW
  const crop = TASK_SOURCE_CROP
  const sx = crop.x * sourceWidth, sy = crop.y * sourceHeight
  const sw = crop.width * sourceWidth, sh = crop.height * sourceHeight
  const scale = Math.min(view.width / sw, view.height / sh)
  const width = sw * scale, height = sh * scale
  context.fillStyle = COLOR.primary
  context.fillRect(view.x, view.y, view.width, view.height)
  context.drawImage(source, sx, sy, sw, sh, view.x + (view.width - width) / 2,
    view.y + (view.height - height) / 2, width, height)
}
