import { default as React } from 'react';
import { SeriesSummary } from './cartesianChartHelpers.js';
import { AxisFormatConfig } from '../../types.js';
interface ChartSummaryHeaderProps {
    summaries: SeriesSummary[];
    /** Resolves a series key to its display label. */
    getSeriesLabel: (seriesKey: string) => string;
    /** Left-axis numeric format, so the header matches the axis it summarises. */
    valueFormat?: AxisFormatConfig;
    /** Right-axis format, used for series assigned to the right axis. */
    rightValueFormat?: AxisFormatConfig;
    /**
     * Whether a change vs. the start of the window is meaningful. False for a
     * categorical x-axis, where "first" and "last" are arbitrary categories.
     */
    showChange?: boolean;
    /**
     * Distance from the container's left edge to the plot area, so the summary
     * lines up with the first data point rather than the card edge.
     */
    leftOffset?: number;
}
/**
 * Summary band rendered above a time-series plot.
 *
 * Shows each series' latest value and how far it has moved since the start of
 * the window, so the chart is readable without hovering. All values are derived
 * from the already-fetched result set — this issues no queries of its own.
 */
declare const ChartSummaryHeader: React.MemoExoticComponent<({ summaries, getSeriesLabel, valueFormat, rightValueFormat, showChange, leftOffset }: ChartSummaryHeaderProps) => React.JSX.Element | null>;
export default ChartSummaryHeader;
