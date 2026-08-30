import { Component, computed, signal, ViewEncapsulation } from '@angular/core'

const AFFECTED: string[] = ['agents-create', 'agents-review', 'agents-resolve', 'agents-plan', 'agents-learn']

/**
 * Toggles whether `implicitDependencies` is declared and shows what
 * `nx show projects --affected` returns for the same file change either way.
 */
@Component({
  selector: 'blog-affected-toggle',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">Does affected see this dependency?</span>
        <span class="subtitle">packages/py_shared/llm.py changed</span>
      </div>

      <div class="switch-row">
        <span class="muted">implicitDependencies declared in each project.json</span>
        <button
          type="button"
          class="switch"
          role="switch"
          [class.on]="declared()"
          [attr.aria-checked]="declared()"
          aria-label="Toggle whether implicitDependencies is declared"
          (click)="toggle()"
        >
          <span class="knob"></span>
        </button>
        <span class="switch-label">{{ declared() ? 'Yes' : 'No' }}</span>
      </div>

      <div class="terminal">
        <div class="cmd">$ nx show projects --affected --files=packages/py_shared/llm.py -t deploy</div>
        <div class="out" [class.bad]="!declared()" [class.good]="declared()">{{ output() }}</div>
      </div>

      <p class="note" [class.bad]="!declared()" [class.good]="declared()">
        {{
          declared()
            ? '5 of 5 consumers marked affected — the fix ships to every service that uses it.'
            : '0 of 5 consumers marked affected — the fix silently never deploys.'
        }}
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
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      }
      .switch-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .muted {
        color: #9aa7b5;
        font-size: 14px;
      }
      .switch {
        appearance: none;
        border: 1px solid #30363d;
        background: #0b0f16;
        width: 44px;
        height: 24px;
        border-radius: 999px;
        padding: 2px;
        cursor: pointer;
        flex-shrink: 0;
        transition: background 0.15s ease, border-color 0.15s ease;
      }
      .switch .knob {
        display: block;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #9aa7b5;
        transition: transform 0.15s ease, background 0.15s ease;
      }
      .switch.on {
        background: #163524;
        border-color: #5ad19a;
      }
      .switch.on .knob {
        transform: translateX(20px);
        background: #5ad19a;
      }
      .switch-label {
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        color: #7c9cff;
        min-width: 1.5em;
      }
      .terminal {
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 12px 14px;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 13px;
        overflow-x: auto;
      }
      .cmd {
        color: #9aa7b5;
        white-space: nowrap;
      }
      .out {
        margin-top: 6px;
        font-weight: 700;
        white-space: normal;
        word-break: break-word;
      }
      .out.bad {
        color: #ff8a5c;
      }
      .out.good {
        color: #5ad19a;
      }
      .note {
        margin: 0;
        font-size: 13px;
        color: #9aa7b5;
      }
      .note.bad {
        color: #ff8a5c;
      }
      .note.good {
        color: #5ad19a;
      }
    `,
  ],
})
export class AffectedToggleComponent {
  readonly declared = signal(false)
  readonly output = computed(() => (this.declared() ? JSON.stringify(AFFECTED) : '[]'))

  toggle(): void {
    this.declared.update((v) => !v)
  }
}
