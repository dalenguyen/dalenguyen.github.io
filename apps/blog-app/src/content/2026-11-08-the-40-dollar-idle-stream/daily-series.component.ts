import { Component, computed, signal, ViewEncapsulation } from '@angular/core'

const PRICE = 0.0000253 // $ per instance-second, 1 vCPU + 512 MiB
const PINNED = 86_400 // one instance alive 24/7
const MAX = 90_000

interface Day {
  label: string
  value: number
}

// Billable instance-seconds per day for tax-mcp, from Cloud Monitoring.
const DAYS: Day[] = [
  [86480, 86391, 86186, 86385, 86604, 86158, 30119, 81154, 3555, 155, 227, 249, 192, 232, 763,
    78525, 2182, 145, 35177, 86020, 76547, 85679, 84680, 84372, 76713, 83517, 84065, 87188, 79220, 62737]
    .map((value, i) => ({ label: 'Sep ' + String(i + 1).padStart(2, '0'), value })),
  [1309, 53, 57, 70].map((value, i) => ({ label: 'Oct ' + String(i + 1).padStart(2, '0'), value })),
].flat()

const SEP = DAYS.filter((d) => d.label.startsWith('Sep'))
const SEP_TOTAL = SEP.reduce((a, d) => a + d.value, 0)
const SEP_MEAN = SEP_TOTAL / SEP.length
const CLIFF = DAYS.findIndex((d) => d.label === 'Oct 01')
const FIX = DAYS.findIndex((d) => d.label === 'Oct 03')

// SVG geometry
const W = 640
const H = 240
const PAD_L = 44
const PAD_R = 8
const PAD_T = 18
const PAD_B = 26
const PLOT_W = W - PAD_L - PAD_R
const PLOT_H = H - PAD_T - PAD_B
const SLOT = PLOT_W / DAYS.length
const BAR_W = SLOT * 0.72

type View = 'aggregate' | 'daily'

/**
 * Shows the same month two ways: the 30-day aggregate the first query
 * returned (every September day flattened to the mean), and the daily
 * series that reveals the cliff on 1 October — two days before the fix.
 */
@Component({
  selector: 'blog-daily-series',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">Billable instance-seconds per day</span>
        <span class="subtitle">tax-mcp · Sep 1 – Oct 4</span>
      </div>

      <div class="tabs" role="tablist" aria-label="Chart view">
        <button type="button" role="tab" class="tab" [class.on]="view() === 'aggregate'"
                [attr.aria-selected]="view() === 'aggregate'" (click)="view.set('aggregate')">
          What the 30-day sum shows
        </button>
        <button type="button" role="tab" class="tab" [class.on]="view() === 'daily'"
                [attr.aria-selected]="view() === 'daily'" (click)="view.set('daily')">
          What actually happened
        </button>
      </div>

      <div class="readout" aria-live="polite">
        @if (active(); as d) {
          <b>{{ d.label }}</b> · {{ d.shown }} instance-s · {{ d.cost }}/day
          @if (view() === 'aggregate' && d.isSep) { <span class="muted">(averaged)</span> }
        } @else {
          <span class="muted">Hover or tap a bar.</span>
        }
      </div>

      <div class="chart">
        <svg [attr.viewBox]="'0 0 ' + w + ' ' + h" role="img"
             [attr.aria-label]="view() === 'daily' ? 'Daily series: near 86,400 most of September, then a drop to under 100 from October 2' : 'Aggregate: September flattened to one average value'">
          @for (tick of ticks; track tick.v) {
            <line class="grid" [attr.x1]="padL" [attr.x2]="w - padR" [attr.y1]="tick.y" [attr.y2]="tick.y" />
            <text class="ylab" [attr.x]="padL - 6" [attr.y]="tick.y + 4">{{ tick.label }}</text>
          }

          <line class="pinned" [attr.x1]="padL" [attr.x2]="w - padR" [attr.y1]="pinnedY" [attr.y2]="pinnedY" />
          <text class="pinned-lab" [attr.x]="w - padR" [attr.y]="pinnedY - 5">86,400 = one instance pinned 24/7</text>

          @if (view() === 'daily') {
            <line class="marker cliff" [attr.x1]="markerX(cliff)" [attr.x2]="markerX(cliff)" [attr.y1]="padT + 30" [attr.y2]="baseY" />
            <text class="mlab cliff" [attr.x]="markerX(cliff) - 4" [attr.y]="padT + 42">cliff</text>
            <line class="marker fix" [attr.x1]="markerX(fix)" [attr.x2]="markerX(fix)" [attr.y1]="padT + 52" [attr.y2]="baseY" />
            <text class="mlab fix" [attr.x]="markerX(fix) + 4" [attr.y]="padT + 64">fix</text>
          }

          @for (b of bars(); track b.i) {
            <rect class="hit" [attr.x]="b.slotX" [attr.y]="padT" [attr.width]="slot" [attr.height]="plotH"
                  (mouseenter)="hover.set(b.i)" (mouseleave)="hover.set(null)" (click)="hover.set(b.i)" />
            <rect class="bar" [class]="'bar ' + b.cls" [class.hot]="hover() === b.i"
                  [attr.x]="b.x" [attr.y]="padT" [attr.width]="barW" [attr.height]="plotH"
                  [style.transform]="'scaleY(' + b.scale + ')'" />
          }

          @for (lab of xLabels; track lab.i) {
            <text class="xlab" [attr.x]="lab.x" [attr.y]="h - 8">{{ lab.text }}</text>
          }
        </svg>
      </div>

      <div class="legend">
        @if (view() === 'daily') {
          <span><i class="sw session"></i>client session holding the stream</span>
          <span><i class="sw quiet"></i>quiet day</span>
          <span><i class="sw oct"></i>after the cliff</span>
        } @else {
          <span><i class="sw avg"></i>September, one averaged number</span>
          <span><i class="sw oct"></i>October readings</span>
        }
      </div>

      <p class="note" [class.bad]="view() === 'aggregate'" [class.good]="view() === 'daily'">{{ note() }}</p>
    </div>
  `,
  styles: [
    `
      :host { display: block; text-align: left; color: #e6edf3;
        font: 16px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .card { background: #161b22; border: 1px solid #30363d; border-radius: 14px;
        padding: 20px; margin: 22px 0; display: grid; gap: 14px; }
      .header { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
      .title { font-size: 15px; font-weight: 700; }
      .subtitle, .muted { font-size: 13px; color: #9aa7b5; }
      .tabs { display: inline-flex; flex-wrap: wrap; gap: 4px; background: #0b0f16;
        border: 1px solid #30363d; border-radius: 10px; padding: 4px; justify-self: start; }
      .tab { appearance: none; border: 0; background: transparent; color: #9aa7b5;
        font: inherit; font-size: 13px; padding: 6px 12px; border-radius: 7px; cursor: pointer;
        white-space: nowrap; }
      .tab.on { background: #1c2333; color: #e6edf3; box-shadow: inset 0 0 0 1px #30363d; }
      .readout { font-size: 13px; min-height: 1.6em; font-variant-numeric: tabular-nums; }
      .chart { overflow-x: auto; }
      svg { display: block; width: 100%; min-width: 480px; height: auto; }
      .grid { stroke: #30363d; stroke-width: 1; }
      .ylab { fill: #9aa7b5; font-size: 10px; text-anchor: end; font-variant-numeric: tabular-nums; }
      .xlab { fill: #9aa7b5; font-size: 10px; text-anchor: middle; }
      .pinned { stroke: #ef6f8c; stroke-width: 1; stroke-dasharray: 4 3; }
      .pinned-lab { fill: #ef6f8c; font-size: 10px; text-anchor: end; }
      .marker { stroke-width: 1.5; stroke-dasharray: 3 3; }
      .marker.cliff { stroke: #ffd166; }
      .marker.fix { stroke: #5ad19a; }
      .mlab { font-size: 10.5px; font-weight: 700; }
      .mlab.cliff { fill: #ffd166; text-anchor: end; }
      .mlab.fix { fill: #5ad19a; }
      .hit { fill: transparent; cursor: pointer; }
      .bar { pointer-events: none; transform-box: fill-box; transform-origin: bottom;
        transition: transform 0.45s ease, fill 0.3s ease; }
      .bar.session { fill: #ff8a5c; }
      .bar.quiet { fill: #5ad19a; }
      .bar.oct { fill: #7c9cff; }
      .bar.avg { fill: #9aa7b5; }
      .bar.hot { fill: #e6edf3; }
      .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 12px; color: #9aa7b5; }
      .legend span { display: inline-flex; align-items: center; gap: 6px; }
      .sw { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
      .sw.session { background: #ff8a5c; }
      .sw.quiet { background: #5ad19a; }
      .sw.oct { background: #7c9cff; }
      .sw.avg { background: #9aa7b5; }
      .note { margin: 0; font-size: 13px; color: #9aa7b5; }
      .note.bad { color: #ff8a5c; }
      .note.good { color: #5ad19a; }
    `,
  ],
})
export class DailySeriesComponent {
  readonly w = W
  readonly h = H
  readonly padL = PAD_L
  readonly padR = PAD_R
  readonly padT = PAD_T
  readonly plotH = PLOT_H
  readonly slot = SLOT
  readonly barW = BAR_W
  readonly baseY = PAD_T + PLOT_H
  readonly pinnedY = this.y(PINNED)
  readonly cliff = CLIFF
  readonly fix = FIX

  readonly view = signal<View>('aggregate')
  readonly hover = signal<number | null>(null)

  readonly ticks = [0, 30_000, 60_000, 90_000].map((v) => ({
    v,
    y: this.y(v),
    label: v === 0 ? '0' : v / 1000 + 'k',
  }))

  readonly xLabels = DAYS.map((d, i) => ({ i, d }))
    .filter(({ d }) => ['Sep 01', 'Sep 08', 'Sep 15', 'Sep 22', 'Sep 29', 'Oct 03'].includes(d.label))
    .map(({ d, i }) => ({ i, x: PAD_L + i * SLOT + SLOT / 2, text: d.label }))

  readonly bars = computed(() =>
    DAYS.map((d, i) => {
      const isSep = i < CLIFF
      const shown = this.shown(i)
      let cls = 'oct'
      if (this.view() === 'aggregate' && isSep) cls = 'avg'
      else if (isSep) cls = d.value > 20_000 ? 'session' : 'quiet'
      return {
        i,
        cls,
        slotX: PAD_L + i * SLOT,
        x: PAD_L + i * SLOT + (SLOT - BAR_W) / 2,
        // keep a sliver visible for tiny values so the day still reads as "measured"
        scale: Math.max(shown / MAX, 0.006),
      }
    }),
  )

  readonly active = computed(() => {
    const i = this.hover()
    if (i === null) return null
    const shown = this.shown(i)
    return {
      label: DAYS[i].label,
      shown: Math.round(shown).toLocaleString('en-US'),
      cost: '$' + (shown * PRICE).toFixed(shown * PRICE < 0.1 ? 4 : 2),
      isSep: i < CLIFF,
    }
  })

  readonly note = computed(() =>
    this.view() === 'aggregate'
      ? `One number for the month: ${SEP_TOTAL.toLocaleString('en-US')} instance-seconds. Spread evenly, every September day looks the same, and the post-fix readings look like the patch did all the work.`
      : 'The daily series: nine quiet days already inside September, and the real cliff on 1 October — two days before the fix shipped on the 3rd.',
  )

  markerX(i: number): number {
    return PAD_L + i * SLOT + SLOT / 2
  }

  private shown(i: number): number {
    return this.view() === 'aggregate' && i < CLIFF ? SEP_MEAN : DAYS[i].value
  }

  private y(v: number): number {
    return PAD_T + PLOT_H - (v / MAX) * PLOT_H
  }
}
