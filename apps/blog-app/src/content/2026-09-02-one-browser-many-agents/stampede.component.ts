import { Component, computed, OnDestroy, signal, ViewEncapsulation } from '@angular/core'

type Mode = 'naive' | 'anchored'
type SlotState = 'live-warm' | 'live-cold' | 'idle-warm' | 'idle-cold'

interface Slot {
  name: string
  state: SlotState
  who: string
}

interface Step {
  label: string
  title: string
  event: string
  query: string
  match: string
  verdict: string
  bad: boolean
  slots: Slot[]
  logins: number
}

const ROOT = '/p/profile'

// Shared prefix of both timelines: A takes the warm profile, B is correctly
// pushed onto a fallback, A exits.
const SHARED: Step[] = [
  {
    label: 'A up',
    title: '1 · Session A launches',
    event: 'Nothing holds the profile. It still has yesterday’s login cookies.',
    query: `pgrep -f -- "--data-dir=${ROOT}"`,
    match: 'no running process',
    verdict: 'FREE → A uses the warm profile',
    bad: false,
    slots: [{ name: 'profile', state: 'live-warm', who: 'A' }],
    logins: 0,
  },
  {
    label: 'B up',
    title: '2 · Session B launches',
    event: 'A second terminal tab, same repo, same directory.',
    query: `pgrep -f -- "--data-dir=${ROOT}"`,
    match: `matches --data-dir=${ROOT} (held by A)`,
    verdict: 'BUSY → B falls back to profile-B (blank, must log in)',
    bad: false,
    slots: [
      { name: 'profile', state: 'live-warm', who: 'A' },
      { name: 'profile-B', state: 'live-cold', who: 'B' },
    ],
    logins: 1,
  },
  {
    label: 'A exits',
    title: '3 · Session A finishes',
    event: 'A’s browser closes. The profile is idle again - and still logged in.',
    query: '-',
    match: '-',
    verdict: 'profile is now free and warm',
    bad: false,
    slots: [
      { name: 'profile', state: 'idle-warm', who: 'free' },
      { name: 'profile-B', state: 'live-cold', who: 'B' },
    ],
    logins: 1,
  },
]

const TAIL: Record<Mode, Step[]> = {
  anchored: [
    {
      label: 'A back',
      title: '4 · Session A relaunches',
      event: 'The anchored pattern requires a delimiter or the end of the line right after the path.',
      query: `pgrep -f -- "--data-dir=${ROOT}([[:space:]]|$)"`,
      match: `--data-dir=${ROOT}-B has "-" after the path, not a delimiter or line end → no match`,
      verdict: 'FREE → A is back on the warm profile',
      bad: false,
      slots: [
        { name: 'profile', state: 'live-warm', who: 'A' },
        { name: 'profile-B', state: 'live-cold', who: 'B' },
      ],
      logins: 1,
    },
    {
      label: 'C up',
      title: '5 · Session C launches',
      event: 'A third tab arrives.',
      query: `pgrep -f -- "--data-dir=${ROOT}([[:space:]]|$)"`,
      match: 'matches the base path, held by A',
      verdict: 'BUSY → C falls back to profile-C',
      bad: false,
      slots: [
        { name: 'profile', state: 'live-warm', who: 'A' },
        { name: 'profile-B', state: 'live-cold', who: 'B' },
        { name: 'profile-C', state: 'live-cold', who: 'C' },
      ],
      logins: 2,
    },
    {
      label: 'Result',
      title: '6 · End state',
      event: 'One session on the warm profile; the fallbacks are stable per session, so B and C stay logged in across restarts.',
      query: '-',
      match: '-',
      verdict: 'warm state preserved, no session locked out',
      bad: false,
      slots: [
        { name: 'profile', state: 'live-warm', who: 'A' },
        { name: 'profile-B', state: 'live-cold', who: 'B' },
        { name: 'profile-C', state: 'live-cold', who: 'C' },
      ],
      logins: 2,
    },
  ],
  naive: [
    {
      label: 'A back',
      title: '4 · Session A relaunches',
      event: 'The unanchored pattern is a plain substring test.',
      query: `pgrep -f -- "--data-dir=${ROOT}"`,
      match: `${ROOT} is a substring of ${ROOT}-B → match`,
      verdict: 'BUSY (wrong) → A takes a blank profile-A and logs in again',
      bad: true,
      slots: [
        { name: 'profile', state: 'idle-warm', who: 'unused' },
        { name: 'profile-A', state: 'live-cold', who: 'A' },
        { name: 'profile-B', state: 'live-cold', who: 'B' },
      ],
      logins: 2,
    },
    {
      label: 'C up',
      title: '5 · Session C launches',
      event: 'A third tab arrives and asks the same question.',
      query: `pgrep -f -- "--data-dir=${ROOT}"`,
      match: `matches ${ROOT}-A and ${ROOT}-B`,
      verdict: 'BUSY → C takes a blank profile-C',
      bad: true,
      slots: [
        { name: 'profile', state: 'idle-warm', who: 'unused' },
        { name: 'profile-A', state: 'live-cold', who: 'A' },
        { name: 'profile-B', state: 'live-cold', who: 'B' },
        { name: 'profile-C', state: 'live-cold', who: 'C' },
      ],
      logins: 3,
    },
    {
      label: 'Result',
      title: '6 · End state',
      event: 'The warm profile is stranded: every future launch sees a suffixed sibling and rules the base out. Nothing errors - it is just slow and logged out.',
      query: '-',
      match: '-',
      verdict: 'the cached state is never reachable again',
      bad: true,
      slots: [
        { name: 'profile', state: 'idle-warm', who: 'stranded' },
        { name: 'profile-A', state: 'live-cold', who: 'A' },
        { name: 'profile-B', state: 'live-cold', who: 'B' },
        { name: 'profile-C', state: 'live-cold', who: 'C' },
      ],
      logins: 3,
    },
  ],
}

/**
 * Step-through of three agent sessions contending for one browser profile.
 * Toggling the in-use check between an unanchored substring test and an
 * anchored one changes the outcome from step 4 onwards.
 */
@Component({
  selector: 'blog-stampede',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">"Is it already in use?"</span>
        <span class="counter">Step {{ idx() + 1 }} / {{ steps().length }}</span>
      </div>

      <div class="toggle" role="group" aria-label="In-use check style">
        <button class="tg" [class.on]="mode() === 'naive'" (click)="setMode('naive')">Substring check</button>
        <button class="tg" [class.on]="mode() === 'anchored'" (click)="setMode('anchored')">Anchored check</button>
      </div>

      <p class="hint">The first three steps are identical. The two checks diverge at step 4.</p>

      <div class="stepper">
        @for (s of steps(); track $index; let i = $index) {
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

      <div class="panel">
        <p class="panel-title">{{ step().title }}</p>
        <p class="desc">{{ step().event }}</p>
        @if (step().query !== '-') {
          <pre class="code">{{ step().query }}</pre>
          <p class="match">{{ step().match }}</p>
        }
        <p class="verdict" [class.bad]="step().bad">{{ step().verdict }}</p>
      </div>

      <div class="shelf">
        @for (s of step().slots; track s.name) {
          <div class="slot" [attr.data-state]="s.state">
            <code class="slot-name">{{ s.name }}</code>
            <span class="slot-state">{{ stateLabel(s.state) }}</span>
            <span class="slot-who">{{ s.who }}</span>
          </div>
        }
      </div>

      <div class="footer">
        <span class="logins">Logins paid so far: <b [class.bad]="step().bad">{{ step().logins }}</b></span>
        <div class="controls">
          <button class="btn" (click)="prev()" [disabled]="idx() === 0">‹ Prev</button>
          <button class="btn play" (click)="togglePlay()">{{ playing() ? '❚❚ Pause' : '▶ Play' }}</button>
          <button class="btn" (click)="next()" [disabled]="idx() === steps().length - 1">Next ›</button>
        </div>
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
        gap: 14px;
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
      .toggle {
        display: flex;
        gap: 6px;
      }
      .tg {
        flex: 1 1 auto;
        min-width: 0;
        white-space: nowrap;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 9px;
        color: #9aa7b5;
        font: inherit;
        font-size: 12.5px;
        font-weight: 600;
        padding: 7px 10px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .tg:hover {
        border-color: #4a5568;
      }
      .tg.on {
        background: #7c9cff1a;
        border-color: #7c9cff;
        color: #e6edf3;
      }
      .hint {
        margin: -6px 0 0;
        font-size: 12.5px;
        color: #9aa7b5;
      }
      .stepper {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }
      .seg {
        flex: 1 1 auto;
        min-width: 0;
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
        font-size: 11.5px;
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
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #21262d;
        font-size: 10.5px;
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
      .panel-title {
        margin: 0 0 6px;
        font-size: 14px;
        font-weight: 700;
        color: #7c9cff;
      }
      .desc {
        margin: 0 0 10px;
        font-size: 13.5px;
        color: #9aa7b5;
      }
      .code {
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 10px 12px;
        margin: 0 0 8px;
        font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
        font-size: 12px;
        line-height: 1.5;
        color: #cdd6e0;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .match {
        margin: 0 0 6px;
        font-family: ui-monospace, Menlo, Consolas, monospace;
        font-size: 11.5px;
        color: #8b98a8;
      }
      .verdict {
        margin: 0;
        font-size: 13.5px;
        font-weight: 700;
        color: #5ad19a;
      }
      .verdict.bad {
        color: #ff8a5c;
      }
      .shelf {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .slot {
        flex: 1 1 140px;
        display: grid;
        gap: 2px;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 10px;
        padding: 9px 11px;
      }
      .slot[data-state='live-warm'] {
        border-color: #2ea04366;
        background: #0d1f15;
      }
      .slot[data-state='live-cold'] {
        border-color: #ff8a5c66;
      }
      .slot[data-state='idle-warm'] {
        border-style: dashed;
      }
      .slot-name {
        font-family: ui-monospace, Menlo, Consolas, monospace;
        font-size: 12px;
        color: #7c9cff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .slot-state {
        font-size: 10.5px;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: #8b98a8;
      }
      .slot[data-state='live-warm'] .slot-state {
        color: #5ad19a;
      }
      .slot[data-state='live-cold'] .slot-state {
        color: #ff8a5c;
      }
      .slot-who {
        font-size: 11.5px;
        color: #9aa7b5;
      }
      .footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
      }
      .logins {
        font-size: 12.5px;
        color: #9aa7b5;
      }
      .logins b {
        color: #5ad19a;
        font-size: 15px;
      }
      .logins b.bad {
        color: #ff8a5c;
      }
      .controls {
        display: flex;
        gap: 8px;
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
      }
    `,
  ],
})
export class StampedeComponent implements OnDestroy {
  readonly mode = signal<Mode>('naive')
  readonly idx = signal(0)
  readonly playing = signal(false)

  readonly steps = computed<Step[]>(() => [...SHARED, ...TAIL[this.mode()]])
  readonly step = computed(() => this.steps()[this.idx()])

  private timer: ReturnType<typeof setInterval> | null = null

  stateLabel(s: SlotState): string {
    return s === 'live-warm'
      ? 'in use · logged in'
      : s === 'live-cold'
        ? 'in use · blank'
        : s === 'idle-warm'
          ? 'idle · logged in'
          : 'idle · blank'
  }

  setMode(m: Mode) {
    this.stop()
    this.mode.set(m)
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
