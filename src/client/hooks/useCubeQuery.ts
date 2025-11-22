/**
 * React hook for executing Cube queries
 * Replaces @cubejs-client/react useCubeQuery
 */

import { useState, useEffect, useRef } from 'react'
import { useCubeContext } from '../providers/CubeProvider'
import type { CubeQuery, CubeQueryOptions, CubeResultSet } from '../types'

interface UseCubeQueryResult {
  resultSet: CubeResultSet | null
  isLoading: boolean
  error: Error | null
  queryId: string | null
}

export function useCubeQuery(
  query: CubeQuery | null,
  options: CubeQueryOptions = {}
): UseCubeQueryResult {
  const { cubeApi, batchCoordinator, enableBatching } = useCubeContext()
  
  // Use a single state object to ensure atomic updates
  const [state, setState] = useState<UseCubeQueryResult>({
    resultSet: null,
    isLoading: false,
    error: null,
    queryId: null
  })
  
  // Track the last query to avoid unnecessary re-fetches
  const lastQueryRef = useRef<string>('')
  
  useEffect(() => {
    // Skip if query is null or skip option is true
    if (!query || options.skip) {
      return
    }

    // Create a stable query string for comparison
    const queryString = JSON.stringify(query)
    
    // Skip if query hasn't changed (unless resetResultSetOnChange is true)
    if (queryString === lastQueryRef.current && !options.resetResultSetOnChange) {
      return
    }

    lastQueryRef.current = queryString
    
    // Create a unique ID for this query execution
    const queryId = `${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Update state atomically with new query ID and loading state
    setState(prevState => ({
      resultSet: options.resetResultSetOnChange ? null : prevState.resultSet,
      isLoading: true,
      error: null,
      queryId
    }))

    console.log('useCubeQuery - Sending query to API:', JSON.stringify(query, null, 2))

    // Use batch coordinator if enabled, otherwise use direct API call
    const executeQuery = enableBatching && batchCoordinator
      ? batchCoordinator.register(query)
      : cubeApi.load(query)

    executeQuery
      .then((result) => {
        setState(prevState => {
          // Only update if this is still the current query
          if (prevState.queryId === queryId) {
            return {
              resultSet: result,
              isLoading: false,
              error: null,
              queryId
            }
          }
          return prevState
        })
      })
      .catch((err) => {
        setState(prevState => {
          // Only update if this is still the current query
          if (prevState.queryId === queryId) {
            return {
              resultSet: null,
              isLoading: false,
              error: err instanceof Error ? err : new Error(String(err)),
              queryId
            }
          }
          return prevState
        })
      })
  }, [query, cubeApi, batchCoordinator, enableBatching, options.skip, options.resetResultSetOnChange])

  return state
}