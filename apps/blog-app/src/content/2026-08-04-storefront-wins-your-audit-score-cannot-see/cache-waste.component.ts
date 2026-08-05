import { Component, computed, signal, ViewEncapsulation } from '@angular/core'

// A category page with 40 product thumbnails, ~30 KB each: one full paint of
// imagery is ~1.2 MB. The only variable a reader controls here is how many
// times they come back.
const IMG_COUNT = 40
const IMG_KB = 30
const PAGE_KB = IMG_COUNT * IMG_KB // 1200 KB per full refetch
const MAX_VISITS = 20

const fmt = (kb: number): string => (kb < 1000 ? Math.round(kb) + ' KB' : (kb / 1000).toFixed(1) + ' MB')

/**
 * Repeat-visit cost of the object store's default `private, max-age=0` versus an
 * `immutable` policy. Drag the visit count: the default line refetches every
 * image every time; immutable pays once and the edge holds the rest.
 */
@Component({
  selector: 'blog-cache-waste',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">Repeat-visit image cost</span>
        <span class="subtitle">40 thumbnails · ~30 KB each</span>
      </div>

      <div class="slider-row">
        <span class="muted">Repeat visits</span>
        <input
          type="range"
          min="1"
          max="20"
          step="1"
          aria-label="Number of repeat visits"
          [value]="visits()"
          [attr.aria-valuetext]="visits() + ' visits'"
          (input)="visits.set(+$any($event.target).value)"
        />
        <span class="visits-label">{{ visits() }}×</span>
      </div>

      <div class="rows">
        <div class="row">
          <div class="row-head">
            <span class="tag bad">default</span>
            <code class="policy">private, max-age=0</code>
            <span class="amount bad-fg">{{ defaultLabel() }}</span>
          </div>
          <div class="track"><div class="fill bad-bg" [style.width.%]="defaultPct()"></div></div>
        </div>

        <div class="row">
          <div class="row-head">
            <span class="tag good">immutable</span>
            <code class="policy">public, max-age=31536000, immutable</code>
            <span class="amount good-fg">{{ cachedLabel }}</span>
          </div>
          <div class="track"><div class="fill good-bg" [style.width.%]="cachedPct()"></div></div>
        </div>
      </div>

      <p class="readout">
        <span class="wasted">{{ wastedLabel() }}</span>
        <span class="muted">re-downloaded for nothing across {{ visits() }} visit{{ visits() === 1 ? '' : 's' }}</span>
      </p>

      <p class="note">
        A 200 with a fresh body every time looks identical to success. The write-path fix is one header — but
        everything already uploaded keeps the old policy until you backfill.
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
        gap: 16px;
      }
      .header {
        display: flex;
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
      }
      .slider-row {
        display: flex;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
      }
      .muted {
        color: #9aa7b5;
        font-size: 14px;
      }
      input[type='range'] {
        flex: 1;
        min-width: 180px;
        accent-color: #7c9cff;
        height: 5px;
      }
      .visits-label {
        font-variant-numeric: tabular-nums;
        font-weight: 700;
        font-size: 18px;
        min-width: 44px;
        color: #7c9cff;
      }
      .rows {
        display: grid;
        gap: 14px;
      }
      .row {
        display: grid;
        gap: 7px;
      }
      .row-head {
        display: flex;
        align-items: center;
        gap: 9px;
        flex-wrap: wrap;
      }
      .tag {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        border-radius: 6px;
        padding: 2px 8px;
      }
      .tag.bad {
        color: #ff8a5c;
        background: #ff8a5c1a;
        border: 1px solid #ff8a5c40;
      }
      .tag.good {
        color: #5ad19a;
        background: #5ad19a1a;
        border: 1px solid #5ad19a40;
      }
      .policy {
        font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
        font-size: 11.5px;
        color: #9aa7b5;
      }
      .amount {
        margin-left: auto;
        font-variant-numeric: tabular-nums;
        font-weight: 800;
        font-size: 16px;
      }
      .bad-fg {
        color: #ff8a5c;
      }
      .good-fg {
        color: #5ad19a;
      }
      .track {
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 8px;
        height: 20px;
        overflow: hidden;
      }
      .fill {
        height: 100%;
        border-radius: 7px;
        transition: width 0.18s ease;
        min-width: 3px;
      }
      .bad-bg {
        background: #ff8a5c;
      }
      .good-bg {
        background: #5ad19a;
      }
      .readout {
        margin: 0;
        display: flex;
        align-items: baseline;
        gap: 10px;
        flex-wrap: wrap;
      }
      .wasted {
        font-size: 26px;
        font-weight: 800;
        font-variant-numeric: tabular-nums;
        color: #ff8a5c;
      }
      .note {
        color: #9aa7b5;
        font-size: 13px;
        margin: 0;
      }
    `,
  ],
})
export class CacheWasteComponent {
  readonly visits = signal(8)

  // default policy refetches the whole page of imagery on every visit
  private readonly defaultKb = computed(() => this.visits() * PAGE_KB)
  // immutable: fetched once, then served from cache — no revalidation round trip
  private readonly cachedKb = PAGE_KB
  private readonly maxKb = MAX_VISITS * PAGE_KB

  readonly defaultLabel = computed(() => fmt(this.defaultKb()))
  readonly cachedLabel = fmt(this.cachedKb)
  readonly wastedLabel = computed(() => fmt(this.defaultKb() - this.cachedKb))

  readonly defaultPct = computed(() => (this.defaultKb() / this.maxKb) * 100)
  readonly cachedPct = computed(() => (this.cachedKb / this.maxKb) * 100)
}
