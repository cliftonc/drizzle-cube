import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the line chart type
 */
export const lineChartConfig: ChartTypeConfig = {
  label: 'chart.line.label',
  description: 'chart.line.description',
  useCase: 'chart.line.useCase',
  clickableElements: { point: true },
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
      emptyText: 'chart.line.dropZone.xAxis.empty'
    },
    {
      key: 'yAxis',
      label: 'chart.dropZone.yAxis.label',
      description: 'chart.configText.measures_for_line_values',
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'chart.line.dropZone.yAxis.empty',
      enableDualAxis: true
    },
    {
      key: 'series',
      label: 'chart.configText.series_multiple_lines',
      description: 'chart.configText.dimensions_to_create_separate_lines',
      mandatory: false,
      acceptTypes: ['dimension'],
      emptyText: 'chart.line.dropZone.series.empty'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
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
      key: 'priorPeriodStyle',
      label: 'chart.option.priorPeriodStyle.label',
      type: 'select',
      defaultValue: 'dashed',
      options: [
        { value: 'dashed', label: 'chart.option.priorPeriodStyle.dashed' },
        { value: 'dotted', label: 'chart.option.priorPeriodStyle.dotted' },
        { value: 'solid', label: 'chart.option.priorPeriodStyle.solid' }
      ],
      description: 'chart.option.priorPeriodStyle.description'
    },
    {
      key: 'priorPeriodOpacity',
      label: 'chart.option.priorPeriodOpacity.label',
      type: 'number',
      defaultValue: 0.5,
      min: 0.1,
      max: 1,
      step: 0.1,
      description: 'chart.option.priorPeriodOpacity.description'
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