import type {
  ChartProps,
  DashboardConfig,
  PortletExpandPayload,
  AnalyticsPortletRef,
} from '../../src/client/types'
import {
  AnalyticsDashboard,
  AnalyticsPortlet,
} from '../../src/client/components'
import type { ChartDefinition } from '../../src/client/charts/chartPlugin'
import { CubeProvider } from '../../src/client/providers'
import { createRef, useState } from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { QueryClient } from '@tanstack/react-query'
import { server } from '../client-setup/msw-server'

type ViewState = { page: number; pageSize: number }

function StatefulChart({ initialViewState, onViewStateChange }: ChartProps) {
  const [state, setState] = useState<ViewState>(
    () =>
      initialViewState && typeof initialViewState === 'object'
        && 'page' in initialViewState && typeof initialViewState.page === 'number'
        && 'pageSize' in initialViewState && typeof initialViewState.pageSize === 'number'
        ? { page: initialViewState.page, pageSize: initialViewState.pageSize }
        : { page: 1, pageSize: 25 },
  )
  const change = (next: ViewState) => {
    setState(next)
    onViewStateChange?.(next)
  }
  return (
    <div>
      <output aria-label="Chart state">
        Page {state.page}; size {state.pageSize}
      </output>
      <button type="button" onClick={() => change({ ...state, page: 2 })}>
        Page two
      </button>
      <button type="button" onClick={() => change({ page: 1, pageSize: 50 })}>
        Size fifty
      </button>
      <button type="button" onClick={() => change({ page: 1, pageSize: 25 })}>
        Reset view
      </button>
    </div>
  )
}

const apiUrl = 'https://cube.example.test/cube'
const charts: ChartDefinition[] = [
  {
    type: 'statefulRegressionChart',
    label: 'Synthetic state',
    config: { dropZones: [] },
    component: StatefulChart,
  },
]
const config: DashboardConfig = {
  eagerLoad: true,
  portlets: [
    {
      id: 'synthetic',
      title: 'Synthetic state',
      x: 0,
      y: 0,
      w: 12,
      h: 5,
      analysisConfig: {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        query: { dimensions: ['Records.name'] },
        charts: {
          query: {
            chartType: 'statefulRegressionChart',
            chartConfig: {},
            displayConfig: {},
          },
        },
      },
    },
  ],
}

function ExpandHarness() {
  const [expanded, setExpanded] = useState<PortletExpandPayload | null>(null)
  return (
    <CubeProvider
      apiOptions={{ apiUrl }}
      customCharts={charts}
      features={{ portletExpand: true }}
    >
      <section aria-label="Original">
        <AnalyticsDashboard config={config} onPortletExpand={setExpanded} />
      </section>
      {expanded && (
        <section aria-label="Expanded">
          <button type="button" onClick={() => setExpanded(null)}>
            Close expanded
          </button>
          <AnalyticsPortlet
            {...expanded.chartProps}
            initialViewState={expanded.viewState}
            height={200}
          />
        </section>
      )}
    </CubeProvider>
  )
}

function installSyntheticApi(onQuery: () => void = () => {}) {
  const member = { name: 'Records.name', title: 'Name', shortTitle: 'Name', type: 'string' }
  const result = (query: unknown) => ({
    query,
    data: [{ 'Records.name': 'Synthetic row' }],
    annotation: { measures: {}, dimensions: { 'Records.name': member }, segments: {}, timeDimensions: {} },
  })
  server.use(
    http.get(`${apiUrl}/meta`, () => HttpResponse.json({
      cubes: [{ name: 'Records', title: 'Records', measures: [], dimensions: [member], segments: [] }],
    })),
    http.get(`${apiUrl}/load`, ({ request }) => {
      onQuery()
      return HttpResponse.json(result(JSON.parse(new URL(request.url).searchParams.get('query') ?? '{}')))
    }),
    http.post(`${apiUrl}/batch`, async ({ request }) => {
      const body = await request.json()
      if (!body || typeof body !== 'object' || !('queries' in body) || !Array.isArray(body.queries)) {
        return new HttpResponse(null, { status: 400 })
      }
      body.queries.forEach(() => onQuery())
      return HttpResponse.json({ results: body.queries.map(query => ({ success: true, ...result(query) })) })
    }),
  )
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

test.each([
  { control: 'Page two', expected: 'Page 2; size 25', stale: false },
  { control: 'Size fifty', expected: 'Page 1; size 50', stale: false },
  { control: 'Page two', expected: 'Page 2; size 25', stale: true },
  { control: 'Size fifty', expected: 'Page 1; size 50', stale: true },
])('preserves $control through Expand with stale=$stale', async ({ control, expected, stale }) => {
  window.innerWidth = 1400
  const user = userEvent.setup()
  let queries = 0
  installSyntheticApi(() => { queries++; })
  render(<ExpandHarness />)
  const original = within(screen.getByRole('region', { name: 'Original' }))
  await user.click(await original.findByRole('button', { name: control }))
  expect(original.getByLabelText('Chart state')).toHaveTextContent(expected)
  const requestsBefore = queries
  if (stale) vi.setSystemTime(Date.now() + 300_001)

  await user.click(original.getByRole('button', { name: 'Expand' }))
  const expanded = () => within(screen.getByRole('region', { name: 'Expanded' }))
  await waitFor(() => expect(expanded().getByLabelText('Chart state')).toHaveTextContent(expected))
  await waitFor(() => expect(queries - requestsBefore).toBe(stale ? 1 : 0))
  await waitFor(() => expect(original.getByLabelText('Chart state')).toHaveTextContent(expected))
  await user.click(expanded().getByRole('button', { name: 'Reset view' }))
  expect(expanded().getByLabelText('Chart state')).toHaveTextContent('Page 1; size 25')
  expect(original.getByLabelText('Chart state')).toHaveTextContent(expected)
  await user.click(expanded().getByRole('button', { name: 'Close expanded' }))
  expect(screen.queryByRole('region', { name: 'Expanded' })).toBeNull()
  expect(original.getByLabelText('Chart state')).toHaveTextContent(expected)
  await user.click(original.getByRole('button', { name: 'Expand' }))
  await waitFor(() => expect(expanded().getByLabelText('Chart state')).toHaveTextContent(expected))
})


test('keeps a mounted custom chart during a pending refetch and shows refresh errors', async () => {
  installSyntheticApi()
  const user = userEvent.setup()
  const ref = createRef<AnalyticsPortletRef>()
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <CubeProvider apiOptions={{ apiUrl }} customCharts={charts} queryClient={queryClient} enableBatching={false}>
      <AnalyticsPortlet ref={ref} query={JSON.stringify({ dimensions: ['Records.name'] })}
        chartType="statefulRegressionChart" eagerLoad loadingComponent={<p>Loading synthetic query</p>} />
    </CubeProvider>,
  )
  await user.click(await screen.findByRole('button', { name: 'Page two' }))
  const originalChart = screen.getByLabelText('Chart state')
  let release = () => {}
  const responseReady = new Promise<void>(resolve => { release = resolve; })
  let refreshStarted = false
  server.use(http.get(`${apiUrl}/load`, async () => {
    refreshStarted = true
    await responseReady
    return HttpResponse.json({ error: 'Synthetic refresh failed' }, { status: 500 })
  }))
  act(() => ref.current?.refresh())
  await waitFor(() => expect(refreshStarted).toBe(true))
  expect(screen.getByLabelText('Chart state')).toBe(originalChart)
  expect(originalChart).toHaveTextContent('Page 2; size 25')
  expect(screen.queryByText('Loading synthetic query')).toBeNull()
  release()
  expect(await screen.findByText('Synthetic refresh failed')).toBeInTheDocument()
  expect(screen.queryByLabelText('Chart state')).toBeNull()
})

test('shows loading for an initial request and a changed query instead of previous results', async () => {
  installSyntheticApi()
  let release = () => {}
  let responseReady = new Promise<void>(resolve => { release = resolve; })
  let requests = 0
  server.use(http.get(`${apiUrl}/load`, async ({ request }) => {
    requests++
    await responseReady
    return HttpResponse.json({
      query: JSON.parse(new URL(request.url).searchParams.get('query') ?? '{}'),
      data: [{ 'Records.name': 'Synthetic row' }],
      annotation: { measures: {}, dimensions: {}, segments: {}, timeDimensions: {} },
    })
  }))
  const view = (limit: number) => (
    <CubeProvider apiOptions={{ apiUrl }} customCharts={charts} enableBatching={false}>
      <AnalyticsPortlet query={JSON.stringify({ dimensions: ['Records.name'], limit })}
        chartType="statefulRegressionChart" eagerLoad loadingComponent={<p>Loading synthetic query</p>} />
    </CubeProvider>
  )
  const { rerender } = render(view(10))
  await waitFor(() => expect(requests).toBe(1))
  expect(screen.getByText('Loading synthetic query')).toBeInTheDocument()
  expect(screen.queryByLabelText('Chart state')).toBeNull()
  release()
  await screen.findByLabelText('Chart state')
  await userEvent.setup().click(screen.getByRole('button', { name: 'Page two' }))
  responseReady = new Promise<void>(resolve => { release = resolve; })
  rerender(view(20))
  await waitFor(() => expect(requests).toBe(2))
  expect(screen.getByText('Loading synthetic query')).toBeInTheDocument()
  expect(screen.queryByLabelText('Chart state')).toBeNull()
  release()
  expect(await screen.findByLabelText('Chart state')).toHaveTextContent('Page 1; size 25')
})


test('retains previous results in manual-refresh mode until Refresh executes the changed query', async () => {
  let requests = 0
  installSyntheticApi(() => { requests++ })
  const ref = createRef<AnalyticsPortletRef>()
  const view = (limit: number) => (
    <CubeProvider apiOptions={{ apiUrl }} customCharts={charts} features={{ manualRefresh: true }} enableBatching={false}>
      <AnalyticsPortlet ref={ref} query={JSON.stringify({ dimensions: ['Records.name'], limit })}
        chartType="statefulRegressionChart" eagerLoad loadingComponent={<p>Loading synthetic query</p>} />
    </CubeProvider>
  )
  const { rerender } = render(view(10))
  await screen.findByLabelText('Chart state')
  expect(requests).toBe(1)
  rerender(view(20))
  expect(await screen.findByText('Loading synthetic query')).toBeInTheDocument()
  await screen.findByLabelText('Chart state')
  expect(requests).toBe(1)
  let release = () => {}
  const responseReady = new Promise<void>(resolve => { release = resolve })
  server.use(http.get(`${apiUrl}/load`, async ({ request }) => {
    requests++
    await responseReady
    return HttpResponse.json({
      query: JSON.parse(new URL(request.url).searchParams.get('query') ?? '{}'),
      data: [{ 'Records.name': 'Synthetic row' }],
      annotation: { measures: {}, dimensions: {}, segments: {}, timeDimensions: {} },
    })
  }))
  act(() => ref.current?.refresh())
  await waitFor(() => expect(requests).toBe(2))
  expect(screen.getByText('Loading synthetic query')).toBeInTheDocument()
  expect(screen.queryByLabelText('Chart state')).toBeNull()
  release()
  await screen.findByLabelText('Chart state')
})
