// Chart manifest for this post. Auto-discovered by mount-charts.ts via
// `import.meta.glob('/src/content/*/charts.ts')` — maps each `data-chart="…"`
// placeholder in the markdown to the component that renders it. No central
// registry to edit; everything this post needs lives in this folder.
import { BarChartComponent } from '../../app/blog/charts/bar-chart.component'
import { ChartManifest } from '../../app/blog/charts/mount-charts'
import { controlConfig, speedConfig, variantConfig } from './benchmark.data'
import { KvCalculatorComponent } from './kv-calculator.component'
import { LayerDiagramComponent } from './layer-diagram.component'

const manifest: ChartManifest = {
  layers: { component: LayerDiagramComponent },
  'kv-calculator': { component: KvCalculatorComponent },
  speed: { component: BarChartComponent, inputs: { config: speedConfig } },
  variant: { component: BarChartComponent, inputs: { config: variantConfig } },
  control: { component: BarChartComponent, inputs: { config: controlConfig } },
}

export default manifest
