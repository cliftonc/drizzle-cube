import { arc } from 'd3-shape'
import { formatAxisValue } from '../../utils/chartUtils.js'
import type { AxisFormatConfig, ThresholdBand } from '../../types.js'

/**
 * Co-located geometry/value maths for {@link GaugeChart}.
 *
 * Everything here is pure so the component stays declarative: it reads a
 * layout, a list of band segments, a list of scale ticks and a needle path,
 * then renders them.
 *
 * ## Angle convention
 * d3-shape's: `0` points at 12 o'clock and positive angles run clockwise. The
 * dial sweeps 270°, from `START_ANGLE` (-135°, lower-left) to `END_ANGLE`
 * (+135°, lower-right).
 *
 * ## Threshold semantics
 * A {@link ThresholdBand}'s `value` is the **lower bound** of its band, as a
 * 0–1 fraction of the min→max range. So `[{0, red}, {0.5, amber}, {0.7, green}]`
 * paints 0–50% red, 50–70% amber and 70–100% green. This matches
 * {@link resolveColor}, and the invariant
 * `bandContaining(f).color === resolveColor(f)` holds for every `f` in [0, 1).
 */

/** Dial start: -135°, lower-left. */
export const START_ANGLE = -Math.PI * 0.75
/** Dial end: +135°, lower-right. */
export const END_ANGLE = Math.PI * 0.75
/** Total dial sweep in radians (270°). */
export const ANGLE_SPAN = END_ANGLE - START_ANGLE

/** Neutral band colour for the region below every configured threshold. */
export const DEFAULT_FILL = 'var(--dc-accent)'
/** Angular gap rendered between adjacent band segments (radians, ~2.3°). */
export const BAND_GAP_RADIANS = 0.04
/** Band segments narrower than this (after the gap) are not drawn. */
const MIN_SEGMENT_ANGLE = 0.02
/**
 * Minimum angular separation between two rendered scale ticks (~22°). Keeps
 * labels from colliding on a dial configured with many thresholds.
 */
const MIN_TICK_SEPARATION = 0.38
/** Fractions closer together than this are treated as the same boundary. */
const FRACTION_EPSILON = 1e-6

/**
 * Height of the 270° arc's bounding box as a multiple of its radius.
 * The arc spans y from `-r` (top) to `+r·cos45°` (the two lower tips).
 */
export const ARC_BBOX_HEIGHT_RATIO = 1 + Math.SQRT1_2
/** Width of the 270° arc's bounding box as a multiple of its radius. */
export const ARC_BBOX_WIDTH_RATIO = 2
/** Fraction of the available box the dial occupies, leaving a little breathing room. */
const DIAL_MARGIN = 0.94

export function parseNum(v: unknown): number | null {
  if (v === undefined || v === null) return null
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return isNaN(n) ? null : n
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

/** A finite `value`, or `fallback` when it is undefined / NaN / infinite. */
export function finiteOr(value: number | undefined | null, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/** Map a 0–1 fraction of the range onto its dial angle. */
export function fractionToAngle(fraction: number): number {
  return START_ANGLE + clamp(fraction, 0, 1) * ANGLE_SPAN
}

export function valueToAngle(value: number, min: number, max: number): number {
  const span = max === min ? 1 : max - min
  return fractionToAngle((value - min) / span)
}

/** Cartesian point at `angle`/`radius` in the d3 angle convention. */
export function polarPoint(angle: number, radius: number): { x: number; y: number } {
  return { x: Math.sin(angle) * radius, y: -Math.cos(angle) * radius }
}

export function resolveColor(fraction: number, thresholds: ThresholdBand[]): string {
  const sorted = normalizeThresholds(thresholds)
  let color = DEFAULT_FILL
  for (const t of sorted) {
    if (fraction >= t.value) color = t.color
  }
  return color
}

export function buildArcPath(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
  cornerRadius = 0
): string {
  const pathFn = arc().cornerRadius(cornerRadius)
  return pathFn({ innerRadius, outerRadius, startAngle, endAngle }) ?? ''
}

function isThresholdBand(entry: unknown): entry is ThresholdBand {
  return (
    entry !== null &&
    typeof entry === 'object' &&
    typeof (entry as ThresholdBand).value === 'number' &&
    Number.isFinite((entry as ThresholdBand).value) &&
    typeof (entry as ThresholdBand).color === 'string' &&
    (entry as ThresholdBand).color.trim() !== ''
  )
}

/** Parse the displayConfig.thresholds value (array or JSON string) into bands. */
export function parseThresholds(raw: unknown): ThresholdBand[] {
  let arr: unknown[] | null = null
  if (Array.isArray(raw)) {
    arr = raw
  } else if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) arr = parsed
    } catch (e) {
      console.warn('GaugeChart: invalid threshold JSON', e)
      return []
    }
  }
  if (!arr) return []
  return arr.filter(isThresholdBand)
}

/** Clamp threshold fractions into [0, 1] and sort them ascending. */
export function normalizeThresholds(thresholds: ThresholdBand[]): ThresholdBand[] {
  return thresholds
    .map((t) => ({ color: t.color, value: clamp(t.value, 0, 1) }))
    .sort((a, b) => a.value - b.value)
}

export interface ThresholdArcBand {
  color: string
  /** Lower bound of the band, as a 0–1 fraction of the min→max range. */
  startFraction: number
  /** Upper bound of the band, as a 0–1 fraction of the min→max range. */
  endFraction: number
  /** Dial angle of {@link startFraction}. */
  startAngle: number
  /** Dial angle of {@link endFraction}. */
  endAngle: number
}

/**
 * Split the dial into coloured bands. The bands tile the whole 0–1 range with
 * no holes: a leading neutral band covers anything below the first threshold,
 * and the last threshold's band runs to 1. Zero-width bands (duplicate
 * thresholds, or one pinned at 1) are dropped.
 *
 * With no thresholds configured the dial is a single neutral band, so the
 * gauge still renders a full arc.
 */
export function buildThresholdBands(thresholds: ThresholdBand[]): ThresholdArcBand[] {
  const sorted = normalizeThresholds(thresholds)
  const spans: { color: string; startFraction: number; endFraction: number }[] = []

  if (sorted.length === 0) {
    spans.push({ color: DEFAULT_FILL, startFraction: 0, endFraction: 1 })
  } else {
    if (sorted[0].value > FRACTION_EPSILON) {
      spans.push({ color: DEFAULT_FILL, startFraction: 0, endFraction: sorted[0].value })
    }
    sorted.forEach((t, i) => {
      spans.push({
        color: t.color,
        startFraction: t.value,
        endFraction: i < sorted.length - 1 ? sorted[i + 1].value : 1
      })
    })
  }

  return spans
    .filter((s) => s.endFraction - s.startFraction > FRACTION_EPSILON)
    .map((s) => ({
      ...s,
      startAngle: fractionToAngle(s.startFraction),
      endAngle: fractionToAngle(s.endFraction)
    }))
}

export interface GaugeBandSegment {
  color: string
  startAngle: number
  endAngle: number
}

/**
 * Turn logical bands into drawable segments by inserting a gap at every
 * *internal* boundary (the dial's outer ends keep the full 270° sweep).
 * Segments too narrow to render cleanly with rounded caps are dropped.
 */
export function buildBandSegments(
  bands: ThresholdArcBand[],
  gap = BAND_GAP_RADIANS
): GaugeBandSegment[] {
  const half = Math.max(gap, 0) / 2
  return bands
    .map((band, i) => ({
      color: band.color,
      startAngle: band.startAngle + (i === 0 ? 0 : half),
      endAngle: band.endAngle + (i === bands.length - 1 ? 0 : -half)
    }))
    .filter((s) => s.endAngle - s.startAngle >= MIN_SEGMENT_ANGLE)
}

export interface GaugeScaleTick {
  fraction: number
  value: number
  angle: number
}

/**
 * Numeric scale ticks at the band boundaries (plus the dial's start and end).
 * Ticks are thinned back-to-front so the max is always kept and no two labels
 * collide.
 */
export function buildScaleTicks(
  bands: ThresholdArcBand[],
  minValue: number,
  maxValue: number
): GaugeScaleTick[] {
  const fractions: number[] = [0]
  for (const band of bands) fractions.push(band.startFraction, band.endFraction)
  fractions.push(1)

  const unique = [...fractions]
    .sort((a, b) => a - b)
    .filter((f, i, all) => i === 0 || f - all[i - 1] > FRACTION_EPSILON)

  const kept: number[] = []
  for (let i = unique.length - 1; i >= 0; i--) {
    const angle = fractionToAngle(unique[i])
    const last = kept.length > 0 ? fractionToAngle(kept[kept.length - 1]) : null
    if (last === null || last - angle >= MIN_TICK_SEPARATION) kept.push(unique[i])
  }

  return kept
    .reverse()
    .map((fraction) => ({
      fraction,
      value: minValue + fraction * (maxValue - minValue),
      angle: fractionToAngle(fraction)
    }))
}

/** Triangular needle: wide at the hub, tapering to a point at `length`. */
export function buildNeedlePath(angle: number, length: number, halfWidth: number): string {
  const tip = polarPoint(angle, length)
  const perpX = Math.cos(angle)
  const perpY = Math.sin(angle)
  const round = (n: number) => Number(n.toFixed(3))
  return [
    `M${round(tip.x)},${round(tip.y)}`,
    `L${round(perpX * halfWidth)},${round(perpY * halfWidth)}`,
    `L${round(-perpX * halfWidth)},${round(-perpY * halfWidth)}`,
    'Z'
  ].join('')
}

export interface GaugeLayout {
  /** Dial centre in SVG coordinates. */
  cx: number
  cy: number
  radius: number
  outerRadius: number
  innerRadius: number
  /** Corner radius that fully rounds a band segment's ends. */
  bandCornerRadius: number
  /** Radius at which scale tick labels are centred (just inside the band). */
  tickRadius: number
  needleLength: number
  needleHalfWidth: number
  hubRadius: number
  tickFontSize: number
  labelFontSize: number
  labelY: number
  valueFontSize: number
  valueY: number
}

/**
 * Size and position the dial so its 270° bounding box is centred in, and fits
 * inside, a `width` x `height` box. Everything else is expressed as a ratio of
 * the resulting radius so the gauge scales smoothly.
 */
export function computeGaugeLayout(width: number, height: number): GaugeLayout {
  const w = Math.max(finiteOr(width, 0), 1)
  const h = Math.max(finiteOr(height, 0), 1)
  const radius = Math.max(
    1,
    Math.min(w / ARC_BBOX_WIDTH_RATIO, h / ARC_BBOX_HEIGHT_RATIO) * DIAL_MARGIN
  )
  const outerRadius = radius
  const innerRadius = radius * 0.8

  return {
    cx: w / 2,
    // Shift down so the bbox (which extends further above the centre than
    // below it) is vertically centred.
    cy: h / 2 + radius * (1 - ARC_BBOX_HEIGHT_RATIO / 2),
    radius,
    outerRadius,
    innerRadius,
    bandCornerRadius: (outerRadius - innerRadius) / 2,
    tickRadius: radius * 0.7,
    needleLength: radius * 0.56,
    needleHalfWidth: radius * 0.055,
    hubRadius: radius * 0.075,
    tickFontSize: radius * 0.095,
    labelFontSize: radius * 0.1,
    labelY: radius * 0.28,
    valueFontSize: radius * 0.165,
    valueY: radius * 0.52
  }
}

export interface GaugeGeometry {
  effectiveMax: number
  clampedValue: number
  fraction: number
  fillColor: string
  needleAngle: number
}

/** Compute the gauge's clamped value, fraction, indicated colour and angle. */
export function computeGaugeGeometry(
  rawValue: number,
  minValue: number,
  maxValue: number,
  thresholds: ThresholdBand[]
): GaugeGeometry {
  const min = finiteOr(minValue, 0)
  const max = finiteOr(maxValue, min + 1)
  const effectiveMax = max <= min ? min + 1 : max
  const clampedValue = clamp(finiteOr(rawValue, min), min, effectiveMax)
  const fraction = clamp((clampedValue - min) / (effectiveMax - min), 0, 1)
  return {
    effectiveMax,
    clampedValue,
    fraction,
    fillColor: resolveColor(fraction, thresholds),
    needleAngle: fractionToAngle(fraction)
  }
}

/**
 * Format a gauge value. With a configured axis format this honours its unit,
 * decimals and abbreviation (so a percent format renders `66.9%`); without one
 * it falls back to the shared default numeric formatting (`66.94`).
 */
export function formatGaugeValue(value: number, yAxisFormat?: AxisFormatConfig): string {
  return formatAxisValue(value, yAxisFormat)
}
