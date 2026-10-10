import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useEffect, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { CubeProvider } from '../../../src/client/providers/CubeProvider'
import {
  AnalysisBuilderStoreProvider,
  useAnalysisBuilderStoreApi,
} from '../../../src/client/stores/analysisBuilderStore'
import { useAnalysisBuilder } from '../../../src/client/hooks/useAnalysisBuilderHook'
import { cleanQueryForServer, transformQueryForUI } from '../../../src/client/shared/utils'
import { isMultiQueryConfig, type CubeQuery, type MultiQueryConfig } from '../../../src/client/types'
import {
  isValidAnalysisConfig,
  type AnalysisConfig,
  type QueryAnalysisConfig,
} from '../../../src/client/types/analysisConfig'
import { createTestQueryClient, server } from '../../client-setup/test-utils'

const observedData = [{ 'Employees.createdAt': '2026-09-01', 'Employees.count': 0 }]

function captureRequests() {
  const queries: CubeQuery[] = []
  const resultFor = (query: CubeQuery) => {
    queries.push(query)
    return {
      data: observedData,
      annotation: { measures: {}, dimensions: {}, timeDimensions: {} },
      query,
    }
  }
  server.use(
    http.get('*/cubejs-api/v1/load', ({ request }) =>
      HttpResponse.json(resultFor(JSON.parse(new URL(request.url).searchParams.get('query') || '{}')))),
    http.post('*/cubejs-api/v1/load', async ({ request }) =>
      HttpResponse.json(resultFor(JSON.parse(await request.text()).query))),
    http.post('*/cubejs-api/v1/batch', async ({ request }) => {
      const body: { queries: CubeQuery[] } = JSON.parse(await request.text())
      return HttpResponse.json({ results: body.queries.map(resultFor) })
    }),
    http.post('*/cubejs-api/v1/dry-run', () => HttpResponse.json({ sql: { sql: 'SELECT 0', params: [] } })),
  )
  return queries
}

function configFor(query: CubeQuery | MultiQueryConfig): QueryAnalysisConfig {
  return { version: 1, analysisType: 'query', activeView: 'chart', charts: {}, query }
}

function renderBuilder(input: { initialQuery?: CubeQuery | MultiQueryConfig; config?: AnalysisConfig }) {
  const queryClient = createTestQueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <CubeProvider apiOptions={{ apiUrl: '/api/cubejs-api/v1' }} queryClient={queryClient} enableBatching={false}>
        <AnalysisBuilderStoreProvider initialQuery={input.initialQuery} disableLocalStorage>
          {children}
        </AnalysisBuilderStoreProvider>
      </CubeProvider>
    </QueryClientProvider>
  )
  return renderHook(() => {
    const store = useAnalysisBuilderStoreApi()
    const builder = useAnalysisBuilder()
    useEffect(() => {
      if (input.config) store.getState().load(input.config)
    }, [store, input.config])
    return { ...builder, save: () => store.getState().save() }
  }, { wrapper })
}

function savedConfig(save: () => AnalysisConfig): QueryAnalysisConfig {
  const parsed: unknown = JSON.parse(JSON.stringify(save()))
  if (!isValidAnalysisConfig(parsed) || parsed.analysisType !== 'query') {
    throw new Error('Builder saved an invalid query analysis config')
  }
  return parsed
}

function makeQuery(granularity: string, flag?: boolean, value?: number | null): CubeQuery {
  return {
    measures: ['Employees.count'],
    timeDimensions: [{
      dimension: 'Employees.createdAt', granularity,
      ...(flag !== undefined && { fillMissingDates: flag }),
    }],
    ...(value !== undefined && { fillMissingDatesValue: value }),
  }
}

function expectFill(query: CubeQuery, expected: CubeQuery) {
  for (const [actual, source, key] of [
    [query, expected, 'fillMissingDatesValue'],
    [query.timeDimensions?.[0], expected.timeDimensions?.[0], 'fillMissingDates'],
  ] as const) {
    expect(actual).toBeDefined()
    if (source && Object.prototype.hasOwnProperty.call(source, key)) {
      expect(actual).toHaveProperty(key, Reflect.get(source, key))
    } else {
      expect(actual).not.toHaveProperty(key)
    }
  }
}

describe('AnalysisBuilder date-fill query options', () => {
  beforeEach(() => server.resetHandlers())

  it.each([
    { name: 'Monthly no-fill', granularity: 'month', flag: false, value: undefined, initial: true },
    { name: 'Daily no-fill', granularity: 'day', flag: false, value: undefined, initial: false },
    { name: 'Series null fill', granularity: 'day', flag: true, value: null, initial: false },
    { name: 'explicit zero fill', granularity: 'day', flag: true, value: 0, initial: true },
    { name: 'nonzero fill', granularity: 'day', flag: undefined, value: 7, initial: false },
    { name: 'unset fill options', granularity: 'day', flag: undefined, value: undefined, initial: true },
  ])('retains $name through edits, execution, save and reopen', async ({ granularity, flag, value, initial }) => {
    const loaded = captureRequests()
    const query = makeQuery(granularity, flag, value)
    const first = renderBuilder(initial ? { initialQuery: query } : { config: configFor(query) })
    await waitFor(() => expect(loaded.length).toBeGreaterThan(0))
    expectFill(loaded[loaded.length - 1], query)

    act(() => {
      first.result.current.actions.setFilters([{ member: 'Employees.name', operator: 'contains', values: ['John'] }])
      first.result.current.actions.setOrder('Employees.count', 'desc')
      first.result.current.actions.setBreakdownGranularity(first.result.current.queryState.breakdowns[0].id, 'week')
    })
    await waitFor(() => expect(loaded[loaded.length - 1]).toMatchObject({
      filters: [{ member: 'Employees.name', operator: 'contains', values: ['John'] }],
      order: { 'Employees.count': 'desc' },
      timeDimensions: [{ granularity: 'week' }],
    }))
    expectFill(loaded[loaded.length - 1], query)
    await waitFor(() => expect(first.result.current.executionResults).toEqual(observedData))

    const saved = savedConfig(first.result.current.save)
    if (isMultiQueryConfig(saved.query)) throw new Error('Expected a single saved query')
    expectFill(saved.query, query)
    first.unmount()
    loaded.length = 0
    const reopened = renderBuilder({ config: saved })
    await waitFor(() => expect(loaded.length).toBeGreaterThan(0))
    expectFill(loaded[loaded.length - 1], query)
    expect(loaded[loaded.length - 1]).toEqual(cleanQueryForServer(saved.query))
    await waitFor(() => expect(reopened.result.current.executionResults).toEqual(observedData))
  })

  it.each(['concat', 'merge'] as const)('keeps per-query options in %s mode', async (mergeStrategy) => {
    const loaded = captureRequests()
    const queries = [makeQuery('day', false, null), makeQuery('day', true, 0), makeQuery('day')]
    queries[1].measures = ['Employees.totalSalary']
    queries[2].measures = ['Employees.avgSalary']
    // Merge mode sends Q1's breakdowns for every query, as it does granularity
    const sent = mergeStrategy === 'merge'
      ? queries.map((query) => ({ ...query, timeDimensions: queries[0].timeDimensions }))
      : queries
    const first = renderBuilder({ initialQuery: { queries, mergeStrategy } })
    await waitFor(() => expect(loaded).toHaveLength(3))
    act(() => {
      first.result.current.actions.setActiveQueryIndex(1)
    })
    act(() => first.result.current.actions.setOrder('Employees.totalSalary', 'asc'))
    await waitFor(() => expect(loaded.some((query) => query.order?.['Employees.totalSalary'] === 'asc')).toBe(true))
    sent.forEach((query) => {
      const request = [...loaded].reverse().find((candidate) => candidate.measures?.[0] === query.measures?.[0])
      expect(request).toBeDefined()
      if (request) expectFill(request, query)
    })
    const saved = savedConfig(first.result.current.save)
    if (!isMultiQueryConfig(saved.query)) throw new Error('Expected multiple saved queries')
    expect(saved.query.mergeStrategy).toBe(mergeStrategy)
    saved.query.queries.forEach((query, index) => expectFill(query, queries[index]))
    first.unmount()
    loaded.length = 0
    renderBuilder({ config: saved })
    await waitFor(() => expect(loaded).toHaveLength(3))
    sent.forEach((query) => {
      const request = loaded.find((candidate) => candidate.measures?.[0] === query.measures?.[0])
      expect(request).toBeDefined()
      if (request) expectFill(request, query)
    })
  })

  it('copies date-fill options when duplicating a query', () => {
    const query = makeQuery('day', false, null)
    const { result } = renderBuilder({ initialQuery: query })
    act(() => result.current.actions.addQuery())
    expect(result.current.allQueries).toHaveLength(2)
    result.current.allQueries.forEach((copy) => expectFill(copy, query))
    const saved = savedConfig(result.current.save)
    if (!isMultiQueryConfig(saved.query)) throw new Error('Expected the duplicated query')
    saved.query.queries.forEach((copy) => expectFill(copy, query))
  })

  it.each([null, 0, 7, undefined])('keeps %s through UI and server query transforms', (value) => {
    const query = makeQuery('day', false, value)
    const uiQuery = transformQueryForUI(query)
    expectFill(uiQuery, query)
    expectFill(cleanQueryForServer(uiQuery), query)
  })
})
