// Chart manifest for this post. Auto-discovered by mount-charts.ts via
// `import.meta.glob('/src/content/*/charts.ts')`.
import { BarChartComponent } from '../../app/blog/charts/bar-chart.component'
import { ChartManifest } from '../../app/blog/charts/mount-charts'
import { ConfigBuilderComponent } from './config-builder.component'
import { costConfig } from './cost.data'
import { ProbeComponent } from './probe.component'

const manifest: ChartManifest = {
  'config-builder': { component: ConfigBuilderComponent },
  probe: { component: ProbeComponent },
  cost: { component: BarChartComponent, inputs: { config: costConfig } },
}

export default manifest
