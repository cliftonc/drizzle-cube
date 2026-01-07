/**
 * useFunnelQuery - Hook for sequential funnel query execution
 *
 * Unlike useMultiCubeLoadQuery which executes queries in parallel,
 * this hook executes queries sequentially where each step filters
 * based on binding key values from the previous step's results.
 *
 * Features:
 * - Sequential execution with binding key propagation
 * - Progressive loading (shows results as each step completes)
 * - Built-in debouncing
 * - Per-step error tracking
 * - Conversion rate calculation
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useCubeApi } from '../../providers/CubeApiProvider'
import { cleanQueryForServer } from '../../shared/utils'
import { useDebounceQuery } from '../useDebounceQuery'
import type { CubeQuery, CubeResultSet } from '../../types'
import type {
  FunnelConfig,
  FunnelStepResult,
  FunnelExecutionResult,
  FunnelChartData,
  UseFunnelQueryOptions,
  UseFunnelQueryResult,
} from '../../types/funnel'
import {
  getBindingKeyField,
  extractBindingKeyValues,
  buildStepQuery,
  buildStepResult,
  buildFunnelResult,
  buildFunnelChartData,
  shouldStopFunnelExecution,
  DEFAULT_BINDING_KEY_LIMIT,
} from '../../utils/funnelExecution'

// Default debounce delay in milliseconds
const DEFAULT_DEBOUNCE_MS = 300

/**
 * Check if a FunnelConfig is valid for execution
 */
function isValidFunnelConfig(config: FunnelConfig | null): boolean {
  if (!config) return false
  if (!config.bindingKey) return false
  if (!config.steps || config.steps.length < 2) return false

  // Check that binding key dimension is defined
  if (typeof config.bindingKey.dimension === 'string') {
    if (!config.bindingKey.dimension) return false
  } else if (Array.isArray(config.bindingKey.dimension)) {
    if (config.bindingKey.dimension.length === 0) return false
  }

  // Check that each step has a valid query
  for (const step of config.steps) {
    const query = step.query
    const hasFields =
      (query.measures && query.measures.length > 0) ||
      (query.dimensions && query.dimensions.length > 0) ||
      (query.timeDimensions && query.timeDimensions.length > 0)
    if (!hasFields) return false
  }

  return true
}

/**
 * Hook for sequential funnel query execution
 *
 * Usage:
 * ```tsx
 * const { result, isExecuting, execute, stepResults, chartData } = useFunnelQuery(config, {
 *   debounceMs: 300,
 *   skip: !hasBindingKey
 * })
 *
 * // Results show progressively as each step completes
 * {stepResults.map((step, i) => (
 *   <div key={i}>
 *     {step.stepName}: {step.count} ({step.conversionRate}% from previous)
 *   </div>
 * ))}
 * ```
 */
export function useFunnelQuery(
  config: FunnelConfig | null,
  options: UseFunnelQueryOptions = {}
): UseFunnelQueryResult {
  const {
    skip = false,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    onStepComplete,
    onComplete,
    onError,
  } = options

  const { cubeApi } = useCubeApi()

  // Validate config
  const isValidConfig = isValidFunnelConfig(config)

  // Use shared debounce hook
  const { debouncedValue: debouncedConfig, isDebouncing } = useDebounceQuery(config, {
    isValid: isValidConfig,
    skip,
    debounceMs,
  })

  // State
  const [result, setResult] = useState<FunnelExecutionResult | null>(null)
  const [stepResults, setStepResults] = useState<FunnelStepResult[]>([])
  const [status, setStatus] = useState<FunnelExecutionResult['status']>('idle')
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null)
  const [error, setError] = useState<Error | null>(null)
  // Track the actually executed queries (with binding key dimension and IN filters)
  const [executedQueries, setExecutedQueries] = useState<CubeQuery[]>([])

  // Ref to track execution cancellation
  const executionIdRef = useRef<number>(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Reset state when config changes significantly
  useEffect(() => {
    if (!debouncedConfig) {
      setResult(null)
      setStepResults([])
      setStatus('idle')
      setCurrentStepIndex(null)
      setError(null)
    }
  }, [debouncedConfig])

  /**
   * Execute the funnel query sequentially
   */
  const execute = useCallback(async (): Promise<FunnelExecutionResult | null> => {
    if (!debouncedConfig || !isValidConfig) {
      return null
    }

    // Cancel any previous execution
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new execution context
    const executionId = ++executionIdRef.current
    abortControllerRef.current = new AbortController()

    // Reset state for new execution
    setStatus('executing')
    setError(null)
    setStepResults([])
    setCurrentStepIndex(0)
    setExecutedQueries([])

    const config = debouncedConfig
    const countUnique = config.countUnique !== false
    const bindingKeyLimit = config.bindingKeyLimit ?? DEFAULT_BINDING_KEY_LIMIT
    const accumulatedResults: FunnelStepResult[] = []
    const accumulatedQueries: CubeQuery[] = []
    let currentBindingKeyValues: (string | number)[] = []
    let firstStepCount = 0
    let executionError: Error | null = null

    try {
      for (let i = 0; i < config.steps.length; i++) {
        // Check if execution was cancelled
        if (executionIdRef.current !== executionId) {
          return null
        }

        const step = config.steps[i]
        setCurrentStepIndex(i)

        // Build query with binding key filter
        const stepQuery = buildStepQuery(
          step,
          config.bindingKey,
          i === 0 ? null : currentBindingKeyValues
        )

        // Clean query for server
        const serverQuery = cleanQueryForServer(stepQuery)

        // Execute step query
        const startTime = performance.now()
        let resultSet: CubeResultSet
        let stepError: Error | null = null
        let data: unknown[] = []

        try {
          resultSet = await cubeApi.load(serverQuery)
          data = resultSet.rawData()
        } catch (err) {
          stepError = err instanceof Error ? err : new Error(String(err))
          onError?.(stepError, i)
        }

        const executionTime = performance.now() - startTime

        // Get binding key field for this step
        const bindingKeyField = getBindingKeyField(config.bindingKey, stepQuery)

        // Extract binding key values for next step (with limit applied)
        if (!stepError) {
          const extracted = extractBindingKeyValues(data, bindingKeyField, bindingKeyLimit)
          currentBindingKeyValues = extracted.values
        }

        // Track first step count (uses total count before limiting)
        if (i === 0 && !stepError) {
          const extracted = extractBindingKeyValues(data, bindingKeyField, 0) // No limit for counting
          firstStepCount = countUnique
            ? extracted.totalCount
            : data.length
        }

        // Build step result (includes limit for binding key extraction)
        const previousCount = i === 0 ? null : accumulatedResults[i - 1]?.count || 0
        const stepResult = buildStepResult(
          step,
          i,
          data,
          bindingKeyField,
          countUnique,
          previousCount,
          firstStepCount,
          executionTime,
          stepError,
          bindingKeyLimit
        )

        accumulatedResults.push(stepResult)
        accumulatedQueries.push(stepQuery)

        // Update state progressively
        setStepResults([...accumulatedResults])
        setExecutedQueries([...accumulatedQueries])

        // Callback for step completion
        onStepComplete?.(stepResult)

        // Check if we should stop execution
        if (shouldStopFunnelExecution(stepResult)) {
          if (stepResult.error) {
            executionError = stepResult.error
          }
          break
        }
      }
    } catch (err) {
      executionError = err instanceof Error ? err : new Error(String(err))
    }

    // Check if execution was cancelled
    if (executionIdRef.current !== executionId) {
      return null
    }

    // Build final result
    const finalStatus: FunnelExecutionResult['status'] = executionError
      ? 'error'
      : accumulatedResults.length < config.steps.length
        ? 'partial'
        : 'success'

    const finalResult = buildFunnelResult(
      config,
      accumulatedResults,
      finalStatus,
      executionError,
      null
    )

    setResult(finalResult)
    setStatus(finalStatus)
    setCurrentStepIndex(null)
    setError(executionError)

    // Callback for completion
    onComplete?.(finalResult)

    return finalResult
  }, [debouncedConfig, isValidConfig, cubeApi, onStepComplete, onComplete, onError])

  /**
   * Cancel current execution
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    executionIdRef.current++
    setStatus('idle')
    setCurrentStepIndex(null)
  }, [])

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    cancel()
    setResult(null)
    setStepResults([])
    setError(null)
  }, [cancel])

  // Auto-execute when debounced config changes (if not skipped)
  useEffect(() => {
    if (debouncedConfig && !skip && isValidConfig) {
      execute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedConfig, skip, isValidConfig])

  // Compute step loading states
  const stepLoadingStates = useMemo(() => {
    if (!debouncedConfig) return []
    return debouncedConfig.steps.map((_, i) => {
      if (status !== 'executing') return false
      return currentStepIndex !== null && i >= currentStepIndex
    })
  }, [debouncedConfig, status, currentStepIndex])

  // Compute chart data from step results
  const chartData: FunnelChartData[] = useMemo(() => {
    return buildFunnelChartData(stepResults)
  }, [stepResults])

  return {
    result,
    status,
    isExecuting: status === 'executing',
    isDebouncing,
    currentStepIndex,
    stepLoadingStates,
    stepResults,
    chartData,
    error,
    execute,
    cancel,
    reset,
    // Expose the actually executed queries (with binding key dimension + IN filters)
    // for debug/inspection purposes
    executedQueries,
  }
}

/**
 * Create a stable query key for funnel queries
 * (useful if we want to integrate with TanStack Query in the future)
 */
export function createFunnelQueryKey(
  config: FunnelConfig | null
): readonly unknown[] {
  if (!config) return ['cube', 'funnel', null] as const
  // Create a stable key based on config
  return ['cube', 'funnel', JSON.stringify(config)] as const
}
