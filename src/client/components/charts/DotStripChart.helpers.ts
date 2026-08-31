/**
 * Layout maths for the dot strip (beeswarm) chart.
 *
 * Kept out of the component — like `ScatterChart.helpers.ts` and
 * `BubbleChart.render.ts` — so the swarm packing can be unit-tested without a
 * DOM. Everything here is pure: same input, same output, every time.
 */

/** Hard caps so one pathological band cannot blow up the layout. */
export const MAX_BANDS = 50
export const MAX_DOTS_PER_BAND = 500
export const MAX_LANES = 8

export const MIN_ROW_HEIGHT = 44
export const MAX_ROW_HEIGHT = 220
/** Vertical breathing room added above and below the outermost lanes. */
export const ROW_VERTICAL_PADDING = 12

export const DOT_RADIUS: Record<'small' | 'medium' | 'large', number> = {
  small: 3.5,
  medium: 5,
  large: 7,
}

/** Gap between the edges of two adjacent dots in the same lane. */
export const DOT_GAP = 1.5

export interface DotDatum {
  /** Raw numeric value of the measure. */
  value: number
  /** Identity label for the dot (from the optional series dimension). */
  label: string
  /** The source row, handed back on click. */
  row: Record<string, unknown>
}

export interface PlacedDot extends DotDatum {
  /** Pixel x within the plot area. */
  x: number
  /** Lane index: 0 is the centre line, then +1, -1, +2, -2, … */
  lane: number
  /** Pixel y offset from the band's centre line. */
  y: number
}

export interface BandStats {
  /** The band's own label (the value of the band dimension). */
  label: string
  dots: PlacedDot[]
  count: number
  median: number | null
  min: number | null
  max: number | null
  /**
   * max / min. `null` when it cannot be stated meaningfully — fewer than two
   * dots, or a non-positive minimum (the ratio is infinite or sign-flipped).
   */
  spread: number | null
  /** True when the band has rows but not one usable numeric value. */
  noData: boolean
  /** Rendered height of this band's row, in px. */
  height: number
  /** True when the band's dots were truncated at MAX_DOTS_PER_BAND. */
  truncated: boolean
}

export function parseNumeric(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : null
}

export function median(sortedValues: number[]): number | null {
  const n = sortedValues.length
  if (n === 0) return null
  const mid = Math.floor(n / 2)
  return n % 2 === 0 ? (sortedValues[mid - 1] + sortedValues[mid]) / 2 : sortedValues[mid]
}

/**
 * Walk lanes outward from the centre: 0, +1, -1, +2, -2, …
 * Returns the lane index for the nth step.
 */
function laneAtStep(step: number): number {
  if (step === 0) return 0
  const magnitude = Math.ceil(step / 2)
  return step % 2 === 1 ? magnitude : -magnitude
}

/**
 * Greedy deterministic beeswarm packing.
 *
 * Dots are sorted by x (ties broken by label, so the output is stable for a
 * given input rather than dependent on row order) and each is dropped into the
 * first lane — searched outward from the centre — where it clears every dot
 * already in that lane by at least `2r + gap`. Beyond `MAX_LANES` the dot is
 * forced onto the outermost lane and simply overlaps; the surface-coloured
 * stroke keeps that readable.
 *
 * A force simulation would do this too, but it settles asynchronously and
 * non-deterministically, which makes it untestable and jittery on re-render.
 */
export function packSwarm(dots: DotDatum[], scale: (v: number) => number, radius: number): PlacedDot[] {
  const minSeparation = 2 * radius + DOT_GAP
  const laneHeight = 2 * radius + DOT_GAP

  const sorted = [...dots].sort((a, b) => (a.value - b.value) || a.label.localeCompare(b.label))

  // lane index -> x positions already placed in that lane
  const lanes = new Map<number, number[]>()
  const placed: PlacedDot[] = []

  for (const dot of sorted) {
    const x = scale(dot.value)

    let chosenLane = laneAtStep(2 * MAX_LANES)
    for (let step = 0; step <= 2 * MAX_LANES; step++) {
      const lane = laneAtStep(step)
      const occupied = lanes.get(lane)
      if (!occupied || occupied.every((other) => Math.abs(x - other) >= minSeparation)) {
        chosenLane = lane
        break
      }
    }

    const occupied = lanes.get(chosenLane)
    if (occupied) occupied.push(x)
    else lanes.set(chosenLane, [x])

    placed.push({ ...dot, x, lane: chosenLane, y: chosenLane * laneHeight })
  }

  return placed
}

/** Row height needed to show every lane the swarm used. */
export function swarmHeight(placed: PlacedDot[], radius: number): number {
  const maxAbsLane = placed.reduce((acc, d) => Math.max(acc, Math.abs(d.lane)), 0)
  const laneHeight = 2 * radius + DOT_GAP
  const needed = (2 * maxAbsLane + 1) * laneHeight + 2 * ROW_VERTICAL_PADDING
  return Math.min(Math.max(needed, MIN_ROW_HEIGHT), MAX_ROW_HEIGHT)
}

/** max / min, or null when the ratio would be meaningless. */
export function computeSpread(min: number | null, max: number | null, count: number): number | null {
  if (min === null || max === null || count < 2) return null
  if (min <= 0) return null
  return max / min
}

export type BandSort = 'none' | 'valueDesc' | 'valueAsc' | 'count'

/**
 * Group rows into bands, in the order requested. Sorting happens before the
 * swarm is packed so row heights follow the rows the user actually sees.
 */
export function groupIntoBands(
  rows: Record<string, unknown>[],
  bandField: string,
  valueField: string,
  labelField: string | undefined,
  sort: BandSort
): Array<{ label: string; values: DotDatum[]; truncated: boolean }> {
  const order: string[] = []
  const grouped = new Map<string, DotDatum[]>()

  for (const row of rows) {
    const bandLabel = String(row[bandField] ?? '')
    if (!grouped.has(bandLabel)) {
      grouped.set(bandLabel, [])
      order.push(bandLabel)
    }
    const value = parseNumeric(row[valueField])
    if (value === null) continue
    grouped.get(bandLabel)!.push({
      value,
      label: labelField ? String(row[labelField] ?? '') : bandLabel,
      row,
    })
  }

  let bands = order.map((label) => {
    const all = grouped.get(label)!
    return {
      label,
      values: all.slice(0, MAX_DOTS_PER_BAND),
      truncated: all.length > MAX_DOTS_PER_BAND,
    }
  })

  if (sort !== 'none') {
    const medianOf = (values: DotDatum[]) => median(values.map((d) => d.value).sort((a, b) => a - b))
    bands = [...bands].sort((a, b) => {
      if (sort === 'count') return b.values.length - a.values.length
      const ma = medianOf(a.values)
      const mb = medianOf(b.values)
      if (ma === null && mb === null) return 0
      if (ma === null) return 1
      if (mb === null) return -1
      return sort === 'valueDesc' ? mb - ma : ma - mb
    })
  }

  return bands.slice(0, MAX_BANDS)
}

/** Nicely padded numeric domain across every dot in every band. */
export function computeDomain(values: number[]): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 1 }
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  if (rawMin === rawMax) {
    const pad = Math.abs(rawMin) * 0.1 || 1
    return { min: rawMin - pad, max: rawMax + pad }
  }
  const pad = (rawMax - rawMin) * 0.1
  return { min: rawMin - pad, max: rawMax + pad }
}

/** Evenly spaced axis ticks across the domain. */
export function computeTicks(min: number, max: number, count = 5): number[] {
  if (max === min) return [min]
  const step = (max - min) / (count - 1)
  return Array.from({ length: count }, (_, i) => min + i * step)
}
