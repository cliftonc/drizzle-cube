/**
 * AnalysisBuilder Component
 *
 * A redesigned query builder with a modern UX:
 * - Results panel on the left (large)
 * - Query builder panel on the right
 * - Search-based field selection via modal
 * - Sections: Metrics (measures), Breakdown (dimensions), Filters
 * - Auto-execute queries on field changes
 */

import { useState, useCallback, useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from 'react'
import { useCubeContext } from '../../providers/CubeProvider'
import { useCubeQuery } from '../../hooks/useCubeQuery'
import { useMultiCubeQuery } from '../../hooks/useMultiCubeQuery'
import type {
  AnalysisBuilderProps,
  AnalysisBuilderRef,
  AnalysisBuilderState,
  AIState,
  MetricItem,
  BreakdownItem,
  QueryPanelTab,
  ExecutionStatus,
  AnalysisBuilderStorageState,
  QueryAnalysis
} from './types'
import type { CubeQuery, Filter, ChartType, ChartAxisConfig, ChartDisplayConfig, QueryMergeStrategy, MultiQueryConfig } from '../../types'
import { isMultiQueryConfig } from '../../types'
import { parseDateRange, calculatePriorPeriod, formatDateForCube } from '../../../shared/date-utils'
import FieldSearchModal from './FieldSearchModal'
import AnalysisResultsPanel from './AnalysisResultsPanel'
import AnalysisQueryPanel from './AnalysisQueryPanel'
import type { MetaField, MetaResponse } from '../../shared/types'
import { cleanQueryForServer, convertDateRangeTypeToValue } from '../../shared/utils'
import { getAllChartAvailability, getSmartChartDefaults, shouldAutoSwitchChartType } from '../../shared/chartDefaults'
import { compressWithFallback, parseShareHash, decodeAndDecompress, clearShareHash } from '../../utils/shareUtils'
import { getColorPalette } from '../../utils/colorPalettes'
import { sendGeminiMessage, extractTextFromResponse } from '../AIAssistant/utils'
import { validateMultiQueryConfig, type MultiQueryValidationResult } from '../../utils/multiQueryValidation'
import AnalysisAIPanel from './AnalysisAIPanel'

// Storage key for localStorage persistence
const STORAGE_KEY = 'drizzle-cube-analysis-builder-state'

// Debounce delay for auto-execute (ms)
const AUTO_EXECUTE_DELAY = 300

/**
 * Generate a unique ID for items
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate letter label for metrics (A, B, C, ..., AA, AB, ...)
 */
function generateMetricLabel(index: number): string {
  let label = ''
  let n = index
  do {
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return label
}

/**
 * Find date filter for a specific time dimension field
 * Recursively searches filters (including nested and/or groups)
 * Handles both UI format ({type: 'and'/'or', filters: [...]}) and simple filters
 */
function findDateFilterForField(
  filters: Filter[],
  field: string
): { dateRange: string | string[] } | undefined {
  for (const filter of filters) {
    // Check for UI GroupFilter format: {type: 'and'/'or', filters: [...]}
    if ('type' in filter && 'filters' in filter) {
      const groupFilter = filter as { type: 'and' | 'or'; filters: Filter[] }
      const nested = findDateFilterForField(groupFilter.filters, field)
      if (nested) return nested
    } else if ('member' in filter) {
      // Simple filter with member, operator, dateRange
      const simple = filter as { member: string; operator?: string; dateRange?: string | string[] }
      if (simple.member === field && simple.operator === 'inDateRange' && simple.dateRange) {
        return { dateRange: simple.dateRange }
      }
    }
  }
  return undefined
}

/**
 * Build compareDateRange for a time dimension based on its date filter
 * When comparison is enabled, returns [[currentStart, currentEnd], [priorStart, priorEnd]]
 */
function buildCompareDateRangeFromFilter(
  timeDimensionField: string,
  filters: Filter[]
): [string, string][] | undefined {
  // Find the date filter for this time dimension
  const dateFilter = findDateFilterForField(filters, timeDimensionField)
  if (!dateFilter?.dateRange) return undefined

  // Parse the current range using shared utility
  const currentPeriod = parseDateRange(dateFilter.dateRange)
  if (!currentPeriod) return undefined

  // Calculate prior period using shared utility
  const priorPeriod = calculatePriorPeriod(currentPeriod.start, currentPeriod.end)

  return [
    [formatDateForCube(currentPeriod.start), formatDateForCube(currentPeriod.end)],
    [formatDateForCube(priorPeriod.start), formatDateForCube(priorPeriod.end)]
  ]
}

/**
 * Remove date filter for a specific field from filters array
 * Returns a new array with the filter removed (immutable)
 */
function removeComparisonDateFilter(filters: Filter[], field: string): Filter[] {
  return filters.reduce<Filter[]>((acc, filter) => {
    // Check for UI GroupFilter format: {type: 'and'/'or', filters: [...]}
    if ('type' in filter && 'filters' in filter) {
      const groupFilter = filter as { type: 'and' | 'or'; filters: Filter[] }
      const cleanedSubFilters = removeComparisonDateFilter(groupFilter.filters, field)
      // Only keep the group if it still has filters
      if (cleanedSubFilters.length > 0) {
        acc.push({ type: groupFilter.type, filters: cleanedSubFilters } as Filter)
      }
    } else if ('member' in filter) {
      // Simple filter - skip if it's the date filter for this field
      const simple = filter as { member: string; operator?: string; dateRange?: string | string[] }
      if (!(simple.member === field && simple.operator === 'inDateRange')) {
        acc.push(filter)
      }
    } else {
      acc.push(filter)
    }
    return acc
  }, [])
}

/**
 * Convert metrics and breakdowns to CubeQuery format
 */
function buildCubeQuery(
  metrics: MetricItem[],
  breakdowns: BreakdownItem[],
  filters: Filter[],
  order?: Record<string, 'asc' | 'desc'>
): CubeQuery {
  // Find time dimensions with comparison enabled
  const comparisonFields = breakdowns
    .filter((b) => b.isTimeDimension && b.enableComparison)
    .map((b) => b.field)

  // Remove date filters for comparison-enabled time dimensions
  // (compareDateRange will handle the date ranges instead)
  let filteredFilters = filters
  for (const field of comparisonFields) {
    filteredFilters = removeComparisonDateFilter(filteredFilters, field)
  }

  const query: CubeQuery = {
    measures: metrics.map((m) => m.field),
    dimensions: breakdowns.filter((b) => !b.isTimeDimension).map((b) => b.field),
    timeDimensions: breakdowns
      .filter((b) => b.isTimeDimension)
      .map((b) => {
        const td: {
          dimension: string
          granularity: string
          compareDateRange?: [string, string][]
        } = {
          dimension: b.field,
          granularity: b.granularity || 'day'
        }

        // If comparison is enabled, build compareDateRange from the ORIGINAL filter
        if (b.enableComparison) {
          const compareDateRange = buildCompareDateRangeFromFilter(b.field, filters)
          if (compareDateRange) {
            td.compareDateRange = compareDateRange
          }
        }

        return td
      }),
    filters: filteredFilters.length > 0 ? filteredFilters : undefined,
    order: order && Object.keys(order).length > 0 ? order : undefined
  }

  // Clean up empty arrays
  if (query.measures?.length === 0) delete query.measures
  if (query.dimensions?.length === 0) delete query.dimensions
  if (query.timeDimensions?.length === 0) delete query.timeDimensions

  return query
}

/**
 * Create initial empty state
 */
function createInitialState(): AnalysisBuilderState {
  return {
    metrics: [],
    breakdowns: [],
    filters: [],
    validationStatus: 'idle',
    validationError: null,
    executionStatus: 'idle',
    executionResults: null,
    executionError: null,
    totalRowCount: null,
    resultsStale: false
  }
}

/**
 * Load all state from localStorage once (to avoid repeated parsing)
 */
function loadInitialStateFromStorage(
  disableLocalStorage: boolean
): AnalysisBuilderStorageState | null {
  if (disableLocalStorage) return null

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved) as AnalysisBuilderStorageState
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

const AnalysisBuilder = forwardRef<AnalysisBuilderRef, AnalysisBuilderProps>(
  (
    {
      className = '',
      maxHeight,
      initialQuery,
      initialChartConfig,
      initialData,
      colorPalette: externalColorPalette,
      disableLocalStorage: disableLocalStorageProp = false,
      hideSettings: _hideSettings = false,
      onQueryChange,
      onChartConfigChange
    },
    ref
  ) => {
    // Mark unused props for future use
    void _hideSettings

    // Disable localStorage when initialQuery is provided (parent manages state)
    const disableLocalStorage = disableLocalStorageProp || !!initialQuery

    // Get context - metaLoading and metaError used by FieldSearchModal internally
    const { meta, cubeApi } = useCubeContext()

    // Load localStorage once on mount (before useState calls) to avoid repeated parsing
    const cachedStorage = useMemo(
      () => loadInitialStateFromStorage(disableLocalStorageProp),
      [] // Only run once on mount
    )

    // Helper to convert a CubeQuery to AnalysisBuilderState
    const queryToState = (query: CubeQuery): AnalysisBuilderState => ({
      ...createInitialState(),
      metrics: (query.measures || []).map((field, index) => ({
        id: generateId(),
        field,
        label: generateMetricLabel(index)
      })),
      breakdowns: [
        ...(query.dimensions || []).map((field) => ({
          id: generateId(),
          field,
          isTimeDimension: false
        })),
        ...(query.timeDimensions || []).map((td) => ({
          id: generateId(),
          field: td.dimension,
          granularity: td.granularity,
          isTimeDimension: true
        }))
      ],
      filters: query.filters || []
    })

    // Multi-query state management
    // queryStates holds an array of query configurations (one per tab)
    // For single-query mode, this is an array with one element
    const [queryStates, setQueryStates] = useState<AnalysisBuilderState[]>(() => {
      // If initialQuery is provided, detect if it's multi-query or single query internally
      if (initialQuery) {
        if (isMultiQueryConfig(initialQuery)) {
          // Multi-query config - parse each query
          const multiConfig = initialQuery as MultiQueryConfig
          return multiConfig.queries.map(queryToState)
        }
        // Single query - wrap in array
        const singleQuery = initialQuery as CubeQuery
        return [queryToState(singleQuery)]
      }

      // Use cached localStorage data if available
      if (cachedStorage) {
        // Support legacy single-query format and new multi-query format
        const queries = cachedStorage.queryStates || [{
          ...createInitialState(),
          metrics: cachedStorage.metrics || [],
          breakdowns: cachedStorage.breakdowns || [],
          filters: cachedStorage.filters || []
        }]
        return queries
      }

      return [createInitialState()]
    })

    // Index of the currently active query tab
    const [activeQueryIndex, setActiveQueryIndex] = useState<number>(() => {
      if (cachedStorage?.activeQueryIndex !== undefined) {
        return cachedStorage.activeQueryIndex
      }
      return 0
    })

    // Merge strategy for combining multiple query results
    const [mergeStrategy, setMergeStrategy] = useState<QueryMergeStrategy>(() => {
      // Priority: initialQuery (if multi-query) > cached localStorage > default
      if (initialQuery && isMultiQueryConfig(initialQuery)) {
        const multiConfig = initialQuery as MultiQueryConfig
        if (multiConfig.mergeStrategy) {
          return multiConfig.mergeStrategy
        }
      }
      if (cachedStorage?.mergeStrategy) {
        return cachedStorage.mergeStrategy
      }
      return 'concat'
    })

    // Dimension keys to align data on for 'merge' strategy - auto-computed from Q1 breakdowns
    const mergeKeys = useMemo(() => {
      if (mergeStrategy !== 'merge' || queryStates.length === 0) return undefined
      const q1Breakdowns = queryStates[0].breakdowns
      if (q1Breakdowns.length === 0) return undefined
      return q1Breakdowns.map(b => b.field)
    }, [mergeStrategy, queryStates])

    // Derive the active query state (convenience accessor)
    const state = queryStates[activeQueryIndex] || createInitialState()

    // Helper to update the active query state
    const setState = useCallback((updater: AnalysisBuilderState | ((prev: AnalysisBuilderState) => AnalysisBuilderState)) => {
      setQueryStates(prevStates => {
        const newStates = [...prevStates]
        if (typeof updater === 'function') {
          newStates[activeQueryIndex] = updater(prevStates[activeQueryIndex] || createInitialState())
        } else {
          newStates[activeQueryIndex] = updater
        }
        return newStates
      })
    }, [activeQueryIndex])

    // Sync breakdowns from Q1 to other queries when in merge mode
    useEffect(() => {
      if (mergeStrategy !== 'merge' || queryStates.length <= 1) return

      const q1Breakdowns = queryStates[0].breakdowns

      // Check if other queries need syncing
      let needsSync = false
      for (let i = 1; i < queryStates.length; i++) {
        if (JSON.stringify(queryStates[i].breakdowns) !== JSON.stringify(q1Breakdowns)) {
          needsSync = true
          break
        }
      }

      if (needsSync) {
        setQueryStates(prev => prev.map((qs, i) =>
          i === 0 ? qs : { ...qs, breakdowns: [...q1Breakdowns] }
        ))
      }
    }, [mergeStrategy, queryStates])

    // Chart configuration state - load from initialChartConfig, cached localStorage, or defaults
    const [chartType, setChartType] = useState<ChartType>(() => {
      // Priority: initialChartConfig > cached localStorage > default
      if (initialChartConfig?.chartType) {
        return initialChartConfig.chartType
      }
      if (!initialQuery && cachedStorage?.chartType) {
        return cachedStorage.chartType
      }
      return 'line'
    })

    const [chartConfig, setChartConfig] = useState<ChartAxisConfig>(() => {
      // Priority: initialChartConfig > cached localStorage > default
      if (initialChartConfig?.chartConfig) {
        return initialChartConfig.chartConfig
      }
      if (!initialQuery && cachedStorage?.chartConfig) {
        return cachedStorage.chartConfig
      }
      return {}
    })

    const [displayConfig, setDisplayConfig] = useState<ChartDisplayConfig>(() => {
      // Priority: initialChartConfig > cached localStorage > default
      if (initialChartConfig?.displayConfig) {
        return initialChartConfig.displayConfig
      }
      if (!initialQuery && cachedStorage?.displayConfig) {
        return cachedStorage.displayConfig
      }
      return { showLegend: true, showGrid: true, showTooltip: true }
    })

    // Local color palette state (only used when externalColorPalette is not provided)
    const [localPaletteName, setLocalPaletteName] = useState<string>('default')

    // Compute effective color palette
    const effectiveColorPalette = useMemo(() => {
      if (externalColorPalette) return externalColorPalette
      return getColorPalette(localPaletteName)
    }, [externalColorPalette, localPaletteName])

    // Sort order state
    const [order, setOrder] = useState<Record<string, 'asc' | 'desc'> | undefined>(() => {
      // Load from initialQuery if provided (only for single query, not multi-query)
      if (initialQuery && !isMultiQueryConfig(initialQuery)) {
        const singleQuery = initialQuery as CubeQuery
        if (singleQuery.order) {
          return singleQuery.order
        }
      }
      // Use cached localStorage data if available
      if (!initialQuery && cachedStorage?.order) {
        return cachedStorage.order
      }
      return undefined
    })

    // UI state
    const [activeTab, setActiveTab] = useState<QueryPanelTab>('query')
    const [activeView, setActiveView] = useState<'table' | 'chart'>(() => {
      if (!initialQuery && cachedStorage?.activeView) {
        return cachedStorage.activeView
      }
      return 'chart'
    })
    const [displayLimit, setDisplayLimit] = useState<number>(100)

    // Track whether user manually selected a chart type (vs auto-selection)
    // If initialChartConfig is provided, treat it as a manual selection to prevent auto-switching
    const [userManuallySelectedChart, setUserManuallySelectedChart] = useState(
      () => !!initialChartConfig?.chartType
    )

    // Debug data state (from dry-run API)
    const [debugData, setDebugData] = useState<{
      sql: { sql: string; params: any[] } | null
      analysis: QueryAnalysis | null
      loading: boolean
      error: string | null
    }>({ sql: null, analysis: null, loading: false, error: null })

    // Field search modal state
    const [showFieldModal, setShowFieldModal] = useState(false)
    const [fieldModalMode, setFieldModalMode] = useState<'metrics' | 'breakdown'>('metrics')

    // Share state
    const [shareButtonState, setShareButtonState] = useState<'idle' | 'copied' | 'copied-no-chart'>('idle')

    // AI state
    const { features } = useCubeContext()
    const [aiState, setAIState] = useState<AIState>({
      isOpen: false,
      userPrompt: '',
      isGenerating: false,
      error: null,
      hasGeneratedQuery: false,
      previousState: null
    })

    // Load shared state from URL on mount
    useEffect(() => {
      // Skip if initialQuery is provided (parent manages state)
      if (initialQuery) return

      const encoded = parseShareHash()
      if (!encoded) return

      const sharedState = decodeAndDecompress(encoded)
      if (!sharedState || !sharedState.query) return

      const queryConfig = sharedState.query

      // Check if this is a multi-query config
      if (isMultiQueryConfig(queryConfig)) {
        // Multi-query: set all query states
        const multiConfig = queryConfig as MultiQueryConfig
        setQueryStates(multiConfig.queries.map(queryToState))
        setActiveQueryIndex(0)
        if (multiConfig.mergeStrategy) {
          setMergeStrategy(multiConfig.mergeStrategy)
        }
      } else {
        // Single query: set as the only query state
        const query = queryConfig as CubeQuery
        setQueryStates([queryToState(query)])
        setActiveQueryIndex(0)

        // Set order if present (only for single query)
        if (query.order) {
          setOrder(query.order)
        }
      }

      // Apply chart config if present
      if (sharedState.chartType) {
        setChartType(sharedState.chartType)
        setUserManuallySelectedChart(true)
      }
      if (sharedState.chartConfig) {
        setChartConfig(sharedState.chartConfig)
      }
      if (sharedState.displayConfig) {
        setDisplayConfig(sharedState.displayConfig)
      }
      if (sharedState.activeView) {
        setActiveView(sharedState.activeView)
      }

      // Clear the share hash from URL
      clearShareHash()
    }, []) // Run once on mount

    // Build current query for the active tab - memoized to prevent infinite loops
    const currentQuery = useMemo(
      () => buildCubeQuery(state.metrics, state.breakdowns, state.filters, order),
      [state.metrics, state.breakdowns, state.filters, order]
    )

    // Build ALL queries from all queryStates (for multi-query execution)
    const allQueries = useMemo(() => {
      return queryStates.map(qs => buildCubeQuery(qs.metrics, qs.breakdowns, qs.filters, order))
    }, [queryStates, order])

    // Check if we're in multi-query mode (more than one query with content)
    const isMultiQueryMode = useMemo(() => {
      if (queryStates.length <= 1) return false
      // Check if at least 2 queries have content
      const queriesWithContent = queryStates.filter(qs =>
        qs.metrics.length > 0 || qs.breakdowns.length > 0
      )
      return queriesWithContent.length > 1
    }, [queryStates])

    // Validate multi-query configuration and get warnings/errors
    const multiQueryValidation = useMemo((): MultiQueryValidationResult | null => {
      if (!isMultiQueryMode) return null
      return validateMultiQueryConfig(allQueries, mergeStrategy, mergeKeys || [])
    }, [isMultiQueryMode, allQueries, mergeStrategy, mergeKeys])

    // Combined metrics from ALL queries (for chart config in multi-query mode)
    const allMetrics = useMemo(() => {
      if (!isMultiQueryMode) return state.metrics
      return queryStates.flatMap(qs => qs.metrics)
    }, [isMultiQueryMode, queryStates, state.metrics])

    // Combined breakdowns from ALL queries (for chart config in multi-query mode)
    // In merge mode, breakdowns are synced from Q1 so we use Q1's breakdowns
    // In concat mode, we also use Q1's breakdowns as the reference (they're usually shared)
    const allBreakdowns = useMemo(() => {
      if (!isMultiQueryMode) return state.breakdowns
      // Use Q1's breakdowns as the canonical source
      return queryStates[0]?.breakdowns || []
    }, [isMultiQueryMode, queryStates, state.breakdowns])

    // Build MultiQueryConfig for multi-query execution
    const multiQueryConfig = useMemo(() => {
      if (!isMultiQueryMode) return null

      // Filter to only valid queries (have measures or dimensions)
      const validQueries = allQueries.filter(q =>
        (q.measures && q.measures.length > 0) ||
        (q.dimensions && q.dimensions.length > 0) ||
        (q.timeDimensions && q.timeDimensions.length > 0)
      )

      if (validQueries.length < 2) return null

      return {
        queries: validQueries.map(q => cleanQueryForServer(q)),
        mergeStrategy,
        mergeKeys,
        queryLabels: validQueries.map((_, i) => `Q${i + 1}`)
      }
    }, [allQueries, isMultiQueryMode, mergeStrategy, mergeKeys])

    // Serialize query for comparison (prevents object reference issues)
    // For multi-query mode, serialize all queries
    const currentQueryString = useMemo(() => {
      if (isMultiQueryMode) {
        return JSON.stringify({ queries: allQueries, mergeStrategy, mergeKeys })
      }
      return JSON.stringify(currentQuery)
    }, [currentQuery, allQueries, isMultiQueryMode, mergeStrategy, mergeKeys])

    // Debounced query for auto-execution
    const [debouncedQuery, setDebouncedQuery] = useState<CubeQuery | null>(null)
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastQueryStringRef = useRef<string>('')

    // Track if we should skip the first auto-execute (when initialData is provided)
    const hasInitialDataRef = useRef<boolean>(!!initialData && initialData.length > 0)
    const initialQueryStringRef = useRef<string>(initialQuery ? JSON.stringify(initialQuery) : '')

    // Track previous metrics/breakdowns for smart chart defaulting (avoid re-runs when chartConfig changes)
    const prevMetricsBreakdownsRef = useRef<string>('')
    const chartConfigRef = useRef<ChartAxisConfig>(chartConfig)

    // Determine if query is valid (has at least one measure OR one dimension)
    const isValidQuery =
      (currentQuery.measures && currentQuery.measures.length > 0) ||
      (currentQuery.dimensions && currentQuery.dimensions.length > 0) ||
      (currentQuery.timeDimensions && currentQuery.timeDimensions.length > 0)

    // In multi-query mode, check if we have 2+ valid queries (for debounce purposes)
    const hasValidMultiQuery = useMemo(() => {
      if (!isMultiQueryMode) return false
      const validQueries = allQueries.filter(q =>
        (q.measures && q.measures.length > 0) ||
        (q.dimensions && q.dimensions.length > 0) ||
        (q.timeDimensions && q.timeDimensions.length > 0)
      )
      return validQueries.length >= 2
    }, [isMultiQueryMode, allQueries])

    // Debounce query changes - use string comparison to avoid infinite loops
    useEffect(() => {
      // Skip if query hasn't actually changed
      if (currentQueryString === lastQueryStringRef.current) {
        console.log('[DEBUG] Debounce: skipped - query unchanged')
        return
      }
      console.log('[DEBUG] Debounce: query changed, will execute', { isMultiQueryMode, hasValidMultiQuery })

      // Skip initial auto-execution if initialData was provided and query hasn't changed from initial
      // This prevents re-fetching data that was already provided
      if (hasInitialDataRef.current && currentQueryString === initialQueryStringRef.current) {
        // Mark the query as "seen" so we don't skip future executions
        lastQueryStringRef.current = currentQueryString
        // Clear the flag so subsequent changes will execute
        hasInitialDataRef.current = false
        return
      }

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Only debounce if we have a valid query (single or multi-query mode)
      const shouldExecute = isValidQuery || hasValidMultiQuery
      if (shouldExecute) {
        debounceTimerRef.current = setTimeout(() => {
          lastQueryStringRef.current = currentQueryString
          // For multi-query, debouncedQuery just needs to be truthy to trigger execution
          // The actual value isn't used - multiQueryConfig is used instead
          // Using allQueries[0] provides stability - doesn't change on tab switch
          setDebouncedQuery(hasValidMultiQuery ? allQueries[0] : currentQuery)
        }, AUTO_EXECUTE_DELAY)
      } else {
        // Clear debounced query if no valid query
        lastQueryStringRef.current = currentQueryString
        setDebouncedQuery(null)
      }

      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }
      }
    }, [currentQueryString, isValidQuery, hasValidMultiQuery, allQueries])

    // Transform debounced query to server format (converts filter groups)
    const serverQuery = useMemo(() => {
      if (!debouncedQuery) return null
      return cleanQueryForServer(debouncedQuery)
    }, [debouncedQuery])

    // Debounced multi-query config for auto-execution
    // This syncs with debouncedQuery - when debouncedQuery fires, we also fire multi-query
    const debouncedMultiConfig = useMemo(() => {
      // Only create multi-query config when:
      // 1. In multi-query mode (2+ queries with content)
      // 2. A debounced query has fired (indicating user finished typing)
      if (!isMultiQueryMode || !multiQueryConfig || !debouncedQuery) {
        return null
      }
      return multiQueryConfig
    }, [isMultiQueryMode, multiQueryConfig, debouncedQuery])

    // Execute SINGLE query using useCubeQuery hook (when not in multi-query mode)
    // Reset resultSet when query changes to avoid showing stale data after clearing
    const singleQueryResult = useCubeQuery(serverQuery, {
      skip: !serverQuery || isMultiQueryMode,
      resetResultSetOnChange: true
    })

    // Execute MULTI query using useMultiCubeQuery hook (when in multi-query mode)
    const multiQueryResult = useMultiCubeQuery(debouncedMultiConfig, {
      skip: !debouncedMultiConfig || !isMultiQueryMode,
      resetResultSetOnChange: true
    })

    // Unify results from single or multi query
    const resultSet = isMultiQueryMode ? null : singleQueryResult.resultSet
    const isLoading = isMultiQueryMode ? multiQueryResult.isLoading : singleQueryResult.isLoading
    const error = isMultiQueryMode ? multiQueryResult.error : singleQueryResult.error

    // Derive execution status - show success with initialData even before first query
    const executionStatus: ExecutionStatus = useMemo(() => {
      // If we have initialData and haven't started querying yet, show success
      const hasResults = isMultiQueryMode ? multiQueryResult.data : resultSet
      if (initialData && initialData.length > 0 && !debouncedQuery && !hasResults) {
        return 'success'
      }
      if (!debouncedQuery && !debouncedMultiConfig) return 'idle'
      // If results are stale (query changed but debounce hasn't fired yet), show refreshing
      // This prevents flash when toggling comparison mode
      // In multi-query mode, don't use per-tab resultsStale - the chart shows shared merged
      // data that doesn't change on tab switch. We rely on isLoading for actual refreshes.
      if (!isMultiQueryMode && state.resultsStale && hasResults) return 'refreshing'
      if (isLoading && !hasResults) return 'loading'
      if (isLoading && hasResults) return 'refreshing'
      if (error) return 'error'
      if (hasResults) return 'success'
      return 'idle'
    }, [debouncedQuery, debouncedMultiConfig, isLoading, error, resultSet, multiQueryResult.data, initialData, state.resultsStale, isMultiQueryMode])

    // Get execution results - use initialData if no resultSet yet
    // For chart: use merged results from all queries
    const executionResults = useMemo(() => {
      // Multi-query mode: use merged data from useMultiCubeQuery
      if (isMultiQueryMode && multiQueryResult.data) {
        console.log('[DEBUG] executionResults: multi-query', multiQueryResult.data?.length)
        return multiQueryResult.data as any[]
      }

      // Single query mode: use resultSet
      if (resultSet) {
        try {
          const data = resultSet.rawData()
          console.log('[DEBUG] executionResults: single-query', data?.length)
          return data
        } catch {
          return null
        }
      }
      // Use initialData if provided and no resultSet yet
      if (initialData && initialData.length > 0) {
        return initialData
      }
      console.log('[DEBUG] executionResults: null')
      return null
    }, [resultSet, initialData, isMultiQueryMode, multiQueryResult.data])

    // Get per-query results for table view in multi-query mode
    const perQueryResults = useMemo(() => {
      if (!isMultiQueryMode || !multiQueryResult.resultSets) {
        console.log('[DEBUG] perQueryResults: no results', { isMultiQueryMode, resultSets: multiQueryResult.resultSets })
        return undefined
      }
      const results = multiQueryResult.resultSets.map(rs => {
        if (!rs) return null
        try {
          return rs.rawData()
        } catch {
          return null
        }
      })
      console.log('[DEBUG] perQueryResults:', results.map(r => r?.length || 0))
      return results
    }, [isMultiQueryMode, multiQueryResult.resultSets])

    // Active table index for multi-query table view
    const [activeTableIndex, setActiveTableIndex] = useState(0)

    // Note: We pass executionStatus, executionResults, error directly to PortletResultsPanel
    // instead of storing in state, to avoid render loops

    // Clear resultsStale flag when new results arrive
    useEffect(() => {
      if (resultSet && state.resultsStale) {
        setState((prev) => ({ ...prev, resultsStale: false }))
      }
    }, [resultSet, state.resultsStale])

    // Compute chart availability based on current metrics and breakdowns
    // Use allMetrics/allBreakdowns for consistency in multi-query mode
    const chartAvailability = useMemo(
      () => getAllChartAvailability(allMetrics, allBreakdowns),
      [allMetrics, allBreakdowns]
    )

    // Helper to check if chart config is completely empty (no axes configured)
    const isChartConfigEmpty = useCallback((config: ChartAxisConfig): boolean => {
      const keys: (keyof ChartAxisConfig)[] = ['xAxis', 'yAxis', 'series', 'sizeField', 'colorField', 'dateField', 'valueField']
      return keys.every(key => {
        const val = config[key]
        if (val === undefined || val === null) return true
        if (Array.isArray(val)) return val.length === 0
        if (typeof val === 'string') return val === ''
        return false
      })
    }, [])

    // Keep chartConfigRef in sync with chartConfig state
    chartConfigRef.current = chartConfig

    // Smart chart defaulting - auto-configure chart type and axes when debouncedQuery changes
    // This runs AFTER the debounce fires, so chart config changes are synchronized with data updates
    // This prevents the "double refresh" visual where chart updates before data arrives
    useEffect(() => {
      // Only run when we have a debounced query (after debounce timer fires)
      if (!debouncedQuery) {
        return
      }

      if (allMetrics.length === 0 && allBreakdowns.length === 0) {
        return // Nothing to configure
      }

      // Create a key from metrics/breakdowns fields to detect actual changes
      // Use allMetrics and allBreakdowns to track changes across all queries
      const currentKey = JSON.stringify({
        metrics: allMetrics.map(m => m.field),
        breakdowns: allBreakdowns.map(b => ({ field: b.field, isTime: b.isTimeDimension }))
      })

      // Skip if metrics/breakdowns haven't actually changed
      if (currentKey === prevMetricsBreakdownsRef.current) {
        return
      }
      prevMetricsBreakdownsRef.current = currentKey

      // Check if we should auto-switch chart type (use allMetrics/allBreakdowns for multi-query)
      const newChartType = shouldAutoSwitchChartType(
        allMetrics,
        allBreakdowns,
        chartType,
        userManuallySelectedChart
      )

      if (newChartType) {
        // Chart type is changing - get smart defaults for the new chart type
        const { chartConfig: newChartConfig } = getSmartChartDefaults(
          allMetrics,
          allBreakdowns,
          newChartType
        )
        setChartType(newChartType)
        setChartConfig(newChartConfig)
        // Reset user selection flag since we auto-switched
        setUserManuallySelectedChart(false)
      } else if (allMetrics.length > 0 || allBreakdowns.length > 0) {
        // Only apply smart defaults if the chart config is COMPLETELY empty
        // Once user has configured ANY axis, don't auto-fill (respects user removals)
        // Use ref to get current value without adding to dependencies
        if (isChartConfigEmpty(chartConfigRef.current)) {
          const { chartConfig: smartDefaults } = getSmartChartDefaults(
            allMetrics,
            allBreakdowns,
            chartType
          )
          setChartConfig(smartDefaults)
        }
      }
    }, [debouncedQuery, allMetrics, allBreakdowns, chartType, userManuallySelectedChart, isChartConfigEmpty])

    // Save state to localStorage whenever it changes (if not disabled)
    // Deferred to avoid blocking renders
    useEffect(() => {
      if (disableLocalStorage) return

      // Defer to next tick to avoid blocking renders
      const timeoutId = setTimeout(() => {
        try {
          // Store both legacy format (for backward compatibility) and multi-query format
          const activeState = queryStates[activeQueryIndex] || createInitialState()
          const storageState: AnalysisBuilderStorageState = {
            // Legacy format (for backward compatibility with single-query)
            metrics: activeState.metrics,
            breakdowns: activeState.breakdowns,
            filters: activeState.filters,
            order,
            chartType,
            chartConfig,
            displayConfig,
            activeView,
            // Multi-query format (mergeKeys is computed from Q1 breakdowns, not stored)
            queryStates: queryStates.length > 1 ? queryStates : undefined,
            activeQueryIndex: queryStates.length > 1 ? activeQueryIndex : undefined,
            mergeStrategy: queryStates.length > 1 ? mergeStrategy : undefined
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(storageState))
        } catch {
          // Failed to save to localStorage
        }
      }, 0)

      return () => clearTimeout(timeoutId)
    }, [
      queryStates,
      activeQueryIndex,
      mergeStrategy,
      order,
      chartType,
      chartConfig,
      displayConfig,
      activeView,
      disableLocalStorage
    ])

    // Call onQueryChange callback when query changes
    useEffect(() => {
      if (onQueryChange && isValidQuery) {
        onQueryChange(currentQuery)
      }
    }, [currentQuery, isValidQuery, onQueryChange])

    // Call onChartConfigChange callback when chart config changes
    useEffect(() => {
      if (onChartConfigChange) {
        onChartConfigChange({ chartType, chartConfig, displayConfig })
      }
    }, [chartType, chartConfig, displayConfig, onChartConfigChange])

    // Fetch dry-run data for debug tab
    useEffect(() => {
      // Clear debug data if no valid query
      if (!isValidQuery || !serverQuery) {
        setDebugData({ sql: null, analysis: null, loading: false, error: null })
        return
      }

      let isCancelled = false

      const fetchDebugData = async () => {
        setDebugData((prev) => ({ ...prev, loading: true, error: null }))
        try {
          const result = await cubeApi.dryRun(serverQuery)
          if (!isCancelled) {
            setDebugData({
              sql: result.sql,
              analysis: result.analysis,
              loading: false,
              error: null
            })
          }
        } catch (err) {
          if (!isCancelled) {
            setDebugData({
              sql: null,
              analysis: null,
              loading: false,
              error: err instanceof Error ? err.message : 'Failed to fetch debug info'
            })
          }
        }
      }

      fetchDebugData()

      return () => {
        isCancelled = true
      }
    }, [serverQuery, cubeApi, isValidQuery])

    // ========================================================================
    // Metric Handlers
    // ========================================================================

    const handleAddMetric = useCallback(() => {
      setFieldModalMode('metrics')
      setShowFieldModal(true)
    }, [])

    const handleRemoveMetric = useCallback((id: string) => {
      // Find the field name before removing
      const fieldToRemove = state.metrics.find((m) => m.id === id)?.field

      setState((prev) => ({
        ...prev,
        metrics: prev.metrics.filter((m) => m.id !== id),
        resultsStale: true
      }))

      // Clean up any sort order for the removed field
      if (fieldToRemove) {
        setOrder((prevOrder) => {
          if (!prevOrder || !prevOrder[fieldToRemove]) return prevOrder
          const newOrder = { ...prevOrder }
          delete newOrder[fieldToRemove]
          return Object.keys(newOrder).length > 0 ? newOrder : undefined
        })
      }
    }, [state.metrics])

    const handleFieldSelected = useCallback(
      (field: MetaField, fieldType: 'measure' | 'dimension' | 'timeDimension', _cubeName: string, keepOpen?: boolean) => {
        if (fieldModalMode === 'metrics' && fieldType === 'measure') {
          // Toggle metric - add if not present, remove if already added
          setState((prev) => {
            const existingIndex = prev.metrics.findIndex((m) => m.field === field.name)
            if (existingIndex >= 0) {
              // Remove existing metric
              return {
                ...prev,
                metrics: prev.metrics.filter((_, i) => i !== existingIndex),
                resultsStale: true
              }
            }
            // Add new metric
            const newMetric: MetricItem = {
              id: generateId(),
              field: field.name,
              label: generateMetricLabel(prev.metrics.length)
            }
            return {
              ...prev,
              metrics: [...prev.metrics, newMetric],
              resultsStale: true
            }
          })
        } else if (fieldModalMode === 'breakdown') {
          // Toggle breakdown - add if not present, remove if already added
          const isTimeDimension = fieldType === 'timeDimension'
          setState((prev) => {
            const existingIndex = prev.breakdowns.findIndex((b) => b.field === field.name)
            if (existingIndex >= 0) {
              // Remove existing breakdown
              return {
                ...prev,
                breakdowns: prev.breakdowns.filter((_, i) => i !== existingIndex),
                resultsStale: true
              }
            }

            // Check if we already have a time dimension breakdown (only allow one)
            if (isTimeDimension) {
              const hasExistingTimeDimension = prev.breakdowns.some((b) => b.isTimeDimension)
              if (hasExistingTimeDimension) {
                // Don't add - already have a time dimension breakdown
                // Could show a notification here in the future
                return prev
              }
            }

            // Add new breakdown
            const newBreakdown: BreakdownItem = {
              id: generateId(),
              field: field.name,
              isTimeDimension,
              granularity: isTimeDimension ? 'month' : undefined
            }
            return {
              ...prev,
              breakdowns: [...prev.breakdowns, newBreakdown],
              resultsStale: true
            }
          })
        }
        // Only close modal if not doing shift-click multi-select
        if (!keepOpen) {
          setShowFieldModal(false)
        }
      },
      [fieldModalMode, setState]
    )

    // ========================================================================
    // Breakdown Handlers
    // ========================================================================

    const handleAddBreakdown = useCallback(() => {
      setFieldModalMode('breakdown')
      setShowFieldModal(true)
    }, [])

    const handleRemoveBreakdown = useCallback((id: string) => {
      // Find the field name before removing
      const fieldToRemove = state.breakdowns.find((b) => b.id === id)?.field

      setState((prev) => ({
        ...prev,
        breakdowns: prev.breakdowns.filter((b) => b.id !== id),
        resultsStale: true
      }))

      // Clean up any sort order for the removed field
      if (fieldToRemove) {
        setOrder((prevOrder) => {
          if (!prevOrder || !prevOrder[fieldToRemove]) return prevOrder
          const newOrder = { ...prevOrder }
          delete newOrder[fieldToRemove]
          return Object.keys(newOrder).length > 0 ? newOrder : undefined
        })
      }
    }, [state.breakdowns])

    const handleBreakdownGranularityChange = useCallback(
      (id: string, granularity: string) => {
        // In merge mode, granularity changes should update Q1's breakdowns (source of truth)
        // since the sync effect copies Q1 → other queries
        if (mergeStrategy === 'merge' && activeQueryIndex > 0) {
          // Update Q1's breakdowns directly
          setQueryStates(prev => {
            const newStates = [...prev]
            newStates[0] = {
              ...newStates[0],
              breakdowns: newStates[0].breakdowns.map((b) =>
                b.id === id ? { ...b, granularity } : b
              ),
              resultsStale: true
            }
            return newStates
          })
        } else {
          // Normal case: update active query's breakdowns
          setState((prev) => ({
            ...prev,
            breakdowns: prev.breakdowns.map((b) =>
              b.id === id ? { ...b, granularity } : b
            ),
            resultsStale: true
          }))
        }
      },
      [mergeStrategy, activeQueryIndex, setState]
    )

    const handleBreakdownComparisonToggle = useCallback(
      (breakdownId: string) => {
        // Check if we're enabling comparison (the breakdown currently doesn't have it)
        // In merge mode, use Q1's breakdowns as the source of truth
        const sourceBreakdowns = (mergeStrategy === 'merge' && activeQueryIndex > 0)
          ? queryStates[0]?.breakdowns || []
          : state.breakdowns
        const targetBreakdown = sourceBreakdowns.find(b => b.id === breakdownId)
        const isEnabling = targetBreakdown && !targetBreakdown.enableComparison

        // If enabling comparison and no date filter exists, auto-add one (last 30 days)
        if (isEnabling && targetBreakdown) {
          const currentFilters = (mergeStrategy === 'merge' && activeQueryIndex > 0)
            ? queryStates[0]?.filters || []
            : state.filters
          const hasDateFilter = findDateFilterForField(currentFilters, targetBreakdown.field)

          if (!hasDateFilter) {
            // Auto-add a date filter with 'last 30 days' range
            const newFilter: Filter = {
              member: targetBreakdown.field,
              operator: 'inDateRange',
              values: [],
              dateRange: convertDateRangeTypeToValue('last_30_days')
            } as Filter

            // Add the filter to the appropriate query's filters
            if (mergeStrategy === 'merge' && activeQueryIndex > 0) {
              setQueryStates(prev => {
                const newStates = [...prev]
                newStates[0] = {
                  ...newStates[0],
                  filters: [...newStates[0].filters, newFilter]
                }
                return newStates
              })
            } else {
              setState((prev) => ({
                ...prev,
                filters: [...prev.filters, newFilter]
              }))
            }
          }
        }

        // If enabling comparison and chart type is not 'line', switch to line chart first
        // (comparison only works well with line charts)
        if (isEnabling && chartType !== 'line') {
          setChartType('line')
          // Update chart config for line chart
          const { chartConfig: newChartConfig } = getSmartChartDefaults(
            state.metrics,
            state.breakdowns,
            'line'
          )
          setChartConfig(newChartConfig)
        }

        // Helper to update breakdowns with comparison toggle
        const updateBreakdowns = (breakdowns: typeof state.breakdowns) =>
          breakdowns.map((b) => {
            if (b.id === breakdownId) {
              // Toggle this breakdown's comparison
              return { ...b, enableComparison: !b.enableComparison }
            }
            // Clear comparison from other time dimensions when enabling (only one allowed)
            if (b.isTimeDimension && b.enableComparison) {
              return { ...b, enableComparison: false }
            }
            return b
          })

        // In merge mode, update Q1's breakdowns (source of truth)
        if (mergeStrategy === 'merge' && activeQueryIndex > 0) {
          setQueryStates(prev => {
            const newStates = [...prev]
            newStates[0] = {
              ...newStates[0],
              breakdowns: updateBreakdowns(newStates[0].breakdowns),
              resultsStale: true
            }
            return newStates
          })
        } else {
          // Normal case: update active query's breakdowns
          setState((prev) => ({
            ...prev,
            breakdowns: updateBreakdowns(prev.breakdowns),
            resultsStale: true
          }))
        }
      },
      [chartType, state.breakdowns, state.filters, state.metrics, mergeStrategy, activeQueryIndex, queryStates, setState]
    )

    // ========================================================================
    // Reorder Handlers
    // ========================================================================

    const handleReorderMetrics = useCallback(
      (fromIndex: number, toIndex: number) => {
        setState((prev) => {
          const newMetrics = [...prev.metrics]
          const [movedItem] = newMetrics.splice(fromIndex, 1)
          newMetrics.splice(toIndex, 0, movedItem)
          return {
            ...prev,
            metrics: newMetrics,
            resultsStale: true
          }
        })
      },
      [setState]
    )

    const handleReorderBreakdowns = useCallback(
      (fromIndex: number, toIndex: number) => {
        setState((prev) => {
          const newBreakdowns = [...prev.breakdowns]
          const [movedItem] = newBreakdowns.splice(fromIndex, 1)
          newBreakdowns.splice(toIndex, 0, movedItem)
          return {
            ...prev,
            breakdowns: newBreakdowns,
            resultsStale: true
          }
        })
      },
      [setState]
    )

    // ========================================================================
    // Filter Handlers
    // ========================================================================

    // Filter change handler - connected to PortletQueryPanel
    const handleFiltersChange = useCallback((filters: Filter[]) => {
      setState((prev) => ({
        ...prev,
        filters,
        resultsStale: true
      }))
    }, [setState])

    // Handle dropping a field from metrics/breakdowns onto the filter section
    const handleDropFieldToFilter = useCallback((field: string) => {
      // Create a new filter with 'set' operator (checks if field exists/is not null)
      const newFilter: Filter = {
        member: field,
        operator: 'set',
        values: []
      }

      setState((prev) => {
        // Add to existing filters or create new array
        const existingFilters = prev.filters || []

        // Check if we already have a filter for this field
        const hasFilterForField = existingFilters.some((f) =>
          'member' in f && f.member === field
        )

        if (hasFilterForField) {
          // Don't add duplicate filter
          return prev
        }

        // If we have existing filters, wrap in an AND group or add to existing group
        let updatedFilters: Filter[]
        if (existingFilters.length === 0) {
          updatedFilters = [newFilter]
        } else if (existingFilters.length === 1 && 'type' in existingFilters[0]) {
          // Already a group, add to it
          const group = existingFilters[0] as { type: 'and' | 'or'; filters: Filter[] }
          updatedFilters = [{
            ...group,
            filters: [...group.filters, newFilter]
          }]
        } else {
          // Wrap all in AND group
          updatedFilters = [{
            type: 'and' as const,
            filters: [...existingFilters, newFilter]
          }]
        }

        return {
          ...prev,
          filters: updatedFilters,
          resultsStale: true
        }
      })
    }, [setState])

    // ========================================================================
    // Order Handlers
    // ========================================================================

    const handleOrderChange = useCallback(
      (fieldName: string, direction: 'asc' | 'desc' | null) => {
        setOrder((prev) => {
          const newOrder = { ...(prev || {}) }

          if (direction === null) {
            // Remove sort for this field
            delete newOrder[fieldName]
          } else {
            // Set or update sort direction
            newOrder[fieldName] = direction
          }

          // Return undefined if empty, otherwise return the new order
          return Object.keys(newOrder).length > 0 ? newOrder : undefined
        })
      },
      []
    )

    // ========================================================================
    // Multi-Query Handlers
    // ========================================================================

    // Add a new query tab - copies current query's metrics, breakdowns, filters
    const handleAddQuery = useCallback(() => {
      const currentState = queryStates[activeQueryIndex] || createInitialState()
      const newState: AnalysisBuilderState = {
        ...createInitialState(),
        metrics: [...currentState.metrics],
        breakdowns: [...currentState.breakdowns],
        filters: [...currentState.filters]
      }
      setQueryStates(prev => [...prev, newState])
      // Switch to the new tab
      setActiveQueryIndex(queryStates.length)
    }, [queryStates, activeQueryIndex])

    // Remove a query tab at specified index
    const handleRemoveQuery = useCallback((index: number) => {
      setQueryStates(prev => {
        // Don't allow removing the last query
        if (prev.length <= 1) return prev
        return prev.filter((_, i) => i !== index)
      })
      // Adjust active index if needed
      if (index === activeQueryIndex) {
        // If removing active tab, switch to previous (or first if removing first)
        setActiveQueryIndex(Math.max(0, activeQueryIndex - 1))
      } else if (index < activeQueryIndex) {
        // Shift active index down if removing a tab before it
        setActiveQueryIndex(activeQueryIndex - 1)
      }
    }, [activeQueryIndex])

    // Change active query tab
    const handleActiveQueryChange = useCallback((index: number) => {
      setActiveQueryIndex(index)
    }, [])

    // Update merge strategy
    const handleMergeStrategyChange = useCallback((strategy: QueryMergeStrategy) => {
      setMergeStrategy(strategy)
    }, [])

    // Compute combined metrics from ALL queries (for chart config in multi-query mode)
    // Always returns an array (never undefined) for consistent prop passing
    const combinedMetrics = useMemo(() => {
      if (!isMultiQueryMode) return state.metrics

      const seen = new Set<string>()
      const combined: MetricItem[] = []

      for (let qIndex = 0; qIndex < queryStates.length; qIndex++) {
        const qs = queryStates[qIndex]
        for (const metric of qs.metrics) {
          // In multi-query mode, prefix with query label to distinguish
          const key = `Q${qIndex + 1}:${metric.field}`
          if (!seen.has(key)) {
            seen.add(key)
            combined.push({
              ...metric,
              // Keep original field but update label to show query source
              label: `${metric.label} (Q${qIndex + 1})`
            })
          }
        }
      }
      return combined
    }, [isMultiQueryMode, queryStates, state.metrics])

    // Compute combined breakdowns from ALL queries (for chart config in multi-query mode)
    // Always returns an array (never undefined) for consistent prop passing
    const combinedBreakdowns = useMemo(() => {
      if (!isMultiQueryMode) return state.breakdowns

      const seen = new Set<string>()
      const combined: BreakdownItem[] = []

      for (const qs of queryStates) {
        for (const breakdown of qs.breakdowns) {
          // Deduplicate by field (breakdowns are usually shared across queries)
          if (!seen.has(breakdown.field)) {
            seen.add(breakdown.field)
            combined.push(breakdown)
          }
        }
      }
      return combined
    }, [isMultiQueryMode, queryStates, state.breakdowns])

    // ========================================================================
    // Clear Query
    // ========================================================================

    const handleClearQuery = useCallback(() => {
      // In multi-query mode, only clear the active query
      // If user wants to clear all queries, they should remove tabs
      setState(createInitialState())
      setOrder(undefined)
      setUserManuallySelectedChart(false)
      // Also reset chart type, config, and display config
      setChartType('line')
      setChartConfig({})
      setDisplayConfig({ showLegend: true, showGrid: true, showTooltip: true })
      // Clear the debounced query immediately to stop showing old results
      setDebouncedQuery(null)
      // Also clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }, [setState])

    // ========================================================================
    // AI Query Generation
    // ========================================================================

    const handleOpenAI = useCallback(() => {
      // Snapshot current state for undo
      setAIState({
        isOpen: true,
        userPrompt: '',
        isGenerating: false,
        error: null,
        hasGeneratedQuery: false,
        previousState: {
          metrics: [...state.metrics],
          breakdowns: [...state.breakdowns],
          filters: [...state.filters],
          chartType,
          chartConfig: { ...chartConfig },
          displayConfig: { ...displayConfig }
        }
      })
    }, [state.metrics, state.breakdowns, state.filters, chartType, chartConfig, displayConfig])

    const handleCloseAI = useCallback(() => {
      setAIState(prev => ({
        ...prev,
        isOpen: false,
        userPrompt: '',
        error: null,
        hasGeneratedQuery: false
      }))
    }, [])

    const handleAIPromptChange = useCallback((prompt: string) => {
      setAIState(prev => ({ ...prev, userPrompt: prompt }))
    }, [])

    const handleGenerateAI = useCallback(async () => {
      if (!aiState.userPrompt.trim()) return

      setAIState(prev => ({ ...prev, isGenerating: true, error: null }))

      try {
        const response = await sendGeminiMessage(
          '', // API key not needed for server-side AI
          aiState.userPrompt,
          features?.aiEndpoint || '/api/ai'
        )

        const responseText = extractTextFromResponse(response)
        const parsed = JSON.parse(responseText) as {
          query?: CubeQuery
          chartType?: ChartType
          chartConfig?: ChartAxisConfig
        } | CubeQuery

        // Support both new format (with query/chartType/chartConfig) and legacy format (just query)
        const query = ('query' in parsed && parsed.query) ? parsed.query : parsed as CubeQuery
        const aiChartType = ('chartType' in parsed) ? parsed.chartType : undefined
        const aiChartConfig = ('chartConfig' in parsed) ? parsed.chartConfig : undefined

        // Load query into builder state (same pattern as initialQuery)
        setState(prev => ({
          ...prev,
          metrics: (query.measures || []).map((field, index) => ({
            id: generateId(),
            field,
            label: generateMetricLabel(index)
          })),
          breakdowns: [
            ...(query.dimensions || []).map((field) => ({
              id: generateId(),
              field,
              isTimeDimension: false
            })),
            ...(query.timeDimensions || []).map((td) => ({
              id: generateId(),
              field: td.dimension,
              granularity: td.granularity,
              isTimeDimension: true
            }))
          ],
          filters: query.filters || []
        }))

        // Apply chart type if provided by AI
        if (aiChartType) {
          setChartType(aiChartType)
          setUserManuallySelectedChart(true) // Prevent auto-switching
        }

        // Apply chart config if provided by AI
        if (aiChartConfig) {
          setChartConfig(aiChartConfig)
        }

        // Switch to chart view so user can see the visualization
        setActiveView('chart')

        setAIState(prev => ({
          ...prev,
          isGenerating: false,
          hasGeneratedQuery: true
        }))
      } catch (error) {
        setAIState(prev => ({
          ...prev,
          isGenerating: false,
          error: error instanceof Error ? error.message : 'Failed to generate query'
        }))
      }
    }, [aiState.userPrompt, features?.aiEndpoint])

    const handleAcceptAI = useCallback(() => {
      // Close panel and clear previous state (keep the changes)
      setAIState({
        isOpen: false,
        userPrompt: '',
        isGenerating: false,
        error: null,
        hasGeneratedQuery: false,
        previousState: null
      })
    }, [])

    const handleCancelAI = useCallback(() => {
      // Restore previous state
      if (aiState.previousState) {
        setState(prev => ({
          ...prev,
          metrics: aiState.previousState!.metrics,
          breakdowns: aiState.previousState!.breakdowns,
          filters: aiState.previousState!.filters
        }))
        setChartType(aiState.previousState.chartType)
        setChartConfig(aiState.previousState.chartConfig)
        setDisplayConfig(aiState.previousState.displayConfig)
      }

      // Close panel
      setAIState({
        isOpen: false,
        userPrompt: '',
        isGenerating: false,
        error: null,
        hasGeneratedQuery: false,
        previousState: null
      })
    }, [aiState.previousState])

    // Handle chart type change - track that user manually selected this
    const handleChartTypeChange = useCallback((type: ChartType) => {
      // If switching away from 'line', clear any comparison from time dimensions first
      // (comparison only works with line charts)
      // Do this before other updates so React 18 batches them together
      if (type !== 'line') {
        const hasComparison = state.breakdowns.some(b => b.isTimeDimension && b.enableComparison)
        if (hasComparison) {
          setState((prev) => ({
            ...prev,
            breakdowns: prev.breakdowns.map((b) =>
              b.isTimeDimension && b.enableComparison
                ? { ...b, enableComparison: false }
                : b
            ),
            resultsStale: true
          }))
        }
      }

      setChartType(type)
      setUserManuallySelectedChart(true)

      // Update chart config for the new chart type
      const { chartConfig: newChartConfig } = getSmartChartDefaults(
        state.metrics,
        state.breakdowns,
        type
      )
      setChartConfig(newChartConfig)
      // Switch to chart view so user can see the changes
      setActiveView('chart')
    }, [state.metrics, state.breakdowns])

    // Handle chart config change - also switch to chart view
    const handleChartConfigChange = useCallback((config: ChartAxisConfig) => {
      setChartConfig(config)
      // Switch to chart view so user can see the changes
      setActiveView('chart')
    }, [])

    // Handle display config change - also switch to chart view
    const handleDisplayConfigChange = useCallback((config: ChartDisplayConfig) => {
      setDisplayConfig(config)
      // Switch to chart view so user can see the changes
      setActiveView('chart')
    }, [])

    // ========================================================================
    // Share Handler
    // ========================================================================

    const handleShare = useCallback(async () => {
      if (!isValidQuery) return

      // Build the query config - use multi-query format if multiple queries exist
      const queryConfig = queryStates.length > 1
        ? {
            queries: allQueries,
            mergeStrategy,
            mergeKeys,
            queryLabels: queryStates.map((_, i) => `Q${i + 1}`)
          }
        : currentQuery

      const shareableState = {
        query: queryConfig,
        chartType,
        chartConfig,
        displayConfig,
        activeView
      }

      // Try full state first, fall back to query-only if too large
      const { encoded, queryOnly } = compressWithFallback(shareableState)

      // If even query-only is too large, don't share
      if (!encoded) {
        return
      }

      const url = `${window.location.origin}${window.location.pathname}#share=${encoded}`

      try {
        await navigator.clipboard.writeText(url)
      } catch {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = url
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }

      // Update button state
      setShareButtonState(queryOnly ? 'copied-no-chart' : 'copied')

      // Reset button state after 2 seconds
      setTimeout(() => {
        setShareButtonState('idle')
      }, 2000)
    }, [isValidQuery, queryStates.length, allQueries, mergeStrategy, mergeKeys, currentQuery, chartType, chartConfig, displayConfig, activeView])

    // ========================================================================
    // Expose API via ref
    // ========================================================================

    useImperativeHandle(
      ref,
      () => ({
        getQueryConfig: () => {
          // If multiple queries, return MultiQueryConfig format
          if (queryStates.length > 1) {
            return {
              queries: allQueries,
              mergeStrategy,
              mergeKeys,
              queryLabels: queryStates.map((_, i) => `Q${i + 1}`)
            }
          }
          // Single query, return CubeQuery format
          return currentQuery
        },
        getChartConfig: () => ({ chartType, chartConfig, displayConfig }),
        executeQuery: () => {
          // TODO: Implement manual execute
        },
        clearQuery: handleClearQuery
      }),
      [currentQuery, allQueries, queryStates.length, mergeStrategy, mergeKeys, chartType, chartConfig, displayConfig, handleClearQuery]
    )

    // ========================================================================
    // Render
    // ========================================================================

    return (
      <div
        className={`flex flex-col lg:flex-row bg-dc-surface border-x border-b border-dc-border ${maxHeight ? 'lg:h-[var(--dc-max-h)] lg:max-h-[var(--dc-max-h)] lg:overflow-hidden' : 'lg:h-full'} ${className}`}
        style={maxHeight ? { ['--dc-max-h' as string]: maxHeight } : undefined}
      >
        {/* Top/Left Panel - Results */}
        <div className="h-[60vh] lg:h-auto lg:flex-1 min-w-0 border-b lg:border-b-0 lg:border-r border-dc-border overflow-auto flex flex-col">
          {/* AI Panel - expands above results when open */}
          {aiState.isOpen && (
            <AnalysisAIPanel
              userPrompt={aiState.userPrompt}
              onPromptChange={handleAIPromptChange}
              isGenerating={aiState.isGenerating}
              error={aiState.error}
              hasGeneratedQuery={aiState.hasGeneratedQuery}
              onGenerate={handleGenerateAI}
              onAccept={handleAcceptAI}
              onCancel={handleCancelAI}
            />
          )}

          {/* Results Panel */}
          <div className="flex-1 overflow-auto">
            <AnalysisResultsPanel
              executionStatus={executionStatus}
              executionResults={executionResults}
              executionError={error?.message || null}
              totalRowCount={null}
              resultsStale={isLoading && executionResults !== null}
              chartType={chartType}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              colorPalette={effectiveColorPalette}
              // Only show palette selector in standalone mode (not when editing portlet)
              currentPaletteName={!externalColorPalette ? localPaletteName : undefined}
              onColorPaletteChange={!externalColorPalette ? setLocalPaletteName : undefined}
              allQueries={allQueries}
              schema={meta as MetaResponse | null}
              activeView={activeView}
              onActiveViewChange={setActiveView}
              displayLimit={displayLimit}
              onDisplayLimitChange={setDisplayLimit}
              hasMetrics={state.metrics.length > 0}
              // Debug props (serverQuery is the cleaned/transformed version sent to server)
              debugQuery={serverQuery}
              debugSql={debugData.sql}
              debugAnalysis={debugData.analysis}
              debugLoading={debugData.loading}
              debugError={debugData.error}
              // Share props
              onShareClick={handleShare}
              canShare={isValidQuery}
              shareButtonState={shareButtonState}
              // Clear props
              onClearClick={handleClearQuery}
              canClear={state.metrics.length > 0 || state.breakdowns.length > 0 || state.filters.length > 0}
              // AI props
              enableAI={features?.enableAI !== false}
              isAIOpen={aiState.isOpen}
              onAIToggle={aiState.isOpen ? handleCloseAI : handleOpenAI}
              // Multi-query props
              queryCount={queryStates.length}
              perQueryResults={perQueryResults}
              activeTableIndex={activeTableIndex}
              onActiveTableChange={setActiveTableIndex}
            />
          </div>
        </div>

        {/* Bottom/Right Panel - Query Builder */}
        <div className="w-full lg:w-96 flex-shrink-0 lg:h-full overflow-auto lg:overflow-hidden">
          <AnalysisQueryPanel
            metrics={state.metrics}
            breakdowns={state.breakdowns}
            filters={state.filters}
            schema={meta as MetaResponse | null}
            activeTab={activeTab}
            onActiveTabChange={setActiveTab}
            onAddMetric={handleAddMetric}
            onRemoveMetric={handleRemoveMetric}
            onReorderMetrics={handleReorderMetrics}
            onAddBreakdown={handleAddBreakdown}
            onRemoveBreakdown={handleRemoveBreakdown}
            onBreakdownGranularityChange={handleBreakdownGranularityChange}
            onBreakdownComparisonToggle={handleBreakdownComparisonToggle}
            onReorderBreakdowns={handleReorderBreakdowns}
            onFiltersChange={handleFiltersChange}
            onDropFieldToFilter={handleDropFieldToFilter}
            order={order}
            onOrderChange={handleOrderChange}
            chartType={chartType}
            chartConfig={chartConfig}
            displayConfig={displayConfig}
            colorPalette={effectiveColorPalette}
            chartAvailability={chartAvailability}
            onChartTypeChange={handleChartTypeChange}
            onChartConfigChange={handleChartConfigChange}
            onDisplayConfigChange={handleDisplayConfigChange}
            validationStatus={state.validationStatus}
            validationError={state.validationError}
            // Multi-query props
            queryCount={queryStates.length}
            activeQueryIndex={activeQueryIndex}
            mergeStrategy={mergeStrategy}
            onActiveQueryChange={handleActiveQueryChange}
            onAddQuery={handleAddQuery}
            onRemoveQuery={handleRemoveQuery}
            onMergeStrategyChange={handleMergeStrategyChange}
            breakdownsLocked={mergeStrategy === 'merge' && activeQueryIndex > 0}
            combinedMetrics={combinedMetrics}
            combinedBreakdowns={combinedBreakdowns}
            multiQueryValidation={multiQueryValidation}
          />
        </div>

        {/* Field Search Modal */}
        <FieldSearchModal
          isOpen={showFieldModal}
          onClose={() => setShowFieldModal(false)}
          onSelect={handleFieldSelected}
          mode={fieldModalMode}
          schema={meta as MetaResponse | null}
          selectedFields={[
            ...state.metrics.map((m) => m.field),
            ...state.breakdowns.map((b) => b.field)
          ]}
        />
      </div>
    )
  }
)

AnalysisBuilder.displayName = 'AnalysisBuilder'

export default AnalysisBuilder
