/**
 * QueryBuilder Component
 * 
 * Main component that orchestrates the query building experience.
 * Manages state and coordinates between the meta explorer, query panel, and results panel.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { createCubeClient } from '../../client/CubeClient'
import CubeMetaExplorer from './CubeMetaExplorer'
import QueryPanel from './QueryPanel'
import ResultsPanel from './ResultsPanel'
import type { 
  QueryBuilderProps, 
  QueryBuilderState, 
  MetaResponse,
  ValidationResult
} from './types'
import { createEmptyQuery, hasQueryContent } from './utils'

const QueryBuilder: React.FC<QueryBuilderProps> = ({
  baseUrl,
  className = '',
  onQueryChange
}) => {
  const [state, setState] = useState<QueryBuilderState>({
    query: createEmptyQuery(),
    schema: null,
    validationStatus: 'idle',
    validationError: null,
    executionStatus: 'idle',
    executionResults: null,
    executionError: null
  })

  // Create cube client instance
  const cubeClient = createCubeClient(undefined, { apiUrl: baseUrl })

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

  // Auto-validate query when it changes and has content
  useEffect(() => {
    if (hasQueryContent(state.query)) {
      handleValidateQuery()
    } else {
      setState(prev => ({
        ...prev,
        validationStatus: 'idle',
        validationError: null
      }))
    }
  }, [state.query])

  // Notify parent of query changes
  useEffect(() => {
    if (onQueryChange) {
      onQueryChange(state.query)
    }
  }, [state.query, onQueryChange])

  const updateQuery = useCallback((updater: (prev: typeof state.query) => typeof state.query) => {
    setState(prev => ({
      ...prev,
      query: updater(prev.query),
      executionStatus: 'idle',
      executionResults: null,
      executionError: null
    }))
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
      
      return newQuery
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
      
      return newQuery
    })
  }, [updateQuery])

  const handleTimeDimensionGranularityChange = useCallback((dimensionName: string, granularity: string) => {
    updateQuery(prev => ({
      ...prev,
      timeDimensions: (prev.timeDimensions || []).map(td => 
        td.dimension === dimensionName 
          ? { ...td, granularity }
          : td
      )
    }))
  }, [updateQuery])

  const handleValidateQuery = useCallback(async () => {
    if (!hasQueryContent(state.query)) return

    setState(prev => ({
      ...prev,
      validationStatus: 'validating',
      validationError: null
    }))

    try {
      const response = await fetch(`${baseUrl}/dry-run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ query: state.query })
      })

      if (response.ok) {
        const result: ValidationResult = await response.json()
        setState(prev => ({
          ...prev,
          validationStatus: result.valid ? 'valid' : 'invalid',
          validationError: result.error || null
        }))
      } else {
        const errorData = await response.json().catch(() => ({}))
        setState(prev => ({
          ...prev,
          validationStatus: 'invalid',
          validationError: errorData.error || `Validation failed with status ${response.status}`
        }))
      }
    } catch (error) {
      console.error('Validation error:', error)
      setState(prev => ({
        ...prev,
        validationStatus: 'invalid',
        validationError: error instanceof Error ? error.message : 'Network error during validation'
      }))
    }
  }, [state.query, baseUrl])

  const handleExecuteQuery = useCallback(async () => {
    if (!hasQueryContent(state.query) || state.validationStatus !== 'valid') return

    setState(prev => ({
      ...prev,
      executionStatus: 'loading',
      executionResults: null,
      executionError: null
    }))

    try {
      const resultSet = await cubeClient.load(state.query)
      const data = resultSet.tablePivot()
      
      setState(prev => ({
        ...prev,
        executionStatus: 'success',
        executionResults: data,
        executionError: null
      }))
    } catch (error) {
      console.error('Query execution error:', error)
      setState(prev => ({
        ...prev,
        executionStatus: 'error',
        executionResults: null,
        executionError: error instanceof Error ? error.message : 'Query execution failed'
      }))
    }
  }, [state.query, state.validationStatus, cubeClient])

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
              onValidate={handleValidateQuery}
              onExecute={handleExecuteQuery}
              onRemoveField={handleFieldDeselect}
              onTimeDimensionGranularityChange={handleTimeDimensionGranularityChange}
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
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default QueryBuilder