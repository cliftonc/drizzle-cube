import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the KPI Text chart type
 */
export const kpiTextConfig: ChartTypeConfig = {
  label: 'chart.kpiText.label',
  description: 'chart.kpiText.description',
  useCase: 'chart.kpiText.useCase',
  isAvailable: ({ measureCount }) => {
    if (measureCount < 1) return { available: false, reason: 'chart.availability.requiresMeasure' }
    return { available: true }
  },
  dropZones: [
    {
      key: 'yAxis',
      label: 'chart.configText.value',
      description: 'chart.configText.measure_to_display_in_the_kpi_text_template',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'chart.kpiText.dropZone.yAxis.empty'
    }
  ],
  displayOptionsConfig: [
    {
      key: 'template',
      label: 'chart.configText.text_template',
      type: 'string',
      placeholder: 'e.g., Total Revenue: ${value}',
      description: 'chart.configText.template_for_displaying_the_text_use_value_to_insert_the_measure_value'
    },
    {
      key: 'decimals',
      label: 'chart.option.decimals.label',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 10,
      step: 1,
      description: 'chart.configText.number_of_decimal_places_to_display_for_numeric_values'
    },
    {
      key: 'valueColorIndex',
      label: 'chart.configText.value_color',
      type: 'paletteColor',
      defaultValue: 0,
      description: 'chart.configText.color_from_the_dashboard_palette_for_the_kpi_value_text'
    }
  ],
  displayOptions: ['hideHeader']
}