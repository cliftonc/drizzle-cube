/**
 * Cache utilities for Drizzle Cube semantic layer
 * Provides cache key generation and normalization functions
 */

import type { SemanticQuery, Filter, TimeDimension, SecurityContext } from './types/index.js'

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
 * Uses a 128-bit FNV-1a-based hash (see {@link strongHash}) for both the query
 * and the security context. A 128-bit digest is required here for correctness,
 * not just speed: the security-context hash provides tenant isolation, and a
 * collision serves one tenant's cached result to another. The full input is
 * hashed (no truncation) so large queries cannot collide on a shared prefix.
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
  const queryHash = strongHash(JSON.stringify(normalizedQuery))

  // Include security context in key for tenant isolation
  let key = `${prefix}query:${queryHash}`

  if (config.includeSecurityContext !== false) {
    const ctxString = config.securityContextSerializer
      ? config.securityContextSerializer(securityContext)
      : JSON.stringify(sortObject(securityContext))
    const ctxHash = strongHash(ctxString)
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
    flow: query.flow ? normalizeFlowConfig(query.flow) : undefined,
    // Include retention config in cache key for proper cache invalidation
    retention: query.retention ? normalizeRetentionConfig(query.retention) : undefined
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
    outputMode: flow.outputMode,
    // Include join strategy to keep cache keys aligned with join selection
    joinStrategy: flow.joinStrategy
  }
}

/**
 * Normalize retention config for consistent hashing
 * Ensures all retention parameters are included in cache key
 *
 * @param retention - The retention config to normalize
 * @returns Normalized retention config
 */
function normalizeRetentionConfig(retention: NonNullable<SemanticQuery['retention']>): NonNullable<SemanticQuery['retention']> {
  return {
    timeDimension: retention.timeDimension,
    bindingKey: retention.bindingKey,
    dateRange: retention.dateRange,
    granularity: retention.granularity,
    periods: retention.periods,
    retentionType: retention.retentionType,
    // Normalize filters for consistent hashing
    cohortFilters: retention.cohortFilters
      ? (Array.isArray(retention.cohortFilters)
          ? sortFilters(retention.cohortFilters)
          : sortFilters([retention.cohortFilters])[0])
      : undefined,
    activityFilters: retention.activityFilters
      ? (Array.isArray(retention.activityFilters)
          ? sortFilters(retention.activityFilters)
          : sortFilters([retention.activityFilters])[0])
      : undefined,
    // Include breakdown dimensions for cache key
    breakdownDimensions: retention.breakdownDimensions
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
 * FNV-1a hash - fast, non-cryptographic 32-bit hash function
 * Returns hex string for cache key readability
 *
 * Properties:
 * - O(n) time complexity
 * - Low collision rate for similar strings
 * - Deterministic across runs
 *
 * Note: a 32-bit digest is too narrow to isolate tenants by itself — use
 * {@link strongHash} for cache keys. Retained for backwards compatibility.
 *
 * @param str - String to hash
 * @returns 8-character hex string
 */
export function fnv1aHash(str: string): string {
  let hash = 2166136261 // FNV offset basis

  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(hash ^ str.charCodeAt(i), 16777619) >>> 0 // FNV prime, unsigned 32-bit
  }

  return hash.toString(16).padStart(8, '0')
}

/**
 * 128-bit FNV-1a-based hash for cache keys.
 *
 * Computes four independent 32-bit FNV-1a lanes (distinct offset bases, each
 * mixed with the byte position) and concatenates them into a 32-character hex
 * digest. This widens the key space from 2^32 to 2^128 so security-context and
 * query collisions are vanishingly unlikely — collisions here are not merely a
 * cache miss, they are a cross-tenant data-disclosure risk.
 *
 * The entire input is hashed (no truncation), and the input length is mixed in
 * to disambiguate shared prefixes. `Math.imul` performs a true 32-bit multiply.
 *
 * @param str - String to hash
 * @returns 32-character hex string (128 bits)
 */
export function strongHash(str: string): string {
  let h1 = 2166136261 // standard FNV offset basis
  let h2 = 2246822519 // distinct seeds for independent lanes
  let h3 = 3266489917
  let h4 = 668265263
  const prime = 16777619

  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, prime) >>> 0
    h2 = Math.imul(h2 ^ ((c + i) & 0xffff), prime) >>> 0
    h3 = Math.imul(h3 ^ (c ^ (i & 0xff)), prime) >>> 0
    h4 = Math.imul(h4 ^ ((c + Math.imul(i, 131)) & 0xffff), prime) >>> 0
  }

  // Mix the length in so strings that share a prefix diverge
  h1 = (h1 ^ str.length) >>> 0

  return (
    h1.toString(16).padStart(8, '0') +
    h2.toString(16).padStart(8, '0') +
    h3.toString(16).padStart(8, '0') +
    h4.toString(16).padStart(8, '0')
  )
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
