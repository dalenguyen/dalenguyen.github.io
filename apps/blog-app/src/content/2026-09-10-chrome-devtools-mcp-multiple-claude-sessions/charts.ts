// Chart manifest for this post. Auto-discovered by mount-charts.ts via
// `import.meta.glob('/src/content/*/charts.ts')`.
import { BarChartComponent } from '../../app/blog/charts/bar-chart.component'
import { ChartManifest } from '../../app/blog/charts/mount-charts'
import { fanoutConfig } from './fanout.data'
import { IsolationKeyComponent } from './isolation-key.component'
import { StampedeComponent } from './stampede.component'

const manifest: ChartManifest = {
  'isolation-key': { component: IsolationKeyComponent },
  stampede: { component: StampedeComponent },
  fanout: { component: BarChartComponent, inputs: { config: fanoutConfig } },
}

export default manifest
