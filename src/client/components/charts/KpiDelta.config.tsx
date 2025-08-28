import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { Icon } from '@iconify/react'
import trendingUpIcon from '@iconify-icons/tabler/trending-up'

/**
 * Configuration for the KPI Delta chart type
 */
export const kpiDeltaConfig: ChartTypeConfig = {
  icon: ({ className }) => <Icon icon={trendingUpIcon} className={className} />,
  description: 'Display change between latest and previous values with trend indicators',
  useCase: 'Perfect for showing performance changes over time, such as revenue growth, user acquisition changes, or other metrics where the trend and delta are more important than the absolute value',
  dropZones: [
    {
      key: 'yAxis',
      label: 'Value',
      description: 'Measure to track changes for',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure here'
    },
    {
      key: 'xAxis',
      label: 'Dimension (optional)',
      description: 'Dimension for ordering data (typically time)',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'Drop a dimension for ordering'
    }
  ],
  displayOptionsConfig: [
    {
      key: 'prefix',
      label: 'Prefix',
      type: 'string',
      placeholder: 'e.g., $, €, #',
      description: 'Text to display before the number'
    },
    {
      key: 'suffix',
      label: 'Suffix',
      type: 'string',
      placeholder: 'e.g., %, units, items',
      description: 'Text to display after the number'
    },
    {
      key: 'decimals',
      label: 'Decimal Places',
      type: 'number',
      defaultValue: 1,
      min: 0,
      max: 10,
      step: 1,
      description: 'Number of decimal places to display'
    },
    {
      key: 'positiveColorIndex',
      label: 'Positive Change Color',
      type: 'paletteColor',
      defaultValue: 2, // Typically green in most palettes
      description: 'Color for positive changes (increases)'
    },
    {
      key: 'negativeColorIndex',
      label: 'Negative Change Color', 
      type: 'paletteColor',
      defaultValue: 3, // Typically red in most palettes
      description: 'Color for negative changes (decreases)'
    },
    {
      key: 'showHistogram',
      label: 'Show Variance Histogram',
      type: 'boolean',
      defaultValue: true,
      description: 'Display historical variance chart below the delta'
    }
  ],
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