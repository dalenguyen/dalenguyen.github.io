import { Component, computed, signal, ViewEncapsulation } from '@angular/core'

interface Quirk {
  key: string
  label: string
  raw: string
  fixed: string
  note: string
  // true → provider-enforced schema (tier 3) makes this coercion dead code.
  strictKills: boolean
}

const QUIRKS: Quirk[] = [
  {
    key: 'flatten',
    label: 'Flattened to string',
    raw: `{
  "code_quality": "{\\"score\\": 8, \\"notes\\": \\"clean split\\"}"
}`,
    fixed: `{
  "code_quality": { "score": 8, "notes": "clean split" }
}`,
    note: 'The value is a string that contains JSON. Detect the str, json.loads it, re-attach the parsed object.',
    strictKills: true,
  },
  {
    key: 'array',
    label: 'Array, not object',
    raw: `[
  { "code_quality": { "score": 8 } },
  { "security":     { "score": 6 } }
]`,
    fixed: `{
  "code_quality": { "score": 8 },
  "security":     { "score": 6 }
}`,
    note: 'Got a list of single-key dicts instead of one object. Merge the entries back into a single dict.',
    strictKills: true,
  },
  {
    key: 'placeholder',
    label: 'Placeholder-key wrap',
    raw: `{
  "$PARAMETER_NAME": {
    "code_quality": { "score": 8 },
    "security":     { "score": 6 }
  }
}`,
    fixed: `{
  "code_quality": { "score": 8 },
  "security":     { "score": 6 }
}`,
    note: 'Exactly one top-level key and it is a known placeholder token — unwrap it. This one only ever appeared after a model-version upgrade.',
    strictKills: true,
  },
  {
    key: 'bare',
    label: 'Bare string',
    raw: `{
  "code_quality": "8/10, clean separation of concerns"
}`,
    fixed: `{
  "code_quality": {
    "score": null,
    "notes": "8/10, clean separation of concerns"
  }
}`,
    note: 'Expected an object, got a bare string. Wrap it into the shape you asked for, putting the text in the free-text field.',
    strictKills: true,
  },
  {
    key: 'dropped',
    label: 'Dropped fields',
    raw: `{
  "code_quality": { "score": 8 }
  // "security" and "summary" simply gone
}`,
    fixed: `{
  "code_quality": { "score": 8 },
  "security": null,
  "summary": null   // filled + logged, not silently absent
}`,
    note: 'Fill known-required keys with explicit nulls so consumers do not KeyError — and log every drop. A schema with required fields helps, but partial truncated responses still slip through.',
    strictKills: false,
  },
]

/**
 * Interactive gallery of the five ways a forced tool call gets mangled. Pick a
 * quirk to see the raw payload the provider actually returned beside what a
 * sanitize pass coerces it to — and whether schema enforcement kills the
 * coercion outright.
 */
@Component({
  selector: 'blog-shape-normalizer',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">"Structured" output is untrusted input</span>
        <span class="subtitle">forced tool call · 5 real mangles</span>
      </div>

      <div class="tabs">
        @for (q of quirks; track q.key; let i = $index) {
          <button class="tab" [class.active]="i === idx()" (click)="idx.set(i)">
            {{ q.label }}
          </button>
        }
      </div>

      <div class="panes">
        <div class="pane">
          <span class="pane-tag bad">raw · what came back</span>
          <pre class="code">{{ quirk().raw }}</pre>
        </div>
        <div class="arrow">→</div>
        <div class="pane">
          <span class="pane-tag good">sanitized · what consumers see</span>
          <pre class="code">{{ quirk().fixed }}</pre>
        </div>
      </div>

      <p class="note">{{ quirk().note }}</p>

      <p class="verdict" [class.killed]="quirk().strictKills">
        <span class="chip">{{ quirk().strictKills ? 'strict mode kills this' : 'guard still needed' }}</span>
        {{ quirk().strictKills
          ? 'Provider-enforced schema makes this coercion dead code.'
          : 'Even with strict schemas, keep this one — refusals and truncation still yield partial data.' }}
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
      .tabs {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .tab {
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 6px 11px;
        cursor: pointer;
        color: #9aa7b5;
        font: inherit;
        font-size: 12.5px;
        font-weight: 600;
        transition: all 0.15s;
      }
      .tab:hover {
        border-color: #4a5568;
      }
      .tab.active {
        border-color: #7c9cff;
        color: #e6edf3;
        background: #7c9cff1a;
      }
      .panes {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: stretch;
        gap: 12px;
      }
      @media (max-width: 620px) {
        .panes {
          grid-template-columns: 1fr;
        }
        .arrow {
          transform: rotate(90deg);
        }
      }
      .pane {
        display: flex;
        flex-direction: column;
        gap: 7px;
        min-width: 0;
      }
      .pane-tag {
        font-size: 10.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        border-radius: 5px;
        padding: 2px 7px;
        align-self: flex-start;
      }
      .pane-tag.bad {
        background: #f8514926;
        color: #ff8a80;
      }
      .pane-tag.good {
        background: #2ea04326;
        color: #5ad19a;
      }
      .arrow {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #7c9cff;
        font-size: 20px;
        font-weight: 700;
      }
      .code {
        flex: 1;
        background: #0b0f16;
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 12px;
        margin: 0;
        font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
        font-size: 12px;
        line-height: 1.55;
        color: #cdd6e0;
        white-space: pre;
        overflow-x: auto;
      }
      .note {
        margin: 0;
        font-size: 13.5px;
        color: #9aa7b5;
      }
      .verdict {
        margin: 0;
        font-size: 13px;
        color: #cdd6e0;
        display: flex;
        align-items: baseline;
        gap: 9px;
        flex-wrap: wrap;
      }
      .chip {
        font-size: 10.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        border-radius: 5px;
        padding: 2px 8px;
        background: #7c9cff26;
        color: #a9bcff;
        white-space: nowrap;
      }
      .verdict.killed .chip {
        background: #2ea04326;
        color: #5ad19a;
      }
    `,
  ],
})
export class ShapeNormalizerComponent {
  readonly quirks = QUIRKS
  readonly idx = signal(0)
  readonly quirk = computed(() => this.quirks[this.idx()])
}
