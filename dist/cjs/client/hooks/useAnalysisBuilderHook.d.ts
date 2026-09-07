import { ColorPalette } from '../utils/colorPalettes.js';
import { CubeQuery, MultiQueryConfig, ChartType, ChartAxisConfig, ChartDisplayConfig, Filter, QueryMergeStrategy, FunnelBindingKey, AnalysisType, FunnelStepState } from '../types.js';
import { AnalysisBuilderState, MetricItem, BreakdownItem, ExecutionStatus, QueryPanelTab } from '../components/AnalysisBuilder/types.js';
import { ChartAvailabilityMap } from '../shared/chartDefaults.js';
import { DebugDataEntry } from './queries/index.js';
import { MultiQueryValidationResult } from '../utils/multiQueryValidation.js';
import { MetaField } from '../shared/types.js';
import { ValidationResult } from '../adapters/modeAdapter.js';
export interface UseAnalysisBuilderOptions {
    /** External color palette (overrides local) */
    externalColorPalette?: string[] | ColorPalette;
    /** Initial data (skip first fetch) */
    initialData?: unknown[];
    /** Callback when query changes */
    onQueryChange?: (query: CubeQuery) => void;
    /** Callback when chart config changes */
    onChartConfigChange?: (config: {
        chartType: ChartType;
        chartConfig: ChartAxisConfig;
        displayConfig: ChartDisplayConfig;
    }) => void;
}
export interface UseAnalysisBuilderResult {
    queryState: AnalysisBuilderState;
    queryStates: AnalysisBuilderState[];
    activeQueryIndex: number;
    mergeStrategy: QueryMergeStrategy;
    isMultiQueryMode: boolean;
    mergeKeys: string[] | undefined;
    currentQuery: CubeQuery;
    allQueries: CubeQuery[];
    multiQueryConfig: MultiQueryConfig | null;
    multiQueryValidation: MultiQueryValidationResult | null;
    funnelBindingKey: FunnelBindingKey | null;
    /** Whether funnel mode is properly configured and ready for execution */
    isFunnelModeEnabled: boolean;
    /** Current analysis type (query, multi, funnel) */
    analysisType: AnalysisType;
    /** Selected cube for funnel mode (all steps use this cube) */
    funnelCube: string | null;
    /** Dedicated funnel steps (when analysisType === 'funnel') */
    funnelSteps: FunnelStepState[];
    /** Index of currently active funnel step */
    activeFunnelStepIndex: number;
    /** Time dimension for funnel temporal ordering */
    funnelTimeDimension: string | null;
    /** Chart type for funnel mode (separate from query mode) */
    funnelChartType: ChartType;
    /** Chart config for funnel mode (separate from query mode) */
    funnelChartConfig: ChartAxisConfig;
    /** Display config for funnel mode (separate from query mode) */
    funnelDisplayConfig: ChartDisplayConfig;
    /** Selected cube for flow mode */
    flowCube: string | null;
    /** Binding key for flow mode (entity linking) */
    flowBindingKey: FunnelBindingKey | null;
    /** Time dimension for flow mode (event ordering) */
    flowTimeDimension: string | null;
    /** Event dimension for flow mode (node labels in Sankey) */
    eventDimension: string | null;
    /** Starting step configuration */
    startingStep: import('../types/flow.js').FlowStartingStep;
    /** Number of steps to explore before starting step */
    stepsBefore: number;
    /** Number of steps to explore after starting step */
    stepsAfter: number;
    /** Join strategy for flow execution */
    joinStrategy: 'auto' | 'lateral' | 'window';
    /** Display config for flow mode */
    flowDisplayConfig: ChartDisplayConfig;
    /** Single cube for retention analysis */
    retentionCube: string | null;
    /** Binding key for retention mode */
    retentionBindingKey: import('../types/funnel.js').FunnelBindingKey | null;
    /** Single timestamp dimension for retention mode */
    retentionTimeDimension: string | null;
    /** Date range for cohort analysis (REQUIRED) */
    retentionDateRange: import('../types/retention.js').DateRange;
    /** Cohort filters for retention mode */
    retentionCohortFilters: import('../types.js').Filter[];
    /** Activity filters for retention mode */
    retentionActivityFilters: import('../types.js').Filter[];
    /** Optional breakdown dimensions for segmenting the cohort */
    retentionBreakdowns: import('../types/retention.js').RetentionBreakdownItem[];
    /** Granularity for viewing retention periods (day/week/month) */
    retentionViewGranularity: import('../types/retention.js').RetentionGranularity;
    /** Number of periods for retention mode */
    retentionPeriods: number;
    /** Retention calculation type */
    retentionType: import('../types/retention.js').RetentionType;
    /** Display config for retention mode */
    retentionDisplayConfig: ChartDisplayConfig | undefined;
    executionStatus: ExecutionStatus;
    executionResults: unknown[] | null;
    perQueryResults: (unknown[] | null)[] | null;
    isLoading: boolean;
    isFetching: boolean;
    error: Error | null;
    isValidQuery: boolean;
    debugDataPerQuery: DebugDataEntry[];
    /**
     * Whether the current query config differs from the last executed query.
     * Used for manual refresh mode to show "needs refresh" indicator.
     */
    needsRefresh: boolean;
    /**
     * Query warnings from the server (e.g., fan-out without dimensions).
     * Displayed as a banner above results.
     */
    warnings: import('../shared/types.js').QueryWarning[] | undefined;
    /** In funnel mode, the actually executed queries with binding key dimension and IN filters */
    funnelExecutedQueries: CubeQuery[] | null;
    /** In funnel mode, the actual server query { funnel: {...} } sent to the API */
    funnelServerQuery: unknown | null;
    /** In funnel mode, unified debug data (SQL, analysis, mode metadata) */
    funnelDebugData: DebugDataEntry | null;
    /** In flow mode, the actual server query { flow: {...} } sent to the API */
    flowServerQuery: unknown | null;
    /** In flow mode, unified debug data (SQL, analysis, mode metadata) */
    flowDebugData: DebugDataEntry | null;
    /** In retention mode, the actual server query { retention: {...} } sent to the API */
    retentionServerQuery: unknown | null;
    /** In retention mode, unified debug data (SQL, analysis, mode metadata) */
    retentionDebugData: DebugDataEntry | null;
    /** In retention mode, the chart data (cohort × period matrix) */
    retentionChartData: import('../types/retention.js').RetentionChartData | null;
    /** In retention mode, validation result (errors explaining why query cannot be built) */
    retentionValidation: {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    } | null;
    chartType: ChartType;
    chartConfig: ChartAxisConfig;
    displayConfig: ChartDisplayConfig;
    colorPalette: ColorPalette;
    localPaletteName: string;
    chartAvailability: ChartAvailabilityMap;
    combinedMetrics: MetricItem[];
    combinedBreakdowns: BreakdownItem[];
    effectiveBreakdowns: BreakdownItem[];
    activeTab: QueryPanelTab;
    activeView: 'table' | 'chart';
    displayLimit: number;
    showFieldModal: boolean;
    fieldModalMode: 'metrics' | 'breakdown';
    activeTableIndex: number;
    userManuallySelectedChart: boolean;
    aiState: {
        isOpen: boolean;
        userPrompt: string;
        isGenerating: boolean;
        error: string | null;
        hasGeneratedQuery: boolean;
    };
    shareButtonState: 'idle' | 'copied' | 'copied-no-chart';
    canShare: boolean;
    /** Validation result from the adapter for the current analysis type */
    adapterValidation: ValidationResult;
    actions: {
        setActiveQueryIndex: (index: number) => void;
        setMergeStrategy: (strategy: QueryMergeStrategy) => void;
        openMetricsModal: () => void;
        addMetric: (field: string, label?: string) => void;
        removeMetric: (id: string) => void;
        toggleMetric: (fieldName: string) => void;
        reorderMetrics: (fromIndex: number, toIndex: number) => void;
        openBreakdownsModal: () => void;
        addBreakdown: (field: string, isTimeDimension: boolean, granularity?: string) => void;
        removeBreakdown: (id: string) => void;
        toggleBreakdown: (fieldName: string, isTimeDimension: boolean, granularity?: string) => void;
        setBreakdownGranularity: (id: string, granularity: string) => void;
        toggleBreakdownComparison: (id: string) => void;
        reorderBreakdowns: (fromIndex: number, toIndex: number) => void;
        setFilters: (filters: Filter[]) => void;
        dropFieldToFilter: (field: string) => void;
        setOrder: (fieldName: string, direction: 'asc' | 'desc' | null) => void;
        setLimit: (limit: number | undefined) => void;
        addQuery: () => void;
        removeQuery: (index: number) => void;
        setFunnelBindingKey: (bindingKey: FunnelBindingKey | null) => void;
        setAnalysisType: (type: AnalysisType) => void;
        setFunnelCube: (cube: string | null) => void;
        addFunnelStep: () => void;
        removeFunnelStep: (index: number) => void;
        updateFunnelStep: (index: number, updates: Partial<FunnelStepState>) => void;
        setActiveFunnelStepIndex: (index: number) => void;
        reorderFunnelSteps: (fromIndex: number, toIndex: number) => void;
        setFunnelTimeDimension: (dimension: string | null) => void;
        setFunnelDisplayConfig: (config: ChartDisplayConfig) => void;
        setFlowCube: (cube: string | null) => void;
        setFlowBindingKey: (key: FunnelBindingKey | null) => void;
        setFlowTimeDimension: (dim: string | null) => void;
        setEventDimension: (dim: string | null) => void;
        setStartingStepName: (name: string) => void;
        setStartingStepFilters: (filters: Filter[]) => void;
        setStepsBefore: (count: number) => void;
        setStepsAfter: (count: number) => void;
        setJoinStrategy: (strategy: 'auto' | 'lateral' | 'window') => void;
        setFlowDisplayConfig: (config: ChartDisplayConfig) => void;
        setRetentionCube: (cube: string | null) => void;
        setRetentionBindingKey: (key: import('../types/funnel.js').FunnelBindingKey | null) => void;
        setRetentionTimeDimension: (dim: string | null) => void;
        setRetentionDateRange: (range: import('../types/retention.js').DateRange) => void;
        setRetentionCohortFilters: (filters: import('../types.js').Filter[]) => void;
        setRetentionActivityFilters: (filters: import('../types.js').Filter[]) => void;
        setRetentionBreakdowns: (breakdowns: import('../types/retention.js').RetentionBreakdownItem[]) => void;
        addRetentionBreakdown: (breakdown: import('../types/retention.js').RetentionBreakdownItem) => void;
        removeRetentionBreakdown: (field: string) => void;
        setRetentionViewGranularity: (granularity: import('../types/retention.js').RetentionGranularity) => void;
        setRetentionPeriods: (periods: number) => void;
        setRetentionType: (type: import('../types/retention.js').RetentionType) => void;
        setRetentionDisplayConfig: (config: ChartDisplayConfig) => void;
        setChartType: (type: ChartType) => void;
        setChartConfig: (config: ChartAxisConfig) => void;
        setDisplayConfig: (config: ChartDisplayConfig) => void;
        setLocalPaletteName: (name: string) => void;
        setActiveTab: (tab: QueryPanelTab) => void;
        setActiveView: (view: 'table' | 'chart') => void;
        setDisplayLimit: (limit: number) => void;
        closeFieldModal: () => void;
        setActiveTableIndex: (index: number) => void;
        openAI: () => void;
        closeAI: () => void;
        setAIPrompt: (prompt: string) => void;
        generateAI: () => Promise<void>;
        acceptAI: () => void;
        cancelAI: () => void;
        share: () => Promise<void>;
        clearQuery: () => void;
        clearCurrentMode: () => void;
        refetch: (options?: {
            bustCache?: boolean;
        }) => void;
        handleFieldSelected: (field: MetaField, fieldType: 'measure' | 'dimension' | 'timeDimension', cubeName: string, keepOpen?: boolean) => void;
    };
    getQueryConfig: () => CubeQuery | MultiQueryConfig | import('../types/funnel.js').ServerFunnelQuery;
    getChartConfig: () => {
        chartType: ChartType;
        chartConfig: ChartAxisConfig;
        displayConfig: ChartDisplayConfig;
    };
    getAnalysisType: () => AnalysisType;
}
export declare function useAnalysisBuilder(options?: UseAnalysisBuilderOptions): UseAnalysisBuilderResult;
