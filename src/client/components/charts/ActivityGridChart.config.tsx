import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { Icon } from '@iconify/react'
import calendarIcon from '@iconify-icons/tabler/calendar-stats'

/**
 * Configuration for the activity grid chart type
 */
export const activityGridChartConfig: ChartTypeConfig = {
  icon: ({ className }) => <Icon icon={calendarIcon} className={className} />,
  description: 'GitHub-style activity grid showing temporal patterns',
  useCase: 'Best for visualizing activity patterns over time, contribution calendars, and temporal heatmaps',
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
  displayOptions: ['showLabels', 'showTooltip', 'colorIntensity'],
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
  }
}