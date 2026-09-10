import { Component, computed, OnDestroy, signal, ViewEncapsulation } from '@angular/core'

type Mode = 'chromeOnly' | 'both'
type SlotState = 'mcp' | 'chrome' | 'refused'

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
  working: number
}

const BASE = 'dalenguyen.github.io-85156b57'

// Terminal 1 starts first. Both timelines share only this step; the in-use
// check runs for the first time in step 2, which is where they diverge.
const SHARED: Step[] = [
  {
    label: 'T1 up',
    title: '1 · Terminal 1 starts Claude',
    event:
      'The wrapper keys the profile on the git root. Nothing holds it, so Terminal 1 takes the base profile. chrome-devtools-mcp is now the holder - Chrome has not launched yet, and will not until the first browser call.',
    query: '-',
    match: '-',
    verdict: 'FREE → Terminal 1 takes the base profile',
    bad: false,
    slots: [{ name: BASE, state: 'mcp', who: 'held by T1 (MCP only)' }],
    working: 1,
  },
]

const TAIL: Record<Mode, Step[]> = {
  both: [
    {
      label: 'T2 up',
      title: '2 · Terminal 2 starts, same repo',
      event: 'The pattern matches either spelling, anchored on a delimiter or the end of the line.',
      query: `pgrep -f -- "--user-?[dD]ata-?[dD]ir=$base([[:space:]]|$)"`,
      match: `matches npm exec … --userDataDir=…/${BASE}`,
      verdict: 'BUSY → Terminal 2 falls back to its own tty-suffixed profile',
      bad: false,
      slots: [
        { name: BASE, state: 'mcp', who: 'held by T1 (MCP only)' },
        { name: `${BASE}-ttys002`, state: 'mcp', who: 'held by T2 (MCP only)' },
      ],
      working: 2,
    },
    {
      label: 'T1 opens',
      title: '3 · Terminal 1 makes its first browser call',
      event: 'Chrome launches on the base profile and writes its SingletonLock.',
      query: '-',
      match: '-',
      verdict: 'Terminal 1 has a working browser',
      bad: false,
      slots: [
        { name: BASE, state: 'chrome', who: 'Chrome live · T1' },
        { name: `${BASE}-ttys002`, state: 'mcp', who: 'held by T2 (MCP only)' },
      ],
      working: 2,
    },
    {
      label: 'T2 opens',
      title: '4 · Terminal 2 makes its first browser call',
      event: 'It launches on a different profile directory, so there is no lock to contend for.',
      query: '-',
      match: '-',
      verdict: 'Terminal 2 has its own working browser',
      bad: false,
      slots: [
        { name: BASE, state: 'chrome', who: 'Chrome live · T1' },
        { name: `${BASE}-ttys002`, state: 'chrome', who: 'Chrome live · T2' },
      ],
      working: 2,
    },
    {
      label: 'Result',
      title: '5 · End state',
      event:
        'Two terminals, two browsers, two stable profile paths. Restart either terminal and it resolves to the same profile it had, still logged in.',
      query: '-',
      match: '-',
      verdict: 'both sessions working, both profiles stay warm',
      bad: false,
      slots: [
        { name: BASE, state: 'chrome', who: 'Chrome live · T1' },
        { name: `${BASE}-ttys002`, state: 'chrome', who: 'Chrome live · T2' },
      ],
      working: 2,
    },
  ],
  chromeOnly: [
    {
      label: 'T2 up',
      title: '2 · Terminal 2 starts, same repo',
      event:
        "The pattern only knows Chrome's spelling. But Chrome has not launched yet - the process actually holding the profile is npm, and it spells the flag --userDataDir.",
      query: `pgrep -f -- "--user-data-dir=$base[[:space:]]"`,
      match: `npm exec … --userDataDir=…/${BASE} - different spelling → no match`,
      verdict: 'FREE (wrong) → Terminal 2 takes the SAME base profile',
      bad: true,
      slots: [{ name: BASE, state: 'mcp', who: 'held by T1 and T2' }],
      working: 2,
    },
    {
      label: 'T1 opens',
      title: '3 · Terminal 1 makes its first browser call',
      event: 'Chrome launches on the base profile and writes its SingletonLock. Nothing looks wrong yet.',
      query: '-',
      match: '-',
      verdict: 'Terminal 1 has a working browser',
      bad: false,
      slots: [{ name: BASE, state: 'chrome', who: 'Chrome live · T1, T2 also points here' }],
      working: 2,
    },
    {
      label: 'T2 opens',
      title: '4 · Terminal 2 makes its first browser call',
      event:
        'Chrome refuses to open twice against one user-data directory. The lock is held by a live process, so retrying does nothing.',
      query: '-',
      match: '-',
      verdict: `Error: The browser is already running for …/${BASE}`,
      bad: true,
      slots: [
        { name: BASE, state: 'chrome', who: 'Chrome live · T1' },
        { name: BASE, state: 'refused', who: 'T2 refused' },
      ],
      working: 1,
    },
    {
      label: 'Result',
      title: '5 · End state',
      event:
        'Terminal 2 has no browser for the rest of the session. Fixing the wrapper now will not help it either: the MCP server read its arguments at startup and never re-reads them. Terminal 2 has to be restarted.',
      query: '-',
      match: '-',
      verdict: 'one session working out of two',
      bad: true,
      slots: [
        { name: BASE, state: 'chrome', who: 'Chrome live · T1' },
        { name: BASE, state: 'refused', who: 'T2 refused' },
      ],
      working: 1,
    },
  ],
}

/**
 * Step-through of two Claude Code terminals starting in one repo, comparing an
 * in-use check that only knows Chrome's --user-data-dir spelling against one
 * that also matches the MCP server's --userDataDir. The MCP holds the profile
 * before Chrome ever launches, which is the window the narrow check misses.
 */
@Component({
  selector: 'blog-stampede',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">Two terminals, one repo</span>
        <span class="counter">Step {{ idx() + 1 }} / {{ steps().length }}</span>
      </div>

      <div class="toggle" role="group" aria-label="In-use check style">
        <button class="tg" [class.on]="mode() === 'chromeOnly'" (click)="setMode('chromeOnly')">
          Chrome's spelling only
        </button>
        <button class="tg" [class.on]="mode() === 'both'" (click)="setMode('both')">Either spelling</button>
      </div>
      <p class="hint">Step 1 is the same either way. The in-use check first runs in step 2.</p>

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
        @for (s of step().slots; track $index) {
          <div class="slot" [attr.data-state]="s.state">
            <code class="slot-name">{{ s.name }}</code>
            <span class="slot-state">{{ stateLabel(s.state) }}</span>
            <span class="slot-who">{{ s.who }}</span>
          </div>
        }
      </div>

      <div class="footer">
        <span class="logins"
          >Sessions with a working browser: <b [class.bad]="step().working < 2">{{ step().working }} of 2</b></span
        >
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
        word-break: break-word;
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
        flex: 1 1 200px;
        display: grid;
        gap: 2px;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 10px;
        padding: 9px 11px;
        min-width: 0;
      }
      .slot[data-state='chrome'] {
        border-color: #2ea04366;
        background: #0d1f15;
      }
      .slot[data-state='mcp'] {
        border-style: dashed;
      }
      .slot[data-state='refused'] {
        border-color: #ff8a5c66;
        background: #1f1210;
      }
      .slot-name {
        font-family: ui-monospace, Menlo, Consolas, monospace;
        font-size: 11.5px;
        color: #7c9cff;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .slot-state {
        font-size: 10.5px;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: #8b98a8;
      }
      .slot[data-state='chrome'] .slot-state {
        color: #5ad19a;
      }
      .slot[data-state='refused'] .slot-state {
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
  readonly mode = signal<Mode>('chromeOnly')
  readonly idx = signal(0)
  readonly playing = signal(false)

  readonly steps = computed<Step[]>(() => [...SHARED, ...TAIL[this.mode()]])
  readonly step = computed(() => this.steps()[this.idx()])

  private timer: ReturnType<typeof setInterval> | null = null

  stateLabel(s: SlotState): string {
    return s === 'chrome' ? 'chrome running' : s === 'mcp' ? 'mcp holds it · no chrome yet' : 'launch refused'
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
    }, 2400)
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
