/**
 * The drill part of a portlet view state comes back from the host untouched
 * but unread, so its shape is checked before a new portlet starts from it.
 */

import { describe, expect, it } from 'vitest'
import { parsePortletDrillViewState } from '../../../../src/client/components/analyticsPortlet/drillViewState'

const baseQuery = JSON.stringify({ measures: ['Sales.count'], timeDimensions: [{ dimension: 'Sales.date', granularity: 'month' }] })
const drilledQuery = { measures: ['Sales.count'], timeDimensions: [{ dimension: 'Sales.date', granularity: 'week' }] }

const viewState = {
  version: 1,
  baseQuery,
  drilledQuery,
  drillPath: [{ id: 'level-1', label: '2024-01', query: drilledQuery, granularity: 'week' }],
  originalGranularity: 'month',
  originalChartConfig: null,
  currentChartConfig: null,
  originalQuery: JSON.parse(baseQuery)
}

describe('parsePortletDrillViewState', () => {
  it('returns a drill state taken from the same base query', () => {
    expect(parsePortletDrillViewState(viewState, baseQuery)).toEqual(viewState)
  })

  it('ignores a drill state taken from another base query', () => {
    expect(parsePortletDrillViewState(viewState, JSON.stringify({ measures: ['Sales.total'] }))).toBeNull()
  })

  it('ignores a drill state when there is no base query', () => {
    expect(parsePortletDrillViewState(viewState, null)).toBeNull()
  })

  it.each([
    ['an unknown version', { ...viewState, version: 2 }],
    ['no drilled query', { ...viewState, drilledQuery: undefined }],
    ['a drill path entry without a query', { ...viewState, drillPath: [{ id: 'level-1', label: '2024-01' }] }],
    ['a granularity that is not a string', { ...viewState, originalGranularity: 3 }],
    ['a chart config that is not an object', { ...viewState, currentChartConfig: 'bar' }],
    ['a value that is not an object', ['level-1']]
  ])('ignores a drill state with %s', (_label, value) => {
    expect(parsePortletDrillViewState(value, baseQuery)).toBeNull()
  })
})
