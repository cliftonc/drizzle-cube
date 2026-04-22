import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the radar chart type
 */
export const radarChartConfig: ChartTypeConfig = {
  label: 'chart.radar.label',
  description: 'chart.radar.description',
  useCase: 'chart.radar.useCase',
  isAvailable: ({ measureCount, dimensionCount }) => {
    if (measureCount < 1) return { available: false, reason: 'chart.availability.requiresMeasure' }
    if (dimensionCount < 1) return { available: false, reason: 'chart.availability.requiresDimension' }
    return { available: true }
  },
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.configText.axes_categories',
      description: 'chart.configText.dimensions_for_radar_axes',
      mandatory: true,
      acceptTypes: ['dimension'],
      emptyText: 'chart.radar.dropZone.xAxis.empty'
    },
    {
      key: 'yAxis',
      label: 'chart.configText.values',
      description: 'chart.configText.measures_for_radar_values',
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'chart.radar.dropZone.yAxis.empty'
    },
    {
      key: 'series',
      label: 'chart.configText.series_multiple_shapes',
      description: 'chart.configText.dimensions_to_create_multiple_radar_shapes',
      mandatory: false,
      acceptTypes: ['dimension'],
      emptyText: 'chart.radar.dropZone.series.empty'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'leftYAxisFormat',
      label: 'chart.option.valueFormat.label',
      type: 'axisFormat',
      description: 'chart.option.valueFormat.description'
    }
  ]
}