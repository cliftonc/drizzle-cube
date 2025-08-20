/**
 * Hook for fetching distinct field values for filter dropdowns
 * Uses the /load API to get actual data values and caches results
 */

import { useState, useEffect, useCallback } from 'react'
import { useCubeQuery } from '../hooks/useCubeQuery'
import type { CubeQuery } from '../types'

interface UseFilterValuesResult {
  values: any[]
  loading: boolean
  error: string | null
  refetch: () => void
}

interface FilterValuesCache {
  [fieldName: string]: {
    values: any[]
    timestamp: number
  }
}

// Cache values for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000
const cache: FilterValuesCache = {}

/**
 * Custom hook to fetch distinct values for a field
 */
export function useFilterValues(
  fieldName: string | null, 
  enabled: boolean = true
): UseFilterValuesResult {
  const [values, setValues] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Check cache first
  const getCachedValues = useCallback((field: string): any[] | null => {
    const cached = cache[field]
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.values
    }
    return null
  }, [])
  
  // Store values in cache
  const setCachedValues = useCallback((field: string, vals: any[]) => {
    cache[field] = {
      values: vals,
      timestamp: Date.now()
    }
  }, [])
  
  // Create query to fetch distinct values
  const createDistinctValuesQuery = useCallback((field: string): CubeQuery => {
    // For dimensions, we can use the dimension directly to get distinct values
    const query: CubeQuery = {
      dimensions: [field], // Use the field as a dimension to get distinct values
      limit: 1000 // Limit to prevent too many values
    }
    
    return query
  }, [])
  
  const [currentQuery, setCurrentQuery] = useState<CubeQuery | null>(null)
  
  // Use cube query hook for actual data fetching
  const { 
    resultSet, 
    isLoading: queryLoading, 
    error: queryError
  } = useCubeQuery(currentQuery, {
    skip: !currentQuery || !enabled
  })
  
  // Extract unique values from result set
  const extractValuesFromResultSet = useCallback((rs: any): any[] => {
    if (!rs || !fieldName) return []
    
    try {
      const data = rs.tablePivot()
      const uniqueValues = new Set<any>()
      
      data.forEach((row: any) => {
        const value = row[fieldName]
        if (value !== null && value !== undefined && value !== '') {
          uniqueValues.add(value)
        }
      })
      
      // Convert to array and sort alphabetically
      const sortedValues = Array.from(uniqueValues).sort((a, b) => {
        // Handle different types for sorting
        if (typeof a === 'string' && typeof b === 'string') {
          return a.localeCompare(b)
        }
        if (typeof a === 'number' && typeof b === 'number') {
          return a - b
        }
        return String(a).localeCompare(String(b))
      })
      
      return sortedValues
    } catch (err) {
      console.error('Error extracting values from result set:', err)
      return []
    }
  }, [fieldName])
  
  // Main effect to fetch values
  useEffect(() => {
    if (!fieldName || !enabled) {
      setValues([])
      setLoading(false)
      setError(null)
      setCurrentQuery(null)
      return
    }
    
    // Check cache first
    const cachedValues = getCachedValues(fieldName)
    if (cachedValues) {
      setValues(cachedValues)
      setLoading(false)
      setError(null)
      setCurrentQuery(null)
      return
    }
    
    // Start loading and create query
    setLoading(true)
    setError(null)
    
    try {
      const query = createDistinctValuesQuery(fieldName)
      setCurrentQuery(query)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create query')
      setLoading(false)
      setCurrentQuery(null)
    }
  }, [fieldName, enabled, getCachedValues, createDistinctValuesQuery])
  
  // Handle query results
  useEffect(() => {
    if (!queryLoading && resultSet && fieldName && currentQuery) {
      try {
        const extractedValues = extractValuesFromResultSet(resultSet)
        setValues(extractedValues)
        setCachedValues(fieldName, extractedValues)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to extract values')
        setValues([])
      } finally {
        setLoading(false)
        setCurrentQuery(null)
      }
    }
  }, [resultSet, queryLoading, fieldName, currentQuery, extractValuesFromResultSet, setCachedValues])
  
  // Handle query errors
  useEffect(() => {
    if (queryError && currentQuery) {
      setError(queryError instanceof Error ? queryError.message : 'Failed to fetch values')
      setLoading(false)
      setValues([])
      setCurrentQuery(null)
    }
  }, [queryError, currentQuery])
  
  // Update loading state from query
  useEffect(() => {
    if (currentQuery) {
      setLoading(queryLoading)
    }
  }, [queryLoading, currentQuery])
  
  // Refetch function
  const refetch = useCallback(() => {
    if (!fieldName) return
    
    // Clear cache for this field
    delete cache[fieldName]
    
    // Restart the fetch process
    setLoading(true)
    setError(null)
    
    try {
      const query = createDistinctValuesQuery(fieldName)
      setCurrentQuery(query)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create query')
      setLoading(false)
    }
  }, [fieldName, createDistinctValuesQuery])
  
  return {
    values,
    loading,
    error,
    refetch
  }
}

/**
 * Clear all cached values (useful for testing or when schema changes)
 */
export function clearFilterValuesCache(): void {
  Object.keys(cache).forEach(key => delete cache[key])
}