import { Component, computed, signal, ViewEncapsulation } from '@angular/core'

type Strategy = 'dir' | 'branch' | 'session'

interface Session {
  id: string
  branch: string
}

// Five agent sessions, all started in the SAME checkout. Branches vary, so a
// branch-scoped key helps a little - and still collides.
const SESSIONS: Session[] = [
  { id: 'A', branch: 'main' },
  { id: 'B', branch: 'main' },
  { id: 'C', branch: 'feat/cart' },
  { id: 'D', branch: 'feat/cart' },
  { id: 'E', branch: 'main' },
]

const STRATEGIES: { key: Strategy; label: string; hint: string }[] = [
  { key: 'dir', label: 'Directory', hint: 'hash of the working directory' },
  { key: 'branch', label: 'Directory + branch', hint: 'directory hash plus the checked-out branch' },
  { key: 'session', label: 'Session', hint: 'directory hash plus a per-session id' },
]

const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, '-')

interface Row {
  id: string
  branch: string
  key: string
  blocked: boolean
}

/**
 * Isolation-key picker. Choose what the resource key is derived from, and how
 * many agent sessions run at once in one checkout; the table shows which
 * sessions collide on the same key and get refused.
 */
@Component({
  selector: 'blog-isolation-key',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">What do you key the profile on?</span>
        <span class="subtitle">all sessions in /work/app</span>
      </div>

      <div class="toggle" role="group" aria-label="Isolation key strategy">
        @for (s of strategies; track s.key) {
          <button class="tg" [class.on]="strategy() === s.key" (click)="strategy.set(s.key)">{{ s.label }}</button>
        }
      </div>
      <p class="hint">Key = {{ activeHint() }}</p>

      <div class="slider-row">
        <span class="muted">Concurrent sessions</span>
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          aria-label="Number of concurrent sessions"
          [value]="count()"
          (input)="count.set(+$any($event.target).value)"
        />
        <span class="count">{{ count() }}</span>
      </div>

      <div class="rows">
        @for (r of rows(); track r.id) {
          <div class="row" [class.bad]="r.blocked">
            <span class="sid">Session {{ r.id }}</span>
            <span class="branch">{{ r.branch }}</span>
            <code class="key">{{ r.key }}</code>
            <span class="badge" [class.bad]="r.blocked">{{ r.blocked ? 'already running' : 'owns it' }}</span>
          </div>
        }
      </div>

      <p class="verdict" [class.bad]="blocked() > 0">
        @if (blocked() > 0) {
          <b>{{ blocked() }} of {{ count() }}</b> sessions refused - the key is coarser than the unit that can be
          concurrent.
        } @else {
          <b>0 of {{ count() }}</b> refused - the key is at least as fine-grained as the concurrency unit.
        }
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
      .subtitle {
        font-size: 12px;
        color: #9aa7b5;
        background: #1c2333;
        border: 1px solid #30363d;
        border-radius: 6px;
        padding: 2px 8px;
        font-family: ui-monospace, Menlo, Consolas, monospace;
      }
      .toggle {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
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
      .slider-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .muted {
        color: #9aa7b5;
        font-size: 13.5px;
      }
      input[type='range'] {
        flex: 1;
        min-width: 160px;
        accent-color: #7c9cff;
        height: 5px;
      }
      .count {
        font-weight: 800;
        font-size: 18px;
        color: #7c9cff;
        font-variant-numeric: tabular-nums;
        min-width: 16px;
      }
      .rows {
        display: grid;
        gap: 6px;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-left: 3px solid #5ad19a;
        border-radius: 9px;
        padding: 8px 10px;
      }
      .row.bad {
        border-left-color: #ff8a5c;
      }
      .sid {
        font-size: 12.5px;
        font-weight: 700;
        white-space: nowrap;
      }
      .branch {
        font-family: ui-monospace, Menlo, Consolas, monospace;
        font-size: 11.5px;
        color: #9aa7b5;
        white-space: nowrap;
      }
      .key {
        font-family: ui-monospace, Menlo, Consolas, monospace;
        font-size: 11.5px;
        color: #7c9cff;
        margin-left: auto;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .badge {
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: #5ad19a;
        background: #2ea04326;
        border-radius: 6px;
        padding: 2px 7px;
        white-space: nowrap;
      }
      .badge.bad {
        color: #ff8a5c;
        background: #ff8a5c26;
      }
      .verdict {
        margin: 0;
        font-size: 13.5px;
        color: #9aa7b5;
      }
      .verdict b {
        color: #5ad19a;
      }
      .verdict.bad b {
        color: #ff8a5c;
      }
    `,
  ],
})
export class IsolationKeyComponent {
  readonly strategies = STRATEGIES
  readonly strategy = signal<Strategy>('dir')
  readonly count = signal(3)

  readonly activeHint = computed(() => STRATEGIES.find((s) => s.key === this.strategy())?.hint ?? '')

  readonly rows = computed<Row[]>(() => {
    const mode = this.strategy()
    const seen = new Set<string>()
    return SESSIONS.slice(0, this.count()).map((s) => {
      const key =
        mode === 'dir'
          ? 'profile-a1b2'
          : mode === 'branch'
            ? `profile-a1b2-${slug(s.branch)}`
            : `profile-a1b2-${s.id.toLowerCase()}`
      const blocked = seen.has(key)
      seen.add(key)
      return { id: s.id, branch: s.branch, key, blocked }
    })
  })

  readonly blocked = computed(() => this.rows().filter((r) => r.blocked).length)
}
