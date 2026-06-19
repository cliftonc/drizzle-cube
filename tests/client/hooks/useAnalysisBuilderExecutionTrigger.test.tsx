/**
 * Execution-trigger regression test for the AnalysisBuilder.
 *
 * Pins the behaviour the #914 hooks regroup must preserve: when the query state
 * changes (a metric is added, a filter is applied), the builder re-runs the
 * query against the server with the updated spec. This is the exact bug class
 * the issue calls out ("query does not re-run when filters change").
 *
 * It drives the public `useAnalysisBuilder` facade through its actions and
 * observes the network — so it is written against the stable public interface
 * and should survive the internal regroup unchanged.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { CubeProvider } from '../../../src/client/providers/CubeProvider'
import { AnalysisBuilderStoreProvider } from '../../../src/client/stores/analysisBuilderStore'
import { useAnalysisBuilder } from '../../../src/client/hooks/useAnalysisBuilderHook'
import { createTestQueryClient, server, mockQueryData } from '../../client-setup/test-utils'
import type { CubeQuery } from '../../../src/client/types'

/** Captures the `query` of every GET /load request the builder issues. */
function captureLoadRequests() {
  const queries: CubeQuery[] = []
  const response = () =>
    HttpResponse.json({
      data: mockQueryData,
      annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
      query: {}
    })
  server.use(
    http.get('*/cubejs-api/v1/load', ({ request }) => {
      const param = new URL(request.url).searchParams.get('query')
      if (param) queries.push(JSON.parse(param))
      return response()
    }),
    http.post('*/cubejs-api/v1/load', async ({ request }) => {
      const body = (await request.json()) as { query?: CubeQuery }
      if (body?.query) queries.push(body.query)
      return response()
    })
  )
  return queries
}

function renderBuilder() {
  const queryClient = createTestQueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <CubeProvider
        apiOptions={{ apiUrl: '/api/cubejs-api/v1' }}
        queryClient={queryClient}
        enableBatching={false}
      >
        <AnalysisBuilderStoreProvider disableLocalStorage>
          {children}
        </AnalysisBuilderStoreProvider>
      </CubeProvider>
    </QueryClientProvider>
  )
  return renderHook(() => useAnalysisBuilder({}), { wrapper })
}

describe('AnalysisBuilder execution trigger', () => {
  beforeEach(() => {
    server.resetHandlers()
  })

  it('does not hit the load endpoint while the query is empty/invalid', async () => {
    const loaded = captureLoadRequests()
    renderBuilder()
    // Give any debounce/effects a chance to (not) fire.
    await new Promise((r) => setTimeout(r, 400))
    expect(loaded).toHaveLength(0)
  })

  it('runs the query when a metric makes it valid, then re-runs when a filter changes', async () => {
    const loaded = captureLoadRequests()
    const { result } = renderBuilder()

    // Adding a measure makes the query valid → first execution.
    act(() => {
      result.current.actions.addMetric('Employees.count')
    })

    await waitFor(() => expect(loaded.length).toBeGreaterThan(0), { timeout: 2000 })
    expect(loaded[loaded.length - 1].measures).toContain('Employees.count')

    const countAfterMetric = loaded.length

    // Changing filters must trigger a fresh execution carrying the new filter.
    act(() => {
      result.current.actions.setFilters([
        { member: 'Employees.name', operator: 'contains', values: ['John'] }
      ])
    })

    await waitFor(() => expect(loaded.length).toBeGreaterThan(countAfterMetric), { timeout: 2000 })

    const lastQuery = loaded[loaded.length - 1]
    expect(lastQuery.filters).toEqual([
      { member: 'Employees.name', operator: 'contains', values: ['John'] }
    ])
  })
})
