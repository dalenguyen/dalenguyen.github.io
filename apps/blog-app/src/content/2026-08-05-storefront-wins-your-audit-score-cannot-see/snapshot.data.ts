// Real PageSpeed Insights snapshot of a live AnalogJS storefront, captured
// 2026-08-05. Grouped Mobile vs Desktop across the home and a product page,
// with a toggle between the Performance score and the LCP that drives it.
// Reuses the shared BarChartComponent.
import { BarChartConfig } from '../../app/blog/charts/chart.types'

const MOBILE = '#ff8a5c' // the honest device — where the cost lands
const DESKTOP = '#7c9cff' // the flattering one

export const snapshotConfig: BarChartConfig = {
  labels: ['Home page', 'Product page'],
  legend: [
    { name: 'Mobile', color: MOBILE },
    { name: 'Desktop', color: DESKTOP },
  ],
  metrics: [
    {
      key: 'perf',
      buttonLabel: 'Performance score',
      series: [
        { name: 'Mobile', color: MOBILE, vals: [93, 76] },
        { name: 'Desktop', color: DESKTOP, vals: [100, 98] },
      ],
      max: 100,
      note: 'Lighthouse Performance, identical URLs. Desktop flatters both pages; the product page on mobile — the one that sells — is where it actually lands, at <b>76</b>. <b>Hover a bar for the exact score.</b>',
      valLabel: (v) => String(v),
      yLabel: (v) => String(Math.round(v)),
      tip: (v) => v + ' / 100',
    },
    {
      key: 'lcp',
      buttonLabel: 'LCP (seconds)',
      series: [
        { name: 'Mobile', color: MOBILE, vals: [2.9, 5.9] },
        { name: 'Desktop', color: DESKTOP, vals: [0.6, 1.1] },
      ],
      note: 'Largest Contentful Paint, lab. The product hero takes <b>5.9 s</b> on mobile and <b>1.1 s</b> on desktop — the same URL. Lower is better. <b>Hover a bar for the exact value.</b>',
      valLabel: (v) => v + 's',
      yLabel: (v) => v.toFixed(1) + 's',
      tip: (v) => v + ' s',
    },
  ],
}
