import { default as React } from 'react';
import { ColorPalette } from '../../types.js';
/**
 * Co-located helpers shared by the Cartesian time-series charts (Line, Area).
 *
 * These extract the heavier inline logic that previously lived inside the chart
 * components — the clickable/drill dot renderer, the comparison-mode tick and
 * label formatters, and the series-key → measure-field resolution — so the
 * component bodies stay focused on chart composition. Pure extraction: no
 * behaviour change.
 */
export interface DataPointClickPayload {
    dataPoint: any;
    clickedField: string;
    xValue: any;
    position: {
        x: number;
        y: number;
    };
    nativeEvent: React.MouseEvent;
}
interface DrillDotOptions {
    /** Recharts dot props (cx, cy, payload, key). */
    props: any;
    color: string;
    drillEnabled?: boolean;
    originalField?: string;
    seriesKey: string;
    onDataPointClick?: (payload: DataPointClickPayload) => void;
}
/**
 * Render a single data-point dot. When drill is enabled and a click handler is
 * present, renders a larger clickable dot with a surface-coloured backing
 * circle to mask grid lines; otherwise a small plain dot. Returns null when the
 * point has no coordinates.
 *
 * `renderPlain` controls whether a small non-interactive dot is drawn when
 * drill is disabled (Line draws one; Area returns nothing).
 */
export declare function renderDrillDot({ props, color, drillEnabled, originalField, seriesKey, onDataPointClick, renderPlain }: DrillDotOptions & {
    renderPlain: boolean;
}): React.ReactElement | null;
/**
 * Build the comparison-mode X-axis tick formatter for time-series charts.
 * Returns undefined when not in comparison mode (no custom formatting).
 */
export declare function makeComparisonTickFormatter(hasComparisonData: boolean, chartData: any[], queryObject: any, xAxisField: string): ((value: string | number, index: number) => string) | undefined;
/**
 * Build the comparison-mode tooltip label formatter for time-series charts.
 * Returns undefined when not in comparison mode (no custom formatting).
 */
export declare function makeComparisonLabelFormatter(hasComparisonData: boolean, queryObject: any, xAxisField: string): ((label: any, payload: any) => string) | undefined;
/**
 * Resolve effective stacking for the Area chart from `stackType` (new) /
 * `stacked` (legacy), disabling stacking when a right axis is present (areas on
 * different axes can't be stacked).
 */
export declare function resolveAreaStacking(displayConfig: {
    stackType?: string;
    stacked?: boolean;
} | undefined, hasRightAxis: boolean): {
    effectiveShouldStack: boolean;
    effectiveIsPercentStack: boolean;
    stackOffset: 'expand' | undefined;
};
/** Build a map from series display label to original measure field name. */
export declare function buildSeriesKeyToFieldMap(yAxisFields: string[], getFieldLabel: (field: string) => string): Record<string, string>;
/**
 * Resolve a series key back to its original measure field, handling comparison
 * suffixes like "(Current)" / "(Prior)" and dimension prefixes ("Dim - Label").
 */
export declare function makeSeriesKeyResolver(seriesKeyToField: Record<string, string>): (seriesKey: string) => string | undefined;
/** Pick a series colour by index, preferring the palette then the defaults. */
export declare function getSeriesColor(colorPalette: ColorPalette | undefined, index: number): string;
interface LineSeriesOptions {
    seriesKeys: string[];
    colorPalette?: ColorPalette;
    resolveField: (seriesKey: string) => string | undefined;
    yAxisAssignment: Record<string, 'left' | 'right'>;
    hoveredLegend: string | null;
    connectNulls: boolean;
    /** Render a marker at every data point. Off is clearer on dense series. */
    showPoints?: boolean;
    drillEnabled?: boolean;
    onDataPointClick?: (payload: DataPointClickPayload) => void;
    /** Comparison styling (omit/false → standard series). */
    hasComparisonData?: boolean;
    periodLabels?: string[];
    priorPeriodStyle?: 'solid' | 'dashed' | 'dotted';
    priorPeriodOpacity?: number;
}
/** Render all line series for the Line chart. */
export declare function renderLineSeries(opts: LineSeriesOptions): React.ReactElement[];
interface AreaSeriesOptions {
    seriesKeys: string[];
    colorPalette?: ColorPalette;
    seriesKeyToField: Record<string, string>;
    yAxisAssignment: Record<string, 'left' | 'right'>;
    hoveredLegend: string | null;
    connectNulls: boolean;
    shouldStack: boolean;
    /** Render a marker at every data point. Off is clearer on dense series. */
    showPoints?: boolean;
    drillEnabled?: boolean;
    onDataPointClick?: (payload: DataPointClickPayload) => void;
    /**
     * Unique-per-chart-instance prefix for the `<defs>` gradient ids. When
     * omitted (or when stacking) the series fall back to a flat fill.
     */
    gradientIdPrefix?: string;
}
/**
 * Vertical fade gradients for the Area chart — one `<linearGradient>` per series.
 *
 * Recharts has no gradient primitive; the fade is plain SVG in `<defs>` that each
 * `<Area>` references by id. Both stops use the *same* hue (fading to white would
 * break the dark and neon themes) and the `<Area>`'s own `fillOpacity` stays the
 * master control, so the existing hover dim/highlight still works unchanged.
 */
export declare function renderAreaGradientDefs(seriesKeys: string[], colorPalette: ColorPalette | undefined, idPrefix: string): React.ReactElement;
/** Render all area series for the Area chart. */
export declare function renderAreaSeries(opts: AreaSeriesOptions): React.ReactElement[];
/**
 * Is the x-axis an ordered time series?
 *
 * The summary header's "change since the start of the window" only means
 * something when the x-axis is ordered. For a categorical axis (region,
 * product, status) the first and last categories are arbitrary, so the delta
 * would be noise.
 */
export declare function isTimeOrderedXAxis(queryObject: any, xAxisField: string | undefined): boolean;
/**
 * Resolve which Y axis a series key is plotted against — the same rule the
 * `<Area>`/`<Line>` elements use, so summaries and series never disagree.
 */
export declare function makeAxisResolver(resolveField: (seriesKey: string) => string | undefined, yAxisAssignment: Record<string, 'left' | 'right'>): (seriesKey: string) => 'left' | 'right';
export interface SeriesSummary {
    seriesKey: string;
    color: string;
    /**
     * Which Y axis this series is plotted against, so the summary can be
     * formatted with that axis' format rather than always the left one.
     */
    axis: 'left' | 'right';
    /** Latest non-null value in the window. */
    current: number | null;
    /** First non-null value in the window — the baseline the delta is measured from. */
    baseline: number | null;
    absoluteChange: number | null;
    percentageChange: number | null;
    /**
     * X-axis label of the point the delta is measured from, so the header can say
     * "since Sep 2025" rather than a generic "since start of period". Undefined
     * when the axis key is unknown or the baseline row carries no label.
     */
    baselineLabel?: string;
}
/**
 * Per-series first/last/delta over the plotted window, for the summary header.
 *
 * Pure and DOM-free so it can be unit-tested directly. Nulls are skipped rather
 * than treated as zero — a gap in a series should not read as a crash to zero.
 * When a series has fewer than two non-null points there is nothing to compare,
 * so the deltas stay null and the header renders the value alone.
 */
export declare function computeSeriesSummaries(chartData: any[], seriesKeys: string[], colorPalette?: ColorPalette, resolveAxis?: (seriesKey: string) => 'left' | 'right', xAxisKey?: string): SeriesSummary[];
export interface TimeSeriesShape {
    chartData: any[];
    seriesKeys: string[];
    effectiveXAxisKey: string;
    hasComparisonData: boolean;
    periodLabels: string[];
}
/**
 * Shape raw rows for a Cartesian time-series chart. In comparison mode this
 * uses the overlay transform (aligned by period day index); otherwise the
 * standard series transform. Centralises the branch so the chart body stays
 * flat.
 */
export declare function buildTimeSeriesData(args: {
    data: any[];
    xAxisField: string;
    yAxisFields: string[];
    seriesFields: string[];
    queryObject: any;
    getFieldLabel: (field: string) => string;
}): TimeSeriesShape;
export {};
