import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the KPI Delta chart type
 */
export const kpiDeltaConfig: ChartTypeConfig = {
  label: t('chart.kpiDelta.label'),
  description: t('chart.kpiDelta.description'),
  useCase: t('chart.kpiDelta.useCase'),
  dropZones: [
    {
      key: 'yAxis',
      label: t('chart.configText.value'),
      description: t('chart.configText.measure_to_track_changes_for'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure here'
    },
    {
      key: 'xAxis',
      label: t('chart.configText.dimension_optional'),
      description: t('chart.configText.dimension_for_ordering_data_typically_time'),
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'Drop a dimension for ordering'
    }
  ],
  displayOptionsConfig: [
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
      defaultValue: 1,
      min: 0,
      max: 10,
      step: 1,
      description: t('chart.option.decimals.description')
    },
    {
      key: 'positiveColorIndex',
      label: t('chart.configText.positive_change_color'),
      type: 'paletteColor',
      defaultValue: 2, // Typically green in most palettes
      description: t('chart.configText.color_for_positive_changes_increases')
    },
    {
      key: 'negativeColorIndex',
      label: t('chart.configText.negative_change_color'), 
      type: 'paletteColor',
      defaultValue: 3, // Typically red in most palettes
      description: t('chart.configText.color_for_negative_changes_decreases')
    },
    {
      key: 'showHistogram',
      label: t('chart.option.showHistogram.label'),
      type: 'boolean',
      defaultValue: true,
      description: t('chart.option.showHistogram.description')
    },
    {
      key: 'useLastCompletePeriod',
      label: t('chart.option.useLastCompletePeriod.label'),
      type: 'boolean',
      defaultValue: true,
      description: t('chart.configText.exclude_current_incomplete_period_from_delta_calculation_e_g_partial_wee')
    },
    {
      key: 'skipLastPeriod',
      label: t('chart.option.skipLastPeriod.label'),
      type: 'boolean',
      defaultValue: false,
      description: t('chart.option.skipLastPeriod.description')
    }
  ],
  displayOptions: ['hideHeader'],
  validate: (config: any) => {
    if (!config.yAxis || (Array.isArray(config.yAxis) && config.yAxis.length === 0)) {
      return {
        isValid: false,
        message: 'A measure is required for KPI Delta charts'
      }
    }
    
    return { isValid: true }
  }
}