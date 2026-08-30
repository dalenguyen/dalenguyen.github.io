// Auto-discovered by mount-charts.ts via import.meta.glob('/src/content/*/charts.ts').
import { ChartManifest } from '../../app/blog/charts/mount-charts'
import { AffectedToggleComponent } from './affected-toggle.component'
import { WifFlowComponent } from './wif-flow.component'

const manifest: ChartManifest = {
  'affected-toggle': { component: AffectedToggleComponent },
  'wif-flow': { component: WifFlowComponent },
}

export default manifest
