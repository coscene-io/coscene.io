import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uAspect;
  varying vec2 vUv;

  float hash(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float noise(vec3 p) {
    vec3 cell = floor(p);
    vec3 f = fract(p);
    f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(
      mix(mix(hash(cell), hash(cell + vec3(1, 0, 0)), f.x),
          mix(hash(cell + vec3(0, 1, 0)), hash(cell + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(cell + vec3(0, 0, 1)), hash(cell + vec3(1, 0, 1)), f.x),
          mix(hash(cell + vec3(0, 1, 1)), hash(cell + vec3(1, 1, 1)), f.x), f.y), f.z
    );
  }

  // Two evolving displacement fields advect the broad liquid surface.
  // Local folds stretch and merge instead of sliding a fixed texture.
  float surface(vec2 p, float t) {
    vec2 q = mat2(0.94, -0.342, 0.342, 0.94) * p;
    q += vec2(0.12 * t, -0.065 * t);
    vec2 flow = vec2(
      noise(vec3(q * 0.73 + vec2(1.7, 4.2), t * 0.13)),
      noise(vec3(q * 0.73 + vec2(7.1, 2.8), -t * 0.11))
    );
    q += (flow - 0.5) * 1.75;
    q += vec2(0.48 * sin(q.y * 1.45 + t * 0.21),
              0.38 * sin(q.x * 1.26 - t * 0.17));
    float pool = noise(vec3(q * 0.96 + vec2(2.8, 6.4), t * 0.10));
    float height = 0.96 * sin(q.y * 1.85 + q.x * 0.55 + pool * 3.1 - t * 0.17);
    height += 0.58 * cos(q.x * 1.76 - q.y * 0.72 + pool * 2.7 + t * 0.19);
    height += 0.19 * noise(vec3(q * 2.4, t * 0.16));
    return height;
  }

  float softBox(vec2 p, vec2 halfSize, float softness) {
    vec2 outside = abs(p) - halfSize;
    return 1.0 - smoothstep(-softness, softness, max(outside.x, outside.y));
  }

  // Broad studio reflections give rounded pools their body; narrow softbox
  // edges trace wet ridges. All illumination lives in reflection space.
  vec3 studio(vec3 ray) {
    float ceiling = smoothstep(-0.6, 0.9, ray.y);
    vec3 color = mix(vec3(0.055, 0.060, 0.070), vec3(0.26, 0.32, 0.38), ceiling);
    float key = softBox(ray.xy - vec2(-0.2, 0.56), vec2(0.83, 0.21), 0.075);
    float rim = exp(-pow((ray.y - 0.28) / 0.048, 2.0));
    float lowRim = exp(-pow((ray.y + 0.56) / 0.075, 2.0));
    float fill = exp(-pow((ray.x - 0.63) / 0.36, 2.0))
      * exp(-pow((ray.y + 0.08) / 0.65, 2.0));
    color += vec3(1.08, 1.09, 1.08) * key;
    color += vec3(1.45, 1.48, 1.5) * rim * (0.7 + 0.3 * ray.z);
    color += vec3(0.72, 0.74, 0.78) * lowRim;
    color += vec3(0.23, 0.28, 0.34) * fill;
    float darkFlag = exp(-pow((ray.y - 0.04) / 0.075, 2.0));
    color = mix(color, vec3(0.022, 0.024, 0.029), darkFlag * 0.80);
    return color;
  }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0) * 2.8;
    float t = uTime;
    float height = surface(p, t);
    // Screen derivatives recover the surface normal without repeating the
    // full deformation field four times per pixel.
    vec2 gradient = vec2(
      dFdx(height) / dFdx(p.x),
      dFdy(height) / dFdy(p.y)
    );
    vec3 normal = normalize(vec3(-gradient * 0.86, 1.0));
    vec3 view = normalize(vec3(p * 0.085, -1.9));
    vec3 reflection = reflect(view, normal);
    vec3 color = studio(reflection);

    float fresnel = pow(1.0 - max(dot(normal, -view), 0.0), 3.0);
    color *= 0.84 + fresnel * 0.30;
    color *= 0.88 + 0.12 * smoothstep(-1.1, 1.2, height);

    // Keep the headline area quiet, while the metal opens up to the right.
    float headlineShade = exp(-dot(
      (vUv - vec2(0.11, 0.80)) * vec2(1.62, 1.46),
      (vUv - vec2(0.11, 0.80)) * vec2(1.62, 1.46)
    ));
    color *= 1.0 - 0.30 * headlineShade;
    float edge = smoothstep(0.28, 1.04, length((vUv - 0.5) * vec2(1.05, 1.0)));
    color *= 1.0 - edge * 0.33;
    color = color / (color + vec3(0.64));
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`

/** A self-contained, asset-free liquid-metal background. */
export function DataValueFluid({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
        antialias: false,
        powerPreference: 'low-power',
        failIfMajorPerformanceCaveat: true,
      })
    } catch {
      // The canvas CSS remains a complete static fallback on unsupported GPUs.
      return
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x24282e, 1)
    const scene = new THREE.Scene()
    const camera = new THREE.Camera()
    const geometry = new THREE.PlaneGeometry(2, 2)
    const uniforms = {
      uTime: { value: 0 },
      uAspect: { value: 1 },
    }
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
    })
    scene.add(new THREE.Mesh(geometry, material))

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let animationFrame = 0
    let intersecting = false
    let contextLost = false
    let disposed = false
    let previousFrame = 0
    let previousRender = 0

    const draw = () => {
      if (!disposed && !contextLost) renderer.render(scene, camera)
    }

    const animate = (now: number) => {
      animationFrame = 0
      if (disposed || contextLost || !intersecting || document.hidden || reducedMotion.matches) return
      uniforms.uTime.value += Math.min((now - previousFrame) / 1000, 0.06)
      previousFrame = now
      // The motion is intentionally slow; 30 fps is enough for this backdrop.
      if (now - previousRender >= 1000 / 30) {
        draw()
        previousRender = now
      }
      animationFrame = window.requestAnimationFrame(animate)
    }

    const syncAnimation = () => {
      const shouldAnimate = !disposed && !contextLost && intersecting
        && !document.hidden && !reducedMotion.matches
      if (shouldAnimate && !animationFrame) {
        previousFrame = performance.now()
        animationFrame = window.requestAnimationFrame(animate)
      } else if (!shouldAnimate && animationFrame) {
        window.cancelAnimationFrame(animationFrame)
        animationFrame = 0
      }
    }

    const resize = () => {
      if (disposed || contextLost) return
      const width = Math.max(1, canvas.clientWidth)
      const height = Math.max(1, canvas.clientHeight)
      const maxPixelRatio = width <= 760 ? 1 : 1.35
      const pixelBudgetRatio = Math.sqrt(3_000_000 / (width * height))
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio, pixelBudgetRatio))
      renderer.setSize(width, height, false)
      uniforms.uAspect.value = width / height
      // A resize must redraw even when motion is disabled or offscreen.
      draw()
    }

    const onMotionChange = () => {
      if (reducedMotion.matches) {
        uniforms.uTime.value = 0
        draw()
      }
      syncAnimation()
    }
    const onContextLost = (event: Event) => {
      event.preventDefault()
      contextLost = true
      syncAnimation()
    }
    const onContextRestored = () => {
      contextLost = false
      resize()
      syncAnimation()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting
      syncAnimation()
    }, { threshold: 0 })
    intersectionObserver.observe(canvas)
    document.addEventListener('visibilitychange', syncAnimation)
    reducedMotion.addEventListener('change', onMotionChange)
    canvas.addEventListener('webglcontextlost', onContextLost)
    canvas.addEventListener('webglcontextrestored', onContextRestored)
    resize()

    return () => {
      disposed = true
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', syncAnimation)
      reducedMotion.removeEventListener('change', onMotionChange)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 79% 70%, #777e86 0%, #383d44 36%, #171b20 75%)',
      }}
    />
  )
}
