import { AnalysisConfig } from '../../../types/analysisConfig.js';
/**
 * Extract funnel initial state from a shared AnalysisConfig.
 *
 * Phase 3: funnel config is in query.funnel, chart config is in charts.funnel.
 */
export declare function extractFunnelStateFromShare(sharedState: AnalysisConfig | null): {
    funnelCube: null;
    funnelSteps: never[];
    funnelTimeDimension: string | null;
    funnelBindingKey: {
        dimension: string | {
            cube: string;
            dimension: string;
        }[];
    } | null;
    funnelChartType: import('../../../types.js').ChartType;
    funnelChartConfig: import('../../../types.js').ChartAxisConfig;
    funnelDisplayConfig: import('../../../types.js').ChartDisplayConfig;
} | undefined;
/**
 * Extract flow initial state from a shared AnalysisConfig.
 */
export declare function extractFlowStateFromShare(sharedState: AnalysisConfig | null): {
    flowCube: null;
    flowBindingKey: {
        dimension: string;
    } | null;
    flowTimeDimension: string | null;
    startingStep: {
        name: string;
        filters: import('../../../types.js').Filter[];
    };
    stepsBefore: number;
    stepsAfter: number;
    eventDimension: string | null;
    flowChartType: import('../../../types.js').ChartType;
    flowChartConfig: import('../../../types.js').ChartAxisConfig;
    flowDisplayConfig: import('../../../types.js').ChartDisplayConfig;
} | undefined;
/**
 * Extract retention initial state from a shared AnalysisConfig.
 */
export declare function extractRetentionStateFromShare(sharedState: AnalysisConfig | null): {
    retentionCube: null;
    retentionBindingKey: {
        dimension: string;
    } | {
        dimension: {
            cube: string;
            dimension: string;
        }[];
    } | null;
    retentionTimeDimension: string | null;
    retentionDateRange: import('../../../types/retention.js').DateRange;
    retentionCohortFilters: import('../../../types.js').Filter[];
    retentionActivityFilters: import('../../../types.js').Filter[];
    retentionBreakdowns: {
        field: string;
        label: string;
    }[];
    retentionViewGranularity: import('../../../types/retention.js').RetentionGranularity;
    retentionPeriods: number;
    retentionType: import('../../../types/retention.js').RetentionType;
    retentionChartType: import('../../../types.js').ChartType;
    retentionChartConfig: import('../../../types.js').ChartAxisConfig;
    retentionDisplayConfig: import('../../../types.js').ChartDisplayConfig;
} | undefined;
