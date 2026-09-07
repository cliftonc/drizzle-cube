import { ChartType, ChartAxisConfig, ChartDisplayConfig, CubeQuery, MultiQueryConfig } from '../types.js';
import { ServerFunnelQuery } from './funnel.js';
import { ServerFlowQuery } from './flow.js';
import { ServerRetentionQuery } from './retention.js';
/**
 * Chart configuration - shared across all analysis types
 */
export interface ChartConfig {
    chartType: ChartType;
    chartConfig: ChartAxisConfig;
    displayConfig: ChartDisplayConfig;
}
/**
 * Analysis type discriminator
 * Future modes: 'cohort'
 */
export type AnalysisType = 'query' | 'funnel' | 'flow' | 'retention';
/**
 * Base config - common to all analysis types
 */
interface AnalysisConfigBase {
    /** Version number for migration support */
    version: 1;
    /** Which analysis mode this config represents */
    analysisType: AnalysisType;
    /** Whether to show table or chart view */
    activeView: 'table' | 'chart';
    /**
     * Per-mode chart configuration map.
     * Each mode owns its own chart settings, allowing users to configure
     * different chart types for query mode vs funnel mode.
     */
    charts: {
        [K in AnalysisType]?: ChartConfig;
    };
}
/**
 * Query mode config - for single queries and multi-query analysis
 *
 * The `query` field is the actual executable query:
 * - Single query: CubeQuery object
 * - Multi-query: MultiQueryConfig with queries array and merge strategy
 */
export interface QueryAnalysisConfig extends AnalysisConfigBase {
    analysisType: 'query';
    /**
     * The executable query.
     * - CubeQuery: Single query with measures, dimensions, filters
     * - MultiQueryConfig: Multiple queries with merge strategy
     */
    query: CubeQuery | MultiQueryConfig;
}
/**
 * Funnel mode config - for funnel analysis
 *
 * The `query` field is the ServerFunnelQuery which can be sent
 * directly to the server for execution.
 */
export interface FunnelAnalysisConfig extends AnalysisConfigBase {
    analysisType: 'funnel';
    /**
     * Server funnel query - executable as-is.
     * Contains bindingKey, timeDimension, steps[], and options.
     */
    query: ServerFunnelQuery;
}
/**
 * Flow mode config - for bidirectional flow analysis
 *
 * The `query` field is the ServerFlowQuery which can be sent
 * directly to the server for execution.
 */
export interface FlowAnalysisConfig extends AnalysisConfigBase {
    analysisType: 'flow';
    /**
     * Server flow query - executable as-is.
     * Contains bindingKey, timeDimension, eventDimension, startingStep, and depth config.
     */
    query: ServerFlowQuery;
}
/**
 * Retention mode config - for cohort-based retention analysis
 *
 * The `query` field is the ServerRetentionQuery which can be sent
 * directly to the server for execution.
 */
export interface RetentionAnalysisConfig extends AnalysisConfigBase {
    analysisType: 'retention';
    /**
     * Server retention query - executable as-is.
     * Contains cohortTimeDimension, activityTimeDimension, bindingKey,
     * granularity settings, and period configuration.
     */
    query: ServerRetentionQuery;
}
/**
 * AnalysisConfig - union of all analysis mode configurations
 */
export type AnalysisConfig = QueryAnalysisConfig | FunnelAnalysisConfig | FlowAnalysisConfig | RetentionAnalysisConfig;
/**
 * Check if config is for query mode
 */
export declare const isQueryConfig: (c: AnalysisConfig) => c is QueryAnalysisConfig;
/**
 * Check if config is for funnel mode
 */
export declare const isFunnelConfig: (c: AnalysisConfig) => c is FunnelAnalysisConfig;
/**
 * Check if config is for flow mode
 */
export declare const isFlowConfig: (c: AnalysisConfig) => c is FlowAnalysisConfig;
/**
 * Check if config is for retention mode
 */
export declare const isRetentionConfig: (c: AnalysisConfig) => c is RetentionAnalysisConfig;
/**
 * Check if a query config contains multiple queries
 */
export declare const isMultiQuery: (config: QueryAnalysisConfig) => boolean;
/**
 * Check if a query config contains a single query
 */
export declare const isSingleQuery: (config: QueryAnalysisConfig) => boolean;
/**
 * Type guard to validate if an unknown value is a valid AnalysisConfig
 */
export declare const isValidAnalysisConfig: (config: unknown) => config is AnalysisConfig;
/**
 * Create a default empty query analysis config
 */
export declare const createDefaultQueryConfig: () => QueryAnalysisConfig;
/**
 * Create a default empty funnel analysis config
 */
export declare const createDefaultFunnelConfig: () => FunnelAnalysisConfig;
/**
 * Create a default empty flow analysis config
 */
export declare const createDefaultFlowConfig: () => FlowAnalysisConfig;
/**
 * Create a default empty retention analysis config
 */
export declare const createDefaultRetentionConfig: () => RetentionAnalysisConfig;
/**
 * Create a default config for the given analysis type
 */
export declare const createDefaultConfig: (type?: AnalysisType) => AnalysisConfig;
/**
 * AnalysisWorkspace - Multi-mode persistence format for localStorage
 *
 * Unlike AnalysisConfig (which represents a single analysis mode),
 * AnalysisWorkspace preserves state for ALL modes. This prevents state
 * loss when switching between query, funnel, flow, and retention modes.
 *
 * Usage:
 * - localStorage persistence → AnalysisWorkspace (preserves all modes)
 * - Share URLs → AnalysisConfig (shares one specific analysis)
 * - Dashboard portlets → AnalysisConfig (embeds one specific analysis)
 */
export interface AnalysisWorkspace {
    /** Version number for migration support */
    version: 1;
    /** Currently active analysis type */
    activeType: AnalysisType;
    /**
     * Per-mode configurations.
     * Each mode stores its complete AnalysisConfig independently.
     * Charts are duplicated per-mode but merged on load.
     */
    modes: {
        query?: QueryAnalysisConfig;
        funnel?: FunnelAnalysisConfig;
        flow?: FlowAnalysisConfig;
        retention?: RetentionAnalysisConfig;
    };
}
/**
 * Type guard to validate if an unknown value is a valid AnalysisWorkspace
 */
export declare const isValidAnalysisWorkspace: (data: unknown) => data is AnalysisWorkspace;
/**
 * Create a default empty workspace with all modes initialized
 */
export declare const createDefaultWorkspace: () => AnalysisWorkspace;
export {};
