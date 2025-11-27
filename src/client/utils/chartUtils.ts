import type { FieldLabelMap } from '../hooks/useCubeMeta'

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
  if (!value) return String(value || 'Unknown')
  
  const str = String(value)
  
  // Check if it's a timestamp (ISO format or PostgreSQL format)
  // Handles formats like: "2025-04-01T00:00:00.000" or "2023-02-01 00:00:00+00"
  if (str.match(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/)) {
    // Convert PostgreSQL format to ISO format if needed
    let isoStr = str
    if (str.includes(' ')) {
      // Convert "2023-02-01 00:00:00+00" to "2023-02-01T00:00:00Z"
      isoStr = str.replace(' ', 'T').replace('+00', 'Z').replace(/\+\d{2}:\d{2}$/, 'Z')
    }
    // Ensure the timestamp ends with 'Z' if not present
    if (!isoStr.endsWith('Z') && !isoStr.includes('+')) {
      isoStr = isoStr + 'Z'
    }
    const date = new Date(isoStr)
    
    // Ensure we're working with valid date
    if (isNaN(date.getTime())) {
      return str
    }
    
    // Use UTC methods on the properly UTC-parsed date
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const hours = date.getUTCHours()
    const minutes = date.getUTCMinutes()
    
    // Format based on known granularity if provided
    if (granularity) {
      switch (granularity.toLowerCase()) {
        case 'year':
          return `${year}`
        case 'quarter':
          const quarter = Math.floor(date.getUTCMonth() / 3) + 1
          return `${year}-Q${quarter}`
        case 'month':
          return `${year}-${month}`
        case 'week':
          // For week, we could calculate week number, but let's use date for simplicity
          return `${year}-${month}-${day}`
        case 'day':
          return `${year}-${month}-${day}`
        case 'hour':
          return `${year}-${month}-${day} ${String(hours).padStart(2, '0')}:00`
        case 'minute':
          return `${year}-${month}-${day} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
        default:
          // Unknown granularity, fall back to heuristic
          break
      }
    }
    
    // Fallback heuristic if granularity not provided or unknown
    const seconds = date.getUTCSeconds()
    const milliseconds = date.getUTCMilliseconds()
    
    // If it's the first day of the month at exactly midnight UTC, it's likely a month granularity
    if (day === '01' && hours === 0 && minutes === 0 && seconds === 0 && milliseconds === 0) {
      // Check if it's also first month of a quarter (quarter granularity)
      if (month === '01' || month === '04' || month === '07' || month === '10') {
        const quarter = Math.floor(date.getUTCMonth() / 3) + 1
        return `${year}-Q${quarter}`
      }
      // Month granularity
      return `${year}-${month}`
    }
    
    // If it's exactly midnight UTC, it's likely a day granularity
    if (hours === 0 && minutes === 0 && seconds === 0 && milliseconds === 0) {
      return `${year}-${month}-${day}`
    }
    
    // If it has time components, include them (hour/minute granularity)
    if (minutes === 0 && seconds === 0 && milliseconds === 0) {
      // Hour granularity
      return `${year}-${month}-${day} ${String(hours).padStart(2, '0')}:00`
    }
    
    // Full timestamp
    return `${year}-${month}-${day} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }
  
  // Return as-is if not a timestamp
  return str
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
  } catch (e) {
    return undefined
  }
}

// Transform data for charts with proper type handling
// NOTE: Preserves null values to allow charts to handle gaps/missing data appropriately
export function transformChartData(data: any[], xAxisField: string, yAxisFields: string[], queryObject: any, labelMap: FieldLabelMap = {}) {
  if (!data || data.length === 0) return []

  const granularity = getFieldGranularity(queryObject, xAxisField)

  return data.map((row: any) => {
    const transformed: any = {
      name: formatTimeValue(row[xAxisField], granularity) || row[xAxisField] || 'Unknown',
    }

    yAxisFields.forEach(field => {
      const displayName = getFieldLabel(field, labelMap)
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
  labelMap: FieldLabelMap = {} // Optional label map for field names
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
      if (!groupedData[xValue]) {
        groupedData[xValue] = { name: String(xValue) }
      }

      // Add measures - preserve nulls for individual measures
      yAxisMeasures.forEach(measure => {
        const displayName = getFieldLabel(measure, labelMap)
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
  const chartData = transformChartData(data, xAxisField, yAxisFields, queryObject, labelMap)
  const seriesKeys = yAxisFields.map(field => getFieldLabel(field, labelMap))
  
  return {
    data: chartData,
    seriesKeys,
    hasDimensions: false
  }
}