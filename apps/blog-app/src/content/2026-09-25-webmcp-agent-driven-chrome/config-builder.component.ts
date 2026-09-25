import { Component, computed, signal, ViewEncapsulation } from '@angular/core'

type Launch = 'launch' | 'attach'
type Scope = 'project' | 'user'

const FLAG = '--enable-features=WebMCP'

/**
 * Config builder. Pick how Claude Code gets its Chrome and where the server
 * config lives; the panel prints the exact file or command to copy, plus the
 * restart each choice needs.
 */
@Component({
  selector: 'blog-config-builder',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">Build your Claude Code config</span>
        <span class="subtitle">chrome-devtools-mcp</span>
      </div>

      <div class="field">
        <span class="muted">How Claude Code gets Chrome</span>
        <div class="toggle" role="group" aria-label="How Claude Code gets Chrome">
          <button class="tg" [class.on]="launch() === 'launch'" (click)="launch.set('launch')">
            the MCP launches it
          </button>
          <button class="tg" [class.on]="launch() === 'attach'" (click)="launch.set('attach')">
            attach to my debug Chrome
          </button>
        </div>
      </div>

      <div class="field">
        <span class="muted">Where the server is registered</span>
        <div class="toggle" role="group" aria-label="Where the server is registered">
          <button class="tg" [class.on]="scope() === 'project'" (click)="scope.set('project')">
            .mcp.json (this repo)
          </button>
          <button class="tg" [class.on]="scope() === 'user'" (click)="scope.set('user')">
            claude mcp add (all repos)
          </button>
        </div>
      </div>

      @for (b of blocks(); track b.label) {
        <div class="block">
          <span class="block-h">{{ b.label }}</span>
          <pre class="code">{{ b.code }}</pre>
        </div>
      }

      <p class="note"><b>Then restart:</b> {{ restart() }}</p>
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
        padding: 7px 10px;
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
      .block {
        display: grid;
        gap: 5px;
      }
      .block-h {
        font-size: 11.5px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: #9aa7b5;
      }
      .code {
        margin: 0;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 9px;
        padding: 10px 12px;
        font-family: ui-monospace, Menlo, Consolas, monospace;
        font-size: 11.5px;
        line-height: 1.7;
        color: #7c9cff;
        overflow-x: auto;
        white-space: pre;
      }
      .note {
        margin: 0;
        font-size: 13px;
        color: #9aa7b5;
      }
      .note b {
        color: #e6edf3;
      }
    `,
  ],
})
export class ConfigBuilderComponent {
  readonly launch = signal<Launch>('launch')
  readonly scope = signal<Scope>('project')

  readonly blocks = computed<{ label: string; code: string }[]>(() => {
    const attaching = this.launch() === 'attach'
    const args = attaching
      ? ['chrome-devtools-mcp@latest', '--browserUrl=http://127.0.0.1:9222']
      : ['chrome-devtools-mcp@latest', `--chromeArg=${FLAG}`]

    const server =
      this.scope() === 'project'
        ? {
            label: '.mcp.json',
            code:
              '{\n  "mcpServers": {\n    "chrome-devtools": {\n      "command": "npx",\n      "args": [\n        "-y",\n' +
              args.map((a) => `        "${a}"`).join(',\n') +
              '\n      ]\n    }\n  }\n}',
          }
        : {
            label: 'terminal',
            code: `claude mcp add chrome-devtools -s user \\\n  -- npx -y ${args.join(' ')}`,
          }

    if (!attaching) return [server]

    return [
      {
        label: 'start Chrome yourself (the flag goes here)',
        code: `chrome --remote-debugging-port=9222 \\\n  --user-data-dir="$HOME/.cache/agent-chrome" \\\n  ${FLAG}`,
      },
      server,
    ]
  })

  readonly restart = computed(() =>
    this.launch() === 'attach'
      ? 'Chrome, because feature flags are read only at launch - and then the Claude Code session, because MCP server arguments are read only when the session starts.'
      : 'the Claude Code session. MCP server arguments are read when the session starts, and the MCP launches Chrome fresh with them.',
  )
}
