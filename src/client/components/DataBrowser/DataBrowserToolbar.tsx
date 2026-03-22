/**
 * DataBrowserToolbar
 *
 * Top toolbar with filter toggle, column picker, row count, and pagination.
 */

import { getIcon } from '../../icons'

const FilterIcon = getIcon('filter')
const ColumnsIcon = getIcon('settings')
const ChevronLeftIcon = getIcon('chevronLeft')
const ChevronRightIcon = getIcon('chevronRight')
const RefreshIcon = getIcon('refresh')

interface DataBrowserToolbarProps {
  // Filter state
  showFilterBar: boolean
  filterCount: number
  onToggleFilterBar: () => void

  // Column picker
  onToggleColumnPicker: () => void

  // Pagination
  page: number
  pageSize: number
  rowCount: number
  hasNextPage: boolean
  hasPrevPage: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void

  // Status
  isFetching: boolean
  onRefresh: () => void
}

export default function DataBrowserToolbar({
  showFilterBar,
  filterCount,
  onToggleFilterBar,
  onToggleColumnPicker,
  page,
  pageSize,
  rowCount,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  onPageSizeChange,
  isFetching,
  onRefresh,
}: DataBrowserToolbarProps) {
  return (
    <div className="dc:flex dc:items-center dc:gap-2 dc:px-3 dc:py-2 dc:border-b border-dc-border bg-dc-surface-secondary">
      {/* Filter toggle */}
      <button
        onClick={onToggleFilterBar}
        className={`dc:flex dc:items-center dc:gap-1.5 dc:px-2.5 dc:py-1.5 dc:text-xs dc:font-medium dc:rounded dc:border dc:transition-colors ${
          showFilterBar
            ? 'border-dc-accent bg-dc-accent-bg text-dc-accent'
            : 'border-dc-border bg-dc-surface text-dc-text dc:hover:bg-dc-surface-hover'
        }`}
      >
        <FilterIcon className="dc:w-3.5 dc:h-3.5" />
        Filters
        {filterCount > 0 && (
          <span className="dc:inline-flex dc:items-center dc:justify-center dc:w-4 dc:h-4 dc:text-[10px] dc:font-bold dc:rounded-full bg-dc-accent text-dc-surface">
            {filterCount}
          </span>
        )}
      </button>

      {/* Columns button */}
      <button
        onClick={onToggleColumnPicker}
        className="dc:flex dc:items-center dc:gap-1.5 dc:px-2.5 dc:py-1.5 dc:text-xs dc:font-medium dc:rounded dc:border border-dc-border bg-dc-surface text-dc-text dc:hover:bg-dc-surface-hover dc:transition-colors"
      >
        <ColumnsIcon className="dc:w-3.5 dc:h-3.5" />
        Columns
      </button>

      {/* Spacer */}
      <div className="dc:flex-1" />

      {/* Row count */}
      <span className="dc:text-xs text-dc-text-muted">
        {rowCount} rows
      </span>

      {/* Refresh */}
      <button
        onClick={onRefresh}
        className="dc:p-1 dc:rounded dc:hover:bg-dc-surface-hover dc:transition-colors"
        title="Refresh"
      >
        <RefreshIcon className={`dc:w-3.5 dc:h-3.5 text-dc-text-muted ${isFetching ? 'dc:animate-spin' : ''}`} />
      </button>

      {/* Page size selector */}
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="dc:text-xs dc:px-1.5 dc:py-1 dc:rounded dc:border border-dc-border bg-dc-surface text-dc-text dc:outline-none"
      >
        <option value={20}>20</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>

      {/* Pagination */}
      <div className="dc:flex dc:items-center dc:gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="dc:p-1 dc:rounded dc:hover:bg-dc-surface-hover dc:disabled:opacity-30 dc:disabled:cursor-not-allowed dc:transition-colors"
        >
          <ChevronLeftIcon className="dc:w-4 dc:h-4 text-dc-text-muted" />
        </button>
        <span className="dc:text-xs dc:font-medium text-dc-text dc:min-w-[2rem] dc:text-center">
          {page + 1}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="dc:p-1 dc:rounded dc:hover:bg-dc-surface-hover dc:disabled:opacity-30 dc:disabled:cursor-not-allowed dc:transition-colors"
        >
          <ChevronRightIcon className="dc:w-4 dc:h-4 text-dc-text-muted" />
        </button>
      </div>
    </div>
  )
}
