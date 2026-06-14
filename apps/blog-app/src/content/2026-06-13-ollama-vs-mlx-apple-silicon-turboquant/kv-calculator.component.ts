import { Component, computed, signal, ViewEncapsulation } from '@angular/core'

const HYBRID_BPT = 20480 // bytes per token, Qwen3.6-35B hybrid (10 full layers)
const DENSE_BPT = 262144 // bytes per token, a dense 32B (64 layers × 8 KV heads × 128 dim)
const TQ_RATIO = 16 / 3 // theoretical fp16 → 3-bit

const gb = (bytes: number) => bytes / 1e9
const fmtGB = (x: number) => (x < 1 ? (x * 1024).toFixed(0) + ' MB' : x.toFixed(2) + ' GB')
const fmtInt = (n: number) => n.toLocaleString('en-US')

/**
 * Interactive KV-cache calculator: drag the context length and watch the
 * hybrid vs dense vs TurboQuant cache sizes update. Ported from the
 * standalone visualization.
 */
@Component({
  selector: 'qwen-kv-calculator',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="slider-row">
        <span class="muted">Context length</span>
        <input
          type="range"
          min="1000"
          max="262144"
          step="1000"
          [value]="ctx()"
          (input)="ctx.set(+$any($event.target).value)"
        />
        <span class="ctxval">{{ ctxLabel() }} tok</span>
      </div>

      <div class="calc-out">
        <div class="stat hybrid">
          <div class="lbl">Qwen3.6-35B (hybrid)</div>
          <div class="num">{{ hybrid() }}</div>
          <div class="snote">10 layers × 2 KV heads × 256 dim × 2 (K+V) × 2 B = <b>20 KB/token</b></div>
        </div>
        <div class="stat dense">
          <div class="lbl">Dense 32B (e.g. Qwen2.5-32B)</div>
          <div class="num">{{ dense() }}</div>
          <div class="snote">64 layers × 8 KV heads × 128 dim × 2 × 2 B = <b>256 KB/token</b></div>
        </div>
        <div class="stat tq">
          <div class="lbl">Dense 32B + TurboQuant 3-bit</div>
          <div class="num">{{ tq() }}</div>
          <div class="snote">fp16 → 3-bit ≈ <b>5.3× theoretical</b> (≈3.5–4× measured after packing)</div>
        </div>
      </div>

      <div class="barometer" title="relative KV cache size">
        <i [style.width.%]="baroHybrid()" style="background: #7c9cff"></i>
        <i [style.width.%]="baroTq()" style="background: #ef6f8c"></i>
        <i [style.width.%]="baroDense()" style="background: #ff8a5c"></i>
      </div>

      <p class="calcline" [innerHTML]="line()"></p>
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
        gap: 18px;
      }
      .slider-row {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }
      .muted {
        color: #9aa7b5;
      }
      input[type='range'] {
        flex: 1;
        min-width: 220px;
        accent-color: #7c9cff;
        height: 5px;
      }
      .ctxval {
        font-variant-numeric: tabular-nums;
        font-weight: 700;
        font-size: 20px;
        min-width: 130px;
      }
      .calc-out {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }
      @media (max-width: 640px) {
        .calc-out {
          grid-template-columns: 1fr;
        }
      }
      .stat {
        background: #1c2333;
        border: 1px solid #30363d;
        border-radius: 12px;
        padding: 16px;
      }
      .stat .lbl {
        font-size: 12px;
        color: #9aa7b5;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .stat .num {
        font-size: 30px;
        font-weight: 800;
        font-variant-numeric: tabular-nums;
        margin-top: 2px;
      }
      .stat .snote {
        font-size: 12.5px;
        color: #6e7b8a;
        margin-top: 4px;
      }
      .stat.hybrid .num {
        color: #7c9cff;
      }
      .stat.dense .num {
        color: #ff8a5c;
      }
      .stat.tq .num {
        color: #ef6f8c;
      }
      .barometer {
        height: 26px;
        border-radius: 8px;
        background: #0b0f16;
        border: 1px solid #30363d;
        overflow: hidden;
        display: flex;
      }
      .barometer i {
        display: block;
        height: 100%;
      }
      .calcline {
        color: #9aa7b5;
        font-size: 13px;
        margin: 0;
      }
      .calcline b {
        color: #e6edf3;
      }
    `,
  ],
})
export class KvCalculatorComponent {
  readonly ctx = signal(32000)

  readonly ctxLabel = computed(() => fmtInt(this.ctx()))

  private readonly hybridGB = computed(() => gb(this.ctx() * HYBRID_BPT))
  private readonly denseGB = computed(() => gb(this.ctx() * DENSE_BPT))
  private readonly tqGB = computed(() => this.denseGB() / TQ_RATIO)

  readonly hybrid = computed(() => fmtGB(this.hybridGB()))
  readonly dense = computed(() => fmtGB(this.denseGB()))
  readonly tq = computed(() => fmtGB(this.tqGB()))

  readonly baroHybrid = computed(() => (this.hybridGB() / this.denseGB()) * 100)
  readonly baroTq = computed(() => ((this.tqGB() - this.hybridGB()) / this.denseGB()) * 100)
  readonly baroDense = computed(() => ((this.denseGB() - this.tqGB()) / this.denseGB()) * 100)

  readonly line = computed(() => {
    const n = this.ctx()
    const h = this.hybridGB()
    const d = this.denseGB()
    const overFit = d > 48 ? ` — the dense cache alone (${fmtGB(d)}) <b>exceeds 48 GB</b>` : ''
    return `At ${fmtInt(n)} tokens the hybrid model spends <b>${fmtGB(h)}</b> on KV; a dense 32B would spend <b>${fmtGB(d)}</b> (${(d / h).toFixed(0)}× more)${overFit}.`
  })
}
