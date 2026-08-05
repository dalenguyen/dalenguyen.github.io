import { Component, OnDestroy, computed, signal, ViewEncapsulation } from '@angular/core'

interface Spot {
  label: string // chip text — keep to one short line
  title: string
  graded: string // what the audit actually looks at
  wire: string // what a probe on the wire shows instead
  green: string // why the score stays green anyway
  cost: string // the leak, quantified — shown on the red pill
}

const SPOTS: Spot[] = [
  {
    label: 'Encoding',
    title: 'Content-Encoding',
    graded: 'The rendered DOM. A 500 KB bundle and a 130 KB bundle produce the identical DOM.',
    wire: 'curl -I with Accept-Encoding shows no Content-Encoding — the bytes ship raw.',
    green: 'Compression is not part of the SEO or best-practices score at all — at most a soft "wasted bytes" insight you have to go read.',
    cost: '−370 KB / load',
  },
  {
    label: 'Caching',
    title: 'Cache-Control',
    graded: 'One cold load. Fingerprinted asset URLs never change, but the audit fetches each once.',
    wire: 'ETag and Last-Modified only — so a repeat visitor pays a revalidation round trip per file.',
    green: 'Also just an insight, never a scored failure. A round trip that returns 304 still costs a round trip.',
    cost: 'round trip × N',
  },
  {
    label: 'Facets',
    title: 'Facet duplication',
    graded: 'Exactly the one URL you handed it — /shoes.',
    wire: '/shoes?color=red&sort=price returns 200 with the same title and no canonical.',
    green: 'The audit never requested the facet URL, so the near-duplicate it competes with is invisible to the score.',
    cost: '+9,999 crawlable URLs',
  },
  {
    label: 'Soft 404',
    title: 'Soft 404',
    graded: 'Only the URLs you give it — all of which happen to exist.',
    wire: '/anything and /a/b/c return 200 with the empty app shell.',
    green: 'A wrong-but-200 response is byte-identical to success. Status-code-only monitoring passes it.',
    cost: '200 where 404 belongs',
  },
  {
    label: 'Lab LCP',
    title: 'Lab timing',
    graded: 'One load, unthrottled, on a fast local link, with no field data to contradict it.',
    wire: 'Sub-second lab LCP is entirely compatible with a half-MB bundle that takes seconds on real mobile.',
    green: 'A brand-new site has no real-user data precisely when you are deciding what to fix.',
    cost: '×6 slower on 4G',
  },
  {
    label: 'SDK',
    title: 'Third-party SDK',
    graded: 'A vague cookie / best-practices ding that never names the cause.',
    wire: 'An auth SDK pulls a third-party script and sets third-party cookies on every page.',
    green: 'It fires for visitors who never sign in, and the audit never traces it back to the default constructor.',
    cost: '3rd-party on 100% of pages',
  },
]

/**
 * The article's thesis as a walkthrough: a perfect audit score sits on the left,
 * unmoved, while each step reveals what a probe on the wire actually finds. Step
 * through the blind spots, or hit Play. Interval is cleared in ngOnDestroy.
 */
@Component({
  selector: 'blog-blind-spots',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">What the score can't see</span>
        <span class="counter">{{ idx() + 1 }} / {{ spots.length }}</span>
      </div>

      <div class="stepper">
        @for (s of spots; track s.label; let i = $index) {
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
          <p class="panel-title">{{ spot().title }}</p>
          <div class="line">
            <span class="k graded-k">Graded</span>
            <span class="v">{{ spot().graded }}</span>
          </div>
          <div class="line">
            <span class="k wire-k">On the wire</span>
            <span class="v">{{ spot().wire }}</span>
          </div>
          <div class="line">
            <span class="k green-k">Why green</span>
            <span class="v">{{ spot().green }}</span>
          </div>
        </div>

        <div class="score">
          <span class="tag">audit score</span>
          <div class="gauge">100</div>
          <div class="checks">
            <span class="chk">✓ SEO</span>
            <span class="chk">✓ Best practices</span>
            <span class="chk">✓ Performance</span>
          </div>
          <div class="leak">
            <span class="leak-dot"></span>
            <span class="leak-cost">{{ spot().cost }}</span>
          </div>
          <span class="leak-note">what it can't see</span>
        </div>
      </div>

      <div class="controls">
        <button class="btn" (click)="prev()" [disabled]="idx() === 0">‹ Prev</button>
        <button class="btn play" (click)="togglePlay()">{{ playing() ? '❚❚ Pause' : '▶ Play' }}</button>
        <button class="btn" (click)="next()" [disabled]="idx() === spots.length - 1">Next ›</button>
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
        flex: 1 1 auto;
        min-width: 0;
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
      .seg .seg-label {
        white-space: nowrap;
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
        grid-template-columns: 1fr 180px;
        gap: 16px;
      }
      @media (max-width: 560px) {
        .body {
          grid-template-columns: 1fr;
        }
      }
      .panel-title {
        margin: 0 0 12px;
        font-size: 14px;
        font-weight: 700;
        color: #7c9cff;
      }
      .line {
        display: grid;
        grid-template-columns: 92px 1fr;
        gap: 10px;
        margin-bottom: 10px;
      }
      .line:last-child {
        margin-bottom: 0;
      }
      .k {
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        padding-top: 2px;
      }
      .graded-k {
        color: #9aa7b5;
      }
      .wire-k {
        color: #ff8a5c;
      }
      .green-k {
        color: #5ad19a;
      }
      .v {
        font-size: 13.5px;
        color: #cdd6e0;
      }
      .score {
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 10px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        text-align: center;
        position: relative;
      }
      .tag {
        font-size: 10.5px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #8b98a8;
      }
      .gauge {
        width: 74px;
        height: 74px;
        border-radius: 50%;
        border: 4px solid #5ad19a;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 30px;
        font-weight: 800;
        color: #5ad19a;
        font-variant-numeric: tabular-nums;
      }
      .checks {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .chk {
        font-size: 11px;
        color: #5ad19a;
      }
      .leak {
        margin-top: 4px;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        background: #ff8a5c1a;
        border: 1px solid #ff8a5c40;
        border-radius: 8px;
        padding: 5px 10px;
      }
      .leak-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ff8a5c;
        box-shadow: 0 0 0 0 #ff8a5c99;
        animation: pulse 1.8s infinite;
        flex-shrink: 0;
      }
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 #ff8a5c66;
        }
        70% {
          box-shadow: 0 0 0 7px #ff8a5c00;
        }
        100% {
          box-shadow: 0 0 0 0 #ff8a5c00;
        }
      }
      .leak-cost {
        font-size: 12.5px;
        font-weight: 700;
        color: #ff8a5c;
        font-variant-numeric: tabular-nums;
      }
      .leak-note {
        font-size: 10.5px;
        color: #8b98a8;
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
export class BlindSpotsComponent implements OnDestroy {
  readonly spots = SPOTS
  readonly idx = signal(0)
  readonly playing = signal(false)
  readonly spot = computed(() => this.spots[this.idx()])

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
    this.idx.update((i) => Math.min(this.spots.length - 1, i + 1))
  }

  togglePlay() {
    if (this.playing()) {
      this.stop()
      return
    }
    if (this.idx() === this.spots.length - 1) this.idx.set(0)
    this.playing.set(true)
    this.timer = setInterval(() => {
      if (this.idx() >= this.spots.length - 1) {
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
