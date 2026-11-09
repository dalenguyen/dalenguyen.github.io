// Chart manifest for this post. Auto-discovered by mount-charts.ts via
// `import.meta.glob('/src/content/*/charts.ts')`.
import { ChartManifest } from '../../app/blog/charts/mount-charts'
import { EvidencePickerComponent } from './evidence-picker.component'
import { HoldTimerComponent } from './hold-timer.component'

const manifest: ChartManifest = {
  'evidence-picker': { component: EvidencePickerComponent },
  'hold-timer': { component: HoldTimerComponent },
}

export default manifest
