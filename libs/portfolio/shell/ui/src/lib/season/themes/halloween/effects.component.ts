import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  OnDestroy,
  signal,
  viewChildren,
} from '@angular/core'

/** Random float in [min, max). */
const rand = (min: number, max: number) => min + Math.random() * (max - min)

const clamp = (v: number, min: number, max: number) => (v < min ? min : v > max ? max : v)

/** One drifting ghost's live state. Mutated in place by the animation loop. */
interface Ghost {
  el: HTMLElement
  x: number
  y: number
  /** Heading in radians. */
  angle: number
  /** Current rate of turn, rad/ms. Random-walks, which is what curves the path. */
  turn: number
  /** px/ms. */
  speed: number
  /** Phase offset so the ghosts do not all fade in unison. */
  phase: number
}

/**
 * Halloween ambience: ghosts drifting on curved, randomised flight paths that
 * bounce off the edges of the window.
 *
 * HOW THE MOTION WORKS. Each ghost holds a heading and a rate of turn. The
 * rate of turn itself random-walks within a limit, so the heading changes
 * gradually instead of jumping — that is what produces long S-curves rather
 * than straight lines or jitter. When a ghost reaches an edge its heading is
 * reflected (`π - angle` off a side wall, `-angle` off the top or bottom) and
 * it is nudged back in bounds, so it bounces instead of escaping.
 *
 * Every ghost starts at a random position with a random heading, so they are
 * already scattered across the page the moment it opens.
 *
 * Constraints this layer respects:
 *   - Decoration only: `aria-hidden` and `pointer-events: none`, sitting below
 *     the header's stacking context.
 *   - Does not mount at all under `prefers-reduced-motion: reduce`. Not
 *     "animates less" — the whole thing is skipped.
 *   - The loop only ever writes `transform` and `opacity`, so it never forces
 *     layout. It is cancelled in `ngOnDestroy` and parked entirely while the
 *     tab is hidden.
 *   - Nothing renders until `afterNextRender`, so SSR and hydration agree.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-halloween-effects',
  standalone: true,
  template: `
    @if (show()) {
      <div class="layer" aria-hidden="true">
        @for (g of ghosts(); track g.id) {
          <span #ghostEl class="ghost" [style.font-size.px]="g.size">👻</span>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    .layer {
      position: fixed;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      /* Under the sticky header (z-50) and every interactive element. */
      z-index: 5;
    }

    /* Position comes entirely from the transform the loop writes, so the
       element starts at the origin and is moved from there. */
    .ghost {
      position: absolute;
      top: 0;
      left: 0;
      line-height: 1;
      opacity: 0;
      filter: drop-shadow(0 0 12px rgb(255 157 77 / 0.35));
      will-change: transform, opacity;
    }

    /* Belt and braces — the component already refuses to mount under reduced
       motion, but if it ever renders anyway, it must not move. */
    @media (prefers-reduced-motion: reduce) {
      .ghost {
        display: none;
      }
    }
  `,
})
export class HalloweenEffectsComponent implements OnDestroy {
  /** Keeps a ghost fully on screen when it touches an edge. */
  private static readonly EDGE_PAD = 40

  /** Hard cap on rate of turn, rad/ms. Higher reads as frantic, not haunting. */
  private static readonly MAX_TURN = 0.0016

  /** How fast the rate of turn itself wanders, rad/ms². Drives the curviness. */
  private static readonly TURN_JITTER = 0.0000045

  /** A long frame (tab was backgrounded) must not teleport anyone. */
  private static readonly MAX_FRAME_MS = 50

  protected readonly show = signal(false)
  /** Count and size are re-rolled on every page load. */
  protected readonly ghosts = signal<{ id: number; size: number }[]>([])

  private readonly ghostEls = viewChildren<ElementRef<HTMLElement>>('ghostEl')

  private flock: Ghost[] = []
  private frame?: number
  private last = 0
  private elapsed = 0
  private maxX = 0
  private maxY = 0

  private readonly onResize = () => this.measure()

  private readonly onVisibility = () => {
    // Park the loop entirely while the tab is hidden, and restart the clock on
    // return so nobody jumps a minute's worth of travel in one frame.
    if (document.hidden) this.stop()
    else if (this.flock.length) this.start()
  }

  constructor() {
    afterNextRender(() => {
      // Skip entirely for visitors who asked for less motion.
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduced) return

      // Phones get a smaller, thinner flock. A 34px ghost crossing a 375px
      // screen is a big moving object; the same one on a desktop is ambience.
      const narrow = window.innerWidth < 640
      const count = narrow ? Math.round(rand(2, 3)) : Math.round(rand(3, 6))
      const [minSize, maxSize] = narrow ? [14, 22] : [20, 34]
      this.ghosts.set(Array.from({ length: count }, (_, id) => ({ id, size: rand(minSize, maxSize) })))
      this.show.set(true)
      window.addEventListener('resize', this.onResize, { passive: true })
      document.addEventListener('visibilitychange', this.onVisibility)
    })

    // Fires once the @for above has actually put the spans in the DOM.
    effect(() => {
      const els = this.ghostEls()
      if (els.length) this.launch(els)
    })
  }

  /** Seed every ghost at a random spot with a random heading, then fly. */
  private launch(els: readonly ElementRef<HTMLElement>[]): void {
    this.measure()
    this.flock = els.map((ref) => ({
      el: ref.nativeElement,
      x: rand(HalloweenEffectsComponent.EDGE_PAD, this.maxX),
      y: rand(HalloweenEffectsComponent.EDGE_PAD, this.maxY),
      angle: rand(0, Math.PI * 2),
      turn: rand(-HalloweenEffectsComponent.MAX_TURN, HalloweenEffectsComponent.MAX_TURN),
      speed: rand(0.022, 0.058),
      phase: rand(0, Math.PI * 2),
    }))
    this.start()
  }

  private measure(): void {
    const pad = HalloweenEffectsComponent.EDGE_PAD
    this.maxX = Math.max(window.innerWidth - pad, pad + 1)
    this.maxY = Math.max(window.innerHeight - pad, pad + 1)
  }

  private start(): void {
    if (this.frame !== undefined) return
    this.last = performance.now()
    this.frame = requestAnimationFrame(this.step)
  }

  private stop(): void {
    if (this.frame === undefined) return
    cancelAnimationFrame(this.frame)
    this.frame = undefined
  }

  private readonly step = (now: number): void => {
    const dt = Math.min(now - this.last, HalloweenEffectsComponent.MAX_FRAME_MS)
    this.last = now
    this.elapsed += dt

    const pad = HalloweenEffectsComponent.EDGE_PAD
    const { MAX_TURN, TURN_JITTER } = HalloweenEffectsComponent

    for (const g of this.flock) {
      // Let the rate of turn drift, then apply it. Steering the heading rather
      // than the position is what makes the path a curve instead of a zigzag.
      g.turn = clamp(g.turn + rand(-1, 1) * TURN_JITTER * dt, -MAX_TURN, MAX_TURN)
      g.angle += g.turn * dt

      g.x += Math.cos(g.angle) * g.speed * dt
      g.y += Math.sin(g.angle) * g.speed * dt

      // Bounce: reflect the heading off whichever wall was hit, and put the
      // ghost back in bounds so it cannot stick to the edge.
      if (g.x < pad || g.x > this.maxX) {
        g.x = clamp(g.x, pad, this.maxX)
        g.angle = Math.PI - g.angle
        g.turn = -g.turn
      }
      if (g.y < pad || g.y > this.maxY) {
        g.y = clamp(g.y, pad, this.maxY)
        g.angle = -g.angle
        g.turn = -g.turn
      }

      // Face the direction of travel, and lean into the turn.
      const facing = Math.cos(g.angle) < 0 ? -1 : 1
      const lean = clamp((g.turn / MAX_TURN) * 12, -12, 12) * facing
      g.el.style.transform = `translate3d(${g.x.toFixed(1)}px, ${g.y.toFixed(1)}px, 0) rotate(${lean.toFixed(1)}deg) scaleX(${facing})`

      // Slow fade in and out of the mist, each ghost on its own phase.
      g.el.style.opacity = (0.42 + 0.18 * Math.sin(this.elapsed / 2600 + g.phase)).toFixed(2)
    }

    this.frame = requestAnimationFrame(this.step)
  }

  ngOnDestroy(): void {
    this.stop()
    this.flock = []
    window.removeEventListener('resize', this.onResize)
    document.removeEventListener('visibilitychange', this.onVisibility)
  }
}
