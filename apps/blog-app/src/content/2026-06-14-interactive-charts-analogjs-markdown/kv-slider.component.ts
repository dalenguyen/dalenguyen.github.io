import { Component, computed, signal, ViewEncapsulation } from '@angular/core'

// Rough bytes per token for a few model sizes at fp16.
// Formula: layers × kv_heads × head_dim × 2 (K+V) × 2 (fp16 bytes)
const MODELS: { label: string; bpt: number; color: string }[] = [
  { label: '7B  (32 layers, 8 heads, 128 dim)', bpt: 32 * 8 * 128 * 2 * 2, color: '#5ad19a' },
  { label: '13B (40 layers, 8 heads, 128 dim)', bpt: 40 * 8 * 128 * 2 * 2, color: '#7c9cff' },
  { label: '32B (64 layers, 8 heads, 128 dim)', bpt: 64 * 8 * 128 * 2 * 2, color: '#ffd166' },
  { label: '70B (80 layers, 8 heads, 128 dim)', bpt: 80 * 8 * 128 * 2 * 2, color: '#ef6f8c' },
]

const fmtMem = (bytes: number): string => {
  if (bytes < 1e6) return (bytes / 1024).toFixed(0) + ' KB'
  if (bytes < 1e9) return (bytes / 1e6).toFixed(1) + ' MB'
  return (bytes / 1e9).toFixed(2) + ' GB'
}

const fmtCtx = (n: number): string => (n >= 1000 ? (n / 1000).toFixed(0) + 'K' : String(n))

/**
 * Interactive KV-cache memory estimator.
 * Drag the slider to set the context length; the bars show how much
 * fp16 KV-cache each model size needs.
 */
@Component({
  selector: 'blog-demo-slider',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">KV-cache memory estimator</span>
        <span class="subtitle">fp16, dense attention</span>
      </div>

      <div class="slider-row">
        <span class="muted">Context length</span>
        <input
          type="range"
          min="512"
          max="131072"
          step="512"
          [value]="ctx()"
          (input)="ctx.set(+$any($event.target).value)"
        />
        <span class="ctx-label">{{ ctxLabel() }} tokens</span>
      </div>

      <div class="bars-grid">
        @for (row of rows(); track row.label) {
          <div class="bar-row">
            <div class="bar-label">{{ row.shortLabel }}</div>
            <div class="bar-track">
              <div
                class="bar-fill"
                [style.width.%]="row.pct"
                [style.background]="row.color"
              ></div>
            </div>
            <div class="bar-value" [style.color]="row.color">{{ row.mem }}</div>
          </div>
        }
      </div>

      <p class="note">
        At <b>{{ ctxLabel() }} tokens</b>: a 7B model needs <b>{{ rows()[0].mem }}</b> of KV-cache;
        a 70B model needs <b>{{ rows()[3].mem }}</b>. The cache grows linearly with context
        — double the tokens, double the memory.
      </p>
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
        color: #e6edf3;
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
        min-width: 120px;
        color: #7c9cff;
      }
      .bars-grid {
        display: grid;
        gap: 10px;
      }
      .bar-row {
        display: grid;
        grid-template-columns: 2.6rem 1fr 4rem;
        align-items: center;
        gap: 10px;
      }
      .bar-label {
        font-size: 12px;
        font-weight: 700;
        color: #9aa7b5;
        text-align: right;
      }
      .bar-track {
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 6px;
        height: 20px;
        overflow: hidden;
      }
      .bar-fill {
        height: 100%;
        border-radius: 5px;
        transition: width 0.18s ease;
        min-width: 3px;
      }
      .bar-value {
        font-size: 13px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        text-align: right;
      }
      .note {
        color: #9aa7b5;
        font-size: 13px;
        margin: 0;
      }
      .note b {
        color: #e6edf3;
      }
    `,
  ],
})
export class DemoSliderComponent {
  readonly ctx = signal(8192)

  readonly ctxLabel = computed(() => fmtCtx(this.ctx()))

  readonly rows = computed(() => {
    const n = this.ctx()
    const maxBytes = MODELS[MODELS.length - 1].bpt * n
    return MODELS.map((m) => {
      const bytes = m.bpt * n
      return {
        label: m.label,
        shortLabel: m.label.split(' ')[0],
        mem: fmtMem(bytes),
        pct: (bytes / maxBytes) * 100,
        color: m.color,
      }
    })
  })
}
