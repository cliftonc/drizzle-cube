/**
 * QueryBuilder Component
 * 
 * Main component that orchestrates the query building experience.
 * Manages state and coordinates between the meta explorer, query panel, and results panel.
 */

import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle, useMemo } from 'react'
import { getIcon } from '../../icons'
import { useCubeContext } from '../../providers/CubeProvider'
import CubeMetaExplorer from './CubeMetaExplorer'
import QueryPanel from './QueryPanel'
import ResultsPanel from './ResultsPanel'
import SetupPanel from './SetupPanel'
import AIAssistantModal from '../AIAssistant/AIAssistantModal'
import type {
  QueryBuilderProps,
  QueryBuilderRef,
  QueryBuilderState,
  MetaResponse,
  ValidationResult,
  ApiConfig,
  ShareButtonState
} from './types'
import type { Filter, ChartType, ChartAxisConfig, ChartDisplayConfig } from '../../types'
import { createEmptyQuery, hasQueryContent, cleanQuery, cleanQueryForServer, cleanupFilters, transformQueryForUI } from './utils'
import { parseShareHash, clearShareHash, decodeAndDecompress, compressWithFallback, getMaxHashLength, type ShareableState } from './shareUtils'
import ShareWarningModal from './ShareWarningModal'

const STORAGE_KEY = 'drizzle-cube-query-builder-state'
const API_CONFIG_STORAGE_KEY = 'drizzle-cube-api-config'

const QueryBuilder = forwardRef<QueryBuilderRef, QueryBuilderProps>(({
  className = '',
  initialQuery,
  disableLocalStorage = false,
  hideSettings = false,
  enableSharing = false,
  onShare
}, ref) => {
  // Get cube client, update function, and features from context
  const { cubeApi, updateApiConfig, features, meta, metaLoading, metaError, refetchMeta } = useCubeContext()
  
  // Load initial API configuration from localStorage
  const getInitialApiConfig = (): ApiConfig => {
    if (!disableLocalStorage) {
      try {
        const saved = localStorage.getItem(API_CONFIG_STORAGE_KEY)
        if (saved) {
          return JSON.parse(saved)
        }
      } catch (error) {
        // Failed to load API config from localStorage
      }
    }
    return {
      baseApiUrl: '/cubejs-api/v1',
      apiToken: ''
    }
  }

  // Load initial state from localStorage if available, or use provided initialQuery
  const getInitialState = (): QueryBuilderState => {
    // If initialQuery is provided, use it instead of localStorage
    if (initialQuery) {
      return {
        query: transformQueryForUI(initialQuery),
        validationStatus: 'idle',
        validationError: null,
        validationSql: null,
        executionStatus: 'idle',
        executionResults: null,
        executionError: null,
        totalRowCount: null,
        totalRowCountStatus: 'idle',
        resultsStale: false
      }
    }

    // Only check localStorage if not disabled
    if (!disableLocalStorage) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsedState = JSON.parse(saved)
          return {
            query: transformQueryForUI(parsedState.query) || createEmptyQuery(),
            validationStatus: 'idle', // Reset validation status
            validationError: null,
            validationSql: null,
            executionStatus: 'idle', // Reset execution status
            executionResults: null,
            executionError: null,
            totalRowCount: null,
            totalRowCountStatus: 'idle',
            resultsStale: false
          }
        }
      } catch (error) {
        // Failed to load query from localStorage
      }
    }
    
    return {
      query: createEmptyQuery(),
      validationStatus: 'idle',
      validationError: null,
      validationSql: null,
      executionStatus: 'idle',
      executionResults: null,
      executionError: null,
      totalRowCount: null,
      totalRowCountStatus: 'idle',
      resultsStale: false
    }
  }

  const [state, setState] = useState<QueryBuilderState>(getInitialState())
  
  // Separate state for display limit (doesn't affect the actual query object)
  const [displayLimit, setDisplayLimit] = useState<number>(10)

  // Load initial chart configuration from localStorage
  const getInitialChartState = () => {
    if (!disableLocalStorage) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          return {
            chartType: parsed.chartType || 'table',
            chartConfig: parsed.chartConfig || {},
            displayConfig: parsed.displayConfig || { showLegend: true, showGrid: true, showTooltip: true },
            activeView: parsed.activeView || 'table'
          }
        }
      } catch (error) {
        // Failed to load chart config from localStorage
      }
    }
    return {
      chartType: 'table' as ChartType,
      chartConfig: {} as ChartAxisConfig,
      displayConfig: { showLegend: true, showGrid: true, showTooltip: true } as ChartDisplayConfig,
      activeView: 'table' as 'table' | 'chart'
    }
  }

  // Chart visualization state
  const initialChartState = getInitialChartState()
  const [chartType, setChartType] = useState<ChartType>(initialChartState.chartType)
  const [chartConfig, setChartConfig] = useState<ChartAxisConfig>(initialChartState.chartConfig)
  const [displayConfig, setDisplayConfig] = useState<ChartDisplayConfig>(initialChartState.displayConfig)
  const [activeView, setActiveView] = useState<'table' | 'chart'>(initialChartState.activeView)

  // API configuration state
  const [apiConfig, setApiConfig] = useState<ApiConfig>(getInitialApiConfig())
  const [showSetupPanel, setShowSetupPanel] = useState(false)
  const [showSchemaMobile, setShowSchemaMobile] = useState(false)
  const [schemaViewType, setSchemaViewType] = useState<'tree' | 'diagram'>('tree')
  
  // AI Assistant modal state
  const [showAIAssistant, setShowAIAssistant] = useState(false)

  // Share functionality state
  const [shareButtonState, setShareButtonState] = useState<ShareButtonState>('idle')
  const [showShareWarning, setShowShareWarning] = useState(false)
  const [shareWarningData, setShareWarningData] = useState({ size: 0, maxSize: 0 })
  const [isViewingShared, setIsViewingShared] = useState(false)

  // Update query when initialQuery prop changes (for modal usage)
  useEffect(() => {
    if (initialQuery && JSON.stringify(initialQuery) !== JSON.stringify(state.query)) {
      setState(prev => ({
        ...prev,
        query: transformQueryForUI(initialQuery),
        validationStatus: 'idle',
        validationError: null,
        validationSql: null,
        executionStatus: 'idle',
        executionResults: null,
        executionError: null,
        totalRowCount: null,
        totalRowCountStatus: 'idle',
        resultsStale: false
      }))
    }
  }, [initialQuery])

  // Track the last validated query to avoid resetting validation on unrelated updates
  const lastValidatedQueryRef = useRef<string>('')

  // Note: API configuration is kept for backward compatibility but not used 
  // since we now use the CubeClient from context

  // Store the full validation result for access via ref
  const [fullValidationResult, setFullValidationResult] = useState<ValidationResult | null>(null)

  // Expose query and validation state to parent via ref (only called when Apply is clicked)
  useImperativeHandle(ref, () => ({
    getCurrentQuery: () => cleanQueryForServer(state.query),
    getValidationState: () => ({
      status: state.validationStatus,
      result: state.validationStatus === 'valid' ? {
        valid: true,
        sql: state.validationSql || undefined
      } : state.validationStatus === 'invalid' ? {
        valid: false,
        error: state.validationError || undefined
      } : undefined
    }),
    getValidationResult: () => fullValidationResult
  }), [state.query, state.validationStatus, state.validationError, state.validationSql, fullValidationResult])

  // Save query and chart config to localStorage whenever they change (if not disabled)
  useEffect(() => {
    if (!disableLocalStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          query: state.query,
          chartType,
          chartConfig,
          displayConfig,
          activeView
        }))
      } catch (error) {
        // Failed to save state to localStorage
      }
    }
  }, [state.query, chartType, chartConfig, displayConfig, activeView, disableLocalStorage])

  // Save API config to localStorage whenever it changes (if not disabled)
  useEffect(() => {
    if (!disableLocalStorage) {
      try {
        localStorage.setItem(API_CONFIG_STORAGE_KEY, JSON.stringify(apiConfig))
      } catch (error) {
        // Failed to save API config to localStorage
      }
    }
  }, [apiConfig, disableLocalStorage])

  // Track if we need to auto-run after loading shared analysis
  const pendingSharedExecution = useRef(false)

  // Parse URL hash for shared analysis on mount (when sharing is enabled)
  useEffect(() => {
    if (!enableSharing) return

    const encoded = parseShareHash()
    if (!encoded) return

    const decoded = decodeAndDecompress(encoded)
    if (decoded) {
      // Apply query (required)
      setState(prev => ({
        ...prev,
        query: transformQueryForUI(decoded.query),
        validationStatus: 'idle',
        validationError: null,
        validationSql: null,
        executionStatus: 'idle',
        executionResults: null,
        executionError: null,
        totalRowCount: null,
        totalRowCountStatus: 'idle',
        resultsStale: false
      }))

      // Apply chart config if present, otherwise use defaults
      if (decoded.chartType) setChartType(decoded.chartType)
      if (decoded.chartConfig) setChartConfig(decoded.chartConfig)
      if (decoded.displayConfig) setDisplayConfig(decoded.displayConfig)
      if (decoded.activeView) setActiveView(decoded.activeView)

      setIsViewingShared(true)
      pendingSharedExecution.current = true
    }

    // Clear hash from URL
    clearShareHash()
  }, [enableSharing])

  // Auto re-run query when displayLimit or activeView changes
  useEffect(() => {
    if (state.executionStatus === 'success' && hasQueryContent(state.query)) {
      handleExecuteQuery()
    }
  }, [displayLimit, activeView]) // Re-run on limit or view change


  const updateQuery = useCallback((updater: (prev: typeof state.query) => typeof state.query) => {
    setState(prev => {
      const newQuery = updater(prev.query)
      
      // Clean up filters to remove any that reference fields no longer in the query
      const cleanedQuery = {
        ...newQuery,
        filters: newQuery.filters ? cleanupFilters(newQuery.filters, newQuery) : undefined
      }
      
      const queryChanged = JSON.stringify(cleanedQuery) !== JSON.stringify(prev.query)
      const shouldMarkStale = queryChanged && !!prev.executionResults
      
      return {
        ...prev,
        query: cleanedQuery,
        // Only reset validation if query actually changed
        validationStatus: queryChanged ? 'idle' : prev.validationStatus,
        validationError: queryChanged ? null : prev.validationError,
        validationSql: queryChanged ? null : prev.validationSql,
        executionStatus: queryChanged
          ? (prev.executionResults ? 'success' : 'idle')
          : prev.executionStatus,
        executionError: queryChanged ? null : prev.executionError,
        resultsStale: shouldMarkStale ? true : prev.resultsStale
      }
    })
  }, [])

  const handleFieldSelect = useCallback((fieldName: string, fieldType: 'measures' | 'dimensions' | 'timeDimensions') => {
    updateQuery(prev => {
      const newQuery = { ...prev }
      
      switch (fieldType) {
        case 'measures':
          // Only add if not already present
          if (!(prev.measures || []).includes(fieldName)) {
            newQuery.measures = [...(prev.measures || []), fieldName]
          }
          break
        case 'dimensions':
          // Only add if not already present
          if (!(prev.dimensions || []).includes(fieldName)) {
            newQuery.dimensions = [...(prev.dimensions || []), fieldName]
          }
          break
        case 'timeDimensions':
          // Only add if not already present
          if (!(prev.timeDimensions || []).some(td => td.dimension === fieldName)) {
            newQuery.timeDimensions = [...(prev.timeDimensions || []), { 
              dimension: fieldName, 
              granularity: 'month' 
            }]
          }
          break
      }
      
      return cleanQuery(newQuery)
    })
  }, [updateQuery])

  const handleFieldDeselect = useCallback((fieldName: string, fieldType: 'measures' | 'dimensions' | 'timeDimensions') => {
    updateQuery(prev => {
      const newQuery = { ...prev }
      
      switch (fieldType) {
        case 'measures':
          newQuery.measures = (prev.measures || []).filter(m => m !== fieldName)
          break
        case 'dimensions':
          newQuery.dimensions = (prev.dimensions || []).filter(d => d !== fieldName)
          break
        case 'timeDimensions':
          newQuery.timeDimensions = (prev.timeDimensions || []).filter(td => td.dimension !== fieldName)
          break
      }
      
      // Clean up order if field was sorted
      if (newQuery.order && newQuery.order[fieldName]) {
        const newOrder = { ...newQuery.order }
        delete newOrder[fieldName]
        newQuery.order = Object.keys(newOrder).length > 0 ? newOrder : undefined
      }
      
      return cleanQuery(newQuery)
    })
  }, [updateQuery])

  const handleTimeDimensionGranularityChange = useCallback((dimensionName: string, granularity: string) => {
    updateQuery(prev => {
      const newQuery = {
        ...prev,
        timeDimensions: (prev.timeDimensions || []).map(td => 
          td.dimension === dimensionName 
            ? { ...td, granularity }
            : td
        )
      }
      return cleanQuery(newQuery)
    })
  }, [updateQuery])

  const handleFiltersChange = useCallback((filters: Filter[]) => {
    updateQuery(prev => {
      const newQuery = {
        ...prev,
        filters
      }
      return cleanQuery(newQuery)
    })
  }, [updateQuery])

  const handleDateRangeChange = useCallback((timeDimension: string, dateRange: string | string[]) => {
    updateQuery(prev => {
      const newQuery = {
        ...prev,
        timeDimensions: (prev.timeDimensions || []).map(td => 
          td.dimension === timeDimension 
            ? { ...td, dateRange }
            : td
        )
      }
      return cleanQuery(newQuery)
    })
  }, [updateQuery])

  const handleDateRangeRemove = useCallback((timeDimension: string) => {
    updateQuery(prev => {
      const newQuery = {
        ...prev,
        timeDimensions: (prev.timeDimensions || []).map(td => 
          td.dimension === timeDimension 
            ? { ...td, dateRange: undefined }
            : td
        )
      }
      return cleanQuery(newQuery)
    })
  }, [updateQuery])

  const handleOrderChange = useCallback((fieldName: string, direction: 'asc' | 'desc' | null) => {
    updateQuery(prev => {
      const newOrder = { ...(prev.order || {}) }
      
      if (direction === null) {
        delete newOrder[fieldName]
      } else {
        newOrder[fieldName] = direction
      }
      
      const newQuery = {
        ...prev,
        order: Object.keys(newOrder).length > 0 ? newOrder : undefined
      }
      
      return cleanQuery(newQuery)
    })
  }, [updateQuery])

  const validateQuery = useCallback(async (silent: boolean) => {
    if (!hasQueryContent(state.query)) return null

    const queryToValidate = cleanQueryForServer(state.query)
    const queryStr = JSON.stringify(queryToValidate)

    if (!silent) {
      setState(prev => ({
        ...prev,
        validationStatus: 'validating',
        validationError: null,
        validationSql: null
      }))
    }

    try {
      const result: ValidationResult = await cubeApi.dryRun(queryToValidate)
      const isValid = !result.error && result.queryType && (result.valid !== false)

      if (isValid) {
        lastValidatedQueryRef.current = queryStr
      }

      if (silent) {
        if (!isValid) {
          setState(prev => ({
            ...prev,
            validationStatus: 'invalid',
            validationError: result.error || 'Validation failed',
            validationSql: result.sql || null
          }))
        } else {
          setState(prev => ({
            ...prev,
            validationError: null,
            validationSql: result.sql || null
          }))
        }
        setFullValidationResult(result)
      } else {
        if (!isValid) {
          setState(prev => ({
            ...prev,
            validationStatus: 'invalid',
            validationError: result.error || 'Validation failed',
            validationSql: result.sql || null
          }))
        } else {
          setState(prev => ({
            ...prev,
            validationStatus: 'valid',
            validationError: null,
            validationSql: result.sql || null
          }))
        }
        setFullValidationResult(result)
      }

      return isValid ? result : null
    } catch (error) {
      setFullValidationResult(null)
      if (!silent) {
        setState(prev => ({
          ...prev,
          validationStatus: 'invalid',
          validationError: error instanceof Error ? error.message : 'Network error during validation',
          validationSql: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          validationStatus: 'invalid',
          validationError: error instanceof Error ? error.message : 'Network error during validation',
          validationSql: null
        }))
      }
      return null
    }
  }, [state.query, cubeApi])

  // Auto re-validate query when query changes (silent, no UI updates)
  useEffect(() => {
    if (!hasQueryContent(state.query)) {
      return
    }

    const debounceTimer = setTimeout(() => {
      validateQuery(true)
    }, 200) // 200ms debounce - fast but prevents excessive API calls

    return () => clearTimeout(debounceTimer)
  }, [state.query, validateQuery])

  const handleExecuteQuery = useCallback(async () => {
    if (!hasQueryContent(state.query)) return

    const cleanedQuery = cleanQueryForServer(state.query)
    const queryStr = JSON.stringify(cleanedQuery)

    if (lastValidatedQueryRef.current !== queryStr) {
      const result = await validateQuery(false)
      if (!result) {
        return
      }
    }

    setState(prev => ({
      ...prev,
      executionStatus: prev.executionResults ? 'refreshing' : 'loading',
      executionError: null,
      totalRowCountStatus: 'loading'
    }))

    try {
      // Run both queries in parallel: one with limit and one without for total count
      // Chart view: no limit (show all data for visualization)
      // Table view: apply displayLimit for pagination
      const effectiveLimit = activeView === 'chart' ? undefined : displayLimit

      const [limitedResultSet, totalResultSet] = await Promise.all([
        cubeApi.load(effectiveLimit ? { ...cleanedQuery, limit: effectiveLimit } : cleanedQuery),
        cubeApi.load(cleanedQuery) // No limit for total count
      ])

      const limitedData = limitedResultSet.tablePivot()
      const totalData = totalResultSet.tablePivot()
      const totalCount = totalData.length

      setState(prev => ({
        ...prev,
        executionStatus: 'success',
        executionResults: limitedData,
        executionError: null,
        totalRowCount: totalCount,
        totalRowCountStatus: 'success',
        resultsStale: false
      }))
      lastExecutedQueryRef.current = queryStr
      if (lastAutoRunQueryRef.current === queryStr) {
        lastAutoRunQueryRef.current = ''
      }
    } catch (error) {
      // Query execution error
      setState(prev => ({
        ...prev,
        executionStatus: 'error',
        executionError: error instanceof Error ? error.message : 'Query execution failed',
        totalRowCountStatus: prev.totalRowCount !== null ? 'success' : 'error'
      }))
    }
  }, [state.query, cubeApi, displayLimit, activeView, validateQuery])

  useEffect(() => {
    if (!state.executionResults) return
    if (!hasQueryContent(state.query)) return

    const cleanedQuery = cleanQueryForServer(state.query)
    const queryStr = JSON.stringify(cleanedQuery)

    if (queryStr === lastExecutedQueryRef.current || queryStr === lastAutoRunQueryRef.current) {
      return
    }

    if (autoRunTimerRef.current) {
      clearTimeout(autoRunTimerRef.current)
    }

    lastAutoRunQueryRef.current = queryStr
    autoRunTimerRef.current = setTimeout(() => {
      handleExecuteQuery()
    }, 250)

    return () => {
      if (autoRunTimerRef.current) {
        clearTimeout(autoRunTimerRef.current)
      }
    }
  }, [state.query, state.executionResults, handleExecuteQuery])

  // Auto-execute query after loading from shared link once validation succeeds
  useEffect(() => {
    if (pendingSharedExecution.current && state.executionStatus === 'idle') {
      pendingSharedExecution.current = false
      handleExecuteQuery()
    }
  }, [state.executionStatus, handleExecuteQuery])

  const handleClearQuery = useCallback(() => {
    setState(prev => ({
      ...prev,
      query: createEmptyQuery(),
      validationStatus: 'idle',
      validationError: null,
      validationSql: null,
      executionStatus: 'idle',
      executionResults: null,
      executionError: null,
      totalRowCount: null,
      totalRowCountStatus: 'idle',
      resultsStale: false
    }))
  }, [])

  const shareStateRef = useRef<ShareableState>({
    query: cleanQueryForServer(state.query),
    chartType,
    chartConfig,
    displayConfig,
    activeView
  })
  const onShareRef = useRef<typeof onShare>(onShare)

  useEffect(() => {
    shareStateRef.current = {
      query: cleanQueryForServer(state.query),
      chartType,
      chartConfig,
      displayConfig,
      activeView
    }
  }, [state.query, chartType, chartConfig, displayConfig, activeView])

  useEffect(() => {
    onShareRef.current = onShare
  }, [onShare])

  const handleShare = useCallback(async () => {
    if (!enableSharing) return

    const shareableState = shareStateRef.current

    // Try full state first, fall back to query-only if too large
    const { encoded, queryOnly } = compressWithFallback(shareableState)

    // If even query-only is too large, show warning modal
    if (!encoded) {
      const queryOnlyState: ShareableState = { query: shareableState.query }
      const queryOnlySize = JSON.stringify(queryOnlyState).length
      setShareWarningData({ size: queryOnlySize, maxSize: getMaxHashLength() })
      setShowShareWarning(true)
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

    // Call onShare callback if provided
    onShareRef.current?.(url)

    // Reset button state after 2 seconds
    setTimeout(() => {
      setShareButtonState('idle')
    }, 2000)
  }, [enableSharing])

  const handleApiConfigChange = useCallback((newConfig: ApiConfig) => {
    setApiConfig(newConfig)
    
    // Update the CubeProvider's client with new configuration
    updateApiConfig(
      { apiUrl: newConfig.baseApiUrl },
      newConfig.apiToken || undefined
    )
    
    // Reset query-related state when API config changes
    setState(prev => ({
      ...prev,
      validationStatus: 'idle',
      validationError: null,
      validationSql: null,
      executionStatus: 'idle',
      executionResults: null,
      executionError: null,
      totalRowCount: null,
      totalRowCountStatus: 'idle',
      resultsStale: false
    }))
  }, [updateApiConfig])

  const handleResetApiConfig = useCallback(() => {
    const defaultConfig = {
      baseApiUrl: '/cubejs-api/v1',
      apiToken: ''
    }
    setApiConfig(defaultConfig)
    
    // Update the CubeProvider's client with reset configuration
    updateApiConfig(
      { apiUrl: defaultConfig.baseApiUrl },
      undefined
    )
  }, [updateApiConfig])

  const handleRetrySchema = useCallback(() => {
    refetchMeta()
  }, [refetchMeta])

  const selectedFields = useMemo(() => ({
    measures: state.query.measures || [],
    dimensions: state.query.dimensions || [],
    timeDimensions: (state.query.timeDimensions || []).map(td => td.dimension)
  }), [state.query.measures, state.query.dimensions, state.query.timeDimensions])

  const schemaStatus = metaLoading ? 'loading' : metaError ? 'error' : meta ? 'success' : 'idle'
  const schema = meta ? (meta as unknown as MetaResponse) : null
  const schemaError = metaError

  const availableFields = useMemo(() => {
    const sourceQuery = fullValidationResult?.pivotQuery?.query ?? state.query
    return {
      dimensions: sourceQuery.dimensions || [],
      timeDimensions: sourceQuery.timeDimensions?.map((td: { dimension: string }) => td.dimension) || [],
      measures: sourceQuery.measures || []
    }
  }, [fullValidationResult, state.query])

  const handleToggleSetupPanel = useCallback(() => {
    setShowSetupPanel(prev => !prev)
  }, [])

  const handleOpenAIAssistant = useCallback(() => {
    setShowAIAssistant(true)
  }, [])

  const handleViewTypeChange = useCallback((viewType: 'tree' | 'diagram') => {
    setSchemaViewType(viewType)
  }, [])

  const lastExecutedQueryRef = useRef<string>('')
  const lastAutoRunQueryRef = useRef<string>('')
  const autoRunTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const MenuIcon = getIcon('menu')
  const CloseIcon = getIcon('close')

  return (
    <div className={`h-full flex flex-col ${className}`} style={{ minHeight: '100%' }}>
      {/* Setup Panel - only show when not in modal and not hidden */}
        {!hideSettings && (
          <div className="shrink-0 p-4 pb-0">
            <SetupPanel
              isOpen={showSetupPanel}
              onToggle={handleToggleSetupPanel}
              config={apiConfig}
              onConfigChange={handleApiConfigChange}
              onReset={handleResetApiConfig}
            />
          </div>
        )}

        {/* Mobile Schema Toggle Button */}
        <div className="md:hidden shrink-0 px-4 pb-2">
          <button
            onClick={() => setShowSchemaMobile(!showSchemaMobile)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-dc-text-secondary bg-dc-surface-secondary hover:bg-dc-surface-hover rounded-md transition-colors"
          >
            {showSchemaMobile ? (
              <><CloseIcon className="w-4 h-4" /> Hide Schema</>
            ) : (
              <><MenuIcon className="w-4 h-4" /> Show Schema</>
            )}
          </button>
        </div>

        {/* Mobile Schema Panel Overlay */}
        {showSchemaMobile && (
          <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50 flex">
            <div className="w-full max-w-md sm:max-w-lg bg-dc-surface h-full overflow-y-auto">
              <div className="p-4 border-b border-dc-border">
                <button
                  onClick={() => setShowSchemaMobile(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-dc-text-secondary bg-dc-surface-secondary hover:bg-dc-surface-hover rounded-md transition-colors"
                >
                  <CloseIcon className="w-4 h-4" /> Close Schema
                </button>
              </div>
              <div className="p-4">
                <CubeMetaExplorer
                  schema={schema}
                  schemaStatus={schemaStatus}
                  schemaError={schemaError}
                  selectedFields={selectedFields}
                  onFieldSelect={(field, type) => {
                    handleFieldSelect(field, type)
                    setShowSchemaMobile(false)
                  }}
                  onFieldDeselect={handleFieldDeselect}
                  onRetrySchema={handleRetrySchema}
                  onOpenSettings={!hideSettings ? () => setShowSetupPanel(true) : undefined}
                  onExpandSchema={(expanded) => {
                    if (expanded) setShowSchemaMobile(false)
                  }}
                />
              </div>
            </div>
            <div className="flex-1" onClick={() => setShowSchemaMobile(false)}></div>
          </div>
        )}

        <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 min-h-0" style={{ paddingTop: hideSettings ? '1rem' : '0rem' }}>
        {/* Schema Explorer with dynamic width based on view type */}
        <div className={`hidden md:flex shrink-0 flex-col min-w-0 ${schemaViewType === 'diagram' ? 'w-full' : 'md:w-1/3 max-w-[500px]'}`}>
          <CubeMetaExplorer
            schema={schema}
            schemaStatus={schemaStatus}
            schemaError={schemaError}
            selectedFields={selectedFields}
            onFieldSelect={handleFieldSelect}
            onFieldDeselect={handleFieldDeselect}
            onRetrySchema={handleRetrySchema}
            onOpenSettings={!hideSettings ? () => setShowSetupPanel(true) : undefined}
            onExpandSchema={undefined} // No expand/collapse needed
            onViewTypeChange={handleViewTypeChange}
            isExpanded={false} // Always false, handled by tab switching
          />
        </div>

        {/* Main Content - Query Builder + Results (hide when diagram is selected) */}
        {schemaViewType === 'tree' && (
          <div className="flex-1 flex flex-col gap-4 min-w-0 min-h-0">
          {/* Query Builder */}
          <div className="shrink-0">
            <QueryPanel
              query={state.query}
              schema={schema}
              validationStatus={state.validationStatus}
              validationError={state.validationError}
              validationSql={state.validationSql}
              validationAnalysis={fullValidationResult?.analysis}
              onExecute={handleExecuteQuery}
              onRemoveField={handleFieldDeselect}
              onTimeDimensionGranularityChange={handleTimeDimensionGranularityChange}
              onFiltersChange={handleFiltersChange}
              onDateRangeChange={handleDateRangeChange}
              onDateRangeRemove={handleDateRangeRemove}
              onOrderChange={handleOrderChange}
              onClearQuery={handleClearQuery}
              showSettings={!hideSettings}
              onSettingsClick={handleToggleSetupPanel}
              onAIAssistantClick={features?.enableAI !== false ? handleOpenAIAssistant : undefined}
              onShareClick={enableSharing ? handleShare : undefined}
              canShare={enableSharing && hasQueryContent(state.query)}
              shareButtonState={shareButtonState}
              isViewingShared={isViewingShared}
            />
          </div>

          {/* Results Panel */}
          <div className="flex-1 min-h-0">
            <ResultsPanel
              executionStatus={state.executionStatus}
              executionResults={state.executionResults}
              executionError={state.executionError}
              resultsStale={state.resultsStale}
              query={state.query}
              displayLimit={displayLimit}
              onDisplayLimitChange={setDisplayLimit}
              totalRowCount={state.totalRowCount}
              totalRowCountStatus={state.totalRowCountStatus}
              // Chart visualization props
              chartType={chartType}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              availableFields={availableFields}
              onChartTypeChange={setChartType}
              onChartConfigChange={setChartConfig}
              onDisplayConfigChange={setDisplayConfig}
              // View state props
              activeView={activeView}
              onActiveViewChange={setActiveView}
            />
          </div>
          </div>
        )}
        </div>
      
        {/* AI Assistant Modal - only render if AI is enabled */}
        {features?.enableAI !== false && (
          <AIAssistantModal
            isOpen={showAIAssistant}
            onClose={() => setShowAIAssistant(false)}
            schema={schema}
            aiEndpoint={features?.aiEndpoint}
            onQueryLoad={(query) => {
            // Update the query in the builder
            setState(prev => ({
              ...prev,
              query: transformQueryForUI(query),
              validationStatus: 'idle',
              validationError: null,
              validationSql: null,
              executionStatus: 'idle',
              executionResults: null,
              executionError: null,
              totalRowCount: null,
              totalRowCountStatus: 'idle',
              resultsStale: false
            }))
            
            // Auto-validate the loaded query after a short delay
            setTimeout(async () => {
              // We need to access handleValidateQuery through a ref or recreate the validation logic
              // For now, let's trigger validation by updating the state to force a validation
              const queryToValidate = cleanQueryForServer(transformQueryForUI(query))
              
              try {
                const result = await cubeApi.dryRun(queryToValidate)
                const isValid = !result.error && result.queryType && (result.valid !== false)
                
                setState(prev => ({
                  ...prev,
                  validationStatus: isValid ? 'valid' : 'invalid',
                  validationError: result.error || null,
                  validationSql: result.sql || null
                }))
                
                setFullValidationResult(result)
              } catch (error) {
                // Auto-validation error
                setState(prev => ({
                  ...prev,
                  validationStatus: 'invalid',
                  validationError: error instanceof Error ? error.message : 'Validation failed',
                  validationSql: null
                }))
                setFullValidationResult(null)
              }
            }, 200)
          }}
          />
        )}

        {/* Share Warning Modal - shown when query is too large to share */}
        <ShareWarningModal
          isOpen={showShareWarning}
          onClose={() => setShowShareWarning(false)}
          size={shareWarningData.size}
          maxSize={shareWarningData.maxSize}
        />

      </div>
  )
})

QueryBuilder.displayName = 'QueryBuilder'

export default QueryBuilder
