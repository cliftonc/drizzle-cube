/**
 * Hook for fetching distinct field values for filter dropdowns
 * Uses TanStack Query via useCubeLoadQuery for data fetching
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { useCubeLoadQuery } from './queries/useCubeLoadQuery'
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
 *
 * Uses TanStack Query for server state (data fetching, caching, loading).
 * Values are derived via useMemo from query results - NOT stored in useState.
 */
export function useFilterValues(
  fieldName: string | null,
  enabled: boolean = true
): UseFilterValuesResult {
  const [currentQuery, setCurrentQuery] = useState<CubeQuery | null>(null)
  const lastSearchTerm = useRef<string>('')

  // Use TanStack Query hook for data fetching
  const {
    resultSet,
    isLoading,
    error: queryError,
  } = useCubeLoadQuery(currentQuery, {
    skip: !currentQuery || !enabled || !fieldName,
    debounceMs: 150, // Quick debounce for filter searches
    keepPreviousData: true,
  })

  // Derive values from resultSet using useMemo (NOT useState)
  // This is the correct pattern - server state stays in TanStack Query
  const values = useMemo(() => {
    // Return empty if no result set, loading, or error
    if (!resultSet || isLoading || queryError || !fieldName) {
      return []
    }

    try {
      const data = resultSet.tablePivot()
      const uniqueValues = new Set<any>()

      data.forEach((row: any) => {
        const value = row[fieldName]
        if (value !== null && value !== undefined && value !== '') {
          uniqueValues.add(value)
        }
      })

      // Convert to array - already sorted by query
      return Array.from(uniqueValues)
    } catch (err) {
      console.error('Error extracting values from result set:', err)
      return []
    }
  }, [resultSet, isLoading, queryError, fieldName])

  // Reset query when fieldName becomes null or enabled changes
  useEffect(() => {
    if (!fieldName || !enabled) {
      setCurrentQuery(null)
      lastSearchTerm.current = ''
    }
  }, [fieldName, enabled])

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
