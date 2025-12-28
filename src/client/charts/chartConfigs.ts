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

  /** Enable L/R axis toggle for items in this drop zone (for dual Y-axis support) */
  enableDualAxis?: boolean
}

/**
 * Configuration for a single display option
 */
export interface DisplayOptionConfig {
  /** The key to store this field in displayConfig */
  key: string
  
  /** Display label for the option */
  label: string
  
  /** Type of input control to render */
  type: 'boolean' | 'string' | 'number' | 'select' | 'color' | 'paletteColor' | 'axisFormat'
  
  /** Default value for the option */
  defaultValue?: any
  
  /** Placeholder text for string/number inputs */
  placeholder?: string
  
  /** Options for select type */
  options?: Array<{ value: any; label: string }>
  
  /** Help text shown below the input */
  description?: string
  
  /** Minimum value for number inputs */
  min?: number
  
  /** Maximum value for number inputs */
  max?: number
  
  /** Step value for number inputs */
  step?: number
}

/**
 * Complete configuration for a chart type
 */
export interface ChartTypeConfig {
  /** Configuration for each drop zone */
  dropZones: AxisDropZoneConfig[]
  
  /** Simple display options (backward compatibility) - rendered as boolean checkboxes */
  displayOptions?: string[]
  
  /** Structured display options with metadata for different input types */
  displayOptionsConfig?: DisplayOptionConfig[]
  
  /** Optional custom validation function */
  validate?: (config: any) => { isValid: boolean; message?: string }
  
  /** Icon component for the chart type */
  icon?: ComponentType<{ className?: string }>
  
  /** Brief description of the chart */
  description?: string
  
  /** When to use this chart type */
  useCase?: string
  
  /** Whether this chart type skips query requirements (for content-based charts like markdown) */
  skipQuery?: boolean
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