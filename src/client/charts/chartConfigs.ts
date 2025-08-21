import { ComponentType } from 'react'

/**
 * Configuration for a single axis drop zone in the chart configuration UI
 */
export interface AxisDropZoneConfig {
  /** The key to store this field in chartConfig (e.g., 'xAxis', 'yAxis', 'sizeField') */
  key: string
  
  /** Display label for the drop zone */
  label: string
  
  /** Optional description/help text shown below the label */
  description?: string
  
  /** Whether at least one field is required in this drop zone */
  mandatory?: boolean
  
  /** Maximum number of items allowed in this drop zone */
  maxItems?: number
  
  /** Which field types this drop zone accepts */
  acceptTypes?: ('dimension' | 'timeDimension' | 'measure')[]
  
  /** Optional icon component to display */
  icon?: ComponentType<{ className?: string }>
  
  /** Placeholder text when drop zone is empty */
  emptyText?: string
}

/**
 * Complete configuration for a chart type
 */
export interface ChartTypeConfig {
  /** Configuration for each drop zone */
  dropZones: AxisDropZoneConfig[]
  
  /** Which display options to show for this chart type */
  displayOptions?: string[]
  
  /** Optional custom validation function */
  validate?: (config: any) => { isValid: boolean; message?: string }
}

/**
 * Registry of all chart type configurations
 */
export interface ChartConfigRegistry {
  [chartType: string]: ChartTypeConfig
}

/**
 * Default configuration for charts without specific requirements
 */
export const defaultChartConfig: ChartTypeConfig = {
  dropZones: [
    {
      key: 'xAxis',
      label: 'X-Axis (Categories)',
      description: 'Dimensions and time dimensions for grouping',
      mandatory: false,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'Drop dimensions & time dimensions here'
    },
    {
      key: 'yAxis',
      label: 'Y-Axis (Values)',
      description: 'Measures for values or dimensions for series',
      mandatory: false,
      acceptTypes: ['measure', 'dimension'],
      emptyText: 'Drop measures or dimensions here'
    },
    {
      key: 'series',
      label: 'Series (Split into Multiple Series)',
      description: 'Dimensions to create separate data series',
      mandatory: false,
      acceptTypes: ['dimension'],
      emptyText: 'Drop dimensions here to split data into series'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip']
}

/**
 * Helper function to get configuration for a chart type
 */
export function getChartConfig(chartType: string, registry: ChartConfigRegistry): ChartTypeConfig {
  return registry[chartType] || defaultChartConfig
}