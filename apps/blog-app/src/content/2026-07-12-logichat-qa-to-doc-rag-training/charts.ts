// Chart manifest for the doc-RAG blog post. Auto-discovered by mount-charts.ts
// via `import.meta.glob('/src/content/*/charts.ts')`. Each entry maps a
// `data-chart="…"` placeholder key to its component.
import { ChartManifest } from '../../app/blog/charts/mount-charts'
import { DocRagFlowComponent } from './doc-rag-flow.component'

const manifest: ChartManifest = {
  'doc-rag-flow': { component: DocRagFlowComponent },
}

export default manifest