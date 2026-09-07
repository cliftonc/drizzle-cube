import { ChartDisplayConfig } from '../../types.js';
import { FunnelChartData } from '../../types/funnel.js';
/** Check if data is already in funnel data format. */
export declare function isFunnelData(data: unknown[]): data is FunnelChartData[];
/**
 * Render time metrics based on config options - returns array of lines for
 * vertical stacking.
 */
export declare function getTimeMetricsLines(step: FunnelChartData, showAvg: boolean, showMedian: boolean, showP90: boolean): string[];
/** Coerce arbitrary query rows into FunnelChartData by probing field names. */
export declare function toFunnelData(data: unknown[]): FunnelChartData[];
export interface FunnelDisplayOptions {
    customStepLabels?: string[];
    isVertical: boolean;
    funnelStyle: NonNullable<ChartDisplayConfig['funnelStyle']>;
    showConversion: boolean;
    showAvgTime: boolean;
    showMedianTime: boolean;
    showP90Time: boolean;
    hideSummaryFooter: boolean;
}
/** Resolve every funnel display option (with backward-compat for time metrics). */
export declare function resolveFunnelDisplayOptions(displayConfig: ChartDisplayConfig | undefined): FunnelDisplayOptions;
/** Color for a funnel step (cyclic over the palette or the default funnel gradient). */
export declare function getStepColor(index: number, colorPalette: string[]): string;
