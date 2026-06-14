/**
 * Comparison Data Utilities
 * Handles period-over-period comparison data transformation for charts
 *
 * These utilities detect comparison query results (with __periodIndex metadata)
 * and transform them for visualization in either 'separate' or 'overlay' mode.
 */

/**
 * Check if data contains comparison period metadata
 */
export function isComparisonData(data: any[]): boolean {
  return data.length > 0 && '__periodIndex' in data[0]
}

/**
 * Get unique period labels from comparison data
 */
export function getPeriodLabels(data: any[]): string[] {
  if (!isComparisonData(data)) return []

  const labels = new Set<string>()
  for (const row of data) {
    if (row.__period) {
      labels.add(row.__period)
    }
  }
  return Array.from(labels)
}

/**
 * Get period indices from comparison data
 */
export function getPeriodIndices(data: any[]): number[] {
  if (!isComparisonData(data)) return []

  const indices = new Set<number>()
  for (const row of data) {
    if (typeof row.__periodIndex === 'number') {
      indices.add(row.__periodIndex)
    }
  }
  return Array.from(indices).sort((a, b) => a - b)
}

/**
 * Generate a short label for a period (used in legends)
 * Uses simple "Current" / "Prior" labels for clarity
 */
export function generatePeriodShortLabel(_periodLabel: string, index: number): string {
  return index === 0 ? 'Current' : 'Prior'
}

/**
 * Transform comparison data for 'separate' mode
 * Returns data with each row having its original measure values
 * Series are created per period (e.g., "totalLinesOfCode (Current)", "totalLinesOfCode (Prior)")
 */
export function transformForSeparateMode(
  data: any[],
  measures: string[],
  _timeDimensionKey: string
): { data: any[], seriesKeys: string[] } {
  if (!isComparisonData(data)) {
    return { data, seriesKeys: measures }
  }

  const periodLabels = getPeriodLabels(data)
  const seriesKeys: string[] = []

  // Create series key for each measure + period combination
  for (const measure of measures) {
    for (let i = 0; i < periodLabels.length; i++) {
      const shortLabel = generatePeriodShortLabel(periodLabels[i], i)
      const key = `${measure} (${shortLabel})`
      seriesKeys.push(key)
    }
  }

  // Data already has period info, just return as-is for separate mode
  // The chart will group by time dimension and show multiple lines
  return { data, seriesKeys }
}

/**
 * Detect dimension fields in comparison data
 * Returns fields that are not measures, time dimension, or metadata fields
 */
function detectDimensionFields(
  data: any[],
  measures: string[],
  timeDimensionKey: string
): string[] {
  if (data.length === 0) return []

  const metadataFields = ['__period', '__periodIndex', '__periodDayIndex']
  const firstRow = data[0]
  const dimensions: string[] = []

  for (const key of Object.keys(firstRow)) {
    if (
      !measures.includes(key) &&
      key !== timeDimensionKey &&
      !metadataFields.includes(key)
    ) {
      dimensions.push(key)
    }
  }

  return dimensions
}

/**
 * Get unique dimension values from data for a set of dimension fields
 */
function getUniqueDimensionValues(
  data: any[],
  dimensionFields: string[]
): Map<string, Set<any>> {
  const values = new Map<string, Set<any>>()

  for (const field of dimensionFields) {
    values.set(field, new Set())
  }

  for (const row of data) {
    for (const field of dimensionFields) {
      if (row[field] !== undefined && row[field] !== null) {
        values.get(field)!.add(row[field])
      }
    }
  }

  return values
}

/**
 * Transform comparison data for 'overlay' mode
 * Pivots data so each row represents a day-of-period index,
 * with separate columns for each period's values.
 *
 * When dimensions are present, creates series keys that include
 * dimension values: "Engineering - Total Lines of Code (Current)"
 *
 * Input (without dimensions):
 *   [
 *     { date: '2024-01-01', value: 100, __periodIndex: 0, __periodDayIndex: 0 },
 *     { date: '2024-01-02', value: 110, __periodIndex: 0, __periodDayIndex: 1 },
 *     { date: '2023-01-01', value: 80, __periodIndex: 1, __periodDayIndex: 0 },
 *     { date: '2023-01-02', value: 85, __periodIndex: 1, __periodDayIndex: 1 },
 *   ]
 *
 * Output (without dimensions):
 *   [
 *     { __periodDayIndex: 0, 'value (Current)': 100, 'value (Prior)': 80 },
 *     { __periodDayIndex: 1, 'value (Current)': 110, 'value (Prior)': 85 },
 *   ]
 *
 * Input (with dimensions):
 *   [
 *     { date: '2024-01-01', 'Dept.name': 'Engineering', value: 100, __periodIndex: 0, __periodDayIndex: 0 },
 *     { date: '2024-01-01', 'Dept.name': 'Sales', value: 50, __periodIndex: 0, __periodDayIndex: 0 },
 *     { date: '2023-01-01', 'Dept.name': 'Engineering', value: 80, __periodIndex: 1, __periodDayIndex: 0 },
 *     { date: '2023-01-01', 'Dept.name': 'Sales', value: 40, __periodIndex: 1, __periodDayIndex: 0 },
 *   ]
 *
 * Output (with dimensions):
 *   [
 *     {
 *       __periodDayIndex: 0,
 *       'Engineering - value (Current)': 100,
 *       'Engineering - value (Prior)': 80,
 *       'Sales - value (Current)': 50,
 *       'Sales - value (Prior)': 40,
 *     },
 *   ]
 */
export function transformForOverlayMode(
  data: any[],
  measures: string[],
  timeDimensionKey: string,
  getFieldLabel?: (fieldName: string) => string
): { data: any[], seriesKeys: string[], xAxisKey: string } {
  if (!isComparisonData(data)) {
    return { data, seriesKeys: measures, xAxisKey: timeDimensionKey }
  }

  const periodLabels = getPeriodLabels(data)
  const periodIndices = getPeriodIndices(data)

  // Detect dimension fields in the data
  const dimensionFields = detectDimensionFields(data, measures, timeDimensionKey)
  const hasDimensions = dimensionFields.length > 0

  // Get unique dimension values for generating series keys
  const uniqueDimensionValues = hasDimensions
    ? getUniqueDimensionValues(data, dimensionFields)
    : null

  const transformedData = pivotByDayIndex(data, measures, timeDimensionKey, {
    dimensionFields,
    hasDimensions,
    periodLabels,
    getFieldLabel
  })

  const seriesKeys = buildOverlaySeriesKeys(measures, periodLabels, periodIndices, {
    dimensionFields,
    uniqueDimensionValues,
    getFieldLabel
  })

  return {
    data: transformedData,
    seriesKeys,
    xAxisKey: '__periodDayIndex'
  }
}

/**
 * Build the `dimensionValue / dimensionValue` prefix for a comparison row,
 * applying field labels when available. Empty when no dimensions are present.
 */
function buildDimensionPrefix(
  row: any,
  dimensionFields: string[],
  getFieldLabel?: (fieldName: string) => string
): string {
  if (dimensionFields.length === 0) return ''
  const dimensionValues = dimensionFields.map(field => {
    const value = row[field]
    return getFieldLabel ? getFieldLabel(String(value)) : String(value)
  })
  return dimensionValues.join(' / ')
}

/**
 * Pivot comparison rows so each output row is one `__periodDayIndex`, with a
 * column per measure/dimension/period combination.
 */
function pivotByDayIndex(
  data: any[],
  measures: string[],
  timeDimensionKey: string,
  opts: {
    dimensionFields: string[]
    hasDimensions: boolean
    periodLabels: string[]
    getFieldLabel?: (fieldName: string) => string
  }
): any[] {
  const { dimensionFields, hasDimensions, periodLabels, getFieldLabel } = opts
  const groupedByDayIndex = new Map<number, Record<string, any>>()

  for (const row of data) {
    const dayIndex = row.__periodDayIndex
    const periodIndex = row.__periodIndex

    if (!groupedByDayIndex.has(dayIndex)) {
      groupedByDayIndex.set(dayIndex, {
        __periodDayIndex: dayIndex,
        // Store the date from the first period (index 0) for reference
        __displayDate: periodIndex === 0 ? row[timeDimensionKey] : undefined
      })
    }

    const groupedRow = groupedByDayIndex.get(dayIndex)!

    // If this is the first period and we don't have a display date yet, add it
    if (!groupedRow.__displayDate && row[timeDimensionKey]) {
      groupedRow.__displayDate = row[timeDimensionKey]
    }

    // Build dimension prefix if dimensions are present
    const dimensionPrefix = hasDimensions
      ? buildDimensionPrefix(row, dimensionFields, getFieldLabel)
      : ''

    // Add measure values with optional dimension prefix and period suffix
    const shortLabel = generatePeriodShortLabel(periodLabels[periodIndex] || '', periodIndex)
    for (const measure of measures) {
      const displayName = getFieldLabel ? getFieldLabel(measure) : measure
      const key = dimensionPrefix
        ? `${dimensionPrefix} - ${displayName} (${shortLabel})`
        : `${displayName} (${shortLabel})`
      groupedRow[key] = row[measure]
    }
  }

  // Convert to array and sort by day index
  return Array.from(groupedByDayIndex.values())
    .sort((a, b) => a.__periodDayIndex - b.__periodDayIndex)
}

/**
 * Generate the overlay-mode series keys (matching the data column names) for
 * each measure/dimension-combination/period.
 */
function buildOverlaySeriesKeys(
  measures: string[],
  periodLabels: string[],
  periodIndices: number[],
  opts: {
    dimensionFields: string[]
    uniqueDimensionValues: Map<string, Set<any>> | null
    getFieldLabel?: (fieldName: string) => string
  }
): string[] {
  const { dimensionFields, uniqueDimensionValues, getFieldLabel } = opts
  const seriesKeys: string[] = []

  // When dimensions are present, prefix each series key with the combination;
  // otherwise use a single empty prefix to share the measure/period loop.
  const dimensionCombinations = uniqueDimensionValues
    ? generateDimensionCombinations(dimensionFields, uniqueDimensionValues, getFieldLabel)
    : ['']

  for (const dimCombo of dimensionCombinations) {
    for (const measure of measures) {
      const displayName = getFieldLabel ? getFieldLabel(measure) : measure
      for (let i = 0; i < periodIndices.length; i++) {
        const shortLabel = generatePeriodShortLabel(periodLabels[i] || '', i)
        seriesKeys.push(
          dimCombo
            ? `${dimCombo} - ${displayName} (${shortLabel})`
            : `${displayName} (${shortLabel})`
        )
      }
    }
  }

  return seriesKeys
}

/**
 * Generate all combinations of dimension values as formatted strings
 */
function generateDimensionCombinations(
  dimensionFields: string[],
  uniqueValues: Map<string, Set<any>>,
  getFieldLabel?: (fieldName: string) => string
): string[] {
  if (dimensionFields.length === 0) return []

  // For single dimension, just return the values
  if (dimensionFields.length === 1) {
    const field = dimensionFields[0]
    const values = Array.from(uniqueValues.get(field) || [])
    return values.map(v => getFieldLabel ? getFieldLabel(String(v)) : String(v))
  }

  // For multiple dimensions, generate cartesian product
  const result: string[] = []
  const fieldValues = dimensionFields.map(field =>
    Array.from(uniqueValues.get(field) || [])
  )

  function generateCombos(index: number, current: string[]): void {
    if (index === fieldValues.length) {
      const formatted = current.map(v =>
        getFieldLabel ? getFieldLabel(String(v)) : String(v)
      )
      result.push(formatted.join(' / '))
      return
    }

    for (const value of fieldValues[index]) {
      generateCombos(index + 1, [...current, value])
    }
  }

  generateCombos(0, [])
  return result
}

/**
 * Format the period day index for display on X-axis
 * Can show as "Day 1", "Day 2", etc., or as the original date
 */
export function formatPeriodDayIndex(
  dayIndex: number,
  displayDate?: string | Date,
  options?: {
    showDayNumber?: boolean
    dateFormat?: 'short' | 'long'
  }
): string {
  if (options?.showDayNumber) {
    return `Day ${dayIndex + 1}`
  }

  if (displayDate) {
    const date = typeof displayDate === 'string' ? new Date(displayDate) : displayDate
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        month: options?.dateFormat === 'long' ? 'long' : 'short',
        day: 'numeric'
      })
    }
  }

  return `${dayIndex + 1}`
}

/**
 * Check if a series key represents a prior period (not the first period)
 * Used for applying different styling to prior period lines
 */
export function isPriorPeriodSeries(seriesKey: string, periodLabels: string[]): boolean {
  if (periodLabels.length < 2) return false

  // Check if the series key contains any label other than the first period's
  for (let i = 1; i < periodLabels.length; i++) {
    const shortLabel = generatePeriodShortLabel(periodLabels[i], i)
    if (seriesKey.includes(`(${shortLabel})`)) {
      return true
    }
  }

  // Also check for "(Prior" pattern
  return seriesKey.includes('(Prior')
}

/**
 * Get the stroke dash array for prior period styling
 */
export function getPriorPeriodStrokeDashArray(
  style: 'solid' | 'dashed' | 'dotted' = 'dashed'
): string | undefined {
  switch (style) {
    case 'solid':
      return undefined
    case 'dashed':
      return '5 5'
    case 'dotted':
      return '2 2'
    default:
      return '5 5'
  }
}
