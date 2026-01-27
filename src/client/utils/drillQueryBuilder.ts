/**
 * Utilities for building drill queries from drill options
 */

import type {
  CubeQuery,
  Filter,
  CubeMeta,
  CubeMetaHierarchy,
  TimeGranularity,
  DashboardFilter
} from '../types'
import type {
  DrillOption,
  DrillResult,
  ChartDataPointClickEvent
} from '../types/drill'

/**
 * Generate a simple unique ID (no external dependency)
 */
function generateId(): string {
  return `drill-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Time granularity order from least to most granular
 * Used for determining drill direction
 */
const TIME_GRANULARITY_ORDER: TimeGranularity[] = [
  'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second'
]

/**
 * Check if a dimension is a time dimension based on metadata
 */
export function isTimeDimension(
  dimensionName: string,
  metadata: CubeMeta
): boolean {
  for (const cube of metadata.cubes) {
    const dimension = cube.dimensions.find(d => d.name === dimensionName)
    if (dimension && dimension.type === 'time') {
      return true
    }
  }
  return false
}

/**
 * Get the granularities available for a time dimension
 */
export function getTimeDimensionGranularities(
  dimensionName: string,
  metadata: CubeMeta
): TimeGranularity[] {
  for (const cube of metadata.cubes) {
    const dimension = cube.dimensions.find(d => d.name === dimensionName)
    if (dimension && dimension.type === 'time' && dimension.granularities) {
      return dimension.granularities
    }
  }
  // Default granularities if not specified
  return ['year', 'quarter', 'month', 'week', 'day', 'hour']
}

/**
 * Get the current granularity from a query's time dimensions
 */
export function getCurrentGranularity(query: CubeQuery): TimeGranularity | null {
  if (!query.timeDimensions || query.timeDimensions.length === 0) {
    return null
  }
  const granularity = query.timeDimensions[0].granularity
  if (granularity && TIME_GRANULARITY_ORDER.includes(granularity as TimeGranularity)) {
    return granularity as TimeGranularity
  }
  return null
}

/**
 * Get drillMembers for a measure from metadata
 */
export function getMeasureDrillMembers(
  measureName: string,
  metadata: CubeMeta
): string[] | null {
  for (const cube of metadata.cubes) {
    const measure = cube.measures.find(m => m.name === measureName)
    if (measure && measure.drillMembers && measure.drillMembers.length > 0) {
      return measure.drillMembers
    }
  }
  return null
}

/**
 * Get hierarchy by name from metadata
 */
export function getHierarchy(
  hierarchyName: string,
  cubeName: string,
  metadata: CubeMeta
): CubeMetaHierarchy | null {
  const cube = metadata.cubes.find(c => c.name === cubeName)
  if (cube && cube.hierarchies) {
    return cube.hierarchies.find(h => h.name === hierarchyName) || null
  }
  return null
}

/**
 * Get all hierarchies for a cube
 */
export function getCubeHierarchies(
  cubeName: string,
  metadata: CubeMeta
): CubeMetaHierarchy[] {
  const cube = metadata.cubes.find(c => c.name === cubeName)
  return cube?.hierarchies || []
}

/**
 * Find which hierarchy (if any) contains a dimension
 */
export function findHierarchyForDimension(
  dimensionName: string,
  metadata: CubeMeta
): { hierarchy: CubeMetaHierarchy; levelIndex: number } | null {
  const [cubeName] = dimensionName.split('.')
  const cube = metadata.cubes.find(c => c.name === cubeName)

  if (cube && cube.hierarchies) {
    for (const hierarchy of cube.hierarchies) {
      const levelIndex = hierarchy.levels.indexOf(dimensionName)
      if (levelIndex !== -1) {
        return { hierarchy, levelIndex }
      }
    }
  }
  return null
}

/**
 * Build drill options for a clicked data point
 */
export function buildDrillOptions(
  event: ChartDataPointClickEvent,
  query: CubeQuery,
  metadata: CubeMeta | null,
  dashboardFilters?: DashboardFilter[],
  dashboardFilterMapping?: string[]
): DrillOption[] {
  if (!metadata) {
    return []
  }

  const options: DrillOption[] = []
  const { clickedField } = event

  // Find the measure being drilled (if clicking on a measure)
  const measureName = clickedField
  const drillMembers = getMeasureDrillMembers(measureName, metadata)

  // 1. Time dimension drill options (if query has time dimensions)
  const timeDimOptions = buildTimeDrillOptions(query, metadata, dashboardFilters, dashboardFilterMapping)
  options.push(...timeDimOptions)

  // 2. Hierarchy drill options (for any dimension hierarchies in the query)
  const hierarchyOptions = buildHierarchyDrillOptions(query, metadata, dashboardFilters, dashboardFilterMapping)
  options.push(...hierarchyOptions)

  // 3. Detail drill options (if measure has drillMembers)
  // Show each drillMember as a separate option so user can choose what to drill into
  if (drillMembers && drillMembers.length > 0) {
    for (const drillMember of drillMembers) {
      const label = getDimensionLabel(drillMember, metadata)
      options.push({
        id: `details-${measureName}-${drillMember}`,
        label: `Show by ${label}`,
        type: 'details',
        icon: 'table',
        scope: 'portlet',
        measure: measureName,
        targetDimension: drillMember // Which drillMember to use
      })
    }
  }
  return options
}

/**
 * Build time-based drill options
 */
function buildTimeDrillOptions(
  query: CubeQuery,
  metadata: CubeMeta,
  _dashboardFilters?: DashboardFilter[],
  _dashboardFilterMapping?: string[]
): DrillOption[] {
  const options: DrillOption[] = []

  if (!query.timeDimensions || query.timeDimensions.length === 0) {
    return options
  }

  const timeDim = query.timeDimensions[0]
  const currentGranularity = timeDim.granularity as TimeGranularity | undefined
  const availableGranularities = getTimeDimensionGranularities(timeDim.dimension, metadata)

  if (availableGranularities.length === 0) {
    return options
  }

  // When no granularity is set, offer "View by X" options
  if (!currentGranularity) {
    for (const granularity of availableGranularities) {
      options.push({
        id: `time-set-${granularity}-portlet`,
        label: `View by ${capitalizeGranularity(granularity)}`,
        type: 'drillDown',
        icon: 'time',
        targetGranularity: granularity,
        scope: 'portlet'
      })
    }
    return options
  }

  const currentIndex = availableGranularities.indexOf(currentGranularity)

  // Drill down options (more granular)
  for (let i = currentIndex + 1; i < availableGranularities.length; i++) {
    const targetGranularity = availableGranularities[i]

    options.push({
      id: `time-down-${targetGranularity}-portlet`,
      label: `Drill to ${capitalizeGranularity(targetGranularity)}`,
      type: 'drillDown',
      icon: 'time',
      targetGranularity,
      scope: 'portlet'
    })
  }

  // Drill up options (less granular)
  for (let i = currentIndex - 1; i >= 0; i--) {
    const targetGranularity = availableGranularities[i]

    options.push({
      id: `time-up-${targetGranularity}-portlet`,
      label: `Roll up to ${capitalizeGranularity(targetGranularity)}`,
      type: 'drillUp',
      icon: 'time',
      targetGranularity,
      scope: 'portlet'
    })
  }

  return options
}

/**
 * Build hierarchy-based drill options
 */
function buildHierarchyDrillOptions(
  query: CubeQuery,
  metadata: CubeMeta,
  _dashboardFilters?: DashboardFilter[],
  _dashboardFilterMapping?: string[]
): DrillOption[] {
  const options: DrillOption[] = []

  if (!query.dimensions || query.dimensions.length === 0) {
    return options
  }

  // Check each dimension for hierarchy membership
  for (const dimension of query.dimensions) {
    const hierarchyInfo = findHierarchyForDimension(dimension, metadata)

    if (!hierarchyInfo) {
      continue
    }

    const { hierarchy, levelIndex } = hierarchyInfo

    // Drill down (more granular - next level in hierarchy)
    if (levelIndex < hierarchy.levels.length - 1) {
      const nextDimension = hierarchy.levels[levelIndex + 1]
      options.push({
        id: `hierarchy-down-${hierarchy.name}-${nextDimension}`,
        label: `Drill to ${getDimensionLabel(nextDimension, metadata)}`,
        type: 'drillDown',
        icon: 'hierarchy',
        hierarchy: hierarchy.name,
        targetDimension: nextDimension,
        scope: 'portlet'
      })
    }

    // Drill up (less granular - previous level in hierarchy)
    if (levelIndex > 0) {
      const prevDimension = hierarchy.levels[levelIndex - 1]
      options.push({
        id: `hierarchy-up-${hierarchy.name}-${prevDimension}`,
        label: `Roll up to ${getDimensionLabel(prevDimension, metadata)}`,
        type: 'drillUp',
        icon: 'hierarchy',
        hierarchy: hierarchy.name,
        targetDimension: prevDimension,
        scope: 'portlet'
      })
    }
  }

  return options
}

/**
 * Get display label for a dimension
 */
function getDimensionLabel(dimensionName: string, metadata: CubeMeta): string {
  for (const cube of metadata.cubes) {
    const dimension = cube.dimensions.find(d => d.name === dimensionName)
    if (dimension) {
      return dimension.title || dimension.shortTitle || dimensionName.split('.')[1]
    }
  }
  return dimensionName.split('.')[1]
}

/**
 * Capitalize a granularity name
 */
function capitalizeGranularity(granularity: string): string {
  return granularity.charAt(0).toUpperCase() + granularity.slice(1)
}

/**
 * Build a drill query based on the selected option
 */
export function buildDrillQuery(
  option: DrillOption,
  event: ChartDataPointClickEvent,
  query: CubeQuery,
  metadata: CubeMeta
): DrillResult {
  switch (option.type) {
    case 'drillDown':
      return buildDrillDownQuery(option, event, query, metadata)
    case 'drillUp':
      return buildDrillUpQuery(option, event, query, metadata)
    case 'details':
      return buildDetailsQuery(option, event, query, metadata)
    default:
      throw new Error(`Unknown drill type: ${option.type}`)
  }
}

/**
 * Build a drill-down query (more granular)
 */
function buildDrillDownQuery(
  option: DrillOption,
  event: ChartDataPointClickEvent,
  query: CubeQuery,
  metadata: CubeMeta
): DrillResult {
  const { xValue } = event
  const newQuery = { ...query }
  const filters: Filter[] = []

  if (option.targetGranularity && query.timeDimensions) {
    // Time-based drill down
    const timeDim = query.timeDimensions[0]
    const currentGranularity = timeDim.granularity

    // Update granularity
    newQuery.timeDimensions = [{
      ...timeDim,
      granularity: option.targetGranularity,
      // Update date range to filter to the clicked period
      dateRange: getDateRangeForPeriod(String(xValue), currentGranularity || 'month')
    }]

    return {
      query: newQuery,
      pathEntry: {
        id: generateId(),
        label: String(xValue),
        query: newQuery,
        filters,
        granularity: option.targetGranularity,
        clickedValue: xValue
      }
    }
  } else if (option.targetDimension) {
    // Hierarchy-based drill down
    const currentDimensions = query.dimensions || []
    const hierarchyInfo = option.hierarchy ? findHierarchyForDimension(option.targetDimension, metadata) : null

    // Replace the current hierarchy dimension with the target
    const newDimensions = currentDimensions.map(dim => {
      if (hierarchyInfo && hierarchyInfo.hierarchy.levels.includes(dim)) {
        return option.targetDimension!
      }
      return dim
    })

    // If not replacing, add the new dimension
    if (!newDimensions.includes(option.targetDimension)) {
      newDimensions.push(option.targetDimension)
    }

    newQuery.dimensions = newDimensions

    // Add filter for the clicked value
    const currentDim = currentDimensions.find(d => {
      const info = findHierarchyForDimension(d, metadata)
      return info && info.hierarchy.name === option.hierarchy
    })

    if (currentDim && xValue !== undefined) {
      const newFilter: Filter = {
        member: currentDim,
        operator: 'equals',
        values: [String(xValue)]
      }
      filters.push(newFilter)
      newQuery.filters = [...(query.filters || []), newFilter]
    }

    return {
      query: newQuery,
      pathEntry: {
        id: generateId(),
        label: String(xValue),
        query: newQuery,
        filters,
        dimension: option.targetDimension,
        hierarchy: option.hierarchy,
        clickedValue: xValue
      }
    }
  }

  // Fallback - return query unchanged
  return {
    query: newQuery,
    pathEntry: {
      id: generateId(),
      label: 'Drill',
      query: newQuery,
      filters,
      clickedValue: xValue
    }
  }
}

/**
 * Build a drill-up query (less granular / roll-up)
 */
function buildDrillUpQuery(
  option: DrillOption,
  _event: ChartDataPointClickEvent,
  query: CubeQuery,
  metadata: CubeMeta
): DrillResult {
  const newQuery = { ...query }

  if (option.targetGranularity && query.timeDimensions) {
    // Time-based drill up
    const timeDim = query.timeDimensions[0]

    newQuery.timeDimensions = [{
      ...timeDim,
      granularity: option.targetGranularity,
      // Clear date range to show all data at new granularity
      dateRange: timeDim.dateRange
    }]

    return {
      query: newQuery,
      pathEntry: {
        id: generateId(),
        label: `By ${capitalizeGranularity(option.targetGranularity)}`,
        query: newQuery,
        granularity: option.targetGranularity
      }
    }
  } else if (option.targetDimension) {
    // Hierarchy-based drill up
    const currentDimensions = query.dimensions || []
    const hierarchyInfo = option.hierarchy ? findHierarchyForDimension(option.targetDimension, metadata) : null

    // Replace the current hierarchy dimension with the target
    const newDimensions = currentDimensions.map(dim => {
      if (hierarchyInfo && hierarchyInfo.hierarchy.levels.includes(dim)) {
        return option.targetDimension!
      }
      return dim
    })

    newQuery.dimensions = newDimensions

    // Remove filters for dimensions below the target level
    if (query.filters && hierarchyInfo) {
      const targetIndex = hierarchyInfo.hierarchy.levels.indexOf(option.targetDimension)
      const lowerLevels = hierarchyInfo.hierarchy.levels.slice(targetIndex + 1)

      newQuery.filters = query.filters.filter(f => {
        if ('member' in f) {
          return !lowerLevels.includes(f.member)
        }
        return true
      })
    }

    return {
      query: newQuery,
      pathEntry: {
        id: generateId(),
        label: `By ${getDimensionLabel(option.targetDimension, metadata)}`,
        query: newQuery,
        dimension: option.targetDimension,
        hierarchy: option.hierarchy
      }
    }
  }

  // Fallback
  return {
    query: newQuery,
    pathEntry: {
      id: generateId(),
      label: 'Roll Up',
      query: newQuery
    }
  }
}

/**
 * Build a details query using the selected drillMember
 */
function buildDetailsQuery(
  option: DrillOption,
  event: ChartDataPointClickEvent,
  query: CubeQuery,
  metadata: CubeMeta
): DrillResult {
  const { xValue } = event
  const measureName = option.measure || event.clickedField

  // Use the specific drillMember selected by the user
  const targetDimension = option.targetDimension
  if (!targetDimension) {
    throw new Error(`No targetDimension specified for details drill on measure ${measureName}`)
  }

  // Get labels for breadcrumb
  const targetDimensionLabel = getDimensionLabel(targetDimension, metadata)

  // Get the current x-axis dimension label for context
  const xAxisDimension = query.dimensions?.[0] || query.timeDimensions?.[0]?.dimension
  const xAxisLabel = xAxisDimension ? getDimensionLabel(xAxisDimension, metadata) : null

  // Check if the target dimension is a time dimension
  const isTargetTimeDimension = isTimeDimension(targetDimension, metadata)

  // Build a new query with the selected drillMember
  // If it's a time dimension, put it in timeDimensions; otherwise in dimensions
  const newQuery: CubeQuery = {
    measures: [measureName], // Keep the measure to show its value
    dimensions: isTargetTimeDimension ? [] : [targetDimension],
    timeDimensions: isTargetTimeDimension
      ? [{
          dimension: targetDimension,
          // Use granularity from original query or default to 'day'
          granularity: query.timeDimensions?.[0]?.granularity || 'day',
          // Preserve dateRange from original query (from dashboard filter)
          dateRange: query.timeDimensions?.[0]?.dateRange
        }]
      : query.timeDimensions, // Preserve existing time context for non-time drills
    filters: [...(query.filters || [])],
    limit: 100 // Reasonable default limit for detail view
  }

  // Add filter for the clicked data point
  if (xAxisDimension && xValue !== undefined && xValue !== null && xValue !== '') {
    const xFilter: Filter = {
      member: xAxisDimension,
      operator: 'equals',
      values: [String(xValue)]
    }
    newQuery.filters = [...(newQuery.filters || []), xFilter]
  }

  // Generate chart config that maps the selected dimension to xAxis
  // For time dimensions, use the timeDimension format in xAxis
  const chartConfig = {
    xAxis: [targetDimension], // Selected drillMember as x-axis
    yAxis: [measureName]      // The measure being drilled
  }

  // Build a meaningful breadcrumb label
  // Format: "By {dimension} ({clicked value context})" or just "By {dimension}"
  const breadcrumbLabel = xValue !== undefined && xValue !== null && xValue !== ''
    ? `By ${targetDimensionLabel} (${xAxisLabel}: ${xValue})`
    : `By ${targetDimensionLabel}`

  return {
    query: newQuery,
    chartConfig,
    pathEntry: {
      id: generateId(),
      label: breadcrumbLabel,
      query: newQuery,
      filters: newQuery.filters,
      clickedValue: xValue,
      chartConfig
    }
  }
}

/**
 * Get a date range for a specific period value
 * @param periodValue - The period value (e.g., '2024-01', 'Q1 2024', '2024')
 * @param granularity - The current granularity
 * @returns Date range as [startDate, endDate] strings
 */
function getDateRangeForPeriod(
  periodValue: string,
  granularity: string
): [string, string] {
  // This is a simplified implementation
  // In production, you'd want more robust date parsing
  const date = new Date(periodValue)

  if (isNaN(date.getTime())) {
    // If we can't parse, return the value as-is (let the server handle it)
    return [periodValue, periodValue]
  }

  switch (granularity) {
    case 'year': {
      const year = date.getFullYear()
      return [`${year}-01-01`, `${year}-12-31`]
    }
    case 'quarter': {
      const year = date.getFullYear()
      const quarter = Math.floor(date.getMonth() / 3)
      const startMonth = quarter * 3
      const endMonth = startMonth + 2
      return [
        `${year}-${String(startMonth + 1).padStart(2, '0')}-01`,
        `${year}-${String(endMonth + 1).padStart(2, '0')}-${new Date(year, endMonth + 1, 0).getDate()}`
      ]
    }
    case 'month': {
      const year = date.getFullYear()
      const month = date.getMonth()
      const lastDay = new Date(year, month + 1, 0).getDate()
      return [
        `${year}-${String(month + 1).padStart(2, '0')}-01`,
        `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`
      ]
    }
    case 'week': {
      // Get the start of the week (Monday)
      const dayOfWeek = date.getDay()
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() + diff)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return [
        weekStart.toISOString().split('T')[0],
        weekEnd.toISOString().split('T')[0]
      ]
    }
    case 'day':
    default: {
      const dateStr = date.toISOString().split('T')[0]
      return [dateStr, dateStr]
    }
  }
}
