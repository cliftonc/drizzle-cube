/**
 * Cache utilities for Drizzle Cube semantic layer
 * Provides cache key generation and normalization functions
 */

import type { SemanticQuery, Filter, TimeDimension, SecurityContext } from './types'

/**
 * Configuration for cache key generation
 */
export interface CacheKeyConfig {
  /** Prefix for all cache keys */
  keyPrefix?: string
  /** Whether to include security context in cache key */
  includeSecurityContext?: boolean
  /** Custom serializer for security context */
  securityContextSerializer?: (ctx: SecurityContext) => string
}

/**
 * Generate a deterministic cache key from query and security context
 *
 * Key structure: {prefix}query:{queryHash}:ctx:{securityHash}
 *
 * Uses FNV-1a hash for:
 * - Speed: ~3x faster than SHA-256
 * - Simplicity: No dependencies required
 * - Sufficient collision resistance for cache keys
 *
 * @param query - The semantic query to cache
 * @param securityContext - Security context for tenant isolation
 * @param config - Cache key configuration
 * @returns Deterministic cache key string
 */
export function generateCacheKey(
  query: SemanticQuery,
  securityContext: SecurityContext,
  config: CacheKeyConfig = {}
): string {
  const prefix = config.keyPrefix ?? 'drizzle-cube:'

  // Create normalized query representation for consistent hashing
  const normalizedQuery = normalizeQuery(query)
  const queryHash = fnv1aHash(JSON.stringify(normalizedQuery))

  // Include security context in key for tenant isolation
  let key = `${prefix}query:${queryHash}`

  if (config.includeSecurityContext !== false) {
    const ctxString = config.securityContextSerializer
      ? config.securityContextSerializer(securityContext)
      : JSON.stringify(sortObject(securityContext))
    const ctxHash = fnv1aHash(ctxString)
    key += `:ctx:${ctxHash}`
  }

  return key
}

/**
 * Normalize query for consistent hashing
 * Sorts arrays and object keys to ensure same query = same hash
 *
 * @param query - The semantic query to normalize
 * @returns Normalized query with sorted arrays and keys
 */
export function normalizeQuery(query: SemanticQuery): SemanticQuery {
  return {
    measures: query.measures ? [...query.measures].sort() : undefined,
    dimensions: query.dimensions ? [...query.dimensions].sort() : undefined,
    filters: query.filters ? sortFilters(query.filters) : undefined,
    timeDimensions: query.timeDimensions
      ? sortTimeDimensions(query.timeDimensions)
      : undefined,
    limit: query.limit,
    offset: query.offset,
    order: query.order ? sortObject(query.order) : undefined,
    fillMissingDatesValue: query.fillMissingDatesValue,
    // Include funnel config in cache key for proper cache invalidation
    funnel: query.funnel ? normalizeFunnelConfig(query.funnel) : undefined,
    // Include flow config in cache key for proper cache invalidation
    flow: query.flow ? normalizeFlowConfig(query.flow) : undefined
  }
}

/**
 * Normalize funnel config for consistent hashing
 * Ensures step order and filter content create unique cache keys
 *
 * @param funnel - The funnel config to normalize
 * @returns Normalized funnel config
 */
function normalizeFunnelConfig(funnel: NonNullable<SemanticQuery['funnel']>): NonNullable<SemanticQuery['funnel']> {
  return {
    bindingKey: funnel.bindingKey,
    timeDimension: funnel.timeDimension,
    // Normalize steps - preserve order but sort filters within each step
    steps: funnel.steps.map(step => {
      const normalizedStep: typeof step = {
        name: step.name,
        filter: step.filter
          ? (Array.isArray(step.filter) ? sortFilters(step.filter) : sortFilters([step.filter])[0])
          : undefined,
        timeToConvert: step.timeToConvert
      }
      // Include cube property for multi-cube steps
      if ('cube' in step && step.cube) {
        (normalizedStep as { cube?: string }).cube = step.cube
      }
      return normalizedStep
    }),
    includeTimeMetrics: funnel.includeTimeMetrics,
    globalTimeWindow: funnel.globalTimeWindow
  }
}

/**
 * Normalize flow config for consistent hashing
 * Ensures all flow parameters are included in cache key
 *
 * @param flow - The flow config to normalize
 * @returns Normalized flow config
 */
function normalizeFlowConfig(flow: NonNullable<SemanticQuery['flow']>): NonNullable<SemanticQuery['flow']> {
  return {
    bindingKey: flow.bindingKey,
    timeDimension: flow.timeDimension,
    eventDimension: flow.eventDimension,
    // Normalize starting step - sort filters for consistent hashing
    startingStep: {
      name: flow.startingStep.name,
      filter: flow.startingStep.filter
        ? (Array.isArray(flow.startingStep.filter)
            ? sortFilters(flow.startingStep.filter)
            : sortFilters([flow.startingStep.filter])[0])
        : undefined
    },
    // CRITICAL: Include step counts in cache key
    stepsBefore: flow.stepsBefore,
    stepsAfter: flow.stepsAfter,
    // Include optional entity limit if present
    entityLimit: flow.entityLimit,
    // CRITICAL: Include outputMode - affects aggregation strategy (sankey vs sunburst)
    outputMode: flow.outputMode
  }
}

/**
 * Sort filters recursively for consistent hashing
 * Handles both simple filters and logical (and/or) groups
 *
 * @param filters - Array of filters to sort
 * @returns Sorted array of filters
 */
function sortFilters(filters: Filter[]): Filter[] {
  return [...filters]
    .map((f) => {
      if ('and' in f && f.and) {
        return { and: sortFilters(f.and) }
      }
      if ('or' in f && f.or) {
        return { or: sortFilters(f.or) }
      }
      // FilterCondition - sort values array if present
      const fc = f as { member: string; operator: string; values?: unknown[] }
      return {
        ...fc,
        values: fc.values ? [...fc.values].sort() : fc.values
      }
    })
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
}

/**
 * Sort time dimensions for consistent hashing
 *
 * @param timeDimensions - Array of time dimensions to sort
 * @returns Sorted array of time dimensions
 */
function sortTimeDimensions(timeDimensions: TimeDimension[]): TimeDimension[] {
  return [...timeDimensions]
    .map((td) => ({
      dimension: td.dimension,
      granularity: td.granularity,
      dateRange: td.dateRange,
      fillMissingDates: td.fillMissingDates,
      compareDateRange: td.compareDateRange
        ? [...td.compareDateRange].sort((a, b) => {
            const aStr = Array.isArray(a) ? a.join('-') : a
            const bStr = Array.isArray(b) ? b.join('-') : b
            return aStr.localeCompare(bStr)
          })
        : undefined
    }))
    .sort((a, b) => a.dimension.localeCompare(b.dimension))
}

/**
 * Recursively sort object keys for deterministic serialization
 *
 * @param obj - Object to sort
 * @returns Object with sorted keys (recursively)
 */
export function sortObject<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(sortObject) as T

  return Object.keys(obj as object)
    .sort()
    .reduce((sorted, key) => {
      ;(sorted as Record<string, unknown>)[key] = sortObject(
        (obj as Record<string, unknown>)[key]
      )
      return sorted
    }, {} as T)
}

/**
 * FNV-1a hash - fast, non-cryptographic hash function
 * Returns hex string for cache key readability
 *
 * Properties:
 * - O(n) time complexity
 * - Low collision rate for similar strings
 * - Deterministic across runs
 *
 * @param str - String to hash
 * @returns 8-character hex string
 */
export function fnv1aHash(str: string): string {
  let hash = 2166136261 // FNV offset basis

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = (hash * 16777619) >>> 0 // FNV prime, unsigned 32-bit
  }

  return hash.toString(16).padStart(8, '0')
}

/**
 * Generate invalidation pattern for a cube
 * Used when cube data changes and all related cache entries need clearing
 *
 * @param cubeName - Name of the cube to invalidate
 * @param keyPrefix - Cache key prefix
 * @returns Glob pattern for cache invalidation
 */
export function getCubeInvalidationPattern(
  cubeName: string,
  keyPrefix?: string
): string {
  return `${keyPrefix ?? 'drizzle-cube:'}*${cubeName}*`
}
