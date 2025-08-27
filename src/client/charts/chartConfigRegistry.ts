import { barChartConfig } from '../components/charts/BarChart.config'
import { lineChartConfig } from '../components/charts/LineChart.config'
import { areaChartConfig } from '../components/charts/AreaChart.config'
import { pieChartConfig } from '../components/charts/PieChart.config'
import { scatterChartConfig } from '../components/charts/ScatterChart.config'
import { bubbleChartConfig } from '../components/charts/BubbleChart.config'
import { radarChartConfig } from '../components/charts/RadarChart.config'
import { radialBarChartConfig } from '../components/charts/RadialBarChart.config'
import { treemapChartConfig } from '../components/charts/TreeMapChart.config'
import { dataTableConfig } from '../components/charts/DataTable.config'
import { activityGridChartConfig } from '../components/charts/ActivityGridChart.config'
import { kpiNumberConfig } from '../components/charts/KpiNumber.config'
import { kpiTextConfig } from '../components/charts/KpiText.config'
import type { ChartConfigRegistry } from './chartConfigs'

/**
 * Registry of all chart type configurations
 */
export const chartConfigRegistry: ChartConfigRegistry = {
  bar: barChartConfig,
  line: lineChartConfig,
  area: areaChartConfig,
  pie: pieChartConfig,
  scatter: scatterChartConfig,
  bubble: bubbleChartConfig,
  radar: radarChartConfig,
  radialBar: radialBarChartConfig,
  treemap: treemapChartConfig,
  table: dataTableConfig,
  activityGrid: activityGridChartConfig,
  kpiNumber: kpiNumberConfig,
  kpiText: kpiTextConfig
}