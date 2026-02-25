import React, { useCallback, useMemo, useState, useEffect, useRef, type HTMLAttributes, type ReactNode, type CSSProperties, type ComponentType } from 'react'
import type { ChartType, DashboardFilter, DashboardLayoutMode, PortletConfig } from '../types'
import AnalyticsPortlet from './AnalyticsPortlet'
import DebugModal from './DebugModal'
import type { ColorPalette } from '../utils/colorPalettes'
import { useDashboardStore, type PortletDebugDataEntry } from '../stores/dashboardStore'
import { ensureAnalysisConfig } from '../utils/configMigration'
import { useCubeFeatures } from '../providers/CubeFeaturesProvider'
import { getIcon } from '../icons/registry'
import { isPortletCopyAvailable, copyPortletToClipboard } from '../utils/thumbnail'

// Constant style object to prevent re-renders from inline object recreation
const ICON_STYLE: CSSProperties = { width: '16px', height: '16px', color: 'currentColor' }

/**
 * Simplified props interface after Zustand migration.
 * State (selectedFilterId, debugData) now comes from store.
 * Actions now come from callbacks prop or store.
 */
interface DashboardPortletCardProps {
  portlet: PortletConfig
  editable: boolean
  layoutMode?: DashboardLayoutMode
  dashboardFilters?: DashboardFilter[]
  configEagerLoad?: boolean
  loadingComponent?: ReactNode
  colorPalette?: ColorPalette
  containerProps?: HTMLAttributes<HTMLDivElement>
  headerProps?: HTMLAttributes<HTMLDivElement>
  // Ref callbacks - must remain as props (parent manages refs)
  setPortletRef: (portletId: string, element: HTMLDivElement | null) => void
  setPortletComponentRef: (portletId: string, element: { refresh: (options?: { bustCache?: boolean }) => void } | null) => void
  // Action callbacks - provided by parent for flexibility
  callbacks: {
    onToggleFilter: (portletId: string, filterId: string) => void
    onRefresh: (portletId: string, options?: { bustCache?: boolean }) => void
    onDuplicate: (portletId: string) => void
    onEdit: (portlet: PortletConfig) => void
    onDelete: (portletId: string) => void
    onOpenFilterConfig: (portlet: PortletConfig) => void
  }
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

  // Check scalar props
  if (
    prevProps.editable !== nextProps.editable ||
    prevProps.layoutMode !== nextProps.layoutMode ||
    prevProps.configEagerLoad !== nextProps.configEagerLoad
  ) {
    return false
  }

  // Check object/array props by reference
  if (
    prevProps.portlet !== nextProps.portlet ||
    prevProps.dashboardFilters !== nextProps.dashboardFilters ||
    prevProps.colorPalette !== nextProps.colorPalette ||
    prevProps.loadingComponent !== nextProps.loadingComponent ||
    prevProps.callbacks !== nextProps.callbacks ||
    prevProps.icons !== nextProps.icons
  ) {
    return false
  }

  // Check function props by reference
  if (
    prevProps.setPortletRef !== nextProps.setPortletRef ||
    prevProps.setPortletComponentRef !== nextProps.setPortletComponentRef
  ) {
    return false
  }

  // Special handling for containerProps and headerProps - compare properties shallowly
  const containerPropsEqual = shallowEqualObjects(prevProps.containerProps, nextProps.containerProps)
  const headerPropsEqual = shallowEqualObjects(prevProps.headerProps, nextProps.headerProps)

  return containerPropsEqual && headerPropsEqual
}

// Shallow comparison for objects
function shallowEqualObjects<T extends object>(
  a: T | undefined,
  b: T | undefined
): boolean {
  if (a === b) return true
  if (!a || !b) return a === b

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if ((a as Record<string, unknown>)[key] !== (b as Record<string, unknown>)[key]) return false
  }

  return true
}

interface PortletChartBodyProps {
  isTransparent: boolean
  setChartContainerRef: (el: HTMLDivElement | null) => void
  setPortletComponentRef: (el: { refresh: (options?: { bustCache?: boolean }) => void } | null) => void
  renderQuery: string
  renderChartType: ChartType
  renderChartConfig: unknown
  renderDisplayConfig: unknown
  dashboardFilters?: DashboardFilter[]
  dashboardFilterMapping?: string[]
  eagerLoad: boolean
  title: string
  isMarkdownAutoHeight: boolean
  colorPalette?: ColorPalette
  loadingComponent?: ReactNode
  onDebugDataReady: (data: PortletDebugDataEntry) => void
}

const PortletChartBody = React.memo(function PortletChartBody({
  isTransparent,
  setChartContainerRef,
  setPortletComponentRef,
  renderQuery,
  renderChartType,
  renderChartConfig,
  renderDisplayConfig,
  dashboardFilters,
  dashboardFilterMapping,
  eagerLoad,
  title,
  isMarkdownAutoHeight,
  colorPalette,
  loadingComponent,
  onDebugDataReady,
}: PortletChartBodyProps) {
  return (
    <div
      ref={setChartContainerRef}
      className={`dc:flex-1 dc:min-h-0 dc:flex dc:flex-col${isTransparent ? '' : ' dc:px-2 dc:py-3 dc:md:px-4 dc:md:py-4'}`}
    >
      <AnalyticsPortlet
        ref={setPortletComponentRef}
        query={renderQuery}
        chartType={renderChartType}
        chartConfig={renderChartConfig as Record<string, unknown> | undefined}
        displayConfig={renderDisplayConfig as Record<string, unknown> | undefined}
        dashboardFilters={dashboardFilters}
        dashboardFilterMapping={dashboardFilterMapping}
        eagerLoad={eagerLoad}
        title={title}
        height={isMarkdownAutoHeight ? 'auto' : '100%'}
        colorPalette={colorPalette}
        loadingComponent={loadingComponent}
        onDebugDataReady={onDebugDataReady}
      />
    </div>
  )
})

// Memoize component - now using store for state, so fewer props to compare
const DashboardPortletCard = React.memo(function DashboardPortletCard({
  portlet,
  editable,
  layoutMode = 'grid',
  dashboardFilters,
  configEagerLoad,
  loadingComponent,
  colorPalette,
  containerProps,
  headerProps,
  setPortletRef,
  setPortletComponentRef,
  callbacks,
  icons
}: DashboardPortletCardProps) {
  // Normalize portlet to ensure analysisConfig exists (on-the-fly migration from legacy format)
  const normalizedPortlet = useMemo(() => ensureAnalysisConfig(portlet), [portlet])
  const { analysisConfig } = normalizedPortlet

  // Extract rendering props from analysisConfig
  const chartModeConfig = analysisConfig.charts[analysisConfig.analysisType]
  const renderQuery = useMemo(() => JSON.stringify(analysisConfig.query), [analysisConfig.query])
  const renderChartType = chartModeConfig?.chartType || 'line'
  const renderChartConfig = chartModeConfig?.chartConfig
  const renderDisplayConfig = chartModeConfig?.displayConfig

  // Get state from Zustand store - automatic memoization via selectors
  const isEditMode = useDashboardStore(state => state.isEditMode)
  const selectedFilterId = useDashboardStore(state => state.selectedFilterId)
  const debugData = useDashboardStore(state => state.debugData[portlet.id])

  // Markdown-specific display modes
  // isTransparent gated on !isEditMode so chrome is visible for editing
  const isMarkdown = renderChartType === 'markdown'
  const markdownAutoHeightRequested = isMarkdown && (renderDisplayConfig?.autoHeight ?? true)
  const isMarkdownAutoHeight = layoutMode !== 'grid' && markdownAutoHeightRequested
  const isTransparentContent = isMarkdown && !!renderDisplayConfig?.transparentBackground
  const isTransparent = isTransparentContent && !isEditMode
  // Hide header when: explicitly set to hide, OR markdown with no title
  const shouldHideHeader = renderChartType === 'markdown'
    ? (renderDisplayConfig?.hideHeader ?? true) || !!renderDisplayConfig?.transparentBackground || !portlet.title
    : (renderDisplayConfig?.hideHeader ?? false)

  // Get setDebugData action from store
  const setDebugData = useDashboardStore(state => state.setDebugData)

  // Get features for copy-to-clipboard functionality
  const { features } = useCubeFeatures()

  // Icons for copy-to-clipboard button
  const CameraIcon = getIcon('camera')
  const CheckIcon = getIcon('check')

  // State and ref for copy-to-clipboard functionality
  const [copySuccess, setCopySuccess] = useState(false)
  const [copyAvailable, setCopyAvailable] = useState(false)
  const chartContainerRef = useRef<HTMLDivElement | null>(null)

  // Track shift key + hover state for cache bust visual feedback on refresh button
  const [isShiftHeld, setIsShiftHeld] = useState(false)
  const [isHoveringRefresh, setIsHoveringRefresh] = useState(false)

  // Listen for shift key up/down to show visual feedback on refresh button (only when hovering)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftHeld(true)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftHeld(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Show warning styling only when hovering AND shift is held
  const showCacheBustIndicator = isShiftHeld && isHoveringRefresh

  // Check if copy-to-clipboard capability is available on mount
  useEffect(() => {
    if (features.thumbnail?.enabled) {
      isPortletCopyAvailable().then(setCopyAvailable)
    } else {
      setCopyAvailable(false)
    }
  }, [features.thumbnail?.enabled])

  // Handler for copy-to-clipboard
  const handleCopyToClipboard = useCallback(async (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation()
    if (!chartContainerRef.current) return

    const success = await copyPortletToClipboard(chartContainerRef.current)
    if (success) {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }, [])

  const hasSelectedFilter = selectedFilterId
    ? (portlet.dashboardFilterMapping || []).includes(selectedFilterId)
    : false
  const isInSelectionMode = !!selectedFilterId

  const mergedContainerClassName = [
    isTransparent
      ? 'dc:flex dc:flex-col dc:transition-all'
      : 'bg-dc-surface dc:border dc:rounded-lg dc:flex dc:flex-col dc:transition-all',
    isMarkdownAutoHeight ? '' : 'dc:h-full',
    isInSelectionMode ? 'dc:cursor-pointer' : '',
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

  // Memoize debug data callback - now uses store action directly
  const handleDebugDataReady = useCallback((data: PortletDebugDataEntry) => {
    setDebugData(portlet.id, data)
  }, [portlet.id, setDebugData])

  const handleSetPortletRef = useCallback((el: HTMLDivElement | null) => {
    setPortletRef(portlet.id, el)
  }, [portlet.id, setPortletRef])

  const handleSetPortletComponentRef = useCallback((el: { refresh: (options?: { bustCache?: boolean }) => void } | null) => {
    setPortletComponentRef(portlet.id, el)
  }, [portlet.id, setPortletComponentRef])

  const handleSetChartContainerRef = useCallback((el: HTMLDivElement | null) => {
    chartContainerRef.current = el
  }, [])

  return (
    <div
      data-portlet-id={portlet.id}
      ref={handleSetPortletRef}
      className={mergedContainerClassName}
      style={{
        boxShadow: isTransparent ? 'none' : 'var(--dc-shadow-sm)',
        borderColor: isTransparent
          ? 'transparent'
          : isInSelectionMode && hasSelectedFilter
            ? 'var(--dc-primary)'
            : 'var(--dc-border)',
        borderWidth: isTransparent ? '0' : isInSelectionMode && hasSelectedFilter ? '2px' : '1px',
        backgroundColor: isTransparent
          ? 'transparent'
          : isInSelectionMode && hasSelectedFilter
            ? 'rgba(var(--dc-primary-rgb), 0.05)'
            : 'var(--dc-surface)',
        opacity: isInSelectionMode && !hasSelectedFilter ? '0.5' : '1',
        ...containerStyle
      }}
      onClick={(event) => {
        if (isInSelectionMode && selectedFilterId) {
          event.stopPropagation()
          callbacks.onToggleFilter(portlet.id, selectedFilterId)
        }
        containerOnClick?.(event)
      }}
      {...restContainerProps}
    >
      {(!shouldHideHeader || isEditMode) && (
        <div
          className={mergedHeaderClassName}
          style={headerStyle}
          onClick={(event) => {
            headerOnClick?.(event)
          }}
          {...restHeaderProps}
        >
          <div className="dc:flex dc:items-center dc:gap-2 dc:flex-1 dc:min-w-0">
            <h3 className="dc:font-semibold dc:text-sm text-dc-text dc:truncate">{portlet.title}</h3>
            {editable && isEditMode && debugData && (
              <div
                onMouseDown={(event) => {
                  event.stopPropagation()
                  event.preventDefault()
                }}
                onClick={(event) => event.stopPropagation()}
                onTouchStart={(event) => {
                  event.stopPropagation()
                  event.preventDefault()
                }}
                onTouchEnd={(event) => event.stopPropagation()}
              >
                <DebugModal
                  chartConfig={debugData.chartConfig}
                  displayConfig={debugData.displayConfig}
                  queryObject={debugData.queryObject}
                  data={debugData.data}
                  chartType={debugData.chartType}
                  cacheInfo={debugData.cacheInfo as { hit: true; cachedAt: string; ttlMs: number; ttlRemainingMs: number } | undefined}
                />
              </div>
            )}
          </div>
          <div
            className="dc:flex dc:items-center dc:gap-1 dc:shrink-0 dc:ml-4 dc:-mr-2"
            onMouseDown={(event) => {
              event.stopPropagation()
              event.preventDefault()
            }}
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => {
              event.stopPropagation()
              event.preventDefault()
            }}
            onTouchEnd={(event) => event.stopPropagation()}
          >
            {/* Cache indicator - show when result was served from cache */}
            {debugData?.cacheInfo && (
              <span
                className="dc:p-1 text-dc-text-muted dc:opacity-40"
                title={`Cached ${Math.round((Date.now() - new Date(debugData.cacheInfo.cachedAt).getTime()) / 1000)}s ago`}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                  <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
                </svg>
              </span>
            )}
            <button
              onClick={(event) => {
                event.stopPropagation()
                callbacks.onRefresh(portlet.id, { bustCache: event.shiftKey })
              }}
              onTouchEnd={(event) => {
                event.stopPropagation()
                event.preventDefault()
                callbacks.onRefresh(portlet.id)
              }}
              onMouseEnter={() => setIsHoveringRefresh(true)}
              onMouseLeave={() => setIsHoveringRefresh(false)}
              disabled={isInSelectionMode}
              className={`dc:p-1 bg-transparent dc:border-none dc:rounded-sm dc:transition-colors ${
                isInSelectionMode
                  ? 'dc:cursor-not-allowed dc:opacity-50 text-dc-text-secondary'
                  : showCacheBustIndicator
                    ? 'dc:cursor-pointer text-dc-warning bg-dc-warning-bg'
                    : 'dc:cursor-pointer text-dc-text-secondary hover:bg-dc-surface-hover'
              }`}
              title={showCacheBustIndicator ? 'Click to refresh and bypass cache' : 'Refresh portlet data (Shift+click to bypass cache)'}
            >
              <icons.RefreshIcon style={ICON_STYLE} />
            </button>

            {/* Copy to clipboard button - visible when thumbnail feature is enabled and capability is available */}
            {copyAvailable && !isInSelectionMode && (
              <button
                onClick={handleCopyToClipboard}
                onTouchEnd={(event) => {
                  event.preventDefault()
                  handleCopyToClipboard(event)
                }}
                className="dc:p-1 bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors"
                title={copySuccess ? 'Copied!' : 'Copy chart to clipboard'}
              >
                {copySuccess ? (
                  <CheckIcon style={ICON_STYLE} />
                ) : (
                  <CameraIcon style={ICON_STYLE} />
                )}
              </button>
            )}

            {editable && isEditMode && !isInSelectionMode && (
              <>
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    callbacks.onOpenFilterConfig(portlet)
                  }}
                  onTouchEnd={(event) => {
                    event.stopPropagation()
                    event.preventDefault()
                    callbacks.onOpenFilterConfig(portlet)
                  }}
                  className="dc:p-1 bg-transparent dc:border-none dc:rounded-sm dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors dc:relative"
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
                    callbacks.onDuplicate(portlet.id)
                  }}
                  onTouchEnd={(event) => {
                    event.stopPropagation()
                    event.preventDefault()
                    callbacks.onDuplicate(portlet.id)
                  }}
                  className="dc:p-1 bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors"
                  title="Duplicate portlet"
                >
                  <icons.CopyIcon style={ICON_STYLE} />
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    callbacks.onEdit(portlet)
                  }}
                  onTouchEnd={(event) => {
                    event.stopPropagation()
                    event.preventDefault()
                    callbacks.onEdit(portlet)
                  }}
                  className="dc:p-1 bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors"
                  title="Edit portlet"
                >
                  <icons.EditIcon style={ICON_STYLE} />
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    callbacks.onDelete(portlet.id)
                  }}
                  onTouchEnd={(event) => {
                    event.stopPropagation()
                    event.preventDefault()
                    callbacks.onDelete(portlet.id)
                  }}
                  className="dc:p-1 dc:mr-0.5 bg-transparent dc:border-none dc:rounded-sm dc:cursor-pointer hover:bg-dc-danger-bg text-dc-danger dc:transition-colors"
                  title="Delete portlet"
                >
                  <icons.DeleteIcon style={ICON_STYLE} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <PortletChartBody
        isTransparent={isTransparentContent}
        setChartContainerRef={handleSetChartContainerRef}
        setPortletComponentRef={handleSetPortletComponentRef}
        renderQuery={renderQuery}
        renderChartType={renderChartType}
        renderChartConfig={renderChartConfig}
        renderDisplayConfig={renderDisplayConfig}
        dashboardFilters={dashboardFilters}
        dashboardFilterMapping={portlet.dashboardFilterMapping}
        eagerLoad={portlet.eagerLoad ?? configEagerLoad ?? false}
        title={portlet.title}
        isMarkdownAutoHeight={isMarkdownAutoHeight}
        colorPalette={colorPalette}
        loadingComponent={loadingComponent}
        onDebugDataReady={handleDebugDataReady}
      />
    </div>
  )
}, arePropsEqual)

export default DashboardPortletCard
