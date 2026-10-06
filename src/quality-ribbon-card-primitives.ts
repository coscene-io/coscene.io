import type { TraceCardId } from './quality-trace-card-art'
import { COLOR } from './quality-ribbon-card-palette'
export { COLOR } from './quality-ribbon-card-palette'

export const FONT = '"MotionGrotesque", "PingFang SC", "Microsoft YaHei", sans-serif'
export type Pen = CanvasRenderingContext2D
export type Images = { grasp: HTMLImageElement; robot: HTMLImageElement; evidence: HTMLImageElement; place: HTMLImageElement; rightWrist: HTMLImageElement; scene: HTMLImageElement }

export function text(p: Pen, value: string, x: number, y: number, size: number,
  color: string = COLOR.ink, weight = 500) {
  p.fillStyle = color; p.font = `${weight} ${size}px ${FONT}`
  p.textBaseline = 'alphabetic'; p.fillText(value, x, y)
}
export function fill(p: Pen, x: number, y: number, width: number, height: number, color: string) {
  p.fillStyle = color; p.fillRect(x, y, width, height)
}
export function line(p: Pen, points: number[][], color: string = COLOR.rule, width = 2) {
  p.strokeStyle = color; p.lineWidth = width; p.beginPath()
  points.forEach(([x, y], index) => index ? p.lineTo(x, y) : p.moveTo(x, y))
  p.stroke()
}
export function dot(p: Pen, x: number, y: number, radius: number, color: string) {
  p.fillStyle = color; p.beginPath(); p.arc(x, y, radius, 0, Math.PI * 2); p.fill()
}
export function image(p: Pen, source: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const ratio = Math.min(width / source.naturalWidth, height / source.naturalHeight)
  const w = source.naturalWidth * ratio, h = source.naturalHeight * ratio
  p.drawImage(source, x + (width - w) / 2, y + (height - h) / 2, w, h)
}
export function identity(p: Pen, id: TraceCardId, title: string, dark = false) {
  text(p, title, 48, 78, 49, dark ? COLOR.onPrimary : COLOR.ink, 600)
  text(p, id, 1092, 74, 28, dark ? COLOR.onPrimaryMuted : COLOR.muted)
}
export function footer(p: Pen, left: string, right: string, dark = false) {
  line(p, [[48, 703], [1152, 703]], dark ? COLOR.onPrimaryLine : COLOR.rule)
  text(p, left, 48, 740, 24, dark ? COLOR.onPrimaryMuted : COLOR.muted)
  p.save(); p.textAlign = 'right'; text(p, right, 1152, 740, 24, dark ? COLOR.onPrimaryMuted : COLOR.muted); p.restore()
}
