/**
 * Hook for fetching distinct field values for filter dropdowns
 * Uses the /load API to get actual data values
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useCubeQuery } from '../hooks/useCubeQuery'
import type { CubeQuery } from '../types'

interface UseFilterValuesResult {
  values: any[]
  loading: boolean
  error: string | null
  refetch: () => void
  searchValues: (searchTerm: string, force?: boolean) => void
}

/**
 * Custom hook to fetch distinct values for a field
 */
export function useFilterValues(
  fieldName: string | null, 
  enabled: boolean = true
): UseFilterValuesResult {
  const [values, setValues] = useState<any[]>([])
  const [currentQuery, setCurrentQuery] = useState<CubeQuery | null>(null)
  const lastProcessedQueryId = useRef<string | null>(null)
  const lastSearchTerm = useRef<string>('')
  
  // Use cube query hook for actual data fetching
  const { 
    resultSet, 
    isLoading,
    error: queryError,
    queryId
  } = useCubeQuery(currentQuery, {
    skip: !currentQuery || !enabled,
    resetResultSetOnChange: true // Clear old results when query changes
  })
  
  // Extract unique values from result set
  const extractValuesFromResultSet = useCallback((rs: any): any[] => {
    if (!rs || !fieldName) {
      return []
    }
    
    try {
      const data = rs.tablePivot()
      
      const uniqueValues = new Set<any>()
      
      data.forEach((row: any) => {
        const value = row[fieldName]
        if (value !== null && value !== undefined && value !== '') {
          uniqueValues.add(value)
        }
      })
      
      // Convert to array - already sorted by query
      const sortedValues = Array.from(uniqueValues)
      
      return sortedValues
    } catch (err) {
      console.error('Error extracting values from result set:', err)
      return []
    }
  }, [fieldName])
  
  // Process results only when we have a new matching query result
  useEffect(() => {
    // Skip if no query ID
    if (!queryId) {
      return
    }
    
    // Skip if we've already processed this query
    if (queryId === lastProcessedQueryId.current) {
      return
    }
    
    // Skip if still loading
    if (isLoading) {
      return
    }
    
    // Mark as processed
    lastProcessedQueryId.current = queryId
    
    if (queryError) {
      setValues([])
    } else if (resultSet) {
      const extractedValues = extractValuesFromResultSet(resultSet)
      setValues(extractedValues)
    } else {
      setValues([])
    }
  }, [resultSet, isLoading, queryError, queryId, extractValuesFromResultSet])
  
  // Refetch function
  const refetch = useCallback(() => {
    if (!fieldName) return
    
    lastSearchTerm.current = ''
    
    try {
      const query: CubeQuery = {
        dimensions: [fieldName], 
        limit: 25,
        order: { [fieldName]: 'asc' }
      }
      setCurrentQuery(query)
    } catch (err) {
      console.error('Error creating query:', err)
    }
  }, [fieldName])

  // Search function for server-side filtering
  const searchValues = useCallback((searchTerm: string, force: boolean = false) => {
    if (!fieldName) {
      return
    }
    
    // Don't create a new query if the search term hasn't changed (unless forced)
    if (!force && searchTerm === lastSearchTerm.current) {
      return
    }
    
    lastSearchTerm.current = searchTerm
    
    try {
      // Create query inline to avoid dependency issues
      const query: CubeQuery = {
        dimensions: [fieldName], 
        limit: 25,
        order: { [fieldName]: 'asc' }
      }
      
      if (searchTerm && searchTerm.trim()) {
        query.filters = [{
          member: fieldName,
          operator: 'contains',
          values: [searchTerm.trim()]
        }]
      }
      
      setCurrentQuery(query)
    } catch (err) {
      console.error('Error creating search query:', err)
    }
  }, [fieldName])
  
  return {
    values,
    loading: isLoading,
    error: queryError ? (queryError instanceof Error ? queryError.message : String(queryError)) : null,
    refetch,
    searchValues
  }
}