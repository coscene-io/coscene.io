import { useEffect, useRef, useState } from 'react'
import { cubicBezier, motion, useMotionValue, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import {
  ShieldCheck,
} from 'lucide-react'
import { IntelligenceHero } from './IntelligenceHero'
import { SceneHandoffSequence } from './scene-handoff-sequence'
import { SiteNavigation } from './SiteNavigation'
import './App.css'

const partnerLogoRows = [
  [
    { name: 'NVIDIA', src: '/assets/partner-logos/nvidia.png' },
    { name: 'DeepMind', src: '/assets/partner-logos/deepmind.png' },
    { name: 'Amazon Robotics', src: '/assets/partner-logos/amazon-robotics.png' },
    { name: 'OpenAI', src: '/assets/partner-logos/openai.png' },
    { name: 'Meta', src: '/assets/partner-logos/meta.png' },
    { name: 'Skild AI', src: '/assets/partner-logos/skild-ai.png' },
    { name: 'ByteDance Seed', src: '/assets/partner-logos/bytedance-seed.png' },
    { name: 'Samsung Research', src: '/assets/partner-logos/samsung-research.png' },
  ],
  [
    { name: 'Amazon Robotics', src: '/assets/partner-logos/amazon-robotics.png' },
    { name: 'Skild AI', src: '/assets/partner-logos/skild-ai.png' },
    { name: 'Unitree Robotics', src: '/assets/partner-logos/unitree.svg', variant: 'wide invert' },
    { name: 'Agibot', src: '/assets/partner-logos/agibot.png', variant: 'larger invert' },
    { name: 'Zhiyuan Robotics', src: '/assets/partner-logos/zhiyuan-robot.png', variant: 'larger' },
    { name: 'Astribot', src: '/assets/partner-logos/astribot.png', variant: 'wide' },
    { name: 'AI2 Robotics', src: '/assets/partner-logos/ai2-robotics.png', variant: 'wide' },
    { name: 'UBTECH Robotics', src: '/assets/partner-logos/ubtech-official.svg', variant: 'wide' },
  ],
  [
    { name: 'Leju Robotics', src: '/assets/partner-logos/leju-robotics.png', variant: 'wide' },
    { name: 'Noematrix', src: '/assets/partner-logos/noematrix.png', variant: 'wide' },
    { name: 'Zhejiang Humanoid', src: '/assets/partner-logos/zj-humanoid.svg', variant: 'wide' },
    { name: 'Daimeng Robotics', src: '/assets/partner-logos/daimeng-robotics.svg', variant: 'wide' },
    { name: 'Whale Dynamic', src: '/assets/partner-logos/whale-dynamic.png' },
    { name: 'Deep Reach', src: '/assets/partner-logos/deep-reach.png' },
    { name: 'Acerobotics', src: '/assets/partner-logos/acerobotics.png', variant: 'original-color dark-source' },
    { name: 'LingBot-Depth', src: '/assets/partner-logos/lingbot-depth.png' },
    { name: 'Noble Machines', src: '/assets/partner-logos/noble-machines.svg', variant: 'wide' },
    { name: 'Technology Innovation Institute', src: '/assets/partner-logos/tii.png', variant: 'larger' },
    { name: 'World Engine', src: '/assets/partner-logos/world-engine.png' },
  ],
]

const marqueeCopies = 4
const platformMergeEase = cubicBezier(0.35, 0.15, 0.65, 0.85)
const heroHeadlineLines = ['慧心巧思的多样化数据', '加速物理AI进化']
const heroVideos = [
  {
    id: 'digital-twin-task',
    src: '/assets/hero-carousel/digital-twin-task.mp4',
    poster: '/assets/hero-carousel/digital-twin-task.webp',
  },
  {
    id: 'galbot-general',
    src: '/assets/hero-carousel/galbot-general.mp4',
    poster: '/assets/hero-carousel/galbot-general.webp',
  },
  {
    id: 'unitree',
    src: '/assets/hero-carousel/unitree.mp4',
    poster: '/assets/hero-carousel/unitree.webp',
  },
  {
    id: 'galbot-retail',
    src: '/assets/hero-carousel/galbot-retail.mp4',
    poster: '/assets/hero-carousel/galbot-retail.webp',
  },
  {
    id: 'kexing-tea',
    src: '/assets/hero-carousel/kexing-tea.mp4',
    poster: '/assets/hero-carousel/kexing-tea.webp',
  },
]
const evolutionStages = [
  {
    title: '是时候让机器人与大脑\n进化更有默契了',
    body: '技术革命点燃了创新火种，也让共识变得更加宝贵。当所有人埋头创新时，分散的评测标准、失败数据，正让进化之路变得缓慢与琐碎，也造成了资源浪费。',
  },
  {
    title: '智能突破\n从告别实验室开始',
    body: '对机器人大脑公司而言，更重要的是走出实验室，获得更深入的底层接口服务与工程支持，在长尾场景中汲取足够多样、足够真实的训练信号，推动算法逼近智能上限。',
  },
  {
    title: '从算法创新中获得\n更多进化灵感',
    body: '专注本体，不意味着闭门造车。将本体做成稳定、开放、可版本化多平台，吸引各路算法创新下的共性需求，实现富有成效的软硬件升级。',
  },
]
const productionCapabilities = [
  {
    value: '01',
    title: '任务定义',
    body: '把模型目标翻译为可执行的数据任务',
  },
  {
    value: '02',
    title: '场景组织',
    body: '匹配机器人、场地与真实任务过程',
  },
  {
    value: '03',
    title: '数据治理',
    body: '清洗、质检、回放与结构化处理',
  },
  {
    value: '04',
    title: '质量评估',
    body: '与各方对齐数据质量评价体系',
  },
  {
    value: '05',
    title: '缺口改进',
    body: '基于性能提升制定新一轮数据工程方案',
  },
]
const platformTaskMeta = [
  {
    title: 'Real-World Teleoperation',
    system: 'Unitree · 3 task environments',
    actions: 'Navigate · Reach · Grasp',
  },
  {
    title: 'Multimodal Data Playback',
    system: 'Synchronized sensor topics',
    actions: 'Inspect · Compare · Validate',
  },
  {
    title: 'Robot Task Collection',
    system: '4 real-world task environments',
    actions: 'Brew · Load · Restock · Scan',
  },
  {
    title: 'Egocentric Task Collection',
    system: '4 first-person task environments',
    actions: 'Pack · Organize · Clean · Prepare',
  },
]
function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

function SignalField({ progressRef, variant }: { progressRef: { current: number }; variant: 'model' | 'robot' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })
    if (!ctx) return

    let raf = 0
    let timeoutId = 0
    let isCancelled = false
    let width = 0
    let height = 0
    let pixelRatio = 1
    let needsInactiveClear = true
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      const nextWidth = Math.max(1, Math.round(rect.width))
      const nextHeight = Math.max(1, Math.round(rect.height))
      const nextPixelRatio = Math.min(window.devicePixelRatio || 1, window.innerWidth >= 1400 ? 1.15 : 1.25)

      if (
        nextWidth === width
        && nextHeight === height
        && nextPixelRatio === pixelRatio
      ) {
        return
      }

      width = nextWidth
      height = nextHeight
      pixelRatio = nextPixelRatio
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }

    const drawModelField = (time: number, local: number) => {
      const drift = time * 0.00018
      const reveal = clamp(local * 1.18)
      const phase = drift * 3.2 + local * 0.55
      const randomUnit = (seed: number) => {
        const value = Math.sin(seed * 12.9898) * 43758.5453
        return value - Math.floor(value)
      }

      const project = (depth: number, lane: number, seed = 0) => {
        const near = 1 - depth
        const spread = width * (0.58 * near ** 1.48 + 0.062)
        const centerX = width * (0.18 + depth * 0.58 + Math.sin(depth * 2.4 + phase) * 0.016)
        const centerY = height * (0.52 - depth * 0.34 + Math.sin(depth * 3.1 + phase * 0.8) * 0.022)
        const fold = Math.sin(lane * 2.25 + depth * 5.8 + phase + seed) * height * (0.03 + near * 0.07)
        const sag = lane * lane * height * (0.022 + near * 0.058)
        const twist = Math.sin(lane * 4.2 + depth * 7.1 + seed) * width * (0.005 + near * 0.012)

        return {
          x: centerX + lane * spread + twist,
          y: centerY + sag + fold,
          near,
        }
      }

      const drawProjectedCurve = (
        depth: number,
        laneShift: number,
        alpha: number,
        lineWidth: number,
        seed: number,
        highlight = false,
      ) => {
        const steps = 104
        let previous: { x: number; y: number; near: number } | null = null
        const start = project(depth, -1.12 + laneShift, seed)
        const end = project(depth, 1.12 + laneShift, seed + 1)
        const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y)
        gradient.addColorStop(0, 'rgba(255, 118, 104, 0)')
        gradient.addColorStop(0.16, `rgba(255, 116, 100, ${alpha * 0.58})`)
        gradient.addColorStop(0.5, `rgba(255, 154, 126, ${alpha})`)
        gradient.addColorStop(0.86, `rgba(255, 116, 100, ${alpha * 0.42})`)
        gradient.addColorStop(1, 'rgba(255, 118, 104, 0)')
        ctx.strokeStyle = gradient
        ctx.lineWidth = lineWidth
        ctx.beginPath()

        for (let step = 0; step <= steps; step += 1) {
          const t = step / steps
          const lane = -1.12 + t * 2.24 + laneShift
          const warpedDepth = clamp(depth + Math.sin(t * Math.PI * 2.4 + seed + phase) * (highlight ? 0.014 : 0.01), 0, 1)
          const point = project(warpedDepth, lane, seed)

          if (!previous) {
            ctx.moveTo(point.x, point.y)
          } else {
            ctx.quadraticCurveTo(previous.x, previous.y, (previous.x + point.x) * 0.5, (previous.y + point.y) * 0.5)
          }

          previous = point
        }

        if (previous) ctx.lineTo(previous.x, previous.y)
        ctx.stroke()
      }

      ctx.globalCompositeOperation = 'source-over'
      const fieldGradient = ctx.createLinearGradient(width * 0.02, height * 0.82, width * 0.92, height * 0.12)
      fieldGradient.addColorStop(0, `rgba(90, 30, 36, ${0.24 + local * 0.14})`)
      fieldGradient.addColorStop(0.34, `rgba(42, 17, 23, ${0.18 + local * 0.12})`)
      fieldGradient.addColorStop(0.74, `rgba(7, 8, 13, ${0.12 + local * 0.05})`)
      fieldGradient.addColorStop(1, 'rgba(2, 3, 6, 0)')
      ctx.fillStyle = fieldGradient
      ctx.fillRect(0, 0, width, height)

      ctx.save()
      ctx.globalAlpha = reveal
      ctx.translate(width * 0.2, height * 0.58)
      ctx.rotate(-0.22)
      ctx.scale(2.35, 0.76)
      const foregroundHaze = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(width, height) * 0.42)
      foregroundHaze.addColorStop(0, 'rgba(255, 105, 94, 0.12)')
      foregroundHaze.addColorStop(0.48, 'rgba(148, 54, 54, 0.07)')
      foregroundHaze.addColorStop(1, 'rgba(255, 105, 94, 0)')
      ctx.fillStyle = foregroundHaze
      ctx.beginPath()
      ctx.arc(0, 0, Math.max(width, height) * 0.42, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = reveal * 0.86
      ctx.translate(width * 0.4, height * 0.44)
      ctx.rotate(-0.28)
      ctx.scale(1.8, 0.52)
      const mainVolume = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(width, height) * 0.32)
      mainVolume.addColorStop(0, 'rgba(255, 128, 108, 0.072)')
      mainVolume.addColorStop(0.36, 'rgba(255, 98, 92, 0.038)')
      mainVolume.addColorStop(0.76, 'rgba(255, 98, 92, 0.014)')
      mainVolume.addColorStop(1, 'rgba(255, 98, 92, 0)')
      ctx.fillStyle = mainVolume
      ctx.beginPath()
      ctx.arc(0, 0, Math.max(width, height) * 0.32, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      ctx.save()
      ctx.globalAlpha = reveal * 0.72
      ctx.translate(width * 0.56, height * 0.34)
      ctx.rotate(-0.38)
      ctx.scale(1.45, 0.42)
      const distantVolume = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(width, height) * 0.32)
      distantVolume.addColorStop(0, 'rgba(255, 154, 126, 0.038)')
      distantVolume.addColorStop(0.54, 'rgba(255, 110, 96, 0.018)')
      distantVolume.addColorStop(1, 'rgba(255, 110, 96, 0)')
      ctx.fillStyle = distantVolume
      ctx.beginPath()
      ctx.arc(0, 0, Math.max(width, height) * 0.32, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      ctx.globalCompositeOperation = 'lighter'

      for (let band = 0; band < 6; band += 1) {
        const topDepth = 0.04 + band * 0.11
        const bottomDepth = topDepth + 0.075
        const alpha = reveal * (0.022 + (1 - topDepth) * 0.032)

        ctx.beginPath()
        for (let step = 0; step <= 72; step += 1) {
          const lane = -1.08 + (step / 72) * 2.16
          const point = project(topDepth, lane, band * 0.6)
          if (step === 0) ctx.moveTo(point.x, point.y)
          else ctx.lineTo(point.x, point.y)
        }
        for (let step = 72; step >= 0; step -= 1) {
          const lane = -1.08 + (step / 72) * 2.16
          const point = project(bottomDepth, lane, band * 0.6 + 0.4)
          ctx.lineTo(point.x, point.y)
        }
        ctx.closePath()
        const bandFill = ctx.createLinearGradient(width * 0.02, height * 0.88, width * 0.76, height * 0.22)
        bandFill.addColorStop(0, `rgba(255, 94, 88, ${alpha})`)
        bandFill.addColorStop(0.58, `rgba(255, 132, 108, ${alpha * 0.52})`)
        bandFill.addColorStop(1, 'rgba(255, 132, 108, 0)')
        ctx.fillStyle = bandFill
        ctx.fill()
      }

      const contourDepths = [0.02, 0.075, 0.135, 0.205, 0.29, 0.395, 0.52, 0.66]
      contourDepths.forEach((depth, index) => {
        const near = 1 - depth
        const alpha = reveal * (0.065 + near * 0.165)
        drawProjectedCurve(depth, Math.sin(index * 1.4 + phase) * 0.05, alpha, 0.8 + near * 1.86, index * 0.72, index < 3)

        if (index < 3) {
          drawProjectedCurve(
            depth + 0.012,
            Math.sin(index * 1.1 + phase * 0.7) * 0.04,
            reveal * (0.038 + near * 0.086),
            5.8 + near * 6.2,
            index * 0.72 + 1.9,
            true,
          )
        }
      })

      for (let laneIndex = 0; laneIndex < 7; laneIndex += 1) {
        const baseLane = -0.78 + laneIndex * 0.26
        const points: Array<{ x: number; y: number; near: number }> = []
        for (let step = 0; step <= 64; step += 1) {
          const depth = 0.04 + (step / 64) * 0.68
          const lane = baseLane + Math.sin(depth * 5 + laneIndex + phase) * 0.035
          points.push(project(depth, lane, laneIndex * 0.38))
        }

        const start = points[0]
        const end = points[points.length - 1]
        const alpha = reveal * (laneIndex % 3 === 0 ? 0.105 : 0.055)
        const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y)
        gradient.addColorStop(0, `rgba(255, 118, 104, ${alpha})`)
        gradient.addColorStop(0.38, `rgba(255, 142, 118, ${alpha * 0.64})`)
        gradient.addColorStop(1, 'rgba(255, 118, 104, 0)')
        ctx.strokeStyle = gradient
        ctx.lineWidth = laneIndex % 3 === 0 ? 1.05 : 0.58
        ctx.beginPath()
        points.forEach((point, index) => {
          if (index === 0) ctx.moveTo(point.x, point.y)
          else {
            const previous = points[index - 1]
            ctx.quadraticCurveTo(previous.x, previous.y, (previous.x + point.x) * 0.5, (previous.y + point.y) * 0.5)
          }
        })
        ctx.stroke()
      }

      for (let ribbon = 0; ribbon < 6; ribbon += 1) {
        const depth = 0.035 + ribbon * 0.072
        const laneOffset = Math.sin(ribbon * 1.2 + phase) * 0.04
        const near = 1 - depth
        for (let dot = 0; dot < 42; dot += 1) {
          const lane = -1.02 + (dot / 41) * 2.04 + laneOffset
          const point = project(depth + Math.sin(dot * 0.28 + phase) * 0.008, lane, ribbon)
          const pulse = 0.78 + Math.sin(dot * 0.68 + ribbon + time * 0.002) * 0.22
          const radius = (0.64 + near ** 2.1 * 2.6) * pulse
          const alpha = reveal * (0.08 + near * 0.34) * (dot % 5 === 0 ? 1 : 0.64)

          ctx.fillStyle = `rgba(255, 132, 112, ${alpha})`
          ctx.beginPath()
          ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      for (let index = 0; index < 42; index += 1) {
        const seed = index * 4.731
        const depth = 0.035 + randomUnit(seed) * 0.62
        const lane = -1.02 + randomUnit(seed + 1.2) * 2.04
        const point = project(depth, lane, seed)
        const radius = 0.5 + point.near ** 2.4 * 2.7
        const alpha = clamp(reveal * (0.035 + point.near * 0.24 + Math.sin(seed + time * 0.001) * 0.018), 0.02, 0.46)

        if (index % 8 === 0 && point.near > 0.62) {
          const glowRadius = radius * 6.8
          const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, glowRadius)
          glow.addColorStop(0, `rgba(255, 112, 98, ${reveal * 0.048})`)
          glow.addColorStop(0.5, `rgba(255, 112, 98, ${reveal * 0.012})`)
          glow.addColorStop(1, 'rgba(255, 112, 98, 0)')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(point.x, point.y, glowRadius, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.fillStyle = `rgba(255, 134, 112, ${alpha})`
        ctx.beginPath()
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalCompositeOperation = 'source-over'
      const depthMask = ctx.createLinearGradient(width * 0.05, height * 0.96, width * 0.88, height * 0.2)
      depthMask.addColorStop(0, 'rgba(3, 4, 8, 0)')
      depthMask.addColorStop(0.6, 'rgba(3, 4, 8, 0.16)')
      depthMask.addColorStop(1, 'rgba(3, 4, 8, 0.48)')
      ctx.fillStyle = depthMask
      ctx.fillRect(0, 0, width, height)
      ctx.shadowBlur = 0
    }

    const drawRobotField = (time: number, local: number) => {
      const drift = time * 0.00042
      const reveal = clamp(local * 1.32)
      const phase = drift * 2.2 + local * 0.64
      const randomUnit = (seed: number) => {
        const value = Math.sin(seed * 15.713) * 43758.5453
        return value - Math.floor(value)
      }

      const project = (t: number, lane: number, depth: number, seed = 0) => {
        const near = 1 - depth
        const sweep = t ** 0.82
        const x = width * (0.03 + sweep * 0.92)
          + Math.sin(t * 5.2 + lane * 1.7 + phase + seed) * width * (0.009 + near * 0.02)
        const y = height * (0.71 - sweep * 0.34)
          + lane * height * (0.055 + near * 0.13)
          + Math.sin(t * 7.1 + seed + phase * 0.72) * height * (0.01 + near * 0.022)
        return { x, y, near }
      }

      const electricPoint = (t: number, lane: number, depth: number, seed: number) => project(
        t,
        lane + Math.sin(t * 5.4 + seed + phase) * 0.12,
        depth + Math.sin(t * 3.2 + seed) * 0.02,
        seed,
      )

      const drawElectricPulse = (lane: number, depth: number, seed: number, strength = 1) => {
        const flow = (time * (0.00034 + seed * 0.000004) + seed * 0.173 + local * 0.24) % 1
        const head = 0.1 + flow * 0.86
        const tail = 0.11 + strength * 0.018
        const startT = clamp(head - tail, 0.02, 0.98)
        const endT = clamp(head + 0.012, 0.02, 0.98)
        const alpha = reveal * strength
        const sample = (t: number) => electricPoint(clamp(t, 0.02, 0.98), lane, depth, seed)
        const tailSegments = 9

        for (let segment = 0; segment < tailSegments; segment += 1) {
          const startRatio = segment / tailSegments
          const t0 = startT + (endT - startT) * startRatio
          const t1 = startT + (endT - startT) * (startRatio + 0.58 / tailSegments)
          const a = sample(t0)
          const b = sample(t1)
          const freshness = (segment + 1) / tailSegments
          const flicker = 0.78 + Math.sin(time * 0.012 + seed * 1.7 + segment) * 0.22

          ctx.globalAlpha = alpha * (0.035 + freshness ** 2.4 * 0.58) * flicker
          ctx.strokeStyle = segment > tailSegments - 4 ? 'rgba(244, 251, 255, 0.98)' : 'rgba(155, 210, 255, 0.78)'
          ctx.lineWidth = segment > tailSegments - 4 ? 0.9 + strength * 0.3 : 0.42 + freshness * 0.28
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }

        const headPoint = sample(head)
        const headPrev = sample(head - 0.006)
        const headNext = sample(head + 0.01)
        const direction = Math.atan2(headNext.y - headPrev.y, headNext.x - headPrev.x)
        const normal = direction + Math.PI / 2
        const coreLength = Math.max(width, height) * (0.0085 + strength * 0.0022)

        ctx.globalAlpha = alpha * 0.95
        ctx.strokeStyle = 'rgba(250, 253, 255, 0.98)'
        ctx.lineWidth = 1.35
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(headPoint.x - Math.cos(direction) * coreLength * 0.55, headPoint.y - Math.sin(direction) * coreLength * 0.55)
        ctx.lineTo(headPoint.x + Math.cos(direction) * coreLength, headPoint.y + Math.sin(direction) * coreLength)
        ctx.stroke()

        ctx.globalAlpha = alpha * 0.24
        ctx.strokeStyle = 'rgba(132, 208, 255, 0.82)'
        ctx.lineWidth = 4.6
        ctx.beginPath()
        ctx.moveTo(headPoint.x - Math.cos(direction) * coreLength * 0.85, headPoint.y - Math.sin(direction) * coreLength * 0.85)
        ctx.lineTo(headPoint.x + Math.cos(direction) * coreLength * 1.18, headPoint.y + Math.sin(direction) * coreLength * 1.18)
        ctx.stroke()

        ctx.globalAlpha = alpha * 0.18
        ctx.strokeStyle = 'rgba(142, 210, 255, 0.74)'
        ctx.lineWidth = 0.48
        ctx.beginPath()
        ctx.moveTo(headPoint.x - Math.cos(normal) * coreLength * 0.72, headPoint.y - Math.sin(normal) * coreLength * 0.72)
        ctx.lineTo(headPoint.x + Math.cos(normal) * coreLength * 0.72, headPoint.y + Math.sin(normal) * coreLength * 0.72)
        ctx.stroke()

        if (Math.sin(time * 0.006 + seed) > 0.34) {
          const jumpTarget = sample(head + 0.026)
          ctx.globalAlpha = alpha * 0.13
          ctx.strokeStyle = 'rgba(166, 220, 255, 0.62)'
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(headPoint.x, headPoint.y)
          ctx.quadraticCurveTo(
            (headPoint.x + jumpTarget.x) * 0.5 + Math.cos(normal) * coreLength * 1.8,
            (headPoint.y + jumpTarget.y) * 0.5 + Math.sin(normal) * coreLength * 1.8,
            jumpTarget.x,
            jumpTarget.y,
          )
          ctx.stroke()
        }

        ctx.globalAlpha = 1
      }

      ctx.globalCompositeOperation = 'source-over'
      const fieldGradient = ctx.createLinearGradient(width * 0.08, height * 0.88, width * 0.92, height * 0.18)
      fieldGradient.addColorStop(0, `rgba(16, 28, 46, ${0.18 + reveal * 0.12})`)
      fieldGradient.addColorStop(0.34, `rgba(37, 62, 96, ${0.12 + reveal * 0.11})`)
      fieldGradient.addColorStop(0.72, `rgba(92, 135, 184, ${0.055 + reveal * 0.065})`)
      fieldGradient.addColorStop(1, 'rgba(4, 6, 10, 0)')
      ctx.fillStyle = fieldGradient
      ctx.fillRect(0, 0, width, height)

      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = reveal * 0.86
      ctx.translate(width * 0.57, height * 0.5)
      ctx.rotate(-0.16)
      ctx.scale(2.16, 0.66)
      const motionVolume = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(width, height) * 0.39)
      motionVolume.addColorStop(0, 'rgba(190, 222, 255, 0.07)')
      motionVolume.addColorStop(0.4, 'rgba(122, 178, 240, 0.042)')
      motionVolume.addColorStop(0.78, 'rgba(52, 92, 150, 0.017)')
      motionVolume.addColorStop(1, 'rgba(124, 172, 232, 0)')
      ctx.fillStyle = motionVolume
      ctx.beginPath()
      ctx.arc(0, 0, Math.max(width, height) * 0.36, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      ctx.globalCompositeOperation = 'lighter'
      ctx.shadowColor = 'rgba(126, 190, 255, 0.18)'
      ctx.shadowBlur = 18
      for (let ribbon = 0; ribbon < 4; ribbon += 1) {
        const lane = -0.74 + ribbon * 0.34
        const depth = 0.02 + ribbon * 0.035
        const start = project(0, lane, depth, ribbon + 8)
        const end = project(1, lane + 0.1, depth * 0.76, ribbon + 9)
        const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y)
        gradient.addColorStop(0, 'rgba(132, 188, 255, 0)')
        gradient.addColorStop(0.22, `rgba(136, 196, 255, ${reveal * 0.038})`)
        gradient.addColorStop(0.52, `rgba(226, 240, 255, ${reveal * 0.072})`)
        gradient.addColorStop(0.82, `rgba(112, 178, 255, ${reveal * 0.026})`)
        gradient.addColorStop(1, 'rgba(132, 188, 255, 0)')
        ctx.strokeStyle = gradient
        ctx.lineWidth = 8.5 - ribbon * 1.35
        ctx.lineCap = 'round'
        ctx.beginPath()
        for (let step = 0; step <= 96; step += 1) {
          const t = step / 96
          const point = project(
            t,
            lane + Math.sin(t * Math.PI * 2.2 + ribbon + phase * 0.72) * 0.11,
            depth + Math.sin(t * 2.2 + ribbon) * 0.018,
            ribbon + 11,
          )
          if (step === 0) ctx.moveTo(point.x, point.y)
          else ctx.lineTo(point.x, point.y)
        }
        ctx.stroke()
      }
      ctx.shadowBlur = 0

      for (let band = 0; band < 10; band += 1) {
        const lane = -1.18 + band * 0.24
        const depth = 0.08 + band * 0.038
        const start = project(0.02, lane, depth, band)
        const end = project(1, lane + Math.sin(band + phase) * 0.12, depth * 0.82, band + 1)
        const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y)
        const alpha = reveal * (0.024 + (band % 3 === 0 ? 0.026 : 0.01))
        gradient.addColorStop(0, 'rgba(146, 184, 238, 0)')
        gradient.addColorStop(0.28, `rgba(166, 205, 255, ${alpha * 0.72})`)
        gradient.addColorStop(0.68, `rgba(212, 230, 255, ${alpha})`)
        gradient.addColorStop(1, 'rgba(166, 205, 255, 0)')
        ctx.strokeStyle = gradient
        ctx.lineWidth = band % 3 === 0 ? 1.5 : 0.72
        ctx.beginPath()
        for (let step = 0; step <= 80; step += 1) {
          const t = step / 80
          const point = project(t, lane + Math.sin(t * Math.PI * 2 + band + phase) * 0.1, depth + Math.sin(t * 2.4 + band) * 0.026, band)
          if (step === 0) {
            ctx.moveTo(point.x, point.y)
          } else {
            const previous = project((step - 1) / 80, lane + Math.sin(((step - 1) / 80) * Math.PI * 2 + band + phase) * 0.1, depth, band)
            ctx.quadraticCurveTo(previous.x, previous.y, (previous.x + point.x) * 0.5, (previous.y + point.y) * 0.5)
          }
        }
        ctx.stroke()

        if (band % 3 === 0) {
          ctx.strokeStyle = `rgba(214, 230, 255, ${reveal * 0.028})`
          ctx.lineWidth = 7.2
          ctx.stroke()
        }
      }

      for (let trace = 0; trace < 8; trace += 1) {
        const baseLane = -0.9 + trace * 0.25
        const baseDepth = 0.05 + trace * 0.04
        ctx.beginPath()
        for (let step = 0; step <= 48; step += 1) {
          const t = step / 48
          const lane = baseLane + Math.sin(t * 5.4 + trace + phase) * 0.16
          const point = project(t, lane, baseDepth + Math.sin(t * 3.4 + trace) * 0.022, trace)
          if (step === 0) ctx.moveTo(point.x, point.y)
          else ctx.lineTo(point.x, point.y)
        }
        ctx.strokeStyle = `rgba(225, 236, 255, ${reveal * (trace % 2 === 0 ? 0.032 : 0.019)})`
        ctx.lineWidth = trace % 2 === 0 ? 0.96 : 0.48
        ctx.stroke()
      }

      ctx.globalCompositeOperation = 'lighter'
      ;[
        [-0.82, 0.05, 1.3, 1.38],
        [-0.54, 0.07, 2.05, 1.02],
        [-0.23, 0.08, 2.7, 1.18],
        [0.08, 0.1, 4.1, 1.3],
        [0.36, 0.13, 5.5, 0.96],
        [0.64, 0.16, 6.9, 0.86],
      ].forEach(([lane, depth, seed, strength]) => {
        drawElectricPulse(lane, depth, seed, strength)
      })

      for (let cluster = 0; cluster < 6; cluster += 1) {
        const anchorT = 0.35 + cluster * 0.105
        const anchorLane = -0.58 + cluster * 0.18 + Math.sin(phase + cluster) * 0.04
        const anchor = project(anchorT, anchorLane, 0.1 + cluster * 0.05, cluster)
        const pulse = 0.82 + Math.sin(time * 0.0012 + cluster) * 0.18
        const haloRadius = Math.max(width, height) * (0.036 + cluster * 0.008) * pulse
        const halo = ctx.createRadialGradient(anchor.x, anchor.y, 0, anchor.x, anchor.y, haloRadius)
        halo.addColorStop(0, `rgba(212, 230, 255, ${reveal * 0.036})`)
        halo.addColorStop(0.38, `rgba(130, 184, 255, ${reveal * 0.017})`)
        halo.addColorStop(1, 'rgba(130, 184, 255, 0)')
        ctx.fillStyle = halo
        ctx.beginPath()
        ctx.arc(anchor.x, anchor.y, haloRadius, 0, Math.PI * 2)
        ctx.fill()
      }

      for (let index = 0; index < 112; index += 1) {
        const seed = index * 4.917
        const t = 0.16 + randomUnit(seed) * 0.8
        const lane = -1.18 + randomUnit(seed + 0.8) * 2.14
        const depth = 0.05 + randomUnit(seed + 1.7) * 0.42
        const point = project(t, lane + Math.sin(seed + phase) * 0.06, depth, seed)
        const sparkle = 0.74 + Math.sin(seed + time * 0.0015) * 0.26
        const radius = (0.44 + point.near * 1.55) * sparkle
        const alpha = clamp(reveal * (0.04 + point.near * 0.17) * (index % 8 === 0 ? 1.28 : 0.68), 0.016, 0.32)
        ctx.fillStyle = `rgba(218, 232, 255, ${alpha})`
        ctx.beginPath()
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalCompositeOperation = 'source-over'
      const depthMask = ctx.createLinearGradient(width * 0.02, height * 0.96, width * 0.92, height * 0.22)
      depthMask.addColorStop(0, 'rgba(3, 4, 8, 0.04)')
      depthMask.addColorStop(0.42, 'rgba(3, 4, 8, 0)')
      depthMask.addColorStop(0.83, 'rgba(3, 4, 8, 0.18)')
      depthMask.addColorStop(1, 'rgba(3, 4, 8, 0.5)')
      ctx.fillStyle = depthMask
      ctx.fillRect(0, 0, width, height)
      ctx.shadowBlur = 0
    }

    const scheduleDraw = (delay: number) => {
      if (isCancelled) return

      timeoutId = window.setTimeout(() => {
        if (!isCancelled) {
          raf = window.requestAnimationFrame(draw)
        }
      }, delay)
    }

    const draw = (time: number) => {
      const currentProgress = progressRef.current
      const isStageActive = variant === 'model'
        ? currentProgress >= 0.33 && currentProgress <= 0.69
        : currentProgress >= 0.65 && currentProgress <= 0.93

      resizeCanvas()

      if (!isStageActive) {
        if (needsInactiveClear) {
          ctx.clearRect(0, 0, width, height)
          ctx.fillStyle = '#040509'
          ctx.fillRect(0, 0, width, height)
          needsInactiveClear = false
        }
        scheduleDraw(140)
        return
      }

      needsInactiveClear = true
      const local = variant === 'model'
        ? clamp((currentProgress - 0.34) / (0.68 - 0.34))
        : clamp((currentProgress - 0.66) / (0.9 - 0.66))

      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = '#040509'
      ctx.fillRect(0, 0, width, height)

      if (variant === 'model') {
        drawModelField(time, local)
      } else {
        drawRobotField(time, local)
      }

      scheduleDraw(34)
    }

    raf = window.requestAnimationFrame(draw)
    window.addEventListener('resize', resizeCanvas)

    return () => {
      isCancelled = true
      window.cancelAnimationFrame(raf)
      window.clearTimeout(timeoutId)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [progressRef, variant])

  return (
    <div className="signal-field" data-variant={variant} aria-hidden="true">
      <canvas ref={canvasRef} className="signal-field-canvas" />
    </div>
  )
}

function HeroVideoCarousel() {
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([])
  const activeIndexRef = useRef(0)
  const transitionLockedRef = useRef(false)
  const transitionTimerRef = useRef<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const playNext = (fromIndex: number) => {
    if (transitionLockedRef.current || activeIndexRef.current !== fromIndex) return

    const nextIndex = (fromIndex + 1) % heroVideos.length
    const currentVideo = videoRefs.current[fromIndex]
    const nextVideo = videoRefs.current[nextIndex]
    if (!currentVideo || !nextVideo) return

    transitionLockedRef.current = true
    nextVideo.currentTime = 0
    void nextVideo.play().then(() => {
      if (activeIndexRef.current !== fromIndex) {
        transitionLockedRef.current = false
        return
      }

      activeIndexRef.current = nextIndex
      setActiveIndex(nextIndex)

      transitionTimerRef.current = window.setTimeout(() => {
        currentVideo.pause()
        currentVideo.currentTime = 0
        transitionLockedRef.current = false
        transitionTimerRef.current = null
      }, 1450)
    }).catch(() => {
      transitionLockedRef.current = false
      nextVideo.load()
    })
  }

  useEffect(() => {
    const firstVideo = videoRefs.current[0]
    if (firstVideo) {
      void firstVideo.play().catch(() => undefined)
    }

    const handleVisibilityChange = () => {
      const activeVideo = videoRefs.current[activeIndexRef.current]
      if (!activeVideo) return

      if (document.hidden) {
        activeVideo.pause()
      } else {
        void activeVideo.play().catch(() => undefined)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    const playbackWatchdog = window.setInterval(() => {
      if (document.hidden) return

      const currentIndex = activeIndexRef.current
      const activeVideo = videoRefs.current[currentIndex]
      if (!activeVideo) return

      if (activeVideo.error || activeVideo.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
        activeVideo.load()
      }

      if (activeVideo.ended) {
        playNext(currentIndex)
      } else if (activeVideo.paused && activeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        void activeVideo.play().catch(() => undefined)
      }
    }, 2000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.clearInterval(playbackWatchdog)
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="hero-video-carousel" aria-hidden="true">
      {heroVideos.map((video, index) => (
        <video
          ref={(element) => {
            videoRefs.current[index] = element
          }}
          className="cinematic-video"
          data-active={index === activeIndex ? 'true' : 'false'}
          data-scene={video.id}
          key={video.id}
          poster={video.poster}
          muted
          playsInline
          autoPlay={index === 0}
          preload="auto"
          onCanPlay={(event) => {
            if (activeIndexRef.current === index && event.currentTarget.paused) {
              void event.currentTarget.play().catch(() => undefined)
            }
          }}
          onEnded={() => playNext(index)}
          onTimeUpdate={(event) => {
            const element = event.currentTarget
            if (
              activeIndexRef.current === index
              && Number.isFinite(element.duration)
              && element.duration > 1.4
              && element.duration - element.currentTime <= 1.4
            ) {
              playNext(index)
            }
          }}
        >
          <source src={video.src} type="video/mp4" />
        </video>
      ))}
    </div>
  )
}

function FitHeadline({ lines }: { lines: string[] }) {
  const headlineRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const headline = headlineRef.current
    if (!headline) return

    let animationFrame = 0
    let lastWidth = -1

    const fitHeadline = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(() => {
        const availableWidth = headline.clientWidth
        if (availableWidth <= 0) return

        const isCompact = window.innerWidth <= 900
        const maximumSize = isCompact ? 52 : 108
        const minimumSize = isCompact ? 8 : 24
        let lowerBound = minimumSize
        let upperBound = maximumSize
        let fittedSize = minimumSize

        while (lowerBound <= upperBound) {
          const candidateSize = Math.floor((lowerBound + upperBound) / 2)
          headline.style.fontSize = `${candidateSize}px`
          const widestLine = Math.max(
            ...Array.from(headline.querySelectorAll<HTMLElement>('.hero-headline-line'))
              .map((line) => line.scrollWidth),
          )

          if (widestLine <= availableWidth) {
            fittedSize = candidateSize
            lowerBound = candidateSize + 1
          } else {
            upperBound = candidateSize - 1
          }
        }

        headline.style.fontSize = `${fittedSize}px`
      })
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      const nextWidth = entry.contentRect.width
      if (Math.abs(nextWidth - lastWidth) < 0.5) return
      lastWidth = nextWidth
      fitHeadline()
    })

    resizeObserver.observe(headline)
    fitHeadline()
    void document.fonts.ready.then(fitHeadline)

    return () => {
      resizeObserver.disconnect()
      window.cancelAnimationFrame(animationFrame)
    }
  }, [lines])

  return (
    <h1 ref={headlineRef}>
      {lines.map((line) => (
        <span className="hero-headline-line" key={line}>{line}</span>
      ))}
    </h1>
  )
}

export function PlatformConcept() {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([])
  const sectionVisibleRef = useRef(false)
  const platformProgressRef = useRef(0)
  const benchmarkIndexRef = useRef(0)
  const taskContentIndexRef = useRef(0)
  const taskRotationLockedRef = useRef(false)
  const taskNextAdvanceAtRef = useRef(performance.now() + 6400)
  const videoPlaybackSignatureRef = useRef('')
  const videoShouldPlayRef = useRef<boolean[]>([])
  const videoPlayPendingRef = useRef<boolean[]>([])
  const dataAssetsEnteringRef = useRef(false)
  const [benchmarkIndex, setBenchmarkIndex] = useState(0)
  const [taskContentIndex, setTaskContentIndex] = useState(0)
  const [isCompactPlatform, setIsCompactPlatform] = useState(() => window.innerWidth <= 680)
  const [platformViewport, setPlatformViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  const scrollYProgress = useMotionValue(0)
  const mergeProgress = useTransform(scrollYProgress, [0.55, 0.675], [0, 1])
  const taskHandoffProgress = useTransform(scrollYProgress, [0.7, 0.82], [0, 1], { ease: platformMergeEase })

  const headlineOpacity = useTransform(scrollYProgress, [0, 0.1, 0.16, 0.2], [1, 1, 0.54, 0])
  const headlineY = useTransform(scrollYProgress, [0, 0.12, 0.2], [0, -7, -34])

  const motionSceneOpacity = useTransform(scrollYProgress, [0, 0.08, 0.24], [0.9, 0.92, 1])
  const motionSceneY = useTransform(scrollYProgress, [0, 0.08, 0.18, 0.29, 0.55], [112, 92, 54, 0, -12])
  const motionSceneScale = useTransform(scrollYProgress, [0, 0.08, 0.18, 0.3, 0.55], [0.84, 0.86, 0.9, 1, 1.025])
  const infrastructureOpacity = useTransform(scrollYProgress, [0, 0.12, 0.2, 0.29], [1, 1, 0.88, 0])
  const infrastructureY = useTransform(scrollYProgress, [0, 0.12, 0.29], [0, -10, 128])
  const infrastructureScale = useTransform(scrollYProgress, [0, 0.12, 0.29], [1, 1.015, 1.12])
  const infrastructureRotateX = useTransform(scrollYProgress, [0, 0.12, 0.29], [2, 5, 16])
  const infrastructureCenterY = useTransform(scrollYProgress, [0, 0.12, 0.29], [0, 4, 150])
  const frameChromeOpacity = useTransform(scrollYProgress, [0, 0.12, 0.55, 0.675], [1, 1, 0.82, 0.68])
  const frameRadius = useTransform(scrollYProgress, [0, 0.18, 0.55, 1], ['7px', '7px', '4px', '4px'])
  const mergeSceneOpacity = useTransform(scrollYProgress, [0, 0.684, 0.7, 1], [1, 1, 0, 0])
  const mergeSceneY = useTransform(mergeProgress, [0, 1], [0, -8])
  const mergeSceneScale = useTransform(mergeProgress, [0, 1], [1, 1])
  const platformAspectRatio = platformViewport.width / Math.max(1, platformViewport.height)
  const sideInitialSpreadFactor = isCompactPlatform
    ? 0.405
    : 0.405 + 0.045 * clamp((1.85 - platformAspectRatio) / 0.3)
  const sideInitialSpread = Math.min(
    platformViewport.width * sideInitialSpreadFactor,
    770,
  )
  const sideMotionProgress = [0, 0.06, 0.675]
  const sideMotionRemaining = useTransform(scrollYProgress, sideMotionProgress, [1, 1, 0])
  const sideMotionScaleBaseline = 0.855
  const motionLeftX = useTransform(
    () => -sideInitialSpread * sideMotionRemaining.get() * sideMotionScaleBaseline / motionSceneScale.get(),
  )
  const motionRightX = useTransform(
    () => sideInitialSpread * sideMotionRemaining.get() * sideMotionScaleBaseline / motionSceneScale.get(),
  )
  const motionLeftRotateY = useTransform(scrollYProgress, sideMotionProgress, [28, 28, 0])
  const motionRightRotateY = useTransform(scrollYProgress, sideMotionProgress, [-28, -28, 0])
  const motionSideOpacity = useTransform(mergeProgress, [0, 0.96, 0.98, 1], [1, 1, 0, 0])
  const motionSideScale = useTransform(mergeProgress, [0, 1], [1, 1])
  const motionSideFilter = useTransform(mergeProgress, [0, 1], ['none', 'none'])
  const motionSideClipPath = useTransform(
    mergeProgress,
    [0, 0.12, 0.72, 1],
    ['inset(0% 0% round 7px)', 'inset(0% 0% round 7px)', 'inset(33.125% 0% round 0px)', 'inset(33.125% 0% round 0px)'],
  )

  const taskEndpointY = isCompactPlatform ? 12.67 : 43.33
  const taskEndpointScale = 0.989
  const taskEndpointRotateY = -1.82
  const taskBaseWidth = isCompactPlatform
    ? platformViewport.width - 36
    : Math.min(platformViewport.width * 0.58, 900)
  const taskBaseHeight = taskBaseWidth / (isCompactPlatform ? 1.6 : 16 / 9)
  const taskBaseLeft = isCompactPlatform
    ? 18
    : Math.max(50, platformViewport.width * 0.5 - 690)
  const taskBaseTop = platformViewport.height * (isCompactPlatform ? 0.45 : 0.25)
  const lockedMainWidth = isCompactPlatform
    ? platformViewport.width * 0.86 * 1.0608
    : Math.min(
      Math.min(platformViewport.width * 0.52, 900) * 1.0608,
      platformViewport.height * 0.89,
    )
  const lockedMainCenterY = platformViewport.height * (isCompactPlatform ? 0.62 : 0.625) - 8
  const taskMergeStartScale = lockedMainWidth / (taskBaseWidth * taskEndpointScale)
  const taskMergeStartX = (
    platformViewport.width * 0.5 - (taskBaseLeft + taskBaseWidth * 0.5)
  ) / taskEndpointScale - taskBaseWidth * (1 - taskMergeStartScale) * 0.5
  const taskMergeStartY = (lockedMainCenterY - (taskBaseTop + taskBaseHeight * 0.5 + taskEndpointY)) / taskEndpointScale
  const taskAnchorX = useTransform(scrollYProgress, [0, 0.82, 1], [0, 0, isCompactPlatform ? 0 : -34])
  const taskAnchorY = useTransform(scrollYProgress, [0, 0.82, 0.85, 0.92, 1], [taskEndpointY, taskEndpointY, 0, 0, -70])
  const taskAnchorScale = taskEndpointScale
  const taskAnchorRotateY = useTransform(scrollYProgress, [0, 0.82, 0.85, 1], [taskEndpointRotateY, taskEndpointRotateY, -2.5, -1])
  const taskMergeX = useTransform(taskHandoffProgress, [0, 1], [taskMergeStartX, 0])
  const taskMergeY = useTransform(taskHandoffProgress, [0, 1], [taskMergeStartY, 0])
  const taskMergeScale = taskMergeStartScale
  const taskMergeRotateY = useTransform(taskHandoffProgress, [0, 1], [-taskEndpointRotateY, 0])
  const taskClipPath = useTransform(mergeProgress, [0, 1], ['inset(0% 0% round 0px)', 'inset(0% 0% round 0px)'])
  const taskFilter = useTransform(taskHandoffProgress, [0, 0.18, 1], ['brightness(0.94)', 'brightness(1)', 'brightness(1)'])
  const dataStatementOpacity = useTransform(scrollYProgress, [0, 0.85, 0.89, 1], [0, 0, 1, 1])
  const dataStatementX = useTransform(scrollYProgress, [0.85, 0.89, 1], [32, 0, 0])
  const partnerOpacity = useTransform(scrollYProgress, [0, 0.9, 0.97, 1], [0, 0, 1, 1])
  const partnerY = useTransform(scrollYProgress, [0.9, 0.97, 1], [34, 0, 0])
  const activeTaskContent = taskContentIndex

  const syncVideoPlayback = () => {
    const sectionVisible = sectionVisibleRef.current && !dataAssetsEnteringRef.current
    const motionStageActive = sectionVisible && platformProgressRef.current < 0.675
    const activeTaskIndex = taskContentIndexRef.current
    const sideMotionActive = motionStageActive && activeTaskIndex !== 0
    const playbackSignature = [
      sectionVisible ? 1 : 0,
      motionStageActive ? 1 : 0,
      benchmarkIndexRef.current,
      activeTaskIndex,
    ].join(':')

    if (videoPlaybackSignatureRef.current === playbackSignature) return
    videoPlaybackSignatureRef.current = playbackSignature

    videoRefs.current.forEach((video, index) => {
      if (!video) return
      const isSideVideo = index < 5
      const isCurrentSideVideo = index === 0 || index === benchmarkIndexRef.current + 1
      const isTriptychVideo = index === 5
      const isSoftwareVideo = index === 8
      const isRobotTaskMatrix = index === 9
      const isEgocentricTaskMatrix = index === 10
      const shouldPlay = isSideVideo
        ? sideMotionActive && isCurrentSideVideo
        : sectionVisible && (
          (isTriptychVideo && activeTaskIndex === 0)
          || (isSoftwareVideo && activeTaskIndex === 1)
          || (isRobotTaskMatrix && activeTaskIndex === 2)
          || (isEgocentricTaskMatrix && activeTaskIndex === 3)
        )
      videoShouldPlayRef.current[index] = shouldPlay

      if (shouldPlay) {
        if (!video.paused || videoPlayPendingRef.current[index]) return
        videoPlayPendingRef.current[index] = true
        void video.play()
          .then(() => {
            videoPlayPendingRef.current[index] = false
            if (!videoShouldPlayRef.current[index]) video.pause()
          })
          .catch(() => {
            videoPlayPendingRef.current[index] = false
            if (videoShouldPlayRef.current[index]) videoPlaybackSignatureRef.current = ''
          })
      } else {
        video.pause()
      }
    })
  }

  useEffect(() => {
    const updateCompactPlatform = () => {
      setIsCompactPlatform(window.innerWidth <= 680)
      setPlatformViewport({ width: window.innerWidth, height: window.innerHeight })
    }

    updateCompactPlatform()
    window.addEventListener('resize', updateCompactPlatform)

    return () => window.removeEventListener('resize', updateCompactPlatform)
  }, [])

  useEffect(() => {
    benchmarkIndexRef.current = benchmarkIndex
    syncVideoPlayback()
  }, [benchmarkIndex])

  useEffect(() => {
    const dataAssetsSection = document.getElementById('data-assets')
    if (!dataAssetsSection) return

    const observer = new IntersectionObserver(([entry]) => {
      const nextEntering = entry.isIntersecting && entry.intersectionRatio >= 0.26
      if (dataAssetsEnteringRef.current === nextEntering) return
      dataAssetsEnteringRef.current = nextEntering
      videoPlaybackSignatureRef.current = ''
      syncVideoPlayback()
    }, { threshold: [0, 0.26] })

    observer.observe(dataAssetsSection)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    taskContentIndexRef.current = taskContentIndex
    syncVideoPlayback()
  }, [taskContentIndex])

  useEffect(() => {
    const taskContentTimer = window.setInterval(() => {
      const now = performance.now()
      if (!sectionVisibleRef.current || taskRotationLockedRef.current) {
        taskNextAdvanceAtRef.current = now + 6400
      } else if (now >= taskNextAdvanceAtRef.current) {
        taskNextAdvanceAtRef.current = now + 6400
        setTaskContentIndex((current) => (current + 1) % platformTaskMeta.length)
      }
    }, 250)
    const benchmarkTimer = window.setInterval(() => {
      if (!sectionVisibleRef.current) return
      setBenchmarkIndex((current) => (current + 1) % 4)
    }, 5200)

    return () => {
      window.clearInterval(taskContentTimer)
      window.clearInterval(benchmarkTimer)
    }
  }, [])

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    platformProgressRef.current = latest
    const nextTaskRotationLocked = latest >= 0.55 && latest <= 0.85
    if (nextTaskRotationLocked !== taskRotationLockedRef.current) {
      taskRotationLockedRef.current = nextTaskRotationLocked
      taskNextAdvanceAtRef.current = performance.now() + 6400
    }
    syncVideoPlayback()
  })

  useEffect(() => {
    let animationFrame = 0

    const updateProgress = () => {
      animationFrame = 0
      const section = sectionRef.current
      if (!section) return

      const sectionTop = window.scrollY + section.getBoundingClientRect().top
      const scrollRange = Math.max(1, section.offsetHeight - window.innerHeight)
      const progress = (window.scrollY - sectionTop) / scrollRange
      scrollYProgress.set(Math.min(1, Math.max(0, progress)))
    }

    const scheduleUpdate = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(updateProgress)
    }

    updateProgress()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      window.cancelAnimationFrame(animationFrame)
    }
  }, [scrollYProgress])

  useEffect(() => {
    const shouldPlayStates = videoShouldPlayRef.current
    const videos = videoRefs.current
    const observer = new IntersectionObserver(([entry]) => {
      const nextVisible = entry.isIntersecting && entry.intersectionRatio >= 0.12
      if (nextVisible && !sectionVisibleRef.current) {
        taskNextAdvanceAtRef.current = performance.now() + 6400
      }
      sectionVisibleRef.current = nextVisible
      syncVideoPlayback()
    }, { threshold: 0.12 })

    observer.observe(sectionRef.current!)

    return () => {
      observer.disconnect()
      sectionVisibleRef.current = false
      videoPlaybackSignatureRef.current = ''
      shouldPlayStates.fill(false)
      videos.forEach((video) => {
        if (video && !video.paused) video.pause()
      })
    }
  }, [])

  return (
    <section ref={sectionRef} id="platform" className="platform-band">
      <div className="platform-pin">
        <div className="platform-atmosphere" aria-hidden="true" />

        <motion.div className="platform-logo-horizon" style={{ opacity: partnerOpacity, y: partnerY }} aria-label="客户与机器人合作伙伴">
          <p className="partner-heading">客户与伙伴</p>
          <div className="partner-marquee">
            <div className="partner-row" data-direction="left">
              {Array.from({ length: marqueeCopies }, (_, copyIndex) => (
                <div className="partner-sequence" aria-hidden={copyIndex > 0} key={`partner-sequence-${copyIndex}`}>
                  {partnerLogoRows.slice(1).flat().map((item) => (
                    <span className="partner-logo" data-variant={item.variant} key={`${item.name}-${copyIndex}`}>
                      <img src={item.src} alt={copyIndex === 0 ? item.name : ''} />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="platform-infrastructure-field"
          style={{
            opacity: infrastructureOpacity,
            y: infrastructureY,
            scale: infrastructureScale,
            rotateX: infrastructureRotateX,
          }}
          aria-hidden="true"
        >
          <div className="platform-infrastructure-matrix">
            <motion.span style={{ y: infrastructureCenterY }} />
          </div>
        </motion.div>

        <motion.div
          className="platform-spatial-stage"
          style={{ opacity: motionSceneOpacity, y: motionSceneY, scale: motionSceneScale }}
          aria-hidden="true"
        >
          <motion.div
            className="platform-merge-stage"
            style={{ opacity: mergeSceneOpacity, y: mergeSceneY, scale: mergeSceneScale }}
          >
            <motion.div
              className="platform-motion-carrier platform-motion-carrier-side"
              style={{ x: motionLeftX }}
            >
              <motion.div
                className="platform-motion-window platform-motion-window-left"
                style={{ rotateY: motionLeftRotateY, scale: motionSideScale, opacity: motionSideOpacity, filter: motionSideFilter, clipPath: motionSideClipPath, borderRadius: frameRadius }}
              >
                <video
                  ref={(video) => { videoRefs.current[0] = video }}
                  poster="/assets/platform-spatial/motion-tall-a-poster.jpg"
                  muted
                  loop
                  playsInline
                  preload="metadata"
                >
                  <source src="/assets/platform-spatial/motion-tall-a.m4v" type="video/mp4" />
                </video>
                <motion.span className="platform-motion-frame" style={{ opacity: frameChromeOpacity }} />
              </motion.div>
            </motion.div>

            <motion.div
              className="platform-motion-carrier platform-motion-carrier-side"
              style={{ x: motionRightX }}
            >
              <motion.div
                className="platform-motion-window platform-motion-window-right"
                style={{ rotateY: motionRightRotateY, scale: motionSideScale, opacity: motionSideOpacity, filter: motionSideFilter, clipPath: motionSideClipPath, borderRadius: frameRadius }}
              >
                <div className="platform-media-stack platform-benchmark-stack">
                  <video
                    ref={(video) => { videoRefs.current[1] = video }}
                    data-active={benchmarkIndex === 0 ? 'true' : 'false'}
                    poster="/assets/platform-bridge/model-benchmark-roboarena.png"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  >
                    <source src="/assets/platform-bridge/model-benchmark-roboarena.m4v" type="video/mp4" />
                  </video>
                  <video
                    ref={(video) => { videoRefs.current[2] = video }}
                    data-active={benchmarkIndex === 1 ? 'true' : 'false'}
                    poster="/assets/platform-bridge/model-benchmark-huggingface.png"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  >
                    <source src="/assets/platform-bridge/model-benchmark-huggingface.m4v" type="video/mp4" />
                  </video>
                  <video
                    ref={(video) => { videoRefs.current[3] = video }}
                    data-active={benchmarkIndex === 2 ? 'true' : 'false'}
                    poster="/assets/platform-bridge/model-benchmark-confidence.png"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  >
                    <source src="/assets/platform-bridge/model-benchmark-confidence.m4v" type="video/mp4" />
                  </video>
                  <video
                    ref={(video) => { videoRefs.current[4] = video }}
                    data-active={benchmarkIndex === 3 ? 'true' : 'false'}
                    poster="/assets/platform-bridge/model-benchmark-battles.png"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  >
                    <source src="/assets/platform-bridge/model-benchmark-battles.m4v" type="video/mp4" />
                  </video>
                </div>
                <motion.span className="platform-motion-frame" style={{ opacity: frameChromeOpacity }} />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          className="platform-task-anchor"
          style={{ x: taskAnchorX, y: taskAnchorY, scale: taskAnchorScale, rotateY: taskAnchorRotateY }}
        >
          <motion.div
            className="platform-task-plane"
            style={{ x: taskMergeX, y: taskMergeY, scale: taskMergeScale, rotateY: taskMergeRotateY, clipPath: taskClipPath, filter: taskFilter }}
            aria-hidden="true"
          >
            <div className="platform-task-content-stack">
              <video
                ref={(video) => { videoRefs.current[5] = video }}
                className="platform-task-content platform-task-triptych-video"
                data-active={activeTaskContent === 0 ? 'true' : 'false'}
                muted
                loop
                playsInline
                preload="metadata"
              >
                <source
                  media="(max-width: 680px)"
                  src="/assets/platform-bridge/unitree-teleop-triptych-16x10.mp4"
                  type="video/mp4"
                />
                <source src="/assets/platform-bridge/unitree-teleop-triptych-16x9.mp4" type="video/mp4" />
              </video>
              <video
                ref={(video) => { videoRefs.current[8] = video }}
                className="platform-task-content platform-task-software"
                data-active={activeTaskContent === 1 ? 'true' : 'false'}
                muted
                loop
                playsInline
                preload="metadata"
              >
                <source src="/assets/platform-bridge/multimodal-data-playback.m4v" type="video/mp4" />
              </video>
              <video
                ref={(video) => { videoRefs.current[9] = video }}
                className="platform-task-content platform-task-catalog-matrix"
                data-active={activeTaskContent === 2 ? 'true' : 'false'}
                poster="/assets/platform-bridge/catalog-robot-task-matrix.jpg"
                muted
                loop
                playsInline
                preload="metadata"
              >
                <source src="/assets/platform-bridge/catalog-robot-task-matrix.m4v" type="video/mp4" />
              </video>
              <video
                ref={(video) => { videoRefs.current[10] = video }}
                className="platform-task-content platform-task-catalog-matrix"
                data-active={activeTaskContent === 3 ? 'true' : 'false'}
                poster="/assets/platform-bridge/catalog-egocentric-task-matrix.jpg"
                muted
                loop
                playsInline
                preload="metadata"
              >
                <source src="/assets/platform-bridge/catalog-egocentric-task-matrix.m4v" type="video/mp4" />
              </video>
            </div>
            <div className="platform-task-meta">
              <span>{platformTaskMeta[activeTaskContent].title}</span>
              <span>{platformTaskMeta[activeTaskContent].system}</span>
              <span>{platformTaskMeta[activeTaskContent].actions}</span>
            </div>
            <span className="platform-task-frame" />
          </motion.div>
        </motion.div>

        <motion.div className="company-statement" style={{ opacity: headlineOpacity, y: headlineY }}>
          <p className="eyebrow">Kexing Space</p>
          <h2>
            <span>刻行时空是</span>
            <strong>连接全球模型与机器人公司</strong>
            <span>的数据基础设施。</span>
          </h2>
        </motion.div>

        <motion.div className="platform-data-statement" style={{ opacity: dataStatementOpacity, x: dataStatementX }}>
          <p>
            <span>生态中立使得我们能与机器人领域的</span>
            <span>佼佼者广泛合作，将其运控性能融入</span>
            <span>数据资产，为模型公司创造更出色的</span>
            <span>训练成果。</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function App() {
  const useLegacyHero = import.meta.env.VITE_HERO_VARIANT === 'legacy'
  const showLegacyClosing = import.meta.env.VITE_LEGACY_CLOSING === 'true'
  const evolutionRef = useRef<HTMLElement>(null)
  const evolutionValueRef = useRef(0)
  const glassSystemMountedRef = useRef(false)
  const [isGlassSystemMounted, setIsGlassSystemMounted] = useState(false)
  const { scrollYProgress: evolutionProgress } = useScroll({
    target: evolutionRef,
    offset: ['start start', 'end end'],
  })

  useEffect(() => {
    if (!window.location.hash) return

    const anchorId = decodeURIComponent(window.location.hash.slice(1))
    const alignAnchor = () => {
      const target = document.getElementById(anchorId)
      if (!target) return

      const navigation = document.querySelector<HTMLElement>('.site-navigation')
      const targetTop = target.getBoundingClientRect().top + window.scrollY
      const scrollBehavior = document.documentElement.style.scrollBehavior
      document.documentElement.style.scrollBehavior = 'auto'
      window.scrollTo(0, Math.max(0, targetTop - (navigation?.offsetHeight ?? 0)))
      document.documentElement.style.scrollBehavior = scrollBehavior
    }

    const animationFrame = window.requestAnimationFrame(alignAnchor)
    const timers = [120, 450].map((delay) => window.setTimeout(alignAnchor, delay))
    void document.fonts?.ready.then(alignAnchor)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const evolutionAtmosphereOpacity = useTransform(evolutionProgress, [0, 0.18, 0.88, 1], [0.22, 0.58, 0.72, 0.62])
  const modelStageOpacity = useTransform(evolutionProgress, [0, 0.3, 0.38, 0.56, 0.62, 1], [0, 0, 1, 1, 0, 0])
  const modelStageY = useTransform(evolutionProgress, [0, 0.3, 0.38, 0.62, 1], [28, 28, 0, -18, -18])
  const robotStageOpacity = useTransform(evolutionProgress, [0, 0.58, 0.66, 0.84, 0.92, 1], [0, 0, 1, 1, 0.18, 0])
  const robotStageY = useTransform(evolutionProgress, [0, 0.58, 0.66, 0.92, 1], [28, 28, 0, -12, -18])
  const cardSceneOpacity = useTransform(evolutionProgress, [0, 0.28, 0.3, 0.9, 1], [0, 0, 1, 1, 0])
  const modelMotionStops = [0, 0.3, 0.34, 0.42, 0.56, 0.62, 1]
  const robotMotionStops = [0, 0.58, 0.64, 0.72, 0.84, 0.92, 1]
  const modelVisualOpacity = useTransform(evolutionProgress, modelMotionStops, [0, 0, 0.82, 1, 1, 0, 0])
  const robotVisualOpacity = robotStageOpacity
  const modelCardX = useTransform(evolutionProgress, modelMotionStops, [-26, -26, -16, 0, 0, 58, 58])
  const robotCardX = useTransform(evolutionProgress, robotMotionStops, [32, 32, 18, 0, 0, -56, -56])
  const modelCardY = useTransform(evolutionProgress, modelMotionStops, [22, 22, 10, 0, -4, -26, -26])
  const robotCardY = useTransform(evolutionProgress, robotMotionStops, [22, 22, 10, 0, -4, -24, -24])
  const modelCardScale = useTransform(evolutionProgress, modelMotionStops, [1.095, 1.095, 1.06, 1.018, 1.012, 0.985, 0.985])
  const robotCardScale = useTransform(evolutionProgress, robotMotionStops, [1.1, 1.1, 1.062, 1.018, 1.012, 0.988, 0.988])
  const modelCardRotateY = useTransform(evolutionProgress, modelMotionStops, [-7.5, -7.5, -4.2, -1.1, -0.4, 8.5, 8.5])
  const robotCardRotateY = useTransform(evolutionProgress, robotMotionStops, [7.5, 7.5, 4.2, 1, 0.35, -8.2, -8.2])
  const modelCardRotateX = useTransform(evolutionProgress, modelMotionStops, [3.2, 3.2, 1.4, 0.2, 0, -3.6, -3.6])
  const robotCardRotateX = useTransform(evolutionProgress, robotMotionStops, [3, 3, 1.3, 0.2, 0, -3.4, -3.4])
  const modelCardFilter = useTransform(evolutionProgress, modelMotionStops, [
    'brightness(0.46) saturate(0.78) blur(12px)',
    'brightness(0.46) saturate(0.78) blur(12px)',
    'brightness(0.78) saturate(0.92) blur(4px)',
    'brightness(1) saturate(1) blur(0px)',
    'brightness(1.02) saturate(1) blur(0px)',
    'brightness(0.4) saturate(0.7) blur(10px)',
    'brightness(0.4) saturate(0.7) blur(10px)',
  ])
  const robotCardFilter = useTransform(evolutionProgress, robotMotionStops, [
    'brightness(0.42) saturate(0.72) blur(12px)',
    'brightness(0.42) saturate(0.72) blur(12px)',
    'brightness(0.74) saturate(0.88) blur(4px)',
    'brightness(1.04) saturate(1.04) blur(0px)',
    'brightness(1.02) saturate(1.02) blur(0px)',
    'brightness(0.38) saturate(0.68) blur(10px)',
    'brightness(0.38) saturate(0.68) blur(10px)',
  ])
  useMotionValueEvent(evolutionProgress, 'change', (latest) => {
    evolutionValueRef.current = latest
    const nextMounted = latest >= 0.14
    if (glassSystemMountedRef.current !== nextMounted) {
      glassSystemMountedRef.current = nextMounted
      setIsGlassSystemMounted(nextMounted)
    }
  })

  const evolutionStageStyles = [
    {
      opacity: useTransform(evolutionProgress, [0, 0.2, 0.24, 1], [1, 1, 0, 0]),
      y: useTransform(evolutionProgress, [0, 0.24, 1], [0, -34, -34]),
    },
    {
      opacity: modelStageOpacity,
      y: modelStageY,
    },
    {
      opacity: robotStageOpacity,
      y: robotStageY,
    },
  ]

  return (
    <main className="site-shell site-shell--separated-navigation">
      <SiteNavigation />

      {useLegacyHero ? (
        <section
          id="top"
          className="cinematic-section"
          aria-label="机器人真实任务影像"
        >
          <span id="system" className="cinematic-anchor" />
          <div className="cinematic-pin">
            <div className="cinematic-viewport">
              <div className="cinematic-visual">
                <HeroVideoCarousel />
                <div className="cinematic-video-scrim" />
              </div>

              <motion.div
                className="hero-copy cinematic-hero-copy"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <FitHeadline lines={heroHeadlineLines} />
              </motion.div>

              <motion.div
                className="scroll-cue"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.9, delay: 1.1 }}
              >
                <span>Scroll to explore</span>
                <i>↓</i>
              </motion.div>
            </div>
          </div>
        </section>
      ) : (
        <IntelligenceHero />
      )}

      <SceneHandoffSequence
        platform={<PlatformConcept />}
        includeFooter={!showLegacyClosing}
        footerVariant="portrait"
      />

      {showLegacyClosing && <>
      <section id="network" ref={evolutionRef} className="evolution-section" aria-label="模型与机器人共同进化">
        <div className="evolution-pin">
          <div className="evolution-stage">
            <motion.div className="evolution-atmosphere" style={{ opacity: evolutionAtmosphereOpacity }} aria-hidden="true" />
            {isGlassSystemMounted && (
              <motion.div className="glass-system" style={{ opacity: cardSceneOpacity }} aria-hidden="true">
                <motion.div
                  className="glass-card glass-card-model"
                  style={{
                    opacity: modelVisualOpacity,
                    x: modelCardX,
                    y: modelCardY,
                    scale: modelCardScale,
                    rotateX: modelCardRotateX,
                    rotateY: modelCardRotateY,
                    filter: modelCardFilter,
                  }}
                >
                  <SignalField variant="model" progressRef={evolutionValueRef} />
                  <span className="glass-kicker">Model companies</span>
                  <h3>模型公司</h3>
                  <p>训练目标 / 评估偏好 / 任务假设</p>
                  <i className="glass-specular" />
                </motion.div>

                <motion.div
                  className="glass-card glass-card-robot"
                  style={{
                    opacity: robotVisualOpacity,
                    x: robotCardX,
                    y: robotCardY,
                    scale: robotCardScale,
                    rotateX: robotCardRotateX,
                    rotateY: robotCardRotateY,
                    filter: robotCardFilter,
                  }}
                >
                  <SignalField variant="robot" progressRef={evolutionValueRef} />
                  <span className="glass-kicker">Robot companies</span>
                  <h3>机器人公司</h3>
                  <p>硬件能力 / 运动控制 / 真实场景</p>
                  <i className="glass-specular" />
                </motion.div>

              </motion.div>
            )}

            <div className="evolution-copy">
              {evolutionStages.map((stage, index) => (
                <motion.article className="evolution-copy-step" data-stage={index} data-intro={index === 0 ? 'true' : 'false'} key={stage.title} style={evolutionStageStyles[index]}>
                  <p className="eyebrow">Shared data loop</p>
                  <h2>{stage.title}</h2>
                  <p>{stage.body}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="production" className="production-section" aria-label="数据生产基础设施">
        <div className="production-field">
          <img src="/assets/production-connection-field-hd.webp" alt="" />
          <div className="production-energy" aria-hidden="true" />
        </div>

        <div className="production-copy">
          <p className="eyebrow">Production infrastructure</p>
          <h2>
            <span>刻行时空是连接</span>
            <span>机器人本体与大脑公司的</span>
            <span>中立基础设施。</span>
          </h2>
          <p>
            站在多个本体与大脑公司之间，打通任务场景、采集规范、失败分类、数据格式、回归测试，降低协作成本，提升进化效率。
          </p>
        </div>

        <div className="production-capabilities" aria-label="数据生产能力">
          {productionCapabilities.map((item, index) => (
            <article key={item.title} style={{ '--item-index': index } as React.CSSProperties}>
              <strong>{item.value}</strong>
              <span>{item.title}</span>
              <p>{item.body}</p>
              <i aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="closing-section">
        <div>
          <p className="eyebrow">Kexing Space</p>
          <h2>用数据推动 AGI 进入物理世界</h2>
        </div>
        <a className="closing-action" href="mailto:hello@kexing.space">
          <ShieldCheck size={18} />
          开始交流
        </a>
      </section>
      </>}

      {showLegacyClosing && (
        <footer className="footer-integration-placeholder" aria-label="刻行时空页脚结构占位">
          <p>刻行时空</p>
        </footer>
      )}
    </main>
  )
}

export default App
