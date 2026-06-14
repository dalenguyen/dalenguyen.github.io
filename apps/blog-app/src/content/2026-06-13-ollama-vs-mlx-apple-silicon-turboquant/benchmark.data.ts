// Benchmark data for this post's charts. Numbers come from real runs on an
// M4 Pro (48 GB). Co-located with the post's markdown (../<slug>.md).
import { BarChartConfig } from '../../app/blog/charts/chart.types'

export const PALETTE = {
  mlx: '#7c9cff',
  ollama: '#ff8a5c',
  fp16: '#5ad19a',
  kv4: '#ffd166',
  tq: '#ef6f8c',
} as const

const int = (v: number) => String(Math.round(v))
const fix0 = (v: number) => v.toFixed(0)
const fix1 = (v: number) => v.toFixed(1)
const fix2 = (v: number) => v.toFixed(2)

export const speedConfig: BarChartConfig = {
  labels: ['short (33)', '2.4K', '10K', '32K'],
  legend: [
    { name: 'MLX', color: PALETTE.mlx },
    { name: 'Ollama', color: PALETTE.ollama },
  ],
  metrics: [
    {
      key: 'decode',
      buttonLabel: 'Decode (tok/s)',
      series: [
        { name: 'MLX', color: PALETTE.mlx, vals: [80.1, 77.1, 70.5, 58.2] },
        { name: 'Ollama', color: PALETTE.ollama, vals: [52.9, 52.3, 48.3, 39.9] },
      ],
      note: 'Decode = how fast it writes the answer. MLX is on average <b>48% faster</b> than Ollama here. Taller bars = faster.',
      valLabel: (v) => (v >= 100 ? int(v) : fix0(v)),
      yLabel: fix0,
      tip: (v) => fix1(v) + ' tok/s',
    },
    {
      key: 'prefill',
      buttonLabel: 'Prefill (tok/s)',
      series: [
        { name: 'MLX', color: PALETTE.mlx, vals: [293, 829, 792, 636] },
        { name: 'Ollama', color: PALETTE.ollama, vals: [192, 642, 597, 457] },
      ],
      note: 'Prefill = how fast it reads your prompt before answering (first time, nothing reused). Taller = faster. When Ollama reuses a repeated prompt this is nearly instant — not shown here.',
      valLabel: (v) => (v >= 100 ? int(v) : fix0(v)),
      yLabel: fix0,
      tip: (v) => fix1(v) + ' tok/s',
    },
  ],
}

export const variantConfig: BarChartConfig = {
  labels: ['fp16 KV', 'affine 4-bit', 'TurboQuant 3-bit'],
  legend: [
    { name: 'full-size (fp16)', color: PALETTE.fp16 },
    { name: 'built-in 4-bit', color: PALETTE.kv4 },
    { name: 'TurboQuant 3-bit', color: PALETTE.tq },
  ],
  metrics: [
    {
      key: 'decode',
      buttonLabel: 'Decode (tok/s)',
      single: [58.2, 45.5, 7.5],
      colors: [PALETTE.fp16, PALETTE.kv4, PALETTE.tq],
      note: 'Decode tok/s; higher is better. On this hybrid model both quantized caches are <b>slower</b> than fp16 — the cache was never the bottleneck.',
      valLabel: fix1,
      yLabel: fix0,
      tip: (v) => fix1(v) + ' tok/s',
    },
    {
      key: 'cache',
      buttonLabel: 'KV cache (GB)',
      single: [0.731, 0.252, 0.207],
      colors: [PALETTE.fp16, PALETTE.kv4, PALETTE.tq],
      note: 'KV cache size in GB; lower is smaller. TurboQuant 3-bit is <b>3.5× smaller</b> than fp16 here — about half a gigabyte saved next to a 19.5 GB model.',
      valLabel: (v) => fix2(v) + ' GB',
      yLabel: fix2,
      tip: (v) => (v * 1000).toFixed(0) + ' MB',
    },
  ],
}

export const controlConfig: BarChartConfig = {
  labels: ['fp16 KV', 'affine 4-bit', 'TurboQuant 3-bit'],
  legend: [
    { name: 'full-size (fp16)', color: PALETTE.fp16 },
    { name: 'built-in 4-bit', color: PALETTE.kv4 },
    { name: 'TurboQuant 3-bit', color: PALETTE.tq },
  ],
  metrics: [
    {
      key: 'decode',
      buttonLabel: 'Decode (tok/s)',
      single: [86.7, 99.4, 7.3],
      colors: [PALETTE.fp16, PALETTE.kv4, PALETTE.tq],
      note: 'Decode tok/s; higher is better. Fused 4-bit <b>beats fp16</b> here (this dense model is bandwidth-bound). The Python TurboQuant port pays a heavy per-step cost.',
      valLabel: fix1,
      yLabel: fix0,
      tip: (v) => fix1(v) + ' tok/s',
    },
    {
      key: 'cache',
      buttonLabel: 'KV cache (GB)',
      single: [1.074, 0.302, 0.267],
      colors: [PALETTE.fp16, PALETTE.kv4, PALETTE.tq],
      note: 'KV cache size in GB; lower is smaller. Here the cache is large, so TurboQuant 3-bit is <b>4× smaller</b> than fp16 — matching the paper.',
      valLabel: (v) => fix2(v) + ' GB',
      yLabel: fix2,
      tip: (v) => (v * 1000).toFixed(0) + ' MB',
    },
  ],
}
