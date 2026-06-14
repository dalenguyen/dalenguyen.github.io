# Component templates

Copy-paste skeletons for interactive blog widgets. Adapt names and contents; keep the
ShadowDom encapsulation and the dark "figure card" palette. Place every file in the post's
co-located folder: `apps/blog-app/src/content/<slug>/`.

Relative import paths below assume that folder depth (`../../app/blog/...`).

## 1. Placeholder (in the `.md`)

```html
<div data-chart="my-key">Short fallback caption for no-JS readers. Enable JavaScript to view.</div>
```

The `data-chart` value is the key looked up in `charts.ts`. Use as many as needed per post.

## 2. Manifest — `charts.ts`

```ts
// Auto-discovered by mount-charts.ts via import.meta.glob('/src/content/*/charts.ts').
import { BarChartComponent } from '../../app/blog/charts/bar-chart.component'
import { ChartManifest } from '../../app/blog/charts/mount-charts'
import { myBarsConfig } from './my-bars.data'
import { MyWidgetComponent } from './my-widget.component'

const manifest: ChartManifest = {
  'my-bars': { component: BarChartComponent, inputs: { config: myBarsConfig } },
  'my-key': { component: MyWidgetComponent },
}

export default manifest
```

## 3. Bar chart data — `*.data.ts` (reusing the shared BarChartComponent)

`BarChartConfig` / `BarMetric` live in `src/app/blog/charts/chart.types.ts`. Each metric is
either `series` (grouped) OR `single` + `colors`. With more than one metric, a toggle appears.

```ts
import { BarChartConfig } from '../../app/blog/charts/chart.types'

// Single-series (simplest):
export const myBarsConfig: BarChartConfig = {
  labels: ['Analog', 'Next.js', 'SvelteKit'],
  legend: [{ name: 'Median render (ms)', color: '#7c9cff' }],
  metrics: [
    {
      key: 'render',
      buttonLabel: 'Median render (ms)',
      single: [12, 24, 18],
      colors: ['#7c9cff', '#ff8a5c', '#5ad19a'],
      note: 'Illustrative median render time (ms) — lower is faster. <b>Hover a bar.</b>',
      valLabel: (v) => String(v),
      yLabel: (v) => String(v),
      tip: (v) => v + ' ms',
    },
  ],
}

// Grouped series (two bars per label) — replace the metric above with:
//   series: [
//     { name: 'MLX', color: '#7c9cff', vals: [80, 77, 70] },
//     { name: 'Ollama', color: '#ff8a5c', vals: [52, 52, 48] },
//   ],
// and omit single/colors. Add a second metric object to get a toggle.
```

## 4. Bespoke component skeleton — `my-widget.component.ts`

Standalone, ShadowDom, signal-based. Self-styled with the dark palette. Clean up any timers
in `ngOnDestroy`.

```ts
import { Component, computed, signal, ViewEncapsulation } from '@angular/core'

@Component({
  selector: 'blog-my-widget',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="card">
      <div class="header">
        <span class="title">Widget title</span>
        <span class="subtitle">context</span>
      </div>

      <div class="row">
        <span class="muted">Input</span>
        <input type="range" min="0" max="100" [value]="value()"
               (input)="value.set(+$any($event.target).value)" />
        <span class="readout">{{ value() }}</span>
      </div>

      <div class="bar-track"><div class="bar-fill" [style.width.%]="value()"></div></div>
      <p class="note">Derived output: <b>{{ derived() }}</b></p>
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
      .subtitle, .muted { color: #9aa7b5; font-size: 13px; }
      .row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
      input[type='range'] { flex: 1; min-width: 200px; accent-color: #7c9cff; height: 5px; }
      .readout { font-weight: 700; font-variant-numeric: tabular-nums; color: #7c9cff; }
      .bar-track { background: #0b0f16; border: 1px solid #30363d; border-radius: 8px;
        height: 24px; overflow: hidden; }
      .bar-fill { height: 100%; border-radius: 7px; background: #7c9cff;
        transition: width 0.18s ease; min-width: 3px; }
      .note { margin: 0; color: #9aa7b5; font-size: 13px; }
      .note b { color: #e6edf3; }
    `,
  ],
})
export class MyWidgetComponent {
  readonly value = signal(40)
  readonly derived = computed(() => this.value() * 2)
}
```

### If the component uses a timer or listener

```ts
import { Component, OnDestroy, signal, ViewEncapsulation } from '@angular/core'

export class MyWidgetComponent implements OnDestroy {
  private timer: ReturnType<typeof setInterval> | null = null
  // ... start with setInterval(...) on some action ...
  private stop() { if (this.timer) clearInterval(this.timer); this.timer = null }
  ngOnDestroy() { this.stop() }
}
```

## Palette reference

| Token | Value | Use |
|---|---|---|
| Card bg | `#161b22` | widget background |
| Darker bg | `#0b0f16` | tracks, code, toggles |
| Border | `#30363d` | all borders |
| Accent | `#7c9cff` | primary highlight / slider |
| Text | `#e6edf3` | primary text |
| Muted | `#9aa7b5` | secondary text, captions |
| Series alt | `#ff8a5c`, `#5ad19a`, `#ffd166`, `#ef6f8c` | extra bar/series colors |
