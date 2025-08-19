/**
 * QueryBuilder Component
 * 
 * Main component that orchestrates the query building experience.
 * Manages state and coordinates between the meta explorer, query panel, and results panel.
 */

import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import { createCubeClient } from '../../client/CubeClient'
import CubeMetaExplorer from './CubeMetaExplorer'
import QueryPanel from './QueryPanel'
import ResultsPanel from './ResultsPanel'
import type { 
  QueryBuilderProps, 
  QueryBuilderRef,
  QueryBuilderState, 
  MetaResponse,
  ValidationResult
} from './types'
import { createEmptyQuery, hasQueryContent, cleanQuery } from './utils'

const STORAGE_KEY = 'drizzle-cube-query-builder-state'

const QueryBuilder = forwardRef<QueryBuilderRef, QueryBuilderProps>(({
  baseUrl,
  className = '',
  initialQuery,
  disableLocalStorage = false
}, ref) => {
  // Load initial state from localStorage if available, or use provided initialQuery
  const getInitialState = (): QueryBuilderState => {
    // If initialQuery is provided, use it instead of localStorage
    if (initialQuery) {
      return {
        query: initialQuery,
        schema: null,
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

  // Update query when initialQuery prop changes (for modal usage)
  useEffect(() => {
    if (initialQuery && JSON.stringify(initialQuery) !== JSON.stringify(state.query)) {
      setState(prev => ({
        ...prev,
        query: initialQuery,
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

  // Create cube client instance
  const cubeClient = createCubeClient(undefined, { apiUrl: baseUrl })

  // Store the full validation result for access via ref
  const [fullValidationResult, setFullValidationResult] = useState<ValidationResult | null>(null)

  // Expose query and validation state to parent via ref (only called when Apply is clicked)
  useImperativeHandle(ref, () => ({
    getCurrentQuery: () => cleanQuery(state.query),
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

  // Load schema on mount
  useEffect(() => {
    const loadSchema = async () => {
      try {
        const metaResponse: MetaResponse = await cubeClient.meta()
        setState(prev => ({
          ...prev,
          schema: metaResponse
        }))
      } catch (error) {
        console.error('Failed to load schema:', error)
        setState(prev => ({
          ...prev,
          schema: null
        }))
      }
    }

    loadSchema()
  }, [baseUrl])

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




  // Auto re-run query when displayLimit changes
  useEffect(() => {
    if (state.executionStatus === 'success' && hasQueryContent(state.query) && state.validationStatus === 'valid') {
      handleExecuteQuery()
    }
  }, [displayLimit]) // Only trigger on displayLimit change

  const updateQuery = useCallback((updater: (prev: typeof state.query) => typeof state.query) => {
    setState(prev => {
      const newQuery = updater(prev.query)
      const queryChanged = JSON.stringify(newQuery) !== JSON.stringify(prev.query)
      
      return {
        ...prev,
        query: newQuery,
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

  const handleValidateQuery = useCallback(async () => {
    if (!hasQueryContent(state.query)) return

    // Store the query being validated (cleaned)
    const queryToValidate = cleanQuery(state.query)
    const queryStr = JSON.stringify(queryToValidate)
    
    console.log('Starting validation with query:', queryToValidate)

    setState(prev => ({
      ...prev,
      validationStatus: 'validating',
      validationError: null,
      validationSql: null
    }))

    try {
      const response = await fetch(`${baseUrl}/dry-run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ query: queryToValidate })
      })

      if (response.ok) {
        const result: ValidationResult = await response.json()
        
        // Store the full validation result for parent access
        setFullValidationResult(result)
        
        // Store the validated query to prevent reset
        if (result.valid) {
          lastValidatedQueryRef.current = queryStr
        }
        
        console.log('Validation result:', result.valid ? 'VALID' : 'INVALID', 'Query after validation:', state.query)
        
        setState(prev => {
          console.log('Setting validation status to:', result.valid ? 'valid' : 'invalid')
          console.log('Query in prev state:', prev.query)
          return {
            ...prev,
            validationStatus: result.valid ? 'valid' : 'invalid',
            validationError: result.error || null,
            validationSql: result.sql || null
          }
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        setFullValidationResult(null)
        setState(prev => ({
          ...prev,
          validationStatus: 'invalid',
          validationError: errorData.error || `Validation failed with status ${response.status}`,
          validationSql: null
        }))
      }
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
  }, [state.query, baseUrl])

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
      const cleanedQuery = cleanQuery(state.query)
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

  const selectedFields = {
    measures: state.query.measures || [],
    dimensions: state.query.dimensions || [],
    timeDimensions: (state.query.timeDimensions || []).map(td => td.dimension)
  }

  return (
    <div className={`h-full bg-gray-50 ${className}`} style={{ display: 'block', position: 'relative' }}>
      <div 
        className="h-full gap-4 p-4" 
        style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          height: '100%',
          gap: '1rem',
          padding: '1rem'
        }}
      >
        {/* Schema Explorer - Left Column (1/3 width) */}
        <div 
          className="w-1/3 min-w-0" 
          style={{ 
            width: '33.333333%', 
            minWidth: '0',
            flex: '0 0 33.333333%'
          }}
        >
          <CubeMetaExplorer
            schema={state.schema}
            selectedFields={selectedFields}
            onFieldSelect={handleFieldSelect}
            onFieldDeselect={handleFieldDeselect}
          />
        </div>

        {/* Right Column - Query Builder + Results (2/3 width) */}
        <div 
          className="flex-1 flex flex-col gap-4 min-w-0" 
          style={{ 
            flex: '1 1 0%',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            minWidth: '0'
          }}
        >
          {/* Query Builder - Upper Right */}
          <div 
            className="flex-shrink-0" 
            style={{ flexShrink: 0 }}
          >
            <QueryPanel
              query={state.query}
              validationStatus={state.validationStatus}
              validationError={state.validationError}
              validationSql={state.validationSql}
              onValidate={handleValidateQuery}
              onExecute={handleExecuteQuery}
              onRemoveField={handleFieldDeselect}
              onTimeDimensionGranularityChange={handleTimeDimensionGranularityChange}
              onClearQuery={handleClearQuery}
            />
          </div>

          {/* Results Panel - Lower Right */}
          <div 
            className="flex-1 min-h-0" 
            style={{ 
              flex: '1 1 0%',
              minHeight: '0'
            }}
          >
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
  )
})

QueryBuilder.displayName = 'QueryBuilder'

export default QueryBuilder