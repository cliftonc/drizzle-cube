/**
 * Resolves the portlet's data for the active mode and renders the lazy chart
 * (with the sankey/sunburst toggle and drill wiring). Extracted from
 * AnalyticsPortlet to keep the component flat. No behaviour change.
 */

import { LazyChart, isValidChartType } from '../../charts/ChartLoader'
import { useTranslation } from '../../hooks/useTranslation'
import type { ChartAxisConfig, ChartDisplayConfig, ChartType, CubeQuery } from '../../types'
import type { FlowChartData } from '../../types/flow'
import type { RetentionChartData } from '../../types/retention'
import type { ColorPalette } from '../../utils/colorPalettes'

type Height = string | number

interface ResultSetLike {
  tablePivot: () => unknown
  rawData: () => unknown
}

export interface PortletChartProps {
  chartType: ChartType
  height: Height
  shouldSkipQuery: boolean
  isMultiQuery: boolean
  isFunnelMode: boolean
  isFlowMode: boolean
  isRetentionMode: boolean
  resultSet: ResultSetLike | null
  multiQueryData: unknown[] | null
  flowChartData: FlowChartData | null
  retentionChartData: RetentionChartData | null
  chartConfig?: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
  activeQuery: CubeQuery | null
  colorPalette?: ColorPalette
  drillEnabled: boolean
  currentChartConfig?: ChartAxisConfig | null
  onDataPointClick?: (...args: any[]) => void
}

/**
 * Resolve the chart data array (or flow/retention structure) for the active mode.
 */
function resolvePortletData(props: PortletChartProps): unknown {
  const {
    shouldSkipQuery,
    isRetentionMode,
    isFlowMode,
    isFunnelMode,
    isMultiQuery,
    resultSet,
    multiQueryData,
    flowChartData,
    retentionChartData,
    chartType
  } = props

  // Charts that don't use query data
  if (shouldSkipQuery) return []
  // Retention charts expect { rows: [], periods: [] } structure
  if (isRetentionMode) return retentionChartData || { rows: [], periods: [] }
  // Sankey chart expects { nodes: [], links: [] } structure
  if (isFlowMode) return flowChartData || { nodes: [], links: [] }
  if (isFunnelMode) return multiQueryData || []
  if (isMultiQuery) return multiQueryData || []
  if (!resultSet) return []

  switch (chartType) {
    case 'pie':
    case 'table':
      return resultSet.tablePivot()
    default:
      return resultSet.rawData()
  }
}

export function PortletChart(props: PortletChartProps) {
  const { t } = useTranslation()
  const {
    chartType,
    height,
    chartConfig,
    displayConfig,
    activeQuery,
    colorPalette,
    drillEnabled,
    currentChartConfig,
    onDataPointClick
  } = props

  try {
    // Determine effective chart type (handles sankey/sunburst toggle)
    const effectiveChartType = chartType === 'sankey' &&
      (displayConfig as Record<string, unknown>)?.flowVisualization === 'sunburst'
        ? 'sunburst'
        : chartType

    // Handle unsupported chart types
    if (!isValidChartType(effectiveChartType)) {
      return (
        <div className="dc:flex dc:items-center dc:justify-center dc:w-full" style={{ height }}>
          <div className="dc:text-center text-dc-text-muted">
            <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('portlet.unsupportedChartType')}</div>
            <div className="dc:text-xs">{effectiveChartType}</div>
          </div>
        </div>
      )
    }

    // Cast to unknown[] for ChartProps - specific charts (like Sankey) handle their own data format
    const data = resolvePortletData(props) as unknown as unknown[]

    // For markdown chart, use empty data array
    const chartData = effectiveChartType === 'markdown' ? [] : data

    // Use drill chart config if available, otherwise fall back to original
    const effectiveChartConfig = (drillEnabled && currentChartConfig)
      ? currentChartConfig
      : chartConfig

    return (
      <LazyChart
        chartType={effectiveChartType}
        data={chartData}
        chartConfig={effectiveChartConfig}
        displayConfig={displayConfig}
        queryObject={activeQuery ?? undefined}
        height={height}
        colorPalette={colorPalette}
        onDataPointClick={drillEnabled ? onDataPointClick : undefined}
        drillEnabled={drillEnabled}
        fallback={
          <div
            className="dc:flex dc:items-center dc:justify-center dc:w-full"
            style={{ height: typeof height === 'number' ? `${height}px` : height }}
          >
            <div className="dc:animate-pulse bg-dc-surface-secondary dc:rounded dc:w-full dc:h-full dc:min-h-[100px]" />
          </div>
        }
      />
    )
  } catch (error) {
    console.error('Chart rendering error:', error)
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted dc:p-4" style={{ height }}>
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('portlet.unableToRender')}</div>
          <div className="dc:text-xs text-dc-text-secondary">{error instanceof Error ? error.message : t('errorBoundary.unknownError')}</div>
        </div>
      </div>
    )
  }
}
