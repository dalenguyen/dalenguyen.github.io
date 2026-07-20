// Chart/widget manifest for this post. Auto-discovered by mount-charts.ts via
// `import.meta.glob('/src/content/*/charts.ts')`. Maps each `data-chart="…"`
// placeholder key in the markdown to the component that should mount there.
import { ChartManifest } from '../../app/blog/charts/mount-charts'
import { DurableFlowComponent } from './durable-flow.component'

const manifest: ChartManifest = {
  'durable-flow': { component: DurableFlowComponent },
}

export default manifest
