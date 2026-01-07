/**
 * Funnel query types for drizzle-cube client
 *
 * Funnels enable sequential query execution where each step filters
 * based on binding key values from the previous step's results.
 */

import type { CubeQuery } from '../types'

/**
 * Binding key configuration - the dimension that links funnel steps together.
 * Can be a simple dimension name or cross-cube mapping for multi-cube funnels.
 */
export interface FunnelBindingKey {
  /**
   * The dimension field name that exists across all cubes in the funnel.
   * For cross-cube funnels where the binding key has different names,
   * specify a mapping array instead.
   *
   * @example Simple: "Employees.userId"
   * @example Cross-cube: [{ cube: "Signups", dimension: "Signups.userId" }, { cube: "Purchases", dimension: "Purchases.customerId" }]
   */
  dimension: string | FunnelBindingKeyMapping[]
}

/**
 * Mapping for cross-cube funnels where the binding key has different names
 * in different cubes.
 */
export interface FunnelBindingKeyMapping {
  /** The cube name (e.g., "Signups", "Purchases") */
  cube: string
  /** The full dimension field in that cube (e.g., "Signups.userId") */
  dimension: string
}

/**
 * Configuration for a single funnel step.
 * Each step has its own query and optional time constraints.
 */
export interface FunnelStep {
  /** Unique identifier for this step */
  id: string

  /** Display name for the step (e.g., "Signup", "First Purchase") */
  name: string

  /** The cube query for this step */
  query: CubeQuery

  /**
   * Time window constraint - maximum time allowed between this step
   * and the previous step. Optional - if not set, no time constraint.
   * Format: ISO 8601 duration (e.g., "P7D" for 7 days, "PT1H" for 1 hour)
   */
  timeToConvert?: string

  /**
   * Time dimension field to use for time window filtering.
   * Required if timeToConvert is specified.
   */
  timeDimension?: string
}

/**
 * Complete funnel configuration
 */
export interface FunnelConfig {
  /** Unique identifier for the funnel */
  id: string

  /** Display name for the funnel */
  name: string

  /** The binding key that links steps together */
  bindingKey: FunnelBindingKey

  /** Ordered array of funnel steps */
  steps: FunnelStep[]

  /**
   * Global time window for the entire funnel.
   * All steps must complete within this window from the first step.
   */
  globalTimeWindow?: string

  /**
   * Whether to count unique entities (true) or events (false).
   * Default: true
   */
  countUnique?: boolean

  /**
   * Maximum number of binding key values to pass between steps.
   * Limits the size of the IN clause to prevent performance issues.
   * Default: 500
   */
  bindingKeyLimit?: number
}

/**
 * Result for a single funnel step execution
 */
export interface FunnelStepResult {
  /** Step index (0-based) */
  stepIndex: number

  /** Step name */
  stepName: string

  /** Step ID */
  stepId: string

  /** Raw data from the query */
  data: unknown[]

  /** Binding key values extracted from this step */
  bindingKeyValues: (string | number)[]

  /**
   * Total number of unique binding key values before limit was applied.
   * If this differs from bindingKeyValues.length, values were truncated.
   */
  bindingKeyTotalCount: number

  /** Count at this step (unique entities if countUnique=true, else rows) */
  count: number

  /** Conversion rate from previous step (null for first step) */
  conversionRate: number | null

  /** Cumulative conversion rate from first step */
  cumulativeConversionRate: number

  /** Execution time in milliseconds */
  executionTime: number

  /** Error if this step failed */
  error: Error | null
}

/**
 * Complete funnel execution result
 */
export interface FunnelExecutionResult {
  /** Funnel configuration */
  config: FunnelConfig

  /** Per-step results */
  steps: FunnelStepResult[]

  /** Overall funnel metrics */
  summary: {
    /** Count at first step */
    totalEntries: number
    /** Count at last step */
    totalCompletions: number
    /** Overall conversion rate (completions / entries) */
    overallConversionRate: number
    /** Total execution time for all steps */
    totalExecutionTime: number
  }

  /** Formatted data for funnel chart visualization */
  chartData: FunnelChartData[]

  /** Execution status */
  status: 'idle' | 'executing' | 'success' | 'error' | 'partial'

  /** First error encountered, if any */
  error: Error | null

  /** Index of current step being executed (null when not executing) */
  currentStepIndex: number | null
}

/**
 * Data format for funnel chart visualization
 */
export interface FunnelChartData {
  /** Step name */
  name: string
  /** Count at this step */
  value: number
  /** Percentage of first step (cumulative conversion) */
  percentage: number
  /** Conversion rate from previous step (null for first step) */
  conversionRate: number | null
  /** Step index for ordering */
  stepIndex: number
  /** Optional fill color */
  fill?: string
}

/**
 * Validation error for funnel configuration
 */
export interface FunnelValidationError {
  /** Error type */
  type: 'binding_key' | 'cross_cube' | 'time_window' | 'step_query' | 'general'
  /** Error message */
  message: string
  /** Step index if error is step-specific */
  stepIndex?: number
}

/**
 * Validation result for funnel configuration
 */
export interface FunnelValidationResult {
  /** Whether the configuration is valid */
  isValid: boolean
  /** Validation errors (block execution) */
  errors: FunnelValidationError[]
  /** Validation warnings (notify but allow) */
  warnings: FunnelValidationError[]
}

/**
 * Options for funnel query hook
 */
export interface UseFunnelQueryOptions {
  /** Skip execution */
  skip?: boolean
  /** Debounce delay in milliseconds */
  debounceMs?: number
  /** Callback when a step completes */
  onStepComplete?: (stepResult: FunnelStepResult) => void
  /** Callback when all steps complete */
  onComplete?: (result: FunnelExecutionResult) => void
  /** Callback when execution fails */
  onError?: (error: Error, stepIndex: number) => void
}

/**
 * Result from funnel query hook
 */
export interface UseFunnelQueryResult {
  /** Funnel execution result */
  result: FunnelExecutionResult | null

  /** Current execution status */
  status: 'idle' | 'executing' | 'success' | 'error' | 'partial'

  /** Whether currently executing */
  isExecuting: boolean

  /** Whether waiting for debounce */
  isDebouncing: boolean

  /** Index of step currently being executed */
  currentStepIndex: number | null

  /** Per-step loading states */
  stepLoadingStates: boolean[]

  /** Per-step results (for progressive rendering) */
  stepResults: FunnelStepResult[]

  /** Chart-ready data */
  chartData: FunnelChartData[]

  /** Error if execution failed */
  error: Error | null

  /** Execute the funnel */
  execute: () => Promise<FunnelExecutionResult | null>

  /** Cancel current execution */
  cancel: () => void

  /** Reset to initial state */
  reset: () => void

  /**
   * The actually executed queries (with binding key dimension and IN filters).
   * These differ from the original queries in the following ways:
   * - Binding key dimension is automatically added if not present
   * - For steps 2+, an IN filter is added with binding key values from the previous step
   * Use these for debug/inspection to see what was actually sent to the server.
   */
  executedQueries: CubeQuery[]
}

/**
 * Type guard to check if merge strategy is funnel mode
 */
export function isFunnelMergeStrategy(strategy: string): strategy is 'funnel' {
  return strategy === 'funnel'
}
