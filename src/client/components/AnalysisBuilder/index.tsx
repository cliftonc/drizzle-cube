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
import type { CubeQuery, Filter, ChartType, ChartAxisConfig, ChartDisplayConfig } from '../../types'
import FieldSearchModal from './FieldSearchModal'
import AnalysisResultsPanel from './AnalysisResultsPanel'
import AnalysisQueryPanel from './AnalysisQueryPanel'
import type { MetaField, MetaResponse } from '../../shared/types'
import { cleanQueryForServer } from '../../shared/utils'
import { getAllChartAvailability, getSmartChartDefaults, shouldAutoSwitchChartType } from '../../shared/chartDefaults'
import { compressWithFallback, parseShareHash, decodeAndDecompress, clearShareHash } from '../QueryBuilder/shareUtils'
import { getColorPalette } from '../../utils/colorPalettes'
import { sendGeminiMessage, extractTextFromResponse } from '../AIAssistant/utils'
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
 * Convert metrics and breakdowns to CubeQuery format
 */
function buildCubeQuery(
  metrics: MetricItem[],
  breakdowns: BreakdownItem[],
  filters: Filter[],
  order?: Record<string, 'asc' | 'desc'>
): CubeQuery {
  const query: CubeQuery = {
    measures: metrics.map((m) => m.field),
    dimensions: breakdowns.filter((b) => !b.isTimeDimension).map((b) => b.field),
    timeDimensions: breakdowns
      .filter((b) => b.isTimeDimension)
      .map((b) => ({
        dimension: b.field,
        granularity: b.granularity || 'day'
      })),
    filters: filters.length > 0 ? filters : undefined,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const cachedStorage = useMemo(
      () => loadInitialStateFromStorage(disableLocalStorageProp),
      [] // Only run once on mount
    )

    // Load initial state from localStorage or initialQuery
    const [state, setState] = useState<AnalysisBuilderState>(() => {
      // If initialQuery is provided, parse it to metrics/breakdowns
      if (initialQuery) {
        return {
          ...createInitialState(),
          metrics: (initialQuery.measures || []).map((field, index) => ({
            id: generateId(),
            field,
            label: generateMetricLabel(index)
          })),
          breakdowns: [
            ...(initialQuery.dimensions || []).map((field) => ({
              id: generateId(),
              field,
              isTimeDimension: false
            })),
            ...(initialQuery.timeDimensions || []).map((td) => ({
              id: generateId(),
              field: td.dimension,
              granularity: td.granularity,
              isTimeDimension: true
            }))
          ],
          filters: initialQuery.filters || []
        }
      }

      // Use cached localStorage data if available
      if (cachedStorage) {
        return {
          ...createInitialState(),
          metrics: cachedStorage.metrics || [],
          breakdowns: cachedStorage.breakdowns || [],
          filters: cachedStorage.filters || []
        }
      }

      return createInitialState()
    })

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
      // Load from initialQuery if provided
      if (initialQuery?.order) {
        return initialQuery.order
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

      const query = sharedState.query

      // Set metrics and breakdowns from shared query
      setState({
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

      // Set order if present
      if (query.order) {
        setOrder(query.order)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Run once on mount

    // Build current query - memoized to prevent infinite loops
    const currentQuery = useMemo(
      () => buildCubeQuery(state.metrics, state.breakdowns, state.filters, order),
      [state.metrics, state.breakdowns, state.filters, order]
    )

    // Serialize query for comparison (prevents object reference issues)
    const currentQueryString = useMemo(() => JSON.stringify(currentQuery), [currentQuery])

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

    // Debounce query changes - use string comparison to avoid infinite loops
    useEffect(() => {
      // Skip if query hasn't actually changed
      if (currentQueryString === lastQueryStringRef.current) {
        return
      }

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

      // Only debounce if we have a valid query
      if (isValidQuery) {
        debounceTimerRef.current = setTimeout(() => {
          lastQueryStringRef.current = currentQueryString
          setDebouncedQuery(currentQuery)
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
    }, [currentQueryString, currentQuery, isValidQuery])

    // Transform debounced query to server format (converts filter groups)
    const serverQuery = useMemo(() => {
      if (!debouncedQuery) return null
      return cleanQueryForServer(debouncedQuery)
    }, [debouncedQuery])

    // Execute query using useCubeQuery hook
    // Reset resultSet when query changes to avoid showing stale data after clearing
    const { resultSet, isLoading, error } = useCubeQuery(serverQuery, {
      skip: !serverQuery,
      resetResultSetOnChange: true
    })

    // Derive execution status - show success with initialData even before first query
    const executionStatus: ExecutionStatus = useMemo(() => {
      // If we have initialData and haven't started querying yet, show success
      if (initialData && initialData.length > 0 && !debouncedQuery && !resultSet) {
        return 'success'
      }
      if (!debouncedQuery) return 'idle'
      if (isLoading && !resultSet) return 'loading'
      if (isLoading && resultSet) return 'refreshing'
      if (error) return 'error'
      if (resultSet) return 'success'
      return 'idle'
    }, [debouncedQuery, isLoading, error, resultSet, initialData])

    // Get execution results - use initialData if no resultSet yet
    const executionResults = useMemo(() => {
      if (resultSet) {
        try {
          return resultSet.rawData()
        } catch {
          return null
        }
      }
      // Use initialData if provided and no resultSet yet
      if (initialData && initialData.length > 0) {
        return initialData
      }
      return null
    }, [resultSet, initialData])

    // Note: We pass executionStatus, executionResults, error directly to PortletResultsPanel
    // instead of storing in state, to avoid render loops

    // Compute chart availability based on current metrics and breakdowns
    const chartAvailability = useMemo(
      () => getAllChartAvailability(state.metrics, state.breakdowns),
      [state.metrics, state.breakdowns]
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

      if (state.metrics.length === 0 && state.breakdowns.length === 0) {
        return // Nothing to configure
      }

      // Create a key from metrics/breakdowns fields to detect actual changes
      const currentKey = JSON.stringify({
        metrics: state.metrics.map(m => m.field),
        breakdowns: state.breakdowns.map(b => ({ field: b.field, isTime: b.isTimeDimension }))
      })

      // Skip if metrics/breakdowns haven't actually changed
      if (currentKey === prevMetricsBreakdownsRef.current) {
        return
      }
      prevMetricsBreakdownsRef.current = currentKey

      // Check if we should auto-switch chart type
      const newChartType = shouldAutoSwitchChartType(
        state.metrics,
        state.breakdowns,
        chartType,
        userManuallySelectedChart
      )

      if (newChartType) {
        // Chart type is changing - get smart defaults for the new chart type
        const { chartConfig: newChartConfig } = getSmartChartDefaults(
          state.metrics,
          state.breakdowns,
          newChartType
        )
        setChartType(newChartType)
        setChartConfig(newChartConfig)
        // Reset user selection flag since we auto-switched
        setUserManuallySelectedChart(false)
      } else if (state.metrics.length > 0 || state.breakdowns.length > 0) {
        // Only apply smart defaults if the chart config is COMPLETELY empty
        // Once user has configured ANY axis, don't auto-fill (respects user removals)
        // Use ref to get current value without adding to dependencies
        if (isChartConfigEmpty(chartConfigRef.current)) {
          const { chartConfig: smartDefaults } = getSmartChartDefaults(
            state.metrics,
            state.breakdowns,
            chartType
          )
          setChartConfig(smartDefaults)
        }
      }
    }, [debouncedQuery, state.metrics, state.breakdowns, chartType, userManuallySelectedChart, isChartConfigEmpty])

    // Save state to localStorage whenever it changes (if not disabled)
    // Deferred to avoid blocking renders
    useEffect(() => {
      if (disableLocalStorage) return

      // Defer to next tick to avoid blocking renders
      const timeoutId = setTimeout(() => {
        try {
          const storageState: AnalysisBuilderStorageState = {
            metrics: state.metrics,
            breakdowns: state.breakdowns,
            filters: state.filters,
            order,
            chartType,
            chartConfig,
            displayConfig,
            activeView
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(storageState))
        } catch {
          // Failed to save to localStorage
        }
      }, 0)

      return () => clearTimeout(timeoutId)
    }, [
      state.metrics,
      state.breakdowns,
      state.filters,
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
      [fieldModalMode]
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
        setState((prev) => ({
          ...prev,
          breakdowns: prev.breakdowns.map((b) =>
            b.id === id ? { ...b, granularity } : b
          ),
          resultsStale: true
        }))
      },
      []
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
      []
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
      []
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
    }, [])

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
    }, [])

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
    // Clear Query
    // ========================================================================

    const handleClearQuery = useCallback(() => {
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
    }, [])

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
      if (!isValidQuery || !serverQuery) return

      const shareableState = {
        query: serverQuery,
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
    }, [isValidQuery, serverQuery, chartType, chartConfig, displayConfig, activeView])

    // ========================================================================
    // Expose API via ref
    // ========================================================================

    useImperativeHandle(
      ref,
      () => ({
        getCurrentQuery: () => currentQuery,
        getChartConfig: () => ({ chartType, chartConfig, displayConfig }),
        executeQuery: () => {
          // TODO: Implement manual execute
        },
        clearQuery: handleClearQuery
      }),
      [currentQuery, chartType, chartConfig, displayConfig, handleClearQuery]
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
              query={currentQuery}
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
