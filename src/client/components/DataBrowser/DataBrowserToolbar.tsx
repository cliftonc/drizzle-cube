/**
 * DataBrowserToolbar
 *
 * Top toolbar with filter toggle, column picker, row count, and pagination.
 */

import { getIcon } from '../../icons/index.js'
import { useTranslation } from '../../hooks/useTranslation.js'

const FilterIcon = getIcon('filter')
const ColumnsIcon = getIcon('settings')
const ChevronLeftIcon = getIcon('chevronLeft')
const ChevronRightIcon = getIcon('chevronRight')
const RefreshIcon = getIcon('refresh')
const SearchIcon = getIcon('search')
const CloseIcon = getIcon('close')

interface DataBrowserToolbarProps {
  // Filter state
  showFilterBar: boolean
  filterCount: number
  onToggleFilterBar: () => void

  // Column picker
  onToggleColumnPicker: () => void

  // Quick text search
  quickSearch: string
  onQuickSearchChange: (value: string) => void

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
  quickSearch,
  onQuickSearchChange,
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
  const { t } = useTranslation()
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
        {t('dataBrowser.toolbar.filters')}
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
        {t('dataBrowser.toolbar.columns')}
      </button>

      {/* Quick text search */}
      <div className="dc:relative dc:flex-1 dc:max-w-xs">
        <SearchIcon className="dc:absolute dc:left-2 dc:top-1/2 dc:-translate-y-1/2 dc:w-3.5 dc:h-3.5 text-dc-text-muted dc:pointer-events-none" />
        <input
          type="text"
          value={quickSearch}
          onChange={(e) => onQuickSearchChange(e.target.value)}
          placeholder={t('dataBrowser.toolbar.searchPlaceholder')}
          className="dc:w-full dc:pl-7 dc:pr-7 dc:py-1.5 dc:text-xs dc:rounded dc:border border-dc-border bg-dc-surface text-dc-text dc:outline-none dc:focus:ring-1 focus:ring-dc-accent"
        />
        {quickSearch && (
          <button
            onClick={() => onQuickSearchChange('')}
            title={t('dataBrowser.toolbar.clearSearch')}
            aria-label={t('dataBrowser.toolbar.clearSearch')}
            className="dc:absolute dc:right-1.5 dc:top-1/2 dc:-translate-y-1/2 dc:p-0.5 dc:rounded dc:hover:bg-dc-surface-hover dc:transition-colors"
          >
            <CloseIcon className="dc:w-3.5 dc:h-3.5 text-dc-text-muted" />
          </button>
        )}
      </div>

      {/* Spacer */}
      <div className="dc:flex-1" />

      {/* Row count */}
      <span className="dc:text-xs text-dc-text-muted">
        {t('dataBrowser.toolbar.rows', { count: rowCount })}
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
