/**
 * Pure mapping helpers extracted from analysisBuilderStore.
 *
 * `optionsToAnalysisConfig` converts store creation options (CreateStoreOptions)
 * into an AnalysisConfig that can be loaded by the appropriate mode adapter.
 *
 * These functions are pure: the same options always produce the same config.
 */

import type {
  SimpleFilter,
  QueryMergeStrategy,
  CubeQuery,
  MultiQueryConfig,
} from '../types'
import { getDateRangeFromPreset, DEFAULT_DATE_RANGE_PRESET } from '../types/retention'
import type { AnalysisBuilderState } from '../components/AnalysisBuilder/types'
import {
  generateId,
  generateMetricLabel,
  createInitialState,
} from '../components/AnalysisBuilder/utils'
import { queryModeAdapter } from '../adapters/queryModeAdapter'
import { funnelModeAdapter } from '../adapters/funnelModeAdapter'
import { flowModeAdapter } from '../adapters/flowModeAdapter'
import { retentionModeAdapter } from '../adapters/retentionModeAdapter'
import type { ModeAdapter } from '../adapters/modeAdapter'
import type { AnalysisConfig, ChartConfig } from '../types/analysisConfig'
import type { CreateStoreOptions } from './analysisBuilderStore'

/**
 * Convert CubeQuery to AnalysisBuilderState
 */
export function queryToState(query: CubeQuery): AnalysisBuilderState {
  const baseFilters = query.filters ? [...query.filters] : []

  const timeDimensions = query.timeDimensions || []
  const breakdowns = [
    ...(query.dimensions || []).map((field) => ({
      id: generateId(),
      field,
      isTimeDimension: false,
    })),
    ...timeDimensions.map((td) => ({
      id: generateId(),
      field: td.dimension,
      granularity: td.granularity,
      isTimeDimension: true,
      enableComparison: Boolean(td.compareDateRange && td.compareDateRange.length > 0),
    })),
  ]

  let filters = baseFilters

  // Restore date filters for comparison-enabled time dimensions when missing.
  for (const td of timeDimensions) {
    if (!td.compareDateRange || td.compareDateRange.length === 0) continue

    const hasDateFilter = filters.some(
      (filter) =>
        'member' in filter &&
        (filter as SimpleFilter).member === td.dimension &&
        (filter as SimpleFilter).operator === 'inDateRange'
    )

    const firstRange = td.compareDateRange[0]
    const dateRange =
      Array.isArray(firstRange) || typeof firstRange === 'string'
        ? firstRange
        : undefined

    if (!dateRange) continue

    if (!hasDateFilter) {
      filters = [
        ...filters,
        {
          member: td.dimension,
          operator: 'inDateRange',
          values: [],
          dateRange,
        } as SimpleFilter,
      ]
      continue
    }

    filters = filters.map((filter) => {
      if (
        'member' in filter &&
        (filter as SimpleFilter).member === td.dimension &&
        (filter as SimpleFilter).operator === 'inDateRange' &&
        !(filter as SimpleFilter).dateRange
      ) {
        return { ...(filter as SimpleFilter), dateRange }
      }
      return filter
    })
  }

  return {
    ...createInitialState(),
    metrics: (query.measures || []).map((field, index) => ({
      id: generateId(),
      field,
      label: generateMetricLabel(index),
    })),
    breakdowns,
    filters,
    order: query.order,
  }
}

/**
 * Check if config is MultiQueryConfig
 */
export function isMultiQueryConfig(
  config: CubeQuery | MultiQueryConfig
): config is MultiQueryConfig {
  return 'queries' in config && Array.isArray(config.queries)
}

/**
 * Merge the caller-provided chart config (if any) with the adapter's default
 * chart config, preferring caller-provided fields.
 */
function mergeChartConfig(
  adapter: ModeAdapter<unknown>,
  initialChartConfig: CreateStoreOptions['initialChartConfig']
): ChartConfig {
  const defaults = adapter.getDefaultChartConfig()
  return {
    chartType: initialChartConfig?.chartType || defaults.chartType,
    chartConfig: initialChartConfig?.chartConfig || defaults.chartConfig,
    displayConfig: initialChartConfig?.displayConfig || defaults.displayConfig,
  }
}

/**
 * Resolve the active view, defaulting to 'chart'.
 */
function resolveActiveView(options: CreateStoreOptions): 'table' | 'chart' {
  return options.initialActiveView || 'chart'
}

/**
 * Build AnalysisConfig for funnel mode (requires initialFunnelState).
 */
function funnelOptionsToConfig(options: CreateStoreOptions): AnalysisConfig {
  const funnelChartConfig = mergeChartConfig(funnelModeAdapter, options.initialChartConfig)
  const initial = options.initialFunnelState ?? {}

  const funnelState = {
    funnelCube: initial.funnelCube ?? null,
    funnelSteps: initial.funnelSteps || [],
    activeFunnelStepIndex: 0,
    funnelTimeDimension: initial.funnelTimeDimension ?? null,
    funnelBindingKey: initial.funnelBindingKey ?? null,
  }

  return funnelModeAdapter.save(
    funnelState,
    { funnel: funnelChartConfig },
    resolveActiveView(options)
  )
}

/**
 * Build AnalysisConfig for flow mode (requires initialFlowState).
 */
function flowOptionsToConfig(options: CreateStoreOptions): AnalysisConfig {
  const flowChartConfig = mergeChartConfig(flowModeAdapter, options.initialChartConfig)
  const initial = options.initialFlowState ?? {}

  const flowState = {
    flowCube: initial.flowCube ?? null,
    flowBindingKey: initial.flowBindingKey ?? null,
    flowTimeDimension: initial.flowTimeDimension ?? null,
    startingStep: initial.startingStep || { name: '', filters: [] },
    stepsBefore: initial.stepsBefore ?? 3,
    stepsAfter: initial.stepsAfter ?? 3,
    eventDimension: initial.eventDimension ?? null,
    joinStrategy: initial.joinStrategy ?? 'auto',
  }

  return flowModeAdapter.save(
    flowState,
    { flow: flowChartConfig },
    resolveActiveView(options)
  )
}

/**
 * Build AnalysisConfig for retention mode (requires initialRetentionState).
 */
function retentionOptionsToConfig(options: CreateStoreOptions): AnalysisConfig {
  const retentionChartConfig = mergeChartConfig(
    retentionModeAdapter,
    options.initialChartConfig
  )
  const initial = options.initialRetentionState ?? {}

  // Build retention state - use default date range for fallback
  const defaultDateRange = getDateRangeFromPreset(DEFAULT_DATE_RANGE_PRESET)

  const retentionState = {
    retentionCube: initial.retentionCube ?? null,
    retentionBindingKey: initial.retentionBindingKey ?? null,
    retentionTimeDimension: initial.retentionTimeDimension ?? null,
    retentionDateRange: initial.retentionDateRange ?? defaultDateRange,
    retentionCohortFilters: initial.retentionCohortFilters || [],
    retentionActivityFilters: initial.retentionActivityFilters || [],
    retentionBreakdowns: initial.retentionBreakdowns || [],
    retentionViewGranularity: initial.retentionViewGranularity ?? 'week',
    retentionPeriods: initial.retentionPeriods ?? 12,
    retentionType: initial.retentionType ?? 'classic',
  }

  return retentionModeAdapter.save(
    retentionState,
    { retention: retentionChartConfig },
    resolveActiveView(options)
  )
}

/**
 * Build AnalysisConfig for query mode from an initial query (single or multi).
 */
function queryOptionsToConfig(
  options: CreateStoreOptions,
  query: CubeQuery | MultiQueryConfig
): AnalysisConfig {
  let queryStates: AnalysisBuilderState[]
  let mergeStrategy: QueryMergeStrategy = 'concat'

  if (isMultiQueryConfig(query)) {
    queryStates = query.queries.map(queryToState)
    if (query.mergeStrategy) {
      mergeStrategy = query.mergeStrategy
    }
  } else {
    queryStates = [queryToState(query)]
  }

  const queryChartConfig = mergeChartConfig(queryModeAdapter, options.initialChartConfig)

  return queryModeAdapter.save(
    { queryStates, activeQueryIndex: 0, mergeStrategy },
    { query: queryChartConfig },
    resolveActiveView(options)
  )
}

/**
 * Build AnalysisConfig for query mode from chart config only (no query).
 */
function chartOnlyOptionsToConfig(options: CreateStoreOptions): AnalysisConfig {
  const queryChartConfig = mergeChartConfig(queryModeAdapter, options.initialChartConfig)

  return queryModeAdapter.save(
    { queryStates: [createInitialState()], activeQueryIndex: 0, mergeStrategy: 'concat' },
    { query: queryChartConfig },
    resolveActiveView(options)
  )
}

/**
 * Build a minimal AnalysisConfig with just the active view set.
 */
function activeViewOnlyOptionsToConfig(options: CreateStoreOptions): AnalysisConfig {
  return queryModeAdapter.save(
    { queryStates: [createInitialState()], activeQueryIndex: 0, mergeStrategy: 'concat' },
    { query: queryModeAdapter.getDefaultChartConfig() },
    options.initialActiveView as 'table' | 'chart'
  )
}

/**
 * Convert store creation options to AnalysisConfig.
 * Returns null if no meaningful options are provided (use defaults).
 */
export function optionsToAnalysisConfig(
  options: CreateStoreOptions
): AnalysisConfig | null {
  // Handle funnel mode with funnel state
  if (options.initialAnalysisType === 'funnel' && options.initialFunnelState) {
    return funnelOptionsToConfig(options)
  }

  // Handle flow mode with flow state
  if (options.initialAnalysisType === 'flow' && options.initialFlowState) {
    return flowOptionsToConfig(options)
  }

  // Handle retention mode with retention state
  if (options.initialAnalysisType === 'retention' && options.initialRetentionState) {
    return retentionOptionsToConfig(options)
  }

  // Handle query mode with initial query
  if (options.initialQuery) {
    return queryOptionsToConfig(options, options.initialQuery)
  }

  // Handle just chart config (no query)
  if (options.initialChartConfig) {
    return chartOnlyOptionsToConfig(options)
  }

  // Handle just active view
  if (options.initialActiveView) {
    return activeViewOnlyOptionsToConfig(options)
  }

  // No meaningful options - use store defaults
  return null
}
