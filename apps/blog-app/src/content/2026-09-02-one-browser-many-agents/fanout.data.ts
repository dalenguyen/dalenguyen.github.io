// Illustrative cost of fanning work out to N workers when each worker acquires
// its own copy of an expensive exclusive resource (cold browser + login ≈ 20s)
// versus funnelling the same work through one already-warm resource.
import { BarChartConfig } from '../../app/blog/charts/chart.types'

const SHARED = '#5ad19a'
const OWN = '#ff8a5c'

export const fanoutConfig: BarChartConfig = {
  labels: ['1 worker', '2 workers', '3 workers', '5 workers'],
  legend: [
    { name: 'One shared warm resource', color: SHARED },
    { name: 'One resource per worker', color: OWN },
  ],
  metrics: [
    {
      key: 'wallclock',
      buttonLabel: 'Wall clock',
      series: [
        { name: 'One shared warm resource', color: SHARED, vals: [6, 10, 14, 22] },
        { name: 'One resource per worker', color: OWN, vals: [24, 28, 34, 48] },
      ],
      note: 'Illustrative: 4s of real work per page, a 20s cold start plus login per fresh resource, and contention as the cold starts overlap. <b>Hover a bar for the exact value.</b>',
      valLabel: (v) => v + 's',
      yLabel: (v) => Math.round(v) + 's',
      tip: (v) => v + ' s',
      max: 60,
    },
    {
      key: 'logins',
      buttonLabel: 'Logins required',
      series: [
        { name: 'One shared warm resource', color: SHARED, vals: [1, 1, 1, 1] },
        { name: 'One resource per worker', color: OWN, vals: [1, 2, 3, 5] },
      ],
      note: 'A shared warm resource is authenticated once. Give every worker its own and the login is paid per worker - every run, if the copy is disposable.',
      valLabel: (v) => String(v),
      yLabel: (v) => String(Math.round(v)),
      tip: (v) => v + ' login' + (v === 1 ? '' : 's'),
      max: 10,
    },
  ],
}
