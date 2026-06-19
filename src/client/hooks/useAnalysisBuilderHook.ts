/**
 * useAnalysisBuilder - Master Coordination Hook (public facade)
 *
 * The single public hook that provides everything AnalysisBuilder needs. Its
 * return shape is the stable public contract. Internally it composes three
 * responsibility-grouped hooks along a strictly acyclic State → Query → Effects
 * data flow (#914):
 *
 * - useAnalysisState   — store reads/derivation, query-spec building, combined
 *                        fields, chart config + availability, validation, UI
 *                        state. NO dependency on execution.
 * - useAnalysisQuery   — execution only: the 5 TanStack hooks, mode routing,
 *                        skip flags, results/loading/error/debug, hasDebounced.
 * - useAnalysisEffects — init/URL parsing, AI (reads + writes store directly),
 *                        share, chart-type auto-switch (sole hasDebounced
 *                        consumer), and external onQueryChange/onChartConfigChange.
 *
 * IMPORTANT: This hook must be used within AnalysisBuilderStoreProvider
 */

import { useCubeFeatures } from '../providers/CubeProvider.js'

// Responsibility-grouped hooks
import { useAnalysisState } from './useAnalysisState.js'
import { useAnalysisQuery } from './useAnalysisQuery.js'
import { useAnalysisEffects } from './useAnalysisEffects.js'

import type { ColorPalette } from '../utils/colorPalettes.js'
import type {
  CubeQuery,
  MultiQueryConfig,
  ChartType,
  ChartAxisConfig,
  ChartDisplayConfig,
  Filter,
  QueryMergeStrategy,
  FunnelBindingKey,
  AnalysisType,
  FunnelStepState,
} from '../types.js'
import type {
  AnalysisBuilderState,
  MetricItem,
  BreakdownItem,
  ExecutionStatus,
  QueryPanelTab,
} from '../components/AnalysisBuilder/types.js'
import type { ChartAvailabilityMap } from '../shared/chartDefaults.js'
import type { DebugDataEntry } from './queries/index.js'
import type { MultiQueryValidationResult } from '../utils/multiQueryValidation.js'
import type { MetaField } from '../shared/types.js'
import type { ValidationResult } from '../adapters/modeAdapter.js'

// ============================================================================
// Types
// ============================================================================

export interface UseAnalysisBuilderOptions {
  /** External color palette (overrides local) */
  externalColorPalette?: string[] | ColorPalette
  /** Initial data (skip first fetch) */
  initialData?: unknown[]
  /** Callback when query changes */
  onQueryChange?: (query: CubeQuery) => void
  /** Callback when chart config changes */
  onChartConfigChange?: (config: {
    chartType: ChartType
    chartConfig: ChartAxisConfig
    displayConfig: ChartDisplayConfig
  }) => void
}

export interface UseAnalysisBuilderResult {
  // Query State
  queryState: AnalysisBuilderState
  queryStates: AnalysisBuilderState[]
  activeQueryIndex: number
  mergeStrategy: QueryMergeStrategy
  isMultiQueryMode: boolean
  mergeKeys: string[] | undefined
  currentQuery: CubeQuery
  allQueries: CubeQuery[]
  multiQueryConfig: MultiQueryConfig | null
  multiQueryValidation: MultiQueryValidationResult | null

  // Funnel State (legacy - merge strategy mode)
  funnelBindingKey: FunnelBindingKey | null
  /** Whether funnel mode is properly configured and ready for execution */
  isFunnelModeEnabled: boolean

  // Analysis Type State (new dedicated mode selection)
  /** Current analysis type (query, multi, funnel) */
  analysisType: AnalysisType
  /** Selected cube for funnel mode (all steps use this cube) */
  funnelCube: string | null
  /** Dedicated funnel steps (when analysisType === 'funnel') */
  funnelSteps: FunnelStepState[]
  /** Index of currently active funnel step */
  activeFunnelStepIndex: number
  /** Time dimension for funnel temporal ordering */
  funnelTimeDimension: string | null
  /** Chart type for funnel mode (separate from query mode) */
  funnelChartType: ChartType
  /** Chart config for funnel mode (separate from query mode) */
  funnelChartConfig: ChartAxisConfig
  /** Display config for funnel mode (separate from query mode) */
  funnelDisplayConfig: ChartDisplayConfig

  // Flow Mode State (when analysisType === 'flow')
  /** Selected cube for flow mode */
  flowCube: string | null
  /** Binding key for flow mode (entity linking) */
  flowBindingKey: FunnelBindingKey | null
  /** Time dimension for flow mode (event ordering) */
  flowTimeDimension: string | null
  /** Event dimension for flow mode (node labels in Sankey) */
  eventDimension: string | null
  /** Starting step configuration */
  startingStep: import('../types/flow.js').FlowStartingStep
  /** Number of steps to explore before starting step */
  stepsBefore: number
  /** Number of steps to explore after starting step */
  stepsAfter: number
  /** Join strategy for flow execution */
  joinStrategy: 'auto' | 'lateral' | 'window'
  /** Display config for flow mode */
  flowDisplayConfig: ChartDisplayConfig

  // Retention State (simplified Mixpanel-style)
  /** Single cube for retention analysis */
  retentionCube: string | null
  /** Binding key for retention mode */
  retentionBindingKey: import('../types/funnel.js').FunnelBindingKey | null
  /** Single timestamp dimension for retention mode */
  retentionTimeDimension: string | null
  /** Date range for cohort analysis (REQUIRED) */
  retentionDateRange: import('../types/retention.js').DateRange
  /** Cohort filters for retention mode */
  retentionCohortFilters: import('../types.js').Filter[]
  /** Activity filters for retention mode */
  retentionActivityFilters: import('../types.js').Filter[]
  /** Optional breakdown dimensions for segmenting the cohort */
  retentionBreakdowns: import('../types/retention.js').RetentionBreakdownItem[]
  /** Granularity for viewing retention periods (day/week/month) */
  retentionViewGranularity: import('../types/retention.js').RetentionGranularity
  /** Number of periods for retention mode */
  retentionPeriods: number
  /** Retention calculation type */
  retentionType: import('../types/retention.js').RetentionType
  /** Display config for retention mode */
  retentionDisplayConfig: ChartDisplayConfig | undefined

  // Data Fetching
  executionStatus: ExecutionStatus
  executionResults: unknown[] | null
  perQueryResults: (unknown[] | null)[] | null
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  isValidQuery: boolean
  debugDataPerQuery: DebugDataEntry[]
  /**
   * Whether the current query config differs from the last executed query.
   * Used for manual refresh mode to show "needs refresh" indicator.
   */
  needsRefresh: boolean
  /**
   * Query warnings from the server (e.g., fan-out without dimensions).
   * Displayed as a banner above results.
   */
  warnings: import('../shared/types.js').QueryWarning[] | undefined
  /** In funnel mode, the actually executed queries with binding key dimension and IN filters */
  funnelExecutedQueries: CubeQuery[] | null
  /** In funnel mode, the actual server query { funnel: {...} } sent to the API */
  funnelServerQuery: unknown | null
  /** In funnel mode, unified debug data (SQL, analysis, mode metadata) */
  funnelDebugData: DebugDataEntry | null
  /** In flow mode, the actual server query { flow: {...} } sent to the API */
  flowServerQuery: unknown | null
  /** In flow mode, unified debug data (SQL, analysis, mode metadata) */
  flowDebugData: DebugDataEntry | null
  /** In retention mode, the actual server query { retention: {...} } sent to the API */
  retentionServerQuery: unknown | null
  /** In retention mode, unified debug data (SQL, analysis, mode metadata) */
  retentionDebugData: DebugDataEntry | null
  /** In retention mode, the chart data (cohort × period matrix) */
  retentionChartData: import('../types/retention.js').RetentionChartData | null
  /** In retention mode, validation result (errors explaining why query cannot be built) */
  retentionValidation: { isValid: boolean; errors: string[]; warnings: string[] } | null

  // Chart Configuration
  chartType: ChartType
  chartConfig: ChartAxisConfig
  displayConfig: ChartDisplayConfig
  colorPalette: ColorPalette
  localPaletteName: string
  chartAvailability: ChartAvailabilityMap
  combinedMetrics: MetricItem[]
  combinedBreakdowns: BreakdownItem[]
  effectiveBreakdowns: BreakdownItem[]

  // UI State
  activeTab: QueryPanelTab
  activeView: 'table' | 'chart'
  displayLimit: number
  showFieldModal: boolean
  fieldModalMode: 'metrics' | 'breakdown'
  activeTableIndex: number
  userManuallySelectedChart: boolean

  // AI State
  aiState: {
    isOpen: boolean
    userPrompt: string
    isGenerating: boolean
    error: string | null
    hasGeneratedQuery: boolean
  }

  // Share State
  shareButtonState: 'idle' | 'copied' | 'copied-no-chart'
  canShare: boolean

  // Adapter Validation (NEW - Phase 5)
  /** Validation result from the adapter for the current analysis type */
  adapterValidation: ValidationResult

  // Actions
  actions: {
    setActiveQueryIndex: (index: number) => void
    setMergeStrategy: (strategy: QueryMergeStrategy) => void
    openMetricsModal: () => void
    addMetric: (field: string, label?: string) => void
    removeMetric: (id: string) => void
    toggleMetric: (fieldName: string) => void
    reorderMetrics: (fromIndex: number, toIndex: number) => void
    openBreakdownsModal: () => void
    addBreakdown: (field: string, isTimeDimension: boolean, granularity?: string) => void
    removeBreakdown: (id: string) => void
    toggleBreakdown: (fieldName: string, isTimeDimension: boolean, granularity?: string) => void
    setBreakdownGranularity: (id: string, granularity: string) => void
    toggleBreakdownComparison: (id: string) => void
    reorderBreakdowns: (fromIndex: number, toIndex: number) => void
    setFilters: (filters: Filter[]) => void
    dropFieldToFilter: (field: string) => void
    setOrder: (fieldName: string, direction: 'asc' | 'desc' | null) => void
    setLimit: (limit: number | undefined) => void
    addQuery: () => void
    removeQuery: (index: number) => void
    setFunnelBindingKey: (bindingKey: FunnelBindingKey | null) => void
    // Analysis Type actions
    setAnalysisType: (type: AnalysisType) => void
    // Funnel Mode actions (when analysisType === 'funnel')
    setFunnelCube: (cube: string | null) => void
    addFunnelStep: () => void
    removeFunnelStep: (index: number) => void
    updateFunnelStep: (index: number, updates: Partial<FunnelStepState>) => void
    setActiveFunnelStepIndex: (index: number) => void
    reorderFunnelSteps: (fromIndex: number, toIndex: number) => void
    setFunnelTimeDimension: (dimension: string | null) => void
    setFunnelDisplayConfig: (config: ChartDisplayConfig) => void
    // Flow Mode actions (when analysisType === 'flow')
    setFlowCube: (cube: string | null) => void
    setFlowBindingKey: (key: FunnelBindingKey | null) => void
    setFlowTimeDimension: (dim: string | null) => void
    setEventDimension: (dim: string | null) => void
    setStartingStepName: (name: string) => void
    setStartingStepFilters: (filters: Filter[]) => void
    setStepsBefore: (count: number) => void
    setStepsAfter: (count: number) => void
    setJoinStrategy: (strategy: 'auto' | 'lateral' | 'window') => void
    setFlowDisplayConfig: (config: ChartDisplayConfig) => void
    // Retention Mode actions (simplified Mixpanel-style)
    setRetentionCube: (cube: string | null) => void
    setRetentionBindingKey: (key: import('../types/funnel.js').FunnelBindingKey | null) => void
    setRetentionTimeDimension: (dim: string | null) => void
    setRetentionDateRange: (range: import('../types/retention.js').DateRange) => void
    setRetentionCohortFilters: (filters: import('../types.js').Filter[]) => void
    setRetentionActivityFilters: (filters: import('../types.js').Filter[]) => void
    setRetentionBreakdowns: (breakdowns: import('../types/retention.js').RetentionBreakdownItem[]) => void
    addRetentionBreakdown: (breakdown: import('../types/retention.js').RetentionBreakdownItem) => void
    removeRetentionBreakdown: (field: string) => void
    setRetentionViewGranularity: (granularity: import('../types/retention.js').RetentionGranularity) => void
    setRetentionPeriods: (periods: number) => void
    setRetentionType: (type: import('../types/retention.js').RetentionType) => void
    setRetentionDisplayConfig: (config: ChartDisplayConfig) => void
    setChartType: (type: ChartType) => void
    setChartConfig: (config: ChartAxisConfig) => void
    setDisplayConfig: (config: ChartDisplayConfig) => void
    setLocalPaletteName: (name: string) => void
    setActiveTab: (tab: QueryPanelTab) => void
    setActiveView: (view: 'table' | 'chart') => void
    setDisplayLimit: (limit: number) => void
    closeFieldModal: () => void
    setActiveTableIndex: (index: number) => void
    openAI: () => void
    closeAI: () => void
    setAIPrompt: (prompt: string) => void
    generateAI: () => Promise<void>
    acceptAI: () => void
    cancelAI: () => void
    share: () => Promise<void>
    clearQuery: () => void
    clearCurrentMode: () => void
    refetch: (options?: { bustCache?: boolean }) => void
    handleFieldSelected: (
      field: MetaField,
      fieldType: 'measure' | 'dimension' | 'timeDimension',
      cubeName: string,
      keepOpen?: boolean
    ) => void
  }

  // Refs (for imperative access)
  getQueryConfig: () => CubeQuery | MultiQueryConfig | import('../types/funnel.js').ServerFunnelQuery
  getChartConfig: () => {
    chartType: ChartType
    chartConfig: ChartAxisConfig
    displayConfig: ChartDisplayConfig
  }
  getAnalysisType: () => AnalysisType
}

// ============================================================================
// Hook Implementation
// ============================================================================
export function useAnalysisBuilder(
  options: UseAnalysisBuilderOptions = {}
): UseAnalysisBuilderResult {
  const { initialData, externalColorPalette, onQueryChange, onChartConfigChange } = options

  // Get context (AI endpoint for Effects)
  const { features } = useCubeFeatures()

  // =========================================================================
  // Responsibility-grouped composition: State → Query → Effects
  // =========================================================================

  // 1. State — store reads/derivation, query specs, chart config, UI state.
  const state = useAnalysisState({ externalColorPalette })

  // 2. Query — execution only (reads State's query specs + validity).
  const query = useAnalysisQuery({
    currentQuery: state.currentQuery,
    allQueries: state.allQueries,
    multiQueryConfig: state.multiQueryConfig,
    isMultiQueryMode: state.isMultiQueryMode,
    isValidQuery: state.effectiveIsValidQuery,
    initialData,
    mergeStrategy: state.mergeStrategy,
    funnelBindingKey: state.funnelBindingKey,
    isFunnelModeEnabled: state.isFunnelModeEnabled,
    analysisType: state.analysisType,
    serverFunnelQuery: state.serverFunnelQuery,
    serverFlowQuery: state.serverFlowQuery,
    serverRetentionQuery: state.serverRetentionQuery,
    retentionValidation: state.retentionValidation,
  })

  // 3. Effects — init/URL, AI, share, chart auto-switch (reads State + Query).
  const effects = useAnalysisEffects({
    state,
    query,
    aiEndpoint: features?.aiEndpoint,
    onQueryChange,
    onChartConfigChange,
  })

  // =========================================================================
  // Assemble the public return shape (stable contract — additive only)
  // =========================================================================

  return {
    // Query state
    queryState: state.queryState,
    queryStates: state.queryStates,
    activeQueryIndex: state.activeQueryIndex,
    mergeStrategy: state.mergeStrategy,
    isMultiQueryMode: state.isMultiQueryMode,
    mergeKeys: state.mergeKeys,
    currentQuery: state.currentQuery,
    allQueries: state.allQueries,
    multiQueryConfig: state.multiQueryConfig,
    multiQueryValidation: state.multiQueryValidation,

    // Funnel state (legacy)
    funnelBindingKey: state.funnelBindingKey,
    isFunnelModeEnabled: state.isFunnelModeEnabled,

    // Analysis Type state
    analysisType: state.analysisType,
    funnelCube: state.funnelCube,
    funnelSteps: state.funnelSteps,
    activeFunnelStepIndex: state.activeFunnelStepIndex,
    funnelTimeDimension: state.funnelTimeDimension,
    funnelChartType: state.funnelChartType,
    funnelChartConfig: state.funnelChartConfig,
    funnelDisplayConfig: state.funnelDisplayConfig,

    // Flow state
    flowCube: state.flowCube,
    flowBindingKey: state.flowBindingKey,
    flowTimeDimension: state.flowTimeDimension,
    eventDimension: state.eventDimension,
    startingStep: state.startingStep,
    stepsBefore: state.stepsBefore,
    stepsAfter: state.stepsAfter,
    joinStrategy: state.joinStrategy,
    flowDisplayConfig: state.flowDisplayConfig,

    // Retention state
    retentionCube: state.retentionCube,
    retentionBindingKey: state.retentionBindingKey,
    retentionTimeDimension: state.retentionTimeDimension,
    retentionDateRange: state.retentionDateRange,
    retentionCohortFilters: state.retentionCohortFilters,
    retentionActivityFilters: state.retentionActivityFilters,
    retentionBreakdowns: state.retentionBreakdowns,
    retentionViewGranularity: state.retentionViewGranularity,
    retentionPeriods: state.retentionPeriods,
    retentionType: state.retentionType,
    retentionDisplayConfig: state.retentionDisplayConfig,

    // Data fetching (from query)
    executionStatus: query.executionStatus,
    executionResults: query.executionResults,
    perQueryResults: query.perQueryResults,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isValidQuery: state.effectiveIsValidQuery,
    debugDataPerQuery: query.debugDataPerQuery,
    needsRefresh: query.needsRefresh,
    warnings: query.warnings,
    funnelExecutedQueries: query.funnelExecutedQueries,
    funnelServerQuery: query.funnelServerQuery,
    funnelDebugData: query.funnelDebugData,
    flowServerQuery: query.flowServerQuery,
    flowDebugData: query.flowDebugData,
    retentionServerQuery: query.retentionServerQuery,
    retentionDebugData: query.retentionDebugData,
    retentionChartData: query.retentionChartData,
    retentionValidation: query.retentionValidation,

    // Chart configuration (from state)
    chartType: state.chartType,
    chartConfig: state.chartConfig,
    displayConfig: state.displayConfig,
    colorPalette: state.colorPalette,
    localPaletteName: state.localPaletteName,
    chartAvailability: state.chartAvailability,
    combinedMetrics: state.combinedMetrics,
    combinedBreakdowns: state.combinedBreakdowns,
    effectiveBreakdowns: state.effectiveBreakdowns,

    // UI state (from state)
    activeTab: state.activeTab,
    activeView: state.activeView,
    displayLimit: state.displayLimit,
    showFieldModal: state.showFieldModal,
    fieldModalMode: state.fieldModalMode,
    activeTableIndex: state.activeTableIndex,
    userManuallySelectedChart: state.userManuallySelectedChart,

    // AI state (from effects)
    aiState: {
      isOpen: effects.aiState.isOpen,
      userPrompt: effects.aiState.userPrompt,
      isGenerating: effects.aiState.isGenerating,
      error: effects.aiState.error,
      hasGeneratedQuery: effects.aiState.hasGeneratedQuery,
    },

    // Share state (from effects)
    shareButtonState: effects.shareButtonState,
    canShare: effects.canShare,

    // Adapter validation (from state)
    adapterValidation: state.adapterValidation,

    // Actions
    actions: {
      // Query state
      setActiveQueryIndex: state.actions.setActiveQueryIndex,
      setMergeStrategy: state.actions.setMergeStrategy,

      // Metrics
      openMetricsModal: state.actions.openMetricsModal,
      addMetric: state.actions.addMetric,
      removeMetric: state.actions.removeMetric,
      toggleMetric: state.actions.toggleMetric,
      reorderMetrics: state.actions.reorderMetrics,

      // Breakdowns
      openBreakdownsModal: state.actions.openBreakdownsModal,
      addBreakdown: state.actions.addBreakdown,
      removeBreakdown: state.actions.removeBreakdown,
      toggleBreakdown: state.actions.toggleBreakdown,
      setBreakdownGranularity: state.actions.setBreakdownGranularity,
      toggleBreakdownComparison: state.actions.toggleBreakdownComparison,
      reorderBreakdowns: state.actions.reorderBreakdowns,

      // Filters
      setFilters: state.actions.setFilters,
      dropFieldToFilter: state.actions.dropFieldToFilter,
      setOrder: state.actions.setOrder,
      setLimit: state.actions.setLimit,

      // Multi-query
      addQuery: state.actions.addQuery,
      removeQuery: state.actions.removeQuery,

      // Funnel (legacy)
      setFunnelBindingKey: state.actions.setFunnelBindingKey,

      // Analysis Type
      setAnalysisType: state.actions.setAnalysisType,

      // Funnel Mode (dedicated state)
      setFunnelCube: state.actions.setFunnelCube,
      addFunnelStep: state.actions.addFunnelStep,
      removeFunnelStep: state.actions.removeFunnelStep,
      updateFunnelStep: state.actions.updateFunnelStep,
      setActiveFunnelStepIndex: state.actions.setActiveFunnelStepIndex,
      reorderFunnelSteps: state.actions.reorderFunnelSteps,
      setFunnelTimeDimension: state.actions.setFunnelTimeDimension,
      setFunnelDisplayConfig: state.actions.setFunnelDisplayConfig,

      // Flow Mode
      setFlowCube: state.actions.setFlowCube,
      setFlowBindingKey: state.actions.setFlowBindingKey,
      setFlowTimeDimension: state.actions.setFlowTimeDimension,
      setEventDimension: state.actions.setEventDimension,
      setStartingStepName: state.actions.setStartingStepName,
      setStartingStepFilters: state.actions.setStartingStepFilters,
      setStepsBefore: state.actions.setStepsBefore,
      setStepsAfter: state.actions.setStepsAfter,
      setJoinStrategy: state.actions.setJoinStrategy,
      setFlowDisplayConfig: state.actions.setFlowDisplayConfig,

      // Retention Mode (simplified Mixpanel-style)
      setRetentionCube: state.actions.setRetentionCube,
      setRetentionBindingKey: state.actions.setRetentionBindingKey,
      setRetentionTimeDimension: state.actions.setRetentionTimeDimension,
      setRetentionDateRange: state.actions.setRetentionDateRange,
      setRetentionCohortFilters: state.actions.setRetentionCohortFilters,
      setRetentionActivityFilters: state.actions.setRetentionActivityFilters,
      setRetentionBreakdowns: state.actions.setRetentionBreakdowns,
      addRetentionBreakdown: state.actions.addRetentionBreakdown,
      removeRetentionBreakdown: state.actions.removeRetentionBreakdown,
      setRetentionViewGranularity: state.actions.setRetentionViewGranularity,
      setRetentionPeriods: state.actions.setRetentionPeriods,
      setRetentionType: state.actions.setRetentionType,
      setRetentionDisplayConfig: state.actions.setRetentionDisplayConfig,

      // Chart (mode-aware)
      setChartType: state.actions.setChartType,
      setChartConfig: state.actions.setChartConfig,
      setDisplayConfig: state.actions.setDisplayConfig,
      setLocalPaletteName: state.actions.setLocalPaletteName,

      // UI
      setActiveTab: state.actions.setActiveTab,
      setActiveView: state.actions.setActiveView,
      setDisplayLimit: state.actions.setDisplayLimit,
      closeFieldModal: state.actions.closeFieldModal,
      setActiveTableIndex: state.actions.setActiveTableIndex,

      // AI (from effects)
      openAI: effects.openAI,
      closeAI: effects.closeAI,
      setAIPrompt: effects.setAIPrompt,
      generateAI: effects.generateAI,
      acceptAI: effects.acceptAI,
      cancelAI: effects.cancelAI,

      // Share (from effects)
      share: effects.share,

      // Utility
      clearQuery: state.actions.clearQuery,
      clearCurrentMode: state.actions.clearCurrentMode,
      refetch: query.refetch,
      handleFieldSelected: state.actions.handleFieldSelected,
    },

    // Refs (imperative access)
    getQueryConfig: state.getQueryConfig,
    getChartConfig: state.getChartConfig,
    getAnalysisType: state.getAnalysisType,
  }
}
