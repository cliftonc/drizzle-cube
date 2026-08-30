/**
 * Tests for the gauge chart's geometry seam (`gaugeChartHelpers`).
 *
 * The component is a thin renderer over these functions, so this is where the
 * real coverage lives: angle mapping, band generation, scale ticks, needle
 * geometry, layout fit, and the degenerate configurations the gauge must
 * survive (no thresholds, one threshold, out-of-range values, min === max,
 * NaN / null values).
 */

import { describe, it, expect } from 'vitest'
import {
  START_ANGLE,
  END_ANGLE,
  ANGLE_SPAN,
  DEFAULT_FILL,
  BAND_GAP_RADIANS,
  ARC_BBOX_HEIGHT_RATIO,
  parseNum,
  clamp,
  finiteOr,
  fractionToAngle,
  valueToAngle,
  polarPoint,
  resolveColor,
  parseThresholds,
  normalizeThresholds,
  buildThresholdBands,
  buildBandSegments,
  buildScaleTicks,
  buildNeedlePath,
  buildArcPath,
  computeGaugeLayout,
  computeGaugeGeometry,
  formatGaugeValue,
} from '../../../src/client/components/charts/gaugeChartHelpers'
import type { ThresholdBand } from '../../../src/client/types'

const RED = '#ef4444'
const AMBER = '#f59e0b'
const GREEN = '#22c55e'

/** The try-site's real configuration: lower-bound thresholds at 0 / 0.5 / 0.7. */
const RAG: ThresholdBand[] = [
  { value: 0, color: RED },
  { value: 0.5, color: AMBER },
  { value: 0.7, color: GREEN },
]

describe('gaugeChartHelpers', () => {
  describe('dial constants', () => {
    it('sweeps 270 degrees from lower-left to lower-right', () => {
      expect(START_ANGLE).toBeCloseTo(-Math.PI * 0.75, 10)
      expect(END_ANGLE).toBeCloseTo(Math.PI * 0.75, 10)
      expect(ANGLE_SPAN).toBeCloseTo((270 * Math.PI) / 180, 10)
    })
  })

  describe('parseNum', () => {
    it('parses numbers and numeric strings', () => {
      expect(parseNum(42)).toBe(42)
      expect(parseNum('42.5')).toBe(42.5)
    })

    it('returns null for null, undefined and non-numeric input', () => {
      expect(parseNum(null)).toBeNull()
      expect(parseNum(undefined)).toBeNull()
      expect(parseNum('abc')).toBeNull()
      expect(parseNum(NaN)).toBeNull()
    })
  })

  describe('clamp / finiteOr', () => {
    it('clamps into range', () => {
      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(-5, 0, 10)).toBe(0)
      expect(clamp(15, 0, 10)).toBe(10)
    })

    it('falls back for non-finite values', () => {
      expect(finiteOr(7, 0)).toBe(7)
      expect(finiteOr(0, 99)).toBe(0)
      expect(finiteOr(undefined, 99)).toBe(99)
      expect(finiteOr(null, 99)).toBe(99)
      expect(finiteOr(NaN, 99)).toBe(99)
      expect(finiteOr(Infinity, 99)).toBe(99)
    })
  })

  describe('angle mapping', () => {
    it('maps min / mid / max onto start / top / end of the dial', () => {
      expect(valueToAngle(0, 0, 100)).toBeCloseTo(START_ANGLE, 10)
      expect(valueToAngle(50, 0, 100)).toBeCloseTo(0, 10)
      expect(valueToAngle(100, 0, 100)).toBeCloseTo(END_ANGLE, 10)
    })

    it('clamps values outside the range onto the dial ends', () => {
      expect(valueToAngle(-50, 0, 100)).toBeCloseTo(START_ANGLE, 10)
      expect(valueToAngle(9999, 0, 100)).toBeCloseTo(END_ANGLE, 10)
    })

    it('does not divide by zero when min === max', () => {
      const angle = valueToAngle(5, 5, 5)
      expect(Number.isFinite(angle)).toBe(true)
      expect(angle).toBeCloseTo(START_ANGLE, 10)
    })

    it('fractionToAngle clamps its input', () => {
      expect(fractionToAngle(-1)).toBeCloseTo(START_ANGLE, 10)
      expect(fractionToAngle(0.5)).toBeCloseTo(0, 10)
      expect(fractionToAngle(2)).toBeCloseTo(END_ANGLE, 10)
    })
  })

  describe('polarPoint', () => {
    it('uses the d3 convention: 0 is 12 o\'clock, positive is clockwise', () => {
      expect(polarPoint(0, 10)).toEqual({ x: expect.closeTo(0, 10), y: expect.closeTo(-10, 10) })
      expect(polarPoint(Math.PI / 2, 10)).toEqual({ x: expect.closeTo(10, 10), y: expect.closeTo(0, 10) })
      expect(polarPoint(START_ANGLE, 10)).toEqual({
        x: expect.closeTo(-7.0711, 3),
        y: expect.closeTo(7.0711, 3),
      })
    })
  })

  describe('parseThresholds', () => {
    it('accepts an array of bands', () => {
      expect(parseThresholds(RAG)).toEqual(RAG)
    })

    it('accepts a JSON string', () => {
      expect(parseThresholds(JSON.stringify(RAG))).toEqual(RAG)
    })

    it('returns [] for invalid JSON, non-arrays, empty and nullish input', () => {
      expect(parseThresholds('not json')).toEqual([])
      expect(parseThresholds('{"value":0.5}')).toEqual([])
      expect(parseThresholds('')).toEqual([])
      expect(parseThresholds(undefined)).toEqual([])
      expect(parseThresholds(null)).toEqual([])
    })

    it('drops malformed entries', () => {
      const raw = [
        { value: 0.5, color: AMBER },
        { value: 'x', color: RED },
        { value: 0.2 },
        { color: GREEN },
        { value: NaN, color: RED },
        { value: 0.9, color: '   ' },
        null,
      ]
      expect(parseThresholds(raw)).toEqual([{ value: 0.5, color: AMBER }])
    })
  })

  describe('normalizeThresholds', () => {
    it('sorts ascending and clamps values into 0..1', () => {
      expect(
        normalizeThresholds([
          { value: 2, color: GREEN },
          { value: -1, color: RED },
          { value: 0.5, color: AMBER },
        ])
      ).toEqual([
        { value: 0, color: RED },
        { value: 0.5, color: AMBER },
        { value: 1, color: GREEN },
      ])
    })
  })

  describe('resolveColor', () => {
    it('treats a threshold value as the band lower bound', () => {
      expect(resolveColor(0, RAG)).toBe(RED)
      expect(resolveColor(0.49, RAG)).toBe(RED)
      expect(resolveColor(0.5, RAG)).toBe(AMBER)
      expect(resolveColor(0.69, RAG)).toBe(AMBER)
      expect(resolveColor(0.7, RAG)).toBe(GREEN)
      expect(resolveColor(1, RAG)).toBe(GREEN)
    })

    it('falls back to the neutral fill with no thresholds', () => {
      expect(resolveColor(0.5, [])).toBe(DEFAULT_FILL)
    })

    it('falls back to the neutral fill below the first threshold', () => {
      expect(resolveColor(0.1, [{ value: 0.5, color: AMBER }])).toBe(DEFAULT_FILL)
    })
  })

  describe('buildThresholdBands', () => {
    it('tiles the dial with one band per threshold', () => {
      const bands = buildThresholdBands(RAG)
      expect(bands).toHaveLength(3)
      expect(bands.map(b => [b.color, b.startFraction, b.endFraction])).toEqual([
        [RED, 0, 0.5],
        [AMBER, 0.5, 0.7],
        [GREEN, 0.7, 1],
      ])
      expect(bands[0].startAngle).toBeCloseTo(START_ANGLE, 10)
      expect(bands[2].endAngle).toBeCloseTo(END_ANGLE, 10)
    })

    it('leaves no gaps: each band starts where the previous ended', () => {
      const bands = buildThresholdBands(RAG)
      for (let i = 1; i < bands.length; i++) {
        expect(bands[i].startFraction).toBeCloseTo(bands[i - 1].endFraction, 10)
      }
    })

    it('renders one neutral band covering the whole dial with no thresholds', () => {
      const bands = buildThresholdBands([])
      expect(bands).toEqual([
        {
          color: DEFAULT_FILL,
          startFraction: 0,
          endFraction: 1,
          startAngle: START_ANGLE,
          endAngle: END_ANGLE,
        },
      ])
    })

    it('prepends a neutral band when the first threshold is above 0', () => {
      const bands = buildThresholdBands([{ value: 0.6, color: GREEN }])
      expect(bands.map(b => [b.color, b.startFraction, b.endFraction])).toEqual([
        [DEFAULT_FILL, 0, 0.6],
        [GREEN, 0.6, 1],
      ])
    })

    it('renders a single threshold at 0 as one full-dial band', () => {
      const bands = buildThresholdBands([{ value: 0, color: GREEN }])
      expect(bands.map(b => [b.color, b.startFraction, b.endFraction])).toEqual([
        [GREEN, 0, 1],
      ])
    })

    it('drops zero-width bands from duplicate thresholds', () => {
      const bands = buildThresholdBands([
        { value: 0.5, color: RED },
        { value: 0.5, color: AMBER },
      ])
      expect(bands.map(b => [b.color, b.startFraction, b.endFraction])).toEqual([
        [DEFAULT_FILL, 0, 0.5],
        [AMBER, 0.5, 1],
      ])
    })

    it('drops a zero-width band pinned at the top of the range', () => {
      const bands = buildThresholdBands([
        { value: 0, color: RED },
        { value: 1, color: GREEN },
      ])
      expect(bands.map(b => [b.color, b.startFraction, b.endFraction])).toEqual([
        [RED, 0, 1],
      ])
    })

    it('sorts unsorted thresholds', () => {
      const bands = buildThresholdBands([
        { value: 0.7, color: GREEN },
        { value: 0, color: RED },
        { value: 0.5, color: AMBER },
      ])
      expect(bands.map(b => b.color)).toEqual([RED, AMBER, GREEN])
    })

    it('agrees with resolveColor for every fraction in the range', () => {
      for (const thresholds of [RAG, [], [{ value: 0.6, color: GREEN }]]) {
        const bands = buildThresholdBands(thresholds)
        for (let f = 0; f < 1; f += 0.01) {
          const band = bands.find(b => f >= b.startFraction && f < b.endFraction)
          expect(band, `no band contains fraction ${f}`).toBeDefined()
          expect(band?.color, `band colour mismatch at fraction ${f}`).toBe(
            resolveColor(f, thresholds)
          )
        }
      }
    })
  })

  describe('buildBandSegments', () => {
    it('inserts a gap at internal boundaries only', () => {
      const bands = buildThresholdBands(RAG)
      const segments = buildBandSegments(bands)
      const half = BAND_GAP_RADIANS / 2

      expect(segments).toHaveLength(3)
      expect(segments[0].startAngle).toBeCloseTo(START_ANGLE, 10)
      expect(segments[2].endAngle).toBeCloseTo(END_ANGLE, 10)

      for (let i = 1; i < segments.length; i++) {
        expect(segments[i].startAngle - segments[i - 1].endAngle).toBeCloseTo(BAND_GAP_RADIANS, 10)
        expect(segments[i].startAngle).toBeCloseTo(bands[i].startAngle + half, 10)
      }
    })

    it('never renders an inverted segment', () => {
      const thresholds = Array.from({ length: 40 }, (_, i) => ({
        value: i / 40,
        color: i % 2 ? RED : GREEN,
      }))
      const segments = buildBandSegments(buildThresholdBands(thresholds))
      for (const s of segments) expect(s.endAngle).toBeGreaterThan(s.startAngle)
    })

    it('drops segments too narrow to draw', () => {
      const bands = buildThresholdBands([
        { value: 0, color: RED },
        { value: 0.0005, color: AMBER },
      ])
      expect(bands).toHaveLength(2)
      expect(buildBandSegments(bands).map(s => s.color)).toEqual([AMBER])
    })

    it('returns a single full-sweep segment with no thresholds', () => {
      const segments = buildBandSegments(buildThresholdBands([]))
      expect(segments).toHaveLength(1)
      expect(segments[0].startAngle).toBeCloseTo(START_ANGLE, 10)
      expect(segments[0].endAngle).toBeCloseTo(END_ANGLE, 10)
    })
  })

  describe('buildScaleTicks', () => {
    it('labels the band boundaries plus the dial ends', () => {
      const ticks = buildScaleTicks(buildThresholdBands(RAG), 0, 100)
      expect(ticks.map(t => t.value)).toEqual([0, 50, 70, 100])
      expect(ticks[0].angle).toBeCloseTo(START_ANGLE, 10)
      expect(ticks[ticks.length - 1].angle).toBeCloseTo(END_ANGLE, 10)
    })

    it('scales boundary fractions into the configured value range', () => {
      const ticks = buildScaleTicks(buildThresholdBands(RAG), 50, 150)
      expect(ticks.map(t => t.value)).toEqual([50, 100, 120, 150])
    })

    it('still labels min and max with no thresholds', () => {
      expect(buildScaleTicks(buildThresholdBands([]), 0, 100).map(t => t.value)).toEqual([0, 100])
    })

    it('thins crowded ticks but always keeps the maximum', () => {
      const thresholds = Array.from({ length: 50 }, (_, i) => ({
        value: i / 50,
        color: GREEN,
      }))
      const ticks = buildScaleTicks(buildThresholdBands(thresholds), 0, 100)
      expect(ticks.length).toBeLessThanOrEqual(14)
      expect(ticks[ticks.length - 1].fraction).toBe(1)
      for (let i = 1; i < ticks.length; i++) {
        expect(ticks[i].angle - ticks[i - 1].angle).toBeGreaterThanOrEqual(0.38)
      }
    })

    it('produces finite values when min === max', () => {
      const ticks = buildScaleTicks(buildThresholdBands(RAG), 5, 5)
      expect(ticks.every(t => Number.isFinite(t.value))).toBe(true)
      expect(ticks.every(t => t.value === 5)).toBe(true)
    })
  })

  describe('buildNeedlePath', () => {
    it('points straight up at the mid-point of the dial', () => {
      const d = buildNeedlePath(fractionToAngle(0.5), 100, 10)
      expect(d.startsWith('M0,-100')).toBe(true)
      expect(d.endsWith('Z')).toBe(true)
    })

    it('points at the dial ends for min and max', () => {
      const min = buildNeedlePath(fractionToAngle(0), 100, 10)
      const max = buildNeedlePath(fractionToAngle(1), 100, 10)
      expect(min.startsWith('M-70.711,70.711')).toBe(true)
      expect(max.startsWith('M70.711,70.711')).toBe(true)
    })

    it('is a closed triangle whose base straddles the hub', () => {
      const d = buildNeedlePath(0, 100, 10)
      expect(d).toBe('M0,-100L10,0L-10,0Z')
    })

    it('emits only finite coordinates for every dial angle', () => {
      for (let f = 0; f <= 1; f += 0.05) {
        const d = buildNeedlePath(fractionToAngle(f), 50, 5)
        expect(d).not.toMatch(/NaN|Infinity/)
      }
    })
  })

  describe('buildArcPath', () => {
    it('produces a path for a rounded band segment', () => {
      const d = buildArcPath(80, 100, START_ANGLE, 0, 10)
      expect(d).toMatch(/^M/)
      expect(d).not.toMatch(/NaN/)
    })

    it('returns a string for a degenerate (zero-length) arc', () => {
      expect(typeof buildArcPath(80, 100, 0, 0, 10)).toBe('string')
    })
  })

  describe('computeGaugeLayout', () => {
    const cases: [string, number, number][] = [
      ['wide', 600, 200],
      ['square', 300, 300],
      ['tall', 200, 500],
      ['short', 400, 120],
      ['tiny', 20, 20],
    ]

    it.each(cases)('keeps the 270° arc inside a %s container', (_label, w, h) => {
      const { cx, cy, radius, outerRadius } = computeGaugeLayout(w, h)
      // Arc bbox: x in [cx-r, cx+r], y in [cy-r, cy+r*cos45°].
      expect(cx - outerRadius).toBeGreaterThanOrEqual(-0.001)
      expect(cx + outerRadius).toBeLessThanOrEqual(w + 0.001)
      expect(cy - outerRadius).toBeGreaterThanOrEqual(-0.001)
      expect(cy + outerRadius * Math.SQRT1_2).toBeLessThanOrEqual(h + 0.001)
      expect(radius).toBeGreaterThan(0)
    })

    it.each(cases)('vertically centres the arc bbox in a %s container', (_label, w, h) => {
      const { cy, radius } = computeGaugeLayout(w, h)
      const bboxCentre = cy - radius + (radius * ARC_BBOX_HEIGHT_RATIO) / 2
      expect(bboxCentre).toBeCloseTo(h / 2, 6)
    })

    it('never produces non-finite or zero geometry for degenerate sizes', () => {
      for (const [w, h] of [[0, 0], [NaN, NaN], [-10, -10], [Infinity, 100]]) {
        const layout = computeGaugeLayout(w, h)
        for (const [key, value] of Object.entries(layout)) {
          expect(Number.isFinite(value), `${key} is not finite for ${w}x${h}`).toBe(true)
        }
        expect(layout.radius).toBeGreaterThan(0)
        expect(layout.innerRadius).toBeLessThan(layout.outerRadius)
      }
    })

    it('rounds band ends fully (corner radius is half the band thickness)', () => {
      const { innerRadius, outerRadius, bandCornerRadius } = computeGaugeLayout(400, 300)
      expect(bandCornerRadius).toBeCloseTo((outerRadius - innerRadius) / 2, 10)
    })

    it('keeps the needle and the labels inside the inner radius', () => {
      const l = computeGaugeLayout(400, 300)
      expect(l.needleLength).toBeLessThan(l.innerRadius)
      expect(l.tickRadius).toBeLessThan(l.innerRadius)
      expect(l.labelY).toBeLessThan(l.valueY)
      expect(l.valueY).toBeLessThan(l.innerRadius)
    })
  })

  describe('computeGaugeGeometry', () => {
    it('maps a mid-range value to the top of the dial', () => {
      const g = computeGaugeGeometry(50, 0, 100, RAG)
      expect(g.fraction).toBeCloseTo(0.5, 10)
      expect(g.needleAngle).toBeCloseTo(0, 10)
      expect(g.fillColor).toBe(AMBER)
    })

    it('maps min and max to the dial ends', () => {
      expect(computeGaugeGeometry(0, 0, 100, RAG).needleAngle).toBeCloseTo(START_ANGLE, 10)
      expect(computeGaugeGeometry(100, 0, 100, RAG).needleAngle).toBeCloseTo(END_ANGLE, 10)
    })

    it('clamps a value below min and above max', () => {
      const low = computeGaugeGeometry(-500, 0, 100, RAG)
      expect(low.fraction).toBe(0)
      expect(low.clampedValue).toBe(0)
      expect(low.needleAngle).toBeCloseTo(START_ANGLE, 10)

      const high = computeGaugeGeometry(500, 0, 100, RAG)
      expect(high.fraction).toBe(1)
      expect(high.clampedValue).toBe(100)
      expect(high.needleAngle).toBeCloseTo(END_ANGLE, 10)
    })

    it('survives min === max without dividing by zero', () => {
      const g = computeGaugeGeometry(5, 5, 5, RAG)
      expect(g.effectiveMax).toBe(6)
      expect(Number.isFinite(g.fraction)).toBe(true)
      expect(g.fraction).toBe(0)
    })

    it('survives an inverted range (max < min)', () => {
      const g = computeGaugeGeometry(10, 100, 0, RAG)
      expect(g.effectiveMax).toBe(101)
      expect(Number.isFinite(g.fraction)).toBe(true)
      expect(g.fraction).toBe(0)
    })

    it('survives a non-finite value or range', () => {
      for (const g of [
        computeGaugeGeometry(NaN, 0, 100, RAG),
        computeGaugeGeometry(Infinity, 0, 100, RAG),
        computeGaugeGeometry(50, NaN, NaN, RAG),
      ]) {
        expect(Number.isFinite(g.fraction)).toBe(true)
        expect(Number.isFinite(g.needleAngle)).toBe(true)
        expect(g.fraction).toBeGreaterThanOrEqual(0)
        expect(g.fraction).toBeLessThanOrEqual(1)
      }
    })

    it('uses the neutral fill with no thresholds', () => {
      expect(computeGaugeGeometry(50, 0, 100, []).fillColor).toBe(DEFAULT_FILL)
    })

    it('agrees with the band that contains the needle', () => {
      const bands = buildThresholdBands(RAG)
      for (const raw of [0, 10, 49.9, 50, 66.937, 69.9, 70, 99.9]) {
        const g = computeGaugeGeometry(raw, 0, 100, RAG)
        const band = bands.find(b => g.fraction >= b.startFraction && g.fraction < b.endFraction)
        expect(band?.color, `mismatch at raw value ${raw}`).toBe(g.fillColor)
      }
    })
  })

  describe('formatGaugeValue', () => {
    it('honours a percent axis format', () => {
      expect(formatGaugeValue(66.937, { unit: 'percent', decimals: 1 })).toBe('66.9%')
    })

    it('honours a currency axis format', () => {
      expect(formatGaugeValue(1250, { unit: 'currency', decimals: 0, abbreviate: false })).toContain('1,250')
    })

    it('falls back to default numeric formatting with no axis format', () => {
      expect(formatGaugeValue(66.937)).toBe('66.94')
      expect(formatGaugeValue(1000)).toBe('1,000')
    })
  })
})
