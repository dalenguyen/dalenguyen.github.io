import { Component, computed, signal, ViewEncapsulation } from '@angular/core'

type Mode = 'launches' | 'attaches'
type Place = 'flags' | 'chromeArg' | 'debugLaunch'

const MODES: { key: Mode; label: string; hint: string }[] = [
  { key: 'launches', label: 'MCP launches Chrome', hint: 'chrome-devtools-mcp starts its own browser, in its own profile' },
  { key: 'attaches', label: 'MCP attaches over --browserUrl', hint: 'you start a debug Chrome; the MCP connects to it' },
]

const PLACES: { key: Place; label: string; where: string }[] = [
  { key: 'flags', label: 'chrome://flags', where: 'your everyday Chrome profile' },
  { key: 'chromeArg', label: '--chromeArg', where: 'the MCP server command line' },
  { key: 'debugLaunch', label: 'debug Chrome args', where: 'your own chrome --remote-debugging-port command' },
]

/**
 * Where does the WebMCP flag actually land? Pick how the agent gets its browser
 * and where you put the flag; the panel shows which of the two Chromes ends up
 * with it and what `ps` reports on the running process.
 */
@Component({
  selector: 'blog-browser-target',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">Which Chrome gets the flag?</span>
        <span class="subtitle">--enable-features=WebMCP</span>
      </div>

      <div class="field">
        <span class="muted">How the agent gets its browser</span>
        <div class="toggle" role="group" aria-label="How the agent gets its browser">
          @for (m of modes; track m.key) {
            <button class="tg" [class.on]="mode() === m.key" (click)="mode.set(m.key)">{{ m.label }}</button>
          }
        </div>
      </div>

      <div class="field">
        <span class="muted">Where you put the flag</span>
        <div class="toggle" role="group" aria-label="Where you put the flag">
          @for (p of places; track p.key) {
            <button class="tg" [class.on]="place() === p.key" (click)="place.set(p.key)">{{ p.label }}</button>
          }
        </div>
      </div>

      <label class="check">
        <input type="checkbox" [checked]="restarted()" (change)="restarted.set($any($event.target).checked)" />
        <span>Browser (and agent session) restarted since the change</span>
      </label>

      <div class="panes">
        <div class="pane">
          <span class="pane-h">your everyday Chrome</span>
          <span class="chip" [class.on]="yoursHasFlag()">{{ yoursHasFlag() ? 'flag on' : 'no flag' }}</span>
          <span class="pane-n">the agent never touches this profile</span>
        </div>
        <div class="arrow">agent →</div>
        <div class="pane" [class.good]="agentHasFlag()">
          <span class="pane-h">the agent's Chrome</span>
          <span class="chip" [class.on]="agentHasFlag()">{{ agentHasFlag() ? 'flag on' : 'no flag' }}</span>
          <span class="pane-n">{{ modeHint() }}</span>
        </div>
      </div>

      <code class="ps">$ ps -axo command | grep -o -- "--enable-features=[^ ]*"<br />{{ psOut() }}</code>

      <p class="verdict" [class.bad]="!agentHasFlag()">{{ verdict() }}</p>
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
      .field {
        display: grid;
        gap: 6px;
      }
      .muted {
        color: #9aa7b5;
        font-size: 13px;
      }
      .toggle {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .tg {
        flex: 1 1 auto;
        min-width: 0;
        white-space: nowrap;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 9px;
        color: #9aa7b5;
        font: inherit;
        font-size: 12px;
        font-weight: 600;
        padding: 7px 9px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .tg:hover {
        border-color: #4a5568;
      }
      .tg.on {
        background: #7c9cff1a;
        border-color: #7c9cff;
        color: #e6edf3;
      }
      .check {
        display: flex;
        align-items: center;
        gap: 9px;
        font-size: 13px;
        color: #9aa7b5;
        cursor: pointer;
      }
      .check input {
        accent-color: #7c9cff;
        width: 15px;
        height: 15px;
      }
      .panes {
        display: flex;
        align-items: stretch;
        gap: 8px;
        flex-wrap: wrap;
      }
      .pane {
        flex: 1 1 200px;
        min-width: 0;
        display: grid;
        gap: 5px;
        justify-items: start;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 10px;
        padding: 10px 12px;
      }
      .pane.good {
        border-color: #5ad19a;
      }
      .pane-h {
        font-size: 12.5px;
        font-weight: 700;
      }
      .pane-n {
        font-size: 11.5px;
        color: #9aa7b5;
      }
      .arrow {
        align-self: center;
        font-size: 11px;
        color: #9aa7b5;
        white-space: nowrap;
      }
      .chip {
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: #ff8a5c;
        background: #ff8a5c26;
        border-radius: 6px;
        padding: 2px 7px;
      }
      .chip.on {
        color: #5ad19a;
        background: #2ea04326;
      }
      .ps {
        display: block;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 9px;
        padding: 10px 12px;
        font-family: ui-monospace, Menlo, Consolas, monospace;
        font-size: 11.5px;
        line-height: 1.8;
        color: #7c9cff;
        overflow-x: auto;
      }
      .verdict {
        margin: 0;
        font-size: 13.5px;
        color: #9aa7b5;
      }
      .verdict.bad {
        color: #ff8a5c;
      }
    `,
  ],
})
export class BrowserTargetComponent {
  readonly modes = MODES
  readonly places = PLACES
  readonly mode = signal<Mode>('launches')
  readonly place = signal<Place>('flags')
  readonly restarted = signal(true)

  readonly modeHint = computed(() => MODES.find((m) => m.key === this.mode())?.hint ?? '')
  readonly yoursHasFlag = computed(() => this.place() === 'flags')

  readonly agentHasFlag = computed(() => {
    if (!this.restarted()) return false
    if (this.mode() === 'launches') return this.place() === 'chromeArg'
    return this.place() === 'debugLaunch'
  })

  readonly psOut = computed(() => (this.agentHasFlag() ? '--enable-features=WebMCP' : '(no output)'))

  readonly verdict = computed(() => {
    if (this.agentHasFlag()) return 'The flag is on the browser the agent drives. Probe the page next.'
    if (!this.restarted())
      return 'Flags are read at launch. The browser is still running with its old arguments - force-stop it and start it again.'
    if (this.place() === 'flags')
      return 'chrome://flags changes your own profile. The agent runs a different profile and never sees it.'
    if (this.mode() === 'launches')
      return 'The MCP launches its own Chrome, so a debug Chrome you started separately is not the one it drives. Pass --chromeArg instead.'
    return 'The MCP is attaching, not launching, so --chromeArg is ignored. The flag belongs on your debug Chrome command.'
  })
}
