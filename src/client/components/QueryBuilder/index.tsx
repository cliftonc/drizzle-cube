/**
 * QueryBuilder Component
 * 
 * Main component that orchestrates the query building experience.
 * Manages state and coordinates between the meta explorer, query panel, and results panel.
 */

import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle, useMemo } from 'react'
import { createCubeClient } from '../../client/CubeClient'
import { CubeProvider } from '../../providers/CubeProvider'
import CubeMetaExplorer from './CubeMetaExplorer'
import QueryPanel from './QueryPanel'
import ResultsPanel from './ResultsPanel'
import SetupPanel from './SetupPanel'
import type { 
  QueryBuilderProps, 
  QueryBuilderRef,
  QueryBuilderState, 
  MetaResponse,
  ValidationResult,
  ApiConfig
} from './types'
import type { Filter } from '../../types'
import { createEmptyQuery, hasQueryContent, cleanQuery, cleanQueryForServer, cleanupFilters } from './utils'

const STORAGE_KEY = 'drizzle-cube-query-builder-state'
const API_CONFIG_STORAGE_KEY = 'drizzle-cube-api-config'

const QueryBuilder = forwardRef<QueryBuilderRef, QueryBuilderProps>(({
  baseUrl,
  className = '',
  initialQuery,
  disableLocalStorage = false,
  hideSettings = false
}, ref) => {
  // Load initial API configuration from localStorage
  const getInitialApiConfig = (): ApiConfig => {
    if (!disableLocalStorage) {
      try {
        const saved = localStorage.getItem(API_CONFIG_STORAGE_KEY)
        if (saved) {
          return JSON.parse(saved)
        }
      } catch (error) {
        console.warn('Failed to load API config from localStorage:', error)
      }
    }
    return {
      baseApiUrl: baseUrl,
      apiToken: ''
    }
  }

  // Load initial state from localStorage if available, or use provided initialQuery
  const getInitialState = (): QueryBuilderState => {
    // If initialQuery is provided, use it instead of localStorage
    if (initialQuery) {
      return {
        query: initialQuery,
        schema: null,
        schemaStatus: 'idle',
        schemaError: null,
        validationStatus: 'idle',
        validationError: null,
        validationSql: null,
        executionStatus: 'idle',
        executionResults: null,
        executionError: null,
        totalRowCount: null,
        totalRowCountStatus: 'idle'
      }
    }

    // Only check localStorage if not disabled
    if (!disableLocalStorage) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsedState = JSON.parse(saved)
          return {
            query: parsedState.query || createEmptyQuery(),
            schema: null, // Schema is always loaded fresh
            schemaStatus: 'idle', // Reset schema status
            schemaError: null,
            validationStatus: 'idle', // Reset validation status
            validationError: null,
            validationSql: null,
            executionStatus: 'idle', // Reset execution status
            executionResults: null,
            executionError: null,
            totalRowCount: null,
            totalRowCountStatus: 'idle'
          }
        }
      } catch (error) {
        console.warn('Failed to load query from localStorage:', error)
      }
    }
    
    return {
      query: createEmptyQuery(),
      schema: null,
      schemaStatus: 'idle',
      schemaError: null,
      validationStatus: 'idle',
      validationError: null,
      validationSql: null,
      executionStatus: 'idle',
      executionResults: null,
      executionError: null,
      totalRowCount: null,
      totalRowCountStatus: 'idle'
    }
  }

  const [state, setState] = useState<QueryBuilderState>(getInitialState())
  
  // Separate state for display limit (doesn't affect the actual query object)
  const [displayLimit, setDisplayLimit] = useState<number>(10)
  
  // API configuration state
  const [apiConfig, setApiConfig] = useState<ApiConfig>(getInitialApiConfig())
  const [showSetupPanel, setShowSetupPanel] = useState(false)

  // Update query when initialQuery prop changes (for modal usage)
  useEffect(() => {
    if (initialQuery && JSON.stringify(initialQuery) !== JSON.stringify(state.query)) {
      setState(prev => ({
        ...prev,
        query: initialQuery,
        schemaStatus: 'idle',
        schemaError: null,
        validationStatus: 'idle',
        validationError: null,
        validationSql: null,
        executionStatus: 'idle',
        executionResults: null,
        executionError: null,
        totalRowCount: null,
        totalRowCountStatus: 'idle'
      }))
    }
  }, [initialQuery])

  // Track the last validated query to avoid resetting validation on unrelated updates
  const lastValidatedQueryRef = useRef<string>('')

  // Create cube client instance with current API configuration
  // Use useMemo to prevent unnecessary re-creation
  const cubeClient = useMemo(() => {
    return createCubeClient(apiConfig.apiToken, { apiUrl: apiConfig.baseApiUrl })
  }, [apiConfig.apiToken, apiConfig.baseApiUrl])

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

  // Load schema on mount and when API config changes
  useEffect(() => {
    const loadSchema = async () => {
      setState(prev => ({
        ...prev,
        schemaStatus: 'loading',
        schemaError: null
      }))

      try {
        const metaResponse: MetaResponse = await cubeClient.meta()
        setState(prev => ({
          ...prev,
          schema: metaResponse,
          schemaStatus: 'success',
          schemaError: null
        }))
      } catch (error) {
        console.error('Failed to load schema:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to load schema'
        setState(prev => ({
          ...prev,
          schema: null,
          schemaStatus: 'error',
          schemaError: errorMessage
        }))
      }
    }

    loadSchema()
  }, [apiConfig.baseApiUrl, apiConfig.apiToken])

  // Save query to localStorage whenever it changes (if not disabled)
  useEffect(() => {
    if (!disableLocalStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ query: state.query }))
      } catch (error) {
        console.warn('Failed to save query to localStorage:', error)
      }
    }
  }, [state.query, disableLocalStorage])

  // Save API config to localStorage whenever it changes (if not disabled)
  useEffect(() => {
    if (!disableLocalStorage) {
      try {
        localStorage.setItem(API_CONFIG_STORAGE_KEY, JSON.stringify(apiConfig))
      } catch (error) {
        console.warn('Failed to save API config to localStorage:', error)
      }
    }
  }, [apiConfig, disableLocalStorage])




  // Auto re-run query when displayLimit changes
  useEffect(() => {
    if (state.executionStatus === 'success' && hasQueryContent(state.query) && state.validationStatus === 'valid') {
      handleExecuteQuery()
    }
  }, [displayLimit]) // Only trigger on displayLimit change

  const updateQuery = useCallback((updater: (prev: typeof state.query) => typeof state.query) => {
    setState(prev => {
      const newQuery = updater(prev.query)
      
      // Clean up filters to remove any that reference fields no longer in the query
      const cleanedQuery = {
        ...newQuery,
        filters: newQuery.filters ? cleanupFilters(newQuery.filters, newQuery) : undefined
      }
      
      const queryChanged = JSON.stringify(cleanedQuery) !== JSON.stringify(prev.query)
      
      return {
        ...prev,
        query: cleanedQuery,
        // Only reset validation if query actually changed
        validationStatus: queryChanged ? 'idle' : prev.validationStatus,
        validationError: queryChanged ? null : prev.validationError,
        validationSql: queryChanged ? null : prev.validationSql,
        executionStatus: 'idle',
        executionResults: null,
        executionError: null,
        totalRowCount: null,
        totalRowCountStatus: 'idle'
      }
    })
  }, [])

  const handleFieldSelect = useCallback((fieldName: string, fieldType: 'measures' | 'dimensions' | 'timeDimensions') => {
    updateQuery(prev => {
      const newQuery = { ...prev }
      
      switch (fieldType) {
        case 'measures':
          newQuery.measures = [...(prev.measures || []), fieldName]
          break
        case 'dimensions':
          newQuery.dimensions = [...(prev.dimensions || []), fieldName]
          break
        case 'timeDimensions':
          newQuery.timeDimensions = [...(prev.timeDimensions || []), { 
            dimension: fieldName, 
            granularity: 'month' 
          }]
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

  const handleValidateQuery = useCallback(async () => {
    if (!hasQueryContent(state.query)) return

    // Store the query being validated (cleaned and server-formatted)
    const queryToValidate = cleanQueryForServer(state.query)
    const queryStr = JSON.stringify(queryToValidate)
    
    console.log('Starting validation with query:', queryToValidate)

    setState(prev => ({
      ...prev,
      validationStatus: 'validating',
      validationError: null,
      validationSql: null
    }))

    try {
      const result: ValidationResult = await cubeClient.dryRun(queryToValidate)
      
      // Store the full validation result for parent access
      setFullValidationResult(result)
      
      // Check if validation is successful:
      // 1. Must have queryType (always present in successful Cube.js responses)
      // 2. Must not have an error
      // 3. For compatibility, also check result.valid if present
      const isValid = !result.error && result.queryType && (result.valid !== false)
      
      // Store the validated query to prevent reset
      if (isValid) {
        lastValidatedQueryRef.current = queryStr
      }
      
      console.log('Validation result:', isValid ? 'VALID' : 'INVALID', 'Query after validation:', state.query)
      
      setState(prev => {
        console.log('Setting validation status to:', isValid ? 'valid' : 'invalid')
        console.log('Query in prev state:', prev.query)
        return {
          ...prev,
          validationStatus: isValid ? 'valid' : 'invalid',
          validationError: result.error || null,
          validationSql: result.sql || null
        }
      })
    } catch (error) {
      console.error('Validation error:', error)
      setFullValidationResult(null)
      setState(prev => ({
        ...prev,
        validationStatus: 'invalid',
        validationError: error instanceof Error ? error.message : 'Network error during validation',
        validationSql: null
      }))
    }
  }, [state.query, cubeClient])

  const handleExecuteQuery = useCallback(async () => {
    if (!hasQueryContent(state.query) || state.validationStatus !== 'valid') return

    setState(prev => ({
      ...prev,
      executionStatus: 'loading',
      executionResults: null,
      executionError: null,
      totalRowCountStatus: 'loading'
    }))

    try {
      // Run both queries in parallel: one with limit and one without for total count
      const cleanedQuery = cleanQueryForServer(state.query)
      const [limitedResultSet, totalResultSet] = await Promise.all([
        cubeClient.load({ ...cleanedQuery, limit: displayLimit }),
        cubeClient.load(cleanedQuery) // No limit for total count
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
        totalRowCountStatus: 'success'
      }))
    } catch (error) {
      console.error('Query execution error:', error)
      setState(prev => ({
        ...prev,
        executionStatus: 'error',
        executionResults: null,
        executionError: error instanceof Error ? error.message : 'Query execution failed',
        totalRowCount: null,
        totalRowCountStatus: 'error'
      }))
    }
  }, [state.query, state.validationStatus, cubeClient, displayLimit])

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
      totalRowCountStatus: 'idle'
    }))
  }, [])

  const handleApiConfigChange = useCallback((newConfig: ApiConfig) => {
    setApiConfig(newConfig)
    // Reset all state when API config changes
    setState(prev => ({
      ...prev,
      schema: null,
      schemaStatus: 'idle',
      schemaError: null,
      validationStatus: 'idle',
      validationError: null,
      validationSql: null,
      executionStatus: 'idle',
      executionResults: null,
      executionError: null,
      totalRowCount: null,
      totalRowCountStatus: 'idle'
    }))
  }, [])

  const handleResetApiConfig = useCallback(() => {
    const defaultConfig = {
      baseApiUrl: baseUrl,
      apiToken: ''
    }
    setApiConfig(defaultConfig)
  }, [baseUrl])

  const handleRetrySchema = useCallback(async () => {
    setState(prev => ({
      ...prev,
      schemaStatus: 'loading',
      schemaError: null
    }))

    try {
      const metaResponse: MetaResponse = await cubeClient.meta()
      setState(prev => ({
        ...prev,
        schema: metaResponse,
        schemaStatus: 'success',
        schemaError: null
      }))
    } catch (error) {
      console.error('Failed to retry schema:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load schema'
      setState(prev => ({
        ...prev,
        schema: null,
        schemaStatus: 'error',
        schemaError: errorMessage
      }))
    }
  }, [cubeClient])

  const selectedFields = {
    measures: state.query.measures || [],
    dimensions: state.query.dimensions || [],
    timeDimensions: (state.query.timeDimensions || []).map(td => td.dimension)
  }

  return (
    <CubeProvider cubeApi={cubeClient}>
      <div className={`h-full flex flex-col ${className}`} style={{ minHeight: '100%' }}>
        {/* Setup Panel - only show when not in modal and not hidden */}
        {!hideSettings && (
          <div className="flex-shrink-0 p-4 pb-0">
            <SetupPanel
              isOpen={showSetupPanel}
              onToggle={() => setShowSetupPanel(!showSetupPanel)}
              config={apiConfig}
              onConfigChange={handleApiConfigChange}
              onReset={handleResetApiConfig}
            />
          </div>
        )}
        
        <div className="flex-1 flex flex-row gap-4 p-4 min-h-0" style={{ paddingTop: hideSettings ? '1rem' : '0rem' }}>
        {/* Schema Explorer - Left Column (1/3 width) */}
        <div className="w-1/3 min-w-0 flex-shrink-0 flex flex-col">
          <CubeMetaExplorer
            schema={state.schema}
            schemaStatus={state.schemaStatus}
            schemaError={state.schemaError}
            selectedFields={selectedFields}
            onFieldSelect={handleFieldSelect}
            onFieldDeselect={handleFieldDeselect}
            onRetrySchema={handleRetrySchema}
            onOpenSettings={!hideSettings ? () => setShowSetupPanel(true) : undefined}
          />
        </div>

        {/* Right Column - Query Builder + Results (2/3 width) */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 min-h-0">
          {/* Query Builder - Upper Right */}
          <div className="flex-shrink-0">
            <QueryPanel
              query={state.query}
              schema={state.schema}
              validationStatus={state.validationStatus}
              validationError={state.validationError}
              validationSql={state.validationSql}
              onValidate={handleValidateQuery}
              onExecute={handleExecuteQuery}
              onRemoveField={handleFieldDeselect}
              onTimeDimensionGranularityChange={handleTimeDimensionGranularityChange}
              onFiltersChange={handleFiltersChange}
              onClearQuery={handleClearQuery}
              showSettings={!hideSettings}
              onSettingsClick={() => setShowSetupPanel(!showSetupPanel)}
            />
          </div>

          {/* Results Panel - Lower Right */}
          <div className={`${state.executionStatus === 'idle' ? 'flex-shrink-0 h-48' : 'flex-1 min-h-0'}`}>
            <ResultsPanel
              executionStatus={state.executionStatus}
              executionResults={state.executionResults}
              executionError={state.executionError}
              query={state.query}
              displayLimit={displayLimit}
              onDisplayLimitChange={setDisplayLimit}
              totalRowCount={state.totalRowCount}
              totalRowCountStatus={state.totalRowCountStatus}
            />
          </div>
        </div>
        </div>
      </div>
    </CubeProvider>
  )
})

QueryBuilder.displayName = 'QueryBuilder'

export default QueryBuilder