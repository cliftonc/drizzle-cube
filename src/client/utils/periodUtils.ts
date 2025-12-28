/**
 * Utility functions for detecting incomplete time periods in KPI charts
 */

/**
 * Get the end date of a period based on granularity
 * @param date - The date within the period
 * @param granularity - The time granularity (day, week, month, quarter, year)
 * @returns The end date of the period (end of day)
 */
export function getPeriodEndDate(date: Date, granularity: string): Date {
  const endDate = new Date(date)

  switch (granularity.toLowerCase()) {
    case 'day':
      // End of the same day
      endDate.setHours(23, 59, 59, 999)
      break

    case 'week': {
      // End of the week (Saturday, assuming week starts Sunday)
      const dayOfWeek = endDate.getDay()
      const daysUntilSaturday = 6 - dayOfWeek
      endDate.setDate(endDate.getDate() + daysUntilSaturday)
      endDate.setHours(23, 59, 59, 999)
      break
    }

    case 'month':
      // Last day of the month
      endDate.setMonth(endDate.getMonth() + 1, 0) // Set to day 0 of next month = last day of current month
      endDate.setHours(23, 59, 59, 999)
      break

    case 'quarter': {
      // Last day of the quarter
      const currentMonth = endDate.getMonth()
      const quarterEndMonth = Math.floor(currentMonth / 3) * 3 + 2 // 0->2, 3->5, 6->8, 9->11
      endDate.setMonth(quarterEndMonth + 1, 0) // Last day of quarter end month
      endDate.setHours(23, 59, 59, 999)
      break
    }

    case 'year':
      // December 31st
      endDate.setMonth(11, 31) // December 31
      endDate.setHours(23, 59, 59, 999)
      break

    default:
      // Unknown granularity - treat as complete
      endDate.setHours(23, 59, 59, 999)
  }

  return endDate
}

/**
 * Check if the last period in the data is complete based on granularity
 * @param lastDataPoint - The last data point in the sorted dataset
 * @param timeDimensionField - The field name containing the time value
 * @param granularity - The time granularity
 * @returns true if the period is complete, false if it's incomplete
 */
export function isLastPeriodComplete(
  lastDataPoint: any,
  timeDimensionField: string,
  granularity: string
): boolean {
  if (!lastDataPoint || !timeDimensionField || !granularity) {
    return true // Assume complete if we can't determine
  }

  const timeValue = lastDataPoint[timeDimensionField]
  if (!timeValue) {
    return true // Assume complete if no time value
  }

  // Parse the time value
  const date = new Date(timeValue)
  if (isNaN(date.getTime())) {
    return true // Assume complete if invalid date
  }

  // Get the end of this period
  const periodEnd = getPeriodEndDate(date, granularity)

  // Compare with current time
  const now = new Date()

  // If the period end is in the future, the period is incomplete
  return periodEnd <= now
}

/**
 * Extract granularity from a query object
 * @param queryObject - The CubeQuery object
 * @param dimensionField - Optional specific dimension field to match
 * @returns The granularity string or null if not found
 */
export function getQueryGranularity(
  queryObject: any,
  dimensionField?: string
): string | null {
  if (!queryObject?.timeDimensions || queryObject.timeDimensions.length === 0) {
    return null
  }

  // If a specific dimension field is provided, try to find its granularity
  if (dimensionField) {
    const matchingDim = queryObject.timeDimensions.find((td: any) =>
      td.dimension === dimensionField ||
      td.dimension?.includes(dimensionField) ||
      dimensionField?.includes(td.dimension)
    )
    if (matchingDim?.granularity) {
      return matchingDim.granularity
    }
  }

  // Fallback to first time dimension's granularity
  const firstTimeDim = queryObject.timeDimensions[0]
  return firstTimeDim?.granularity || null
}

/**
 * Filter data to exclude incomplete or last period
 * @param data - The data array sorted by time
 * @param timeDimensionField - The field containing time values
 * @param queryObject - The query object containing timeDimensions
 * @param useLastCompletePeriod - Whether to check for incomplete periods
 * @param skipLastPeriod - Whether to always skip the last period (overrides useLastCompletePeriod)
 * @returns Object with filtered data and whether filtering was applied
 */
export function filterIncompletePeriod(
  data: any[],
  timeDimensionField: string | undefined,
  queryObject: any,
  useLastCompletePeriod: boolean,
  skipLastPeriod: boolean = false
): { filteredData: any[]; excludedIncompletePeriod: boolean; skippedLastPeriod: boolean; granularity: string | null } {
  // Default return - no filtering
  const noFilter = {
    filteredData: data,
    excludedIncompletePeriod: false,
    skippedLastPeriod: false,
    granularity: null
  }

  // Need at least 2 data points to filter
  if (data.length < 2) {
    return noFilter
  }

  const granularity = getQueryGranularity(queryObject, timeDimensionField)

  // If skipLastPeriod is enabled, always skip the last period
  if (skipLastPeriod) {
    return {
      filteredData: data.slice(0, -1),
      excludedIncompletePeriod: false,
      skippedLastPeriod: true,
      granularity
    }
  }

  // Skip incomplete period check if feature is disabled
  if (!useLastCompletePeriod) {
    return { ...noFilter, granularity }
  }

  // Skip if no time dimension field
  if (!timeDimensionField) {
    return { ...noFilter, granularity }
  }

  // Skip if no time dimensions in query
  if (!queryObject?.timeDimensions || queryObject.timeDimensions.length === 0) {
    return { ...noFilter, granularity }
  }

  if (!granularity) {
    return noFilter
  }

  // Check if last period is incomplete
  const lastRow = data[data.length - 1]
  if (!isLastPeriodComplete(lastRow, timeDimensionField, granularity)) {
    return {
      filteredData: data.slice(0, -1),
      excludedIncompletePeriod: true,
      skippedLastPeriod: false,
      granularity
    }
  }

  return { ...noFilter, granularity }
}
