// Demo chart data for this how-to post. Co-located with the post markdown.
// Shows npm weekly download figures for popular front-end meta-frameworks
// (approximate, illustrative).
import { BarChartConfig } from '../../app/blog/charts/chart.types'

const PALETTE = {
  analog: '#7c9cff',
  next: '#ff8a5c',
} as const

const fix0 = (v: number) => v.toFixed(0)
const int = (v: number) => String(Math.round(v))

export const demoBarsConfig: BarChartConfig = {
  labels: ['Analog', 'SvelteKit', 'Nuxt', 'Next.js'],
  legend: [
    { name: 'Median render time (ms)', color: PALETTE.analog },
    { name: 'p95 render time (ms)', color: PALETTE.next },
  ],
  metrics: [
    {
      key: 'median',
      buttonLabel: 'Median (ms)',
      series: [
        { name: 'Median render time (ms)', color: PALETTE.analog, vals: [12, 18, 21, 24] },
        { name: 'p95 render time (ms)', color: PALETTE.next, vals: [28, 41, 49, 58] },
      ],
      note: 'Illustrative page render times (ms) across four frameworks. Lower is faster. <b>Hover a bar for the exact value.</b>',
      valLabel: (v) => (v >= 100 ? int(v) : fix0(v)),
      yLabel: fix0,
      tip: (v) => fix0(v) + ' ms',
    },
    {
      key: 'cold',
      buttonLabel: 'Cold start (ms)',
      series: [
        { name: 'Median render time (ms)', color: PALETTE.analog, vals: [38, 52, 61, 74] },
        { name: 'p95 render time (ms)', color: PALETTE.next, vals: [91, 118, 130, 155] },
      ],
      note: 'Cold-start render time (ms) with no cache warm. Toggle between median and p95 with the buttons above.',
      valLabel: (v) => (v >= 100 ? int(v) : fix0(v)),
      yLabel: fix0,
      tip: (v) => fix0(v) + ' ms',
    },
  ],
}
