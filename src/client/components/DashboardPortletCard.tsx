import React, { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import type {
  AnalyticsPortletProps,
  AnalyticsPortletRef,
  ChartAxisConfig,
  ChartDisplayConfig,
  ChartType,
  DashboardFilter,
  DashboardFilterMapping,
  PortletFreshness
} from '../types.js'
import AnalyticsPortlet from './AnalyticsPortlet.js'
import type { ColorPalette } from '../utils/colorPalettes.js'
import { useDashboardStore, type PortletDebugDataEntry } from '../stores/dashboardStore.js'
import { ensureAnalysisConfig } from '../utils/configMigration.js'
import { mappingIncludesFilter, getUnreachableUniversalTimeFilters } from '../utils/filterUtils.js'
import { arePropsEqual, type DashboardPortletCardProps } from './dashboardPortletCard/propsEqual.js'
import { resolveEffectiveFilterField } from './dashboardPortletCard/filterField.js'
import { usePortletCardActions } from './dashboardPortletCard/usePortletCardActions.js'
import PortletCardHeader from './dashboardPortletCard/PortletCardHeader.js'
import PortletFloatingActions from './dashboardPortletCard/PortletFloatingActions.js'
import FilterFieldChip from './dashboardPortletCard/FilterFieldChip.js'
import { useCubeFeatures } from '../providers/CubeFeaturesProvider.js'
import { isRefreshFeatureEnabled, resolveEffectiveRefresh } from '../utils/freshness.js'
import { buildContainerClassName, buildHeaderClassName, buildContainerStyle, resolveDisplayModes } from './dashboardPortletCard/cardStyles.js'

interface PortletChartBodyProps {
  isTransparent: boolean
  setChartContainerRef: (el: HTMLDivElement | null) => void
  setPortletComponentRef: (el: AnalyticsPortletRef | null) => void
  renderQuery: string
  renderChartType: ChartType
  renderChartConfig: unknown
  renderDisplayConfig: unknown
  dashboardFilters?: DashboardFilter[]
  dashboardFilterMapping?: DashboardFilterMapping
  eagerLoad: boolean
  hasIntervalRefresh: boolean
  title: string
  isMarkdownAutoHeight: boolean
  colorPalette?: ColorPalette
  loadingComponent?: ReactNode
  onDebugDataReady: (data: PortletDebugDataEntry) => void
  onFreshnessChange?: (freshness: PortletFreshness) => void
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
  hasIntervalRefresh,
  title,
  isMarkdownAutoHeight,
  colorPalette,
  loadingComponent,
  onDebugDataReady,
  onFreshnessChange,
}: PortletChartBodyProps) {
  return (
    <div
      ref={setChartContainerRef}
      className={`dc-portlet-card-body dc:flex-1 dc:min-h-0 dc:flex dc:flex-col${isTransparent ? '' : ' dc:px-2 dc:py-3 dc:md:px-4 dc:md:py-4'}`}
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
        hasIntervalRefresh={hasIntervalRefresh}
        title={title}
        height={isMarkdownAutoHeight ? 'auto' : '100%'}
        colorPalette={colorPalette}
        loadingComponent={loadingComponent}
        onDebugDataReady={onDebugDataReady}
        onFreshnessChange={onFreshnessChange}
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
  dashboardRefresh,
  loadingComponent,
  colorPalette,
  containerProps,
  headerProps,
  variant = 'standalone',
  setPortletRef,
  setPortletComponentRef,
  callbacks,
  icons,
  onPortletExpand
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

  // Markdown-specific display modes (transparency, auto-height, header visibility)
  const { isMarkdownAutoHeight, isTransparentContent, isTransparent, shouldHideHeader } = resolveDisplayModes({
    renderChartType,
    renderDisplayConfig,
    layoutMode,
    isEditMode,
    portletTitle: portlet.title,
    variant
  })

  // Get setDebugData action from store
  const setDebugData = useDashboardStore(state => state.setDebugData)

  // Copy/export/refresh action state and handlers
  const {
    chartContainerRef,
    copySuccess,
    copyAvailable,
    xlsExportAvailable,
    exportInProgress,
    showCacheBustIndicator,
    setIsHoveringRefresh,
    handleExportXlsx,
    handleCopyToClipboard
  } = usePortletCardActions({ portletTitle: portlet.title, debugData })

  const hasSelectedFilter = selectedFilterId
    ? mappingIncludesFilter(portlet.dashboardFilterMapping, selectedFilterId)
    : false
  const isInSelectionMode = !!selectedFilterId

  // In filter selection mode, show which field the selected filter targets on
  // this portlet (the per-portlet override, or the filter's own field)
  const effectiveFilterField = useMemo(() => resolveEffectiveFilterField({
    isInSelectionMode,
    hasSelectedFilter,
    selectedFilterId,
    dashboardFilters,
    dashboardFilterMapping: portlet.dashboardFilterMapping
  }), [isInSelectionMode, hasSelectedFilter, selectedFilterId, dashboardFilters, portlet.dashboardFilterMapping])

  // Universal date filters mapped here that cannot narrow this portlet (no
  // time dimension and not pinned to a field) - flagged in the header so the
  // portlet never quietly shows all-time values under a narrower date control
  const unreachableDateFilterLabels = useMemo(
    () => getUnreachableUniversalTimeFilters(renderQuery, dashboardFilters, portlet.dashboardFilterMapping)
      .map(df => df.label),
    [renderQuery, dashboardFilters, portlet.dashboardFilterMapping]
  )

  const mergedContainerClassName = buildContainerClassName({
    isTransparent,
    isMarkdownAutoHeight,
    isInSelectionMode,
    extraClassName: containerProps?.className,
    variant
  })

  const mergedHeaderClassName = buildHeaderClassName(isEditMode, headerProps?.className, variant)

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

  // The card keeps its own handle on the chart too, so Expand can read the
  // chart's view state at click time.
  const portletComponentRef = useRef<AnalyticsPortletRef | null>(null)
  const handleSetPortletComponentRef = useCallback((el: AnalyticsPortletRef | null) => {
    portletComponentRef.current = el
    setPortletComponentRef(portlet.id, el)
  }, [portlet.id, setPortletComponentRef])

  const eagerLoad = portlet.eagerLoad ?? configEagerLoad ?? false

  // Interval refresh (features.refresh): the header shows freshness, the
  // dashboard timer does the refreshing, and the chart holds its queries
  // while scrolled away
  const { features } = useCubeFeatures()
  const refreshFeatureEnabled = isRefreshFeatureEnabled(features)
  const effectiveRefresh = useMemo(
    () => resolveEffectiveRefresh(portlet.refresh, dashboardRefresh, features),
    [portlet.refresh, dashboardRefresh, features]
  )
  const isDashboardRefreshPaused = useDashboardStore(state => state.isRefreshPaused)
  const [freshness, setFreshness] = useState<PortletFreshness>({ isFetching: false })
  const freshnessIndicator = refreshFeatureEnabled
    ? {
        computedAt: freshness.computedAt,
        isFetching: freshness.isFetching,
        intervalSeconds: effectiveRefresh?.intervalSeconds,
        isPaused: !!effectiveRefresh && isDashboardRefreshPaused
      }
    : undefined

  // Expand hands the host the exact properties this card gives AnalyticsPortlet,
  // so a chart that the host renders from them shows the same data and shares
  // the card's query cache entry. Only offered in view mode: edit mode and
  // filter selection mode own the card actions.
  const handleExpand = useMemo(() => {
    if (!onPortletExpand || isEditMode || isInSelectionMode) return undefined
    return () => {
      const chartProps: AnalyticsPortletProps = {
        query: renderQuery,
        chartType: renderChartType,
        chartConfig: renderChartConfig as ChartAxisConfig | undefined,
        displayConfig: renderDisplayConfig as ChartDisplayConfig | undefined,
        dashboardFilters,
        dashboardFilterMapping: portlet.dashboardFilterMapping,
        eagerLoad,
        title: portlet.title,
        colorPalette,
        loadingComponent
      }
      onPortletExpand({
        portletId: portlet.id,
        title: portlet.title,
        chartProps,
        viewState: portletComponentRef.current?.getViewState() ?? {}
      })
    }
  }, [
    onPortletExpand, isEditMode, isInSelectionMode, renderQuery, renderChartType,
    renderChartConfig, renderDisplayConfig, dashboardFilters, portlet.dashboardFilterMapping,
    eagerLoad, portlet.title, portlet.id, colorPalette, loadingComponent
  ])

  const handleSetChartContainerRef = useCallback((el: HTMLDivElement | null) => {
    chartContainerRef.current = el
  }, [chartContainerRef])

  return (
    <div
      data-portlet-id={portlet.id}
      ref={handleSetPortletRef}
      className={mergedContainerClassName}
      style={buildContainerStyle({ isTransparent, isInSelectionMode, hasSelectedFilter, containerStyle, variant })}
      onClick={(event) => {
        if (isInSelectionMode && selectedFilterId) {
          event.stopPropagation()
          callbacks.onToggleFilter(portlet.id, selectedFilterId)
        }
        containerOnClick?.(event)
      }}
      {...restContainerProps}
    >
      {/* Filter selection mode: show which field the selected filter targets
          on this portlet; click opens the filter config modal to change it */}
      {effectiveFilterField && (
        <FilterFieldChip
          field={effectiveFilterField}
          FilterIcon={icons.FilterIcon}
          onOpenFilterConfig={() => callbacks.onOpenFilterConfig(portlet)}
        />
      )}
      {/* Grouped children have no header, so this strip carries their actions in
          view mode too - not just edit mode. */}
      {variant === 'groupChild' && !isInSelectionMode && (
        <PortletFloatingActions
          portlet={portlet}
          icons={icons}
          showEditActions={editable && isEditMode}
          copyAvailable={copyAvailable}
          copySuccess={copySuccess}
          xlsExportAvailable={xlsExportAvailable && !!debugData}
          exportInProgress={exportInProgress}
          onRefresh={(options) => callbacks.onRefresh(portlet.id, options)}
          onCopyToClipboard={handleCopyToClipboard}
          onExportXlsx={handleExportXlsx}
          onOpenFilterConfig={() => callbacks.onOpenFilterConfig(portlet)}
          onDuplicate={() => callbacks.onDuplicate(portlet.id)}
          onEdit={() => callbacks.onEdit(portlet)}
          onDelete={() => callbacks.onDelete(portlet.id)}
          onExpand={handleExpand}
        />
      )}
      {variant !== 'groupChild' && (!shouldHideHeader || isEditMode) && (
        <PortletCardHeader
          portlet={portlet}
          className={mergedHeaderClassName}
          headerStyle={headerStyle}
          restHeaderProps={restHeaderProps}
          headerOnClick={headerOnClick}
          editable={editable}
          isEditMode={isEditMode}
          isInSelectionMode={isInSelectionMode}
          debugData={debugData}
          copyAvailable={copyAvailable}
          copySuccess={copySuccess}
          xlsExportAvailable={xlsExportAvailable}
          exportInProgress={exportInProgress}
          showCacheBustIndicator={showCacheBustIndicator}
          unreachableDateFilterLabels={unreachableDateFilterLabels}
          icons={icons}
          isFetching={freshness.isFetching}
          freshness={freshnessIndicator}
          onRefresh={(options) => callbacks.onRefresh(portlet.id, options)}
          onHoverRefreshChange={setIsHoveringRefresh}
          onCopyToClipboard={handleCopyToClipboard}
          onExportXlsx={handleExportXlsx}
          onOpenFilterConfig={() => callbacks.onOpenFilterConfig(portlet)}
          onDuplicate={() => callbacks.onDuplicate(portlet.id)}
          onEdit={() => callbacks.onEdit(portlet)}
          onDelete={() => callbacks.onDelete(portlet.id)}
          onExpand={handleExpand}
        />
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
        eagerLoad={eagerLoad}
        hasIntervalRefresh={!!effectiveRefresh}
        title={portlet.title}
        isMarkdownAutoHeight={isMarkdownAutoHeight}
        colorPalette={colorPalette}
        loadingComponent={loadingComponent}
        onDebugDataReady={handleDebugDataReady}
        onFreshnessChange={setFreshness}
      />
    </div>
  )
}, arePropsEqual)

export default DashboardPortletCard
