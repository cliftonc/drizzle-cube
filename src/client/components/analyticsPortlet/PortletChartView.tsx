/**
 * Success-state view for AnalyticsPortlet: error boundary wrapper, optional
 * drill breadcrumb, the chart, and the drill menu. Extracted to keep the main
 * component flat. No behaviour change.
 */

import ChartErrorBoundary from '../ChartErrorBoundary.js'
import { DrillMenu } from '../DrillMenu.js'
import { DrillBreadcrumb } from '../DrillBreadcrumb.js'
import { PortletChart } from './PortletChart.js'
import { hasIntrinsicChartHeight } from './intrinsicChartHeight.js'
import { useTranslation } from '../../hooks/useTranslation.js'
import type { ChartAxisConfig, ChartDisplayConfig, ChartPagination, ChartType, CubeQuery } from '../../types.js'
import type { FlowChartData } from '../../types/flow.js'
import type { RetentionChartData } from '../../types/retention.js'
import type { ColorPalette } from '../../utils/colorPalettes.js'
import type { DrillInteraction } from '../../types/drill.js'

type Height = string | number

interface ResultSetLike {
  tablePivot: () => unknown
  rawData: () => unknown
}

export interface PortletChartViewProps {
  title?: string
  query: string
  chartType: ChartType
  height: Height
  chartConfig?: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
  colorPalette?: ColorPalette
  shouldSkipQuery: boolean
  isMultiQuery: boolean
  isFunnelMode: boolean
  isFlowMode: boolean
  isRetentionMode: boolean
  resultSet: ResultSetLike | null
  multiQueryData: unknown[] | null
  flowChartData: FlowChartData | null
  retentionChartData: RetentionChartData | null
  activeQuery: CubeQuery | null
  pagination?: ChartPagination
  /** Members dropped because the model no longer has them; surfaced as a note. */
  droppedMembers?: string[]
  drill: DrillInteraction
  isDrillEnabled: boolean
  onNavigateBack: () => void
  onNavigateToLevel: (index: number) => void
}

export function PortletChartView(props: PortletChartViewProps) {
  const { t } = useTranslation()
  const {
    title,
    query,
    chartType,
    height,
    chartConfig,
    displayConfig,
    colorPalette,
    shouldSkipQuery,
    isMultiQuery,
    isFunnelMode,
    isFlowMode,
    isRetentionMode,
    resultSet,
    multiQueryData,
    flowChartData,
    retentionChartData,
    activeQuery,
    pagination,
    droppedMembers,
    drill,
    isDrillEnabled,
    onNavigateBack,
    onNavigateToLevel
  } = props

  const hasIntrinsicHeight = hasIntrinsicChartHeight(chartType, displayConfig)

  return (
    <>
      <ChartErrorBoundary
        portletTitle={title}
        portletConfig={{ chartType, chartConfig, displayConfig, height }}
        cubeQuery={query}
      >
        <div className="dc:w-full dc:h-full dc:flex dc:flex-col dc:flex-1" style={{ minHeight: hasIntrinsicHeight ? undefined : '200px' }}>
          {/* Drill breadcrumb - shows when drilling into data */}
          {isDrillEnabled && drill.drillPath.length > 0 && (
            <div className="dc:mb-2 dc:flex-shrink-0">
              <DrillBreadcrumb
                path={drill.drillPath}
                onNavigate={onNavigateBack}
                onLevelClick={onNavigateToLevel}
              />
            </div>
          )}

          {/* Columns the model no longer has. Muted rather than an error: the
              rest of the widget is still correct, and a deleted attribute
              should not take the dashboard down. */}
          {droppedMembers && droppedMembers.length > 0 && (
            <div className="dc:mb-1 dc:flex-shrink-0 dc:text-xs text-dc-text-muted dc:truncate" title={droppedMembers.join(', ')}>
              {t('portlet.droppedMembers', { members: droppedMembers.join(', ') })}
            </div>
          )}

          {/* Chart content */}
          <div className="dc:flex-1 dc:min-h-0">
            <PortletChart
              chartType={chartType}
              height={height}
              shouldSkipQuery={shouldSkipQuery}
              isMultiQuery={isMultiQuery}
              isFunnelMode={isFunnelMode}
              isFlowMode={isFlowMode}
              isRetentionMode={isRetentionMode}
              resultSet={resultSet}
              multiQueryData={multiQueryData}
              flowChartData={flowChartData}
              retentionChartData={retentionChartData}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              activeQuery={activeQuery}
              pagination={pagination}
              colorPalette={colorPalette}
              drillEnabled={isDrillEnabled}
              currentChartConfig={drill.currentChartConfig}
              onDataPointClick={drill.handleDataPointClick}
            />
          </div>
        </div>
      </ChartErrorBoundary>

      {/* Drill menu - positioned absolutely near clicked point */}
      {isDrillEnabled && drill.menuOpen && drill.menuPosition && (
        <DrillMenu
          options={drill.menuOptions}
          position={drill.menuPosition}
          onSelect={drill.handleOptionSelect}
          onClose={drill.closeMenu}
        />
      )}
    </>
  )
}
