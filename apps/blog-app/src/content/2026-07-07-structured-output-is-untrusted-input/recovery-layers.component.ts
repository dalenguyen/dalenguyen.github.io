import { Component, computed, signal, ViewEncapsulation } from '@angular/core'

interface Layer {
  name: string
  guards: string
  // 'bandaid' → reacting to one provider quirk; strict mode deletes it.
  // 'structural' → guards refusals/truncation/total-failure; useful regardless.
  kind: 'bandaid' | 'structural'
}

const LAYERS: Layer[] = [
  { name: 'unwrap-placeholder-key', guards: 'payload wrapped under {"$PARAMETER_NAME": …}', kind: 'bandaid' },
  { name: 'normalize-flattened-object', guards: 'a nested object serialized into a JSON string', kind: 'bandaid' },
  { name: 'coerce-string-field', guards: 'a bare string where an object was expected', kind: 'bandaid' },
  { name: 'drop-malformed items', guards: 'garbage list entries — dropped, and logged so the drop is visible', kind: 'structural' },
  { name: 'empty-after-sanitize → parse failure', guards: 'a sanitize pass that emptied everything; trips a retry instead of returning a blank husk', kind: 'structural' },
  { name: 'retry ladder', guards: 'refusals & model-specific mangles — escalates to a different model, not the same one', kind: 'structural' },
  { name: 'fail-open floor', guards: 'total failure — posts a visibly-degraded stub so humans are never blocked on a parsing bug', kind: 'structural' },
]

/**
 * The seven recovery layers that accreted around one structured-output path,
 * each labeled band-aid vs structural guard. Flip strict mode on and watch the
 * three band-aids become dead code — the visual form of "remove the failure
 * class at the source instead of adding the next band-aid".
 */
@Component({
  selector: 'blog-recovery-layers',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">Seven recovery layers — which survive the source fix?</span>
        <button class="toggle" [class.on]="strict()" (click)="strict.set(!strict())" role="switch" [attr.aria-checked]="strict()">
          <span class="knob"></span>
          <span class="toggle-label">strict mode {{ strict() ? 'ON' : 'OFF' }}</span>
        </button>
      </div>

      <ul class="layers">
        @for (l of layers; track l.name; let i = $index) {
          <li class="layer" [class.dead]="strict() && l.kind === 'bandaid'">
            <span class="num">{{ i + 1 }}</span>
            <div class="meat">
              <span class="name">{{ l.name }}</span>
              <span class="guards">{{ l.guards }}</span>
            </div>
            @if (strict() && l.kind === 'bandaid') {
              <span class="pill dead-pill">dead code — safe to delete</span>
            } @else {
              <span class="pill" [class.band]="l.kind === 'bandaid'" [class.struct]="l.kind === 'structural'">
                {{ l.kind === 'bandaid' ? 'band-aid' : 'structural guard' }}
              </span>
            }
          </li>
        }
      </ul>

      <p class="summary" [class.on]="strict()">{{ summary() }}</p>
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
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .title {
        font-size: 15px;
        font-weight: 700;
      }
      .toggle {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 999px;
        padding: 5px 12px 5px 5px;
        cursor: pointer;
        color: #9aa7b5;
        font: inherit;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        transition: all 0.18s;
      }
      .toggle .knob {
        width: 30px;
        height: 18px;
        border-radius: 999px;
        background: #30363d;
        position: relative;
        transition: background 0.18s;
        flex-shrink: 0;
      }
      .toggle .knob::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #8b98a8;
        transition: transform 0.18s, background 0.18s;
      }
      .toggle.on {
        color: #5ad19a;
        border-color: #2ea04366;
      }
      .toggle.on .knob {
        background: #2ea04366;
      }
      .toggle.on .knob::after {
        transform: translateX(12px);
        background: #5ad19a;
      }
      .layers {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 8px;
      }
      .layer {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 9px;
        padding: 10px 12px;
        transition: all 0.2s;
      }
      .layer.dead {
        opacity: 0.42;
      }
      .layer.dead .name {
        text-decoration: line-through;
      }
      .num {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #21262d;
        font-size: 11px;
        font-weight: 700;
        color: #9aa7b5;
        flex-shrink: 0;
      }
      .meat {
        display: flex;
        flex-direction: column;
        gap: 1px;
        flex: 1;
        min-width: 0;
      }
      .name {
        font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
        font-size: 13px;
        font-weight: 600;
        color: #e6edf3;
      }
      .guards {
        font-size: 12.5px;
        color: #9aa7b5;
      }
      .pill {
        font-size: 10.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        border-radius: 5px;
        padding: 3px 8px;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .pill.band {
        background: #d2992226;
        color: #e3b341;
      }
      .pill.struct {
        background: #2ea04326;
        color: #5ad19a;
      }
      .dead-pill {
        font-size: 10.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        border-radius: 5px;
        padding: 3px 8px;
        white-space: nowrap;
        flex-shrink: 0;
        background: #f8514926;
        color: #ff8a80;
      }
      .summary {
        margin: 0;
        font-size: 13.5px;
        color: #9aa7b5;
        padding: 10px 12px;
        border-radius: 8px;
        background: #0b0f16;
        border: 1px solid #30363d;
      }
      .summary.on {
        color: #cdd6e0;
        border-color: #2ea04340;
      }
    `,
  ],
})
export class RecoveryLayersComponent {
  readonly layers = LAYERS
  readonly strict = signal(false)
  readonly summary = computed(() =>
    this.strict()
      ? '3 layers just became dead code — they only ever existed because output was not schema-enforced. 4 structural guards remain: they protect against refusals, truncation, and total failure regardless of tier.'
      : 'All seven fire today. Three are band-aids for a specific provider quirk; four are structural guards. Flip strict mode to see which the source fix deletes.'
  )
}
