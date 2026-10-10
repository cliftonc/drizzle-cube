/**
 * Server-side paging and sorting for a records-table portlet.
 *
 * Mirrors `usePortletDrillState`: it holds a little local state, layers it over
 * the query the portlet would otherwise run, and resets when that base query
 * changes.
 *
 * Sort belongs here rather than in the table component because paging is
 * server-side — re-ordering only the loaded page would put the wrong rows on
 * page 1, which is precisely the failure that record-grain listings over
 * generated attribute dimensions exist to avoid.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChartPagination, ChartType, CubeQuery } from '../../types.js'

/** Fixed page sizes, matching the records table's own `pageSize` option. */
export const PAGE_SIZE_OPTIONS = [25, 50, 100]
const DEFAULT_PAGE_SIZE = 25

export interface UsePortletPaginationParams {
  chartType: ChartType
  /** The query to paginate — the drilled query when one is active, else the base query. */
  activeQuery: CubeQuery | null
  /** Authored page size from the portlet's display config. */
  pageSize?: number
}

export interface UsePortletPaginationResult {
  /** `activeQuery` with limit/offset/order/total merged in, or it unchanged when paging is off. */
  paginatedQuery: CubeQuery | null
  /**
   * Passed to the chart as `ChartProps.pagination`; undefined when paging is
   * off. `total` is left unset here — it arrives with the response, so the
   * caller fills it in from the result set.
   */
  pagination?: Omit<ChartPagination, 'total'>
}

/**
 * Only the records table pages server-side. Every other chart renders its whole
 * result set, so adding limit/offset would silently truncate it.
 */
function supportsPagination(chartType: ChartType): boolean {
  return chartType === 'recordsTable'
}

export function usePortletPagination({
  chartType,
  activeQuery,
  pageSize: authoredPageSize
}: UsePortletPaginationParams): UsePortletPaginationResult {
  const enabled = supportsPagination(chartType) && activeQuery !== null

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(authoredPageSize ?? DEFAULT_PAGE_SIZE)
  const [sort, setSort] = useState<{ column: string; direction: 'asc' | 'desc' } | undefined>()

  // Follow the author's page size until the viewer overrides it.
  useEffect(() => {
    setPageSize(authoredPageSize ?? DEFAULT_PAGE_SIZE)
  }, [authoredPageSize])

  // Reset when the underlying query changes — a dashboard filter or a drill
  // step produces a different result set, where page 3 is meaningless.
  const activeQueryJson = activeQuery ? JSON.stringify(activeQuery) : null
  const previousQueryJson = useRef<string | null>(null)
  useEffect(() => {
    if (activeQueryJson !== previousQueryJson.current) {
      previousQueryJson.current = activeQueryJson
      setPage(0)
      setSort(undefined)
    }
  }, [activeQueryJson])

  const toggleSort = useCallback((column: string) => {
    setPage(0)
    setSort(current => {
      if (current?.column !== column) return { column, direction: 'asc' }
      return current.direction === 'asc' ? { column, direction: 'desc' } : undefined
    })
  }, [])

  const changePageSize = useCallback((next: number) => {
    setPageSize(next)
    setPage(0)
  }, [])

  const paginatedQuery = useMemo<CubeQuery | null>(() => {
    if (!enabled || !activeQuery) return activeQuery
    return {
      ...activeQuery,
      // Always explicit: an offset without a limit picks up a default limit
      // further down the stack.
      limit: pageSize,
      offset: page * pageSize,
      total: true,
      order: sort ? { [sort.column]: sort.direction } : activeQuery.order
    }
  }, [enabled, activeQuery, page, pageSize, sort])

  const pagination = useMemo<Omit<ChartPagination, 'total'> | undefined>(() => {
    if (!enabled) return undefined
    return {
      page,
      pageSize,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
      sort,
      setPage,
      setPageSize: changePageSize,
      toggleSort
    }
  }, [enabled, page, pageSize, sort, changePageSize, toggleSort])

  return { paginatedQuery, pagination }
}
