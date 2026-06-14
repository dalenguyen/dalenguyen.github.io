import { Component, computed, signal, ViewEncapsulation } from '@angular/core'

// fp16 KV-cache bytes per token for a single 7B model:
// layers(32) × kv_heads(8) × head_dim(128) × 2 (K+V) × 2 (fp16 bytes)
const BYTES_PER_TOKEN = 32 * 8 * 128 * 2 * 2
const MAX_CTX = 131072

const fmtMem = (bytes: number): string =>
  bytes < 1e9 ? (bytes / 1e6).toFixed(0) + ' MB' : (bytes / 1e9).toFixed(2) + ' GB'

const fmtCtx = (n: number): string => (n >= 1000 ? Math.round(n / 1000) + 'K' : String(n))

/**
 * Interactive KV-cache memory estimator. Drag the slider to set the context
 * length; the bar and number show how much fp16 KV-cache a 7B model needs.
 */
@Component({
  selector: 'blog-demo-slider',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">KV-cache memory estimator</span>
        <span class="subtitle">7B model · fp16</span>
      </div>

      <div class="slider-row">
        <span class="muted">Context length</span>
        <input
          type="range"
          min="512"
          max="131072"
          step="512"
          aria-label="Context length in tokens"
          [value]="ctx()"
          [attr.aria-valuetext]="ctxLabel() + ' tokens'"
          (input)="ctx.set(+$any($event.target).value)"
        />
        <span class="ctx-label">{{ ctxLabel() }} tokens</span>
      </div>

      <div class="bar-track"><div class="bar-fill" [style.width.%]="pct()"></div></div>

      <p class="readout">{{ mem() }} <span class="muted">of KV-cache</span></p>

      <p class="note">The cache grows linearly with context — double the tokens, double the memory.</p>
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
        gap: 16px;
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
      .slider-row {
        display: flex;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
      }
      .muted {
        color: #9aa7b5;
        font-size: 14px;
      }
      input[type='range'] {
        flex: 1;
        min-width: 200px;
        accent-color: #7c9cff;
        height: 5px;
      }
      .ctx-label {
        font-variant-numeric: tabular-nums;
        font-weight: 700;
        font-size: 18px;
        min-width: 110px;
        color: #7c9cff;
      }
      .bar-track {
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 8px;
        height: 26px;
        overflow: hidden;
      }
      .bar-fill {
        height: 100%;
        border-radius: 7px;
        background: #7c9cff;
        transition: width 0.18s ease;
        min-width: 3px;
      }
      .readout {
        margin: 0;
        font-size: 26px;
        font-weight: 800;
        font-variant-numeric: tabular-nums;
        color: #e6edf3;
      }
      .readout .muted {
        font-size: 14px;
        font-weight: 500;
      }
      .note {
        color: #9aa7b5;
        font-size: 13px;
        margin: 0;
      }
    `,
  ],
})
export class DemoSliderComponent {
  readonly ctx = signal(8192)
  readonly ctxLabel = computed(() => fmtCtx(this.ctx()))
  readonly mem = computed(() => fmtMem(BYTES_PER_TOKEN * this.ctx()))
  readonly pct = computed(() => (this.ctx() / MAX_CTX) * 100)
}
