import React, { useCallback, type HTMLAttributes, type ReactNode, type CSSProperties, type ComponentType } from 'react'
import type { DashboardFilter, PortletConfig } from '../types'
import AnalyticsPortlet from './AnalyticsPortlet'
import DebugModal from './DebugModal'
import type { ColorPalette } from '../utils/colorPalettes'

// Constant style object to prevent re-renders from inline object recreation
const ICON_STYLE: CSSProperties = { width: '16px', height: '16px', color: 'currentColor' }

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

// Custom comparison function to handle containerProps/headerProps object recreation
function arePropsEqual(
  prevProps: DashboardPortletCardProps,
  nextProps: DashboardPortletCardProps
): boolean {
  // Fast path: if object references are the same, props are equal
  if (prevProps === nextProps) return true

  // Check all scalar props
  if (
    prevProps.editable !== nextProps.editable ||
    prevProps.isEditMode !== nextProps.isEditMode ||
    prevProps.selectedFilterId !== nextProps.selectedFilterId ||
    prevProps.configEagerLoad !== nextProps.configEagerLoad
  ) {
    return false
  }

  // Check object/array props by reference (React.memo default behavior)
  if (
    prevProps.portlet !== nextProps.portlet ||
    prevProps.debugData !== nextProps.debugData ||
    prevProps.dashboardFilters !== nextProps.dashboardFilters ||
    prevProps.colorPalette !== nextProps.colorPalette ||
    prevProps.loadingComponent !== nextProps.loadingComponent ||
    prevProps.icons !== nextProps.icons
  ) {
    return false
  }

  // Check function props by reference
  if (
    prevProps.onToggleFilter !== nextProps.onToggleFilter ||
    prevProps.onRefresh !== nextProps.onRefresh ||
    prevProps.onDuplicate !== nextProps.onDuplicate ||
    prevProps.onEdit !== nextProps.onEdit ||
    prevProps.onDelete !== nextProps.onDelete ||
    prevProps.onOpenFilterConfig !== nextProps.onOpenFilterConfig ||
    prevProps.onDebugDataReady !== nextProps.onDebugDataReady ||
    prevProps.setPortletRef !== nextProps.setPortletRef ||
    prevProps.setPortletComponentRef !== nextProps.setPortletComponentRef
  ) {
    return false
  }

  // Special handling for containerProps and headerProps - compare properties shallowly
  // These objects may be recreated but with the same values (especially function references)
  const containerPropsEqual = shallowEqualObjects(prevProps.containerProps, nextProps.containerProps)
  const headerPropsEqual = shallowEqualObjects(prevProps.headerProps, nextProps.headerProps)

  return containerPropsEqual && headerPropsEqual
}

// Shallow comparison for objects - compares keys and values by reference
function shallowEqualObjects(
  a: Record<string, any> | undefined,
  b: Record<string, any> | undefined
): boolean {
  if (a === b) return true
  if (!a || !b) return a === b

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (a[key] !== b[key]) return false
  }

  return true
}

// Memoize component to prevent re-renders when props haven't changed
const DashboardPortletCard = React.memo(function DashboardPortletCard({
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

  // Memoize debug data callback to prevent AnalyticsPortlet re-renders
  const handleDebugDataReady = useCallback((data: {
    chartConfig: any
    displayConfig: any
    queryObject: any
    data: any[]
    chartType: string
  }) => {
    onDebugDataReady(portlet.id, data)
  }, [portlet.id, onDebugDataReady])

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
              <icons.RefreshIcon style={ICON_STYLE} />
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
                  <icons.FilterIcon style={ICON_STYLE} />
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
                  <icons.CopyIcon style={ICON_STYLE} />
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
                  <icons.EditIcon style={ICON_STYLE} />
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
                  className="p-1 mr-0.5 bg-transparent border-none rounded-sm cursor-pointer hover:bg-dc-danger-bg text-dc-danger transition-colors"
                  title="Delete portlet"
                >
                  <icons.DeleteIcon style={ICON_STYLE} />
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
          onDebugDataReady={handleDebugDataReady}
        />
      </div>
    </div>
  )
}, arePropsEqual)

export default DashboardPortletCard
