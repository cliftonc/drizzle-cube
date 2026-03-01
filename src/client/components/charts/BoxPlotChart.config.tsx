import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { getChartTypeIcon } from '../../icons'

/**
 * Configuration for the box plot chart type
 */
export const boxPlotChartConfig: ChartTypeConfig = {
  label: 'Box Plot',
  icon: getChartTypeIcon('bar'),
  description: 'Show statistical distribution (median, IQR, whiskers) across categories',
  useCase:
    'Best for P&L spread per symbol, trade size distribution, latency distribution across platforms',
  dropZones: [
    {
      key: 'xAxis',
      label: 'X-Axis (Groups)',
      description: 'Dimension to group boxes by (e.g. symbol, platform)',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'Drop a dimension here',
    },
    {
      key: 'yAxis',
      label: 'Y-Axis (Measures)',
      description:
        'Drop 1 measure for auto mode, 3 for avg/stddev/median mode, or 5 for min/q1/median/q3/max mode',
      mandatory: true,
      maxItems: 5,
      acceptTypes: ['measure'],
      emptyText: 'Drop 1, 3, or 5 measures here',
    },
  ],
  displayOptionsConfig: [
    {
      key: 'leftYAxisFormat',
      label: 'Y-Axis Format',
      type: 'axisFormat',
      description: 'Number formatting for the value axis',
    },
  ],
}
