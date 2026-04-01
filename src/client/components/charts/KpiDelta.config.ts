import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the KPI Delta chart type
 */
export const kpiDeltaConfig: ChartTypeConfig = {
  label: 'chart.kpiDelta.label',
  description: 'chart.kpiDelta.description',
  useCase: 'chart.kpiDelta.useCase',
  dropZones: [
    {
      key: 'yAxis',
      label: 'chart.configText.value',
      description: 'chart.configText.measure_to_track_changes_for',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'chart.kpiDelta.dropZone.yAxis.empty'
    },
    {
      key: 'xAxis',
      label: 'chart.configText.dimension_optional',
      description: 'chart.configText.dimension_for_ordering_data_typically_time',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'chart.kpiDelta.dropZone.xAxis.empty'
    }
  ],
  displayOptionsConfig: [
    {
      key: 'prefix',
      label: 'chart.option.prefix.label',
      type: 'string',
      placeholder: 'e.g., $, €, #',
      description: 'chart.option.prefix.description'
    },
    {
      key: 'suffix',
      label: 'chart.option.suffix.label',
      type: 'string',
      placeholder: 'e.g., %, units, items',
      description: 'chart.option.suffix.description'
    },
    {
      key: 'decimals',
      label: 'chart.option.decimals.label',
      type: 'number',
      defaultValue: 1,
      min: 0,
      max: 10,
      step: 1,
      description: 'chart.option.decimals.description'
    },
    {
      key: 'positiveColorIndex',
      label: 'chart.configText.positive_change_color',
      type: 'paletteColor',
      defaultValue: 2, // Typically green in most palettes
      description: 'chart.configText.color_for_positive_changes_increases'
    },
    {
      key: 'negativeColorIndex',
      label: 'chart.configText.negative_change_color', 
      type: 'paletteColor',
      defaultValue: 3, // Typically red in most palettes
      description: 'chart.configText.color_for_negative_changes_decreases'
    },
    {
      key: 'showHistogram',
      label: 'chart.option.showHistogram.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.option.showHistogram.description'
    },
    {
      key: 'useLastCompletePeriod',
      label: 'chart.option.useLastCompletePeriod.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.configText.exclude_current_incomplete_period_from_delta_calculation_e_g_partial_wee'
    },
    {
      key: 'skipLastPeriod',
      label: 'chart.option.skipLastPeriod.label',
      type: 'boolean',
      defaultValue: false,
      description: 'chart.option.skipLastPeriod.description'
    }
  ],
  displayOptions: ['hideHeader'],
  validate: (config: any) => {
    if (!config.yAxis || (Array.isArray(config.yAxis) && config.yAxis.length === 0)) {
      return {
        isValid: false,
        message: 'chart.kpiDelta.validation.measureRequired'
      }
    }
    
    return { isValid: true }
  }
}