import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the radial bar chart type
 */
export const radialBarChartConfig: ChartTypeConfig = {
  label: 'chart.radialBar.label',
  description: 'chart.radialBar.description',
  useCase: 'chart.radialBar.useCase',
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.configText.categories',
      description: 'chart.configText.dimensions_for_radial_segments',
      mandatory: true,
      acceptTypes: ['dimension'],
      emptyText: 'chart.radialBar.dropZone.xAxis.empty'
    },
    {
      key: 'yAxis',
      label: 'chart.configText.values',
      description: 'chart.configText.measures_for_radial_bar_lengths',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'chart.radialBar.dropZone.yAxis.empty'
    }
  ],
  displayOptions: ['showLegend', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'leftYAxisFormat',
      label: 'chart.option.valueFormat.label',
      type: 'axisFormat',
      description: 'chart.option.valueFormat.description'
    }
  ]
}