import { BarChartConfig } from '../../app/blog/charts/chart.types'

// Illustrative figures from a chart-builder UI driven both ways: scripted DOM
// steps vs a single page-registered tool call per task.
export const costConfig: BarChartConfig = {
  labels: ['Add a series', 'Add during an error', 'Open row filter', 'Set up a screenshot state'],
  legend: [
    { name: 'DOM scripting', color: '#ff8a5c' },
    { name: 'WebMCP tool call', color: '#7c9cff' },
  ],
  metrics: [
    {
      key: 'steps',
      buttonLabel: 'Steps per task',
      series: [
        { name: 'DOM scripting', color: '#ff8a5c', vals: [8, 8, 3, 6] },
        { name: 'WebMCP tool call', color: '#7c9cff', vals: [1, 1, 1, 2] },
      ],
      note: 'Scripted steps to reach one state. The error case never succeeds - the "+ Add" button is hidden, so the script spends its steps failing. <b>Hover a bar.</b>',
      valLabel: (v) => String(v),
      yLabel: (v) => String(Math.round(v)),
      tip: (v) => v + ' steps',
      max: 10,
    },
    {
      key: 'tokens',
      buttonLabel: 'Tokens per task',
      series: [
        { name: 'DOM scripting', color: '#ff8a5c', vals: [1200, 1400, 900, 1600] },
        { name: 'WebMCP tool call', color: '#7c9cff', vals: [40, 60, 35, 70] },
      ],
      note: 'Rough context cost. DOM scripting re-reads a full accessibility snapshot after every reload because element IDs go stale; a tool call returns a short JSON result.',
      valLabel: (v) => (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : String(v)),
      yLabel: (v) => (v >= 1000 ? Math.round(v / 100) / 10 + 'k' : String(Math.round(v))),
      tip: (v) => v.toLocaleString() + ' tokens',
      max: 2000,
    },
  ],
}
