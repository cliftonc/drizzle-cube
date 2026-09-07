import { ChartType, ChartAxisConfig } from '../types.js';
import { MetricItem, BreakdownItem } from '../components/AnalysisBuilder/types.js';
/**
 * Resolved breakdown selections passed to every axis builder.
 */
export interface AxisBuilderContext {
    metrics: MetricItem[];
    breakdowns: BreakdownItem[];
    timeDimension: BreakdownItem | undefined;
    dimension: BreakdownItem | undefined;
    dimensions: BreakdownItem[];
}
type AxisBuilder = (ctx: AxisBuilderContext) => ChartAxisConfig;
/**
 * Resolve the axis builder for a chart type, falling back to the default.
 */
export declare function getAxisBuilder(chartType: ChartType): AxisBuilder;
export {};
