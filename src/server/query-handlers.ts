/**
 * Shared query handlers for AI / MCP / Agent consumers.
 *
 * These functions orchestrate the semantic layer (discover cubes, normalize
 * AI-generated queries, execute loads). They live in the server layer — not the
 * framework-adapter layer — because the in-process Agent (src/server/agent) needs
 * them too, and server code must not import up into src/adapters (which would
 * create an import cycle: adapters/utils → server → agent → adapters/utils).
 *
 * The framework adapters re-export these from `adapters/utils` for backwards
 * compatibility, so existing import paths keep working.
 */

import type { SemanticLayerCompiler } from './compiler'
import type { SemanticQuery, SecurityContext } from './types'
import { discoverCubes, type CubeDiscoveryResult } from './ai/discovery'
import { QUERY_LANGUAGE_REFERENCE } from './ai/query-schema'
import { DATE_FILTERING_PROMPT } from './ai/mcp-prompts'

/**
 * Discovery request body
 */
export interface DiscoverRequest {
  /** Topic or keyword to search for */
  topic?: string
  /** Natural language intent */
  intent?: string
  /** Maximum results to return */
  limit?: number
  /** Minimum relevance score (0-1) */
  minScore?: number
}

/**
 * Load request body - execute a query
 */
export interface LoadRequest {
  /** Query to execute */
  query: SemanticQuery
}

/**
 * Discovery response shape returned by `handleDiscover`.
 *
 * In addition to the matched cubes, the response embeds the full query
 * language reference and the date filtering decision tree. This is the
 * primary delivery mechanism for query-construction guidance: clients
 * cannot be relied upon to forward `prompts/*` content to the model, so
 * we piggyback on `discover` (the mandated first call in our workflow)
 * to guarantee the model sees the rules before it builds a query.
 *
 * The fields are stable strings — consumers may render or strip them as
 * they see fit, but the MCP `discover` tool relies on them being present.
 */
export interface DiscoverResponse {
  /** Matched cubes (possibly empty) with measures, dimensions, and joins */
  cubes: CubeDiscoveryResult[]
  /**
   * Complete TypeScript DSL reference for query construction. Source of
   * truth for field naming, filter operators, time dimensions, and
   * analysis modes (funnel/flow/retention).
   */
  queryLanguageReference: string
  /**
   * Decision tree for date filtering vs time grouping. The single most
   * common source of incorrect queries — read this whenever the user
   * mentions a time period.
   */
  dateFilteringGuide: string
}

/**
 * Date filtering decision tree extracted from the corresponding MCP prompt.
 * Hoisted into a constant so we don't pay the cost of unwrapping the prompt
 * shape on every discover call.
 */
const DATE_FILTERING_GUIDE_TEXT: string =
  DATE_FILTERING_PROMPT.messages[0]?.content.text ?? ''

/**
 * Handle /discover endpoint - find relevant cubes based on topic/intent.
 *
 * Always returns `queryLanguageReference` and `dateFilteringGuide` alongside
 * the matched cubes. See `DiscoverResponse` for the rationale.
 */
export async function handleDiscover(
  semanticLayer: SemanticLayerCompiler,
  body: DiscoverRequest
): Promise<DiscoverResponse> {
  const metadata = semanticLayer.getMetadata()
  const results = discoverCubes(metadata, {
    topic: body.topic,
    intent: body.intent,
    limit: body.limit,
    minScore: body.minScore
  })

  return {
    cubes: results,
    queryLanguageReference: QUERY_LANGUAGE_REFERENCE,
    dateFilteringGuide: DATE_FILTERING_GUIDE_TEXT
  }
}

/**
 * Auto-correct double-prefixed field: "CubeName.CubeName.field" -> "CubeName.field"
 */
function fixDoublePrefixed(field: string): string {
  const parts = field.split('.')
  if (parts.length === 3 && parts[0] === parts[1]) {
    return `${parts[0]}.${parts[2]}`
  }
  return field
}

/**
 * Normalize AI-generated query fields before validation/execution.
 * Fixes common LLM mistakes:
 * - Double-prefixed fields: "Teams.Teams.name" -> "Teams.name"
 * - Order as array: [{key: dir}] -> {key: dir}
 * - Underscore order keys: "Teams_count" -> "Teams.count"
 * - Invalid order keys dropped (falls back to first measure desc)
 *
 * This runs in the shared handleLoad path so both MCP and Agent benefit.
 */
export function normalizeQueryFields(query: Record<string, unknown>): Record<string, unknown> {
  // Fix double-prefixed measures/dimensions
  const fixStringArray = (arr: unknown): string[] | undefined => {
    if (!Array.isArray(arr)) return undefined
    return arr.map((f: unknown) => typeof f === 'string' ? fixDoublePrefixed(f) : f as string)
  }

  if (Array.isArray(query.measures)) {
    query.measures = fixStringArray(query.measures)
  }
  if (Array.isArray(query.dimensions)) {
    query.dimensions = fixStringArray(query.dimensions)
  }

  // Fix double-prefixed filter members and timeDimension names
  if (Array.isArray(query.filters)) {
    for (const filter of query.filters as Array<Record<string, unknown>>) {
      if (typeof filter.member === 'string') {
        filter.member = fixDoublePrefixed(filter.member)
      }
    }
  }
  if (Array.isArray(query.timeDimensions)) {
    for (const td of query.timeDimensions as Array<Record<string, unknown>>) {
      if (typeof td.dimension === 'string') {
        td.dimension = fixDoublePrefixed(td.dimension)
      }
    }
  }

  // Normalize order: array [{key: dir}] -> merged object
  if (Array.isArray(query.order)) {
    const merged: Record<string, unknown> = {}
    for (const entry of query.order) {
      if (entry && typeof entry === 'object') {
        Object.assign(merged, entry)
      }
    }
    query.order = merged
  }

  // Fix order keys: double-prefix, underscore->dot, drop invalid
  if (query.order && typeof query.order === 'object' && !Array.isArray(query.order)) {
    const queryFields = new Set([
      ...(Array.isArray(query.measures) ? query.measures as string[] : []),
      ...(Array.isArray(query.dimensions) ? query.dimensions as string[] : []),
    ])

    const fixedOrder: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(query.order as Record<string, unknown>)) {
      const dpFixed = fixDoublePrefixed(key)
      if (queryFields.has(dpFixed)) {
        fixedOrder[dpFixed] = val
        continue
      }

      // Try underscore -> dot conversion
      if (!key.includes('.') && key.includes('_')) {
        const withDots = key.replace(/_/g, '.')
        const normalized = fixDoublePrefixed(withDots)
        if (queryFields.has(normalized)) {
          fixedOrder[normalized] = val
          continue
        }
        // Try matching by field suffix
        const match = [...queryFields].find(f => {
          const fieldName = f.split('.')[1]
          return fieldName && (key.endsWith(`_${fieldName}`) || key.endsWith(`.${fieldName}`))
        })
        if (match) {
          fixedOrder[match] = val
          continue
        }
      }

      // Drop order keys not in query measures/dimensions
      if (queryFields.size > 0 && !queryFields.has(dpFixed)) {
        continue
      }

      fixedOrder[dpFixed] = val
    }

    // Default to first measure desc if all keys were dropped
    if (Object.keys(fixedOrder).length === 0 && queryFields.size > 0) {
      const firstMeasure = Array.isArray(query.measures) ? (query.measures as string[])[0] : undefined
      if (firstMeasure) {
        fixedOrder[firstMeasure] = 'desc'
      }
    }

    query.order = fixedOrder
  }

  return query
}

/**
 * Handle /load endpoint - execute a query and return results
 * This completes the AI workflow: discover → suggest → validate → load
 */
export async function handleLoad(
  semanticLayer: SemanticLayerCompiler,
  securityContext: SecurityContext,
  body: LoadRequest
): Promise<{
  data: Record<string, unknown>[]
  annotation: any
  query: SemanticQuery
}> {
  // Auto-correct common AI-generated field mistakes before validation
  const query = normalizeQueryFields(body.query as Record<string, unknown>) as SemanticQuery

  // Validate query structure and field existence
  const validation = semanticLayer.validateQuery(query)
  if (!validation.isValid) {
    throw new Error(`Query validation failed: ${validation.errors.join(', ')}`)
  }

  // Execute the query
  const result = await semanticLayer.executeMultiCubeQuery(query, securityContext)

  return {
    data: result.data,
    annotation: result.annotation,
    query
  }
}
