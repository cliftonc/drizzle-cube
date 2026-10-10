/**
 * Resolves how one portlet renders inside MobileStackedLayout: chart inputs,
 * chrome, and height. Extracted so the layout component stays a renderer.
 */

import type { ChartAxisConfig, ChartDisplayConfig, ChartType, PortletConfig } from '../../types.js'
import { ensureAnalysisConfig } from '../../utils/configMigration.js'
import { hasIntrinsicChartHeight } from '../analyticsPortlet/intrinsicChartHeight.js'

/** Chart types that read as a metric strip when stacked inside a group. */
const KPI_CHART_TYPES: ChartType[] = ['kpiNumber', 'kpiDelta']

export interface MobilePortletDisplay {
  query: string
  chartType: ChartType
  chartConfig?: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
  isTransparent: boolean
  isAutoHeight: boolean
  shouldHideHeader: boolean
  /** Outer height in px; `isAutoHeight` callers ignore it. */
  height: number
  /** Height available to the chart once header and padding are removed. */
  contentHeight: number
}

export function resolveMobilePortletDisplay(params: {
  portlet: PortletConfig
  /** False for a portlet inside a group card, which supplies its own frame. */
  framed: boolean
  /** How many portlets share the group card, so its height can be shared out. */
  memberCount: number
}): MobilePortletDisplay {
  const { portlet, framed, memberCount } = params

  const { analysisConfig } = ensureAnalysisConfig(portlet)
  const chartModeConfig = analysisConfig.charts[analysisConfig.analysisType]
  const chartType = chartModeConfig?.chartType || 'line'

  let displayConfig = chartModeConfig?.displayConfig

  // Stacked group members are a metric strip, so render KPIs compactly. That
  // also lifts them off AnalyticsPortlet's 200px floor, which an auto-layout
  // KPI keeps whatever height we ask for - the source of the dead space.
  if (!framed && KPI_CHART_TYPES.includes(chartType)) {
    displayConfig = { ...displayConfig, layout: 'compact' }
  }

  const isMarkdown = chartType === 'markdown'
  const isTransparent = isMarkdown && !!displayConfig?.transparentBackground
  const isAutoHeight = isMarkdown && (displayConfig?.autoHeight ?? true)

  // Group members are headerless for the same reason they are on desktop (see
  // resolveDisplayModes' `groupChild` variant): the group card owns the title.
  const shouldHideHeader = !framed
    ? true
    : isMarkdown
      ? (displayConfig?.hideHeader ?? true) || !portlet.title
      : (displayConfig?.hideHeader ?? false)

  // Stored h * rowHeight (80px), with a floor. A group member carries the
  // group's full desktop height because members sit side by side there;
  // stacking them here would make the card N times taller, so share it out.
  const memberFloor = hasIntrinsicChartHeight(chartType, displayConfig) ? 96 : 200
  const height = framed
    ? Math.max(300, portlet.h * 80)
    : Math.max(memberFloor, (portlet.h * 80) / memberCount)

  // Header is ~40px when shown; content padding (py-3) is 24px.
  const contentHeight = height - (shouldHideHeader ? 0 : 40) - 24

  return {
    query: JSON.stringify(analysisConfig.query),
    chartType,
    chartConfig: chartModeConfig?.chartConfig,
    displayConfig,
    isTransparent,
    isAutoHeight,
    shouldHideHeader,
    height,
    contentHeight
  }
}
