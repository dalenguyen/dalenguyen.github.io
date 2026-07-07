// Chart manifest for the "Structured Output Is Untrusted Input" post.
// Auto-discovered by mount-charts.ts via `import.meta.glob('/src/content/*/charts.ts')`.
// Maps each `data-chart="…"` placeholder key to its component.
import { ChartManifest } from '../../app/blog/charts/mount-charts'
import { RecoveryLayersComponent } from './recovery-layers.component'
import { ShapeNormalizerComponent } from './shape-normalizer.component'
import { TierLadderComponent } from './tier-ladder.component'

const manifest: ChartManifest = {
  'tier-ladder': { component: TierLadderComponent },
  'shape-normalizer': { component: ShapeNormalizerComponent },
  'recovery-layers': { component: RecoveryLayersComponent },
}

export default manifest
