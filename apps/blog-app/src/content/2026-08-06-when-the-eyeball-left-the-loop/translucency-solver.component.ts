import { Component, computed, signal, ViewEncapsulation } from '@angular/core'

type RGB = [number, number, number]

const hexToRgb = (hex: string): RGB => {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
const rgbToHex = (c: RGB): string =>
  '#' + c.map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('')

// What the browser paints: composite = a·C + (1-a)·bg, rounded to 8-bit.
const composite = (C: RGB, a: number, bg: RGB): RGB =>
  C.map((c, i) => Math.round(a * c + (1 - a) * bg[i])) as RGB

interface Recovery {
  ok: boolean
  reason: string
  perChannelAlpha: number[] // one estimate per reliable channel (the wobble)
  meanAlpha: number
  snappedAlpha: number
  wobble: number
  color: RGB
  colorHex: string
  colorDelta: number // max per-channel distance from the true overlay color
  suspicious: boolean
}

/**
 * Interactive alpha-compositing solver. Set a true translucent overlay (color +
 * opacity) and two backgrounds; the widget paints the two composited pixels, then
 * recovers the overlay's color AND opacity from just those two samples — including
 * the per-channel wobble that 8-bit rounding leaves behind. SSR-safe: pure math,
 * no window/document access.
 */
@Component({
  selector: 'blog-translucency-solver',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">Translucency solver</span>
        <span class="subtitle">two samples → color + opacity</span>
      </div>

      <p class="lede">
        A design value is <em>translucent</em>, so one declaration renders as different pixels over
        different backgrounds. No solid token is right in both places — but two samples are enough to
        recover the overlay.
      </p>

      <div class="controls">
        <label class="ctl">
          <span class="ctl-label">Overlay color</span>
          <span class="ctl-row">
            <input type="color" [value]="overlayHex()" (input)="overlayHex.set($any($event.target).value)" aria-label="Overlay color" />
            <code>{{ overlayHex() }}</code>
          </span>
        </label>

        <label class="ctl">
          <span class="ctl-label">Overlay opacity <b>{{ (alpha() * 100).toFixed(0) }}%</b></span>
          <input
            class="range"
            type="range"
            min="0"
            max="1"
            step="0.01"
            [value]="alpha()"
            (input)="alpha.set(+$any($event.target).value)"
            aria-label="Overlay opacity"
          />
        </label>

        <label class="ctl">
          <span class="ctl-label">Background 1</span>
          <span class="ctl-row">
            <input type="color" [value]="bg1Hex()" (input)="bg1Hex.set($any($event.target).value)" aria-label="Background 1" />
            <code>{{ bg1Hex() }}</code>
          </span>
        </label>

        <label class="ctl">
          <span class="ctl-label">Background 2</span>
          <span class="ctl-row">
            <input type="color" [value]="bg2Hex()" (input)="bg2Hex.set($any($event.target).value)" aria-label="Background 2" />
            <code>{{ bg2Hex() }}</code>
          </span>
        </label>
      </div>

      <div class="section-label">What the browser paints — same overlay, two backgrounds</div>
      <div class="samples">
        <div class="sample">
          <div class="swatch" [style.background]="bg1Hex()">
            <div class="ov" [style.background]="overlayRgba()"></div>
          </div>
          <code class="hex">{{ comp1Hex() }}</code>
          <span class="cap">over bg 1</span>
        </div>
        <div class="sample">
          <div class="swatch" [style.background]="bg2Hex()">
            <div class="ov" [style.background]="overlayRgba()"></div>
          </div>
          <code class="hex">{{ comp2Hex() }}</code>
          <span class="cap">over bg 2</span>
        </div>
      </div>

      <div class="solve" [class.bad]="!recovery().ok">
        <div class="section-label solve-label">What two samples recover</div>

        @if (recovery().ok) {
          <div class="solve-grid">
            <div class="metric">
              <span class="m-label">Recovered opacity</span>
              <span class="m-value">{{ (recovery().snappedAlpha * 100).toFixed(0) }}%</span>
              <span class="m-sub">mean {{ (recovery().meanAlpha * 100).toFixed(1) }}%, snapped</span>
              <div class="wobble">
                @for (a of recovery().perChannelAlpha; track $index) {
                  <span class="wob">{{ (a * 100).toFixed(1) }}%</span>
                }
              </div>
              <span class="m-sub muted">per-channel — the 8-bit wobble</span>
            </div>

            <div class="metric">
              <span class="m-label">Recovered color</span>
              <span class="m-row">
                <span class="rec-swatch" [style.background]="recovery().colorHex"></span>
                <code class="m-value sm">{{ recovery().colorHex }}</code>
              </span>
              <span class="m-sub">true {{ overlayHex() }} · Δ {{ recovery().colorDelta }}/255</span>
            </div>
          </div>

          <p class="verdict" [attr.data-tone]="recovery().suspicious ? 'warn' : 'ok'">
            @if (recovery().suspicious) {
              Channels disagree badly — this isn’t a single flat overlay, so the model is wrong here.
            } @else {
              Recovered from two pixels alone — no access to the source. A token match confirms the reading.
            }
          </p>
        } @else {
          <p class="verdict" data-tone="warn">{{ recovery().reason }}</p>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        text-align: left;
        color: #e6edf3;
        font: 16px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }
      .card {
        background: #161b22;
        border: 1px solid #30363d;
        border-radius: 14px;
        padding: 20px;
        margin: 22px 0;
        display: grid;
        gap: 15px;
      }
      .header {
        display: flex;
        align-items: baseline;
        gap: 10px;
        flex-wrap: wrap;
      }
      .title {
        font-size: 15px;
        font-weight: 700;
      }
      .subtitle {
        font-size: 12px;
        color: #9aa7b5;
        background: #1c2333;
        border: 1px solid #30363d;
        border-radius: 6px;
        padding: 2px 8px;
      }
      .lede {
        margin: 0;
        font-size: 13.5px;
        color: #9aa7b5;
      }
      .lede em {
        color: #cdd6e0;
        font-style: italic;
      }
      .controls {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px 18px;
      }
      @media (max-width: 520px) {
        .controls {
          grid-template-columns: 1fr;
        }
      }
      .ctl {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .ctl-label {
        font-size: 12.5px;
        color: #9aa7b5;
      }
      .ctl-label b {
        color: #7c9cff;
        font-variant-numeric: tabular-nums;
      }
      .ctl-row {
        display: flex;
        align-items: center;
        gap: 9px;
      }
      input[type='color'] {
        width: 42px;
        height: 30px;
        padding: 0;
        border: 1px solid #30363d;
        border-radius: 7px;
        background: #0b0f16;
        cursor: pointer;
      }
      .ctl-row code {
        font-family: ui-monospace, Menlo, Consolas, monospace;
        font-size: 13px;
        color: #cdd6e0;
      }
      .range {
        width: 100%;
        accent-color: #7c9cff;
        height: 5px;
      }
      .section-label {
        font-size: 11px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #8b98a8;
      }
      .samples {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      .sample {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }
      .swatch {
        position: relative;
        width: 100%;
        height: 84px;
        border-radius: 10px;
        border: 1px solid #30363d;
        overflow: hidden;
      }
      .ov {
        position: absolute;
        inset: 0;
      }
      .hex {
        font-family: ui-monospace, Menlo, Consolas, monospace;
        font-size: 13px;
        font-weight: 700;
        color: #e6edf3;
      }
      .cap {
        font-size: 11.5px;
        color: #8b98a8;
      }
      .solve {
        border: 1px solid #58a6ff;
        background: #0d1a2b;
        border-radius: 12px;
        padding: 15px;
        display: grid;
        gap: 12px;
      }
      .solve.bad {
        border-color: #f85149aa;
        background: #1f1315;
      }
      .solve-label {
        color: #79c0ff;
      }
      .solve.bad .solve-label {
        color: #ff7b72;
      }
      .solve-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      @media (max-width: 520px) {
        .solve-grid {
          grid-template-columns: 1fr;
        }
      }
      .metric {
        display: flex;
        flex-direction: column;
        gap: 4px;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 10px;
        padding: 12px;
      }
      .m-label {
        font-size: 12px;
        color: #9aa7b5;
      }
      .m-value {
        font-size: 26px;
        font-weight: 800;
        font-variant-numeric: tabular-nums;
        color: #e6edf3;
        line-height: 1.1;
      }
      .m-value.sm {
        font-size: 17px;
      }
      .m-row {
        display: flex;
        align-items: center;
        gap: 9px;
      }
      .rec-swatch {
        width: 34px;
        height: 34px;
        border-radius: 7px;
        border: 1px solid #30363d;
        flex-shrink: 0;
      }
      .m-sub {
        font-size: 11.5px;
        color: #9aa7b5;
        font-variant-numeric: tabular-nums;
      }
      .m-sub.muted {
        color: #6e7681;
      }
      .wobble {
        display: flex;
        gap: 6px;
        margin-top: 3px;
        flex-wrap: wrap;
      }
      .wob {
        font-family: ui-monospace, Menlo, Consolas, monospace;
        font-size: 12px;
        font-weight: 700;
        color: #cfe3ff;
        background: #1f6feb2e;
        border: 1px solid #58a6ff55;
        border-radius: 6px;
        padding: 2px 7px;
        font-variant-numeric: tabular-nums;
      }
      .verdict {
        margin: 0;
        font-size: 13px;
      }
      .verdict[data-tone='ok'] {
        color: #7ee2a8;
      }
      .verdict[data-tone='warn'] {
        color: #ffb086;
      }
    `,
  ],
})
export class TranslucencySolverComponent {
  readonly overlayHex = signal('#7c9cff')
  readonly alpha = signal(0.12)
  readonly bg1Hex = signal('#ffffff')
  readonly bg2Hex = signal('#0d1117')

  private readonly overlay = computed(() => hexToRgb(this.overlayHex()))
  private readonly bg1 = computed(() => hexToRgb(this.bg1Hex()))
  private readonly bg2 = computed(() => hexToRgb(this.bg2Hex()))

  private readonly comp1 = computed(() => composite(this.overlay(), this.alpha(), this.bg1()))
  private readonly comp2 = computed(() => composite(this.overlay(), this.alpha(), this.bg2()))

  readonly comp1Hex = computed(() => rgbToHex(this.comp1()))
  readonly comp2Hex = computed(() => rgbToHex(this.comp2()))
  readonly overlayRgba = computed(() => {
    const [r, g, b] = this.overlay()
    return `rgba(${r}, ${g}, ${b}, ${this.alpha()})`
  })

  readonly recovery = computed<Recovery>(() => {
    const c1 = this.comp1()
    const c2 = this.comp2()
    const b1 = this.bg1()
    const b2 = this.bg2()
    const trueC = this.overlay()

    // Solve per channel where the two backgrounds differ enough to be reliable.
    const alphas: number[] = []
    const colors: (number | null)[] = [null, null, null]
    for (let i = 0; i < 3; i++) {
      const denom = b1[i] - b2[i]
      if (Math.abs(denom) < 8) continue // backgrounds too close on this channel
      const oneMinusA = (c1[i] - c2[i]) / denom
      const a = Math.max(0, Math.min(1, 1 - oneMinusA))
      alphas.push(a)
      if (a > 0.02) colors[i] = (c1[i] - (1 - a) * b1[i]) / a
    }

    if (alphas.length < 2) {
      return {
        ok: false,
        reason: 'Pick two backgrounds that differ — one sample (or near-identical backgrounds) can’t separate color from opacity.',
        perChannelAlpha: [],
        meanAlpha: 0,
        snappedAlpha: 0,
        wobble: 0,
        color: [0, 0, 0],
        colorHex: '#000000',
        colorDelta: 0,
        suspicious: false,
      }
    }

    const meanAlpha = alphas.reduce((s, a) => s + a, 0) / alphas.length
    const wobble = Math.max(...alphas) - Math.min(...alphas)
    const snappedAlpha = Math.round(meanAlpha * 100) / 100 // nearest 1%

    // Recover color per channel; fall back to the true value on any channel we
    // couldn't solve (backgrounds equal there) so the swatch stays meaningful.
    const color = colors.map((c, i) =>
      c == null ? trueC[i] : Math.max(0, Math.min(255, Math.round(c))),
    ) as RGB
    const colorDelta = Math.max(...color.map((c, i) => Math.abs(c - trueC[i])))

    return {
      ok: true,
      reason: '',
      perChannelAlpha: alphas,
      meanAlpha,
      snappedAlpha,
      wobble,
      color,
      colorHex: rgbToHex(color),
      colorDelta,
      suspicious: wobble > 0.15,
    }
  })
}
