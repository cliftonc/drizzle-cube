import { useCubeLoadQuery, useFunnelQuery, useFlowQuery, useRetentionQuery } from '../../hooks/queries/index.js';
import { CubeQuery, MultiQueryConfig, ServerFunnelQuery } from '../../types.js';
import { FlowChartData, ServerFlowQuery } from '../../types/flow.js';
import { RetentionChartData, ServerRetentionQuery } from '../../types/retention.js';
interface RefreshOptions {
    bustCache?: boolean;
}
export interface UsePortletQueryResultsParams {
    activeQuery: CubeQuery | null;
    multiQueryConfig: MultiQueryConfig | null;
    serverFunnelQuery: ServerFunnelQuery | null;
    serverFlowQuery: ServerFlowQuery | null;
    serverRetentionQuery: ServerRetentionQuery | null;
    isMultiQuery: boolean;
    isFunnelMode: boolean;
    isFlowMode: boolean;
    isRetentionMode: boolean;
    shouldSkipQuery: boolean;
    eagerLoad: boolean;
    isVisible: boolean;
}
export interface PortletQueryResults {
    resultSet: ReturnType<typeof useCubeLoadQuery>['resultSet'];
    isLoading: boolean;
    isFetching: boolean;
    error: unknown;
    multiQueryData: unknown[] | null;
    flowChartData: FlowChartData | null;
    retentionChartData: RetentionChartData | null;
    funnelCacheInfo: ReturnType<typeof useFunnelQuery>['cacheInfo'];
    flowCacheInfo: ReturnType<typeof useFlowQuery>['cacheInfo'];
    retentionCacheInfo: ReturnType<typeof useRetentionQuery>['cacheInfo'];
    refresh: (options?: RefreshOptions) => void;
    retry: () => void;
}
export declare function usePortletQueryResults(params: UsePortletQueryResultsParams): PortletQueryResults;
export {};
