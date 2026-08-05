// Chart manifest for this post. Auto-discovered by mount-charts.ts via
// `import.meta.glob('/src/content/*/charts.ts')`.
// Maps each `data-chart="…"` placeholder key to its component.
import { BarChartComponent } from '../../app/blog/charts/bar-chart.component'
import { ChartManifest } from '../../app/blog/charts/mount-charts'
import { BlindSpotsComponent } from './blind-spots.component'
import { CacheWasteComponent } from './cache-waste.component'
import { compressionConfig } from './compression.data'
import { snapshotConfig } from './snapshot.data'

const manifest: ChartManifest = {
  'blind-spots': { component: BlindSpotsComponent },
  compression: { component: BarChartComponent, inputs: { config: compressionConfig } },
  'cache-cost': { component: CacheWasteComponent },
  snapshot: { component: BarChartComponent, inputs: { config: snapshotConfig } },
}

export default manifest
