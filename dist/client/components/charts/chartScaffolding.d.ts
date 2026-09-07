import { AxisFormatConfig } from '../../types.js';
/**
 * Shared scaffolding for the Cartesian recharts charts (bar, line, area).
 *
 * These charts duplicated the same dual-Y-axis derivation, chart margins,
 * target-line overlay, and the left/right `<YAxis>` JSX. The pure helpers and
 * recharts render-helpers here own that shared setup. Render-helpers return
 * recharts elements (inside a fragment) and are embedded directly in the chart
 * children — recharts flattens fragments when discovering axes/series, exactly
 * as it already does for the inline target-line fragment.
 */
export interface DualAxisInfo {
    /** True when at least one measure is assigned to the right axis */
    hasRightAxis: boolean;
    /** Measure fields rendered against the left axis */
    leftAxisFields: string[];
    /** Measure fields rendered against the right axis */
    rightAxisFields: string[];
}
/** Derive left/right axis membership from per-measure axis assignments. */
export declare function getDualAxisInfo(yAxisFields: string[], yAxisAssignment: Record<string, 'left' | 'right'>): DualAxisInfo;
/** Chart margins with extra room for the Y-axis label(s). */
export declare function getYAxisChartMargins(hasRightAxis: boolean): {
    left: number;
    right: number;
    top: number;
    bottom: number;
};
/**
 * Vertical space an angled X-axis label needs.
 *
 * `AngledXAxisTick` rotates its text -45deg from an anchor offset dy=16, so the
 * space required below the axis is the label's own width projected onto the
 * vertical, plus that offset. A fixed height clipped longer labels: "2026-08-24"
 * is roughly 66px wide at 12px, which projects to ~47px and needs ~63px in
 * total against the 60px that used to be hardcoded.
 *
 * Capped, because a pathological label should cost the plot a bounded amount of
 * height rather than squeeze it away - past the cap the label is truncated
 * instead (see AngledXAxisTick).
 */
export declare const MIN_ANGLED_AXIS_HEIGHT = 60;
export declare const MAX_ANGLED_AXIS_HEIGHT = 96;
export declare function resolveAngledAxisHeight(values: Array<string | number | undefined>): number;
/**
 * Width reserved for the left `<YAxis>`. This is recharts' own default, stated
 * explicitly so anything needing to line up with the plot area can rely on it
 * rather than assume it.
 */
export declare const Y_AXIS_WIDTH = 60;
/**
 * Distance from the chart container's left edge to the left edge of the plot
 * area — the chart margin plus the Y-axis gutter. Used to indent content
 * rendered outside the chart (the summary header) so it lines up with the first
 * data point instead of floating against the card edge.
 */
export declare function getPlotLeftOffset(hasRightAxis: boolean): number;
/**
 * Apply target values (single or comma-separated spread) onto chart data,
 * returning the spread targets plus data enhanced with a `__target` key.
 */
export declare function withTargetData<T extends Record<string, any>>(chartData: T[], target: string | undefined): {
    spreadTargets: number[];
    enhancedChartData: T[];
};
/**
 * Render the left + optional right `<YAxis>`. Returns recharts elements in a
 * fragment for embedding directly in the chart children. Positional args keep
 * the (otherwise identical) call sites in each chart down to a single line.
 *
 * @param isPercentStack when true (area/bar percent stacking) the left axis shows 0–100%
 */
export declare function renderDualYAxes({ hasRightAxis, leftAxisFields, rightAxisFields }: DualAxisInfo, getFieldLabel: (field: string) => string, leftYAxisFormat?: AxisFormatConfig, rightYAxisFormat?: AxisFormatConfig, isPercentStack?: boolean): import("react").JSX.Element;
/**
 * Render the target overlay: a white backing line plus a purple dashed line
 * on top (shared by bar, line, area). Returns null when there are no targets.
 */
export declare function renderChartTargetLines(spreadTargets: number[]): import("react").JSX.Element | null;
interface CartesianTooltipOptions {
    leftYAxisFormat?: AxisFormatConfig;
    rightYAxisFormat?: AxisFormatConfig;
    yAxisAssignment: Record<string, 'left' | 'right'>;
    /** Maps a series key (display label) back to its original measure field. */
    resolveField: (name: string) => string | undefined;
    /** When true, values render as percentages (area/bar percent stacking). */
    isPercentStack?: boolean;
}
/**
 * Build the value/name tooltip formatter shared by the Cartesian charts.
 * Handles null values, the target series, percent stacking, and per-series
 * left/right axis format selection.
 */
export declare function makeCartesianTooltipFormatter({ leftYAxisFormat, rightYAxisFormat, yAxisAssignment, resolveField, isPercentStack }: CartesianTooltipOptions): (value: any, name: any) => [any, any];
/**
 * Render the hover-aware bottom legend shared by the Cartesian charts.
 * Returns null when the legend is hidden. `iconType` / `paddingTop` differ
 * per chart (rect+10 for area, rect+25 for bar, line+25 for line).
 */
export declare function renderHoverLegend({ show, iconType, paddingTop, onHover, onLeave }: {
    show: boolean;
    iconType: 'rect' | 'line' | 'circle';
    paddingTop: number;
    onHover: (dataKey: string) => void;
    onLeave: () => void;
}): import("react").JSX.Element | null;
export {};
