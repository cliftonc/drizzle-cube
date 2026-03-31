import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the KPI Number chart type
 */
export const kpiNumberConfig: ChartTypeConfig = {
  label: t('chart.kpiNumber.label'),
  description: t('chart.kpiNumber.description'),
  useCase: t('chart.kpiNumber.useCase'),
  dropZones: [
    {
      key: 'yAxis',
      label: t('chart.configText.value'),
      description: t('chart.configText.measure_to_display_as_kpi_number'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure here'
    }
  ],
  displayOptionsConfig: [
    {
      key: 'target',
      label: t('chart.runtime.tooltip.targetValue'),
      type: 'string',
      placeholder: 'e.g., 100',
      description: t('chart.configText.target_value_to_compare_against_first_value_used_if_multiple_provided')
    },
    {
      key: 'prefix',
      label: t('chart.option.prefix.label'),
      type: 'string',
      placeholder: 'e.g., $, €, #',
      description: t('chart.option.prefix.description')
    },
    {
      key: 'suffix',
      label: t('chart.option.suffix.label'),
      type: 'string',
      placeholder: 'e.g., %, units, items',
      description: t('chart.option.suffix.description')
    },
    {
      key: 'decimals',
      label: t('chart.option.decimals.label'),
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 10,
      step: 1,
      description: t('chart.option.decimals.description')
    },
    {
      key: 'valueColorIndex',
      label: t('chart.configText.value_color'),
      type: 'paletteColor',
      defaultValue: 0,
      description: t('chart.configText.color_from_the_dashboard_palette_for_the_kpi_value_text')
    },
    {
      key: 'useLastCompletePeriod',
      label: t('chart.option.useLastCompletePeriod.label'),
      type: 'boolean',
      defaultValue: true,
      description: t('chart.configText.exclude_current_incomplete_period_from_aggregation_e_g_partial_week_mont')
    },
    {
      key: 'skipLastPeriod',
      label: t('chart.option.skipLastPeriod.label'),
      type: 'boolean',
      defaultValue: false,
      description: t('chart.option.skipLastPeriod.description')
    }
  ],
  displayOptions: ['hideHeader']
}