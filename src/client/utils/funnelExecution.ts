/**
 * Funnel Query Execution Utilities
 *
 * Handles sequential execution of funnel queries where each step
 * filters based on binding key values from the previous step.
 */

import type { CubeQuery, SimpleFilter } from '../types'

/**
 * Default maximum number of binding key values to pass between funnel steps.
 * Limits the size of the IN clause to prevent performance issues.
 */
export const DEFAULT_BINDING_KEY_LIMIT = 500
import type {
  FunnelBindingKey,
  FunnelBindingKeyMapping,
  FunnelConfig,
  FunnelStep,
  FunnelStepResult,
  FunnelExecutionResult,
  FunnelChartData,
} from '../types/funnel'

/**
 * Extract the binding key field name for a specific query/cube.
 *
 * For simple binding keys (string), returns the dimension directly.
 * For cross-cube mappings, finds the mapping for the cube used in the query.
 *
 * @param bindingKey - The funnel binding key configuration
 * @param query - The cube query (used to determine which cube is being queried)
 * @returns The binding key field name (e.g., "Users.userId")
 */
export function getBindingKeyField(
  bindingKey: FunnelBindingKey,
  query: CubeQuery
): string {
  // Simple case: single dimension name
  if (typeof bindingKey.dimension === 'string') {
    return bindingKey.dimension
  }

  // Cross-cube case: find the mapping for this query's cube
  const mappings = bindingKey.dimension as FunnelBindingKeyMapping[]

  // Extract cube name from query fields
  const cubeName = getCubeNameFromQuery(query)
  if (!cubeName) {
    // If we can't determine the cube, use the first mapping
    return mappings[0]?.dimension || ''
  }

  // Find matching mapping
  const mapping = mappings.find(m => m.cube === cubeName)
  if (mapping) {
    return mapping.dimension
  }

  // Fallback to first mapping if no match found
  return mappings[0]?.dimension || ''
}

/**
 * Extract the cube name from a query by looking at measures/dimensions
 */
export function getCubeNameFromQuery(query: CubeQuery): string | null {
  // Check measures first
  if (query.measures && query.measures.length > 0) {
    const parts = query.measures[0].split('.')
    if (parts.length >= 2) {
      return parts[0]
    }
  }

  // Then check dimensions
  if (query.dimensions && query.dimensions.length > 0) {
    const parts = query.dimensions[0].split('.')
    if (parts.length >= 2) {
      return parts[0]
    }
  }

  // Then check time dimensions
  if (query.timeDimensions && query.timeDimensions.length > 0) {
    const parts = query.timeDimensions[0].dimension.split('.')
    if (parts.length >= 2) {
      return parts[0]
    }
  }

  return null
}

/**
 * Result from extracting binding key values
 */
export interface ExtractedBindingKeyValues {
  /** Binding key values (limited to max if specified) */
  values: (string | number)[]
  /** Total count of unique values before limiting */
  totalCount: number
  /** Whether values were truncated due to limit */
  wasTruncated: boolean
}

/**
 * Extract unique values for the binding key from query result data
 *
 * @deprecated This function was used for client-side funnel execution.
 * Server-side funnel execution is now the default approach.
 *
 * @param data - Raw data from query result
 * @param bindingKeyField - The field name to extract values from
 * @param limit - Maximum number of values to return (default: DEFAULT_BINDING_KEY_LIMIT)
 * @returns Object with values array, total count, and truncation flag
 */
export function extractBindingKeyValues(
  data: unknown[],
  bindingKeyField: string,
  limit: number = DEFAULT_BINDING_KEY_LIMIT
): ExtractedBindingKeyValues {
  const values = new Set<string | number>()

  for (const row of data) {
    if (typeof row === 'object' && row !== null) {
      const value = (row as Record<string, unknown>)[bindingKeyField]
      if (value !== null && value !== undefined) {
        // Convert to string or number
        if (typeof value === 'number') {
          values.add(value)
        } else {
          values.add(String(value))
        }
      }
    }
  }

  const allValues = Array.from(values)
  const totalCount = allValues.length

  // Sort values for consistent ordering (enables query cache hits)
  // Numbers sort numerically, strings sort alphabetically
  allValues.sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b
    }
    return String(a).localeCompare(String(b))
  })

  const limitedValues = limit > 0 ? allValues.slice(0, limit) : allValues

  return {
    values: limitedValues,
    totalCount,
    wasTruncated: limitedValues.length < totalCount,
  }
}

/**
 * Build a step query with binding key filter applied.
 *
 * @deprecated This function was used for client-side funnel execution.
 * Server-side funnel execution is now the default approach.
 *
 * For the first step (no previous values), returns the original query
 * with the binding key dimension ensured.
 *
 * For subsequent steps, adds an IN filter for the previous step's
 * binding key values.
 *
 * @param step - The funnel step configuration
 * @param bindingKey - The funnel binding key configuration
 * @param previousBindingKeyValues - Binding key values from previous step (null for first step)
 * @returns Modified CubeQuery with binding key filter
 */
export function buildStepQuery(
  step: FunnelStep,
  bindingKey: FunnelBindingKey,
  previousBindingKeyValues: (string | number)[] | null
): CubeQuery {
  const query: CubeQuery = { ...step.query }

  // Get binding key field for this query
  const bindingKeyField = getBindingKeyField(bindingKey, query)

  // Ensure binding key dimension is in the query (needed to extract values for next step)
  if (!query.dimensions?.includes(bindingKeyField)) {
    query.dimensions = [...(query.dimensions || []), bindingKeyField]
  }

  // Add IN filter for previous step's binding key values (except for first step)
  if (previousBindingKeyValues && previousBindingKeyValues.length > 0) {
    const inFilter: SimpleFilter = {
      member: bindingKeyField,
      operator: 'in',
      values: previousBindingKeyValues,
    }
    query.filters = [...(query.filters || []), inFilter]
  }

  return query
}

/**
 * Calculate conversion metrics for a step
 *
 * @deprecated This function was used for client-side funnel execution.
 * Server-side funnel execution now calculates metrics directly.
 */
export function calculateStepMetrics(
  currentCount: number,
  previousCount: number | null,
  firstStepCount: number
): {
  conversionRate: number | null
  cumulativeConversionRate: number
} {
  const conversionRate =
    previousCount !== null && previousCount > 0
      ? currentCount / previousCount
      : null

  const cumulativeConversionRate =
    firstStepCount > 0 ? currentCount / firstStepCount : 1.0

  return { conversionRate, cumulativeConversionRate }
}

/**
 * Build a funnel step result from query execution
 *
 * @deprecated This function was used for client-side funnel execution.
 * Server-side funnel execution now returns results directly.
 */
export function buildStepResult(
  step: FunnelStep,
  stepIndex: number,
  data: unknown[],
  bindingKeyField: string,
  countUnique: boolean,
  previousCount: number | null,
  firstStepCount: number,
  executionTime: number,
  error: Error | null = null,
  bindingKeyLimit: number = DEFAULT_BINDING_KEY_LIMIT
): FunnelStepResult {
  // Extract binding key values (with limit applied)
  const extracted = error
    ? { values: [], totalCount: 0, wasTruncated: false }
    : extractBindingKeyValues(data, bindingKeyField, bindingKeyLimit)

  // Calculate count based on total unique values (before truncation)
  const count = error
    ? 0
    : countUnique
      ? extracted.totalCount
      : data.length

  // Calculate conversion metrics
  const { conversionRate, cumulativeConversionRate } = calculateStepMetrics(
    count,
    previousCount,
    firstStepCount || count // Use current count as first step count if this is step 0
  )

  return {
    stepIndex,
    stepName: step.name,
    stepId: step.id,
    data,
    bindingKeyValues: extracted.values,
    bindingKeyTotalCount: extracted.totalCount,
    count,
    conversionRate,
    cumulativeConversionRate,
    executionTime,
    error,
  }
}

/**
 * Convert step results to chart-ready data format
 *
 * @deprecated Use transformServerFunnelResult() instead.
 * Server-side funnel execution returns data in a compatible format.
 */
export function buildFunnelChartData(
  stepResults: FunnelStepResult[]
): FunnelChartData[] {
  if (stepResults.length === 0) return []

  const firstStepCount = stepResults[0]?.count || 0

  return stepResults.map((result, index) => ({
    name: result.stepName,
    value: result.count,
    percentage: firstStepCount > 0 ? (result.count / firstStepCount) * 100 : 0,
    conversionRate: result.conversionRate,
    stepIndex: index,
  }))
}

/**
 * Build the complete funnel execution result
 *
 * @deprecated This function was used for client-side funnel execution.
 * Server-side funnel execution now builds results directly.
 */
export function buildFunnelResult(
  config: FunnelConfig,
  stepResults: FunnelStepResult[],
  status: FunnelExecutionResult['status'],
  error: Error | null = null,
  currentStepIndex: number | null = null
): FunnelExecutionResult {
  const firstStepCount = stepResults[0]?.count || 0
  const lastStepCount = stepResults[stepResults.length - 1]?.count || 0
  const totalExecutionTime = stepResults.reduce((sum, r) => sum + r.executionTime, 0)

  return {
    config,
    steps: stepResults,
    summary: {
      totalEntries: firstStepCount,
      totalCompletions: lastStepCount,
      overallConversionRate: firstStepCount > 0 ? lastStepCount / firstStepCount : 0,
      totalExecutionTime,
    },
    chartData: buildFunnelChartData(stepResults),
    status,
    error,
    currentStepIndex,
  }
}

/**
 * Create an empty/initial funnel result
 *
 * @deprecated This function was used for client-side funnel execution.
 * Server-side funnel execution manages state differently.
 */
export function createEmptyFunnelResult(
  config: FunnelConfig
): FunnelExecutionResult {
  return {
    config,
    steps: [],
    summary: {
      totalEntries: 0,
      totalCompletions: 0,
      overallConversionRate: 0,
      totalExecutionTime: 0,
    },
    chartData: [],
    status: 'idle',
    error: null,
    currentStepIndex: null,
  }
}

/**
 * Build a FunnelConfig from multi-query config state.
 * Used to convert AnalysisBuilder state to funnel configuration.
 *
 * @deprecated Use the dedicated funnel mode (analysisType === 'funnel') instead.
 * This function supports backward compatibility with legacy multi-query funnel mode
 * (mergeStrategy === 'funnel'). For new implementations, use the dedicated funnel
 * state in the store which provides better UX with step-based configuration.
 *
 * @param queries - Array of CubeQuery objects (one per step)
 * @param bindingKey - The binding key configuration
 * @param stepLabels - Optional labels for each step
 * @param stepTimeToConvert - Optional time window for each step
 * @returns FunnelConfig ready for execution
 */
export function buildFunnelConfigFromQueries(
  queries: CubeQuery[],
  bindingKey: FunnelBindingKey,
  stepLabels?: string[],
  stepTimeToConvert?: (string | null)[]
): FunnelConfig {
  const steps: FunnelStep[] = queries.map((query, index) => ({
    id: `step-${index}`,
    name: stepLabels?.[index] || `Step ${index + 1}`,
    query,
    timeToConvert: stepTimeToConvert?.[index] || undefined,
  }))

  return {
    id: `funnel-${Date.now()}`,
    name: 'Funnel Analysis',
    bindingKey,
    steps,
    countUnique: true,
  }
}

/**
 * Check if funnel execution should stop early
 * (e.g., when no binding key values remain)
 */
export function shouldStopFunnelExecution(
  stepResult: FunnelStepResult
): boolean {
  return stepResult.bindingKeyValues.length === 0 || stepResult.error !== null
}

/**
 * Metadata fields injected into funnel result data
 * (for compatibility with existing chart/table components)
 */
export interface FunnelMetadata {
  __stepIndex: number
  __stepName: string
  __stepId: string
  __conversionRate: number | null
  __cumulativeRate: number
}

/**
 * Check if data contains funnel metadata
 */
export function isFunnelData(data: unknown[]): boolean {
  return (
    data.length > 0 &&
    typeof data[0] === 'object' &&
    data[0] !== null &&
    '__stepIndex' in data[0]
  )
}

// =============================================================================
// Server-Side Funnel Support
// =============================================================================

/**
 * Server-side funnel step definition (for FunnelQueryConfig)
 */
export interface ServerFunnelStep {
  name: string
  filter?: SimpleFilter | SimpleFilter[]
  timeToConvert?: string
}

/**
 * Server-side funnel query configuration
 */
export interface ServerFunnelQueryConfig {
  bindingKey: string | FunnelBindingKeyMapping[]
  timeDimension: string | Array<{ cube: string; dimension: string }>
  steps: ServerFunnelStep[]
  includeTimeMetrics?: boolean
  globalTimeWindow?: string
}

/**
 * Server-side funnel result row
 */
export interface ServerFunnelResultRow {
  step: string
  stepIndex: number
  count: number
  conversionRate: number | null
  cumulativeConversionRate: number
  avgSecondsToConvert?: number | null
  medianSecondsToConvert?: number | null
  p90SecondsToConvert?: number | null
  minSecondsToConvert?: number | null
  maxSecondsToConvert?: number | null
}

/**
 * Query shape for server-side funnel execution
 */
export interface ServerFunnelQuery {
  funnel: ServerFunnelQueryConfig
}

/**
 * Build a server-side funnel query from client state.
 *
 * Transforms the client-side FunnelConfig format into a SemanticQuery
 * with `funnel` property that the server can execute.
 *
 * @param queries - Array of CubeQuery objects (one per step)
 * @param bindingKey - The binding key configuration
 * @param stepLabels - Optional labels for each step
 * @param stepTimeToConvert - Optional time window for each step (ISO 8601 duration)
 * @param includeTimeMetrics - Whether to include time-to-convert metrics
 * @returns Query object with funnel configuration for server execution
 */
export function buildServerFunnelQuery(
  queries: CubeQuery[],
  bindingKey: FunnelBindingKey,
  stepLabels?: string[],
  stepTimeToConvert?: (string | null)[],
  includeTimeMetrics: boolean = true
): ServerFunnelQuery {
  // 1. Unwrap binding key from client format (client wraps in { dimension: ... })
  const serverBindingKey = bindingKey.dimension

  // 2. Extract time dimension from queries
  const timeDimension = extractTimeDimensionFromQueries(queries, bindingKey)

  // 3. Convert each CubeQuery to a server FunnelStep
  const steps: ServerFunnelStep[] = queries.map((query, index) => {
    const step: ServerFunnelStep = {
      name: stepLabels?.[index] || `Step ${index + 1}`,
    }

    // Extract filters from query
    const filter = extractFiltersFromQuery(query)
    if (filter) {
      step.filter = filter
    }

    // Add time-to-convert constraint if specified
    const timeConstraint = stepTimeToConvert?.[index]
    if (timeConstraint) {
      step.timeToConvert = timeConstraint
    }

    return step
  })

  return {
    funnel: {
      bindingKey: serverBindingKey,
      timeDimension,
      steps,
      includeTimeMetrics,
    },
  }
}

/**
 * Extract time dimension from queries.
 *
 * For single-cube funnels, returns the first time dimension found.
 * For cross-cube funnels (with binding key mappings), builds a mapping array.
 *
 * @param queries - Array of CubeQuery objects
 * @param bindingKey - The binding key configuration (to detect cross-cube)
 * @returns Time dimension string or mapping array
 */
function extractTimeDimensionFromQueries(
  queries: CubeQuery[],
  bindingKey: FunnelBindingKey
): string | Array<{ cube: string; dimension: string }> {
  // Check if this is a cross-cube funnel
  const isCrossCube = Array.isArray(bindingKey.dimension)

  if (!isCrossCube) {
    // Single-cube: find first time dimension
    for (const query of queries) {
      if (query.timeDimensions?.length) {
        return query.timeDimensions[0].dimension
      }
    }
    // Fallback: try to infer from measures/dimensions
    const cubeName = getCubeNameFromQuery(queries[0])
    if (cubeName) {
      return `${cubeName}.createdAt` // Common convention
    }
    throw new Error('Funnel requires at least one time dimension in step queries')
  }

  // Cross-cube: build mapping for each cube
  const mappings: Array<{ cube: string; dimension: string }> = []
  const bindingMappings = bindingKey.dimension as FunnelBindingKeyMapping[]

  for (const mapping of bindingMappings) {
    // Find time dimension for this cube from queries
    const cubeQuery = queries.find(q => getCubeNameFromQuery(q) === mapping.cube)
    if (cubeQuery?.timeDimensions?.length) {
      mappings.push({
        cube: mapping.cube,
        dimension: cubeQuery.timeDimensions[0].dimension,
      })
    } else {
      // Fallback to common convention
      mappings.push({
        cube: mapping.cube,
        dimension: `${mapping.cube}.createdAt`,
      })
    }
  }

  return mappings
}

/**
 * Extract filters from a CubeQuery for server funnel step.
 *
 * @param query - The CubeQuery
 * @returns Filter or array of filters, or undefined if no filters
 */
function extractFiltersFromQuery(query: CubeQuery): SimpleFilter | SimpleFilter[] | undefined {
  if (!query.filters?.length) {
    return undefined
  }

  // Filter out any binding key filters (server handles those)
  const filters = query.filters.filter(f => {
    // Keep only SimpleFilter with member (not grouped filters for now)
    if ('member' in f) {
      return true
    }
    return false
  }) as SimpleFilter[]

  if (filters.length === 0) {
    return undefined
  }

  if (filters.length === 1) {
    return filters[0]
  }

  return filters
}

/**
 * Transform server funnel result rows to client FunnelChartData format.
 *
 * Maps the server's FunnelResultRow[] to the client's FunnelChartData[]
 * format expected by FunnelChart component.
 *
 * @param serverResult - Raw data from server (FunnelResultRow[])
 * @param stepNames - Optional step names to override server names
 * @returns FunnelChartData[] ready for FunnelChart component
 */
export function transformServerFunnelResult(
  serverResult: unknown[],
  stepNames?: string[]
): FunnelChartData[] {
  if (!serverResult?.length) {
    return []
  }

  const rows = serverResult as ServerFunnelResultRow[]

  return rows.map((row, index) => ({
    // Map server fields to client format
    name: stepNames?.[index] || row.step,
    value: row.count,
    // Convert cumulative rate to percentage
    percentage: row.cumulativeConversionRate * 100,
    // Convert step-to-step rate to percentage (null for first step)
    conversionRate: row.conversionRate !== null ? row.conversionRate * 100 : null,
    stepIndex: row.stepIndex,
    // Include time metrics for optional display
    avgSecondsToConvert: row.avgSecondsToConvert,
    medianSecondsToConvert: row.medianSecondsToConvert,
    p90SecondsToConvert: row.p90SecondsToConvert,
  }))
}

/**
 * Format a duration in seconds to a human-readable string.
 *
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "45s", "2.5m", "1.3h", "3.2d")
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) {
    return '-'
  }

  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  }

  if (seconds < 3600) {
    const minutes = seconds / 60
    return minutes < 10 ? `${minutes.toFixed(1)}m` : `${Math.round(minutes)}m`
  }

  if (seconds < 86400) {
    const hours = seconds / 3600
    return hours < 10 ? `${hours.toFixed(1)}h` : `${Math.round(hours)}h`
  }

  const days = seconds / 86400
  return days < 10 ? `${days.toFixed(1)}d` : `${Math.round(days)}d`
}
