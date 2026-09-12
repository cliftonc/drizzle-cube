/**
 * Which view a portlet shows once its query has resolved.
 *
 * The case that matters here is the content-first chart: a markdown narrative
 * whose whole job is to say "no incidents this week" has to survive an empty
 * result rather than being replaced by the no-data view.
 */

import { describe, expect, it } from 'vitest'
import {
  resolvePortletRenderKind,
  type PortletRenderStateParams
} from '../../../../src/client/components/analyticsPortlet/portletRenderState'

function params(overrides: Partial<PortletRenderStateParams> = {}): PortletRenderStateParams {
  return {
    hasChartConfig: true,
    hasMandatoryFields: false,
    shouldSkipQuery: false,
    rendersWithoutData: false,
    eagerLoad: true,
    isVisible: true,
    isLoading: false,
    isFetching: false,
    error: null,
    isMultiQuery: false,
    isFunnelMode: false,
    isFlowMode: false,
    isRetentionMode: false,
    queryObject: { measures: ['Employees.count'] },
    multiQueryConfig: null,
    serverFunnelQuery: null,
    serverFlowQuery: null,
    serverRetentionQuery: null,
    resultSet: { rows: [] },
    multiQueryData: null,
    flowChartData: null,
    retentionChartData: null,
    ...overrides
  }
}

describe('resolvePortletRenderKind', () => {
  it('renders the chart when data resolved', () => {
    expect(resolvePortletRenderKind(params())).toBe('chart')
  })

  // Reached when the query resolved to nothing runnable rather than while it is
  // still in flight, which is why `queryObject` is null here too.
  it('shows no-data for an ordinary chart with no result', () => {
    expect(resolvePortletRenderKind(params({ resultSet: null, queryObject: null }))).toBe('no-data')
  })

  it('still renders a content-first chart with no result', () => {
    const kind = resolvePortletRenderKind(
      params({ resultSet: null, queryObject: null, rendersWithoutData: true })
    )

    expect(kind).toBe('chart')
  })

  it('renders a content-first chart when the query came back empty', () => {
    const kind = resolvePortletRenderKind(params({ rendersWithoutData: true, resultSet: { rows: [] } }))

    expect(kind).toBe('chart')
  })

  it('keeps the error view for a content-first chart whose query failed', () => {
    const kind = resolvePortletRenderKind(
      params({ rendersWithoutData: true, error: new Error('boom') })
    )

    expect(kind).toBe('error')
  })

  it('keeps the loading view for a content-first chart while its query runs', () => {
    const kind = resolvePortletRenderKind(params({ rendersWithoutData: true, isLoading: true }))

    expect(kind).toBe('loading')
  })

  it('skips straight to the chart when the query is skipped entirely', () => {
    const kind = resolvePortletRenderKind(
      params({ shouldSkipQuery: true, rendersWithoutData: true, queryObject: null, resultSet: null })
    )

    expect(kind).toBe('chart')
  })
})
