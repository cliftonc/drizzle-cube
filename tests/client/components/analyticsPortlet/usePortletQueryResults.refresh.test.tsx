/**
 * The portlet's single refresh path (issue #271, Phase 0b): `refresh({ maxAgeSeconds })`
 * reaches the server as `x-cache-max-age` for every portlet mode, a bust sends
 * max-age 0, and a portlet that is not in view only fetches once it is.
 *
 * Runs the real query hooks against MSW and asserts on the requests the server
 * sees.
 */

import { type ReactNode } from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server, createTestQueryClient } from '../../../client-setup/test-utils'
import { CubeProvider } from '../../../../src/client/providers/CubeProvider'
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

let seen: SeenRequest[] = []

const ANNOTATION = { measures: {}, dimensions: {}, timeDimensions: {} }

function record(endpoint: SeenRequest['endpoint'], request: Request) {
  seen.push({
    endpoint,
    maxAge: request.headers.get('x-cache-max-age'),
    cacheControl: request.headers.get('x-cache-control')
  })
}

function createWrapper(enableBatching: boolean) {
  const queryClient = createTestQueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <CubeProvider
        apiOptions={{ apiUrl: '/api/cubejs-api/v1' }}
        queryClient={queryClient}
        enableBatching={enableBatching}
      >
        {children}
      </CubeProvider>
    </QueryClientProvider>
  )
  return wrapper
}

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

const MODES: Array<{ name: string; params: Partial<UsePortletQueryResultsParams>; endpoint: SeenRequest['endpoint'] }> = [
  { name: 'single query', params: { activeQuery: singleQuery }, endpoint: 'load' },
  { name: 'multi query', params: { multiQueryConfig: multiConfig, isMultiQuery: true }, endpoint: 'batch' },
  { name: 'funnel', params: { serverFunnelQuery: funnelQuery, isFunnelMode: true }, endpoint: 'load' },
  { name: 'flow', params: { serverFlowQuery: flowQuery, isFlowMode: true }, endpoint: 'load' },
  { name: 'retention', params: { serverRetentionQuery: retentionQuery, isRetentionMode: true }, endpoint: 'load' }
]

describe('usePortletQueryResults refresh path', () => {
  beforeEach(() => {
    seen = []
    server.resetHandlers()
    server.use(
      http.get('*/cubejs-api/v1/load', ({ request }) => {
        record('load', request)
        return HttpResponse.json({
          results: [{ data: [], annotation: ANNOTATION, lastRefreshTime: '2026-10-23T10:00:30.000Z' }]
        })
      }),
      http.post('*/cubejs-api/v1/batch', async ({ request }) => {
        record('batch', request)
        const body = (await request.json()) as { queries: unknown[] }
        return HttpResponse.json({
          results: body.queries.map(() => ({
            success: true,
            data: [],
            annotation: ANNOTATION,
            lastRefreshTime: '2026-10-23T10:00:30.000Z',
            cache: { hit: true, cachedAt: '2026-10-23T10:00:00.000Z', ttlMs: 300000, ttlRemainingMs: 270000 }
          }))
        })
      })
    )
  })

  describe.each(MODES)('$name', ({ params, endpoint }) => {
    it('sends x-cache-max-age for refresh({ maxAgeSeconds })', async () => {
      const { result } = renderHook(() => usePortletQueryResults(baseParams(params)), { wrapper: createWrapper(false) })
      await waitFor(() => expect(seen).toHaveLength(1))
      expect(seen[0]).toMatchObject({ endpoint, maxAge: null })

      act(() => result.current.refresh({ maxAgeSeconds: 30 }))

      await waitFor(() => expect(seen).toHaveLength(2))
      expect(seen[1]).toEqual({ endpoint, maxAge: '30', cacheControl: null })
    })

    it('sends max-age 0 for a bust', async () => {
      const { result } = renderHook(() => usePortletQueryResults(baseParams(params)), { wrapper: createWrapper(false) })
      await waitFor(() => expect(seen).toHaveLength(1))

      act(() => result.current.refresh({ bustCache: true }))

      await waitFor(() => expect(seen).toHaveLength(2))
      expect(seen[1]).toEqual({ endpoint, maxAge: '0', cacheControl: 'no-cache' })
    })

    it('refetches a cached off-screen portlet with the max-age once back in view', async () => {
      const { result, rerender } = renderHook(
        (props: { isVisible: boolean }) => usePortletQueryResults(baseParams({ ...params, isVisible: props.isVisible })),
        { wrapper: createWrapper(false), initialProps: { isVisible: true } }
      )
      await waitFor(() => expect(seen).toHaveLength(1))

      // Scrolled away with a fresh cached result, then refreshed
      rerender({ isVisible: false })
      act(() => result.current.refresh({ maxAgeSeconds: 30 }))
      await new Promise(resolve => setTimeout(resolve, 250))
      expect(seen).toHaveLength(1)

      rerender({ isVisible: true })

      await waitFor(() => expect(seen).toHaveLength(2))
      expect(seen[1]).toEqual({ endpoint, maxAge: '30', cacheControl: null })
    })
  })

  it('defers an off-screen portlet: no fetch on refresh, one fetch with the max-age once in view', async () => {
    const { result, rerender } = renderHook(
      (props: { isVisible: boolean }) => usePortletQueryResults(baseParams({ activeQuery: singleQuery, isVisible: props.isVisible })),
      { wrapper: createWrapper(false), initialProps: { isVisible: false } }
    )

    act(() => result.current.refresh({ maxAgeSeconds: 30 }))
    act(() => result.current.refresh({ maxAgeSeconds: 30 }))
    await new Promise(resolve => setTimeout(resolve, 250))
    expect(seen).toHaveLength(0)

    rerender({ isVisible: true })

    await waitFor(() => expect(seen).toHaveLength(1))
    expect(seen[0]).toEqual({ endpoint: 'load', maxAge: '30', cacheControl: null })
  })

  it('goes through the batch coordinator with the max-age when batching is on', async () => {
    const { result } = renderHook(
      () => usePortletQueryResults(baseParams({ activeQuery: singleQuery })),
      { wrapper: createWrapper(true) }
    )
    await waitFor(() => expect(seen).toHaveLength(1))
    expect(seen[0]).toEqual({ endpoint: 'batch', maxAge: null, cacheControl: null })

    act(() => result.current.refresh({ maxAgeSeconds: 15 }))

    await waitFor(() => expect(seen).toHaveLength(2))
    expect(seen[1]).toEqual({ endpoint: 'batch', maxAge: '15', cacheControl: null })
  })

  it('reports computed-at: the cache time on a hit, otherwise the response time', async () => {
    const hit = renderHook(
      () => usePortletQueryResults(baseParams({ activeQuery: singleQuery })),
      { wrapper: createWrapper(true) }
    )
    await waitFor(() => expect(hit.result.current.computedAt).toBe('2026-10-23T10:00:00.000Z'))

    const miss = renderHook(
      () => usePortletQueryResults(baseParams({ serverFlowQuery: flowQuery, isFlowMode: true })),
      { wrapper: createWrapper(false) }
    )
    await waitFor(() => expect(miss.result.current.computedAt).toBe('2026-10-23T10:00:30.000Z'))
  })
})
