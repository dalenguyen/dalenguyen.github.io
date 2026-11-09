// Auto-discovered by mount-charts.ts via import.meta.glob('/src/content/*/charts.ts').
import { ChartManifest } from '../../app/blog/charts/mount-charts'
import { CostCalcComponent } from './cost-calc.component'
import { DailySeriesComponent } from './daily-series.component'
import { IdleLoopComponent } from './idle-loop.component'

const manifest: ChartManifest = {
  'idle-loop': { component: IdleLoopComponent },
  'daily-series': { component: DailySeriesComponent },
  'cost-calc': { component: CostCalcComponent },
}

export default manifest
