/**
 * `hasRunnableQuery` is what tells a static text portlet apart from a data
 * narrative. A chart marked `skipQuery` does not require a query, but markdown
 * may still carry one, and getting this wrong either runs a query for every
 * section header or silently drops a narrative's data.
 */

import { describe, expect, it } from 'vitest'
import { hasRunnableQuery } from '../../../../src/client/components/analyticsPortlet/parsePortletQuery'

describe('hasRunnableQuery', () => {
  it('is false for an empty string', () => {
    expect(hasRunnableQuery('')).toBe(false)
  })

  it('is false for whitespace', () => {
    expect(hasRunnableQuery('   ')).toBe(false)
  })

  it('is false for the empty object the agent writes for text portlets', () => {
    expect(hasRunnableQuery('{}')).toBe(false)
  })

  it('is false for unparseable JSON rather than throwing', () => {
    expect(hasRunnableQuery('{ not json')).toBe(false)
  })

  it('is false for a query whose member lists are all empty', () => {
    expect(hasRunnableQuery(JSON.stringify({ measures: [], dimensions: [], filters: [] }))).toBe(false)
  })

  it('is true for a query with a measure', () => {
    expect(hasRunnableQuery(JSON.stringify({ measures: ['Employees.count'] }))).toBe(true)
  })

  it('is true for a query with only a dimension', () => {
    expect(hasRunnableQuery(JSON.stringify({ dimensions: ['Employees.department'] }))).toBe(true)
  })

  it('is true for a query with only a time dimension', () => {
    const query = { timeDimensions: [{ dimension: 'Employees.createdAt', granularity: 'month' }] }
    expect(hasRunnableQuery(JSON.stringify(query))).toBe(true)
  })

  it('is true for a funnel query', () => {
    const query = { funnel: { steps: [{ name: 'Signup', cube: 'Events' }] } }
    expect(hasRunnableQuery(JSON.stringify(query))).toBe(true)
  })
})
