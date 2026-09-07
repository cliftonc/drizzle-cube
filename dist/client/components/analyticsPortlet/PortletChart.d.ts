import { ChartAxisConfig, ChartDisplayConfig, ChartPagination, ChartType, CubeQuery } from '../../types.js';
import { FlowChartData } from '../../types/flow.js';
import { RetentionChartData } from '../../types/retention.js';
import { ColorPalette } from '../../utils/colorPalettes.js';
type Height = string | number;
interface ResultSetLike {
    tablePivot: () => unknown;
    rawData: () => unknown;
}
export interface PortletChartProps {
    chartType: ChartType;
    height: Height;
    shouldSkipQuery: boolean;
    isMultiQuery: boolean;
    isFunnelMode: boolean;
    isFlowMode: boolean;
    isRetentionMode: boolean;
    resultSet: ResultSetLike | null;
    multiQueryData: unknown[] | null;
    flowChartData: FlowChartData | null;
    retentionChartData: RetentionChartData | null;
    chartConfig?: ChartAxisConfig;
    displayConfig?: ChartDisplayConfig;
    activeQuery: CubeQuery | null;
    pagination?: ChartPagination;
    colorPalette?: ColorPalette;
    drillEnabled: boolean;
    currentChartConfig?: ChartAxisConfig | null;
    onDataPointClick?: (...args: any[]) => void;
}
export declare function PortletChart(props: PortletChartProps): import("react").JSX.Element;
export {};
