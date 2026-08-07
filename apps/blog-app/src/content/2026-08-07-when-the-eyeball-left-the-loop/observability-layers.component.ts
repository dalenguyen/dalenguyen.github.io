import { Component, ViewEncapsulation } from '@angular/core'

interface Layer {
  n: number
  name: string
  example: string
  note: string
  obs: string
  kind: 'seen' | 'blind'
}

// The four layers between what an agent writes and what a user sees. CI and the
// agent can observe the first two; the resolved style and composited pixels only
// exist at runtime, so nothing in the repo can check them.
const LAYERS: Layer[] = [
  { n: 1, name: 'intent', example: '"borderless"', note: 'the ticket’s words', obs: 'agent reasons here', kind: 'seen' },
  { n: 2, name: 'authored code', example: 'variant="ghost"', note: '+ base classes the shared component adds', obs: 'CI checks here', kind: 'seen' },
  { n: 3, name: 'resolved style', example: 'cascade decides', note: 'among conflicting declarations', obs: 'nothing checks here', kind: 'blind' },
  { n: 4, name: 'composited pixels', example: 'alpha-blended', note: 'over whatever ancestor is behind it', obs: 'nothing checks here', kind: 'blind' },
]

/**
 * Static, responsive figure of the intent → authored code → resolved style →
 * composited pixels pipeline, colour-coded by what CI and the agent can observe.
 * Replaces a wide ASCII diagram that overflowed the article column.
 */
@Component({
  selector: 'blog-observability-layers',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">From intent to pixels — and where CI goes blind</span>
      </div>

      <div class="flow">
        @for (l of layers; track l.n) {
          <div class="layer" [attr.data-kind]="l.kind">
            <div class="lname"><span class="num">{{ l.n }}</span>{{ l.name }}</div>
            <div class="lex">{{ l.example }}</div>
            <div class="lnote">{{ l.note }}</div>
            <div class="obs" [attr.data-kind]="l.kind">{{ l.obs }}</div>
          </div>
        }
      </div>

      <p class="caption">
        In the green layers, the agent and CI can observe the consequences of a change. The red layers
        exist only at runtime — unit tests, component tests, and code review are all blind there.
        <b>Trust follows observability.</b>
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
        gap: 15px;
      }
      .header .title {
        font-size: 15px;
        font-weight: 700;
      }
      .flow {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      .layer {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 7px;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-top-width: 3px;
        border-radius: 10px;
        padding: 11px 12px 12px;
      }
      .layer[data-kind='seen'] {
        border-top-color: #2ea043;
      }
      .layer[data-kind='blind'] {
        border-top-color: #f85149;
        background: #140f11;
      }
      .lname {
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 13px;
        font-weight: 700;
        color: #e6edf3;
      }
      .num {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #21262d;
        color: #9aa7b5;
        font-size: 11px;
        font-weight: 700;
        flex-shrink: 0;
      }
      .lex {
        font-family: ui-monospace, Menlo, Consolas, monospace;
        font-size: 12px;
        font-weight: 600;
        color: #b8c8ff;
        word-break: break-word;
      }
      .lnote {
        font-size: 12px;
        color: #9aa7b5;
        flex: 1 1 auto;
      }
      .obs {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.01em;
        padding: 4px 8px;
        border-radius: 6px;
        text-align: center;
      }
      .obs[data-kind='seen'] {
        background: #2ea04322;
        color: #7ee2a8;
        border: 1px solid #2ea04355;
      }
      .obs[data-kind='blind'] {
        background: #f8514922;
        color: #ff7b72;
        border: 1px solid #f8514955;
      }
      @media (max-width: 560px) {
        .flow {
          grid-template-columns: 1fr;
        }
      }
      .caption {
        margin: 0;
        font-size: 13px;
        color: #9aa7b5;
      }
      .caption b {
        color: #e6edf3;
      }
    `,
  ],
})
export class ObservabilityLayersComponent {
  readonly layers = LAYERS
}
