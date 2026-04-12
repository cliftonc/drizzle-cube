import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the pie chart type
 */
export const pieChartConfig: ChartTypeConfig = {
  label: 'chart.pie.label',
  description: 'chart.pie.description',
  useCase: 'chart.pie.useCase',
  clickableElements: { slice: true },
  isAvailable: ({ measureCount, dimensionCount }) => {
    if (measureCount < 1) return { available: false, reason: 'chart.availability.requiresMeasure' }
    if (dimensionCount < 1) return { available: false, reason: 'chart.availability.requiresDimension' }
    return { available: true }
  },
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.configText.categories',
      description: 'chart.configText.dimension_for_pie_slices',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'chart.pie.dropZone.xAxis.empty'
    },
    {
      key: 'yAxis',
      label: 'chart.configText.values',
      description: 'chart.configText.measure_for_slice_sizes',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'chart.pie.dropZone.yAxis.empty'
    }
  ],
  displayOptions: ['showLegend', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'innerRadius',
      label: 'chart.option.innerRadius.label',
      type: 'select',
      description: 'chart.configText.hollow_center_size_0_percent_solid_pie_higher_donut_style',
      defaultValue: '0%',
      options: [
        { value: '0%', label: 'chart.configText.none_pie' },
        { value: '20%', label: 'chart.configText.20_percent' },
        { value: '40%', label: 'chart.configText.40_percent' },
        { value: '60%', label: 'chart.configText.60_percent' },
        { value: '80%', label: 'chart.configText.80_percent' },
      ]
    },
    {
      key: 'leftYAxisFormat',
      label: 'chart.option.valueFormat.label',
      type: 'axisFormat',
      description: 'chart.option.valueFormat.description'
    }
  ]
}