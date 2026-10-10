import { useEffect, useRef, useState } from 'react'
import { cubicBezier, motion, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion'
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

  return (
    <main className="site-shell site-shell--separated-navigation">
      <SiteNavigation contactHref="#contact" />

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
        <IntelligenceHero narrative />
      )}

      <SceneHandoffSequence
        platform={useLegacyHero ? <PlatformConcept /> : undefined}
        particleHandoff={!useLegacyHero}
      />

    </main>
  )
}

export default App
