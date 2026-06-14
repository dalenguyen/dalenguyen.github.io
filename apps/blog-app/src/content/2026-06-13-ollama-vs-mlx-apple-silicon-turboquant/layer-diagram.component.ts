import { Component, ViewEncapsulation } from '@angular/core'

const LAYER_COUNT = 40
const FULL_INTERVAL = 4 // every 4th layer is full attention

interface Layer {
  n: number
  full: boolean
  title: string
}

function buildLayers(): Layer[] {
  const layers: Layer[] = []
  for (let i = 0; i < LAYER_COUNT; i++) {
    const full = (i + 1) % FULL_INTERVAL === 0
    layers.push({
      n: i + 1,
      full,
      title: `Layer ${i + 1}: ${full ? 'FULL attention — KV cache' : 'linear attention — constant state'}`,
    })
  }
  return layers
}

/**
 * The 40-layer hybrid-attention diagram: every 4th layer is a full-attention
 * layer that carries a growing KV cache; the rest use a small fixed state.
 * Ported from the standalone visualization.
 */
@Component({
  selector: 'qwen-layer-diagram',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="legend">
        <span><i class="sw full"></i> Full layer — keeps growing memory (KV cache)</span>
        <span><i class="sw lin"></i> Light layer — small fixed memory</span>
      </div>
      <div class="layers">
        @for (l of layers; track l.n) {
          <div class="ly" [class.full]="l.full" [class.lin]="!l.full" [attr.title]="l.title">{{ l.n }}</div>
        }
      </div>
      <p class="caption">
        Each square is a layer. <b>{{ fullCount }}</b> of {{ total }} (the blue ones) keep a growing memory. The other
        {{ total - fullCount }} use a small fixed memory no matter how long your prompt gets.
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
      }
      .legend {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        font-size: 13px;
        color: #9aa7b5;
        margin-bottom: 14px;
      }
      .legend span {
        display: inline-flex;
        align-items: center;
        gap: 7px;
      }
      .sw {
        width: 13px;
        height: 13px;
        border-radius: 3px;
        display: inline-block;
      }
      .sw.full {
        background: linear-gradient(135deg, #7c9cff, #5b7cff);
      }
      .sw.lin {
        background: #1f2733;
        border: 1px solid #30363d;
      }
      .layers {
        display: grid;
        grid-template-columns: repeat(20, 1fr);
        gap: 4px;
      }
      @media (max-width: 640px) {
        .layers {
          grid-template-columns: repeat(10, 1fr);
        }
      }
      .ly {
        aspect-ratio: 1;
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 700;
        cursor: default;
      }
      .ly.full {
        background: linear-gradient(135deg, #7c9cff, #5b7cff);
        color: #08111f;
      }
      .ly.lin {
        background: #1f2733;
        color: #6e7b8a;
        border: 1px solid #30363d;
      }
      .ly:hover {
        outline: 2px solid #e6edf3;
      }
      .caption {
        color: #9aa7b5;
        font-size: 13.5px;
        margin: 14px 0 0;
      }
      .caption b {
        color: #e6edf3;
      }
    `,
  ],
})
export class LayerDiagramComponent {
  readonly layers = buildLayers()
  readonly total = LAYER_COUNT
  readonly fullCount = this.layers.filter((l) => l.full).length
}
