/**
 * Unit tests for the dot strip beeswarm layout.
 *
 * The packing is deliberately a pure function (no d3-force, no async settling)
 * so these assertions can be exact rather than statistical.
 */

import { describe, it, expect } from 'vitest'
import {
  DOT_GAP,
  MAX_BANDS,
  MAX_DOTS_PER_BAND,
  MAX_LANES,
  MIN_ROW_HEIGHT,
  computeDomain,
  computeSpread,
  computeTicks,
  groupIntoBands,
  median,
  packSwarm,
  swarmHeight,
  type DotDatum,
} from '../../../src/client/components/charts/DotStripChart.helpers'

const identity = (v: number) => v

function dots(values: number[], labelPrefix = 'p'): DotDatum[] {
  return values.map((value, i) => ({ value, label: `${labelPrefix}${i}`, row: {} }))
}

describe('packSwarm', () => {
  it('keeps every pair of dots in a lane at least 2r + gap apart', () => {
    const radius = 5
    // 40 values inside a 20px window — far denser than one lane can hold.
    const values = Array.from({ length: 40 }, (_, i) => 100 + i * 0.5)
    const placed = packSwarm(dots(values), identity, radius)

    const byLane = new Map<number, number[]>()
    for (const dot of placed) {
      const arr = byLane.get(dot.lane) ?? []
      arr.push(dot.x)
      byLane.set(dot.lane, arr)
    }

    const minSeparation = 2 * radius + DOT_GAP
    for (const [lane, xs] of byLane) {
      // The outermost lane is the overflow bucket and may overlap by design.
      if (Math.abs(lane) === MAX_LANES) continue
      const sorted = [...xs].sort((a, b) => a - b)
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(minSeparation)
      }
    }
  })

  it('is deterministic and independent of input row order', () => {
    const values = [3, 1, 4, 1.2, 5, 9, 2, 6, 5.3, 3.5]
    const a = packSwarm(dots(values), identity, 4)
    const b = packSwarm([...dots(values)].reverse(), identity, 4)

    expect(a.map((d) => [d.label, d.lane, d.x])).toEqual(b.map((d) => [d.label, d.lane, d.x]))
  })

  it('puts a sparse band entirely on the centre lane', () => {
    const placed = packSwarm(dots([0, 100, 200, 300]), identity, 4)
    expect(placed.every((d) => d.lane === 0)).toBe(true)
    expect(placed.every((d) => d.y === 0)).toBe(true)
  })

  it('never exceeds MAX_LANES, even when every value is identical', () => {
    const placed = packSwarm(dots(Array.from({ length: 200 }, () => 42)), identity, 5)
    expect(placed).toHaveLength(200)
    expect(Math.max(...placed.map((d) => Math.abs(d.lane)))).toBeLessThanOrEqual(MAX_LANES)
  })

  it('handles a single dot', () => {
    const placed = packSwarm(dots([7]), identity, 5)
    expect(placed).toHaveLength(1)
    expect(placed[0].lane).toBe(0)
  })

  it('handles an empty band', () => {
    expect(packSwarm([], identity, 5)).toEqual([])
  })
})

describe('swarmHeight', () => {
  it('never drops below MIN_ROW_HEIGHT for a flat band', () => {
    const placed = packSwarm(dots([0, 100, 200]), identity, 4)
    expect(swarmHeight(placed, 4)).toBe(MIN_ROW_HEIGHT)
  })

  it('grows once the swarm uses outer lanes', () => {
    const flat = packSwarm(dots([0, 100, 200]), identity, 5)
    const dense = packSwarm(dots(Array.from({ length: 30 }, () => 50)), identity, 5)
    expect(swarmHeight(dense, 5)).toBeGreaterThan(swarmHeight(flat, 5))
  })
})

describe('computeSpread', () => {
  it('is max / min for a positive band', () => {
    expect(computeSpread(2, 5, 4)).toBeCloseTo(2.5)
  })

  it('is null when the minimum is zero or negative', () => {
    expect(computeSpread(0, 5, 4)).toBeNull()
    expect(computeSpread(-3, 5, 4)).toBeNull()
  })

  it('is null with fewer than two dots', () => {
    expect(computeSpread(2, 2, 1)).toBeNull()
  })
})

describe('median', () => {
  it('averages the middle pair for an even count', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5)
  })

  it('takes the middle value for an odd count', () => {
    expect(median([1, 2, 3])).toBe(2)
  })

  it('is null for an empty band', () => {
    expect(median([])).toBeNull()
  })
})

describe('groupIntoBands', () => {
  const rows = [
    { band: 'Leads', person: 'A', value: 5 },
    { band: 'Leads', person: 'B', value: 1 },
    { band: 'QA', person: 'C', value: 8 },
    { band: 'QA', person: 'D', value: 7 },
    { band: 'QA', person: 'E', value: 9 },
    { band: 'Untracked', person: 'F', value: null },
  ]

  it('keeps query order by default and drops non-numeric values', () => {
    const bands = groupIntoBands(rows, 'band', 'value', 'person', 'none')
    expect(bands.map((b) => b.label)).toEqual(['Leads', 'QA', 'Untracked'])
    expect(bands[2].values).toEqual([])
  })

  it('uses the identity dimension for dot labels', () => {
    const bands = groupIntoBands(rows, 'band', 'value', 'person', 'none')
    expect(bands[0].values.map((d) => d.label)).toEqual(['A', 'B'])
  })

  it('falls back to the band label when no identity dimension is set', () => {
    const bands = groupIntoBands(rows, 'band', 'value', undefined, 'none')
    expect(bands[0].values.every((d) => d.label === 'Leads')).toBe(true)
  })

  it('sorts by median descending', () => {
    const bands = groupIntoBands(rows, 'band', 'value', 'person', 'valueDesc')
    expect(bands.map((b) => b.label)).toEqual(['QA', 'Leads', 'Untracked'])
  })

  it('sorts by median ascending, keeping empty bands last', () => {
    const bands = groupIntoBands(rows, 'band', 'value', 'person', 'valueAsc')
    expect(bands.map((b) => b.label)).toEqual(['Leads', 'QA', 'Untracked'])
  })

  it('sorts by dot count', () => {
    const bands = groupIntoBands(rows, 'band', 'value', 'person', 'count')
    expect(bands.map((b) => b.label)).toEqual(['QA', 'Leads', 'Untracked'])
  })

  it('caps bands at MAX_BANDS and dots at MAX_DOTS_PER_BAND', () => {
    const manyBands = Array.from({ length: MAX_BANDS + 10 }, (_, i) => ({
      band: `b${i}`,
      value: i,
    }))
    expect(groupIntoBands(manyBands, 'band', 'value', undefined, 'none')).toHaveLength(MAX_BANDS)

    const manyDots = Array.from({ length: MAX_DOTS_PER_BAND + 25 }, (_, i) => ({
      band: 'one',
      value: i,
    }))
    const [band] = groupIntoBands(manyDots, 'band', 'value', undefined, 'none')
    expect(band.values).toHaveLength(MAX_DOTS_PER_BAND)
    expect(band.truncated).toBe(true)
  })
})

describe('computeDomain / computeTicks', () => {
  it('pads the domain around the data', () => {
    const { min, max } = computeDomain([0, 10])
    expect(min).toBeLessThan(0)
    expect(max).toBeGreaterThan(10)
  })

  it('still produces a usable domain when every value is identical', () => {
    const { min, max } = computeDomain([5, 5, 5])
    expect(max).toBeGreaterThan(min)
  })

  it('produces evenly spaced ticks', () => {
    expect(computeTicks(0, 8, 5)).toEqual([0, 2, 4, 6, 8])
  })
})
