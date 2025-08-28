/**
 * QueryBuilder Component
 * 
 * Main component that orchestrates the query building experience.
 * Manages state and coordinates between the meta explorer, query panel, and results panel.
 */

import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
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
  ApiConfig
} from './types'
import type { Filter } from '../../types'
import { createEmptyQuery, hasQueryContent, cleanQuery, cleanQueryForServer, cleanupFilters, transformQueryForUI } from './utils'

const STORAGE_KEY = 'drizzle-cube-query-builder-state'
const API_CONFIG_STORAGE_KEY = 'drizzle-cube-api-config'

const QueryBuilder = forwardRef<QueryBuilderRef, QueryBuilderProps>(({
  className = '',
  initialQuery,
  disableLocalStorage = false,
  hideSettings = false
}, ref) => {
  // Get cube client, update function, and features from context
  const { cubeApi, updateApiConfig, features } = useCubeContext()
  
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
            query: transformQueryForUI(parsedState.query) || createEmptyQuery(),
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
        // Failed to load query from localStorage
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
  const [showSchemaMobile, setShowSchemaMobile] = useState(false)
  
  // AI Assistant modal state
  const [showAIAssistant, setShowAIAssistant] = useState(false)

  // Update query when initialQuery prop changes (for modal usage)
  useEffect(() => {
    if (initialQuery && JSON.stringify(initialQuery) !== JSON.stringify(state.query)) {
      setState(prev => ({
        ...prev,
        query: transformQueryForUI(initialQuery),
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

  // Load schema on mount and when API config changes
  useEffect(() => {
    const loadSchema = async () => {
      setState(prev => ({
        ...prev,
        schemaStatus: 'loading',
        schemaError: null
      }))

      try {
        const metaResponse: MetaResponse = await cubeApi.meta()
        setState(prev => ({
          ...prev,
          schema: metaResponse,
          schemaStatus: 'success',
          schemaError: null
        }))
      } catch (error) {
        // Failed to load schema
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
        // Failed to save query to localStorage
      }
    }
  }, [state.query, disableLocalStorage])

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

  const handleValidateQuery = useCallback(async () => {
    if (!hasQueryContent(state.query)) return

    // Store the query being validated (cleaned and server-formatted)
    const queryToValidate = cleanQueryForServer(state.query)
    const queryStr = JSON.stringify(queryToValidate)
    

    setState(prev => ({
      ...prev,
      validationStatus: 'validating',
      validationError: null,
      validationSql: null
    }))

    try {
      const result: ValidationResult = await cubeApi.dryRun(queryToValidate)
      
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
      
      setState(prev => {
        return {
          ...prev,
          validationStatus: isValid ? 'valid' : 'invalid',
          validationError: result.error || null,
          validationSql: result.sql || null
        }
      })
    } catch (error) {
      // Validation error
      setFullValidationResult(null)
      setState(prev => ({
        ...prev,
        validationStatus: 'invalid',
        validationError: error instanceof Error ? error.message : 'Network error during validation',
        validationSql: null
      }))
    }
  }, [state.query, cubeApi])

  // Auto re-validate query when query changes (with 1s debounce)
  useEffect(() => {
    // Only auto-validate if query has content and validation was previously cleared
    if (!hasQueryContent(state.query) || state.validationStatus !== 'idle') {
      return
    }

    const debounceTimer = setTimeout(() => {
      handleValidateQuery()
    }, 200) // 200ms debounce - fast but prevents excessive API calls

    return () => clearTimeout(debounceTimer)
  }, [state.query, state.validationStatus, handleValidateQuery]) // Trigger when query changes and validation status is idle

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
        cubeApi.load({ ...cleanedQuery, limit: displayLimit }),
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
        totalRowCountStatus: 'success'
      }))
    } catch (error) {
      // Query execution error
      setState(prev => ({
        ...prev,
        executionStatus: 'error',
        executionResults: null,
        executionError: error instanceof Error ? error.message : 'Query execution failed',
        totalRowCount: null,
        totalRowCountStatus: 'error'
      }))
    }
  }, [state.query, state.validationStatus, cubeApi, displayLimit])

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
    
    // Update the CubeProvider's client with new configuration
    updateApiConfig(
      { apiUrl: newConfig.baseApiUrl },
      newConfig.apiToken || undefined
    )
    
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

  const handleRetrySchema = useCallback(async () => {
    setState(prev => ({
      ...prev,
      schemaStatus: 'loading',
      schemaError: null
    }))

    try {
      const metaResponse: MetaResponse = await cubeApi.meta()
      setState(prev => ({
        ...prev,
        schema: metaResponse,
        schemaStatus: 'success',
        schemaError: null
      }))
    } catch (error) {
      // Failed to retry schema
      const errorMessage = error instanceof Error ? error.message : 'Failed to load schema'
      setState(prev => ({
        ...prev,
        schema: null,
        schemaStatus: 'error',
        schemaError: errorMessage
      }))
    }
  }, [cubeApi])

  const selectedFields = {
    measures: state.query.measures || [],
    dimensions: state.query.dimensions || [],
    timeDimensions: (state.query.timeDimensions || []).map(td => td.dimension)
  }

  return (
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
        
        {/* Mobile Schema Toggle Button */}
        <div className="md:hidden flex-shrink-0 px-4 pb-2">
          <button
            onClick={() => setShowSchemaMobile(!showSchemaMobile)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            {showSchemaMobile ? (
              <><XMarkIcon className="w-4 h-4" /> Hide Schema</>
            ) : (
              <><Bars3Icon className="w-4 h-4" /> Show Schema</>
            )}
          </button>
        </div>

        {/* Mobile Schema Panel Overlay */}
        {showSchemaMobile && (
          <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50 flex">
            <div className="w-full max-w-md sm:max-w-lg bg-white h-full overflow-y-auto">
              <div className="p-4 border-b">
                <button
                  onClick={() => setShowSchemaMobile(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" /> Close Schema
                </button>
              </div>
              <div className="p-4">
                <CubeMetaExplorer
                  schema={state.schema}
                  schemaStatus={state.schemaStatus}
                  schemaError={state.schemaError}
                  selectedFields={selectedFields}
                  onFieldSelect={(field, type) => {
                    handleFieldSelect(field, type)
                    setShowSchemaMobile(false)
                  }}
                  onFieldDeselect={handleFieldDeselect}
                  onRetrySchema={handleRetrySchema}
                  onOpenSettings={!hideSettings ? () => setShowSetupPanel(true) : undefined}
                />
              </div>
            </div>
            <div className="flex-1" onClick={() => setShowSchemaMobile(false)}></div>
          </div>
        )}

        <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 min-h-0" style={{ paddingTop: hideSettings ? '1rem' : '0rem' }}>
        {/* Schema Explorer - Left Column (Desktop only) */}
        <div className="hidden md:flex md:w-1/3 min-w-0 flex-shrink-0 flex-col">
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

        {/* Main Content - Query Builder + Results */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 min-h-0">
          {/* Query Builder */}
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
              onDateRangeChange={handleDateRangeChange}
              onDateRangeRemove={handleDateRangeRemove}
              onOrderChange={handleOrderChange}
              onClearQuery={handleClearQuery}
              showSettings={!hideSettings}
              onSettingsClick={() => setShowSetupPanel(!showSetupPanel)}
              onAIAssistantClick={features?.enableAI !== false ? () => setShowAIAssistant(true) : undefined}
            />
          </div>

          {/* Results Panel */}
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
      
        {/* AI Assistant Modal - only render if AI is enabled */}
        {features?.enableAI !== false && (
          <AIAssistantModal
            isOpen={showAIAssistant}
            onClose={() => setShowAIAssistant(false)}
            schema={state.schema}
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
              totalRowCountStatus: 'idle'
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
      </div>
  )
})

QueryBuilder.displayName = 'QueryBuilder'

export default QueryBuilder