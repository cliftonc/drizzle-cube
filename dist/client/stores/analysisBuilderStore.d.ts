import { ReactNode } from 'react';
import { StoreApi } from 'zustand';
import { Filter, ChartType, ChartAxisConfig, ChartDisplayConfig, CubeQuery, QueryMergeStrategy, MultiQueryConfig, FunnelBindingKey, FunnelConfig, AnalysisType, FunnelStepState } from '../types.js';
import { ServerFunnelQuery } from '../types/funnel.js';
import { ServerFlowQuery, FlowStartingStep } from '../types/flow.js';
import { ServerRetentionQuery, RetentionGranularity, RetentionType, DateRange, RetentionBreakdownItem } from '../types/retention.js';
import { AnalysisBuilderState, QueryPanelTab, AIState } from '../components/AnalysisBuilder/types.js';
import { AnalysisConfig, ChartConfig, AnalysisWorkspace } from '../types/analysisConfig.js';
/**
 * Field modal mode for field search
 */
export type FieldModalMode = 'metrics' | 'breakdown';
/**
 * Complete store state interface
 */
export interface AnalysisBuilderStoreState {
    /** Explicit analysis type - determines which mode is active */
    analysisType: AnalysisType;
    /**
     * Per-mode chart configuration map.
     * Each mode owns its own chart settings, enabling mode switching
     * without losing chart configurations.
     */
    charts: {
        [K in AnalysisType]?: ChartConfig;
    };
    /**
     * Per-mode active view (table or chart) map.
     * Each mode owns its own view preference, enabling mode switching
     * without losing view preferences.
     */
    activeViews: {
        [K in AnalysisType]?: 'table' | 'chart';
    };
    /** Array of query states (one per tab) */
    queryStates: AnalysisBuilderState[];
    /** Index of the currently active query tab */
    activeQueryIndex: number;
    /** Strategy for merging multi-query results (used when queryStates.length > 1) */
    mergeStrategy: QueryMergeStrategy;
    /** Whether user manually selected chart type (disables auto-switch) */
    userManuallySelectedChart: boolean;
    /** Current color palette name */
    localPaletteName: string;
    /** Active tab in query panel */
    activeTab: QueryPanelTab;
    /** Active view (table or chart) */
    activeView: 'table' | 'chart';
    /** Display limit for table */
    displayLimit: number;
    /** Whether field search modal is open */
    showFieldModal: boolean;
    /** Current mode for field search modal */
    fieldModalMode: FieldModalMode;
    /** AI panel state */
    aiState: AIState;
    /** Selected cube for funnel mode (all steps use this cube) */
    funnelCube: string | null;
    /** Dedicated funnel steps (separate from queryStates) */
    funnelSteps: FunnelStepState[];
    /** Index of currently active funnel step */
    activeFunnelStepIndex: number;
    /** Time dimension for funnel temporal ordering */
    funnelTimeDimension: string | null;
    /** Binding key dimension that links funnel steps together */
    funnelBindingKey: FunnelBindingKey | null;
    /** @deprecated Use funnelSteps[].timeToConvert instead - kept for backward compat */
    stepTimeToConvert: (string | null)[];
    /** Selected cube for flow mode (must be an eventStream cube) */
    flowCube: string | null;
    /** Binding key that links events to entities */
    flowBindingKey: FunnelBindingKey | null;
    /** Time dimension for event ordering */
    flowTimeDimension: string | null;
    /** Starting step configuration (anchor point for exploration) */
    startingStep: FlowStartingStep;
    /** Number of steps to explore before starting step (1-5) */
    stepsBefore: number;
    /** Number of steps to explore after starting step (1-5) */
    stepsAfter: number;
    /** Event dimension that categorizes events (node labels) */
    eventDimension: string | null;
    /** Join strategy for flow execution */
    joinStrategy: 'auto' | 'lateral' | 'window';
    /** Single cube for retention analysis */
    retentionCube: string | null;
    /** Binding key that identifies entities */
    retentionBindingKey: FunnelBindingKey | null;
    /** Single timestamp dimension for cohort entry and activity */
    retentionTimeDimension: string | null;
    /** Date range for cohort analysis (REQUIRED) */
    retentionDateRange: DateRange;
    /** Filters that define who enters the cohort */
    retentionCohortFilters: Filter[];
    /** Filters that define what counts as a return */
    retentionActivityFilters: Filter[];
    /** Optional breakdown dimensions for segmenting the cohort */
    retentionBreakdowns: RetentionBreakdownItem[];
    /** Granularity for viewing retention periods (day/week/month) */
    retentionViewGranularity: RetentionGranularity;
    /** Number of periods to analyze (1-52) */
    retentionPeriods: number;
    /** Type of retention calculation */
    retentionType: RetentionType;
}
/**
 * Store actions interface
 */
export interface AnalysisBuilderStoreActions {
    /** Set the analysis type (switches between Query/Multi/Funnel modes) */
    setAnalysisType: (type: AnalysisType) => void;
    /** Set all query states */
    setQueryStates: (states: AnalysisBuilderState[]) => void;
    /** Update a specific query state by index */
    updateQueryState: (index: number, updater: (state: AnalysisBuilderState) => AnalysisBuilderState) => void;
    /** Set active query index */
    setActiveQueryIndex: (index: number) => void;
    /** Set merge strategy */
    setMergeStrategy: (strategy: QueryMergeStrategy) => void;
    /** Open field modal in metrics mode */
    openMetricsModal: () => void;
    /** Add a metric to current query */
    addMetric: (field: string, label?: string) => void;
    /** Remove a metric from current query */
    removeMetric: (id: string) => void;
    /** Toggle a metric (add if not present, remove if present) */
    toggleMetric: (fieldName: string) => void;
    /** Reorder metrics */
    reorderMetrics: (fromIndex: number, toIndex: number) => void;
    /** Open field modal in breakdown mode */
    openBreakdownsModal: () => void;
    /** Add a breakdown to current query */
    addBreakdown: (field: string, isTimeDimension: boolean, granularity?: string) => void;
    /** Remove a breakdown from current query */
    removeBreakdown: (id: string) => void;
    /** Toggle a breakdown (add if not present, remove if present) */
    toggleBreakdown: (fieldName: string, isTimeDimension: boolean, granularity?: string) => void;
    /** Change granularity for a time dimension breakdown */
    setBreakdownGranularity: (id: string, granularity: string) => void;
    /** Toggle comparison mode for a time dimension breakdown */
    toggleBreakdownComparison: (id: string) => void;
    /** Reorder breakdowns */
    reorderBreakdowns: (fromIndex: number, toIndex: number) => void;
    /** Set filters for current query */
    setFilters: (filters: Filter[]) => void;
    /** Drop a field to create a filter */
    dropFieldToFilter: (field: string) => void;
    /** Set sort order for a field */
    setOrder: (fieldName: string, direction: 'asc' | 'desc' | null) => void;
    /** Set row limit for the query (sent to server) */
    setLimit: (limit: number | undefined) => void;
    /** Add a new query tab */
    addQuery: () => void;
    /** Remove a query tab */
    removeQuery: (index: number) => void;
    /** Set chart type */
    setChartType: (type: ChartType) => void;
    /** Set chart type with manual selection flag */
    setChartTypeManual: (type: ChartType) => void;
    /** Set chart config */
    setChartConfig: (config: ChartAxisConfig) => void;
    /** Set display config */
    setDisplayConfig: (config: ChartDisplayConfig) => void;
    /** Set color palette name */
    setLocalPaletteName: (name: string) => void;
    /** Set user manually selected chart flag */
    setUserManuallySelectedChart: (value: boolean) => void;
    /** Set active tab */
    setActiveTab: (tab: QueryPanelTab) => void;
    /** Set active view */
    setActiveView: (view: 'table' | 'chart') => void;
    /** Set display limit */
    setDisplayLimit: (limit: number) => void;
    /** Close field modal */
    closeFieldModal: () => void;
    /** Open AI panel */
    openAI: () => void;
    /** Close AI panel */
    closeAI: () => void;
    /** Set AI prompt */
    setAIPrompt: (prompt: string) => void;
    /** Set AI generating state */
    setAIGenerating: (generating: boolean) => void;
    /** Set AI error */
    setAIError: (error: string | null) => void;
    /** Set AI has generated query */
    setAIHasGeneratedQuery: (hasQuery: boolean) => void;
    /** Save previous state for AI undo */
    saveAIPreviousState: () => void;
    /** Restore previous state (AI cancel/undo) */
    restoreAIPreviousState: () => void;
    /** Add a new funnel step */
    addFunnelStep: () => void;
    /** Remove a funnel step by index */
    removeFunnelStep: (index: number) => void;
    /** Update a funnel step by index */
    updateFunnelStep: (index: number, updates: Partial<FunnelStepState>) => void;
    /** Set the active funnel step index */
    setActiveFunnelStepIndex: (index: number) => void;
    /** Reorder funnel steps */
    reorderFunnelSteps: (fromIndex: number, toIndex: number) => void;
    /** Set the time dimension for funnel */
    setFunnelTimeDimension: (dimension: string | null) => void;
    /** Set the funnel binding key */
    setFunnelBindingKey: (bindingKey: FunnelBindingKey | null) => void;
    /** Set the funnel cube (clears binding key/time dimension, updates all steps) */
    setFunnelCube: (cube: string | null) => void;
    /** @deprecated Set time window for a specific step - use updateFunnelStep instead */
    setStepTimeToConvert: (stepIndex: number, duration: string | null) => void;
    /** @deprecated Build FunnelConfig from queryStates - use buildFunnelQueryFromSteps instead */
    buildFunnelConfig: () => FunnelConfig | null;
    /** Build ServerFunnelQuery from dedicated funnelSteps */
    buildFunnelQueryFromSteps: () => ServerFunnelQuery | null;
    /** Check if in funnel mode (analysisType === 'funnel') */
    isFunnelMode: () => boolean;
    /** Check if funnel mode is properly configured and ready for execution */
    isFunnelModeEnabled: () => boolean;
    /** Set funnel chart type */
    setFunnelChartType: (type: ChartType) => void;
    /** Set funnel chart config */
    setFunnelChartConfig: (config: ChartAxisConfig) => void;
    /** Set funnel display config */
    setFunnelDisplayConfig: (config: ChartDisplayConfig) => void;
    /** Set the flow cube (clears binding key/time dimension) */
    setFlowCube: (cube: string | null) => void;
    /** Set the flow binding key */
    setFlowBindingKey: (key: FunnelBindingKey | null) => void;
    /** Set the flow time dimension */
    setFlowTimeDimension: (dim: string | null) => void;
    /** Set the event dimension */
    setEventDimension: (dim: string | null) => void;
    /** Set the starting step name */
    setStartingStepName: (name: string) => void;
    /** Set all starting step filters at once */
    setStartingStepFilters: (filters: Filter[]) => void;
    /** Add a filter to the starting step */
    addStartingStepFilter: (filter: Filter) => void;
    /** Remove a filter from the starting step by index */
    removeStartingStepFilter: (index: number) => void;
    /** Update a filter in the starting step by index */
    updateStartingStepFilter: (index: number, filter: Filter) => void;
    /** Set the number of steps to explore before starting step */
    setStepsBefore: (count: number) => void;
    /** Set the number of steps to explore after starting step */
    setStepsAfter: (count: number) => void;
    /** Set the join strategy for flow execution */
    setJoinStrategy: (strategy: 'auto' | 'lateral' | 'window') => void;
    /** Check if in flow mode (analysisType === 'flow') */
    isFlowMode: () => boolean;
    /** Check if flow mode is properly configured and ready for execution */
    isFlowModeEnabled: () => boolean;
    /** Build ServerFlowQuery from flow state */
    buildFlowQuery: () => ServerFlowQuery | null;
    /** Set the single cube for retention analysis (clears related fields) */
    setRetentionCube: (cube: string | null) => void;
    /** Set the retention binding key */
    setRetentionBindingKey: (key: FunnelBindingKey | null) => void;
    /** Set the single timestamp dimension */
    setRetentionTimeDimension: (dim: string | null) => void;
    /** Set the date range (REQUIRED) */
    setRetentionDateRange: (range: DateRange) => void;
    /** Set all cohort filters at once */
    setRetentionCohortFilters: (filters: Filter[]) => void;
    /** Add a cohort filter */
    addRetentionCohortFilter: (filter: Filter) => void;
    /** Remove a cohort filter by index */
    removeRetentionCohortFilter: (index: number) => void;
    /** Update a cohort filter by index */
    updateRetentionCohortFilter: (index: number, filter: Filter) => void;
    /** Set all activity filters at once */
    setRetentionActivityFilters: (filters: Filter[]) => void;
    /** Add an activity filter */
    addRetentionActivityFilter: (filter: Filter) => void;
    /** Remove an activity filter by index */
    removeRetentionActivityFilter: (index: number) => void;
    /** Update an activity filter by index */
    updateRetentionActivityFilter: (index: number, filter: Filter) => void;
    /** Set all breakdown dimensions */
    setRetentionBreakdowns: (breakdowns: RetentionBreakdownItem[]) => void;
    /** Add a breakdown dimension */
    addRetentionBreakdown: (breakdown: RetentionBreakdownItem) => void;
    /** Remove a breakdown dimension by field */
    removeRetentionBreakdown: (field: string) => void;
    /** Set the view granularity */
    setRetentionViewGranularity: (granularity: RetentionGranularity) => void;
    /** Set the number of periods */
    setRetentionPeriods: (periods: number) => void;
    /** Set the retention type */
    setRetentionType: (type: RetentionType) => void;
    /** Check if in retention mode (analysisType === 'retention') */
    isRetentionMode: () => boolean;
    /** Check if retention mode is properly configured and ready for execution */
    isRetentionModeEnabled: () => boolean;
    /** Build ServerRetentionQuery from retention state */
    buildRetentionQuery: () => ServerRetentionQuery | null;
    /** Get validation errors explaining why retention query cannot be built */
    getRetentionValidation: () => {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    };
    /** Clear only the current mode's state (preserves other modes) */
    clearCurrentMode: () => void;
    /** @deprecated Clear the current query - use clearCurrentMode instead */
    clearQuery: () => void;
    /** Get current state (helper accessor) */
    getCurrentState: () => AnalysisBuilderState;
    /** Get merge keys (computed from Q1 breakdowns) */
    getMergeKeys: () => string[] | undefined;
    /** Check if in multi-query mode */
    isMultiQueryMode: () => boolean;
    /** Build current CubeQuery */
    buildCurrentQuery: () => CubeQuery;
    /** Build all queries */
    buildAllQueries: () => CubeQuery[];
    /** Build MultiQueryConfig */
    buildMultiQueryConfig: () => MultiQueryConfig | null;
    /** Reset store to initial state */
    reset: () => void;
    /**
     * Save current state to AnalysisConfig format.
     * Delegates to the appropriate adapter based on analysisType.
     * Use for share URLs and portlets (single-mode).
     */
    save: () => AnalysisConfig;
    /**
     * Load state from AnalysisConfig.
     * Delegates to the appropriate adapter based on config.analysisType.
     * Use for share URLs and portlets (single-mode).
     */
    load: (config: AnalysisConfig) => void;
    /**
     * Save ALL modes to AnalysisWorkspace format.
     * Used for localStorage persistence to preserve state across mode switches.
     */
    saveWorkspace: () => AnalysisWorkspace;
    /**
     * Load ALL modes from AnalysisWorkspace.
     * Used for localStorage persistence to restore state for all modes.
     */
    loadWorkspace: (workspace: AnalysisWorkspace) => void;
    /**
     * Validate current state using the adapter for the current analysis type.
     * Returns validation errors and warnings that can be displayed to the user.
     */
    getValidation: () => import('../adapters/modeAdapter.js').ValidationResult;
}
/**
 * Combined store type
 */
export type AnalysisBuilderStore = AnalysisBuilderStoreState & AnalysisBuilderStoreActions;
/**
 * Initial funnel state for creating a store instance.
 * Chart configuration is handled via CreateStoreOptions.initialChartConfig instead.
 */
export interface InitialFunnelState {
    funnelCube?: string | null;
    funnelSteps?: FunnelStepState[];
    funnelTimeDimension?: string | null;
    funnelBindingKey?: FunnelBindingKey | null;
}
export interface InitialFlowState {
    flowCube?: string | null;
    flowBindingKey?: FunnelBindingKey | null;
    flowTimeDimension?: string | null;
    startingStep?: FlowStartingStep;
    stepsBefore?: number;
    stepsAfter?: number;
    eventDimension?: string | null;
    joinStrategy?: 'auto' | 'lateral' | 'window';
}
export interface InitialRetentionState {
    retentionCube?: string | null;
    retentionBindingKey?: FunnelBindingKey | null;
    retentionTimeDimension?: string | null;
    retentionDateRange?: DateRange;
    retentionCohortFilters?: Filter[];
    retentionActivityFilters?: Filter[];
    retentionBreakdowns?: RetentionBreakdownItem[];
    retentionViewGranularity?: RetentionGranularity;
    retentionPeriods?: number;
    retentionType?: RetentionType;
}
/**
 * Options for creating a store instance
 */
export interface CreateStoreOptions {
    /** Initial query configuration */
    initialQuery?: CubeQuery | MultiQueryConfig;
    /** Initial chart configuration */
    initialChartConfig?: {
        chartType?: ChartType;
        chartConfig?: ChartAxisConfig;
        displayConfig?: ChartDisplayConfig;
    };
    /** Disable localStorage persistence */
    disableLocalStorage?: boolean;
    /** Custom localStorage key (for scoping persistence per connection/context) */
    storageKey?: string;
    /** Initial analysis type (query or funnel) */
    initialAnalysisType?: AnalysisType;
    /** Initial funnel state (when analysisType === 'funnel') */
    initialFunnelState?: InitialFunnelState;
    /** Initial flow state (when analysisType === 'flow') */
    initialFlowState?: InitialFlowState;
    /** Initial retention state (when analysisType === 'retention') */
    initialRetentionState?: InitialRetentionState;
    /** Initial active view (table or chart) - used to prevent flash when loading from share */
    initialActiveView?: 'table' | 'chart';
}
/**
 * Create a new store instance with optional persistence.
 * Composes slices: coreSlice, querySlice, funnelSlice, uiSlice.
 */
export declare function createAnalysisBuilderStore(options?: CreateStoreOptions): Omit<Omit<StoreApi<AnalysisBuilderStore>, "setState" | "devtools"> & {
    setState(partial: AnalysisBuilderStore | Partial<AnalysisBuilderStore> | ((state: AnalysisBuilderStore) => AnalysisBuilderStore | Partial<AnalysisBuilderStore>), replace?: false | undefined, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    setState(state: AnalysisBuilderStore | ((state: AnalysisBuilderStore) => AnalysisBuilderStore), replace: true, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    devtools: {
        cleanup: () => void;
    };
}, "subscribe"> & {
    subscribe: {
        (listener: (selectedState: AnalysisBuilderStore, previousSelectedState: AnalysisBuilderStore) => void): () => void;
        <U>(selector: (state: AnalysisBuilderStore) => U, listener: (selectedState: U, previousSelectedState: U) => void, options?: {
            equalityFn?: ((a: U, b: U) => boolean) | undefined;
            fireImmediately?: boolean;
        } | undefined): () => void;
    };
};
/**
 * Provider props
 */
export interface AnalysisBuilderStoreProviderProps {
    children: ReactNode;
    /** Initial query configuration */
    initialQuery?: CubeQuery | MultiQueryConfig;
    /** Initial chart configuration */
    initialChartConfig?: {
        chartType?: ChartType;
        chartConfig?: ChartAxisConfig;
        displayConfig?: ChartDisplayConfig;
    };
    /** Disable localStorage persistence */
    disableLocalStorage?: boolean;
    /** Custom localStorage key (for scoping persistence per connection/context) */
    storageKey?: string;
    /** Initial analysis type (query or funnel) */
    initialAnalysisType?: AnalysisType;
    /** Initial funnel state (when analysisType === 'funnel') */
    initialFunnelState?: InitialFunnelState;
    /** Initial flow state (when analysisType === 'flow') */
    initialFlowState?: InitialFlowState;
    /** Initial retention state (when analysisType === 'retention') */
    initialRetentionState?: InitialRetentionState;
    /** Initial active view (table or chart) - used to prevent flash when loading from share */
    initialActiveView?: 'table' | 'chart';
}
/**
 * Provider component that creates a store instance per AnalysisBuilder
 */
export declare function AnalysisBuilderStoreProvider({ children, initialQuery, initialChartConfig, disableLocalStorage, storageKey, initialAnalysisType, initialFunnelState, initialFlowState, initialRetentionState, initialActiveView, }: AnalysisBuilderStoreProviderProps): import("react").JSX.Element;
/**
 * Hook to access the store from context
 * @throws Error if used outside of provider
 */
export declare function useAnalysisBuilderStore<T>(selector: (state: AnalysisBuilderStore) => T): T;
/**
 * Hook to get the raw store API (for actions that need direct access)
 */
export declare function useAnalysisBuilderStoreApi(): StoreApi<AnalysisBuilderStore>;
/**
 * Select current query state
 */
export declare const selectCurrentState: (state: AnalysisBuilderStore) => AnalysisBuilderState;
/**
 * Select current metrics
 */
export declare const selectMetrics: (state: AnalysisBuilderStore) => import('../components/AnalysisBuilder/types.js').MetricItem[];
/**
 * Select current breakdowns
 */
export declare const selectBreakdowns: (state: AnalysisBuilderStore) => import('../components/AnalysisBuilder/types.js').BreakdownItem[];
/**
 * Select current filters
 */
export declare const selectFilters: (state: AnalysisBuilderStore) => Filter[];
/**
 * Select current chart config from the charts map (NEW - Phase 2)
 * This is the preferred way to access chart configuration.
 * Falls back to default chart config if mode's config is missing.
 */
export declare const selectCurrentChartConfig: (state: AnalysisBuilderStore) => ChartConfig;
/**
 * Select chart type from current mode's chart config
 */
export declare const selectChartType: (state: AnalysisBuilderStore) => ChartType;
/**
 * Select chart axis config from current mode's chart config
 */
export declare const selectChartAxisConfig: (state: AnalysisBuilderStore) => ChartAxisConfig;
/**
 * Select display config from current mode's chart config
 */
export declare const selectChartDisplayConfig: (state: AnalysisBuilderStore) => ChartDisplayConfig;
/**
 * Select chart configuration (returns mode-appropriate config)
 * @deprecated Use selectCurrentChartConfig instead (reads from charts map)
 */
export declare const selectChartConfig: (state: AnalysisBuilderStore) => {
    chartType: ChartType;
    chartConfig: ChartAxisConfig;
    displayConfig: ChartDisplayConfig;
};
/**
 * Select query mode chart configuration (always returns query mode config)
 */
export declare const selectQueryModeChartConfig: (state: AnalysisBuilderStore) => {
    chartType: ChartType;
    chartConfig: ChartAxisConfig;
    displayConfig: ChartDisplayConfig;
};
/**
 * Select funnel mode chart configuration (always returns funnel mode config)
 */
export declare const selectFunnelModeChartConfig: (state: AnalysisBuilderStore) => {
    chartType: ChartType;
    chartConfig: ChartAxisConfig;
    displayConfig: ChartDisplayConfig;
};
/**
 * Select UI state
 */
export declare const selectUIState: (state: AnalysisBuilderStore) => {
    activeTab: QueryPanelTab;
    activeView: "table" | "chart";
    displayLimit: number;
    showFieldModal: boolean;
    fieldModalMode: FieldModalMode;
};
/**
 * Select analysis type
 */
export declare const selectAnalysisType: (state: AnalysisBuilderStore) => AnalysisType;
/**
 * Select multi-query state
 */
export declare const selectMultiQueryState: (state: AnalysisBuilderStore) => {
    queryStates: AnalysisBuilderState[];
    activeQueryIndex: number;
    mergeStrategy: QueryMergeStrategy;
    isMultiQueryMode: boolean;
};
/**
 * Select funnel cube
 */
export declare const selectFunnelCube: (state: AnalysisBuilderStore) => string | null;
/**
 * Select funnel state (new dedicated state)
 */
export declare const selectFunnelState: (state: AnalysisBuilderStore) => {
    funnelCube: string | null;
    funnelSteps: FunnelStepState[];
    activeFunnelStepIndex: number;
    funnelTimeDimension: string | null;
    funnelBindingKey: FunnelBindingKey | null;
    isFunnelMode: boolean;
    stepTimeToConvert: (string | null)[];
};
