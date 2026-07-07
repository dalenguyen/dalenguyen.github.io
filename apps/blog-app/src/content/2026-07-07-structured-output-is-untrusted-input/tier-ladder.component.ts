import { Component, OnDestroy, computed, signal, ViewEncapsulation } from '@angular/core'

interface Tier {
  label: string
  title: string
  mechanism: string
  removes: string
  breaks: string
  // Which failure classes are still live at this tier (struck-through = eliminated).
  live: { text: boolean; shape: boolean; content: boolean }
}

const TIERS: Tier[] = [
  {
    label: 'Tier 1',
    title: '1 · Parse the free text',
    mechanism: `json.loads(response.text)`,
    removes: 'Nothing yet — this is the baseline.',
    breaks:
      'Anything non-JSON in the text throws away the whole response: markdown fences, raw control chars, invalid \\escapes, truncation.',
    live: { text: true, shape: true, content: true },
  },
  {
    label: 'Tier 2',
    title: '2 · Forced tool / function call',
    mechanism: `resp.content[0].input  # provider forces one tool call`,
    removes: 'Text-parse failures — the payload now arrives as a dict, not a string you have to hand-parse.',
    breaks:
      'The dict can still be mangled: flattened to a string, an array where you wanted an object, wrapped under a placeholder key, missing fields, a bare string.',
    live: { text: false, shape: true, content: true },
  },
  {
    label: 'Tier 3',
    title: '3 · Provider-enforced schema',
    mechanism: `tools=[{...}], strict=True  # constrained decoding`,
    removes: 'Shape mangles — the provider physically cannot emit a payload that violates the schema. Valid by construction.',
    breaks:
      'Refusals and truncation remain. Those are content problems, not shape problems — no schema can conjure the answer the model declined to give.',
    live: { text: false, shape: false, content: true },
  },
]

const CLASSES = [
  { key: 'text' as const, name: 'Text-parse errors' },
  { key: 'shape' as const, name: 'Shape mangles' },
  { key: 'content' as const, name: 'Refusals & truncation' },
]

/**
 * Interactive ladder of the three tiers of "structured output". Step up the
 * ladder (or hit Play) and watch each failure class get struck through as a
 * stronger mechanism removes it at the source.
 */
@Component({
  selector: 'blog-tier-ladder',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">Three tiers of structured output</span>
        <span class="counter">{{ tier().label }} / {{ tiers.length }}</span>
      </div>

      <div class="stepper">
        @for (t of tiers; track t.label; let i = $index) {
          <button
            class="seg"
            [class.active]="i === idx()"
            [class.done]="i < idx()"
            (click)="go(i)"
            [attr.aria-current]="i === idx() ? 'step' : null"
          >
            <span class="dot">{{ i + 1 }}</span>
            <span class="seg-label">{{ t.label }}</span>
          </button>
        }
      </div>

      <div class="body">
        <div class="panel">
          <p class="panel-title">{{ tier().title }}</p>
          <pre class="code">{{ tier().mechanism }}</pre>
          <p class="line"><span class="badge good">removes</span>{{ tier().removes }}</p>
          <p class="line"><span class="badge bad">still breaks</span>{{ tier().breaks }}</p>
        </div>

        <div class="preview">
          <span class="tag">failure classes</span>
          <ul class="classes">
            @for (c of classes; track c.key) {
              <li class="cls" [class.gone]="!tier().live[c.key]">
                <span class="mark">{{ tier().live[c.key] ? '●' : '✓' }}</span>
                <span class="cls-name">{{ c.name }}</span>
              </li>
            }
          </ul>
          <span class="hint" [class.clean]="!tier().live.text && !tier().live.shape">
            {{ statusLine() }}
          </span>
        </div>
      </div>

      <div class="controls">
        <button class="btn" (click)="prev()" [disabled]="idx() === 0">‹ Prev</button>
        <button class="btn play" (click)="togglePlay()">{{ playing() ? '❚❚ Pause' : '▶ Play' }}</button>
        <button class="btn" (click)="next()" [disabled]="idx() === tiers.length - 1">Next ›</button>
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
        min-width: 96px;
        display: flex;
        align-items: center;
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
      .body {
        display: grid;
        grid-template-columns: 1fr 240px;
        gap: 16px;
      }
      @media (max-width: 560px) {
        .body {
          grid-template-columns: 1fr;
        }
      }
      .panel .panel-title {
        margin: 0 0 8px;
        font-size: 14px;
        font-weight: 700;
        color: #7c9cff;
      }
      .code {
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 10px 12px;
        margin: 0 0 12px;
        font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
        font-size: 12px;
        line-height: 1.5;
        color: #cdd6e0;
        white-space: pre-wrap;
        word-break: break-word;
        overflow-x: auto;
      }
      .line {
        margin: 0 0 8px;
        font-size: 13.5px;
        color: #cdd6e0;
      }
      .badge {
        display: inline-block;
        font-size: 10.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        border-radius: 5px;
        padding: 2px 7px;
        margin-right: 8px;
        vertical-align: 1px;
      }
      .badge.good {
        background: #2ea04326;
        color: #5ad19a;
      }
      .badge.bad {
        background: #f8514926;
        color: #ff8a80;
      }
      .preview {
        background: #0b0f16;
        border: 1px dashed #30363d;
        border-radius: 10px;
        padding: 16px 14px 14px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        position: relative;
        min-height: 150px;
      }
      .tag {
        position: absolute;
        top: 8px;
        left: 12px;
        font-size: 10.5px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #8b98a8;
      }
      .classes {
        list-style: none;
        margin: 18px 0 0;
        padding: 0;
        display: grid;
        gap: 8px;
      }
      .cls {
        display: flex;
        align-items: center;
        gap: 9px;
        font-size: 13px;
        color: #e6edf3;
        transition: all 0.2s;
      }
      .cls .mark {
        color: #ff8a80;
        font-size: 11px;
        width: 12px;
        text-align: center;
      }
      .cls.gone {
        color: #6b7684;
      }
      .cls.gone .cls-name {
        text-decoration: line-through;
      }
      .cls.gone .mark {
        color: #5ad19a;
      }
      .hint {
        font-size: 12px;
        color: #9aa7b5;
        margin-top: auto;
      }
      .hint.clean {
        color: #5ad19a;
        font-weight: 600;
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
export class TierLadderComponent implements OnDestroy {
  readonly tiers = TIERS
  readonly classes = CLASSES
  readonly idx = signal(0)
  readonly playing = signal(false)
  readonly tier = computed(() => this.tiers[this.idx()])
  readonly statusLine = computed(() => {
    const live = this.tier().live
    const n = [live.text, live.shape, live.content].filter(Boolean).length
    if (!live.text && !live.shape) return 'Shape is guaranteed. Only content failures remain.'
    return `${n} of 3 failure classes still live.`
  })

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
    this.idx.update((i) => Math.min(this.tiers.length - 1, i + 1))
  }

  togglePlay() {
    if (this.playing()) {
      this.stop()
      return
    }
    if (this.idx() === this.tiers.length - 1) this.idx.set(0)
    this.playing.set(true)
    this.timer = setInterval(() => {
      if (this.idx() >= this.tiers.length - 1) {
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
