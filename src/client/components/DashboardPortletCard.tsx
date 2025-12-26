import { type HTMLAttributes, type ReactNode, type CSSProperties, type ComponentType } from 'react'
import type { DashboardFilter, PortletConfig } from '../types'
import AnalyticsPortlet from './AnalyticsPortlet'
import DebugModal from './DebugModal'
import type { ColorPalette } from '../utils/colorPalettes'

interface DashboardPortletCardProps {
  portlet: PortletConfig
  editable: boolean
  isEditMode: boolean
  selectedFilterId: string | null
  debugData?: {
    chartConfig: any
    displayConfig: any
    queryObject: any
    data: any[]
    chartType: string
  }
  dashboardFilters?: DashboardFilter[]
  configEagerLoad?: boolean
  loadingComponent?: ReactNode
  colorPalette?: ColorPalette
  containerProps?: HTMLAttributes<HTMLDivElement>
  headerProps?: HTMLAttributes<HTMLDivElement>
  onToggleFilter: (portletId: string, filterId: string) => void
  onRefresh: (portletId: string) => void
  onDuplicate: (portletId: string) => void
  onEdit: (portlet: PortletConfig) => void
  onDelete: (portletId: string) => void
  onOpenFilterConfig: (portlet: PortletConfig) => void
  onDebugDataReady: (portletId: string, data: {
    chartConfig: any
    displayConfig: any
    queryObject: any
    data: any[]
    chartType: string
  }) => void
  setPortletRef: (portletId: string, element: HTMLDivElement | null) => void
  setPortletComponentRef: (portletId: string, element: { refresh: () => void } | null) => void
  icons: {
    RefreshIcon: ComponentType<{ className?: string; style?: CSSProperties }>
    EditIcon: ComponentType<{ className?: string; style?: CSSProperties }>
    DeleteIcon: ComponentType<{ className?: string; style?: CSSProperties }>
    CopyIcon: ComponentType<{ className?: string; style?: CSSProperties }>
    FilterIcon: ComponentType<{ className?: string; style?: CSSProperties }>
  }
}

export default function DashboardPortletCard({
  portlet,
  editable,
  isEditMode,
  selectedFilterId,
  debugData,
  dashboardFilters,
  configEagerLoad,
  loadingComponent,
  colorPalette,
  containerProps,
  headerProps,
  onToggleFilter,
  onRefresh,
  onDuplicate,
  onEdit,
  onDelete,
  onOpenFilterConfig,
  onDebugDataReady,
  setPortletRef,
  setPortletComponentRef,
  icons
}: DashboardPortletCardProps) {
  const hasSelectedFilter = selectedFilterId
    ? (portlet.dashboardFilterMapping || []).includes(selectedFilterId)
    : false
  const isInSelectionMode = !!selectedFilterId

  const mergedContainerClassName = [
    'bg-dc-surface border rounded-lg flex flex-col h-full transition-all',
    isInSelectionMode ? 'cursor-pointer' : '',
    containerProps?.className
  ]
    .filter(Boolean)
    .join(' ')

  const mergedHeaderClassName = [
    'flex items-center justify-between px-3 py-1.5 md:px-4 md:py-1 border-b border-dc-border shrink-0 bg-dc-surface-secondary rounded-t-lg portlet-drag-handle',
    isEditMode ? 'cursor-move' : 'cursor-default',
    headerProps?.className
  ]
    .filter(Boolean)
    .join(' ')

  const {
    onClick: containerOnClick,
    className: _containerClassName,
    style: containerStyle,
    ...restContainerProps
  } = containerProps ?? {}

  const {
    onClick: headerOnClick,
    className: _headerClassName,
    style: headerStyle,
    ...restHeaderProps
  } = headerProps ?? {}

  return (
    <div
      data-portlet-id={portlet.id}
      ref={el => setPortletRef(portlet.id, el)}
      className={mergedContainerClassName}
      style={{
        boxShadow: 'var(--dc-shadow-sm)',
        borderColor: isInSelectionMode && hasSelectedFilter
          ? 'var(--dc-primary)'
          : 'var(--dc-border)',
        borderWidth: isInSelectionMode && hasSelectedFilter ? '2px' : '1px',
        backgroundColor: isInSelectionMode && hasSelectedFilter
          ? 'rgba(var(--dc-primary-rgb), 0.05)'
          : 'var(--dc-surface)',
        opacity: isInSelectionMode && !hasSelectedFilter ? '0.5' : '1',
        ...containerStyle
      }}
      onClick={(event) => {
        if (isInSelectionMode && selectedFilterId) {
          event.stopPropagation()
          onToggleFilter(portlet.id, selectedFilterId)
        }
        containerOnClick?.(event)
      }}
      {...restContainerProps}
    >
      {(!portlet.displayConfig?.hideHeader || isEditMode) && (
        <div
          className={mergedHeaderClassName}
          style={headerStyle}
          onClick={(event) => {
            headerOnClick?.(event)
          }}
          {...restHeaderProps}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-dc-text truncate">{portlet.title}</h3>
            {editable && isEditMode && debugData && (
              <div
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
                onTouchEnd={(event) => event.stopPropagation()}
              >
                <DebugModal
                  chartConfig={debugData.chartConfig}
                  displayConfig={debugData.displayConfig}
                  queryObject={debugData.queryObject}
                  data={debugData.data}
                  chartType={debugData.chartType}
                />
              </div>
            )}
          </div>
          <div
            className="flex items-center gap-1 shrink-0 ml-4 -mr-2"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onTouchEnd={(event) => event.stopPropagation()}
          >
            <button
              onClick={(event) => {
                event.stopPropagation()
                onRefresh(portlet.id)
              }}
              onTouchEnd={(event) => {
                event.stopPropagation()
                event.preventDefault()
                onRefresh(portlet.id)
              }}
              disabled={isInSelectionMode}
              className={`p-1 bg-transparent border-none rounded-sm text-dc-text-secondary transition-colors ${
                isInSelectionMode ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-dc-surface-hover'
              }`}
              title="Refresh portlet data"
            >
              <icons.RefreshIcon style={{ width: '16px', height: '16px', color: 'currentColor' }} />
            </button>

            {editable && isEditMode && !isInSelectionMode && (
              <>
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    onOpenFilterConfig(portlet)
                  }}
                  onTouchEnd={(event) => {
                    event.stopPropagation()
                    event.preventDefault()
                    onOpenFilterConfig(portlet)
                  }}
                  className="p-1 bg-transparent border-none rounded-sm cursor-pointer hover:bg-dc-surface-hover transition-colors relative"
                  title={`Configure dashboard filters${portlet.dashboardFilterMapping && portlet.dashboardFilterMapping.length > 0 ? ` (${portlet.dashboardFilterMapping.length} active)` : ''}`}
                  style={{
                    color: portlet.dashboardFilterMapping && portlet.dashboardFilterMapping.length > 0
                      ? 'var(--dc-primary)'
                      : 'var(--dc-text-secondary)'
                  }}
                >
                  <icons.FilterIcon style={{ width: '16px', height: '16px', color: 'currentColor' }} />
                </button>

                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    onDuplicate(portlet.id)
                  }}
                  onTouchEnd={(event) => {
                    event.stopPropagation()
                    event.preventDefault()
                    onDuplicate(portlet.id)
                  }}
                  className="p-1 bg-transparent border-none rounded-sm text-dc-text-secondary cursor-pointer hover:bg-dc-surface-hover transition-colors"
                  title="Duplicate portlet"
                >
                  <icons.CopyIcon style={{ width: '16px', height: '16px', color: 'currentColor' }} />
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    onEdit(portlet)
                  }}
                  onTouchEnd={(event) => {
                    event.stopPropagation()
                    event.preventDefault()
                    onEdit(portlet)
                  }}
                  className="p-1 bg-transparent border-none rounded-sm text-dc-text-secondary cursor-pointer hover:bg-dc-surface-hover transition-colors"
                  title="Edit portlet"
                >
                  <icons.EditIcon style={{ width: '16px', height: '16px', color: 'currentColor' }} />
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    onDelete(portlet.id)
                  }}
                  onTouchEnd={(event) => {
                    event.stopPropagation()
                    event.preventDefault()
                    onDelete(portlet.id)
                  }}
                  className="p-1 mr-0.5 bg-transparent border-none rounded-sm cursor-pointer hover:bg-red-50 transition-colors"
                  style={{ color: '#ef4444' }}
                  title="Delete portlet"
                >
                  <icons.DeleteIcon style={{ width: '16px', height: '16px', color: 'currentColor' }} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 px-2 py-3 md:px-4 md:py-4 min-h-0 overflow-visible flex flex-col">
        <AnalyticsPortlet
          ref={el => setPortletComponentRef(portlet.id, el)}
          query={portlet.query}
          chartType={portlet.chartType}
          chartConfig={portlet.chartConfig}
          displayConfig={portlet.displayConfig}
          dashboardFilters={dashboardFilters}
          dashboardFilterMapping={portlet.dashboardFilterMapping}
          eagerLoad={portlet.eagerLoad ?? configEagerLoad ?? false}
          title={portlet.title}
          height="100%"
          colorPalette={colorPalette}
          loadingComponent={loadingComponent}
          onDebugDataReady={(data) => onDebugDataReady(portlet.id, data)}
        />
      </div>
    </div>
  )
}
