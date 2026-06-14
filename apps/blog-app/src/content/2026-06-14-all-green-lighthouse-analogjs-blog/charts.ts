// Chart manifest for the all-green Lighthouse post.
// Auto-discovered by mount-charts.ts via import.meta.glob('/src/content/*/charts.ts').
import { BarChartComponent } from '../../app/blog/charts/bar-chart.component'
import { ChartManifest } from '../../app/blog/charts/mount-charts'
import { lighthouseScoresConfig } from './scores.data'

const manifest: ChartManifest = {
  'lighthouse-scores': { component: BarChartComponent, inputs: { config: lighthouseScoresConfig } },
}

export default manifest
