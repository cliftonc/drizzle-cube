/**
 * DashboardFilterBar
 *
 * The dashboard-level filter UI (the internal DashboardFilterPanel) plus the
 * filter-selection-mode banner shown while assigning a filter to portlets.
 * Reads everything from DashboardContext.
 */

import { getIcon } from '../../icons'
import { useTranslation } from '../../hooks/useTranslation'
import DashboardFilterPanel from '../DashboardFilterPanel'
import { useDashboardContext } from './DashboardContext'
import type { DashboardFilter } from '../../types'

const FilterIcon = getIcon('filter')

export default function DashboardFilterBar() {
  const { t } = useTranslation()
  const {
    dashboardFilters,
    editable,
    schema,
    config,
    onDashboardFiltersChange,
    onSave,
    selectedFilterId,
    selectedFilter,
    isEditMode,
    handleFilterSelect,
    handleSelectAllForFilter,
    actions,
  } = useDashboardContext()

  return (
    <>
      {/* Dashboard Filter Panel - Always visible below toolbar */}
      <DashboardFilterPanel
        dashboardFilters={dashboardFilters || []}
        editable={editable}
        schema={schema || null}
        dashboardConfig={config}
        onDashboardFiltersChange={onDashboardFiltersChange || (() => {})}
        onSaveFilters={onSave ? async (filters: DashboardFilter[]) => {
          const updatedConfig = {
            ...config,
            filters
          }
          await onSave(updatedConfig)
        } : undefined}
        selectedFilterId={selectedFilterId}
        onFilterSelect={handleFilterSelect}
        isEditMode={isEditMode}
      />

      {/* Filter Selection Mode Banner */}
      {selectedFilterId && selectedFilter && (
        <div
          className="dc:mb-4 dc:px-4 dc:py-3 dc:rounded-md dc:border-2 dc:transition-all"
          style={{
            backgroundColor: 'var(--dc-primary)',
            borderColor: 'var(--dc-primary)',
            color: 'white'
          }}
        >
          <div className="dc:flex dc:items-center dc:justify-between dc:flex-wrap dc:gap-2">
            <div className="dc:flex dc:items-center dc:gap-2 dc:flex-wrap">
              <FilterIcon className="dc:w-5 dc:h-5 dc:shrink-0" />
              <span className="dc:font-medium">
                {t('dashboard.filterSelectionMode', { filterLabel: selectedFilter.label })}
              </span>
              <span className="dc:text-sm dc:opacity-90 dc:hidden dc:sm:inline">{t('dashboard.filterSelectionEscHint')}</span>
            </div>
            <div className="dc:flex dc:items-center dc:gap-2">
              <button
                onClick={() => handleSelectAllForFilter(selectedFilterId)}
                className="dc:px-3 dc:py-1 dc:rounded-md dc:transition-colors dc:text-sm dc:font-medium"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              >
                {t('common.actions.selectAll')}
              </button>
              <button
                onClick={() => actions.exitFilterSelectionMode()}
                className="dc:px-3 dc:py-1 dc:rounded-md dc:transition-colors dc:text-sm dc:font-medium"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              >
                {t('common.actions.exit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
