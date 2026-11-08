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
 * the author meant to exclude. That stays a hard error. A time dimension with a
 * `dateRange` or a `compareDateRange` filters too, so it is not pruned either.
 *
 * Pruning is reactive rather than pre-emptive on purpose: a `shown: false`
 * dimension is absent from `/meta` yet perfectly queryable — exactly how large
 * generated attribute sets are configured — so checking the query against
 * metadata up front would drop valid columns.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CubeQuery, CubeValidationIssue } from '../../types.js'

/**
 * Sources whose members can be dropped without changing which rows match. A
 * time dimension qualifies only while it carries no date range — see
 * `prunableMembers`.
 */
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
 * carry the dead filter. An unknown time dimension that carries a date range in
 * `query` is a filter in the same way: `withoutMembers` removes its complete
 * entry, and the date predicate with it.
 */
export function prunableMembers(error: unknown, query: CubeQuery): string[] | null {
  const issues = (error as { issues?: CubeValidationIssue[] } | null)?.issues
  if (!Array.isArray(issues) || issues.length === 0) return null
  if (issues.some(issue => !PRUNABLE_SOURCES.has(issue.source))) return null
  if (issues.some(issue => issue.source === 'timeDimension' && filtersByDate(query, issue.member))) {
    return null
  }
  return [...new Set(issues.map(issue => issue.member))]
}

/** Whether a time dimension entry of `query` for `member` restricts the dates. */
function filtersByDate(query: CubeQuery, member: string): boolean {
  return query.timeDimensions?.some(
    td => td.dimension === member && (td.dateRange !== undefined || td.compareDateRange !== undefined)
  ) ?? false
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

  // The failure is checked against the query that is current when it arrives.
  // A ref, because a new query alone must not re-check an earlier failure: the
  // new query has not run yet.
  const queryObjectRef = useRef(queryObject)
  useEffect(() => {
    queryObjectRef.current = queryObject
  }, [queryObject])

  useEffect(() => {
    const latestQuery = queryObjectRef.current
    if (!latestQuery) return
    const members = prunableMembers(error, latestQuery)
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
