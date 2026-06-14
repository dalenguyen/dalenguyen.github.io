// Before/after Lighthouse category scores for the all-green post.
// Desktop and mobile were identical so we use a single grouped series.
import { BarChartConfig } from '../../app/blog/charts/chart.types'

export const lighthouseScoresConfig: BarChartConfig = {
  labels: ['Accessibility', 'Best Practices', 'SEO', 'Agentic Browsing'],
  legend: [
    { name: 'Before', color: '#ff8a5c' },
    { name: 'After', color: '#5ad19a' },
  ],
  metrics: [
    {
      key: 'scores',
      buttonLabel: 'Lighthouse scores',
      max: 100,
      series: [
        { name: 'Before', color: '#ff8a5c', vals: [90, 77, 92, 33] },
        { name: 'After', color: '#5ad19a', vals: [100, 100, 100, 100] },
      ],
      valLabel: (v) => String(v),
      yLabel: (v) => String(Math.round(v)),
      tip: (v) => String(v),
      note:
        'Lighthouse scores before and after optimization (desktop and mobile). ' +
        '<b>Hover a bar for the exact value.</b> ' +
        'Categories: Accessibility, Best Practices, SEO, Agentic Browsing.',
    },
  ],
}
