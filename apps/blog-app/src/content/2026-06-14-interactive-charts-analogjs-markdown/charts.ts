// Chart manifest for this how-to post. Auto-discovered by mount-charts.ts via
// `import.meta.glob('/src/content/*/charts.ts')`.
// Maps each `data-chart="…"` placeholder key to its component.
import { BarChartComponent } from '../../app/blog/charts/bar-chart.component'
import { ChartManifest } from '../../app/blog/charts/mount-charts'
import { demoBarsConfig } from './demo.data'
import { DemoSliderComponent } from './kv-slider.component'

const manifest: ChartManifest = {
  'demo-bars': { component: BarChartComponent, inputs: { config: demoBarsConfig } },
  'slider-demo': { component: DemoSliderComponent },
}

export default manifest
