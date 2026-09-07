import { CubeQuery, DashboardFilter, DashboardFilterMapping, MultiQueryConfig, ServerFunnelQuery } from '../../types.js';
import { ServerFlowQuery } from '../../types/flow.js';
import { ServerRetentionQuery } from '../../types/retention.js';
export interface ParsedPortletQuery {
    queryObject: CubeQuery | null;
    multiQueryConfig: MultiQueryConfig | null;
    serverFunnelQuery: ServerFunnelQuery | null;
    serverFlowQuery: ServerFlowQuery | null;
    serverRetentionQuery: ServerRetentionQuery | null;
}
export interface ParsePortletQueryParams {
    query: string;
    shouldSkipQuery: boolean;
    regularFilters?: DashboardFilter[];
    dashboardFilters?: DashboardFilter[];
    dashboardFilterMapping?: DashboardFilterMapping;
}
/**
 * Parse the portlet query string and merge applicable dashboard filters.
 * Returns a discriminated set of possible query shapes (only one non-null).
 */
export declare function parsePortletQuery(params: ParsePortletQueryParams): ParsedPortletQuery;
