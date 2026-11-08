import { afterNextRender, ChangeDetectionStrategy, Component, signal } from '@angular/core'

/** Random float in [min, max). */
const rand = (min: number, max: number) => min + Math.random() * (max - min)

const GLYPHS = ['❄️']

/** One falling snowflake's randomised parameters. Fixed for the life of the page. */
interface Flake {
  id: number
  glyph: string
  /** Horizontal start, % of the viewport width. */
  left: number
  size: number
  /** Seconds for one full fall, top to bottom. */
  fall: number
  /** Seconds for one sway left-right-left. */
  sway: number
  /** Negative, so every snowflake is already mid-fall when the page opens. */
  delay: number
  /** Sideways drift at the widest point of the sway, px. */
  drift: number
  /** Total spin over one fall, deg. Sign picks the direction. */
  spin: number
  opacity: number
}

/**
 * Winter ambience: snowflakes drifting slowly down the window.
 *
 * HOW THE MOTION WORKS. Each snowflake is two nested elements. The outer one falls
 * straight down on a linear loop; the inner one sways side to side and spins on
 * its own, shorter loop. Because the two durations differ per snowflake, the
 * combined path never repeats in sync with its neighbours — no JS needed.
 *
 * The path is fixed, so this is pure CSS animation (compositor only, zero JS
 * frames), per the rules in themes/_template/README.md. Per-snowflake variety comes
 * from CSS custom properties rolled once on load.
 *
 * Constraints this layer respects:
 *   - Decoration only: `aria-hidden` and `pointer-events: none`, sitting below
 *     the header's stacking context.
 *   - Does not mount at all under `prefers-reduced-motion: reduce`.
 *   - Animates only `transform`, so it never forces layout.
 *   - Nothing renders until `afterNextRender`, so SSR and hydration agree.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-winter-effects',
  standalone: true,
  template: `
    @if (flakes().length) {
      <div class="layer" aria-hidden="true">
        @for (f of flakes(); track f.id) {
          <span
            class="fall"
            [style.left.%]="f.left"
            [style.animation-duration.s]="f.fall"
            [style.animation-delay.s]="f.delay"
          >
            <span
              class="flake"
              [style.font-size.px]="f.size"
              [style.opacity]="f.opacity"
              [style.animation-duration.s]="f.sway"
              [style.animation-delay.s]="f.delay"
              [style.--drift]="f.drift + 'px'"
              [style.--spin]="f.spin + 'deg'"
              >{{ f.glyph }}</span
            >
          </span>
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

    .fall {
      position: absolute;
      top: 0;
      animation-name: fall;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
      will-change: transform;
    }

    .flake {
      display: block;
      line-height: 1;
      filter: drop-shadow(0 2px 6px rgb(0 0 0 / 0.25));
      animation-name: sway;
      animation-timing-function: ease-in-out;
      animation-iteration-count: infinite;
      animation-direction: alternate;
      will-change: transform;
    }

    /* Start above the top edge and finish below the bottom, so a snowflake never
       pops in or out on screen. */
    @keyframes fall {
      from {
        transform: translate3d(0, -10vh, 0);
      }
      to {
        transform: translate3d(0, 110vh, 0);
      }
    }

    @keyframes sway {
      from {
        transform: translateX(calc(var(--drift) * -1)) rotate(calc(var(--spin) * -0.5));
      }
      to {
        transform: translateX(var(--drift)) rotate(calc(var(--spin) * 0.5));
      }
    }

    /* Belt and braces — the component already refuses to mount under reduced
       motion, but if it ever renders anyway, it must not move. */
    @media (prefers-reduced-motion: reduce) {
      .fall {
        display: none;
      }
    }
  `,
})
export class WinterEffectsComponent {
  /** Count, size, and paths are re-rolled on every page load. */
  protected readonly flakes = signal<Flake[]>([])

  constructor() {
    afterNextRender(() => {
      // Skip entirely for visitors who asked for less motion.
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      // Phones get fewer, smaller snowflakes so the text stays readable.
      const narrow = window.innerWidth < 640
      const count = narrow ? Math.round(rand(6, 9)) : Math.round(rand(14, 20))
      const [minSize, maxSize] = narrow ? [10, 16] : [12, 22]

      this.flakes.set(
        Array.from({ length: count }, (_, id) => {
          const fall = rand(18, 32)
          return {
            id,
            glyph: GLYPHS[id % GLYPHS.length],
            left: rand(0, 96),
            size: rand(minSize, maxSize),
            fall,
            sway: rand(3, 6),
            delay: -rand(0, fall),
            drift: rand(10, 30),
            spin: rand(30, 90) * (Math.random() < 0.5 ? -1 : 1),
            opacity: rand(0.5, 0.85),
          }
        }),
      )
    })
  }
}
