import { Component, OnDestroy, computed, signal, ViewEncapsulation } from '@angular/core'

type ChipKind = 'plain' | 'agent' | 'ci' | 'verify' | 'merge'
type VerifyState = 'eye' | 'gone' | 'instrument'

interface Chip {
  text: string
  kind: ChipKind
}

interface Stage {
  label: string
  title: string
  chips: Chip[]
  verify: VerifyState
  verifyText: string
  desc: string
}

const STAGES: Stage[] = [
  {
    label: 'Old loop',
    title: '1 · A human authored — and glanced',
    chips: [
      { text: 'ticket', kind: 'plain' },
      { text: 'read design', kind: 'plain' },
      { text: 'write CSS', kind: 'plain' },
      { text: 'review code', kind: 'plain' },
      { text: 'merge', kind: 'merge' },
    ],
    verify: 'eye',
    verifyText: 'look → tweak → look (tight, continuous, never written down)',
    desc: 'You never "verified" — you iterated by eye until it looked right. Correctness arrived as a side effect of authoring, so nobody ever named the step.',
  },
  {
    label: 'Delegated',
    title: '2 · The agent authors — the glance vanishes',
    chips: [
      { text: 'ticket', kind: 'plain' },
      { text: 'agent writes CSS', kind: 'agent' },
      { text: 'CI green', kind: 'ci' },
      { text: 'review code', kind: 'plain' },
      { text: 'merge', kind: 'merge' },
    ],
    verify: 'gone',
    verifyText: 'the eyeball is gone — and nothing went red',
    desc: 'Every remaining signal is green, and code review can’t recover it: what you’re reading is plausible by construction. Plausibility is exactly what the agent optimized for.',
  },
  {
    label: 'Verified',
    title: '3 · You become the instrument',
    chips: [
      { text: 'ticket', kind: 'plain' },
      { text: 'agent writes CSS', kind: 'agent' },
      { text: 'VERIFY: measure render vs design', kind: 'verify' },
      { text: 'deltas → fix', kind: 'plain' },
      { text: 'merge', kind: 'merge' },
    ],
    verify: 'instrument',
    verifyText: 'computed style + composited pixels, full state matrix, numbers',
    desc: 'Reinstate the step deliberately — a named stage with numbers in it. You stopped being the author and became the instrument.',
  },
]

/**
 * Step-through of how delegating frontend authoring silently removes the eyeball
 * verification step — and how a measured VERIFY stage puts it back. Play / Prev /
 * Next; the interval is cleared in ngOnDestroy.
 */
@Component({
  selector: 'blog-loop-evolution',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">Where the verification step went</span>
        <span class="counter">Stage {{ idx() + 1 }} / {{ stages.length }}</span>
      </div>

      <div class="stepper">
        @for (s of stages; track s.label; let i = $index) {
          <button
            class="seg"
            [class.active]="i === idx()"
            [class.done]="i < idx()"
            (click)="go(i)"
            [attr.aria-current]="i === idx() ? 'step' : null"
          >
            <span class="dot">{{ i + 1 }}</span>
            <span class="seg-label">{{ s.label }}</span>
          </button>
        }
      </div>

      <p class="stage-title">{{ stage().title }}</p>

      <div class="flow">
        @for (c of stage().chips; track c.text; let last = $last) {
          <span class="chip" [attr.data-kind]="c.kind">{{ c.text }}</span>
          @if (!last) {
            <span class="arrow" aria-hidden="true">→</span>
          }
        }
      </div>

      <div class="verify" [attr.data-state]="stage().verify">
        <span class="badge">
          @switch (stage().verify) {
            @case ('eye') {
              <span class="ico">👁</span> verification (implicit)
            }
            @case ('gone') {
              <span class="ico strike">👁</span> verification — removed
            }
            @case ('instrument') {
              <span class="ico">📐</span> verification (named + numeric)
            }
          }
        </span>
        <span class="verify-text">{{ stage().verifyText }}</span>
      </div>

      <p class="desc">{{ stage().desc }}</p>

      <div class="controls">
        <button class="btn" (click)="prev()" [disabled]="idx() === 0">‹ Prev</button>
        <button class="btn play" (click)="togglePlay()">{{ playing() ? '❚❚ Pause' : '▶ Play' }}</button>
        <button class="btn" (click)="next()" [disabled]="idx() === stages.length - 1">Next ›</button>
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
      }
      .seg {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 9px;
        padding: 7px 9px;
        cursor: pointer;
        color: #9aa7b5;
        font: inherit;
        font-size: 12.5px;
        transition: all 0.15s;
      }
      .seg:hover {
        border-color: #4a5568;
      }
      .seg-label {
        white-space: nowrap;
      }
      .seg .dot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #21262d;
        font-size: 11px;
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
        border-color: #7c9cff;
        color: #e6edf3;
        background: #7c9cff1a;
      }
      .seg.active .dot {
        background: #7c9cff;
        color: #08111f;
      }
      .stage-title {
        margin: 2px 0 0;
        font-size: 14px;
        font-weight: 700;
        color: #7c9cff;
      }
      .flow {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 7px;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 10px;
        padding: 13px;
      }
      .chip {
        font-size: 12.5px;
        font-weight: 600;
        padding: 5px 10px;
        border-radius: 7px;
        background: #21262d;
        border: 1px solid #30363d;
        color: #cdd6e0;
        white-space: nowrap;
      }
      .chip[data-kind='agent'] {
        background: #7c9cff1f;
        border-color: #7c9cff66;
        color: #b8c8ff;
      }
      .chip[data-kind='ci'] {
        background: #2ea04322;
        border-color: #2ea04366;
        color: #7ee2a8;
      }
      .chip[data-kind='verify'] {
        background: #1f6feb2e;
        border-color: #58a6ff;
        color: #cfe3ff;
      }
      .chip[data-kind='merge'] {
        background: #8957e522;
        border-color: #8957e577;
        color: #d2c1ff;
      }
      .arrow {
        color: #6e7681;
        font-size: 13px;
      }
      .verify {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        padding: 11px 13px;
        border-radius: 10px;
        border: 1px solid #30363d;
        background: #0b0f16;
        transition: all 0.2s;
      }
      .verify[data-state='eye'] {
        border-color: #2ea04366;
        background: #0d1f15;
      }
      .verify[data-state='gone'] {
        border-color: #f8514966;
        background: #1f1315;
      }
      .verify[data-state='instrument'] {
        border-color: #58a6ff;
        background: #0d1a2b;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        font-size: 12.5px;
        font-weight: 700;
        letter-spacing: 0.01em;
        white-space: nowrap;
      }
      .verify[data-state='eye'] .badge {
        color: #5ad19a;
      }
      .verify[data-state='gone'] .badge {
        color: #ff7b72;
      }
      .verify[data-state='instrument'] .badge {
        color: #79c0ff;
      }
      .ico {
        font-size: 15px;
      }
      .ico.strike {
        position: relative;
        opacity: 0.5;
      }
      .ico.strike::after {
        content: '';
        position: absolute;
        left: -2px;
        right: -2px;
        top: 50%;
        height: 2px;
        background: #ff7b72;
        transform: rotate(-18deg);
      }
      .verify-text {
        font-size: 12.5px;
        color: #9aa7b5;
      }
      .desc {
        margin: 0;
        font-size: 13.5px;
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
export class LoopEvolutionComponent implements OnDestroy {
  readonly stages = STAGES
  readonly idx = signal(0)
  readonly playing = signal(false)
  readonly stage = computed(() => this.stages[this.idx()])

  private timer: ReturnType<typeof setInterval> | null = null

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
    this.idx.update((i) => Math.min(this.stages.length - 1, i + 1))
  }

  togglePlay() {
    if (this.playing()) {
      this.stop()
      return
    }
    if (this.idx() === this.stages.length - 1) this.idx.set(0)
    this.playing.set(true)
    this.timer = setInterval(() => {
      if (this.idx() >= this.stages.length - 1) {
        this.stop()
        return
      }
      this.idx.update((i) => i + 1)
    }, 1800)
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
