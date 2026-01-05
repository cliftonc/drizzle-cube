/**
 * Hook for filter-related handlers in AnalysisBuilder
 *
 * Handles:
 * - Updating filters from FilterBuilder
 * - Dropping fields to create new filters
 * - Changing sort order for fields
 */

import { useCallback } from 'react'
import type { AnalysisBuilderState } from '../types'
import type { Filter } from '../../../types'

interface UseFiltersHandlersOptions {
  /** Set state function for the current query */
  setState: (updater: (prev: AnalysisBuilderState) => AnalysisBuilderState) => void
}

interface UseFiltersHandlersResult {
  /** Update filters from FilterBuilder component */
  handleFiltersChange: (filters: Filter[]) => void
  /** Handle dropping a field from metrics/breakdowns onto the filter section */
  handleDropFieldToFilter: (field: string) => void
  /** Change sort order for a field */
  handleOrderChange: (fieldName: string, direction: 'asc' | 'desc' | null) => void
}

export function useFiltersHandlers({
  setState
}: UseFiltersHandlersOptions): UseFiltersHandlersResult {
  /**
   * Update filters from FilterBuilder component
   */
  const handleFiltersChange = useCallback((filters: Filter[]) => {
    setState((prev) => ({
      ...prev,
      filters,
      resultsStale: true
    }))
  }, [setState])

  /**
   * Handle dropping a field from metrics/breakdowns onto the filter section
   * Creates a new filter with 'set' operator (checks if field exists/is not null)
   */
  const handleDropFieldToFilter = useCallback((field: string) => {
    // Create a new filter with 'set' operator (checks if field exists/is not null)
    const newFilter: Filter = {
      member: field,
      operator: 'set',
      values: []
    }

    setState((prev) => {
      // Add to existing filters or create new array
      const existingFilters = prev.filters || []

      // Check if we already have a filter for this field
      const hasFilterForField = existingFilters.some((f) =>
        'member' in f && f.member === field
      )

      if (hasFilterForField) {
        // Don't add duplicate filter
        return prev
      }

      // If we have existing filters, wrap in an AND group or add to existing group
      let updatedFilters: Filter[]
      if (existingFilters.length === 0) {
        updatedFilters = [newFilter]
      } else if (existingFilters.length === 1 && 'type' in existingFilters[0]) {
        // Already a group, add to it
        const group = existingFilters[0] as { type: 'and' | 'or'; filters: Filter[] }
        updatedFilters = [{
          ...group,
          filters: [...group.filters, newFilter]
        }]
      } else {
        // Wrap all in AND group
        updatedFilters = [{
          type: 'and' as const,
          filters: [...existingFilters, newFilter]
        }]
      }

      return {
        ...prev,
        filters: updatedFilters,
        resultsStale: true
      }
    })
  }, [setState])

  /**
   * Change sort order for a field
   * @param fieldName - The field to sort
   * @param direction - 'asc', 'desc', or null to remove sort
   */
  const handleOrderChange = useCallback(
    (fieldName: string, direction: 'asc' | 'desc' | null) => {
      setState((prev) => {
        const newOrder = { ...(prev.order || {}) }

        if (direction === null) {
          // Remove sort for this field
          delete newOrder[fieldName]
        } else {
          // Set or update sort direction
          newOrder[fieldName] = direction
        }

        return {
          ...prev,
          order: Object.keys(newOrder).length > 0 ? newOrder : undefined,
          resultsStale: true
        }
      })
    },
    [setState]
  )

  return {
    handleFiltersChange,
    handleDropFieldToFilter,
    handleOrderChange
  }
}
