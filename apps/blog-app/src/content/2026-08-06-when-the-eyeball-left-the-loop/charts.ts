// Chart manifest for "When the Eyeball Left the Loop". Auto-discovered by
// mount-charts.ts via `import.meta.glob('/src/content/*/charts.ts')`.
// Maps each `data-chart="…"` placeholder key to its component.
import { ChartManifest } from '../../app/blog/charts/mount-charts'
import { DriftMatrixComponent } from './drift-matrix.component'
import { LoopEvolutionComponent } from './loop-evolution.component'
import { ObservabilityLayersComponent } from './observability-layers.component'
import { TranslucencySolverComponent } from './translucency-solver.component'

const manifest: ChartManifest = {
  loop: { component: LoopEvolutionComponent },
  layers: { component: ObservabilityLayersComponent },
  solver: { component: TranslucencySolverComponent },
  drift: { component: DriftMatrixComponent },
}

export default manifest
