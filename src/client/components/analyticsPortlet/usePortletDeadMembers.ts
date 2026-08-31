/**
 * Drops members a dashboard references that no longer exist.
 *
 * Deleting a user-defined attribute removes its generated dimension, and every
 * saved widget that projected it then fails validation as a whole — one
 * deletion takes out several dashboards. Rather than fail, the portlet drops
 * the dead columns and re-runs, reporting what it dropped.
 *
 * **Filters are deliberately not pruned.** Dropping a projected member narrows
 * what is displayed; dropping a filter would widen the result set, showing rows
 * the author meant to exclude. That stays a hard error.
 *
 * Pruning is reactive rather than pre-emptive on purpose: a `shown: false`
 * dimension is absent from `/meta` yet perfectly queryable — exactly how large
 * generated attribute sets are configured — so checking the query against
 * metadata up front would drop valid columns.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CubeQuery, CubeValidationIssue } from '../../types.js'

/** Sources whose members can be dropped without changing which rows match. */
const PRUNABLE_SOURCES = new Set<CubeValidationIssue['source']>([
  'measure',
  'dimension',
  'timeDimension'
])

export interface UsePortletDeadMembersParams {
  queryObject: CubeQuery | null
  /** The error from the last attempt, if it failed. */
  error: unknown
}

export interface UsePortletDeadMembersResult {
  /** The query with dead members removed — the original when there are none. */
  query: CubeQuery | null
  /** Members dropped so far, for the note shown above the chart. */
  droppedMembers: string[]
}

/**
 * Pull the prunable members out of a failed query, or `null` when the failure
 * is not one we may recover from.
 *
 * A single unknown *filter* member makes the whole error unrecoverable, even
 * alongside prunable ones: re-running without the dead columns would still
 * carry the dead filter.
 */
export function prunableMembers(error: unknown): string[] | null {
  const issues = (error as { issues?: CubeValidationIssue[] } | null)?.issues
  if (!Array.isArray(issues) || issues.length === 0) return null
  if (issues.some(issue => !PRUNABLE_SOURCES.has(issue.source))) return null
  return [...new Set(issues.map(issue => issue.member))]
}

/** Remove members from everything that projects or orders by them. */
export function withoutMembers(query: CubeQuery, members: string[]): CubeQuery {
  if (members.length === 0) return query
  const dead = new Set(members)

  const pruned: CubeQuery = {
    ...query,
    measures: query.measures?.filter(member => !dead.has(member)),
    dimensions: query.dimensions?.filter(member => !dead.has(member)),
    timeDimensions: query.timeDimensions?.filter(td => !dead.has(td.dimension))
  }

  if (query.order) {
    const order = Object.fromEntries(
      Object.entries(query.order).filter(([member]) => !dead.has(member))
    )
    pruned.order = Object.keys(order).length > 0 ? order : undefined
  }

  return pruned
}

export function usePortletDeadMembers({
  queryObject,
  error
}: UsePortletDeadMembersParams): UsePortletDeadMembersResult {
  const [droppedMembers, setDroppedMembers] = useState<string[]>([])

  // A different base query is a different set of members; start over.
  const queryJson = queryObject ? JSON.stringify(queryObject) : null
  const previousQueryJson = useRef<string | null>(null)
  useEffect(() => {
    if (queryJson !== previousQueryJson.current) {
      previousQueryJson.current = queryJson
      setDroppedMembers(current => (current.length > 0 ? [] : current))
    }
  }, [queryJson])

  useEffect(() => {
    const members = prunableMembers(error)
    if (!members) return
    setDroppedMembers(current => {
      // Only grow. Without this the effect would re-fire on every render for
      // the same error and never settle.
      const next = members.filter(member => !current.includes(member))
      return next.length > 0 ? [...current, ...next] : current
    })
  }, [error])

  const query = useMemo(
    () => (queryObject ? withoutMembers(queryObject, droppedMembers) : null),
    [queryObject, droppedMembers]
  )

  return { query, droppedMembers }
}
