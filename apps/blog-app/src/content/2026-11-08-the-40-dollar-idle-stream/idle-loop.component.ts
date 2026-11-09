import { Component, computed, OnDestroy, signal, ViewEncapsulation } from '@angular/core'

const WINDOW_S = 900 // simulated window: 15 minutes
const STREAM_S = 301 // each SSE stream dies just past the 300 s timeout
const STEP_S = 5 // simulated seconds per tick
const TICK_MS = 50 // 900 s plays back in about 9 s
const POSTS = [120, 480, 700] // POST /mcp tool calls, ~150 ms each
const POST_S = 0.15
const REJECT_S = 0.003 // a 405 answers in about 3 ms

type Mode = 'before' | 'after'

interface Segment {
  start: number
  end: number
}

/**
 * Plays back 15 simulated minutes of one MCP client against the server.
 * Before the fix, the GET opens an empty SSE stream that Cloud Run kills at
 * 300 s and the client reopens at once, so the instance is billed every
 * second. After the fix, the GET gets a 405 and only real POSTs bill.
 */
@Component({
  selector: 'blog-idle-loop',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">One idle stream, on the meter</span>
        <span class="subtitle">15 simulated minutes · 1 client</span>
      </div>

      <div class="tabs" role="tablist" aria-label="Server behaviour">
        <button type="button" role="tab" class="tab" [class.on]="mode() === 'before'"
                [attr.aria-selected]="mode() === 'before'" (click)="setMode('before')">
          Before: GET opens SSE
        </button>
        <button type="button" role="tab" class="tab" [class.on]="mode() === 'after'"
                [attr.aria-selected]="mode() === 'after'" (click)="setMode('after')">
          After: GET → 405
        </button>
      </div>

      <div class="lanes">
        <div class="lane">
          <span class="lane-label">GET /mcp</span>
          <div class="track">
            @for (s of getSegments(); track s.start) {
              <div class="seg" [class.get]="mode() === 'before'" [class.reject]="mode() === 'after'"
                   [style.left.%]="pct(s.start)" [style.width.%]="segWidth(s)"></div>
            }
            @if (mode() === 'before') {
              @for (s of getSegments(); track s.start) {
                @if (s.start > 0 && s.start <= t()) {
                  <span class="cut" [style.left.%]="pct(s.start)" title="Cloud Run cuts at 300 s, client reconnects"></span>
                }
              }
            }
            <div class="playhead" [style.left.%]="pct(t())"></div>
          </div>
        </div>

        <div class="lane">
          <span class="lane-label">POST /mcp</span>
          <div class="track">
            @for (p of visiblePosts(); track p) {
              <div class="seg post" [style.left.%]="pct(p)"></div>
            }
            <div class="playhead" [style.left.%]="pct(t())"></div>
          </div>
        </div>

        <div class="lane">
          <span class="lane-label">Billed</span>
          <div class="track">
            @if (mode() === 'before') {
              <div class="seg billed" [style.left.%]="0" [style.width.%]="pct(t())"></div>
            } @else {
              @for (p of visiblePosts(); track p) {
                <div class="seg billed" [style.left.%]="pct(p)"></div>
              }
            }
            <div class="playhead" [style.left.%]="pct(t())"></div>
          </div>
        </div>

        <div class="axis">
          <span>0:00</span><span>5:00</span><span>10:00</span><span>15:00</span>
        </div>
      </div>

      <div class="stats">
        <div class="stat"><span class="k">Clock</span><span class="v">{{ clock() }}</span></div>
        <div class="stat"><span class="k">{{ mode() === 'before' ? 'Reconnects' : '405s sent' }}</span><span class="v">{{ reconnects() }}</span></div>
        <div class="stat"><span class="k">Billed seconds</span><span class="v" [class.bad]="mode() === 'before'" [class.good]="mode() === 'after'">{{ billedLabel() }}</span></div>
        <div class="stat"><span class="k">Cost per day</span><span class="v" [class.bad]="mode() === 'before'" [class.good]="mode() === 'after'">{{ perDay() }}</span></div>
      </div>

      <div class="controls">
        <button type="button" class="btn primary" (click)="play()">{{ playing() ? 'Pause' : t() >= window ? 'Replay' : 'Play' }}</button>
        <button type="button" class="btn" (click)="reset()">Reset</button>
      </div>

      <p class="note" [class.bad]="mode() === 'before'" [class.good]="mode() === 'after'">{{ note() }}</p>
    </div>
  `,
  styles: [
    `
      :host { display: block; text-align: left; color: #e6edf3;
        font: 16px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .card { background: #161b22; border: 1px solid #30363d; border-radius: 14px;
        padding: 20px; margin: 22px 0; display: grid; gap: 16px; }
      .header { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
      .title { font-size: 15px; font-weight: 700; }
      .subtitle { font-size: 13px; color: #9aa7b5; }
      .tabs { display: inline-flex; flex-wrap: wrap; gap: 4px; background: #0b0f16;
        border: 1px solid #30363d; border-radius: 10px; padding: 4px; justify-self: start; }
      .tab { appearance: none; border: 0; background: transparent; color: #9aa7b5;
        font: inherit; font-size: 13px; padding: 6px 12px; border-radius: 7px; cursor: pointer;
        white-space: nowrap; }
      .tab.on { background: #1c2333; color: #e6edf3; box-shadow: inset 0 0 0 1px #30363d; }
      .lanes { display: grid; gap: 8px; }
      .lane { display: grid; grid-template-columns: 82px 1fr; align-items: center; gap: 10px; }
      .lane-label { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px;
        color: #9aa7b5; white-space: nowrap; }
      .track { position: relative; height: 22px; background: #0b0f16; border: 1px solid #30363d;
        border-radius: 6px; overflow: hidden; }
      .seg { position: absolute; top: 3px; bottom: 3px; border-radius: 4px; min-width: 3px; }
      .seg.get { background: #ff8a5c; opacity: 0.85; }
      .seg.reject { background: #ef6f8c; width: 3px !important; }
      .seg.post { background: #7c9cff; width: 3px; }
      .seg.billed { background: #ffd166; min-width: 3px; }
      .cut { position: absolute; top: 0; bottom: 0; width: 2px; margin-left: -1px; background: #e6edf3; }
      .playhead { position: absolute; top: 0; bottom: 0; width: 1px; background: #7c9cff;
        box-shadow: 0 0 6px #7c9cff; }
      .axis { display: flex; justify-content: space-between; margin-left: 92px;
        font-size: 11px; color: #9aa7b5; font-variant-numeric: tabular-nums; }
      .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; }
      .stat { background: #0b0f16; border: 1px solid #30363d; border-radius: 8px; padding: 8px 10px;
        display: grid; gap: 2px; }
      .k { font-size: 11.5px; color: #9aa7b5; }
      .v { font-size: 17px; font-weight: 700; font-variant-numeric: tabular-nums; }
      .bad { color: #ff8a5c; }
      .good { color: #5ad19a; }
      .controls { display: flex; gap: 8px; flex-wrap: wrap; }
      .btn { appearance: none; border: 1px solid #30363d; background: #0b0f16; color: #e6edf3;
        font: inherit; font-size: 13px; padding: 6px 14px; border-radius: 8px; cursor: pointer; }
      .btn.primary { background: #1c2333; border-color: #7c9cff; color: #7c9cff; font-weight: 700; }
      .note { margin: 0; font-size: 13px; color: #9aa7b5; }
      .note.bad { color: #ff8a5c; }
      .note.good { color: #5ad19a; }
    `,
  ],
})
export class IdleLoopComponent implements OnDestroy {
  readonly window = WINDOW_S
  readonly mode = signal<Mode>('before')
  /** Start at the end so the static view already shows the whole picture. */
  readonly t = signal(WINDOW_S)
  readonly playing = signal(false)
  private timer: ReturnType<typeof setInterval> | null = null

  /** Stream openings the client has made so far (one every 301 s before the fix). */
  private readonly opens = computed(() => {
    const starts: number[] = []
    for (let s = 0; s <= this.t() && s < WINDOW_S; s += STREAM_S) starts.push(s)
    return starts
  })

  readonly getSegments = computed<Segment[]>(() =>
    this.opens().map((start) =>
      this.mode() === 'before'
        ? { start, end: Math.min(start + STREAM_S, this.t()) }
        : { start, end: start },
    ),
  )

  readonly visiblePosts = computed(() => POSTS.filter((p) => p <= this.t()))
  readonly reconnects = computed(() => (this.mode() === 'before' ? this.opens().length - 1 : this.opens().length))

  readonly billed = computed(() =>
    this.mode() === 'before'
      ? this.t()
      : this.visiblePosts().length * POST_S + this.opens().length * REJECT_S,
  )

  readonly billedLabel = computed(() => {
    const b = this.billed()
    return this.mode() === 'before' ? b.toLocaleString('en-US') + ' s' : b.toFixed(2) + ' s'
  })

  readonly perDay = computed(() => {
    if (this.mode() === 'before') return '$2.18'
    return '$0.0015'
  })

  readonly clock = computed(() => {
    const s = Math.round(this.t())
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
  })

  readonly note = computed(() =>
    this.mode() === 'before'
      ? 'The stream carries nothing, Cloud Run cuts it at 300 s, the client reopens it at once. Three tool calls did the real work; the instance was billed for every second in between.'
      : 'The GET is refused in ~3 ms. Only the three tool calls bill — about half a second. The instance can now scale to zero.',
  )

  pct(s: number): number {
    return (Math.min(s, WINDOW_S) / WINDOW_S) * 100
  }

  segWidth(s: Segment): number {
    return this.pct(s.end) - this.pct(s.start)
  }

  setMode(m: Mode): void {
    this.mode.set(m)
  }

  play(): void {
    if (this.playing()) {
      this.stop()
      return
    }
    if (this.t() >= WINDOW_S) this.t.set(0)
    this.playing.set(true)
    this.timer = setInterval(() => {
      const next = Math.min(this.t() + STEP_S, WINDOW_S)
      this.t.set(next)
      if (next >= WINDOW_S) this.stop()
    }, TICK_MS)
  }

  reset(): void {
    this.stop()
    this.t.set(0)
  }

  private stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.playing.set(false)
  }

  ngOnDestroy(): void {
    this.stop()
  }
}
