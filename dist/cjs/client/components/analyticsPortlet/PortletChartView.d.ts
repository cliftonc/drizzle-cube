import { ChartAxisConfig, ChartDisplayConfig, ChartPagination, ChartType, CubeQuery } from '../../types.js';
import { FlowChartData } from '../../types/flow.js';
import { RetentionChartData } from '../../types/retention.js';
import { ColorPalette } from '../../utils/colorPalettes.js';
import { DrillInteraction } from '../../types/drill.js';
type Height = string | number;
interface ResultSetLike {
    tablePivot: () => unknown;
    rawData: () => unknown;
}
export interface PortletChartViewProps {
    title?: string;
    query: string;
    chartType: ChartType;
    height: Height;
    chartConfig?: ChartAxisConfig;
    displayConfig?: ChartDisplayConfig;
    colorPalette?: ColorPalette;
    shouldSkipQuery: boolean;
    isMultiQuery: boolean;
    isFunnelMode: boolean;
    isFlowMode: boolean;
    isRetentionMode: boolean;
    resultSet: ResultSetLike | null;
    multiQueryData: unknown[] | null;
    flowChartData: FlowChartData | null;
    retentionChartData: RetentionChartData | null;
    activeQuery: CubeQuery | null;
    pagination?: ChartPagination;
    /** Members dropped because the model no longer has them; surfaced as a note. */
    droppedMembers?: string[];
    drill: DrillInteraction;
    isDrillEnabled: boolean;
    onNavigateBack: () => void;
    onNavigateToLevel: (index: number) => void;
}
export declare function PortletChartView(props: PortletChartViewProps): import("react").JSX.Element;
export {};
