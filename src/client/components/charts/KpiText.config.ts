import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the KPI Text chart type
 */
export const kpiTextConfig: ChartTypeConfig = {
  label: t('chart.kpiText.label'),
  description: t('chart.kpiText.description'),
  useCase: t('chart.kpiText.useCase'),
  dropZones: [
    {
      key: 'yAxis',
      label: t('chart.configText.value'),
      description: t('chart.configText.measure_to_display_in_the_kpi_text_template'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure here'
    }
  ],
  displayOptionsConfig: [
    {
      key: 'template',
      label: t('chart.configText.text_template'),
      type: 'string',
      placeholder: 'e.g., Total Revenue: ${value}',
      description: t('chart.configText.template_for_displaying_the_text_use_value_to_insert_the_measure_value')
    },
    {
      key: 'decimals',
      label: t('chart.option.decimals.label'),
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 10,
      step: 1,
      description: t('chart.configText.number_of_decimal_places_to_display_for_numeric_values')
    },
    {
      key: 'valueColorIndex',
      label: t('chart.configText.value_color'),
      type: 'paletteColor',
      defaultValue: 0,
      description: t('chart.configText.color_from_the_dashboard_palette_for_the_kpi_value_text')
    }
  ],
  displayOptions: ['hideHeader']
}