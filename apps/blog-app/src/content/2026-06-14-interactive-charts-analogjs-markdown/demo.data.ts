// Simple single-series demo data for this how-to post (illustrative numbers).
// Co-located with the post markdown.
import { BarChartConfig } from '../../app/blog/charts/chart.types'

export const demoBarsConfig: BarChartConfig = {
  labels: ['Analog', 'Next.js', 'SvelteKit'],
  legend: [{ name: 'Median render (ms)', color: '#7c9cff' }],
  metrics: [
    {
      key: 'render',
      buttonLabel: 'Median render (ms)',
      single: [12, 24, 18],
      colors: ['#7c9cff', '#ff8a5c', '#5ad19a'],
      note: 'Illustrative median render time (ms) — lower is faster. <b>Hover a bar for the exact value.</b>',
      valLabel: (v) => String(v),
      yLabel: (v) => String(v),
      tip: (v) => v + ' ms',
    },
  ],
}
