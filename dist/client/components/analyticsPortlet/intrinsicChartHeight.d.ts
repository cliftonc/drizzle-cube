import { ChartDisplayConfig, ChartType } from '../../types.js';
/**
 * Should this chart be exempt from the portlet's minimum height?
 *
 * The floor overflows a card shorter than 200px, and content centred inside the
 * oversized box then renders near the bottom and clips — so charts that are
 * short by design opt out of it.
 */
export declare function hasIntrinsicChartHeight(chartType: ChartType, displayConfig?: ChartDisplayConfig): boolean;
