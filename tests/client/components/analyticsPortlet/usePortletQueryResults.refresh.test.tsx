/**
 * The portlet's single refresh path (issue #271, Phase 0b): `refresh({ maxAgeSeconds })`
 * reaches the server as `x-cache-max-age` for every portlet mode, and a portlet
 * that is not in view only fetches once it is.
 *
 * Runs the real query hooks against MSW and asserts on the requests the server
 * sees. Header encoding (bust → max-age 0 + no-cache) is covered by CubeClient's tests.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server, createHookWrapper } from '../../../client-setup/test-utils'
import {
  usePortletQueryResults,
  type UsePortletQueryResultsParams
} from '../../../../src/client/components/analyticsPortlet/usePortletQueryResults'
import type { CubeQuery, MultiQueryConfig, ServerFunnelQuery } from '../../../../src/client/types'
import type { ServerFlowQuery } from '../../../../src/client/types/flow'
import type { ServerRetentionQuery } from '../../../../src/client/types/retention'

interface SeenRequest {
  endpoint: 'load' | 'batch'
  maxAge: string | null
  cacheControl: string | null
}

const ANNOTATION = { measures: {}, dimensions: {}, timeDimensions: {} }
const CACHED_AT = '2026-10-23T10:00:00.000Z'
const LAST_REFRESH_TIME = '2026-10-23T10:00:30.000Z'

const singleQuery: CubeQuery = { measures: ['Employees.count'] }

const multiConfig: MultiQueryConfig = {
  queries: [{ measures: ['Employees.count'] }, { measures: ['Departments.count'] }],
  mergeStrategy: 'concat'
}

const funnelQuery: ServerFunnelQuery = {
  funnel: {
    bindingKey: 'Events.userId',
    timeDimension: 'Events.timestamp',
    steps: [{ name: 'Signup' }, { name: 'Purchase' }]
  }
}

const flowQuery: ServerFlowQuery = {
  flow: {
    bindingKey: 'Events.userId',
    timeDimension: 'Events.timestamp',
    eventDimension: 'Events.eventType',
    startingStep: {
      name: 'Purchase',
      filter: { member: 'Events.eventType', operator: 'equals', values: ['purchase'] }
    },
    stepsBefore: 2,
    stepsAfter: 2,
    joinStrategy: 'auto'
  }
}

const retentionQuery: ServerRetentionQuery = {
  retention: {
    timeDimension: 'Events.timestamp',
    bindingKey: 'Events.userId',
    dateRange: { start: '2024-01-01', end: '2024-03-31' },
    granularity: 'week',
    periods: 4,
    retentionType: 'classic'
  }
}

function baseParams(overrides: Partial<UsePortletQueryResultsParams>): UsePortletQueryResultsParams {
  return {
    activeQuery: null,
    multiQueryConfig: null,
    serverFunnelQuery: null,
    serverFlowQuery: null,
    serverRetentionQuery: null,
    isMultiQuery: false,
    isFunnelMode: false,
    isFlowMode: false,
    isRetentionMode: false,
    shouldSkipQuery: false,
    eagerLoad: false,
    isVisible: true,
    ...overrides
  }
}

function renderPortlet(params: Partial<UsePortletQueryResultsParams>, { enableBatching = false, isVisible = true } = {}) {
  const { wrapper } = createHookWrapper({ enableBatching })
  return renderHook(
    (props: { isVisible: boolean }) => usePortletQueryResults(baseParams({ ...params, isVisible: props.isVisible })),
    { wrapper, initialProps: { isVisible } }
  )
}

/**
 * Runs past any debounce or batch window, then checks no fetch started. MSW
 * reports a request a tick after the hook starts it, so ask the hook too.
 */
async function expectNoFetch(result: { current: { isFetching: boolean } }) {
  await act(() => vi.advanceTimersByTimeAsync(500))
  expect(result.current.isFetching).toBe(false)
}

const MODES: Array<{ name: string; params: Partial<UsePortletQueryResultsParams>; endpoint: SeenRequest['endpoint'] }> = [
  { name: 'single query', params: { activeQuery: singleQuery }, endpoint: 'load' },
  { name: 'multi query', params: { multiQueryConfig: multiConfig, isMultiQuery: true }, endpoint: 'batch' },
  { name: 'funnel', params: { serverFunnelQuery: funnelQuery, isFunnelMode: true }, endpoint: 'load' },
  { name: 'flow', params: { serverFlowQuery: flowQuery, isFlowMode: true }, endpoint: 'load' },
  { name: 'retention', params: { serverRetentionQuery: retentionQuery, isRetentionMode: true }, endpoint: 'load' }
]

describe('usePortletQueryResults refresh path', () => {
  let seen: SeenRequest[] = []

  function record({ request }: { request: Request }) {
    const endpoint = new URL(request.url).pathname.split('/').pop()
    if (endpoint !== 'load' && endpoint !== 'batch') return
    seen.push({
      endpoint,
      maxAge: request.headers.get('x-cache-max-age'),
      cacheControl: request.headers.get('x-cache-control')
    })
  }

  beforeEach(() => {
    seen = []
    // waitFor only drives Jest's fake timers, so let time advance on its own too
    vi.useFakeTimers({ shouldAdvanceTime: true })
    server.events.on('request:start', record)
    server.use(
      http.get('*/cubejs-api/v1/load', () =>
        HttpResponse.json({
          results: [{ data: [], annotation: ANNOTATION, lastRefreshTime: LAST_REFRESH_TIME }]
        })
      ),
      http.post('*/cubejs-api/v1/batch', async ({ request }) => {
        const body = (await request.json()) as { queries: unknown[] }
        return HttpResponse.json({
          results: body.queries.map(() => ({
            success: true,
            data: [],
            annotation: ANNOTATION,
            lastRefreshTime: LAST_REFRESH_TIME,
            cache: { hit: true, cachedAt: CACHED_AT, ttlMs: 300000, ttlRemainingMs: 270000 }
          }))
        })
      })
    )
  })

  afterEach(() => {
    server.events.removeListener('request:start', record)
    vi.useRealTimers()
  })

  describe.each(MODES)('$name', ({ params, endpoint }) => {
    it('sends x-cache-max-age for refresh({ maxAgeSeconds })', async () => {
      const { result } = renderPortlet(params)
      await waitFor(() => expect(seen).toHaveLength(1))

      act(() => result.current.refresh({ maxAgeSeconds: 30 }))

      await waitFor(() => expect(seen).toEqual([
        { endpoint, maxAge: null, cacheControl: null },
        { endpoint, maxAge: '30', cacheControl: null }
      ]))
    })

    it('defers a refresh while off-screen and fetches with its max-age once back in view', async () => {
      const { result, rerender } = renderPortlet(params)
      await waitFor(() => expect(seen).toHaveLength(1))

      rerender({ isVisible: false })
      act(() => result.current.refresh({ maxAgeSeconds: 30 }))
      await expectNoFetch(result)
      expect(seen).toHaveLength(1)

      rerender({ isVisible: true })

      await waitFor(() => expect(seen).toEqual([
        { endpoint, maxAge: null, cacheControl: null },
        { endpoint, maxAge: '30', cacheControl: null }
      ]))
    })
  })

  it('first fetches a never-seen portlet with the max-age once in view', async () => {
    const { result, rerender } = renderPortlet({ activeQuery: singleQuery }, { isVisible: false })

    act(() => result.current.refresh({ maxAgeSeconds: 30 }))
    act(() => result.current.refresh({ maxAgeSeconds: 30 }))
    await expectNoFetch(result)
    expect(seen).toEqual([])

    rerender({ isVisible: true })

    await waitFor(() => expect(seen).toEqual([{ endpoint: 'load', maxAge: '30', cacheControl: null }]))
  })

  it('a scrolled-away portlet keeps its rows; a refresh fetches only once it is back', async () => {
    const { wrapper } = createHookWrapper()
    const { result, rerender } = renderHook(
      (props: { isScrolledAway: boolean }) => usePortletQueryResults(baseParams({ activeQuery: singleQuery, isScrolledAway: props.isScrolledAway })),
      { wrapper, initialProps: { isScrolledAway: false } }
    )
    await waitFor(() => expect(result.current.computedAt).toBeDefined())
    const computedAt = result.current.computedAt

    // Scrolled away and back without a refresh: the rows are still fresh
    rerender({ isScrolledAway: true })
    rerender({ isScrolledAway: false })
    await expectNoFetch(result)
    expect(seen).toHaveLength(1)

    rerender({ isScrolledAway: true })
    act(() => {
      result.current.refresh({ maxAgeSeconds: 30 })
      result.current.refresh({ maxAgeSeconds: 40 })
    })
    await expectNoFetch(result)
    expect(seen).toHaveLength(1)
    expect(result.current.computedAt).toBe(computedAt)

    // Back in view: one fetch, with the stricter of the pending max-ages
    rerender({ isScrolledAway: false })
    await waitFor(() => expect(seen).toEqual([
      { endpoint: 'load', maxAge: null, cacheControl: null },
      { endpoint: 'load', maxAge: '30', cacheControl: null }
    ]))
    await expectNoFetch(result)
    expect(seen).toHaveLength(2)
  })

  it('goes through the batch coordinator with the max-age when batching is on', async () => {
    const { result } = renderPortlet({ activeQuery: singleQuery }, { enableBatching: true })
    await waitFor(() => expect(seen).toHaveLength(1))

    act(() => result.current.refresh({ maxAgeSeconds: 15 }))

    await waitFor(() => expect(seen).toEqual([
      { endpoint: 'batch', maxAge: null, cacheControl: null },
      { endpoint: 'batch', maxAge: '15', cacheControl: null }
    ]))
  })

  describe('computed-at', () => {
    it('is the cache time when the server answers from cache', async () => {
      const { result } = renderPortlet({ activeQuery: singleQuery }, { enableBatching: true })
      await waitFor(() => expect(result.current.computedAt).toBe(CACHED_AT))
    })

    it('is the response time when the result carries no cache block', async () => {
      const { result } = renderPortlet({ serverFlowQuery: flowQuery, isFlowMode: true })
      await waitFor(() => expect(result.current.computedAt).toBe(LAST_REFRESH_TIME))
    })
  })
})
