import type { Filter, FilterCondition } from '../../src/server/types'
import { flattenFilters } from '../../src/server/filter-cache'

/**
 * The same filter in a form that a query plans with a row-level join.
 *
 * A group that holds a condition matching a missing row (`notSet`) keeps the
 * row-level join, and `a or (a and b)` matches the rows that `a` matches.
 * Every condition stays on the filter's cube, so the planner still pushes the
 * group into a pre-aggregation as it does the filter itself.
 *
 * @param filter - Condition or group on one cube that the query uses only for filtering
 * @returns The group
 */
export function onRowLevelJoin(filter: Filter): Filter {
  const [{ member }] = flattenFilters([filter])
  const missingRow: FilterCondition = { member, operator: 'notSet', values: [] }
  return { or: [filter, { and: [filter, missingRow] }] }
}
