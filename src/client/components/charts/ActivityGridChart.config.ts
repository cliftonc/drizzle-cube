import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the activity grid chart type
 */
export const activityGridChartConfig: ChartTypeConfig = {
  label: t('chart.activityGrid.label'),
  description: t('chart.activityGrid.description'),
  useCase: t('chart.activityGrid.useCase'),
  dropZones: [
    {
      key: 'dateField',
      label: t('chart.configText.time_dimension'),
      description: t('chart.configText.time_field_that_determines_grid_structure_granularity_affects_layout'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['timeDimension'],
      emptyText: 'Drop a time dimension (granularity affects grid structure)'
    },
    {
      key: 'valueField',
      label: t('chart.configText.activity_measure'),
      description: t('chart.configText.measure_used_for_activity_intensity_color_coding'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure for activity intensity'
    }
  ],
  displayOptions: ['showLabels', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'fitToWidth',
      label: t('chart.option.fitToWidth.label'),
      type: 'boolean',
      defaultValue: false,
      description: t('chart.option.fitToWidth.description')
    }
  ],
  validate: (config) => {
    const { dateField, valueField } = config

    if (!dateField || (Array.isArray(dateField) && dateField.length === 0)) {
      return {
        isValid: false,
        message: 'Time dimension is required for activity grid'
      }
    }

    if (!valueField || (Array.isArray(valueField) && valueField.length === 0)) {
      return {
        isValid: false,
        message: 'Activity measure is required for intensity mapping'
      }
    }

    return { isValid: true }
  },
  clickableElements: { cell: true }
}