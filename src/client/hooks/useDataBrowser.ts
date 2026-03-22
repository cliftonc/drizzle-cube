/**
 * useDataBrowser Master Hook
 *
 * Coordinates DataBrowser store state with query building and data fetching.
 * Builds ungrouped SemanticQueries from the store's selected cube, columns,
 * sort, pagination, and filter state.
 */

import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useDataBrowserStore } from '../stores/dataBrowserStore'
import { useCubeMeta } from '../providers/CubeProvider'
import { useCubeLoadQuery } from './queries/useCubeLoadQuery'
import type { CubeQuery } from '../types'

/**
 * Determine whether a field is a dimension on a given cube from metadata
 */
function isDimension(fieldName: string, meta: { cubes: Array<{ name: string; dimensions: Array<{ name: string }> }> } | null): boolean {
  if (!meta) return true // default to dimension if no meta
  const [cubeName, field] = fieldName.split('.')
  const cube = meta.cubes.find((c) => c.name === cubeName)
  if (!cube) return true
  return cube.dimensions.some((d) => d.name === `${cubeName}.${field}`)
}

/**
 * Get field type from metadata
 */
export function getFieldType(
  fieldName: string,
  meta: { cubes: Array<{ name: string; dimensions: Array<{ name: string; type: string }>; measures: Array<{ name: string; type: string }> }> } | null
): string {
  if (!meta) return 'string'
  const [cubeName] = fieldName.split('.')
  const cube = meta.cubes.find((c) => c.name === cubeName)
  if (!cube) return 'string'
  const dim = cube.dimensions.find((d) => d.name === fieldName)
  if (dim) return dim.type
  const meas = cube.measures.find((m) => m.name === fieldName)
  if (meas) return meas.type
  return 'string'
}

/**
 * Get all browsable columns for a cube (dimensions + ungrouped-compatible measures)
 */
export function getCubeColumns(
  cubeName: string,
  meta: { cubes: Array<{ name: string; dimensions: Array<{ name: string }>; measures: Array<{ name: string; type: string }> }> } | null
): { dimensions: string[]; measures: string[] } {
  if (!meta) return { dimensions: [], measures: [] }
  const cube = meta.cubes.find((c) => c.name === cubeName)
  if (!cube) return { dimensions: [], measures: [] }

  const ungroupedCompatible = new Set(['sum', 'avg', 'min', 'max', 'number'])
  const dimensions = cube.dimensions.map((d) => d.name)
  const measures = cube.measures
    .filter((m) => ungroupedCompatible.has(m.type))
    .map((m) => m.name)

  return { dimensions, measures }
}

export function useDataBrowser() {
  // Store state
  const selectedCube = useDataBrowserStore((s) => s.selectedCube)
  const visibleColumns = useDataBrowserStore((s) => s.visibleColumns)
  const sortColumn = useDataBrowserStore((s) => s.sortColumn)
  const sortDirection = useDataBrowserStore((s) => s.sortDirection)
  const page = useDataBrowserStore((s) => s.page)
  const pageSize = useDataBrowserStore((s) => s.pageSize)
  const filters = useDataBrowserStore((s) => s.filters)
  const showFilterBar = useDataBrowserStore((s) => s.showFilterBar)
  const showColumnPicker = useDataBrowserStore((s) => s.showColumnPicker)

  // Actions
  const actions = useDataBrowserStore(
    useShallow((s) => ({
      selectCube: s.selectCube,
      setVisibleColumns: s.setVisibleColumns,
      toggleColumn: s.toggleColumn,
      setSort: s.setSort,
      clearSort: s.clearSort,
      setPage: s.setPage,
      setPageSize: s.setPageSize,
      setFilters: s.setFilters,
      toggleFilterBar: s.toggleFilterBar,
      setShowColumnPicker: s.setShowColumnPicker,
    }))
  )

  // Metadata
  const { meta, getFieldLabel } = useCubeMeta()

  // Determine default sort: first primary key dimension, or first dimension
  const defaultSortColumn = useMemo(() => {
    if (!meta || !selectedCube) return null
    const cube = meta.cubes.find((c) => c.name === selectedCube)
    if (!cube) return null
    // Look for a primary key dimension first
    const pkDim = cube.dimensions.find((d: any) => d.primaryKey)
    if (pkDim) return pkDim.name
    // Fall back to first dimension
    if (cube.dimensions.length > 0) return cube.dimensions[0].name
    return null
  }, [meta, selectedCube])

  const effectiveSortColumn = sortColumn ?? defaultSortColumn
  const effectiveSortDirection = sortColumn ? sortDirection : 'asc'

  // Build query from store state
  const query = useMemo<CubeQuery | null>(() => {
    if (!selectedCube || visibleColumns.length === 0) return null

    const dimensions = visibleColumns.filter((col) => isDimension(col, meta))
    const measures = visibleColumns.filter((col) => !isDimension(col, meta))

    if (dimensions.length === 0) return null // ungrouped requires at least one dimension

    const q: CubeQuery = {
      dimensions,
      ungrouped: true,
      limit: pageSize,
      offset: page * pageSize,
    }

    if (measures.length > 0) q.measures = measures
    if (filters.length > 0) q.filters = filters
    if (effectiveSortColumn) q.order = { [effectiveSortColumn]: effectiveSortDirection }

    return q
  }, [selectedCube, visibleColumns, filters, effectiveSortColumn, effectiveSortDirection, page, pageSize, meta])

  // Fetch data — keepPreviousData ON so pagination/sort keeps showing
  // stale data while new page loads. We detect cube switches by checking
  // if the data keys match the current columns.
  const {
    rawData: rawDataFromQuery,
    isLoading,
    isFetching,
    isDebouncing,
    error,
    refetch,
  } = useCubeLoadQuery(query, {
    skip: !query,
    debounceMs: 400,
    keepPreviousData: true,
    staleTime: 60000, // 1 minute — prevent unnecessary refetches
  })

  // Detect stale data from a different cube by checking if data keys
  // match the current visible columns. This handles cube switches
  // (keys won't match) while preserving data during pagination/sort
  // (keys still match since it's the same cube).
  const rawData = (() => {
    if (!rawDataFromQuery || rawDataFromQuery.length === 0) return rawDataFromQuery
    const dataKeys = Object.keys(rawDataFromQuery[0] as Record<string, unknown>)
    const matches = visibleColumns.some(col => dataKeys.includes(col))
    return matches ? rawDataFromQuery : null
  })()

  // Loading when: TanStack is loading, or debouncing with no valid data
  const effectiveIsLoading = isLoading || (!rawData && (isDebouncing || isFetching))

  // Compute total page info
  const rowCount = rawData?.length ?? 0
  const hasNextPage = rowCount === pageSize // if we got a full page, there might be more
  const hasPrevPage = page > 0

  return {
    // State
    selectedCube,
    visibleColumns,
    sortColumn: effectiveSortColumn,
    sortDirection: effectiveSortDirection,
    page,
    pageSize,
    filters,
    showFilterBar,
    showColumnPicker,

    // Data
    rawData,
    isLoading: effectiveIsLoading,
    isFetching,
    error,
    query,
    rowCount,
    hasNextPage,
    hasPrevPage,

    // Metadata
    meta,
    getFieldLabel,

    // Actions
    ...actions,
    refetch,
  }
}
