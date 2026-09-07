import { AnalysisConfig, FunnelAnalysisConfig } from '../types/analysisConfig.js';
import { ChartType, ChartAxisConfig, ChartDisplayConfig, CubeQuery, FunnelBindingKey, PortletConfig } from '../types.js';
/**
 * Legacy portlet format (before AnalysisConfig)
 */
export interface LegacyPortlet {
    /** JSON string of CubeQuery or MultiQueryConfig */
    query: string;
    chartType?: ChartType;
    chartConfig?: ChartAxisConfig;
    displayConfig?: ChartDisplayConfig;
    analysisType?: 'query' | 'funnel';
    funnelChartType?: ChartType;
    funnelChartConfig?: ChartAxisConfig;
    funnelDisplayConfig?: ChartDisplayConfig;
}
/**
 * Legacy MultiQueryConfig with funnel merge strategy
 * This is a standalone type (not extending MultiQueryConfig) to handle old data
 * where mergeStrategy was 'funnel' before it was removed from QueryMergeStrategy.
 */
export interface LegacyFunnelMultiQuery {
    queries: CubeQuery[];
    mergeStrategy: 'funnel';
    mergeKeys?: string[];
    queryLabels?: string[];
    funnelBindingKey?: FunnelBindingKey | null;
    stepTimeToConvert?: (string | null)[];
}
/**
 * Migrate a legacy portlet to AnalysisConfig format
 *
 * Handles:
 * - Single CubeQuery → QueryAnalysisConfig
 * - MultiQueryConfig → QueryAnalysisConfig
 * - ServerFunnelQuery → FunnelAnalysisConfig
 * - ServerFlowQuery → FlowAnalysisConfig
 * - Legacy mergeStrategy:'funnel' → FunnelAnalysisConfig (via migrateLegacyFunnelMerge)
 *
 * @param portlet - Legacy portlet with query string
 * @returns AnalysisConfig in new format
 */
export declare function migrateLegacyPortlet(portlet: LegacyPortlet): AnalysisConfig;
/**
 * Migrate legacy mergeStrategy:'funnel' to FunnelAnalysisConfig
 *
 * This handles the old pattern where funnels were created using multi-query
 * with mergeStrategy: 'funnel'. Converts to the new dedicated funnel format.
 *
 * @param legacyQuery - MultiQueryConfig with mergeStrategy: 'funnel'
 * @param portlet - Legacy portlet for chart config
 * @returns FunnelAnalysisConfig in new format
 */
export declare function migrateLegacyFunnelMerge(legacyQuery: LegacyFunnelMultiQuery, portlet?: LegacyPortlet): FunnelAnalysisConfig;
/**
 * Migrate any config to the latest version
 *
 * Handles:
 * - Already valid AnalysisConfig (returns as-is)
 * - Legacy portlet format (converts to AnalysisConfig)
 * - Unknown format (returns default config)
 *
 * @param config - Unknown config value
 * @returns Valid AnalysisConfig
 */
export declare function migrateConfig(config: unknown): AnalysisConfig;
/**
 * Check if a portlet has the new AnalysisConfig format
 */
export declare function hasAnalysisConfig(portlet: unknown): portlet is {
    analysisConfig: AnalysisConfig;
};
/**
 * Ensure a portlet has analysisConfig, migrating from legacy format if needed.
 *
 * This is the primary entry point for rendering portlets - it guarantees
 * that analysisConfig exists, either by using the existing one or by
 * converting legacy fields on-the-fly.
 *
 * @param portlet - PortletConfig which may or may not have analysisConfig
 * @returns PortletConfig with analysisConfig guaranteed to exist
 */
export declare function ensureAnalysisConfig(portlet: PortletConfig): PortletConfig & {
    analysisConfig: AnalysisConfig;
};
