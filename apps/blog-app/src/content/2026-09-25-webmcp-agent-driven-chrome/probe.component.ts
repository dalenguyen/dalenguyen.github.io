import { Component, computed, signal, ViewEncapsulation } from '@angular/core'

const METHODS = "['getTools', 'executeTool', 'registerTool']"

/**
 * The page-level probe. Three independent inputs - is the flag on the process,
 * which object this Chrome build exposes the API on, and whether the app
 * registers any tools - produce three different "it's broken" outputs.
 */
@Component({
  selector: 'blog-probe',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">What the page reports back</span>
        <span class="subtitle">evaluate_script</span>
      </div>

      <div class="switches">
        <button class="sw" [class.on]="flag()" (click)="flag.set(!flag())">
          <span class="dot"></span><span>flag on the process</span>
        </button>
        <button class="sw" [class.on]="modern()" (click)="modern.set(!modern())">
          <span class="dot"></span><span>{{ modern() ? 'newer build (document)' : 'older build (navigator)' }}</span>
        </button>
        <button class="sw" [class.on]="registers()" (click)="registers.set(!registers())">
          <span class="dot"></span><span>page registers tools</span>
        </button>
      </div>

      <div class="out">
        <div class="line"><span class="k">typeof document.modelContext</span><span class="v">{{ docType() }}</span></div>
        <div class="line"><span class="k">typeof navigator.modelContext</span><span class="v">{{ navType() }}</span></div>
        <div class="line"><span class="k">probe.where</span><span class="v">{{ where() }}</span></div>
        <div class="line"><span class="k">probe.methods</span><span class="v">{{ methods() }}</span></div>
        <div class="line"><span class="k">await mc.getTools()</span><span class="v">{{ tools() }}</span></div>
      </div>

      <p class="verdict" [class.ok]="ready()">
        <b>{{ label() }}</b> - {{ advice() }}
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
      .switches {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .sw {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 7px;
        white-space: nowrap;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 9px;
        color: #9aa7b5;
        font: inherit;
        font-size: 11.5px;
        font-weight: 600;
        padding: 7px 9px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .sw:hover {
        border-color: #4a5568;
      }
      .sw.on {
        background: #7c9cff1a;
        border-color: #7c9cff;
        color: #e6edf3;
      }
      .dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: #30363d;
        flex: none;
      }
      .sw.on .dot {
        background: #7c9cff;
      }
      .out {
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 10px;
        padding: 10px 12px;
        display: grid;
        gap: 4px;
      }
      .line {
        display: flex;
        align-items: baseline;
        gap: 10px;
        flex-wrap: wrap;
        font-family: ui-monospace, Menlo, Consolas, monospace;
        font-size: 11.5px;
      }
      .k {
        color: #9aa7b5;
      }
      .v {
        margin-left: auto;
        color: #7c9cff;
        text-align: right;
      }
      .verdict {
        margin: 0;
        font-size: 13.5px;
        color: #9aa7b5;
      }
      .verdict b {
        color: #ff8a5c;
      }
      .verdict.ok b {
        color: #5ad19a;
      }
    `,
  ],
})
export class ProbeComponent {
  readonly flag = signal(false)
  readonly modern = signal(true)
  readonly registers = signal(false)

  readonly docType = computed(() => (this.flag() && this.modern() ? "'object'" : "'undefined'"))
  readonly navType = computed(() => (this.flag() && !this.modern() ? "'object'" : "'undefined'"))
  readonly where = computed(() => (!this.flag() ? "'none'" : this.modern() ? "'document'" : "'navigator'"))
  readonly methods = computed(() => (this.flag() ? METHODS : 'null'))
  readonly tools = computed(() => (!this.flag() ? 'TypeError' : this.registers() ? '3 tools' : '[]'))

  readonly ready = computed(() => this.flag() && this.registers())

  readonly label = computed(() => {
    if (!this.flag()) return 'Not enabled'
    if (!this.registers()) return 'Enabled, not useful'
    return 'Ready'
  })

  readonly advice = computed(() => {
    if (!this.flag())
      return 'the feature is genuinely off on this browser. Check the running process arguments, not the config file.'
    if (!this.modern() && !this.registers())
      return 'the API is live on navigator, not document. A probe that only checks one name would call this "not supported" - and the empty list is the app, not the flag.'
    if (!this.registers())
      return 'the flag is plumbing and it worked. An empty list means the page has registered nothing yet; that is the app’s job.'
    if (!this.modern())
      return 'working, but the API is on navigator here. Probe both objects so a build change does not read as a broken setup.'
    return 'the API is on document and the page publishes tools. Call them, then verify the pixels separately.'
  })
}
