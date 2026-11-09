import { Component, computed, signal, ViewEncapsulation } from '@angular/core'

type Evidence = 'screenshot' | 'clip' | 'assert' | 'baseline'

interface Claim {
  id: string
  label: string
  needs: Evidence[]
}

const CLAIMS: Claim[] = [
  { id: 'state', label: 'A new state renders (empty, error, loaded)', needs: ['screenshot'] },
  { id: 'options', label: 'Every option of a changed control works', needs: ['screenshot'] },
  { id: 'motion', label: 'A transition happens (hover, sort, open/close)', needs: ['clip'] },
  { id: 'values', label: 'The values on screen are correct', needs: ['assert'] },
  { id: 'console', label: 'No new console errors', needs: ['baseline'] },
]

const EVIDENCE: Record<Evidence, { name: string; proves: string; color: string }> = {
  screenshot: { name: 'Screenshot', proves: 'A state, with real data and real CSS', color: '#7c9cff' },
  clip: { name: 'Captioned clip', proves: 'The motion between states, in order', color: '#ff8a5c' },
  assert: { name: 'DOM / network check', proves: 'The exact values the user sees', color: '#5ad19a' },
  baseline: { name: 'Baseline compare', proves: 'An error is new, not pre-existing', color: '#e3b341' },
}

/** Pick the claims a UI change makes; see the cheapest evidence set that covers all of them. */
@Component({
  selector: 'blog-evidence-picker',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">What does your change claim?</span>
        <span class="muted">tick every claim in the review</span>
      </div>

      <div class="claims">
        @for (c of claims; track c.id) {
          <label class="claim" [class.on]="picked().has(c.id)">
            <input type="checkbox" [checked]="picked().has(c.id)" (change)="toggle(c.id)" />
            <span>{{ c.label }}</span>
          </label>
        }
      </div>

      <div class="out">
        <div class="muted">Evidence to post ({{ needed().length }})</div>
        @for (e of needed(); track e) {
          <div class="ev" [style.borderColor]="evidence[e].color">
            <b [style.color]="evidence[e].color">{{ evidence[e].name }}</b>
            <span class="muted">{{ evidence[e].proves }}</span>
          </div>
        } @empty {
          <div class="muted">Tick a claim. "Tests pass" alone is not on this list.</div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; text-align: left; color: #e6edf3;
        font: 16px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .card { background: #161b22; border: 1px solid #30363d; border-radius: 14px;
        padding: 20px; margin: 22px 0; display: grid; gap: 16px; }
      .header { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
      .title { font-size: 15px; font-weight: 700; }
      .muted { color: #9aa7b5; font-size: 13px; }
      .claims { display: grid; gap: 8px; }
      .claim { display: flex; gap: 10px; align-items: center; cursor: pointer; font-size: 14px;
        background: #0b0f16; border: 1px solid #30363d; border-radius: 8px; padding: 8px 12px; }
      .claim.on { border-color: #7c9cff; }
      .claim input { accent-color: #7c9cff; }
      .out { display: grid; gap: 8px; }
      .ev { display: grid; gap: 2px; border-left: 3px solid; padding: 4px 12px; background: #0b0f16;
        border-radius: 0 8px 8px 0; font-size: 14px; }
    `,
  ],
})
export class EvidencePickerComponent {
  readonly claims = CLAIMS
  readonly evidence = EVIDENCE
  readonly picked = signal(new Set<string>(['state', 'motion']))
  readonly needed = computed(() => {
    const set = new Set<Evidence>()
    for (const c of CLAIMS) if (this.picked().has(c.id)) c.needs.forEach((n) => set.add(n))
    return [...set]
  })

  toggle(id: string) {
    const next = new Set(this.picked())
    if (next.has(id)) next.delete(id)
    else next.add(id)
    this.picked.set(next)
  }
}
