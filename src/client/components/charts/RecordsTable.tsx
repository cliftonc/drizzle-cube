/**
 * Records Table
 *
 * A record-grain listing (as opposed to DataTable's aggregate view): ordered
 * columns with per-column formats, hidden columns fetched for row context,
 * click-to-sort headers, drag-resizable widths and pagination.
 *
 * Hand-rolled rather than built on a table library: the sort/resize/<colgroup>
 * patterns already exist in `DataBrowser/DataBrowserTable.tsx` (copied, not
 * imported — that component reads the data-browser store), and badge/progress
 * cells are bespoke either way.
 */

import React, { useCallback, useMemo } from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'
import { useCubeMeta } from '../../providers/CubeProvider.js'
import { ChartEmptyState } from './ChartStates.js'
import { getIcon } from '../../icons/index.js'
import { buildRowUrl } from '../../utils/rowLinkUtils.js'
import { DEFAULT_COLUMN_WIDTH, renderCellValue, type RenderedCell } from '../../utils/recordsTableUtils.js'
import { useColumnWidths, useRecordsColumns, useRecordsPaging } from './recordsTableHooks.js'
import type { ChartProps, ColumnFormatConfig } from '../../types.js'

const SortAscIcon = getIcon('chevronUp')
const SortDescIcon = getIcon('chevronDown')

const RecordsTable = React.memo(function RecordsTable({
  data,
  chartConfig,
  displayConfig = {},
  queryObject,
  colorPalette,
  height = 300,
  onDataPointClick,
  drillEnabled,
  pagination
}: ChartProps) {
  const { t } = useTranslation()
  const { getFieldLabel } = useCubeMeta()

  const rows = useMemo(() => (Array.isArray(data) ? (data as Record<string, unknown>[]) : []), [data])
  const columnFormats = displayConfig.columnFormats ?? {}

  const {
    columns,
    storageKey,
    draggedColumn,
    didDragRef,
    startColumnDrag,
    endColumnDrag,
    dropColumn
  } = useRecordsColumns({ rows, chartConfig, queryObject })

  const { columnWidths, totalWidth, tableRef, didResizeRef, startResize } = useColumnWidths({
    columns,
    storageKey,
    authored: displayConfig.columnWidths
  })

  const {
    sort,
    toggleSort,
    visibleRows,
    page,
    pageSize,
    pageCount,
    rowCount,
    goToPage,
    showPager
  } = useRecordsPaging({ rows, pagination, authoredPageSize: displayConfig.pageSize })

  const handleHeaderClick = useCallback((column: string) => {
    // Suppressed after a resize or reorder drag, which can still emit a click.
    if (didResizeRef.current || didDragRef.current) return
    toggleSort(column)
  }, [didDragRef, didResizeRef, toggleSort])

  // A configured row link wins over drill: the row becomes a real anchor, so
  // modifier-clicks and "open in new tab" behave as they do anywhere else.
  const rowLink = displayConfig.rowLink
  const rowClickable = Boolean(!rowLink && drillEnabled && onDataPointClick)

  const handleRowClick = useCallback((row: Record<string, unknown>, column: string, event: React.MouseEvent) => {
    if (!rowClickable) return
    onDataPointClick?.({
      dataPoint: row,
      clickedField: column,
      xValue: row[column],
      position: { x: event.clientX, y: event.clientY },
      nativeEvent: event
    })
  }, [onDataPointClick, rowClickable])

  if (rows.length === 0) {
    return <ChartEmptyState height={height} hint={t('chart.runtime.noDataHint.table')} />
  }

  if (columns.length === 0) {
    return (
      <ChartEmptyState
        height={height}
        titleKey="chart.runtime.recordsTable.noColumns"
        hint={t('chart.runtime.table.invalidStructure')}
      />
    )
  }

  const firstRow = page * pageSize + 1
  const lastRow = Math.min(rowCount, page * pageSize + visibleRows.length)

  return (
    <div className="dc:flex dc:flex-col dc:w-full" style={{ height }}>
      <div className="dc:flex-1 dc:overflow-auto">
        <table
          ref={tableRef}
          className="dc:border-collapse"
          style={{ tableLayout: 'fixed', width: totalWidth, minWidth: '100%' }}
        >
          <colgroup>
            {columns.map(column => (
              <col key={column} style={{ width: columnWidths[column] ?? DEFAULT_COLUMN_WIDTH }} />
            ))}
          </colgroup>
          <thead className="bg-dc-surface-secondary dc:sticky dc:top-0 dc:z-20">
            <tr>
              {columns.map(column => (
                <HeaderCell
                  key={column}
                  column={column}
                  label={columnFormats[column]?.label || getFieldLabel(column)}
                  align={columnFormats[column]?.align ?? defaultAlign(columnFormats[column])}
                  sortDirection={sort?.column === column ? sort.direction : undefined}
                  isDropTarget={draggedColumn !== null && draggedColumn !== column}
                  onClick={handleHeaderClick}
                  onResizeStart={startResize}
                  onDragStart={startColumnDrag}
                  onDragEnd={endColumnDrag}
                  onDrop={dropColumn}
                />
              ))}
            </tr>
          </thead>
          <tbody className="bg-dc-surface">
            {visibleRows.map((row, index) => (
              <Row
                key={index}
                row={row}
                columns={columns}
                columnFormats={columnFormats}
                colorPalette={colorPalette}
                href={rowLink ? buildRowUrl(rowLink.urlTemplate, row) : null}
                target={rowLink?.target}
                clickable={rowClickable}
                onCellClick={handleRowClick}
              />
            ))}
          </tbody>
        </table>
      </div>

      {showPager && (
        <div className="dc:flex dc:items-center dc:justify-between dc:gap-2 dc:px-3 dc:py-1.5 dc:border-t border-dc-border dc:text-xs text-dc-text-secondary">
          <span>{t('chart.runtime.recordsTable.rowRange', { from: firstRow, to: lastRow, total: rowCount })}</span>
          <div className="dc:flex dc:items-center dc:gap-1">
            <PagerButton
              label={t('chart.runtime.recordsTable.previousPage')}
              disabled={page === 0}
              onClick={() => goToPage(Math.max(0, page - 1))}
            >
              ‹
            </PagerButton>
            <span>{t('chart.runtime.recordsTable.pageOf', { page: page + 1, pages: pageCount })}</span>
            <PagerButton
              label={t('chart.runtime.recordsTable.nextPage')}
              disabled={page >= pageCount - 1}
              onClick={() => goToPage(Math.min(pageCount - 1, page + 1))}
            >
              ›
            </PagerButton>
          </div>
        </div>
      )}
    </div>
  )
})

export default RecordsTable

/** Numeric-ish formats read better right-aligned unless the author says otherwise. */
function defaultAlign(format: ColumnFormatConfig | undefined): 'left' | 'right' {
  return format?.kind === 'number' ? 'right' : 'left'
}

interface HeaderCellProps {
  column: string
  label: string
  align: 'left' | 'right'
  sortDirection?: 'asc' | 'desc'
  isDropTarget: boolean
  onClick: (column: string) => void
  onResizeStart: (event: React.MouseEvent, column: string) => void
  onDragStart: (column: string) => void
  onDragEnd: () => void
  onDrop: (column: string) => void
}

function HeaderCell({
  column,
  label,
  align,
  sortDirection,
  isDropTarget,
  onClick,
  onResizeStart,
  onDragStart,
  onDragEnd,
  onDrop
}: HeaderCellProps) {
  return (
    <th
      draggable
      onDragStart={(event) => {
        // Required for Firefox to start the drag at all.
        event.dataTransfer.setData('text/plain', column)
        event.dataTransfer.effectAllowed = 'move'
        onDragStart(column)
      }}
      onDragOver={(event) => { if (isDropTarget) event.preventDefault() }}
      onDrop={(event) => { event.preventDefault(); onDrop(column) }}
      onDragEnd={onDragEnd}
      onClick={() => onClick(column)}
      className={`dc:relative dc:px-3 dc:py-2 dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider dc:cursor-pointer dc:select-none dc:border-b border-dc-border ${
        align === 'right' ? 'dc:text-right' : 'dc:text-left'
      }${isDropTarget ? ' dc:border-l-2 border-dc-accent' : ''}`}
    >
      <div className={`dc:flex dc:items-center dc:gap-1.5 dc:overflow-hidden${align === 'right' ? ' dc:justify-end' : ''}`}>
        <span className="dc:truncate">{label}</span>
        {sortDirection === 'asc' && <SortAscIcon className="dc:w-3 dc:h-3 text-dc-accent dc:shrink-0" />}
        {sortDirection === 'desc' && <SortDescIcon className="dc:w-3 dc:h-3 text-dc-accent dc:shrink-0" />}
      </div>
      <div
        onMouseDown={(event) => onResizeStart(event, column)}
        className="dc:absolute dc:top-0 dc:right-0 dc:w-1.5 dc:h-full dc:cursor-col-resize dc:hover:bg-dc-accent dc:opacity-0 dc:hover:opacity-100 dc:transition-opacity dc:z-30"
      />
    </th>
  )
}

interface RowProps {
  row: Record<string, unknown>
  columns: string[]
  columnFormats: Record<string, ColumnFormatConfig>
  colorPalette?: ChartProps['colorPalette']
  href: string | null
  target?: 'self' | 'blank'
  clickable: boolean
  onCellClick: (row: Record<string, unknown>, column: string, event: React.MouseEvent) => void
}

function Row({ row, columns, columnFormats, colorPalette, href, target, clickable, onCellClick }: RowProps) {
  return (
    <tr className={`dc:border-b border-dc-border hover:bg-dc-surface-secondary${clickable ? ' dc:cursor-pointer' : ''}`}>
      {columns.map(column => {
        const format = columnFormats[column]
        const align = format?.align ?? defaultAlign(format)
        return (
          <td
            key={column}
            onClick={(event) => onCellClick(row, column, event)}
            className={`dc:px-3 dc:py-1.5 dc:text-sm text-dc-text dc:overflow-hidden${
              align === 'right' ? ' dc:text-right dc:tabular-nums' : ''
            }`}
          >
            <CellContent
              cell={renderCellValue(row[column], format)}
              colorPalette={colorPalette}
              href={href}
              target={target}
            />
          </td>
        )
      })}
    </tr>
  )
}

/**
 * A cell, wrapped in the row's link when one resolves. An unresolvable or
 * unsafe template yields no anchor rather than a dead one.
 */
function CellContent({
  cell,
  colorPalette,
  href,
  target
}: {
  cell: RenderedCell
  colorPalette?: ChartProps['colorPalette']
  href: string | null
  target?: 'self' | 'blank'
}) {
  const content = <Cell cell={cell} colorPalette={colorPalette} />
  if (!href) return content

  return (
    <a
      href={href}
      target={target === 'blank' ? '_blank' : undefined}
      rel={target === 'blank' ? 'noopener noreferrer' : undefined}
      className="dc:block dc:no-underline dc:text-inherit hover:dc:underline"
    >
      {content}
    </a>
  )
}

function Cell({ cell, colorPalette }: { cell: RenderedCell; colorPalette?: ChartProps['colorPalette'] }) {
  if (cell.kind === 'badge') {
    const color = cell.colorIndex !== undefined ? colorPalette?.colors[cell.colorIndex] : undefined
    return (
      <span
        className="dc:inline-block dc:px-2 dc:py-0.5 dc:rounded-full dc:text-xs dc:font-medium dc:truncate dc:max-w-full"
        style={color
          ? { backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }
          : { backgroundColor: 'var(--dc-surface-secondary)', color: 'var(--dc-text-secondary)', border: '1px solid var(--dc-border)' }}
      >
        {cell.text}
      </span>
    )
  }

  if (cell.kind === 'progress') {
    return (
      <div className="dc:flex dc:items-center dc:gap-2">
        {cell.style === 'circle'
          ? <ProgressRing fraction={cell.fraction} label={cell.text} />
          : (
            // Outlined track, so the full 0-100% extent is visible and a
            // near-complete bar is distinguishable from a complete one.
            <div className="dc:flex-1 dc:h-2 dc:rounded-full dc:overflow-hidden dc:border border-dc-border bg-dc-surface-secondary dc:min-w-[2rem]">
              <div
                className="dc:h-full dc:rounded-full bg-dc-primary"
                style={{ width: `${cell.fraction * 100}%` }}
              />
            </div>
          )}
        {/*
          Fixed width, not shrink-to-fit: the track is flexible, so a wider
          label ("£117K") would shorten its row's bar and two equal values
          would draw different lengths. Right-aligned and tabular so the
          numbers line up as a column.
        */}
        <span className="dc:w-16 dc:shrink-0 dc:text-right dc:text-xs dc:tabular-nums dc:truncate">
          {cell.text}
        </span>
      </div>
    )
  }

  return <span className="dc:truncate dc:block">{cell.text}</span>
}

const RING_SIZE = 18
const RING_STROKE = 3
const RING_CENTRE = RING_SIZE / 2
const RING_RADIUS = RING_CENTRE - RING_STROKE / 2

/**
 * The compact alternative to the progress bar: a ring that fills 0→100%, so a
 * progress column can be as narrow as its value label.
 *
 * `pathLength` normalises the circumference to 100, which lets the dash offset
 * be the percentage remaining without any 2πr arithmetic. The ring alone
 * carries the value, hence the `img` role and label.
 */
function ProgressRing({ fraction, label }: { fraction: number; label: string }) {
  return (
    <svg
      role="img"
      aria-label={label}
      width={RING_SIZE}
      height={RING_SIZE}
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      className="dc:shrink-0"
    >
      <circle
        cx={RING_CENTRE}
        cy={RING_CENTRE}
        r={RING_RADIUS}
        fill="none"
        stroke="var(--dc-surface-secondary)"
        strokeWidth={RING_STROKE}
      />
      {fraction > 0 && (
        <circle
          cx={RING_CENTRE}
          cy={RING_CENTRE}
          r={RING_RADIUS}
          fill="none"
          stroke="var(--dc-primary)"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={100 - fraction * 100}
          transform={`rotate(-90 ${RING_CENTRE} ${RING_CENTRE})`}
        />
      )}
    </svg>
  )
}

function PagerButton({
  label,
  disabled,
  onClick,
  children
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="dc:px-2 dc:py-0.5 dc:border border-dc-border dc:rounded-sm bg-dc-surface text-dc-text hover:bg-dc-surface-secondary dc:disabled:opacity-40 dc:disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}
