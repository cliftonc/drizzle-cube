import { AxisFormatConfig, ThresholdBand } from '../../types.js';
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
export declare const START_ANGLE: number;
/** Dial end: +135°, lower-right. */
export declare const END_ANGLE: number;
/** Total dial sweep in radians (270°). */
export declare const ANGLE_SPAN: number;
/** Neutral band colour for the region below every configured threshold. */
export declare const DEFAULT_FILL = "var(--dc-accent)";
/** Angular gap rendered between adjacent band segments (radians, ~2.3°). */
export declare const BAND_GAP_RADIANS = 0.04;
/**
 * Height of the 270° arc's bounding box as a multiple of its radius.
 * The arc spans y from `-r` (top) to `+r·cos45°` (the two lower tips).
 */
export declare const ARC_BBOX_HEIGHT_RATIO: number;
/** Width of the 270° arc's bounding box as a multiple of its radius. */
export declare const ARC_BBOX_WIDTH_RATIO = 2;
export declare function parseNum(v: unknown): number | null;
export declare function clamp(v: number, lo: number, hi: number): number;
/** A finite `value`, or `fallback` when it is undefined / NaN / infinite. */
export declare function finiteOr(value: number | undefined | null, fallback: number): number;
/** Map a 0–1 fraction of the range onto its dial angle. */
export declare function fractionToAngle(fraction: number): number;
export declare function valueToAngle(value: number, min: number, max: number): number;
/** Cartesian point at `angle`/`radius` in the d3 angle convention. */
export declare function polarPoint(angle: number, radius: number): {
    x: number;
    y: number;
};
export declare function resolveColor(fraction: number, thresholds: ThresholdBand[]): string;
export declare function buildArcPath(innerRadius: number, outerRadius: number, startAngle: number, endAngle: number, cornerRadius?: number): string;
/** Parse the displayConfig.thresholds value (array or JSON string) into bands. */
export declare function parseThresholds(raw: unknown): ThresholdBand[];
/** Clamp threshold fractions into [0, 1] and sort them ascending. */
export declare function normalizeThresholds(thresholds: ThresholdBand[]): ThresholdBand[];
export interface ThresholdArcBand {
    color: string;
    /** Lower bound of the band, as a 0–1 fraction of the min→max range. */
    startFraction: number;
    /** Upper bound of the band, as a 0–1 fraction of the min→max range. */
    endFraction: number;
    /** Dial angle of {@link startFraction}. */
    startAngle: number;
    /** Dial angle of {@link endFraction}. */
    endAngle: number;
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
export declare function buildThresholdBands(thresholds: ThresholdBand[]): ThresholdArcBand[];
export interface GaugeBandSegment {
    color: string;
    startAngle: number;
    endAngle: number;
}
/**
 * Turn logical bands into drawable segments by inserting a gap at every
 * *internal* boundary (the dial's outer ends keep the full 270° sweep).
 * Segments too narrow to render cleanly with rounded caps are dropped.
 */
export declare function buildBandSegments(bands: ThresholdArcBand[], gap?: number): GaugeBandSegment[];
export interface GaugeScaleTick {
    fraction: number;
    value: number;
    angle: number;
}
/**
 * Numeric scale ticks at the band boundaries (plus the dial's start and end).
 * Ticks are thinned back-to-front so the max is always kept and no two labels
 * collide.
 */
export declare function buildScaleTicks(bands: ThresholdArcBand[], minValue: number, maxValue: number): GaugeScaleTick[];
/** Triangular needle: wide at the hub, tapering to a point at `length`. */
export declare function buildNeedlePath(angle: number, length: number, halfWidth: number): string;
export interface GaugeLayout {
    /** Dial centre in SVG coordinates. */
    cx: number;
    cy: number;
    radius: number;
    outerRadius: number;
    innerRadius: number;
    /** Corner radius that fully rounds a band segment's ends. */
    bandCornerRadius: number;
    /** Radius at which scale tick labels are centred (just inside the band). */
    tickRadius: number;
    needleLength: number;
    needleHalfWidth: number;
    hubRadius: number;
    tickFontSize: number;
    labelFontSize: number;
    labelY: number;
    valueFontSize: number;
    valueY: number;
}
/**
 * Size and position the dial so its 270° bounding box is centred in, and fits
 * inside, a `width` x `height` box. Everything else is expressed as a ratio of
 * the resulting radius so the gauge scales smoothly.
 */
export declare function computeGaugeLayout(width: number, height: number): GaugeLayout;
export interface GaugeGeometry {
    effectiveMax: number;
    clampedValue: number;
    fraction: number;
    fillColor: string;
    needleAngle: number;
}
/** Compute the gauge's clamped value, fraction, indicated colour and angle. */
export declare function computeGaugeGeometry(rawValue: number, minValue: number, maxValue: number, thresholds: ThresholdBand[]): GaugeGeometry;
/**
 * Format a gauge value. With a configured axis format this honours its unit,
 * decimals and abbreviation (so a percent format renders `66.9%`); without one
 * it falls back to the shared default numeric formatting (`66.94`).
 */
export declare function formatGaugeValue(value: number, yAxisFormat?: AxisFormatConfig): string;
