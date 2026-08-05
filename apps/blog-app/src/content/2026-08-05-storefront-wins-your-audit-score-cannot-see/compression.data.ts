// Compression win for a single ~500 KB client bundle, one bar per encoding.
// Illustrative numbers — the point is the order-of-magnitude gap between what
// ships raw and what would ship if the transport were negotiated.
// Co-located with the post markdown; reuses the shared BarChartComponent.
import { BarChartConfig } from '../../app/blog/charts/chart.types'

const RAW = 500

export const compressionConfig: BarChartConfig = {
  labels: ['Uncompressed', 'gzip', 'brotli'],
  legend: [{ name: 'Bytes over the wire (KB)', color: '#7c9cff' }],
  metrics: [
    {
      key: 'size',
      buttonLabel: 'Transfer size (KB)',
      // bad → neutral → good: raw is what a page audit never weighs
      single: [RAW, 180, 130],
      colors: ['#ff8a5c', '#7c9cff', '#5ad19a'],
      note: 'The same 500 KB JS bundle, three encodings — but compression must be <b>negotiated</b>. Miss the <b>Accept-Encoding</b> header and you measure the first bar by accident. <b>Hover a bar for exact size and savings.</b>',
      valLabel: (v) => v + ' KB',
      yLabel: (v) => Math.round(v) + '',
      tip: (v) => (v === RAW ? v + ' KB (raw)' : `${v} KB — ${Math.round((1 - v / RAW) * 100)}% smaller`),
    },
  ],
}
