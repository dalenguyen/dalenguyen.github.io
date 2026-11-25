import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core'
import { SHAPES } from './shapes'

const VERTEX = /* glsl */ `
  attribute float aRand;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  varying float vRand;
  void main() {
    vec3 p = position;
    p += 0.05 * vec3(sin(uTime + aRand * 6.28), cos(uTime * 0.8 + aRand * 9.0), sin(uTime * 1.1 + aRand * 3.0));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (0.5 + aRand) / -mv.z;
    vRand = aRand;
  }
`

const FRAGMENT = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  uniform vec2 uResolution;
  uniform float uTextCenter;
  varying float vRand;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    // Dim particles behind the text column (centre, or one side).
    float x = abs(gl_FragCoord.x / uResolution.x - uTextCenter);
    float textFade = mix(0.35, 1.0, smoothstep(0.15, 0.4, x));
    gl_FragColor = vec4(mix(uColorA, uColorB, vRand), smoothstep(0.5, 0.0, d) * uOpacity * textFade);
  }
`

/**
 * Full-screen three.js particle field behind the home page. The particles
 * morph into the shape each section names (`data-scene="wave"`, see
 * ./shapes) as the reader scrolls. Browser-only: three.js is loaded lazily after first render,
 * so SSR output and first paint stay the same. If WebGL is not available,
 * the canvas stays empty and the page works as before.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-home-scene',
  template: `<canvas
    #canvas
    aria-hidden="true"
    class="pointer-events-none fixed inset-0 z-0 h-screen w-screen"
  ></canvas>`,
})
export class HomeSceneComponent {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas')
  private destroyed = false
  private cleanup?: () => void

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true
      this.cleanup?.()
    })
    afterNextRender(() => {
      this.start().catch(() => {
        // No WebGL or chunk failed to load: keep the plain page.
      })
    })
  }

  private async start(): Promise<void> {
    const THREE = await import('three')
    if (this.destroyed) return
    const canvas = this.canvas().nativeElement
    const root = document.documentElement
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    const isSmall = innerWidth < 768
    const count = isSmall ? 3500 : 7000

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false })
    const pixelRatio = Math.min(devicePixelRatio, 2)
    renderer.setPixelRatio(pixelRatio)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    const group = new THREE.Group()
    scene.add(group)

    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'))
    const kinds = sections.map((el) => SHAPES[el.dataset['scene'] ?? ''] ?? SHAPES['sphere'])
    if (!kinds.length) kinds.push(SHAPES['sphere'])
    const shapes = kinds.map((k) => k.build(count))
    const tilts = kinds.map((k) => k.tilt)
    // data-scene-side="left|right" puts the shape beside the text on wide
    // screens: -1 = left, 1 = right, 0 = centre.
    const sides = sections.map((el) => ({ left: -1, right: 1 }[el.dataset['sceneSide'] ?? ''] ?? 0))
    if (!sides.length) sides.push(0)
    const positions = new Float32Array(shapes[0])
    const rand = new Float32Array(count).map(() => Math.random())
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aRand', new THREE.BufferAttribute(rand, 1))

    const uniforms = {
      uTime: { value: 0 },
      uSize: { value: isSmall ? 34 : 42 },
      uPixelRatio: { value: pixelRatio },
      uResolution: { value: new THREE.Vector2() },
      uTextCenter: { value: 0.5 },
      uOpacity: { value: 0.7 },
      uColorA: { value: new THREE.Color() },
      uColorB: { value: new THREE.Color() },
    }
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms,
      transparent: true,
      depthWrite: false,
    })
    group.add(new THREE.Points(geometry, material))

    // Colors follow the site theme (dark/light + season) via CSS tokens.
    const applyTheme = () => {
      const style = getComputedStyle(root)
      const rgb = (name: string) => style.getPropertyValue(name).trim().split(/\s+/).map(Number)
      const [ar, ag, ab] = rgb('--accent')
      const [br, bg, bb] = rgb('--accent-2')
      uniforms.uColorA.value.setRGB(ar / 255, ag / 255, ab / 255, THREE.SRGBColorSpace)
      uniforms.uColorB.value.setRGB(br / 255, bg / 255, bb / 255, THREE.SRGBColorSpace)
      // Additive glow disappears on a white page, so use normal blending there.
      const light = root.classList.contains('light')
      material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending
      uniforms.uOpacity.value = (light ? 0.55 : 0.7) * (isSmall ? 0.6 : 1)
      material.needsUpdate = true
    }
    applyTheme()
    const themeObserver = new MutationObserver(applyTheme)
    themeObserver.observe(root, { attributes: true, attributeFilter: ['class', 'data-season'] })

    const resize = () => {
      const w = innerWidth
      const h = innerHeight
      renderer.setSize(w, h, false)
      uniforms.uResolution.value.set(w * pixelRatio, h * pixelRatio)
      camera.aspect = w / h
      camera.position.z = w < 768 ? 11 : 8
      camera.updateProjectionMatrix()
    }
    resize()
    addEventListener('resize', resize)

    const pointer = { x: 0, y: 0 }
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / innerWidth) * 2 - 1
      pointer.y = (e.clientY / innerHeight) * 2 - 1
    }
    addEventListener('pointermove', onPointer)

    // Scroll position -> fractional shape index. A shape holds for most of its
    // section and morphs into the next one near the section boundary.
    const smoothstep = (a: number, b: number, x: number) => {
      const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
      return t * t * (3 - 2 * t)
    }
    // Section tops and heights, measured only when the layout changes (not
    // every frame, which would force a layout on each frame).
    let bounds: { top: number; height: number }[] = []
    const measure = () => {
      bounds = sections.map((el) => ({
        top: el.getBoundingClientRect().top + scrollY,
        height: Math.max(el.offsetHeight, 1),
      }))
    }
    measure()
    const layoutObserver = new ResizeObserver(measure)
    layoutObserver.observe(document.body)
    const targetIndex = () => {
      const mid = scrollY + innerHeight / 2
      for (let i = bounds.length - 1; i >= 0; i--) {
        const { top, height } = bounds[i]
        if (mid >= top || i === 0) {
          const frac = (mid - top) / height
          const next = Math.min(i + 1, shapes.length - 1)
          return Math.min(i, shapes.length - 1) + (next > i ? smoothstep(0.6, 1, frac) : 0)
        }
      }
      return 0
    }

    let index = targetIndex()
    let frame = 0
    const clock = new THREE.Clock()
    const tick = () => {
      frame = requestAnimationFrame(tick)
      const dt = Math.min(clock.getDelta(), 0.05)
      // Ease toward the scroll target so fast scrolling still morphs smoothly.
      // Reduced motion: jump to the nearest whole shape, never a blend.
      if (reducedMotion) index = Math.round(targetIndex())
      else index += (targetIndex() - index) * Math.min(dt * 4, 1)

      const a = Math.floor(index)
      const b = Math.min(a + 1, shapes.length - 1)
      const t = index - a
      const from = shapes[a]
      const to = shapes[b]
      for (let i = 0; i < positions.length; i++) positions[i] = from[i] + (to[i] - from[i]) * t
      geometry.attributes['position'].needsUpdate = true

      if (!reducedMotion) {
        uniforms.uTime.value += dt
        group.rotation.y += dt * 0.08
      }
      const tilt = tilts[a] + (tilts[b] - tilts[a]) * t
      // Reduced motion: no pointer parallax, place the shape directly.
      const ease = reducedMotion ? 1 : 0.05
      const px = reducedMotion ? 0 : pointer.x
      const py = reducedMotion ? 0 : pointer.y
      group.rotation.x += (tilt + py * 0.15 - group.rotation.x) * ease
      const wide = innerWidth >= 768
      const side = wide ? sides[a] + (sides[b] - sides[a]) * t : 0
      const halfWidth = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z * camera.aspect
      uniforms.uTextCenter.value = 0.5 - side * 0.25
      group.scale.setScalar(1 - Math.abs(side) * 0.4)
      group.position.x += (side * halfWidth * 0.5 + px * 0.3 - group.position.x) * ease
      renderer.render(scene, camera)
    }
    tick()

    this.cleanup = () => {
      cancelAnimationFrame(frame)
      removeEventListener('resize', resize)
      removeEventListener('pointermove', onPointer)
      themeObserver.disconnect()
      layoutObserver.disconnect()
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }
}
