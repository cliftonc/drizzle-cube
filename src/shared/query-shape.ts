/**
 * Shape questions about a query that both the client and the server ask.
 *
 * Kept here rather than duplicated because the answer decides a user-visible
 * behaviour in three places: whether a portlet runs a query at all, whether a
 * markdown portlet renders its content as a data template, and whether the
 * agent writes a query onto a markdown portlet when saving a dashboard.
 */

/** The parts of a query that make it worth running. */
interface QueryMembers {
  measures?: unknown
  dimensions?: unknown
  timeDimensions?: unknown
}

/**
 * Whether a query asks for anything the engine could run.
 *
 * A content-first chart such as markdown does not *require* a query, but it may
 * still carry one. Only the member lists count: an empty object, an object of
 * nothing but filters, and `undefined` all mean "no query".
 */
export function queryHasMembers(query: QueryMembers | null | undefined): boolean {
  if (!query || typeof query !== 'object') return false
  const count = (value: unknown) => (Array.isArray(value) ? value.length : 0)
  return (
    count(query.measures) > 0
    || count(query.dimensions) > 0
    || count(query.timeDimensions) > 0
  )
}
