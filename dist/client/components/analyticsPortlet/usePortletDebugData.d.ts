import { AnalyticsPortletProps, ChartAxisConfig, ChartDisplayConfig, ChartType, CubeQuery, ServerFunnelQuery } from '../../types.js';
import { FlowChartData, ServerFlowQuery } from '../../types/flow.js';
import { RetentionChartData, ServerRetentionQuery } from '../../types/retention.js';
import { DrillPathEntry } from '../../types/drill.js';
type DebugEntry = Parameters<NonNullable<AnalyticsPortletProps['onDebugDataReady']>>[0];
type CacheInfo = DebugEntry['cacheInfo'];
interface ResultSetLike {
    tablePivot: () => unknown;
    rawData: () => unknown;
    cacheInfo?: () => CacheInfo;
}
export interface UsePortletDebugDataParams {
    onDebugDataReady?: AnalyticsPortletProps['onDebugDataReady'];
    error: unknown;
    chartType: ChartType;
    chartConfig?: ChartAxisConfig;
    displayConfig?: ChartDisplayConfig;
    isFunnelMode: boolean;
    isFlowMode: boolean;
    isRetentionMode: boolean;
    queryObject: CubeQuery | null;
    activeQuery: CubeQuery | null;
    serverFunnelQuery: ServerFunnelQuery | null;
    serverFlowQuery: ServerFlowQuery | null;
    serverRetentionQuery: ServerRetentionQuery | null;
    resultSet: ResultSetLike | null;
    multiQueryData: unknown[] | null;
    flowChartData: FlowChartData | null;
    retentionChartData: RetentionChartData | null;
    funnelCacheInfo?: CacheInfo;
    flowCacheInfo?: CacheInfo;
    retentionCacheInfo?: CacheInfo;
    drillPath: DrillPathEntry[];
    currentChartConfig?: ChartAxisConfig | null;
}
export declare function usePortletDebugData(params: UsePortletDebugDataParams): void;
export {};
