import React, { useCallback, useMemo, type ReactNode } from 'react'
import type { ChartType, DashboardFilter, DashboardFilterMapping } from '../types.js'
import AnalyticsPortlet from './AnalyticsPortlet.js'
import type { ColorPalette } from '../utils/colorPalettes.js'
import { useDashboardStore, type PortletDebugDataEntry } from '../stores/dashboardStore.js'
import { ensureAnalysisConfig } from '../utils/configMigration.js'
import { mappingIncludesFilter } from '../utils/filterUtils.js'
import { arePropsEqual, type DashboardPortletCardProps } from './dashboardPortletCard/propsEqual.js'
import { resolveEffectiveFilterField } from './dashboardPortletCard/filterField.js'
import { usePortletCardActions } from './dashboardPortletCard/usePortletCardActions.js'
import PortletCardHeader from './dashboardPortletCard/PortletCardHeader.js'
import FilterFieldChip from './dashboardPortletCard/FilterFieldChip.js'
import { buildContainerClassName, buildHeaderClassName, buildContainerStyle, resolveDisplayModes } from './dashboardPortletCard/cardStyles.js'

interface PortletChartBodyProps {
  isTransparent: boolean
  setChartContainerRef: (el: HTMLDivElement | null) => void
  setPortletComponentRef: (el: { refresh: (options?: { bustCache?: boolean }) => void } | null) => void
  renderQuery: string
  renderChartType: ChartType
  renderChartConfig: unknown
  renderDisplayConfig: unknown
  dashboardFilters?: DashboardFilter[]
  dashboardFilterMapping?: DashboardFilterMapping
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

  // Markdown-specific display modes (transparency, auto-height, header visibility)
  const { isMarkdownAutoHeight, isTransparentContent, isTransparent, shouldHideHeader } = resolveDisplayModes({
    renderChartType,
    renderDisplayConfig,
    layoutMode,
    isEditMode,
    portletTitle: portlet.title
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

  const mergedContainerClassName = buildContainerClassName({
    isTransparent,
    isMarkdownAutoHeight,
    isInSelectionMode,
    extraClassName: containerProps?.className
  })

  const mergedHeaderClassName = buildHeaderClassName(isEditMode, headerProps?.className)

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
  }, [chartContainerRef])

  return (
    <div
      data-portlet-id={portlet.id}
      ref={handleSetPortletRef}
      className={mergedContainerClassName}
      style={buildContainerStyle({ isTransparent, isInSelectionMode, hasSelectedFilter, containerStyle })}
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
      {(!shouldHideHeader || isEditMode) && (
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
          icons={icons}
          onRefresh={(options) => callbacks.onRefresh(portlet.id, options)}
          onHoverRefreshChange={setIsHoveringRefresh}
          onCopyToClipboard={handleCopyToClipboard}
          onExportXlsx={handleExportXlsx}
          onOpenFilterConfig={() => callbacks.onOpenFilterConfig(portlet)}
          onDuplicate={() => callbacks.onDuplicate(portlet.id)}
          onEdit={() => callbacks.onEdit(portlet)}
          onDelete={() => callbacks.onDelete(portlet.id)}
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
