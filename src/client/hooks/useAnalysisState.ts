/**
 * useAnalysisState
 *
 * State responsibility for the Analysis Builder. Owns everything derived from
 * the Zustand store that does NOT depend on query execution:
 *
 * - Query-spec building (single + multi via `buildCubeQuery`) and validation
 * - Combined metrics / breakdowns for chart config
 * - Per-mode state reads (funnel / flow / retention) and their server queries
 *   (`serverFunnelQuery` / `serverFlowQuery` / `serverRetentionQuery`)
 * - Chart CONFIG + availability + mode-aware setters (NOT the auto-switch effect,
 *   which lives in `useAnalysisEffects` as the sole `hasDebounced` consumer)
 * - Adapter + retention validation, effective query validity
 * - UI state (tabs / view / modals / displayLimit / activeTableIndex)
 * - Imperative ref getters (getQueryConfig / getChartConfig / getAnalysisType)
 *
 * Strictly NO dependency on execution — its outputs (query specs + validity)
 * flow downstream into `useAnalysisQuery`.
 *
 * Pure leaf helpers stay extracted (`buildCubeQuery`, multi-query validators).
 */

import { useState, useMemo, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  useAnalysisBuilderStore,
  useAnalysisBuilderStoreApi,
  selectChartConfig,
} from '../stores/analysisBuilderStore.js'
import { validateMultiQueryConfig, type MultiQueryValidationResult } from '../utils/multiQueryValidation.js'
import { buildCubeQuery } from '../components/AnalysisBuilder/utils/index.js'
import { getAllChartAvailability, getSmartChartDefaults } from '../shared/chartDefaults.js'
import { getColorPalette, type ColorPalette } from '../utils/colorPalettes.js'
import type {
  MultiQueryConfig,
  ChartType,
  ChartAxisConfig,
  ChartDisplayConfig,
} from '../types.js'
import type {
  MetricItem,
  BreakdownItem,
} from '../components/AnalysisBuilder/types.js'
import type { ChartAvailabilityMap } from '../shared/chartDefaults.js'
import type { MetaField } from '../shared/types.js'

export interface UseAnalysisStateOptions {
  /** External color palette (overrides local) */
  externalColorPalette?: string[] | ColorPalette
}

export function useAnalysisState(options: UseAnalysisStateOptions = {}) {
  const { externalColorPalette } = options

  // Store API for direct access (imperative getters + display-config wrappers)
  const storeApi = useAnalysisBuilderStoreApi()

  // =========================================================================
  // Query Builder (query state, building, validation)
  // =========================================================================
  const queryStates = useAnalysisBuilderStore((state) => state.queryStates)
  const activeQueryIndex = useAnalysisBuilderStore((state) => state.activeQueryIndex)
  const mergeStrategy = useAnalysisBuilderStore((state) => state.mergeStrategy)

  const setActiveQueryIndex = useAnalysisBuilderStore((state) => state.setActiveQueryIndex)
  const setMergeStrategy = useAnalysisBuilderStore((state) => state.setMergeStrategy)
  const addQuery = useAnalysisBuilderStore((state) => state.addQuery)
  const removeQuery = useAnalysisBuilderStore((state) => state.removeQuery)

  const getCurrentState = useAnalysisBuilderStore((state) => state.getCurrentState)
  const getMergeKeys = useAnalysisBuilderStore((state) => state.getMergeKeys)
  const isMultiQueryModeGetter = useAnalysisBuilderStore((state) => state.isMultiQueryMode)

  const queryState = getCurrentState()
  const isMultiQueryMode = isMultiQueryModeGetter()
  const mergeKeys = getMergeKeys()

  // Build current query from active state
  const currentQuery = useMemo(() => {
    const current = queryStates[activeQueryIndex] || queryState
    return buildCubeQuery(current.metrics, current.breakdowns, current.filters, current.order, false, current.limit)
  }, [queryStates, activeQueryIndex, queryState])

  // Build all queries (respect merge mode for shared breakdowns)
  const allQueries = useMemo(() => {
    const q1Breakdowns = queryStates[0]?.breakdowns || []
    return queryStates.map((qs, index) => {
      const breakdowns = mergeStrategy === 'merge' && index > 0 ? q1Breakdowns : qs.breakdowns
      return buildCubeQuery(qs.metrics, breakdowns, qs.filters, qs.order, false, qs.limit)
    })
  }, [queryStates, mergeStrategy])

  // Build multi-query config from queries
  const multiQueryConfig = useMemo((): MultiQueryConfig | null => {
    if (queryStates.length <= 1) return null

    // Filter to queries that have at least one measure, dimension, or time dimension
    // Note: Legacy mergeStrategy === 'funnel' is no longer supported
    const validQueries = allQueries.filter((q) => {
      return (
        (q.measures && q.measures.length > 0) ||
        (q.dimensions && q.dimensions.length > 0) ||
        (q.timeDimensions && q.timeDimensions.length > 0)
      )
    })

    if (validQueries.length < 2) return null

    return {
      queries: validQueries,
      mergeStrategy,
      mergeKeys,
      queryLabels: validQueries.map((_, i) => `Q${i + 1}`),
    }
  }, [allQueries, queryStates.length, mergeStrategy, mergeKeys])

  // Validate multi-query configuration
  const multiQueryValidation = useMemo((): MultiQueryValidationResult | null => {
    if (!isMultiQueryMode) return null
    return validateMultiQueryConfig(allQueries, mergeStrategy, mergeKeys || [])
  }, [isMultiQueryMode, allQueries, mergeStrategy, mergeKeys])

  // Check if query is valid (raw query/multi validity — independent of mode)
  const isValidQuery = useMemo(() => {
    return (
      (currentQuery.measures && currentQuery.measures.length > 0) ||
      (currentQuery.dimensions && currentQuery.dimensions.length > 0) ||
      (currentQuery.timeDimensions && currentQuery.timeDimensions.length > 0)
    )
  }, [currentQuery])

  // =========================================================================
  // Combined Fields (multi-query field merging)
  // =========================================================================
  const combinedMetrics = useMemo(() => {
    if (!isMultiQueryMode) return queryState.metrics
    const seen = new Set<string>()
    const combined: MetricItem[] = []
    for (let qIndex = 0; qIndex < queryStates.length; qIndex++) {
      const qs = queryStates[qIndex]
      for (const metric of qs.metrics) {
        const key = `Q${qIndex + 1}:${metric.field}`
        if (!seen.has(key)) {
          seen.add(key)
          combined.push({
            ...metric,
            label: `${metric.label} (Q${qIndex + 1})`,
          })
        }
      }
    }
    return combined
  }, [isMultiQueryMode, queryStates, queryState.metrics])

  const combinedBreakdowns = useMemo(() => {
    if (!isMultiQueryMode) return queryState.breakdowns
    const seen = new Set<string>()
    const combined: BreakdownItem[] = []
    for (const qs of queryStates) {
      for (const breakdown of qs.breakdowns) {
        if (!seen.has(breakdown.field)) {
          seen.add(breakdown.field)
          combined.push(breakdown)
        }
      }
    }
    return combined
  }, [isMultiQueryMode, queryStates, queryState.breakdowns])

  // Effective breakdowns for the current view
  // In merge mode, Q2+ should visually show Q1's breakdowns since they're shared
  const effectiveBreakdowns = useMemo(() => {
    if (mergeStrategy === 'merge' && activeQueryIndex > 0) {
      return queryStates[0]?.breakdowns || []
    }
    return queryState.breakdowns
  }, [mergeStrategy, activeQueryIndex, queryStates, queryState.breakdowns])

  // =========================================================================
  // Analysis Type + per-mode state reads
  // =========================================================================
  const analysisType = useAnalysisBuilderStore((s) => s.analysisType)
  const funnelBindingKey = useAnalysisBuilderStore((s) => s.funnelBindingKey)
  const funnelCube = useAnalysisBuilderStore((s) => s.funnelCube)
  const funnelSteps = useAnalysisBuilderStore((s) => s.funnelSteps)
  const activeFunnelStepIndex = useAnalysisBuilderStore((s) => s.activeFunnelStepIndex)
  const funnelTimeDimension = useAnalysisBuilderStore((s) => s.funnelTimeDimension)

  // Funnel mode enabled (computed to avoid function call in selector; includes
  // filter-only step validation)
  const isFunnelModeEnabled = useMemo(() => {
    if (analysisType !== 'funnel') return false
    if (!funnelBindingKey?.dimension) return false
    if (!funnelTimeDimension) return false
    if (!funnelSteps || funnelSteps.length < 2) return false
    return funnelSteps.every((step) => step.filters.length > 0)
  }, [analysisType, funnelBindingKey, funnelTimeDimension, funnelSteps])

  // Phase 4: Read funnel chart config from charts map (stable selectors avoid loops)
  const funnelChartType = useAnalysisBuilderStore((s) => s.charts.funnel?.chartType) || 'funnel'
  const funnelChartConfigFromStore = useAnalysisBuilderStore((s) => s.charts.funnel?.chartConfig)
  const funnelChartConfig = useMemo(() => funnelChartConfigFromStore || {}, [funnelChartConfigFromStore])
  const funnelDisplayConfigFromStore = useAnalysisBuilderStore((state) => state.charts.funnel?.displayConfig)
  const funnelDisplayConfig = useMemo(
    () => funnelDisplayConfigFromStore || { showLegend: true, showGrid: true, showTooltip: true },
    [funnelDisplayConfigFromStore]
  )

  // Flow mode state
  const flowCube = useAnalysisBuilderStore((s) => s.flowCube)
  const flowBindingKey = useAnalysisBuilderStore((s) => s.flowBindingKey)
  const flowTimeDimension = useAnalysisBuilderStore((s) => s.flowTimeDimension)
  const eventDimension = useAnalysisBuilderStore((s) => s.eventDimension)
  const startingStep = useAnalysisBuilderStore((s) => s.startingStep)
  const stepsBefore = useAnalysisBuilderStore((s) => s.stepsBefore)
  const stepsAfter = useAnalysisBuilderStore((s) => s.stepsAfter)
  const joinStrategy = useAnalysisBuilderStore((s) => s.joinStrategy)
  const flowDisplayConfigFromStore = useAnalysisBuilderStore((state) => state.charts.flow?.displayConfig)
  const flowDisplayConfig = useMemo(
    () => flowDisplayConfigFromStore || { showLegend: true, showGrid: true, showTooltip: true },
    [flowDisplayConfigFromStore]
  )
  // Flow chart type from charts map - needed for outputMode in query
  const flowChartType = useAnalysisBuilderStore((state) => state.charts.flow?.chartType) || 'sankey'

  // Build server funnel query from dedicated funnelSteps (when analysisType === 'funnel')
  // Note: funnelSteps must be in dependency array so query rebuilds when filters change
  const buildFunnelQueryFromSteps = useAnalysisBuilderStore((s) => s.buildFunnelQueryFromSteps)
  const serverFunnelQuery = useMemo(() => {
    if (analysisType !== 'funnel') return null
    return buildFunnelQueryFromSteps()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- funnelSteps triggers rebuild when step filters change
  }, [analysisType, buildFunnelQueryFromSteps, funnelSteps])

  const buildFlowQuery = useAnalysisBuilderStore((s) => s.buildFlowQuery)

  // Build server flow query (when analysisType === 'flow')
  // Note: flowChartType is included because it determines outputMode (sankey vs sunburst aggregation)
  const serverFlowQuery = useMemo(() => {
    if (analysisType !== 'flow') return null
    return buildFlowQuery()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flow config values trigger rebuild when they change in store
  }, [analysisType, buildFlowQuery, flowCube, flowBindingKey, flowTimeDimension, eventDimension, startingStep, stepsBefore, stepsAfter, flowChartType, joinStrategy])

  // Retention state (simplified Mixpanel-style)
  const retentionCube = useAnalysisBuilderStore((s) => s.retentionCube)
  const retentionBindingKey = useAnalysisBuilderStore((s) => s.retentionBindingKey)
  const retentionTimeDimension = useAnalysisBuilderStore((s) => s.retentionTimeDimension)
  const retentionDateRange = useAnalysisBuilderStore((s) => s.retentionDateRange)
  const retentionCohortFilters = useAnalysisBuilderStore((s) => s.retentionCohortFilters)
  const retentionActivityFilters = useAnalysisBuilderStore((s) => s.retentionActivityFilters)
  const retentionBreakdowns = useAnalysisBuilderStore((s) => s.retentionBreakdowns)
  const retentionViewGranularity = useAnalysisBuilderStore((s) => s.retentionViewGranularity)
  const retentionPeriods = useAnalysisBuilderStore((s) => s.retentionPeriods)
  const retentionType = useAnalysisBuilderStore((s) => s.retentionType)
  const buildRetentionQuery = useAnalysisBuilderStore((s) => s.buildRetentionQuery)
  const getRetentionValidation = useAnalysisBuilderStore((s) => s.getRetentionValidation)
  const retentionDisplayConfig = useAnalysisBuilderStore((s) => s.charts.retention?.displayConfig)

  // Build server retention query (when analysisType === 'retention')
  const serverRetentionQuery = useMemo(() => {
    if (analysisType !== 'retention') return null
    return buildRetentionQuery()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- retention config values trigger rebuild when they change in store
  }, [
    analysisType,
    buildRetentionQuery,
    retentionCube,
    retentionBindingKey,
    retentionTimeDimension,
    retentionDateRange,
    retentionBreakdowns,
    retentionViewGranularity,
    retentionPeriods,
    retentionType,
    retentionCohortFilters,
    retentionActivityFilters,
  ])

  // Retention validation (memoized based on config changes)
  const retentionValidation = useMemo(() => {
    if (analysisType !== 'retention') return null
    return getRetentionValidation()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- retention config values trigger rebuild
  }, [
    analysisType,
    getRetentionValidation,
    retentionCube,
    retentionBindingKey,
    retentionTimeDimension,
    retentionDateRange,
  ])

  // Effective isValidQuery that considers funnel, flow, and retention modes
  const effectiveIsValidQuery = useMemo(() => {
    if (analysisType === 'retention') {
      return serverRetentionQuery !== null
    }
    if (analysisType === 'flow') {
      return serverFlowQuery !== null
    }
    if (analysisType === 'funnel') {
      return serverFunnelQuery !== null
    }
    // Query/Multi mode: use the standard validation
    return isValidQuery ?? false
  }, [analysisType, serverRetentionQuery, serverFlowQuery, serverFunnelQuery, isValidQuery])

  // =========================================================================
  // Chart configuration (CONFIG + availability + mode-aware setters)
  // The chart-type AUTO-SWITCH effect lives in useAnalysisEffects.
  // =========================================================================
  const { chartType, chartConfig, displayConfig } = useAnalysisBuilderStore(useShallow(selectChartConfig))

  const userManuallySelectedChart = useAnalysisBuilderStore((state) => state.userManuallySelectedChart)
  const localPaletteName = useAnalysisBuilderStore((state) => state.localPaletteName)

  // Store actions - Query mode chart
  const setChartTypeManual = useAnalysisBuilderStore((state) => state.setChartTypeManual)
  const setQueryChartConfig = useAnalysisBuilderStore((state) => state.setChartConfig)
  const setQueryDisplayConfig = useAnalysisBuilderStore((state) => state.setDisplayConfig)

  // Store actions - Funnel mode chart
  const setFunnelChartType = useAnalysisBuilderStore((state) => state.setFunnelChartType)
  const setFunnelChartConfig = useAnalysisBuilderStore((state) => state.setFunnelChartConfig)
  const setFunnelDisplayConfig = useAnalysisBuilderStore((state) => state.setFunnelDisplayConfig)

  // Shared chart actions
  const setLocalPaletteName = useAnalysisBuilderStore((state) => state.setLocalPaletteName)
  const setUserManuallySelectedChart = useAnalysisBuilderStore((state) => state.setUserManuallySelectedChart)

  // Mode-aware setters - route to appropriate store action based on analysis type
  const setChartType = useCallback(
    (type: ChartType) => {
      if (analysisType === 'funnel') {
        setFunnelChartType(type)
      } else {
        setChartTypeManual(type)
        const { chartConfig: smartConfig } = getSmartChartDefaults(
          combinedMetrics,
          combinedBreakdowns,
          type
        )
        setQueryChartConfig(smartConfig)
      }
    },
    [
      analysisType,
      combinedMetrics,
      combinedBreakdowns,
      setFunnelChartType,
      setChartTypeManual,
      setQueryChartConfig,
    ]
  )

  const setChartConfig = useCallback(
    (config: ChartAxisConfig) => {
      if (analysisType === 'funnel') {
        setFunnelChartConfig(config)
      } else {
        setQueryChartConfig(config)
      }
    },
    [analysisType, setFunnelChartConfig, setQueryChartConfig]
  )

  const setDisplayConfig = useCallback(
    (config: ChartDisplayConfig) => {
      if (analysisType === 'funnel') {
        setFunnelDisplayConfig(config)
      } else {
        setQueryDisplayConfig(config)
      }
    },
    [analysisType, setFunnelDisplayConfig, setQueryDisplayConfig]
  )

  // Chart availability
  const chartAvailability: ChartAvailabilityMap = useMemo(
    () => getAllChartAvailability(combinedMetrics, combinedBreakdowns),
    [combinedMetrics, combinedBreakdowns]
  )

  // Effective color palette
  const colorPalette = useMemo((): ColorPalette => {
    if (externalColorPalette) {
      if (Array.isArray(externalColorPalette) && typeof externalColorPalette[0] === 'string') {
        return {
          name: 'custom',
          label: 'Custom',
          colors: externalColorPalette as string[],
          gradient: externalColorPalette as string[],
        }
      }
      return externalColorPalette as ColorPalette
    }
    return getColorPalette(localPaletteName)
  }, [externalColorPalette, localPaletteName])

  // Flow display config action - uses charts map pattern
  const setFlowDisplayConfig = useCallback(
    (config: ChartDisplayConfig) => {
      storeApi.setState((state) => ({
        charts: {
          ...state.charts,
          flow: {
            ...(state.charts.flow || { chartType: 'sankey', chartConfig: {}, displayConfig: {} }),
            displayConfig: config,
          },
        },
      }))
    },
    [storeApi]
  )

  // Retention display config action - uses charts map pattern
  const setRetentionDisplayConfig = useCallback(
    (config: ChartDisplayConfig) => {
      storeApi.setState((state) => ({
        charts: {
          ...state.charts,
          retention: {
            ...(state.charts.retention || { chartType: 'retentionCombined', chartConfig: {}, displayConfig: {} }),
            displayConfig: config,
          },
        },
      }))
    },
    [storeApi]
  )

  // =========================================================================
  // UI State (tabs, modals, view toggle, display limit)
  // =========================================================================
  const activeTab = useAnalysisBuilderStore((state) => state.activeTab)
  const activeView = useAnalysisBuilderStore((state) => state.activeView)
  const displayLimit = useAnalysisBuilderStore((state) => state.displayLimit)
  const showFieldModal = useAnalysisBuilderStore((state) => state.showFieldModal)
  const fieldModalMode = useAnalysisBuilderStore((state) => state.fieldModalMode)

  const setActiveTab = useAnalysisBuilderStore((state) => state.setActiveTab)
  const setActiveView = useAnalysisBuilderStore((state) => state.setActiveView)
  const setDisplayLimit = useAnalysisBuilderStore((state) => state.setDisplayLimit)
  const closeFieldModal = useAnalysisBuilderStore((state) => state.closeFieldModal)

  // Local state for table index (not persisted) — the one piece of local UI state
  const [activeTableIndex, setActiveTableIndex] = useState(0)

  // =========================================================================
  // Store Actions (metrics / breakdowns / filters / per-mode)
  // =========================================================================
  const openMetricsModal = useAnalysisBuilderStore((state) => state.openMetricsModal)
  const addMetric = useAnalysisBuilderStore((state) => state.addMetric)
  const removeMetric = useAnalysisBuilderStore((state) => state.removeMetric)
  const toggleMetric = useAnalysisBuilderStore((state) => state.toggleMetric)
  const reorderMetrics = useAnalysisBuilderStore((state) => state.reorderMetrics)

  const openBreakdownsModal = useAnalysisBuilderStore((state) => state.openBreakdownsModal)
  const addBreakdown = useAnalysisBuilderStore((state) => state.addBreakdown)
  const removeBreakdown = useAnalysisBuilderStore((state) => state.removeBreakdown)
  const toggleBreakdown = useAnalysisBuilderStore((state) => state.toggleBreakdown)
  const setBreakdownGranularity = useAnalysisBuilderStore((state) => state.setBreakdownGranularity)
  const toggleBreakdownComparison = useAnalysisBuilderStore((state) => state.toggleBreakdownComparison)
  const reorderBreakdowns = useAnalysisBuilderStore((state) => state.reorderBreakdowns)

  const setFilters = useAnalysisBuilderStore((state) => state.setFilters)
  const dropFieldToFilter = useAnalysisBuilderStore((state) => state.dropFieldToFilter)
  const setOrder = useAnalysisBuilderStore((state) => state.setOrder)
  const setLimit = useAnalysisBuilderStore((state) => state.setLimit)

  const clearQuery = useAnalysisBuilderStore((state) => state.clearQuery)
  const clearCurrentMode = useAnalysisBuilderStore((state) => state.clearCurrentMode)

  // Funnel actions (legacy)
  const setFunnelBindingKey = useAnalysisBuilderStore((state) => state.setFunnelBindingKey)

  // Analysis Type action
  const setAnalysisType = useAnalysisBuilderStore((state) => state.setAnalysisType)

  // Funnel Mode actions (dedicated state)
  const setFunnelCube = useAnalysisBuilderStore((state) => state.setFunnelCube)
  const addFunnelStep = useAnalysisBuilderStore((state) => state.addFunnelStep)
  const removeFunnelStep = useAnalysisBuilderStore((state) => state.removeFunnelStep)
  const updateFunnelStep = useAnalysisBuilderStore((state) => state.updateFunnelStep)
  const setActiveFunnelStepIndex = useAnalysisBuilderStore((state) => state.setActiveFunnelStepIndex)
  const reorderFunnelSteps = useAnalysisBuilderStore((state) => state.reorderFunnelSteps)
  const setFunnelTimeDimension = useAnalysisBuilderStore((state) => state.setFunnelTimeDimension)

  // Flow Mode actions
  const setFlowCube = useAnalysisBuilderStore((state) => state.setFlowCube)
  const setFlowBindingKey = useAnalysisBuilderStore((state) => state.setFlowBindingKey)
  const setFlowTimeDimension = useAnalysisBuilderStore((state) => state.setFlowTimeDimension)
  const setEventDimension = useAnalysisBuilderStore((state) => state.setEventDimension)
  const setStartingStepName = useAnalysisBuilderStore((state) => state.setStartingStepName)
  const setStartingStepFilters = useAnalysisBuilderStore((state) => state.setStartingStepFilters)
  const setStepsBefore = useAnalysisBuilderStore((state) => state.setStepsBefore)
  const setStepsAfter = useAnalysisBuilderStore((state) => state.setStepsAfter)
  const setJoinStrategy = useAnalysisBuilderStore((state) => state.setJoinStrategy)

  // Retention Mode actions (simplified Mixpanel-style)
  const setRetentionCube = useAnalysisBuilderStore((s) => s.setRetentionCube)
  const setRetentionBindingKey = useAnalysisBuilderStore((s) => s.setRetentionBindingKey)
  const setRetentionTimeDimension = useAnalysisBuilderStore((s) => s.setRetentionTimeDimension)
  const setRetentionDateRange = useAnalysisBuilderStore((s) => s.setRetentionDateRange)
  const setRetentionCohortFilters = useAnalysisBuilderStore((s) => s.setRetentionCohortFilters)
  const setRetentionActivityFilters = useAnalysisBuilderStore((s) => s.setRetentionActivityFilters)
  const setRetentionBreakdowns = useAnalysisBuilderStore((s) => s.setRetentionBreakdowns)
  const addRetentionBreakdown = useAnalysisBuilderStore((s) => s.addRetentionBreakdown)
  const removeRetentionBreakdown = useAnalysisBuilderStore((s) => s.removeRetentionBreakdown)
  const setRetentionViewGranularity = useAnalysisBuilderStore((s) => s.setRetentionViewGranularity)
  const setRetentionPeriods = useAnalysisBuilderStore((s) => s.setRetentionPeriods)
  const setRetentionType = useAnalysisBuilderStore((s) => s.setRetentionType)

  // =========================================================================
  // Adapter Validation
  // =========================================================================
  const getValidation = useAnalysisBuilderStore((state) => state.getValidation)
  const adapterValidation = useMemo(
    () => getValidation(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      getValidation,
      queryStates,
      analysisType,
      // Funnel deps
      funnelSteps,
      funnelBindingKey,
      funnelTimeDimension,
      // Flow deps
      flowCube,
      flowBindingKey,
      flowTimeDimension,
      eventDimension,
      startingStep,
      stepsBefore,
      stepsAfter,
      joinStrategy,
    ]
  )

  // =========================================================================
  // Field selection
  // =========================================================================
  const applyBreakdownSelection = useCallback(
    (field: MetaField, fieldType: 'measure' | 'dimension' | 'timeDimension') => {
      // In retention mode, add to retention breakdowns instead of query breakdowns
      if (analysisType === 'retention' && fieldType === 'dimension') {
        addRetentionBreakdown({ field: field.name })
      } else {
        toggleBreakdown(field.name, fieldType === 'timeDimension')
      }
    },
    [analysisType, addRetentionBreakdown, toggleBreakdown]
  )

  const handleFieldSelected = useCallback(
    (
      field: MetaField,
      fieldType: 'measure' | 'dimension' | 'timeDimension',
      _cubeName: string,
      keepOpen?: boolean
    ) => {
      if (fieldModalMode === 'metrics' && fieldType === 'measure') {
        toggleMetric(field.name)
      } else if (fieldModalMode === 'breakdown') {
        applyBreakdownSelection(field, fieldType)
      }
      if (!keepOpen) {
        closeFieldModal()
      }
    },
    [fieldModalMode, toggleMetric, applyBreakdownSelection, closeFieldModal]
  )

  // =========================================================================
  // Imperative ref getters (read fresh from store)
  // =========================================================================
  const getQueryConfig = useCallback(() => {
    const state = storeApi.getState()

    // Handle dedicated funnel mode (analysisType === 'funnel')
    if (state.analysisType === 'funnel') {
      const funnelQuery = state.buildFunnelQueryFromSteps()
      if (funnelQuery) {
        return funnelQuery
      }
      // Fallback to single query if funnel isn't properly configured yet
      return state.buildCurrentQuery()
    }

    // Handle multi-query mode (legacy funnel mode with mergeStrategy === 'funnel' is included here)
    if (state.queryStates.length > 1) {
      return {
        queries: state.buildAllQueries(),
        mergeStrategy: state.mergeStrategy,
        mergeKeys: state.getMergeKeys(),
        queryLabels: state.queryStates.map((_, i) => `Q${i + 1}`),
        funnelBindingKey: state.funnelBindingKey,
        stepTimeToConvert: state.stepTimeToConvert,
      }
    }

    // Single query mode
    return state.buildCurrentQuery()
  }, [storeApi])

  const getChartConfig = useCallback(() => {
    const state = storeApi.getState()

    // Phase 4: Read from charts map based on analysis type
    const config = state.charts[state.analysisType]
    if (config) {
      return {
        chartType: config.chartType,
        chartConfig: config.chartConfig,
        displayConfig: config.displayConfig,
      }
    }

    // Fallback to current defaults
    return {
      chartType,
      chartConfig,
      displayConfig,
    }
  }, [storeApi, chartType, chartConfig, displayConfig])

  const getAnalysisType = useCallback(() => {
    return storeApi.getState().analysisType
  }, [storeApi])

  return {
    // Store API (consumed by effects for direct store access)
    storeApi,

    // Query state
    queryState,
    queryStates,
    activeQueryIndex,
    mergeStrategy,
    isMultiQueryMode,
    mergeKeys,
    currentQuery,
    allQueries,
    multiQueryConfig,
    multiQueryValidation,
    /** Raw query/multi validity (independent of mode) */
    isValidQuery,
    /** Mode-aware validity (funnel/flow/retention/query) */
    effectiveIsValidQuery,

    // Combined fields
    combinedMetrics,
    combinedBreakdowns,
    effectiveBreakdowns,

    // Analysis type + funnel state
    analysisType,
    funnelBindingKey,
    isFunnelModeEnabled,
    funnelCube,
    funnelSteps,
    activeFunnelStepIndex,
    funnelTimeDimension,
    funnelChartType,
    funnelChartConfig,
    funnelDisplayConfig,
    serverFunnelQuery,

    // Flow state
    flowCube,
    flowBindingKey,
    flowTimeDimension,
    eventDimension,
    startingStep,
    stepsBefore,
    stepsAfter,
    joinStrategy,
    flowDisplayConfig,
    serverFlowQuery,

    // Retention state
    retentionCube,
    retentionBindingKey,
    retentionTimeDimension,
    retentionDateRange,
    retentionCohortFilters,
    retentionActivityFilters,
    retentionBreakdowns,
    retentionViewGranularity,
    retentionPeriods,
    retentionType,
    retentionDisplayConfig,
    serverRetentionQuery,
    retentionValidation,

    // Chart configuration
    chartType,
    chartConfig,
    displayConfig,
    colorPalette,
    localPaletteName,
    chartAvailability,
    userManuallySelectedChart,

    // UI state
    activeTab,
    activeView,
    displayLimit,
    showFieldModal,
    fieldModalMode,
    activeTableIndex,

    // Adapter validation
    adapterValidation,

    // Imperative getters
    getQueryConfig,
    getChartConfig,
    getAnalysisType,

    // Actions
    actions: {
      // Query state
      setActiveQueryIndex,
      setMergeStrategy,
      addQuery,
      removeQuery,

      // Metrics
      openMetricsModal,
      addMetric,
      removeMetric,
      toggleMetric,
      reorderMetrics,

      // Breakdowns
      openBreakdownsModal,
      addBreakdown,
      removeBreakdown,
      toggleBreakdown,
      setBreakdownGranularity,
      toggleBreakdownComparison,
      reorderBreakdowns,

      // Filters
      setFilters,
      dropFieldToFilter,
      setOrder,
      setLimit,

      // Funnel (legacy)
      setFunnelBindingKey,

      // Analysis Type
      setAnalysisType,

      // Funnel Mode (dedicated state)
      setFunnelCube,
      addFunnelStep,
      removeFunnelStep,
      updateFunnelStep,
      setActiveFunnelStepIndex,
      reorderFunnelSteps,
      setFunnelTimeDimension,
      setFunnelDisplayConfig,

      // Flow Mode
      setFlowCube,
      setFlowBindingKey,
      setFlowTimeDimension,
      setEventDimension,
      setStartingStepName,
      setStartingStepFilters,
      setStepsBefore,
      setStepsAfter,
      setJoinStrategy,
      setFlowDisplayConfig,

      // Retention Mode
      setRetentionCube,
      setRetentionBindingKey,
      setRetentionTimeDimension,
      setRetentionDateRange,
      setRetentionCohortFilters,
      setRetentionActivityFilters,
      setRetentionBreakdowns,
      addRetentionBreakdown,
      removeRetentionBreakdown,
      setRetentionViewGranularity,
      setRetentionPeriods,
      setRetentionType,
      setRetentionDisplayConfig,

      // Chart (mode-aware)
      setChartType,
      setChartConfig,
      setDisplayConfig,
      setLocalPaletteName,
      setUserManuallySelectedChart,

      // UI
      setActiveTab,
      setActiveView,
      setDisplayLimit,
      closeFieldModal,
      setActiveTableIndex,

      // Utility
      clearQuery,
      clearCurrentMode,
      handleFieldSelected,
    },
  }
}

export type UseAnalysisStateResult = ReturnType<typeof useAnalysisState>
