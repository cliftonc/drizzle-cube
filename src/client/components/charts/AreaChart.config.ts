import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the area chart type
 */
export const areaChartConfig: ChartTypeConfig = {
  label: 'chart.area.label',
  description: 'chart.area.description',
  useCase: 'chart.area.useCase',
  isAvailable: ({ measureCount, dimensionCount }) => {
    if (measureCount < 1) return { available: false, reason: 'chart.availability.requiresMeasure' }
    if (dimensionCount < 1) return { available: false, reason: 'chart.availability.requiresDimension' }
    return { available: true }
  },
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.configText.x_axis_time_categories',
      description: 'chart.configText.time_dimensions_or_dimensions_for_x_axis',
      mandatory: true,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'chart.area.dropZone.xAxis.empty'
    },
    {
      key: 'yAxis',
      label: 'chart.dropZone.yAxis.label',
      description: 'chart.configText.measures_for_area_values',
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'chart.area.dropZone.yAxis.empty',
      enableDualAxis: true
    },
    {
      key: 'series',
      label: 'chart.configText.series_stack_areas',
      description: 'chart.configText.dimensions_to_create_stacked_areas',
      mandatory: false,
      acceptTypes: ['dimension'],
      emptyText: 'chart.area.dropZone.series.empty'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'hideHeader'],
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
      description: 'chart.configText.how_to_stack_multiple_area_series'
    },
    {
      key: 'connectNulls',
      label: 'chart.option.connectNulls.label',
      type: 'boolean',
      defaultValue: false,
      description: 'chart.option.connectNulls.description'
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