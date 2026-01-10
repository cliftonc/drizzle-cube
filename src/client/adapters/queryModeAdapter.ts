/**
 * Query Mode Adapter
 *
 * Handles conversion between UI state and AnalysisConfig for query mode.
 * Supports both single queries and multi-query configurations.
 */

import type { ModeAdapter, ValidationResult } from './modeAdapter'
import type {
  AnalysisConfig,
  QueryAnalysisConfig,
  AnalysisType,
  ChartConfig,
} from '../types/analysisConfig'
import { generateId, generateMetricLabel } from '../components/AnalysisBuilder/utils'
import { buildCompareDateRangeFromFilter } from '../components/AnalysisBuilder/utils/filterUtils'
import type {
  CubeQuery,
  MultiQueryConfig,
  QueryMergeStrategy,
  Filter,
} from '../types'
import type {
  AnalysisBuilderState,
  MetricItem,
  BreakdownItem,
} from '../components/AnalysisBuilder/types'

// ============================================================================
// Query Slice State Type
// ============================================================================

/**
 * The shape of query mode state in the store.
 * This is what the adapter's load() returns and save() receives.
 */
export interface QuerySliceState {
  /** Array of query states (one per query tab) */
  queryStates: AnalysisBuilderState[]
  /** Index of the active query tab */
  activeQueryIndex: number
  /** Strategy for combining multiple queries */
  mergeStrategy: QueryMergeStrategy
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create an empty query state
 */
function createEmptyQueryState(): AnalysisBuilderState {
  return {
    metrics: [],
    breakdowns: [],
    filters: [],
    order: undefined,
    validationStatus: 'idle',
    validationError: null,
  }
}

/**
 * Convert metrics to CubeQuery measures
 */
function metricsToMeasures(metrics: MetricItem[]): string[] {
  return metrics.map((m) => m.field)
}

/**
 * Convert breakdowns to CubeQuery dimensions and timeDimensions
 * Includes compareDateRange for time dimensions with comparison enabled
 */
function breakdownsToQuery(
  breakdowns: BreakdownItem[],
  filters: Filter[]
): {
  dimensions: string[]
  timeDimensions: NonNullable<CubeQuery['timeDimensions']>
} {
  const dimensions: string[] = []
  const timeDimensions: NonNullable<CubeQuery['timeDimensions']> = []

  for (const b of breakdowns) {
    if (b.isTimeDimension) {
      const td: {
        dimension: string
        granularity: string
        compareDateRange?: [string, string][]
      } = {
        dimension: b.field,
        granularity: b.granularity || 'day',
      }

      // If comparison is enabled, calculate and include compareDateRange
      if (b.enableComparison) {
        const compareDateRange = buildCompareDateRangeFromFilter(b.field, filters)
        if (compareDateRange) {
          td.compareDateRange = compareDateRange
        }
      }

      timeDimensions.push(td)
    } else {
      dimensions.push(b.field)
    }
  }

  return { dimensions, timeDimensions }
}

/**
 * Build a CubeQuery from an AnalysisBuilderState
 */
function stateToCubeQuery(state: AnalysisBuilderState): CubeQuery {
  const { dimensions, timeDimensions } = breakdownsToQuery(
    state.breakdowns,
    state.filters
  )

  const query: CubeQuery = {
    measures: metricsToMeasures(state.metrics),
    dimensions,
  }

  if (timeDimensions.length > 0) {
    query.timeDimensions = timeDimensions
  }

  if (state.filters.length > 0) {
    query.filters = state.filters
  }

  if (state.order && Object.keys(state.order).length > 0) {
    query.order = state.order
  }

  return query
}

/**
 * Convert CubeQuery measures to MetricItems
 */
function measuresToMetrics(measures: string[]): MetricItem[] {
  return measures.map((field, index) => ({
    id: generateId(),
    field,
    label: generateMetricLabel(index),
  }))
}

/**
 * Convert CubeQuery dimensions and timeDimensions to BreakdownItems
 * Restores enableComparison from compareDateRange presence
 */
function queryToBreakdowns(query: CubeQuery): BreakdownItem[] {
  const breakdowns: BreakdownItem[] = []

  // Regular dimensions
  if (query.dimensions) {
    for (const dim of query.dimensions) {
      breakdowns.push({
        id: generateId(),
        field: dim,
        isTimeDimension: false,
      })
    }
  }

  // Time dimensions
  if (query.timeDimensions) {
    for (const td of query.timeDimensions) {
      // Restore enableComparison if compareDateRange exists
      const hasComparison = Boolean(
        td.compareDateRange && td.compareDateRange.length > 0
      )

      breakdowns.push({
        id: generateId(),
        field: td.dimension,
        granularity: td.granularity,
        isTimeDimension: true,
        enableComparison: hasComparison,
      })
    }
  }

  return breakdowns
}

/**
 * Convert CubeQuery to AnalysisBuilderState
 */
function cubeQueryToState(query: CubeQuery): AnalysisBuilderState {
  return {
    metrics: measuresToMetrics(query.measures || []),
    breakdowns: queryToBreakdowns(query),
    filters: (query.filters as Filter[]) || [],
    order: query.order,
    validationStatus: 'idle',
    validationError: null,
  }
}

/**
 * Check if a query object is a MultiQueryConfig
 */
function isMultiQueryConfig(query: unknown): query is MultiQueryConfig {
  return (
    typeof query === 'object' &&
    query !== null &&
    'queries' in query &&
    Array.isArray((query as MultiQueryConfig).queries)
  )
}

// ============================================================================
// Query Mode Adapter
// ============================================================================

export const queryModeAdapter: ModeAdapter<QuerySliceState> = {
  type: 'query',

  createInitial(): QuerySliceState {
    return {
      queryStates: [createEmptyQueryState()],
      activeQueryIndex: 0,
      mergeStrategy: 'concat',
    }
  },

  extractState(storeState: Record<string, unknown>): QuerySliceState {
    return {
      queryStates: storeState.queryStates as AnalysisBuilderState[],
      activeQueryIndex: storeState.activeQueryIndex as number,
      mergeStrategy: storeState.mergeStrategy as QueryMergeStrategy,
    }
  },

  canLoad(config: unknown): config is AnalysisConfig {
    if (!config || typeof config !== 'object') return false

    const c = config as Record<string, unknown>

    // Check version and analysis type
    if (c.version !== 1) return false
    if (c.analysisType !== 'query') return false

    // Check query exists
    if (!c.query || typeof c.query !== 'object') return false

    return true
  },

  load(config: AnalysisConfig): QuerySliceState {
    // Type guard - ensure it's a query config
    if (config.analysisType !== 'query') {
      throw new Error(
        `Cannot load ${config.analysisType} config with query adapter`
      )
    }

    const queryConfig = config as QueryAnalysisConfig

    // Handle multi-query config
    if (isMultiQueryConfig(queryConfig.query)) {
      const multiConfig = queryConfig.query
      const queryStates = multiConfig.queries.map(cubeQueryToState)

      // Ensure at least one query state
      if (queryStates.length === 0) {
        queryStates.push(createEmptyQueryState())
      }

      return {
        queryStates,
        activeQueryIndex: 0,
        mergeStrategy: multiConfig.mergeStrategy || 'concat',
      }
    }

    // Handle single query
    return {
      queryStates: [cubeQueryToState(queryConfig.query)],
      activeQueryIndex: 0,
      mergeStrategy: 'concat',
    }
  },

  save(
    state: QuerySliceState,
    charts: Partial<Record<AnalysisType, ChartConfig>>,
    activeView: 'table' | 'chart'
  ): QueryAnalysisConfig {
    // Build queries from state
    const queries = state.queryStates.map(stateToCubeQuery)

    // Determine if single or multi-query
    const isSingle = queries.length === 1 && state.mergeStrategy === 'concat'

    // Build the query field
    const query: CubeQuery | MultiQueryConfig = isSingle
      ? queries[0]
      : {
          queries,
          mergeStrategy: state.mergeStrategy,
        }

    return {
      version: 1,
      analysisType: 'query',
      activeView,
      charts: {
        query: charts.query || this.getDefaultChartConfig(),
      },
      query,
    }
  },

  validate(state: QuerySliceState): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if any query has metrics
    const hasAnyMetrics = state.queryStates.some((q) => q.metrics.length > 0)
    if (!hasAnyMetrics) {
      errors.push('At least one metric is required')
    }

    // Check each query state
    state.queryStates.forEach((qs, index) => {
      const prefix = state.queryStates.length > 1 ? `Query ${index + 1}: ` : ''

      if (qs.metrics.length === 0 && qs.breakdowns.length === 0) {
        warnings.push(`${prefix}Query is empty`)
      }
    })

    // Multi-query specific validation
    if (state.queryStates.length > 1) {
      if (state.mergeStrategy === 'merge') {
        // Check if all queries have compatible dimensions for merging
        const firstBreakdowns = state.queryStates[0].breakdowns.map(
          (b) => b.field
        )
        const allHaveSameBreakdowns = state.queryStates.every((qs) => {
          const breakdowns = qs.breakdowns.map((b) => b.field)
          return (
            breakdowns.length === firstBreakdowns.length &&
            breakdowns.every((b) => firstBreakdowns.includes(b))
          )
        })
        if (!allHaveSameBreakdowns) {
          warnings.push(
            'Queries have different breakdowns - merge results may be unexpected'
          )
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  },

  clear(_state: QuerySliceState): QuerySliceState {
    // Reset to single empty query (ignoring previous state)
    return this.createInitial()
  },

  getDefaultChartConfig(): ChartConfig {
    return {
      chartType: 'bar',
      chartConfig: {},
      displayConfig: { showLegend: true, showGrid: true, showTooltip: true },
    }
  },
}
