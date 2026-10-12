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
  /** Paging state to start from (`PortletViewState.pagination`). Read one time, on mount. */
  initialState?: unknown
}

/**
 * The paging part of a portlet view state: what a new instance needs to start
 * on the same page, with the same page size and sort, as another instance.
 */
export interface PortletPaginationViewState {
  version: 1
  /** JSON of the query that was paged */
  baseQuery: string
  page: number
  pageSize: number
  sort?: { column: string; direction: 'asc' | 'desc' }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Returns the paging view state when `value` has the expected shape and was
 * taken from the same query, else null. The host passes the value through
 * without reading it, so it is checked here before use.
 */
export function parsePortletPaginationViewState(
  value: unknown,
  baseQuery: string | null,
  authoredPageSize: number | undefined
): PortletPaginationViewState | null {
  if (!isRecord(value) || value.version !== 1) return null
  if (baseQuery === null || value.baseQuery !== baseQuery) return null
  const { page, pageSize, sort } = value
  if (typeof page !== 'number' || !Number.isInteger(page) || page < 0) return null
  if (typeof pageSize !== 'number' || !(PAGE_SIZE_OPTIONS.includes(pageSize) || pageSize === authoredPageSize)) {
    return null
  }
  if (sort === undefined) return { version: 1, baseQuery, page, pageSize }
  if (!isRecord(sort) || typeof sort.column !== 'string' || (sort.direction !== 'asc' && sort.direction !== 'desc')) {
    return null
  }
  return { version: 1, baseQuery, page, pageSize, sort: { column: sort.column, direction: sort.direction } }
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
  /** What a new instance needs to start on this page; undefined when paging is off. */
  viewState?: PortletPaginationViewState
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
  pageSize: authoredPageSize,
  initialState
}: UsePortletPaginationParams): UsePortletPaginationResult {
  const enabled = supportsPagination(chartType) && activeQuery !== null
  const activeQueryJson = activeQuery ? JSON.stringify(activeQuery) : null

  // A start state applies only to the query it was taken from
  const [startState] = useState(() =>
    enabled ? parsePortletPaginationViewState(initialState, activeQueryJson, authoredPageSize) : null
  )

  const [page, setPage] = useState(startState?.page ?? 0)
  const [pageSize, setPageSize] = useState(startState?.pageSize ?? authoredPageSize ?? DEFAULT_PAGE_SIZE)
  const [sort, setSort] = useState<{ column: string; direction: 'asc' | 'desc' } | undefined>(startState?.sort)

  // Follow the author's page size until the viewer overrides it. Starts at the
  // mount-time value, so the first run keeps a start page size.
  const previousAuthoredPageSize = useRef(authoredPageSize)
  useEffect(() => {
    if (authoredPageSize !== previousAuthoredPageSize.current) {
      previousAuthoredPageSize.current = authoredPageSize
      setPageSize(authoredPageSize ?? DEFAULT_PAGE_SIZE)
    }
  }, [authoredPageSize])

  // Reset when the underlying query changes — a dashboard filter or a drill
  // step produces a different result set, where page 3 is meaningless. Starts
  // at the mount-time query, so the first run keeps a start page and sort.
  const previousQueryJson = useRef<string | null>(activeQueryJson)
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

  const viewState = useMemo<PortletPaginationViewState | undefined>(() => {
    if (!enabled || !activeQueryJson) return undefined
    return { version: 1, baseQuery: activeQueryJson, page, pageSize, ...(sort ? { sort } : {}) }
  }, [enabled, activeQueryJson, page, pageSize, sort])

  return { paginatedQuery, pagination, viewState }
}
