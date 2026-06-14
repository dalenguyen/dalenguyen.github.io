import { Component, computed, input, signal, ViewEncapsulation } from '@angular/core'
import { BarChartConfig } from './chart.types'

interface Bar {
  x: number
  y: number
  w: number
  h: number
  fill: string
  valLabel: string
  lx: number
  ly: number
  big: boolean
  tip: string
}

const W = 720
const H = 340

/**
 * Dark-themed, input-driven bar chart. Handles both grouped (multi-series)
 * and single-series charts, with an optional metric toggle and hover tooltips.
 */
@Component({
  selector: 'blog-bar-chart',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="head">
        <div class="legend">
          @for (l of config().legend; track l.name) {
            <span><i class="sw" [style.background]="l.color"></i>{{ l.name }}</span>
          }
        </div>
        @if (config().metrics.length > 1) {
          <div class="toggle">
            @for (m of config().metrics; track m.key; let i = $index) {
              <button [class.on]="metricIdx() === i" (click)="metricIdx.set(i)">{{ m.buttonLabel }}</button>
            }
          </div>
        }
      </div>

      <svg [attr.viewBox]="viewBox" role="img" [attr.aria-label]="metric().buttonLabel">
        @for (g of geo().grid; track g.y) {
          <line class="axis-line" [attr.x1]="pad.l" [attr.y1]="g.y" [attr.x2]="gridX2" [attr.y2]="g.y" />
          <text class="axis-text" [attr.x]="pad.l - 8" [attr.y]="g.y + 4" text-anchor="end">{{ g.label }}</text>
        }
        @for (b of geo().bars; track $index) {
          <rect
            class="bar"
            [attr.x]="b.x"
            [attr.y]="b.y"
            [attr.width]="b.w"
            [attr.height]="b.h"
            rx="4"
            [attr.fill]="b.fill"
            (mousemove)="showTip(b.tip, $event)"
            (mouseleave)="hideTip()"
          />
          <text class="vlab" [class.big]="b.big" [attr.x]="b.lx" [attr.y]="b.ly" text-anchor="middle">{{ b.valLabel }}</text>
        }
        @for (x of geo().xLabels; track $index) {
          <text class="glab" [attr.x]="x.x" [attr.y]="x.y" text-anchor="middle">{{ x.label }}</text>
        }
      </svg>

      <p class="note" [innerHTML]="metric().note"></p>

      @if (tip().show) {
        <div class="tip" [style.left.px]="tip().x" [style.top.px]="tip().y" [innerHTML]="tip().html"></div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        text-align: left;
        color: var(--chart-fg, #e6edf3);
        font: 16px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }
      .card {
        background: var(--chart-card, #161b22);
        border: 1px solid var(--chart-border, #30363d);
        border-radius: 14px;
        padding: 20px;
        margin: 22px 0;
      }
      .head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 8px;
      }
      .legend {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        font-size: 13px;
        color: var(--chart-muted, #9aa7b5);
      }
      .legend span {
        display: inline-flex;
        align-items: center;
        gap: 7px;
      }
      .sw {
        width: 13px;
        height: 13px;
        border-radius: 3px;
        display: inline-block;
      }
      .toggle {
        display: inline-flex;
        background: var(--chart-toggle, #0b0f16);
        border: 1px solid var(--chart-border, #30363d);
        border-radius: 10px;
        padding: 3px;
      }
      .toggle button {
        background: none;
        border: none;
        color: var(--chart-muted, #9aa7b5);
        padding: 6px 13px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        font-family: inherit;
      }
      .toggle button.on {
        background: #7c9cff;
        color: #08111f;
      }
      svg {
        display: block;
        width: 100%;
        height: auto;
        overflow: visible;
      }
      .axis-line {
        stroke: var(--chart-border, #30363d);
      }
      .axis-text {
        fill: var(--chart-axis, #6e7b8a);
        font-size: 12px;
      }
      .glab {
        fill: var(--chart-muted, #9aa7b5);
        font-size: 12.5px;
      }
      .vlab {
        fill: var(--chart-fg, #e6edf3);
        font-size: 11.5px;
        font-weight: 600;
      }
      .vlab.big {
        font-size: 14px;
      }
      .bar {
        transition: opacity 0.15s;
        cursor: pointer;
      }
      .bar:hover {
        opacity: 0.82;
      }
      .note {
        color: var(--chart-muted, #9aa7b5);
        font-size: 13.5px;
        margin: 8px 0 0;
      }
      .note b {
        color: var(--chart-fg, #e6edf3);
      }
      .tip {
        position: fixed;
        pointer-events: none;
        background: var(--chart-card, #161b22);
        box-shadow: 0 6px 20px rgb(0 0 0 / 0.3);
        border: 1px solid var(--chart-border, #30363d);
        border-radius: 9px;
        padding: 8px 11px;
        font-size: 12.5px;
        color: var(--chart-fg, #e6edf3);
        z-index: 50;
        max-width: 240px;
      }
      .tip b {
        color: var(--chart-fg, #e6edf3);
      }
    `,
  ],
})
export class BarChartComponent {
  readonly config = input.required<BarChartConfig>()
  readonly metricIdx = signal(0)
  readonly metric = computed(() => this.config().metrics[this.metricIdx()])
  readonly tip = signal<{ show: boolean; x: number; y: number; html: string }>({ show: false, x: 0, y: 0, html: '' })

  readonly viewBox = `0 0 ${W} ${H}`
  readonly gridX2 = W - 16

  // padding differs between grouped and single layouts
  get pad() {
    return this.metric().series ? { l: 52, r: 16, t: 18, b: 46 } : { l: 56, r: 16, t: 24, b: 46 }
  }

  readonly geo = computed(() => this.build())

  private build() {
    const m = this.metric()
    const labels = this.config().labels
    const grouped = !!m.series
    const pad = grouped ? { l: 52, r: 16, t: 18, b: 46 } : { l: 56, r: 16, t: 24, b: 46 }
    const iw = W - pad.l - pad.r
    const ih = H - pad.t - pad.b
    const allVals = grouped ? m.series!.flatMap((s) => s.vals) : m.single!
    const rawMax = m.max ?? Math.max(...allVals) * (grouped ? 1.12 : 1.15)
    // guard against an all-zero metric so `v / max` never produces NaN geometry
    const max = rawMax > 0 ? rawMax : 1

    const grid: { y: number; label: string }[] = []
    const ticks = 5
    for (let i = 0; i <= ticks; i++) {
      const v = (max * i) / ticks
      grid.push({ y: pad.t + ih - (v / max) * ih, label: m.yLabel(v) })
    }

    const bars: Bar[] = []
    const xLabels: { x: number; y: number; label: string }[] = []

    if (grouped) {
      const series = m.series!
      const groups = labels.length
      const gw = iw / groups
      const n = series.length
      const bw = Math.min(46, (gw * 0.7) / n)
      const gap = 6
      const clusterW = n * bw + (n - 1) * gap
      labels.forEach((lab, gi) => {
        const gx = pad.l + gw * gi + gw / 2
        xLabels.push({ x: gx, y: H - pad.b + 22, label: lab })
        series.forEach((se, si) => {
          const v = se.vals[gi]
          const bh = (v / max) * ih
          const x = gx - clusterW / 2 + si * (bw + gap)
          const y = pad.t + ih - bh
          bars.push({
            x,
            y,
            w: bw,
            h: bh,
            fill: se.color,
            valLabel: m.valLabel(v),
            lx: x + bw / 2,
            ly: y - 5,
            big: false,
            tip: `<b>${se.name}</b><br>${lab}: <b>${m.tip(v)}</b>`,
          })
        })
      })
    } else {
      const vals = m.single!
      const colors = m.colors!
      const bw = Math.min(120, (iw / vals.length) * 0.6)
      const step = iw / vals.length
      vals.forEach((v, i) => {
        const x = pad.l + step * i + step / 2 - bw / 2
        const bh = (v / max) * ih
        const y = pad.t + ih - bh
        bars.push({
          x,
          y,
          w: bw,
          h: bh,
          fill: colors[i],
          valLabel: m.valLabel(v),
          lx: x + bw / 2,
          ly: y - 7,
          big: true,
          tip: `<b>${labels[i]}</b><br>${m.buttonLabel}: <b>${m.tip(v)}</b>`,
        })
        xLabels.push({ x: x + bw / 2, y: H - pad.b + 22, label: labels[i] })
      })
    }

    return { grid, bars, xLabels }
  }

  showTip(html: string, e: MouseEvent) {
    let x = e.clientX + 14
    if (x + 250 > window.innerWidth) x = e.clientX - 250
    this.tip.set({ show: true, x, y: e.clientY + 14, html })
  }

  hideTip() {
    this.tip.update((t) => ({ ...t, show: false }))
  }
}
