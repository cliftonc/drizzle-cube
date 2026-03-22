/**
 * DataBrowserTable
 *
 * Sortable data table with resizable columns, type badges, and click-to-sort headers.
 * Designed for browsing raw row-level data from ungrouped queries.
 *
 * Column widths are stored in the Zustand store (cosmetic-only slice)
 * and never affect query construction or data fetching.
 */

import React, { useCallback, useRef } from 'react'
import { getIcon } from '../../icons'
import { getFieldType } from '../../hooks/useDataBrowser'
import { useDataBrowserStore } from '../../stores/dataBrowserStore'
import LoadingIndicator from '../LoadingIndicator'

const SortAscIcon = getIcon('chevronUp')
const SortDescIcon = getIcon('chevronDown')

interface DataBrowserTableProps {
  data: unknown[] | null
  columns: string[]
  sortColumn: string | null
  sortDirection: 'asc' | 'desc'
  onSort: (column: string) => void
  getFieldLabel: (field: string) => string
  meta: any
  isLoading: boolean
  isFetching: boolean
  selectedCube: string | null
  loadingComponent?: React.ReactNode
}

function getTypeLabel(fieldName: string, meta: any): string {
  const type = getFieldType(fieldName, meta)
  const typeMap: Record<string, string> = {
    string: 'text',
    number: 'num',
    time: 'time',
    boolean: 'bool',
    sum: 'num',
    avg: 'num',
    min: 'num',
    max: 'num',
  }
  return typeMap[type] || type
}

function isNumericType(fieldName: string, meta: any): boolean {
  return getTypeLabel(fieldName, meta) === 'num'
}

function formatCellValue(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'number') return value.toLocaleString()
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

const MIN_COL_WIDTH = 60
const DEFAULT_COL_WIDTH = 150

export default React.memo(function DataBrowserTable({
  data,
  columns,
  sortColumn,
  sortDirection,
  onSort,
  getFieldLabel,
  meta,
  isLoading,
  isFetching,
  selectedCube,
  loadingComponent,
}: DataBrowserTableProps) {
  // Column widths from store (cosmetic only — never affects queries)
  const columnWidths = useDataBrowserStore((s) => s.columnWidths)
  const storeSetColumnWidth = useDataBrowserStore((s) => s.setColumnWidth)
  const storeSetColumnWidths = useDataBrowserStore((s) => s.setColumnWidths)

  const tableRef = useRef<HTMLTableElement>(null)
  // Suppress the next click on <th> after a resize drag
  const didResizeRef = useRef(false)

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, column: string) => {
      e.preventDefault()
      e.stopPropagation()

      const startX = e.clientX
      didResizeRef.current = false

      // Snapshot all column widths from the DOM so other columns stay fixed
      const table = tableRef.current
      if (table) {
        const ths = table.querySelectorAll('thead th')
        const snapshot: Record<string, number> = {}
        ths.forEach((th, idx) => {
          const col = columns[idx]
          if (col) snapshot[col] = th.getBoundingClientRect().width
        })
        storeSetColumnWidths(snapshot)
      }

      const th = (e.target as HTMLElement).closest('th')
      const startWidth = th ? th.getBoundingClientRect().width : DEFAULT_COL_WIDTH

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const diff = moveEvent.clientX - startX
        if (Math.abs(diff) > 2) didResizeRef.current = true
        const newWidth = Math.max(MIN_COL_WIDTH, startWidth + diff)
        storeSetColumnWidth(column, newWidth)
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        // Keep didResizeRef true briefly so the click handler can check it
        requestAnimationFrame(() => { didResizeRef.current = false })
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [columns, storeSetColumnWidth, storeSetColumnWidths]
  )

  const handleHeaderClick = useCallback(
    (column: string) => {
      if (didResizeRef.current) return // suppress click after resize drag
      onSort(column)
    },
    [onSort]
  )

  // Compute table width when column widths are explicitly set
  const hasExplicitWidths = Object.keys(columnWidths).length > 0
  const tableWidth = hasExplicitWidths
    ? columns.reduce((sum, col) => sum + (columnWidths[col] ?? DEFAULT_COL_WIDTH), 0)
    : undefined

  // No cube selected
  if (!selectedCube) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:h-full">
        <div className="dc:text-center text-dc-text-muted">
          <div className="dc:text-base dc:font-semibold dc:mb-1">Select a cube</div>
          <div className="dc:text-sm text-dc-text-secondary">
            Choose a cube from the sidebar to browse its data
          </div>
        </div>
      </div>
    )
  }

  // Loading: no data yet (initial load, cube switch, or fetching)
  if (!data) {
    return (
      <div className="dc:flex dc:flex-col dc:items-center dc:justify-center dc:h-full dc:gap-3">
        {loadingComponent ?? (
          <>
            <LoadingIndicator size="md" />
            <div className="dc:text-sm text-dc-text-muted">Loading data...</div>
          </>
        )}
      </div>
    )
  }

  // Empty result set (query completed but returned no rows)
  if (data.length === 0 && !isLoading && !isFetching) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:h-full">
        <div className="dc:text-center text-dc-text-muted">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">No data</div>
          <div className="dc:text-xs text-dc-text-secondary">No rows returned for this query</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dc:relative dc:flex-1 dc:overflow-auto">
      {isFetching && (
        <div className="dc:absolute dc:inset-0 bg-dc-surface dc:opacity-40 dc:z-10 dc:pointer-events-none" />
      )}

      <table ref={tableRef} className="dc:border-collapse" style={{ tableLayout: 'fixed', width: tableWidth, minWidth: '100%' }}>
        <colgroup>
          {columns.map((column) => (
            <col key={column} style={{ width: columnWidths[column] ?? DEFAULT_COL_WIDTH }} />
          ))}
        </colgroup>
        <thead className="dc:sticky dc:top-0 dc:z-20" style={{ backgroundColor: 'var(--dc-surface-secondary)' }}>
          <tr>
            {columns.map((column, colIdx) => {
              const isSorted = sortColumn === column
              const label = getFieldLabel(column)
              const typeLabel = getTypeLabel(column, meta)
              const isLast = colIdx === columns.length - 1
              const isNumeric = isNumericType(column, meta)

              return (
                <th
                  key={column}
                  onClick={() => handleHeaderClick(column)}
                  className={`dc:relative dc:px-3 dc:py-2 dc:text-xs dc:font-normal dc:cursor-pointer dc:select-none dc:border-b border-dc-border dc:transition-colors${!isLast ? ' dc:border-r' : ''}${isNumeric ? ' dc:text-right' : ' dc:text-left'}`}
                  style={{ color: 'var(--dc-text-muted)' }}
                >
                  <div className={`dc:flex dc:items-center dc:gap-1.5 dc:overflow-hidden${isNumeric ? ' dc:justify-end' : ''}`}>
                    <span className="dc:font-medium dc:truncate" style={{ color: 'var(--dc-text)' }}>{label}</span>
                    <span className="dc:text-[10px] dc:opacity-50 dc:shrink-0">{typeLabel}</span>
                    {isSorted && (
                      sortDirection === 'asc'
                        ? <SortAscIcon className="dc:w-3 dc:h-3 text-dc-accent dc:shrink-0" />
                        : <SortDescIcon className="dc:w-3 dc:h-3 text-dc-accent dc:shrink-0" />
                    )}
                  </div>
                  {/* Resize handle */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, column)}
                    className="dc:absolute dc:top-0 dc:right-0 dc:w-1.5 dc:h-full dc:cursor-col-resize dc:hover:bg-dc-accent dc:opacity-0 dc:hover:opacity-100 dc:transition-opacity"
                    style={{ zIndex: 30 }}
                  />
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {(data as Record<string, unknown>[]).map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="dc:border-b border-dc-border"
              style={{ transition: 'background-color 0.1s' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--dc-surface-hover, rgba(0,0,0,0.02))' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '' }}
            >
              {columns.map((column, colIdx) => {
                const isLast = colIdx === columns.length - 1
                const isNumeric = isNumericType(column, meta)
                return (
                  <td
                    key={column}
                    className={`dc:px-3 dc:py-1.5 dc:text-sm dc:overflow-hidden dc:text-ellipsis dc:whitespace-nowrap${!isLast ? ' dc:border-r border-dc-border' : ''}${isNumeric ? ' dc:text-right dc:tabular-nums' : ''}`}
                    style={{ color: 'var(--dc-text)' }}
                  >
                    {formatCellValue(row[column])}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})
