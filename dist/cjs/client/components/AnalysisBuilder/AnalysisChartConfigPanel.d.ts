import { ChartType, ChartAxisConfig } from '../../types.js';
import { MetricItem, BreakdownItem } from './types.js';
import { ChartAvailabilityMap } from '../../shared/chartDefaults.js';
import { MetaResponse } from '../../shared/types.js';
interface AnalysisChartConfigPanelProps {
    chartType: ChartType;
    chartConfig: ChartAxisConfig;
    metrics: MetricItem[];
    breakdowns: BreakdownItem[];
    /** Schema metadata for resolving field titles */
    schema?: MetaResponse | null;
    /** Map of chart type availability for disabling unavailable chart types */
    chartAvailability?: ChartAvailabilityMap;
    onChartTypeChange: (type: ChartType) => void;
    onChartConfigChange: (config: ChartAxisConfig) => void;
}
export default function AnalysisChartConfigPanel({ chartType, chartConfig, metrics, breakdowns, schema, chartAvailability, onChartTypeChange, onChartConfigChange }: AnalysisChartConfigPanelProps): import("react").JSX.Element;
export {};
