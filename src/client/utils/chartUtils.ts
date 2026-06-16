import type { FieldLabelMap, AxisFormatConfig } from '../types.js'
import { abbreviateValue, formatByUnit } from './axisValueFormatting.js'
import { parseTimestampParts, formatByGranularity, formatByHeuristic } from './timeValueFormatting.js'

// Utility function to check if a value is a valid numeric value (not null, undefined, or NaN)
// This is used to preserve null values instead of converting them to 0
export function isValidNumericValue(value: any): boolean {
  return value !== null && value !== undefined && !isNaN(Number(value))
}

// Utility function to parse numeric value from data, preserving nulls
// Returns null for null/undefined/NaN values, otherwise returns the numeric value
export function parseNumericValue(value: any): number | null {
  if (value === null || value === undefined) return null
  const num = typeof value === 'string' ? parseFloat(value) : Number(value)
  return isNaN(num) ? null : num
}

// Utility function to format numeric values for display in charts
// Rounds to at most 2 decimal places, preserves integers
export function formatNumericValue(value: any): string {
  if (value === null || value === undefined) return 'No data'
  const num = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(num)) return String(value)
  if (Number.isInteger(num)) return num.toLocaleString()
  // Round to at most 2 decimal places, remove trailing zeros
  return parseFloat(num.toFixed(2)).toLocaleString()
}

/**
 * Format a numeric value for axis/tooltip display with configurable formatting
 *
 * @param value - The numeric value to format
 * @param config - Optional formatting configuration
 * @param locale - Optional locale string (defaults to browser locale)
 * @returns Formatted string representation of the value
 *
 * @example
 * formatAxisValue(1250000, { unit: 'currency', abbreviate: true }) // "$1.25M"
 * formatAxisValue(0.75, { unit: 'percent', decimals: 1 }) // "75.0%"
 * formatAxisValue(1234567, { abbreviate: true, decimals: 2 }) // "1.23M"
 */
export function formatAxisValue(
  value: number | null | undefined,
  config?: AxisFormatConfig,
  locale?: string
): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return 'No data'
  }

  // Handle non-numeric values
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  if (isNaN(num)) {
    return String(value)
  }

  // Handle special cases
  if (!isFinite(num)) {
    return num > 0 ? '∞' : '-∞'
  }

  // Get locale (default to browser locale)
  const effectiveLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US')

  // If no config provided, use default formatting
  if (!config) {
    return formatNumericValue(value)
  }

  const { abbreviate = true, decimals } = config

  // Calculate the display value and suffix for abbreviation
  // Default to true for abbreviation when config is provided
  const { displayValue, abbreviationSuffix } = abbreviateValue(num, abbreviate)

  // Determine decimal places
  // If decimals is undefined, use auto (2 for non-integers, 0 for integers after abbreviation)
  const effectiveDecimals = decimals !== undefined
    ? decimals
    : (Number.isInteger(displayValue) ? 0 : 2)

  // Format based on unit type
  return formatByUnit({
    displayValue,
    abbreviate,
    abbreviationSuffix,
    decimals: effectiveDecimals,
    locale: effectiveLocale,
    config,
  })
}

/**
 * Create a tick formatter function for Recharts axes
 * Returns a function that can be used as tickFormatter prop
 */
export function createAxisTickFormatter(config?: AxisFormatConfig): (value: any) => string {
  return (value: any) => formatAxisValue(value, config)
}

// Utility function to get field label from field name
export function getFieldLabel(fieldName: string, labelMap: FieldLabelMap): string {
  return labelMap[fieldName] || fieldName
}

// Utility function to transform series keys to use labels
export function transformSeriesKeysWithLabels(seriesKeys: string[], labelMap: FieldLabelMap): string[] {
  return seriesKeys.map(key => getFieldLabel(key, labelMap))
}

// Utility function to format time values for better display using known granularity
export function formatTimeValue(value: any, granularity?: string): string {

  if (!value) return 'Unknown'

  const str = String(value)

  // Check if it's a timestamp (ISO format or PostgreSQL format)
  const parts = parseTimestampParts(str)

  // Return as-is if not a (valid) timestamp
  if (!parts) {
    return str
  }

  // Format based on known granularity if provided
  if (granularity) {
    const formatted = formatByGranularity(parts, granularity)
    if (formatted !== null) {
      return formatted
    }
  }

  // Fallback heuristic if granularity not provided or unknown
  return formatByHeuristic(parts)
}

// Helper function to get granularity for a field from the query timeDimensions
export function getFieldGranularity(queryObject: any, fieldName: string): string | undefined {
  try {
    if (queryObject?.timeDimensions) {
      // Find the timeDimension that matches this field
      const timeDim = queryObject.timeDimensions.find((td: any) => {
        // Check if field name matches the dimension or dimension with granularity suffix
        return fieldName === td.dimension || 
               fieldName.startsWith(td.dimension.replace('.', '_')) ||
               fieldName === `${td.dimension}_${td.granularity}`
      })
      
      if (timeDim?.granularity) {
        return timeDim.granularity
      }
    }
    
    // Fallback: extract granularity from field name suffix if present
    const granularityMatch = fieldName.match(/_([a-z]+)$/)
    if (granularityMatch) {
      const suffix = granularityMatch[1]
      // Only return if it's a valid granularity
      if (['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second'].includes(suffix)) {
        return suffix
      }
    }
    
    return undefined
  } catch {
    return undefined
  }
}

// Transform data for charts with proper type handling
// NOTE: Preserves null values to allow charts to handle gaps/missing data appropriately
export function transformChartData(
  data: any[],
  xAxisField: string,
  yAxisFields: string[],
  queryObject: any,
  getFieldLabelFn: (fieldName: string) => string = (fieldName) => fieldName
) {
  if (!data || data.length === 0) return []

  const granularity = getFieldGranularity(queryObject, xAxisField)

  return data.map((row: any) => {
    const transformed: any = {
      name: formatTimeValue(row[xAxisField], granularity) || row[xAxisField] || 'Unknown',
    }

    yAxisFields.forEach(field => {
      const displayName = getFieldLabelFn(field)
      if (displayName === '__proto__' || displayName === 'constructor' || displayName === 'prototype') return
      // Preserve null values instead of converting to 0
      transformed[displayName] = parseNumericValue(row[field])
    })

    return transformed
  })
}

export interface ChartSeriesResult {
  data: any[]
  seriesKeys: string[]
  hasDimensions: boolean
}

// Advanced data transformation that handles both measures and dimensions on Y-axis
// NOTE: Preserves null values to allow charts to handle gaps/missing data appropriately
export function transformChartDataWithSeries(
  data: any[],
  xAxisField: string,
  yAxisFields: string[],
  queryObject: any,
  seriesFields?: string[], // New optional parameter for explicit series fields
  getFieldLabelFn: (fieldName: string) => string = (fieldName) => fieldName // Function to get field labels
): ChartSeriesResult {
  if (!data || data.length === 0) {
    return { data: [], seriesKeys: [], hasDimensions: false }
  }

  const originalQuery = queryObject || {}
  const queryDimensions = [
    ...(originalQuery.dimensions || []),
    ...(originalQuery.timeDimensions?.map((td: any) => td.dimension) || [])
  ]
  const queryMeasures = originalQuery.measures || []

  // Use explicit series fields if provided, otherwise no dimension-based series
  const yAxisMeasures = yAxisFields.filter(field => queryMeasures.includes(field))
  const yAxisDimensions = (seriesFields || []).filter(field => queryDimensions.includes(field))

  // Handle complex case with dimensions on Y-axis
  if (yAxisDimensions.length > 0) {
    // Group data by X-axis field and create separate series for dimension values
    const groupedData: { [key: string]: any } = {}

    data.forEach((row: any) => {
      const granularity = getFieldGranularity(queryObject, xAxisField)
      const xValue = formatTimeValue(row[xAxisField], granularity) || row[xAxisField] || 'Unknown'
      if (xValue === '__proto__' || xValue === 'constructor' || xValue === 'prototype') return
      if (!groupedData[xValue]) {
        groupedData[xValue] = { name: String(xValue) }
      }

      // Add measures - preserve nulls for individual measures
      yAxisMeasures.forEach(measure => {
        const displayName = getFieldLabelFn(measure)
        if (displayName === '__proto__' || displayName === 'constructor' || displayName === 'prototype') return
        const measureValue = parseNumericValue(row[measure])

        // For aggregation: sum non-null values, preserve null if all are null
        if (measureValue !== null) {
          const currentValue = groupedData[xValue][displayName]

          groupedData[xValue][displayName] = (currentValue === null || currentValue === undefined)
            ? measureValue
            : currentValue + measureValue
        } else if (!(displayName in groupedData[xValue])) {
          // Only set to null if no value exists yet
          groupedData[xValue][displayName] = null
        }
      })

      // Add dimensions as separate series (aggregate measure values by dimension)
      yAxisDimensions.forEach(dimension => {
        const dimValue = row[dimension]
        if (dimValue !== undefined && dimValue !== null) {
          const seriesName = String(dimValue)
          // Aggregate the first measure for this dimension value, or use totalCost if available
          const measureToAggregate = yAxisMeasures[0] || queryMeasures.find((m: string) =>
            m.includes('totalCost') || m.includes('count') || m.includes('sum')
          ) || queryMeasures[0]

          if (measureToAggregate) {
            if (seriesName === '__proto__' || seriesName === 'constructor' || seriesName === 'prototype') return
            const measureValue = parseNumericValue(row[measureToAggregate])

            // For dimension series: sum non-null values, preserve null if all are null
            if (measureValue !== null) {
              const currentValue = groupedData[xValue][seriesName]

              groupedData[xValue][seriesName] = (currentValue === null || currentValue === undefined)
                ? measureValue
                : currentValue + measureValue
            } else if (!(seriesName in groupedData[xValue])) {
              // Only set to null if no value exists yet
              groupedData[xValue][seriesName] = null
            }
          }
        }
      })
    })
    
    const chartData = Object.values(groupedData)
    
    // Get all series keys for rendering
    // When dimensions are on Y-axis, only show dimension series, not measures
    // The measures are the values being aggregated for each dimension series
    const dimensionSeries = Array.from(new Set(
      data.flatMap((row: any) => 
        yAxisDimensions.map(dimension => {
          const value = row[dimension]
          return value !== undefined && value !== null 
            ? String(value)
            : null
        }).filter((value): value is string => value !== null)
      )
    ))
    
    return {
      data: chartData,
      seriesKeys: dimensionSeries,
      hasDimensions: true
    }
  }
  
  // Standard measures-only path
  const chartData = transformChartData(data, xAxisField, yAxisFields, queryObject, getFieldLabelFn)
  const seriesKeys = yAxisFields.map(field => getFieldLabelFn(field))
  
  return {
    data: chartData,
    seriesKeys,
    hasDimensions: false
  }
}