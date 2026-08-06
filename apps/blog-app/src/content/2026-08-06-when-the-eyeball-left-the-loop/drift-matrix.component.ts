import { Component, signal, ViewEncapsulation } from '@angular/core'

type Mode = 'code' | 'render'

interface Row {
  prop: string
  old: string
  next: string
  kind: 'intended' | 'drift'
  note: string
}

// A shared <Button> whose "solid" and "ghost" variants each bundle a full set of
// utilities. Swapping the variant to drop the border silently changes five other
// properties. Tailwind-flavored class strings.
const ROWS: Row[] = [
  { prop: 'border', old: 'border border-slate-300', next: 'border-0', kind: 'intended', note: 'the change the ticket asked for' },
  { prop: 'background', old: 'bg-slate-100', next: 'bg-transparent', kind: 'drift', note: 'the fill silently dropped' },
  { prop: 'text', old: 'text-slate-900', next: 'text-slate-500', kind: 'drift', note: 'label went muted' },
  { prop: 'hover', old: 'hover:bg-slate-200', next: '—', kind: 'drift', note: 'hover feedback destroyed' },
  { prop: 'shadow', old: 'shadow-sm', next: 'shadow-none', kind: 'drift', note: 'elevation gone' },
  { prop: 'focus ring', old: 'focus:ring-2 ring-slate-400', next: 'ring-0', kind: 'drift', note: 'focus a11y regressed' },
]

/**
 * A named variant is a bundle, not a knob. Toggle between "read the diff" (what
 * code review sees — one intended property) and "measure the render" (what the
 * running artifact shows — five silent drifts). Pure presentational component.
 */
@Component({
  selector: 'blog-drift-matrix',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">A variant is a bundle, not a knob</span>
        <span class="subtitle">solid → ghost</span>
      </div>

      <div class="diff">
        <span class="minus">- &lt;Button variant="solid" /&gt;</span>
        <span class="plus">+ &lt;Button variant="ghost" /&gt;</span>
        <span class="goal">goal: drop the border</span>
      </div>

      <div class="toggle" role="tablist" aria-label="View mode">
        <button class="tab" role="tab" [class.on]="mode() === 'code'" [attr.aria-selected]="mode() === 'code'" (click)="mode.set('code')">
          Read the diff
        </button>
        <button class="tab" role="tab" [class.on]="mode() === 'render'" [attr.aria-selected]="mode() === 'render'" (click)="mode.set('render')">
          Measure the render
        </button>
      </div>

      @if (mode() === 'code') {
        <div class="rows">
          @for (r of intendedRows; track r.prop) {
            <div class="row intended">
              <span class="rprop">{{ r.prop }}</span>
              <span class="rval old">{{ r.old }}</span>
              <span class="rarrow">→</span>
              <span class="rval next">{{ r.next }}</span>
              <span class="rtag ok">intended</span>
            </div>
          }
        </div>
        <p class="verdict ok">
          The diff you reviewed touches one property — exactly what the ticket said. Plausible by construction.
          <b>This is all code review can see.</b>
        </p>
      } @else {
        <div class="preview">
          <div class="pv">
            <button class="btn-solid" type="button">Save</button>
            <span class="pv-cap">solid (old)</span>
          </div>
          <span class="pv-arrow">→</span>
          <div class="pv">
            <button class="btn-ghost" type="button">Save</button>
            <span class="pv-cap">ghost (new)</span>
          </div>
        </div>
        <div class="rows">
          @for (r of rows; track r.prop) {
            <div class="row" [attr.data-kind]="r.kind">
              <span class="rprop">{{ r.prop }}</span>
              <span class="rval old">{{ r.old }}</span>
              <span class="rarrow">→</span>
              <span class="rval next">{{ r.next }}</span>
              <span class="rtag" [attr.data-kind]="r.kind">{{ r.kind === 'intended' ? 'intended' : 'drift' }}</span>
              <span class="rnote">{{ r.note }}</span>
            </div>
          }
        </div>
        <p class="verdict warn">
          <b>{{ intendedCount }} intended change, {{ driftCount }} silent ones.</b>
          The variant named for your intent implements far more than your intent — only the running artifact reveals it.
        </p>
      }
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
      .diff {
        display: flex;
        flex-direction: column;
        gap: 2px;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 10px;
        padding: 12px 14px;
        font-family: ui-monospace, Menlo, Consolas, monospace;
        font-size: 12.5px;
      }
      .minus {
        color: #ff7b72;
      }
      .plus {
        color: #7ee2a8;
      }
      .goal {
        color: #6e7681;
        font-style: italic;
        margin-top: 3px;
      }
      .toggle {
        display: flex;
        gap: 6px;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 10px;
        padding: 4px;
      }
      .tab {
        flex: 1 1 auto;
        min-width: 0;
        background: transparent;
        border: none;
        border-radius: 7px;
        color: #9aa7b5;
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        padding: 8px 10px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.15s;
      }
      .tab:hover {
        color: #cdd6e0;
      }
      .tab.on {
        background: #7c9cff;
        color: #08111f;
      }
      .rows {
        display: grid;
        gap: 6px;
      }
      .row {
        display: grid;
        grid-template-columns: 82px minmax(0, 1fr) 14px minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 8px 11px;
      }
      .row[data-kind='drift'] {
        border-color: #f8514966;
        background: #1a1113;
      }
      .row.intended,
      .row[data-kind='intended'] {
        border-color: #2ea04366;
        background: #0d1f15;
      }
      .rprop {
        font-size: 12.5px;
        font-weight: 700;
        color: #cdd6e0;
      }
      .rval {
        font-family: ui-monospace, Menlo, Consolas, monospace;
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .rval.old {
        color: #8b98a8;
      }
      .rval.next {
        color: #e6edf3;
      }
      .rarrow {
        color: #6e7681;
        font-size: 12px;
      }
      .rtag {
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        padding: 2px 7px;
        border-radius: 5px;
        white-space: nowrap;
      }
      .rtag.ok,
      .rtag[data-kind='intended'] {
        background: #2ea04326;
        color: #7ee2a8;
      }
      .rtag[data-kind='drift'] {
        background: #f8514926;
        color: #ff7b72;
      }
      .rnote {
        grid-column: 1 / -1;
        font-size: 11.5px;
        color: #9aa7b5;
      }
      .row[data-kind='drift'] .rnote {
        color: #d69a94;
      }
      @media (max-width: 560px) {
        .row {
          grid-template-columns: 74px 1fr auto;
        }
        .rarrow,
        .rval.old {
          display: none;
        }
      }
      .preview {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 18px;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 10px;
        padding: 16px;
      }
      .pv {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      .pv-cap {
        font-size: 11px;
        color: #8b98a8;
      }
      .pv-arrow {
        color: #6e7681;
      }
      .btn-solid {
        font: inherit;
        font-size: 14px;
        font-weight: 600;
        padding: 8px 18px;
        border-radius: 8px;
        background: #f1f5f9;
        color: #0f172a;
        border: 1px solid #cbd5e1;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
        cursor: pointer;
      }
      .btn-ghost {
        font: inherit;
        font-size: 14px;
        font-weight: 600;
        padding: 8px 18px;
        border-radius: 8px;
        background: transparent;
        color: #64748b;
        border: 0;
        box-shadow: none;
        cursor: pointer;
      }
      .verdict {
        margin: 0;
        font-size: 13px;
        color: #9aa7b5;
      }
      .verdict b {
        color: #e6edf3;
      }
      .verdict.ok {
        color: #9aa7b5;
      }
      .verdict.warn b {
        color: #ffb086;
      }
    `,
  ],
})
export class DriftMatrixComponent {
  readonly rows = ROWS
  readonly intendedRows = ROWS.filter((r) => r.kind === 'intended')
  readonly intendedCount = this.intendedRows.length
  readonly driftCount = ROWS.length - this.intendedCount
  readonly mode = signal<Mode>('code')
}
