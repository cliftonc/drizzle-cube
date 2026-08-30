/**
 * Tests for the angled X-axis height calculation.
 *
 * AngledXAxisTick rotates its label -45deg, so the vertical space needed is the
 * label's width projected onto the vertical plus the tick's dy offset. The
 * height used to be hardcoded at 60px, which clipped longer labels: a date like
 * "2026-08-24" needs roughly 63px.
 */

import { describe, it, expect } from 'vitest'
import {
  resolveAngledAxisHeight,
  MIN_ANGLED_AXIS_HEIGHT,
  MAX_ANGLED_AXIS_HEIGHT
} from '../../../src/client/components/charts/chartScaffolding'
import { MAX_TICK_LABEL_CHARS } from '../../../src/client/components/charts/AngledXAxisTick'

describe('resolveAngledAxisHeight', () => {
  it('keeps the floor for short labels', () => {
    expect(resolveAngledAxisHeight(['Q1', 'Q2', 'Q3'])).toBe(MIN_ANGLED_AXIS_HEIGHT)
  })

  it('reserves more than the old fixed height for full dates', () => {
    // The regression: these were clipped at a hardcoded 60px.
    expect(resolveAngledAxisHeight(['2026-08-24', '2024-01-01']))
      .toBeGreaterThan(MIN_ANGLED_AXIS_HEIGHT)
  })

  it('sizes from the longest label, not the first', () => {
    const short = resolveAngledAxisHeight(['Jan'])
    const mixed = resolveAngledAxisHeight(['Jan', 'a-very-long-category'])
    expect(mixed).toBeGreaterThan(short)
  })

  it('never exceeds the cap, so one long label cannot squeeze the plot', () => {
    expect(resolveAngledAxisHeight(['x'.repeat(200)])).toBe(MAX_ANGLED_AXIS_HEIGHT)
  })

  it('ignores null and undefined values', () => {
    expect(resolveAngledAxisHeight([undefined, null as unknown as string, 'Q1']))
      .toBe(MIN_ANGLED_AXIS_HEIGHT)
  })

  it('falls back to the floor for an empty axis', () => {
    expect(resolveAngledAxisHeight([])).toBe(MIN_ANGLED_AXIS_HEIGHT)
  })

  it('reserves enough height for the longest label it will actually draw', () => {
    // Beyond MAX_TICK_LABEL_CHARS the tick truncates, so the cap and the
    // truncation point must agree - otherwise labels clip again.
    const atCap = resolveAngledAxisHeight(['x'.repeat(MAX_TICK_LABEL_CHARS)])
    expect(atCap).toBeLessThanOrEqual(MAX_ANGLED_AXIS_HEIGHT)
  })
})
