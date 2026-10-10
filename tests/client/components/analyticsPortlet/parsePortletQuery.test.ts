/**
 * Dashboard date filters reaching portlets through parsePortletQuery (#1285).
 */

import { describe, it, expect } from 'vitest'
import { parsePortletQuery } from '../../../../src/client/components/analyticsPortlet/parsePortletQuery'
import { getRegularDashboardFilters } from '../../../../src/client/utils/filterUtils'
import type { DashboardFilter, DashboardFilterMapping } from '../../../../src/client/types'

const universal: DashboardFilter = {
  id: 'date',
  label: 'Date Range',
  isUniversalTime: true,
  filter: { member: '__universal_time__', operator: 'inDateRange', values: [], dateRange: 'last 90 days' }
}

const plainDate: DashboardFilter = {
  id: 'created',
  label: 'Created',
  filter: { member: 'Sessions.createdAt', operator: 'inDateRange', values: [], dateRange: 'last 90 days' }
}

function parse(query: object, dashboardFilters: DashboardFilter[], mapping: DashboardFilterMapping) {
  return parsePortletQuery({
    query: JSON.stringify(query),
    shouldSkipQuery: false,
    regularFilters: getRegularDashboardFilters(dashboardFilters, mapping),
    dashboardFilters,
    dashboardFilterMapping: mapping
  })
}

const kpi = { measures: ['Sessions.count'] }

describe('parsePortletQuery dashboard date filters', () => {
  it('narrows a KPI without time dimensions with a plain inDateRange dashboard filter', () => {
    const { queryObject } = parse(kpi, [plainDate], ['created'])

    expect(queryObject?.filters).toEqual([plainDate.filter])
    expect(queryObject?.timeDimensions).toBeUndefined()
  })

  it('narrows a KPI without time dimensions with a universal filter pinned to a field', () => {
    const { queryObject } = parse(kpi, [universal], [{ filterId: 'date', member: 'Sessions.createdAt' }])

    expect(queryObject?.filters).toEqual([
      { member: 'Sessions.createdAt', operator: 'inDateRange', values: [], dateRange: 'last 90 days' }
    ])
  })

  it('applies a pinned universal filter as a filter rather than to the time dimensions', () => {
    const { queryObject } = parse(
      { ...kpi, timeDimensions: [{ dimension: 'Sessions.updatedAt', granularity: 'week' }] },
      [universal],
      [{ filterId: 'date', member: 'Sessions.createdAt' }]
    )

    expect(queryObject?.filters).toEqual([
      { member: 'Sessions.createdAt', operator: 'inDateRange', values: [], dateRange: 'last 90 days' }
    ])
    expect(queryObject?.timeDimensions).toEqual([{ dimension: 'Sessions.updatedAt', granularity: 'week' }])
  })

  it('keeps applying an unpinned universal filter to time dimensions', () => {
    const { queryObject } = parse(
      { ...kpi, timeDimensions: [{ dimension: 'Sessions.createdAt', granularity: 'day' }] },
      [universal],
      ['date']
    )

    expect(queryObject?.filters).toBeUndefined()
    expect(queryObject?.timeDimensions).toEqual([
      { dimension: 'Sessions.createdAt', granularity: 'day', dateRange: 'last 90 days' }
    ])
  })

  it('applies a pinned universal filter to funnel step 0 only once', () => {
    const funnel = {
      funnel: {
        bindingKey: 'Sessions.userId',
        timeDimension: 'Sessions.createdAt',
        steps: [{ name: 'Start', filter: [] }, { name: 'End', filter: [] }]
      }
    }
    const { serverFunnelQuery } = parse(funnel, [universal], [{ filterId: 'date', member: 'Sessions.startedAt' }])

    expect(serverFunnelQuery?.funnel.steps[0].filter).toEqual([
      { member: 'Sessions.startedAt', operator: 'inDateRange', values: [], dateRange: 'last 90 days' }
    ])
  })
})
