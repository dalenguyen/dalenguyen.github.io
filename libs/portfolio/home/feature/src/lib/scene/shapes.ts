/**
 * Particle target shapes for the home page scene. Each function returns
 * `count * 3` floats (x, y, z). A home page section picks its shape by name
 * with `data-scene="<name>"`; the scene morphs between them on scroll.
 */

const TAU = Math.PI * 2

function build(count: number, fn: (i: number, out: Float32Array, o: number) => void): Float32Array {
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) fn(i, out, i * 3)
  return out
}

/** A planet (fibonacci sphere) with a thin orbit ring. */
export function sphere(count: number): Float32Array {
  const ringCount = Math.floor(count * 0.2)
  const sphereCount = count - ringCount
  const golden = Math.PI * (3 - Math.sqrt(5))
  return build(count, (i, out, o) => {
    if (i < sphereCount) {
      const y = 1 - (i / (sphereCount - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const a = golden * i
      out[o] = Math.cos(a) * r * 2.2
      out[o + 1] = y * 2.2
      out[o + 2] = Math.sin(a) * r * 2.2
    } else {
      const a = Math.random() * TAU
      const r = 3.2 + (Math.random() - 0.5) * 0.25
      out[o] = Math.cos(a) * r
      out[o + 1] = Math.sin(a) * r * 0.18
      out[o + 2] = Math.sin(a) * r
    }
  })
}

/** An open book - two curved pages. */
export function book(count: number): Float32Array {
  return build(count, (_, out, o) => {
    const side = Math.random() < 0.5 ? -1 : 1
    const u = Math.random() // across the page, 0 = spine
    const v = Math.random() - 0.5 // up the page
    out[o] = side * u * 3
    out[o + 1] = v * 3.6
    out[o + 2] = Math.sin(u * Math.PI) * 0.8 - u * 0.6
  })
}

/** A cube lattice - code, structure. */
export function lattice(count: number): Float32Array {
  const side = Math.ceil(Math.cbrt(count))
  const step = 4 / (side - 1)
  return build(count, (i, out, o) => {
    out[o] = ((i % side) * step - 2) * 0.9
    out[o + 1] = (Math.floor(i / side) % side) * step * 0.9 - 1.8
    out[o + 2] = (Math.floor(i / (side * side)) * step - 2) * 0.9
  })
}

/** A flowing wave surface - a voice waveform. */
export function wave(count: number): Float32Array {
  const side = Math.ceil(Math.sqrt(count))
  return build(count, (i, out, o) => {
    const x = ((i % side) / side - 0.5) * 9
    const z = (Math.floor(i / side) / side - 0.5) * 6
    out[o] = x
    out[o + 1] = Math.sin(x * 0.9) * 0.6 + Math.cos(z * 1.2) * 0.4 - 0.5
    out[o + 2] = z
  })
}

/** A DNA double helix - how I work. */
export function helix(count: number): Float32Array {
  return build(count, (i, out, o) => {
    const t = (i / count) * TAU * 3
    const strand = i % 3 // 0 and 1 = strands, 2 = rungs
    const y = (i / count - 0.5) * 7
    if (strand < 2) {
      const a = t + strand * Math.PI
      out[o] = Math.cos(a) * 1.3
      out[o + 1] = y
      out[o + 2] = Math.sin(a) * 1.3
    } else {
      const k = Math.random() * 2 - 1
      out[o] = Math.cos(t) * 1.3 * k
      out[o + 1] = y
      out[o + 2] = Math.sin(t) * 1.3 * k
    }
  })
}

/** A spiral galaxy - exploring. */
export function galaxy(count: number): Float32Array {
  const arms = 3
  return build(count, (i, out, o) => {
    const r = Math.pow(Math.random(), 0.7) * 4.5
    const arm = (i % arms) * (TAU / arms)
    const a = arm + r * 0.9
    const spread = (Math.random() - 0.5) * 0.5 * (1 + r * 0.2)
    out[o] = Math.cos(a) * r + spread
    out[o + 1] = (Math.random() - 0.5) * 0.3
    out[o + 2] = Math.sin(a) * r + spread
  })
}

/** Concentric rings rising from a centre - a message going out. */
export function ripples(count: number): Float32Array {
  const rings = 6
  return build(count, (i, out, o) => {
    const ring = i % rings
    const a = Math.random() * TAU
    const r = 0.6 + ring * 0.65
    out[o] = Math.cos(a) * r
    out[o + 1] = Math.sin(ring * 0.9) * 0.4 + (Math.random() - 0.5) * 0.08
    out[o + 2] = Math.sin(a) * r
  })
}

/** Shape builders and their x-axis tilt (so flat shapes read as 3D). */
export const SHAPES: Record<string, { build: (count: number) => Float32Array; tilt: number }> = {
  sphere: { build: sphere, tilt: 0.2 },
  book: { build: book, tilt: 0.15 },
  lattice: { build: lattice, tilt: 0.45 },
  wave: { build: wave, tilt: 0.35 },
  ripples: { build: ripples, tilt: 0.5 },
  helix: { build: helix, tilt: 0.1 },
  galaxy: { build: galaxy, tilt: 0.6 },
}
