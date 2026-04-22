import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the bar chart type
 */
export const barChartConfig: ChartTypeConfig = {
  label: 'chart.bar.label',
  description: 'chart.bar.description',
  useCase: 'chart.bar.useCase',
  clickableElements: { bar: true },
  isAvailable: ({ measureCount, dimensionCount }) => {
    if (measureCount < 1) return { available: false, reason: 'chart.availability.requiresMeasure' }
    if (dimensionCount < 1) return { available: false, reason: 'chart.availability.requiresDimension' }
    return { available: true }
  },
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.dropZone.xAxis.label',
      description: 'chart.dropZone.xAxis.description',
      mandatory: false,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'chart.bar.dropZone.xAxis.empty'
    },
    {
      key: 'yAxis',
      label: 'chart.dropZone.yAxis.label',
      description: 'chart.configText.measures_for_bar_heights',
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'chart.bar.dropZone.yAxis.empty',
      enableDualAxis: true
    },
    {
      key: 'series',
      label: 'chart.dropZone.series.label',
      description: 'chart.dropZone.series.description',
      mandatory: false,
      acceptTypes: ['dimension'],
      emptyText: 'chart.bar.dropZone.series.empty'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'showAllXLabels', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'stackType',
      label: 'chart.option.stacking.label',
      type: 'select',
      defaultValue: 'none',
      options: [
        { value: 'none', label: 'chart.option.accentBorder.none' },
        { value: 'normal', label: 'chart.option.stacking.stacked' },
        { value: 'percent', label: 'chart.option.stacking.percent' }
      ],
      description: 'chart.configText.how_to_stack_multiple_bar_series'
    },
    {
      key: 'target',
      label: 'chart.option.target.label',
      type: 'string',
      placeholder: 'e.g., 100 or 50,75 for spread',
      description: 'chart.option.target.description'
    },
    {
      key: 'leftYAxisFormat',
      label: 'chart.option.leftYAxisFormat.label',
      type: 'axisFormat',
      description: 'chart.option.leftYAxisFormat.description'
    },
    {
      key: 'rightYAxisFormat',
      label: 'chart.option.rightYAxisFormat.label',
      type: 'axisFormat',
      description: 'chart.option.rightYAxisFormat.description'
    }
  ]
}