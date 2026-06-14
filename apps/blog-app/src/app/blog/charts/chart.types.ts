// Shared chart types for the reusable BarChartComponent. Per-post data lives
// alongside the post in src/content/<slug>/.

export interface BarMetric {
  /** stable key used for the toggle */
  key: string
  /** toggle button text */
  buttonLabel: string
  /** caption under the chart; limited HTML (`<b>`) allowed */
  note: string
  /** grouped charts: one entry per series */
  series?: { name: string; color: string; vals: number[] }[]
  /** single-series charts: one value per label, coloured per bar */
  single?: number[]
  colors?: string[]
  /** label drawn above each bar */
  valLabel: (v: number) => string
  /** y-axis tick label */
  yLabel: (v: number) => string
  /** tooltip value */
  tip: (v: number) => string
  /** optional fixed axis max */
  max?: number
}

export interface BarChartConfig {
  labels: string[]
  legend: { name: string; color: string }[]
  metrics: BarMetric[]
}
