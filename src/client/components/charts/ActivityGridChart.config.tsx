import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { getChartTypeIcon } from '../../icons'

/**
 * Configuration for the activity grid chart type
 */
export const activityGridChartConfig: ChartTypeConfig = {
  icon: getChartTypeIcon('activityGrid'),
  description: 'GitHub-style activity grid showing temporal patterns across different time scales',
  useCase: 'Best for visualizing activity patterns over time. Supports hour (3hr blocks × days), day (days × weeks), week (weeks × months), month (months × quarters), and quarter (quarters × years) granularities',
  dropZones: [
    {
      key: 'dateField',
      label: 'Time Dimension',
      description: 'Time field that determines grid structure (granularity affects layout)',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['timeDimension'],
      emptyText: 'Drop a time dimension (granularity affects grid structure)'
    },
    {
      key: 'valueField',
      label: 'Activity Measure',
      description: 'Measure used for activity intensity (color coding)',
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
      label: 'Fit to Width',
      type: 'boolean',
      defaultValue: false,
      description: 'Automatically size blocks to fill portlet width and height while maintaining aspect ratio'
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