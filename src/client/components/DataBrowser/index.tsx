/**
 * DataBrowser Component
 *
 * A Neon-style full-page data browser for exploring raw cube data.
 * Uses ungrouped queries to display row-level data with:
 * - Cube list sidebar (left)
 * - Sortable data table (right)
 * - Filter bar and column picker
 * - Server-side pagination
 *
 * Must be wrapped in a CubeProvider.
 */

import { useMemo, useCallback } from 'react'
import { DataBrowserStoreProvider } from '../../stores/dataBrowserStore'
import { useDataBrowser, getCubeColumns } from '../../hooks/useDataBrowser'
import DataBrowserSidebar from './DataBrowserSidebar'
import DataBrowserToolbar from './DataBrowserToolbar'
import DataBrowserTable from './DataBrowserTable'
import AnalysisFilterSection from '../AnalysisBuilder/AnalysisFilterSection'
import FieldSearchModal from '../AnalysisBuilder/FieldSearchModal'
import type { MetaResponse, MetaField } from '../../shared/types'

export interface DataBrowserProps {
  /** Additional CSS classes */
  className?: string
  /** Initially selected cube */
  defaultCube?: string
  /** Default page size (default: 20) */
  defaultPageSize?: number
  /** Max height for the component (default: '100vh') */
  maxHeight?: string
  /** Custom loading indicator (defaults to LoadingIndicator) */
  loadingComponent?: React.ReactNode
}

/**
 * Inner component (must be inside store provider)
 */
function DataBrowserInner({ className = '', maxHeight = '100vh', loadingComponent }: Omit<DataBrowserProps, 'defaultCube' | 'defaultPageSize'>) {
  const {
    selectedCube,
    visibleColumns,
    sortColumn,
    sortDirection,
    page,
    pageSize,
    filters,
    showFilterBar,
    showColumnPicker,
    rawData,
    isLoading,
    isFetching,
    rowCount,
    hasNextPage,
    hasPrevPage,
    meta,
    getFieldLabel,
    selectCube,
    setSort,
    setPage,
    setPageSize,
    setFilters,
    toggleFilterBar,
    setShowColumnPicker,
    toggleColumn,
    refetch,
  } = useDataBrowser()

  // Build cube list from metadata
  const cubeList = useMemo(() => {
    if (!meta) return []
    return meta.cubes.map((c) => ({ name: c.name, title: c.title || c.name }))
  }, [meta])

  // Handle cube selection — auto-populate with all dimensions
  const handleSelectCube = useCallback(
    (cubeName: string) => {
      const { dimensions } = getCubeColumns(cubeName, meta)
      selectCube(cubeName, dimensions)
    },
    [meta, selectCube]
  )

  // Filter count
  const filterCount = useMemo(() => {
    function count(fs: typeof filters): number {
      return fs.reduce((n, f) => {
        if ('member' in f) return n + 1
        if ('type' in f && 'filters' in f) return n + count(f.filters)
        return n
      }, 0)
    }
    return count(filters)
  }, [filters])

  // Schema for filter section and field search modal
  // Cast to MetaResponse since the components handle optional description gracefully
  const schema = useMemo<MetaResponse | null>(() => {
    if (!meta) return null
    if (selectedCube) {
      const cube = meta.cubes.find((c) => c.name === selectedCube)
      return cube ? { cubes: [cube] } as unknown as MetaResponse : null
    }
    return meta as unknown as MetaResponse
  }, [meta, selectedCube])

  // Handle column toggle from FieldSearchModal
  const handleColumnSelect = useCallback(
    (field: MetaField, _fieldType: string, _cubeName: string, keepOpen?: boolean) => {
      void keepOpen
      toggleColumn(field.name)
    },
    [toggleColumn]
  )

  return (
    <div
      className={`dc:flex dc:border border-dc-border dc:rounded-lg dc:overflow-hidden bg-dc-surface ${className}`}
      style={{ height: maxHeight }}
    >
      {/* Sidebar */}
      <DataBrowserSidebar
        cubes={cubeList}
        selectedCube={selectedCube}
        onSelectCube={handleSelectCube}
      />

      {/* Main content */}
      <div className="dc:flex dc:flex-col dc:flex-1 dc:min-w-0">
        {/* Toolbar */}
        {selectedCube && (
          <DataBrowserToolbar
            showFilterBar={showFilterBar}
            filterCount={filterCount}
            onToggleFilterBar={toggleFilterBar}
            onToggleColumnPicker={() => setShowColumnPicker(!showColumnPicker)}
            page={page}
            pageSize={pageSize}
            rowCount={rowCount}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            isFetching={isFetching}
            onRefresh={() => refetch()}
          />
        )}

        {/* Filter bar (collapsible) */}
        {selectedCube && showFilterBar && (
          <div className="dc:px-3 dc:py-2 dc:border-b border-dc-border bg-dc-surface">
            <AnalysisFilterSection
              filters={filters}
              schema={schema}
              onFiltersChange={setFilters}
            />
          </div>
        )}

        {/* Data table */}
        <DataBrowserTable
          data={rawData}
          columns={visibleColumns}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={setSort}
          getFieldLabel={getFieldLabel}
          meta={meta}
          isLoading={isLoading}
          isFetching={isFetching}
          selectedCube={selectedCube}
          loadingComponent={loadingComponent}
        />
      </div>

      {/* Column picker modal */}
      {showColumnPicker && schema && (
        <FieldSearchModal
          isOpen={showColumnPicker}
          onClose={() => setShowColumnPicker(false)}
          onSelect={handleColumnSelect}
          mode="breakdown"
          schema={schema}
          selectedFields={visibleColumns}
        />
      )}
    </div>
  )
}

/**
 * DataBrowser — standalone data browsing component
 */
export default function DataBrowser({
  className,
  defaultCube,
  defaultPageSize = 20,
  maxHeight,
  loadingComponent,
}: DataBrowserProps) {
  return (
    <DataBrowserStoreProvider defaultPageSize={defaultPageSize} defaultCube={defaultCube}>
      <DataBrowserInner className={className} maxHeight={maxHeight} loadingComponent={loadingComponent} />
    </DataBrowserStoreProvider>
  )
}
