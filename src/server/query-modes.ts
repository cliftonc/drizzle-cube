/**
 * Query-mode detection
 *
 * Single source of truth for deciding which analysis mode a SemanticQuery targets
 * (comparison / funnel / flow / retention, else regular). Previously these predicates
 * were copy-pasted — and had drifted — across the compiler, the per-mode builders,
 * and the HTTP adapter dry-run helper. Centralising them here keeps execution
 * routing, validation, and dry-run reporting consistent.
 */

import type { SemanticQuery } from './types/index.js'

export type QueryMode = 'regular' | 'comparison' | 'funnel' | 'flow' | 'retention'

export interface QueryModeFlags {
  comparison: boolean
  funnel: boolean
  flow: boolean
  retention: boolean
}

/** A query is a comparison when a time dimension carries a compareDateRange with ≥2 ranges. */
export function hasComparisonMode(query: SemanticQuery): boolean {
  return query.timeDimensions?.some(td =>
    td.compareDateRange && td.compareDateRange.length >= 2
  ) ?? false
}

/**
 * A query is a funnel when it has a funnel config with ≥2 steps.
 * Null-safe on `steps` — a `funnel: {}` payload must not throw here.
 */
export function hasFunnelMode(query: SemanticQuery): boolean {
  return query.funnel != null && (query.funnel.steps?.length ?? 0) >= 2
}

/** A query is a flow when it has a flow config with a startingStep and eventDimension. */
export function hasFlowMode(query: SemanticQuery): boolean {
  return (
    query.flow != null &&
    query.flow.startingStep !== undefined &&
    query.flow.eventDimension !== undefined
  )
}

/** A query is a retention when it has a retention config with a timeDimension and bindingKey. */
export function hasRetentionMode(query: SemanticQuery): boolean {
  return (
    query.retention != null &&
    query.retention.timeDimension != null &&
    query.retention.bindingKey != null
  )
}

/** Per-mode booleans for a query. */
export function detectQueryModes(query: SemanticQuery): QueryModeFlags {
  return {
    comparison: hasComparisonMode(query),
    funnel: hasFunnelMode(query),
    flow: hasFlowMode(query),
    retention: hasRetentionMode(query)
  }
}

/**
 * Active non-regular modes for a query, in execution-priority order
 * (comparison, funnel, flow, retention). A well-formed query matches at most one.
 */
export function getActiveQueryModes(query: SemanticQuery): Exclude<QueryMode, 'regular'>[] {
  const modes: Exclude<QueryMode, 'regular'>[] = []
  if (hasComparisonMode(query)) modes.push('comparison')
  if (hasFunnelMode(query)) modes.push('funnel')
  if (hasFlowMode(query)) modes.push('flow')
  if (hasRetentionMode(query)) modes.push('retention')
  return modes
}

/** The single priority mode for a query, or 'regular' when none match. */
export function detectQueryMode(query: SemanticQuery): QueryMode {
  return getActiveQueryModes(query)[0] ?? 'regular'
}
