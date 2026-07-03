// Chart manifest for "Build a Coding Agent From Scratch — Part 1".
// Auto-discovered by mount-charts.ts via
// `import.meta.glob('/src/content/*/charts.ts')`. Both step-throughs share one
// component and differ only by the `steps`/`heading` inputs.
import { ChartManifest } from '../../app/blog/charts/mount-charts'
import { StepThroughComponent } from './step-through.component'
import { PRIMITIVE_STEPS } from './primitive.data'
import { LOOP_STEPS } from './loop.data'

const manifest: ChartManifest = {
  primitive: {
    component: StepThroughComponent,
    inputs: { steps: PRIMITIVE_STEPS, heading: 'The primitive: a tool call is a structured field' },
  },
  loop: {
    component: StepThroughComponent,
    inputs: { steps: LOOP_STEPS, heading: 'The loop: turn responses into actions' },
  },
}

export default manifest
