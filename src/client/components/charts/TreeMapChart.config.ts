import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the treemap chart type
 */
export const treemapChartConfig: ChartTypeConfig = {
  label: t('chart.treemap.label'),
  description: t('chart.treemap.description'),
  useCase: t('chart.treemap.useCase'),
  dropZones: [
    {
      key: 'xAxis',
      label: t('chart.configText.categories'),
      description: t('chart.configText.dimensions_for_treemap_rectangles'),
      mandatory: true,
      acceptTypes: ['dimension'],
      emptyText: 'Drop dimensions for categories'
    },
    {
      key: 'yAxis',
      label: t('chart.configText.size'),
      description: t('chart.configText.measure_for_rectangle_sizes'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure for size'
    },
    {
      key: 'series',
      label: t('chart.configText.color_groups'),
      description: t('chart.configText.dimension_to_color_rectangles_by_category'),
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Drop a dimension for color grouping'
    }
  ],
  displayOptions: ['showLegend', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'leftYAxisFormat',
      label: t('chart.option.valueFormat.label'),
      type: 'axisFormat',
      description: t('chart.configText.number_formatting_for_size_values')
    }
  ],
  clickableElements: { cell: true }
}