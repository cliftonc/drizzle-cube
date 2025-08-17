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
}

export function useCubeQuery(
  query: CubeQuery | null, 
  options: CubeQueryOptions = {}
): UseCubeQueryResult {
  const { cubeApi } = useCubeContext()
  const [resultSet, setResultSet] = useState<CubeResultSet | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
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

    // Reset result set if requested
    if (options.resetResultSetOnChange) {
      setResultSet(null)
    }

    setIsLoading(true)
    setError(null)

    cubeApi.load(query)
      .then((result) => {
        setResultSet(result)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsLoading(false)
      })
  }, [query, cubeApi, options.skip, options.resetResultSetOnChange])

  return {
    resultSet,
    isLoading,
    error
  }
}