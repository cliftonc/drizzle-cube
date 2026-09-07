import { FlowChartData, ServerFlowQuery } from '../../types/flow.js';
import { RetentionChartData, ServerRetentionQuery } from '../../types/retention.js';
import { CubeQuery, MultiQueryConfig, ServerFunnelQuery } from '../../types.js';
export type PortletRenderKind = 'config-required' | 'lazy-placeholder' | 'loading' | 'error' | 'no-data' | 'chart';
export interface PortletRenderStateParams {
    hasChartConfig: boolean;
    hasMandatoryFields: boolean;
    shouldSkipQuery: boolean;
    eagerLoad: boolean;
    isVisible: boolean;
    isLoading: boolean;
    isFetching: boolean;
    error: unknown;
    isMultiQuery: boolean;
    isFunnelMode: boolean;
    isFlowMode: boolean;
    isRetentionMode: boolean;
    queryObject: CubeQuery | null;
    multiQueryConfig: MultiQueryConfig | null;
    serverFunnelQuery: ServerFunnelQuery | null;
    serverFlowQuery: ServerFlowQuery | null;
    serverRetentionQuery: ServerRetentionQuery | null;
    resultSet: unknown;
    multiQueryData: unknown[] | null;
    flowChartData: FlowChartData | null;
    retentionChartData: RetentionChartData | null;
}
/**
 * Resolve which view the portlet should render.
 */
export declare function resolvePortletRenderKind(p: PortletRenderStateParams): PortletRenderKind;
