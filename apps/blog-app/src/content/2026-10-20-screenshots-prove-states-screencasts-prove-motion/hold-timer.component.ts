import { Component, computed, signal, ViewEncapsulation } from '@angular/core'

// The real flow recorded for this post: hover each bar, then leave the chart.
const STATES = ['Default', 'Analog', 'Next.js', 'SvelteKit', 'Leave']
const COLORS = ['#7c9cff', '#ff8a5c', '#5ad19a', '#e3b341', '#c792ea']
const TAIL = 1.5 // seconds the last state is held before the recording stops

/**
 * Slide the per-step hold time; see which states land in a 1-frame-per-second
 * contact sheet. Mirrors the hold → click → hold timing of the real recording.
 */
@Component({
  selector: 'blog-hold-timer',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">How long to hold each state?</span>
        <span class="muted">contact sheet = 1 frame per second</span>
      </div>

      <div class="row">
        <span class="muted">Hold per step</span>
        <input type="range" min="0" max="2" step="0.1" [value]="hold()"
               (input)="hold.set(+$any($event.target).value)" />
        <span class="readout">{{ hold().toFixed(1) }} s</span>
      </div>

      <div class="track">
        @for (s of segments(); track s.label) {
          <div class="seg" [style.left.%]="s.left" [style.width.%]="s.width" [style.background]="s.color"></div>
        }
        @for (f of frames(); track f.t) {
          <div class="tick" [style.left.%]="f.left"></div>
        }
      </div>
      <div class="muted small">Clip length {{ total().toFixed(1) }} s · white ticks are the frames the contact sheet keeps</div>

      <div class="chips">
        @for (s of segments(); track s.label) {
          <span class="chip" [class.miss]="!s.seen" [style.borderColor]="s.seen ? s.color : '#30363d'">
            {{ s.seen ? '✓' : '✗' }} {{ s.label }}
          </span>
        }
      </div>

      <p class="note">
        <b>{{ seenCount() }} / {{ states.length }}</b> states visible in the contact sheet.
        @if (hold() < 0.1) {
          With no hold, the automation also acts and reads before the page re-renders. In the real run, every
          DOM check read "(no tooltip)".
        } @else if (seenCount() < states.length) {
          Some steps flash by between frames. A reviewer cannot confirm them.
        } @else {
          Every captioned state appears. This is the 1.2 s hold the real clip used.
        }
      </p>
    </div>
  `,
  styles: [
    `
      :host { display: block; text-align: left; color: #e6edf3;
        font: 16px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .card { background: #161b22; border: 1px solid #30363d; border-radius: 14px;
        padding: 20px; margin: 22px 0; display: grid; gap: 14px; }
      .header { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
      .title { font-size: 15px; font-weight: 700; }
      .muted { color: #9aa7b5; font-size: 13px; }
      .small { font-size: 12px; margin-top: -6px; }
      .row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
      input[type='range'] { flex: 1; min-width: 180px; accent-color: #7c9cff; height: 5px; }
      .readout { font-weight: 700; font-variant-numeric: tabular-nums; color: #7c9cff; min-width: 48px; }
      .track { position: relative; height: 34px; background: #0b0f16; border: 1px solid #30363d;
        border-radius: 8px; overflow: hidden; }
      .seg { position: absolute; top: 0; bottom: 0; opacity: 0.85; transition: all 0.15s ease; }
      .tick { position: absolute; top: 0; bottom: 0; width: 2px; margin-left: -1px; background: #fff; }
      .chips { display: flex; flex-wrap: wrap; gap: 6px; }
      .chip { font-size: 13px; padding: 2px 10px; border: 1px solid; border-radius: 999px; white-space: nowrap; }
      .chip.miss { color: #6b7684; text-decoration: line-through; }
      .note { margin: 0; color: #9aa7b5; font-size: 13px; }
      .note b { color: #e6edf3; }
    `,
  ],
})
export class HoldTimerComponent {
  readonly states = STATES
  readonly hold = signal(0.6)
  readonly total = computed(() => (STATES.length - 1) * this.hold() + TAIL)

  readonly frames = computed(() => {
    const out: { t: number; left: number }[] = []
    for (let t = 0; t < this.total(); t++) out.push({ t, left: Math.max((t / this.total()) * 100, 0.5) })
    return out
  })

  readonly segments = computed(() => {
    const h = this.hold()
    const T = this.total()
    return STATES.map((label, i) => {
      const start = i * h
      const end = i === STATES.length - 1 ? T : start + h
      const seen = this.frames().some((f) => f.t >= start && f.t < end)
      return { label, color: COLORS[i], left: (start / T) * 100, width: ((end - start) / T) * 100, seen }
    })
  })

  readonly seenCount = computed(() => this.segments().filter((s) => s.seen).length)
}
