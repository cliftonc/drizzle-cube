/**
 * State for the records table, split out of the component so each concern —
 * which columns and in what order, how wide they are, which page and sort —
 * reads on its own.
 *
 * All three are viewer-side. The *author's* choices (assigned columns, page
 * size, widths) arrive through `chartConfig`/`displayConfig`; these hooks layer
 * the viewer's own adjustments over them.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getOrderedColumnsFromQuery } from '../../utils/pivotUtils.js'
import {
  DEFAULT_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  applyColumnOrder,
  columnWidthStorageKey,
  loadColumnOrder,
  loadColumnWidths,
  moveColumn,
  saveColumnOrder,
  saveColumnWidths,
  sortRows
} from '../../utils/recordsTableUtils.js'
import type { ChartAxisConfig, ChartPagination, CubeQuery } from '../../types.js'

export const DEFAULT_PAGE_SIZE = 25

type SortState = { column: string; direction: 'asc' | 'desc' }

/**
 * Which columns to render, in which order.
 *
 * The author's arrangement comes from the Columns drop zone; a viewer can drag
 * a header on top of it, and that order is remembered per column set. It is
 * *reconciled* rather than substituted, so a column the author adds later still
 * appears instead of being swallowed by a stale local order.
 */
export function useRecordsColumns(params: {
  rows: Record<string, unknown>[]
  chartConfig?: ChartAxisConfig
  queryObject?: CubeQuery
}) {
  const { rows, chartConfig, queryObject } = params

  const baseColumns = useMemo(
    () => resolveColumns(rows, chartConfig, queryObject),
    [rows, chartConfig, queryObject]
  )

  const storageKey = useMemo(() => columnWidthStorageKey(baseColumns), [baseColumns])
  const [columnOrder, setColumnOrder] = useState<string[]>([])

  useEffect(() => {
    setColumnOrder(loadColumnOrder(storageKey))
  }, [storageKey])

  const columns = useMemo(
    () => applyColumnOrder(baseColumns, columnOrder),
    [baseColumns, columnOrder]
  )

  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  // A drag ending on the header it started from can still produce a click;
  // without this, reordering would also toggle the sort.
  const didDragRef = useRef(false)

  const startColumnDrag = useCallback((column: string) => {
    didDragRef.current = true
    setDraggedColumn(column)
  }, [])

  const endColumnDrag = useCallback(() => {
    setDraggedColumn(null)
    requestAnimationFrame(() => { didDragRef.current = false })
  }, [])

  const dropColumn = useCallback((target: string) => {
    const source = draggedColumn
    endColumnDrag()
    if (!source || source === target) return
    const next = moveColumn(columns, source, target)
    setColumnOrder(next)
    saveColumnOrder(storageKey, next)
  }, [columns, draggedColumn, endColumnDrag, storageKey])

  return { columns, storageKey, draggedColumn, didDragRef, startColumnDrag, endColumnDrag, dropColumn }
}

function resolveColumns(
  rows: Record<string, unknown>[],
  chartConfig: ChartAxisConfig | undefined,
  queryObject: CubeQuery | undefined
): string[] {
  const available = Object.keys(rows[0] ?? {})
  const hidden = new Set(chartConfig?.hiddenColumns ?? [])

  const configured = chartConfig?.columns?.filter(column => available.includes(column))
  if (configured && configured.length > 0) {
    return configured.filter(column => !hidden.has(column))
  }

  // Nothing assigned: follow the order the query asked for, then anything else
  // the rows happen to carry.
  const fromQuery = getOrderedColumnsFromQuery(queryObject).filter(column => available.includes(column))
  const ordered = fromQuery.length > 0
    ? [...fromQuery, ...available.filter(column => !fromQuery.includes(column))]
    : available

  return ordered.filter(column => !hidden.has(column))
}

/**
 * Drag-resizable column widths, remembered per column set.
 *
 * A chart has no portlet id and no write path back to `displayConfig`, so an
 * authored `columnWidths` acts as the default a viewer's own drags layer over —
 * the same arrangement the data browser uses.
 */
export function useColumnWidths(params: {
  columns: string[]
  storageKey: string
  authored?: Record<string, number>
}) {
  const { columns, storageKey, authored } = params

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const tableRef = useRef<HTMLTableElement>(null)
  const didResizeRef = useRef(false)

  useEffect(() => {
    setColumnWidths({ ...(authored ?? {}), ...loadColumnWidths(storageKey) })
  }, [storageKey, authored])

  const startResize = useCallback((event: React.MouseEvent, column: string) => {
    event.preventDefault()
    event.stopPropagation()

    const startX = event.clientX
    didResizeRef.current = false

    // Freeze every column at its rendered width first, so the ones either side
    // of the handle do not jump when this one changes.
    const snapshot: Record<string, number> = {}
    tableRef.current?.querySelectorAll('thead th').forEach((th, index) => {
      const name = columns[index]
      if (name) snapshot[name] = th.getBoundingClientRect().width
    })

    const startWidth = snapshot[column] ?? DEFAULT_COLUMN_WIDTH
    let latest = snapshot

    const onMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX
      if (Math.abs(diff) > 2) didResizeRef.current = true
      latest = { ...latest, [column]: Math.max(MIN_COLUMN_WIDTH, startWidth + diff) }
      setColumnWidths(latest)
    }

    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      saveColumnWidths(storageKey, latest)
      // Held one frame so the header's click handler can see it and not sort.
      requestAnimationFrame(() => { didResizeRef.current = false })
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [columns, storageKey])

  const totalWidth = Object.keys(columnWidths).length > 0
    ? columns.reduce((sum, column) => sum + (columnWidths[column] ?? DEFAULT_COLUMN_WIDTH), 0)
    : undefined

  return { columnWidths, totalWidth, tableRef, didResizeRef, startResize }
}

/**
 * Sorting and paging, server-side when the host offers it.
 *
 * With a `pagination` prop the host re-queries, so both must go through it:
 * sorting only the loaded page would put the wrong rows on page 1. Without one
 * — the AnalysisBuilder preview, the notebook, plugin hosts — the table sorts
 * and pages over the rows it already has.
 */
export function useRecordsPaging(params: {
  rows: Record<string, unknown>[]
  pagination?: ChartPagination
  authoredPageSize?: number
}) {
  const { rows, pagination, authoredPageSize } = params

  const [localSort, setLocalSort] = useState<SortState | null>(null)
  const [localPage, setLocalPage] = useState(0)

  const isServerPaged = Boolean(pagination)
  const sort = pagination ? pagination.sort ?? null : localSort

  const toggleSort = useCallback((column: string) => {
    if (pagination) {
      pagination.toggleSort(column)
      return
    }
    setLocalSort(current => {
      if (current?.column !== column) return { column, direction: 'asc' }
      return current.direction === 'asc' ? { column, direction: 'desc' } : null
    })
  }, [pagination])

  const sortedRows = useMemo(
    () => (!isServerPaged && localSort ? sortRows(rows, localSort.column, localSort.direction) : rows),
    [rows, isServerPaged, localSort]
  )

  const pageSize = pagination?.pageSize ?? authoredPageSize ?? DEFAULT_PAGE_SIZE
  const page = pagination?.page ?? localPage
  // Server-side the count is whatever the server reported; falling back to the
  // loaded page keeps the pager honest before the first total arrives.
  const rowCount = isServerPaged
    ? pagination?.total ?? page * pageSize + sortedRows.length
    : sortedRows.length
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize))

  const goToPage = useCallback((next: number) => {
    if (pagination) pagination.setPage(next)
    else setLocalPage(next)
  }, [pagination])

  // A shrinking result set can leave the viewer past the last page.
  useEffect(() => {
    if (isServerPaged) return
    setLocalPage(current => Math.min(current, pageCount - 1))
  }, [pageCount, isServerPaged])

  const visibleRows = useMemo(
    () => (isServerPaged ? sortedRows : sortedRows.slice(page * pageSize, page * pageSize + pageSize)),
    [sortedRows, isServerPaged, page, pageSize]
  )

  return {
    sort,
    toggleSort,
    visibleRows,
    page,
    pageSize,
    pageCount,
    rowCount,
    goToPage,
    showPager: rowCount > pageSize
  }
}
