import { Component, OnDestroy, computed, signal, ViewEncapsulation } from '@angular/core'

interface Step {
  label: string
  title: string
  code: string
  desc: string
  host: 'placeholder' | 'cleared' | 'mounted'
}

const STEPS: Step[] = [
  {
    label: 'Render',
    title: '1 · Markdown renders',
    code: `<div data-chart="speed">Chart: decode speed…</div>`,
    desc: 'Analog renders the markdown. Your placeholder lands in the DOM as a plain div showing its no-JS fallback text.',
    host: 'placeholder',
  },
  {
    label: 'Effect',
    title: '2 · Route effect fires',
    code: `effect(() => { if (post()) setTimeout(() => mountCharts()) })`,
    desc: 'In ngAfterViewInit an effect waits for the post signal, then a zero-delay setTimeout lets the markdown finish painting before we scan.',
    host: 'placeholder',
  },
  {
    label: 'Guard',
    title: '3 · Browser guard + lazy import',
    code: `if (!isPlatformBrowser(platformId)) return; await import('./mount-charts')`,
    desc: 'On the server this returns early, so the fallback stays. In the browser the mounter is lazy-loaded — only posts with charts pay for it.',
    host: 'placeholder',
  },
  {
    label: 'Manifest',
    title: "4 · Load this post's manifest",
    code: `manifests['/src/content/' + slug + '/charts.ts']()`,
    desc: 'import.meta.glob resolved every charts.ts at build time. We load only this slug, getting its map of data-chart keys to components.',
    host: 'placeholder',
  },
  {
    label: 'Match',
    title: '5 · Scan & clear placeholders',
    code: `querySelectorAll('[data-chart]') → registry[key]; host.innerHTML = ''`,
    desc: 'Find every placeholder, look its key up in the manifest, and clear the fallback caption to make room for the real component.',
    host: 'cleared',
  },
  {
    label: 'Mount',
    title: '6 · Create & attach the component',
    code: `createComponent(cmp, { hostElement: host }); appRef.attachView(ref.hostView)`,
    desc: 'createComponent turns the placeholder into the component host, setInput passes any data, attachView wires change detection — the widget is live.',
    host: 'mounted',
  },
]

/**
 * Interactive walkthrough of how a chart placeholder becomes a live Angular
 * component. Step through the pipeline (or hit Play) and watch the host preview
 * transform from fallback text → cleared → mounted widget.
 */
@Component({
  selector: 'blog-mount-flow',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">How a chart gets mounted</span>
        <span class="counter">Step {{ idx() + 1 }} / {{ steps.length }}</span>
      </div>

      <div class="stepper">
        @for (s of steps; track s.label; let i = $index) {
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

      <div class="body">
        <div class="panel">
          <p class="panel-title">{{ step().title }}</p>
          <pre class="code">{{ step().code }}</pre>
          <p class="desc">{{ step().desc }}</p>
        </div>

        <div class="preview" [attr.data-state]="step().host">
          <span class="tag">{{ hostTag() }}</span>
          @switch (step().host) {
            @case ('mounted') {
              <div class="mini-chart">
                <div class="mb" style="height:44%;background:#7c9cff"></div>
                <div class="mb" style="height:80%;background:#ff8a5c"></div>
                <div class="mb" style="height:60%;background:#5ad19a"></div>
              </div>
              <span class="hint live">live component</span>
            }
            @case ('cleared') {
              <span class="hint">fallback cleared…</span>
            }
            @default {
              <code class="ph">&lt;div data-chart="speed"&gt;</code>
              <span class="fallback">Chart: decode speed by prompt length.</span>
            }
          }
        </div>
      </div>

      <div class="controls">
        <button class="btn" (click)="prev()" [disabled]="idx() === 0">‹ Prev</button>
        <button class="btn play" (click)="togglePlay()">{{ playing() ? '❚❚ Pause' : '▶ Play' }}</button>
        <button class="btn" (click)="next()" [disabled]="idx() === steps.length - 1">Next ›</button>
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
        min-width: 84px;
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
        grid-template-columns: 1fr 220px;
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
        margin: 0 0 10px;
        font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
        font-size: 12px;
        line-height: 1.5;
        color: #cdd6e0;
        white-space: pre-wrap;
        word-break: break-word;
        overflow-x: auto;
      }
      .desc {
        margin: 0;
        font-size: 13.5px;
        color: #9aa7b5;
      }
      .preview {
        background: #0b0f16;
        border: 1px dashed #30363d;
        border-radius: 10px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        text-align: center;
        position: relative;
        min-height: 150px;
        transition: border-color 0.2s;
      }
      .preview[data-state='mounted'] {
        border-style: solid;
        border-color: #2ea04366;
        background: #0d1f15;
      }
      .tag {
        position: absolute;
        top: 8px;
        left: 10px;
        font-size: 10.5px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #8b98a8;
      }
      .ph {
        font-family: ui-monospace, Menlo, Consolas, monospace;
        font-size: 12px;
        color: #7c9cff;
      }
      .fallback {
        font-size: 12.5px;
        font-style: italic;
        color: #8b98a8;
      }
      .hint {
        font-size: 12px;
        color: #9aa7b5;
      }
      .hint.live {
        color: #5ad19a;
        font-weight: 600;
      }
      .mini-chart {
        display: flex;
        align-items: flex-end;
        gap: 10px;
        height: 80px;
      }
      .mb {
        width: 26px;
        border-radius: 4px 4px 0 0;
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
export class MountFlowComponent implements OnDestroy {
  readonly steps = STEPS
  readonly idx = signal(0)
  readonly playing = signal(false)
  readonly step = computed(() => this.steps[this.idx()])
  readonly hostTag = computed(() => {
    const s = this.step().host
    return s === 'mounted' ? 'host · mounted' : s === 'cleared' ? 'host · clearing' : 'host · placeholder'
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
    this.idx.update((i) => Math.min(this.steps.length - 1, i + 1))
  }

  togglePlay() {
    if (this.playing()) {
      this.stop()
      return
    }
    if (this.idx() === this.steps.length - 1) this.idx.set(0)
    this.playing.set(true)
    this.timer = setInterval(() => {
      if (this.idx() >= this.steps.length - 1) {
        this.stop()
        return
      }
      this.idx.update((i) => i + 1)
    }, 1500)
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
