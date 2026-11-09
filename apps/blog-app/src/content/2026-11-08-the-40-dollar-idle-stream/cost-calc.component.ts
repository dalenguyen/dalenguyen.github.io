import { Component, computed, signal, ViewEncapsulation } from '@angular/core'

const PRICE = 0.0000253 // $ per instance-second, 1 vCPU + 512 MiB
const STREAM_S = 301
const FLOOR_S = 112 // post-fix floor: real tool calls only, mean of Oct 9 – Nov 7
const MONTH_DAYS = 30
const WORST = 86_400 * MONTH_DAYS * PRICE // one instance pinned all month

interface Preset {
  label: string
  hours: number
}

/**
 * How much an idle SSE stream costs per month, as a function of how many
 * hours a day a client holds it open — and what the 405 fix does to that.
 */
@Component({
  selector: 'blog-cost-calc',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">What an idle stream costs</span>
        <span class="subtitle">1 vCPU · 512 MiB · $0.0000253 / instance-second</span>
      </div>

      <div class="row">
        <span class="muted">Hours a day a client holds the stream</span>
        <input type="range" min="0" max="24" step="0.5" [value]="hours()"
               aria-label="Hours a day a client holds the stream open"
               (input)="hours.set(+$any($event.target).value)" />
        <span class="readout">{{ hours() }} h</span>
      </div>

      <div class="presets">
        @for (p of presets; track p.label) {
          <button type="button" class="chip" [class.on]="hours() === p.hours" (click)="hours.set(p.hours)">
            {{ p.label }}
          </button>
        }
      </div>

      <div class="switch-row">
        <span class="muted">405 fix deployed</span>
        <button type="button" class="switch" role="switch" [class.on]="fixed()"
                [attr.aria-checked]="fixed()" aria-label="Toggle the 405 fix" (click)="toggleFix()">
          <span class="knob"></span>
        </button>
        <span class="switch-label">{{ fixed() ? 'Yes' : 'No' }}</span>
      </div>

      <div class="stats">
        <div class="stat"><span class="k">{{ fixed() ? '405s a day' : 'Reconnects a day' }}</span><span class="v">{{ reconnects() }}</span></div>
        <div class="stat"><span class="k">Billed per day</span><span class="v">{{ perDayLabel() }}</span></div>
        <div class="stat"><span class="k">Per month</span><span class="v" [class.bad]="!fixed() && hours() > 0" [class.good]="fixed()">{{ monthLabel() }}</span></div>
      </div>

      <div class="bar-track" aria-hidden="true">
        <div class="bar-fill" [class.good]="fixed()" [style.width.%]="pct()"></div>
      </div>
      <div class="scale"><span>$0</span><span>{{ worstLabel }} — one instance pinned all month</span></div>

      <p class="note">{{ note() }}</p>
    </div>
  `,
  styles: [
    `
      :host { display: block; text-align: left; color: #e6edf3;
        font: 16px/1.6 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .card { background: #161b22; border: 1px solid #30363d; border-radius: 14px;
        padding: 20px; margin: 22px 0; display: grid; gap: 14px; }
      .header { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
      .title { font-size: 15px; font-weight: 700; }
      .subtitle, .muted { color: #9aa7b5; font-size: 13px; }
      .row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
      input[type='range'] { flex: 1; min-width: 180px; accent-color: #7c9cff; height: 5px; }
      .readout { font-weight: 700; font-variant-numeric: tabular-nums; color: #7c9cff; min-width: 3.5em; }
      .presets { display: flex; flex-wrap: wrap; gap: 6px; }
      .chip { appearance: none; border: 1px solid #30363d; background: #0b0f16; color: #9aa7b5;
        font: inherit; font-size: 12px; padding: 4px 10px; border-radius: 999px; cursor: pointer;
        white-space: nowrap; }
      .chip.on { border-color: #7c9cff; color: #e6edf3; }
      .switch-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
      .switch { appearance: none; border: 1px solid #30363d; background: #0b0f16; width: 44px; height: 24px;
        border-radius: 999px; padding: 2px; cursor: pointer; flex-shrink: 0;
        transition: background 0.15s ease, border-color 0.15s ease; }
      .switch .knob { display: block; width: 18px; height: 18px; border-radius: 50%; background: #9aa7b5;
        transition: transform 0.15s ease, background 0.15s ease; }
      .switch.on { background: #163524; border-color: #5ad19a; }
      .switch.on .knob { transform: translateX(20px); background: #5ad19a; }
      .switch-label { font-weight: 700; color: #7c9cff; min-width: 1.5em; }
      .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; }
      .stat { background: #0b0f16; border: 1px solid #30363d; border-radius: 8px; padding: 8px 10px;
        display: grid; gap: 2px; }
      .k { font-size: 11.5px; color: #9aa7b5; }
      .v { font-size: 17px; font-weight: 700; font-variant-numeric: tabular-nums; }
      .bad { color: #ff8a5c; }
      .good { color: #5ad19a; }
      .bar-track { background: #0b0f16; border: 1px solid #30363d; border-radius: 8px; height: 22px; overflow: hidden; }
      .bar-fill { height: 100%; border-radius: 7px; background: #ff8a5c; transition: width 0.2s ease, background 0.2s ease;
        min-width: 3px; }
      .bar-fill.good { background: #5ad19a; }
      .scale { display: flex; justify-content: space-between; gap: 10px; font-size: 11.5px; color: #9aa7b5; margin-top: -8px; }
      .note { margin: 0; color: #9aa7b5; font-size: 13px; }
    `,
  ],
})
export class CostCalcComponent {
  readonly hours = signal(21.5)
  readonly fixed = signal(false)
  readonly worstLabel = '$' + WORST.toFixed(0)

  readonly presets: Preset[] = [
    { label: 'Quiet day', hours: 0 },
    { label: 'Workday', hours: 8 },
    { label: 'September session day', hours: 21.5 },
    { label: 'Never disconnects', hours: 24 },
  ]

  readonly reconnects = computed(() => Math.floor((this.hours() * 3600) / STREAM_S).toLocaleString('en-US'))

  readonly perDay = computed(() => (this.fixed() ? FLOOR_S : Math.max(this.hours() * 3600, FLOOR_S)))
  readonly month = computed(() => this.perDay() * MONTH_DAYS * PRICE)
  readonly pct = computed(() => (this.month() / WORST) * 100)

  readonly perDayLabel = computed(() => Math.round(this.perDay()).toLocaleString('en-US') + ' s')
  readonly monthLabel = computed(() => '$' + this.month().toFixed(2))

  toggleFix(): void {
    this.fixed.update((v) => !v)
  }

  readonly note = computed(() => {
    if (this.fixed()) {
      return 'With the fix, each GET is refused in about 3 ms. However long the client stays connected, the bill sits at the floor of real tool calls — under ten cents a month.'
    }
    if (this.hours() === 0) {
      return 'No session connected, no stream: the floor of real tool calls, under ten cents a month. This is what nine of September’s days looked like.'
    }
    return 'Every hour a client holds the stream is an hour of billed instance time, whether or not a single tool call happens.'
  })
}
