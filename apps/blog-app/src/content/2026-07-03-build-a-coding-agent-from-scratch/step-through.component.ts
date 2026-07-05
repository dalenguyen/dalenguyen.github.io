import { Component, OnDestroy, computed, input, signal, ViewEncapsulation } from '@angular/core'

export type Phase = 'primitive' | 'loop' | 'guardrail'

export interface ResponseInspect {
  kind: 'response'
  content: string
  toolCalls: string[]
}

export interface StateInspect {
  kind: 'state'
  rows: { k: string; v: string; tone: 'muted' | 'good' | 'warn' | 'accent' }[]
}

export interface Step {
  label: string
  title: string
  phase: Phase
  code: string
  desc: string
  inspect: ResponseInspect | StateInspect
}

const PHASE_COLORS: Record<Phase, string> = {
  primitive: '#7c9cff',
  loop: '#5ad19a',
  guardrail: '#ff8a5c',
}

const PHASE_LABELS: Record<Phase, string> = {
  primitive: 'basics.py',
  loop: 'agent.py · loop',
  guardrail: 'agent.py · guardrail',
}

/**
 * A reusable step-through figure: a segmented stepper, a code + description
 * panel, and a right-hand "inspector" that shows either the raw model response
 * (content / tool_calls) or a small state readout. Data comes entirely from the
 * `steps` input, so one component drives every step-through in the post via the
 * chart manifest's `inputs`.
 */
@Component({
  selector: 'blog-step-through',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">{{ heading() }}</span>
        <span class="counter">Step {{ idx() + 1 }} / {{ steps().length }}</span>
      </div>

      <div class="stepper">
        @for (s of steps(); track s.label; let i = $index) {
          <button
            class="seg"
            [class.active]="i === idx()"
            [class.done]="i < idx()"
            [style.--phase-color]="phaseColor(s.phase)"
            (click)="go(i)"
            [attr.aria-current]="i === idx() ? 'step' : null"
          >
            <span class="dot">{{ i + 1 }}</span>
            <span class="seg-label">{{ s.label }}</span>
          </button>
        }
      </div>

      @if (step(); as s) {
        <div class="body">
          <div class="panel">
            <div class="panel-header">
              <p class="panel-title">{{ s.title }}</p>
              <span
                class="phase-badge"
                [style.background]="phaseColor(s.phase) + '22'"
                [style.color]="phaseColor(s.phase)"
              >
                {{ phaseLabel(s.phase) }}
              </span>
            </div>
            <pre class="code">{{ s.code }}</pre>
            <p class="desc">{{ s.desc }}</p>
          </div>

          <div class="inspect" [style.--c]="phaseColor(s.phase)">
            @if (s.inspect.kind === 'response') {
              <p class="inspect-head">model response</p>
              <div class="kv">
                <span class="kv-k">content</span>
                <span class="kv-v">{{ s.inspect.content }}</span>
              </div>
              <div class="kv">
                <span class="kv-k">tool_calls</span>
                @if (s.inspect.toolCalls.length === 0) {
                  <span class="kv-v empty">[]</span>
                } @else {
                  <span class="kv-v">
                    @for (c of s.inspect.toolCalls; track c) {
                      <span class="call">{{ c }}</span>
                    }
                  </span>
                }
              </div>
            } @else {
              <p class="inspect-head">what happens</p>
              @for (r of s.inspect.rows; track r.k) {
                <div class="kv">
                  <span class="kv-k">{{ r.k }}</span>
                  <span class="kv-v" [class]="'tone-' + r.tone">{{ r.v }}</span>
                </div>
              }
            }
          </div>
        </div>
      }

      <div class="controls">
        <button class="btn" (click)="prev()" [disabled]="idx() === 0">‹ Prev</button>
        <button class="btn play" (click)="togglePlay()">{{ playing() ? '❚❚ Pause' : '▶ Play' }}</button>
        <button class="btn" (click)="next()" [disabled]="idx() === steps().length - 1">Next ›</button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        text-align: left;
        color: #e6edf3;
        font: 15px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        /* Every step swaps in code/inspector content of a different height.
           Without this, the browser's scroll-anchoring "helpfully" adjusts
           scrollTop to compensate for the resize, which reads as the page
           auto-scrolling on every click (and every 2.2s during Play). */
        overflow-anchor: none;
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
        justify-content: space-between;
        align-items: baseline;
        gap: 10px;
        flex-wrap: wrap;
      }
      .title {
        font-size: 15px;
        font-weight: 700;
      }
      .counter {
        font-size: 12px;
        color: #9aa7b5;
        font-variant-numeric: tabular-nums;
      }
      .stepper {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .seg {
        flex: 1 1 0;
        min-width: 84px;
        display: flex;
        align-items: center;
        gap: 6px;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 9px;
        padding: 6px 8px;
        cursor: pointer;
        color: #9aa7b5;
        font: inherit;
        font-size: 12px;
        transition: all 0.15s;
      }
      .seg:hover {
        border-color: #4a5568;
      }
      .seg .dot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #21262d;
        font-size: 10px;
        font-weight: 700;
        flex-shrink: 0;
      }
      .seg.done {
        color: #cdd6e0;
      }
      .seg.done .dot {
        background: #2ea04326;
        color: #5ad19a;
      }
      .seg.active {
        border-color: var(--phase-color, #7c9cff);
        color: #e6edf3;
        background: color-mix(in srgb, var(--phase-color, #7c9cff) 12%, transparent);
      }
      .seg.active .dot {
        background: var(--phase-color, #7c9cff);
        color: #08111f;
      }
      .body {
        display: grid;
        grid-template-columns: 1fr 220px;
        gap: 16px;
        align-items: stretch;
      }
      @media (max-width: 620px) {
        .body {
          grid-template-columns: 1fr;
        }
      }
      .panel {
        min-width: 0; /* let the 1fr track shrink so .code can scroll instead of overflowing */
      }
      .panel-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
        flex-wrap: wrap;
      }
      .panel-title {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        color: #e6edf3;
      }
      .phase-badge {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 20px;
        letter-spacing: 0.03em;
        white-space: nowrap;
        font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
      }
      .code {
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 10px 12px;
        margin: 0 0 10px;
        font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
        font-size: 11.5px;
        line-height: 1.55;
        color: #cdd6e0;
        white-space: pre;
        overflow-x: auto;
      }
      .desc {
        margin: 0;
        font-size: 13px;
        color: #9aa7b5;
        line-height: 1.6;
      }
      .inspect {
        border: 1px solid #30363d;
        border-left: 3px solid var(--c, #7c9cff);
        border-radius: 8px;
        background: #0b0f16;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .inspect-head {
        margin: 0 0 2px;
        font-size: 10.5px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #6b7a8a;
        font-weight: 700;
      }
      .kv {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .kv-k {
        font-size: 10.5px;
        color: #6b7a8a;
        font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
      }
      .kv-v {
        font-size: 12px;
        color: #cdd6e0;
        font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
        word-break: break-word;
      }
      .kv-v.empty {
        color: #6b7a8a;
      }
      .call {
        display: inline-block;
        background: color-mix(in srgb, var(--c, #7c9cff) 16%, transparent);
        color: var(--c, #7c9cff);
        border-radius: 5px;
        padding: 2px 6px;
        margin: 1px 0;
      }
      .tone-good {
        color: #5ad19a;
      }
      .tone-warn {
        color: #ff8a5c;
      }
      .tone-accent {
        color: var(--c, #7c9cff);
      }
      .tone-muted {
        color: #9aa7b5;
      }
      .controls {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
      .btn {
        background: #21262d;
        border: 1px solid #30363d;
        border-radius: 8px;
        color: #e6edf3;
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        padding: 7px 14px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .btn:hover:not(:disabled) {
        border-color: #7c9cff;
      }
      .btn:disabled {
        opacity: 0.4;
        cursor: default;
      }
      .btn.play {
        background: #7c9cff;
        color: #08111f;
        border-color: #7c9cff;
        margin-right: auto;
      }
    `,
  ],
})
export class StepThroughComponent implements OnDestroy {
  readonly steps = input<Step[]>([])
  readonly heading = input<string>('')

  readonly idx = signal(0)
  readonly playing = signal(false)
  readonly step = computed(() => this.steps()[this.idx()])

  private timer: ReturnType<typeof setInterval> | null = null

  phaseColor(phase: Phase): string {
    return PHASE_COLORS[phase]
  }

  phaseLabel(phase: Phase): string {
    return PHASE_LABELS[phase]
  }

  go(i: number) {
    this.stop()
    this.idx.set(i)
  }

  prev() {
    this.stop()
    this.idx.update((i) => Math.max(0, i - 1))
  }

  next() {
    this.stop()
    this.idx.update((i) => Math.min(this.steps().length - 1, i + 1))
  }

  togglePlay() {
    if (this.playing()) {
      this.stop()
      return
    }
    if (this.idx() === this.steps().length - 1) this.idx.set(0)
    this.playing.set(true)
    this.timer = setInterval(() => {
      if (this.idx() >= this.steps().length - 1) {
        this.stop()
        return
      }
      this.idx.update((i) => i + 1)
    }, 2200)
  }

  private stop() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.playing.set(false)
  }

  ngOnDestroy() {
    this.stop()
  }
}
