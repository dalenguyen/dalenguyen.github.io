import {
  Component,
  OnDestroy,
  computed,
  signal,
  ViewEncapsulation,
} from '@angular/core'

/**
 * The five stages a customer message travels through LogiChat's doc-RAG
 * pipeline. Each step has a short title, the active service(s), the payload
 * that crosses the boundary, and a one-line explanation of the move.
 */
interface FlowStep {
  /** Stage label shown in the stepper pill */
  stage: string
  /** Title drawn above the data preview */
  title: string
  /** Which LogiChat service / GCP product is active at this stage */
  actors: string[]
  /** Badge in the data preview header */
  payloadLabel: string
  /** Body of the data preview. Inline `<b>` tags allowed; everything else escaped. */
  payload: string
  /** One-line explanation of what just happened */
  caption: string
}

const STEPS: FlowStep[] = [
  {
    stage: 'Upload',
    title: '1 · Customer uploads a PDF',
    actors: ['dashboard (browser)', 'apps/api', 'Google Cloud Storage'],
    payloadLabel: 'POST /v1/documents → signed URL',
    payload:
      'Request body: <b>{ filename, sizeBytes, contentType }</b>\n\nResponse: <b>{ uploadUrl, objectPath }</b>\n\nThe browser then PUTs the bytes straight to GCS using <i>uploadUrl</i>. ' +
      'apps/api never sees the file body — only its metadata.',
    caption:
      'The gateway returns a signed URL; the browser uploads directly to GCS so apps/api stays small.',
  },
  {
    stage: 'Process',
    title: '2 · doc-processor chunks + embeds',
    actors: ['apps/subscribers/doc-processor', 'Vertex AI text-embedding-005', 'Firestore'],
    payloadLabel: 'gcs.finalized event → chunk write',
    payload:
      'Trigger: <b>{ bucket, name, size }</b>\n\nParse PDF → ~256-token chunks (overlap 32)\nEmbed each chunk with <b>text-embedding-005</b> → 768-dim vector\n\nWrite to Firestore:\n' +
      '<b>logichat-apps/{appId}/chunks/{chunkId}</b>\n  text, vector[768], sourceDocId, ordinal',
    caption:
      'A background subscriber parses the PDF, chunks it, embeds each chunk, and writes to a Firestore KNN index keyed on appId.',
  },
  {
    stage: 'Retrieve',
    title: '3 · Pre-model vector search',
    actors: ['apps/api (gateway)', 'apps/agent', 'Firestore KNN'],
    payloadLabel: 'POST /v1/agent-run → k-NN results',
    payload:
      'Gateway mints a Cloud Run ID token, then calls the agent:\n\n' +
      '<b>POST /run</b>  Authorization: Bearer <i>&lt;service identity&gt;</i>\n' +
      'Body: { appId, sessionId, userMessage }\n\n' +
      'Agent embeds the query, runs <b>findNearestNeighbor</b> against the\n' +
      '768-dim KNN index, returns the top-k=6 chunks.',
    caption:
      'Retrieval happens BEFORE the ADK Runner sees the prompt — the LLM only ever gets the top-k chunks, not the whole corpus.',
  },
  {
    stage: 'Ground',
    title: '4 · Prompt is grounded with [doc:…] markers',
    actors: ['apps/agent (sanitiser)'],
    payloadLabel: 'Sanitised prompt sent to Gemini',
    payload:
      'For each chunk:\n  • strip markdown headers (avoids the FAQ-widget leak)\n  • keep inline [doc:abc123] markers for citation\n  • cap total context to ~3,000 tokens\n\n' +
      'System prompt sets the persona + a hard rule:\n' +
      '<b>"Cite using [doc:&lt;id&gt;] markers. Never invent."</b>\n\n' +
      'Top-6 chunks inlined verbatim under a <b>CONTEXT</b> section, then\nthe user message appended.',
    caption:
      'Markdown headers are stripped — the only way a leaked marker could appear in the widget was if a chunk itself contained one.',
  },
  {
    stage: 'Answer',
    title: '5 · ADK Agent → Gemini 2.5 Flash → user',
    actors: ['apps/agent (ADK Runner)', 'Vertex AI (Gemini 2.5 Flash)', 'apps/api → dashboard'],
    payloadLabel: 'Streamed chunks → final answer',
    payload:
      'google.adk.agents.Agent(model="gemini-2.5-flash", …)\n  ↓\n' +
      'google.adk.runners.InMemoryRunner.run()\n  ↓\n' +
      'Vertex AI streams token deltas via google-genai\n  ↓\n' +
      'Agent service returns { answer, citations[] } to apps/api\n  ↓\n' +
      'Dashboard renders the answer and turns each [doc:abc123]\nmarker into a hover-cited footnote.',
    caption:
      'The Agent returns the answer plus the cited [doc:…] markers; the dashboard turns each marker into a hover footnote.',
  },
]

/**
 * Step-through diagram of LogiChat's end-to-end doc-RAG pipeline. Lets the
 * reader advance one stage at a time (Prev / Next / Play) and watch which
 * service is active, what payload crosses the boundary, and a one-line
 * explanation of why that hop exists.
 */
@Component({
  selector: 'blog-doc-rag-flow',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">End-to-end pipeline · click through the five stages</span>
        <span class="counter">Stage {{ idx() + 1 }} / {{ steps.length }}</span>
      </div>

      <div class="stepper">
        @for (s of steps; track s.stage; let i = $index) {
          <button
            class="seg"
            [class.active]="i === idx()"
            [class.done]="i < idx()"
            (click)="go(i)"
            [attr.aria-current]="i === idx() ? 'step' : null"
          >
            <span class="dot">{{ i + 1 }}</span>
            <span class="seg-label">{{ s.stage }}</span>
          </button>
        }
      </div>

      <div class="body">
        <div class="panel">
          <p class="panel-title">{{ step().title }}</p>
          <div class="actors">
            @for (a of step().actors; track a) {
              <span class="actor">{{ a }}</span>
            }
          </div>
          <div class="payload">
            <span class="payload-label">{{ step().payloadLabel }}</span>
            <pre class="payload-body" [innerHTML]="step().payload"></pre>
          </div>
          <p class="caption">{{ step().caption }}</p>
        </div>

        <div class="track" aria-hidden="true">
          <div class="line"></div>
          @for (s of steps; track s.stage; let i = $index) {
            <div
              class="node"
              [class.reached]="i <= idx()"
              [class.current]="i === idx()"
              [style.top.%]="(i * 100) / (steps.length - 1)"
            >
              <span class="node-dot"></span>
              <span class="node-label">{{ s.stage }}</span>
            </div>
          }
        </div>
      </div>

      <div class="controls">
        <button class="btn" (click)="prev()" [disabled]="idx() === 0">‹ Prev</button>
        <button class="btn play" (click)="togglePlay()">
          {{ playing() ? '❚❚ Pause' : '▶ Play' }}
        </button>
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
        grid-template-columns: 1fr 160px;
        gap: 16px;
      }
      @media (max-width: 640px) {
        .body {
          grid-template-columns: 1fr;
        }
        .track {
          display: none;
        }
      }
      .panel .panel-title {
        margin: 0 0 8px;
        font-size: 14px;
        font-weight: 700;
        color: #7c9cff;
      }
      .actors {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin: 0 0 12px;
      }
      .actor {
        font-size: 11.5px;
        font-weight: 600;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 999px;
        padding: 3px 9px;
        color: #cdd6e0;
        font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
      }
      .payload {
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 10px 12px;
        margin: 0 0 10px;
      }
      .payload-label {
        display: block;
        font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
        font-size: 11px;
        font-weight: 700;
        color: #9aa7b5;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        margin-bottom: 6px;
      }
      .payload-body {
        font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
        font-size: 12px;
        line-height: 1.55;
        color: #cdd6e0;
        white-space: pre-wrap;
        word-break: break-word;
        margin: 0;
      }
      .payload-body b {
        color: #ffcb8a;
        font-weight: 600;
      }
      .payload-body i {
        color: #9aa7b5;
        font-style: italic;
      }
      .caption {
        margin: 0;
        font-size: 13.5px;
        color: #9aa7b5;
      }
      .track {
        position: relative;
        background: #0b0f16;
        border: 1px dashed #30363d;
        border-radius: 10px;
        min-height: 360px;
        padding: 0;
      }
      .line {
        position: absolute;
        left: 22px;
        top: 10px;
        bottom: 10px;
        width: 2px;
        background: #30363d;
      }
      .node {
        position: absolute;
        left: 0;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding-left: 12px;
        transition: all 0.25s ease;
      }
      .node-dot {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #21262d;
        border: 2px solid #30363d;
        flex-shrink: 0;
        transition: all 0.25s ease;
        z-index: 1;
      }
      .node-label {
        font-size: 11.5px;
        font-weight: 600;
        color: #6b7686;
        font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
        transition: color 0.25s ease;
      }
      .node.reached .node-dot {
        background: #5ad19a;
        border-color: #5ad19a;
        box-shadow: 0 0 0 4px #2ea04322;
      }
      .node.reached .node-label {
        color: #cdd6e0;
      }
      .node.current .node-dot {
        background: #7c9cff;
        border-color: #7c9cff;
        box-shadow: 0 0 0 4px #7c9cff33;
        transform: scale(1.15);
      }
      .node.current .node-label {
        color: #7c9cff;
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
export class DocRagFlowComponent implements OnDestroy {
  readonly steps = STEPS
  readonly idx = signal(0)
  readonly playing = signal(false)
  readonly step = computed(() => this.steps[this.idx()])

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