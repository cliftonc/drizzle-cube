/**
 * Read-only dashboards (editable={false}) show the view-mode filter bar: viewers can
 * change filter values, but cannot add, edit or remove filters.
 */

import { useState } from 'react'
import { http, HttpResponse } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AnalyticsDashboard from '../../../../src/client/components/AnalyticsDashboard'
import DashboardProvider from '../../../../src/client/components/dashboard/DashboardProvider'
import DashboardFilterBar from '../../../../src/client/components/dashboard/DashboardFilterBar'
import type { DashboardConfig, DashboardFilter, CubeMeta, CubeQuery } from '../../../../src/client/types'
import { createLoadHandler, createMetaHandler, mockMeta } from '../../../client-setup/msw-handlers'
import { server } from '../../../client-setup/msw-server'
import { renderWithProviders } from '../../../client-setup/test-utils'

const filters: DashboardFilter[] = [
  {
    id: 'period',
    label: 'Period',
    isUniversalTime: true,
    filter: { member: '__universal_time__', operator: 'inDateRange', values: ['last 12 months'] }
  },
  {
    id: 'active',
    label: 'Active',
    filter: { member: 'Employees.isActive', operator: 'equals', values: [true] }
  }
]
const config: DashboardConfig = { portlets: [], filters }

const schema: CubeMeta = {
  cubes: [{ name: 'Employees', title: 'Employees', segments: [], measures: [], dimensions: [
    { name: 'Employees.isActive', title: 'Is Active', shortTitle: 'Is Active', type: 'boolean' }
  ] }]
}

function renderFilterBar(editable: boolean, dashboardFilters = filters) {
  const onDashboardFiltersChange = vi.fn()
  const onSave = vi.fn()
  const view = renderWithProviders(
    <DashboardProvider
      config={{ ...config, filters: dashboardFilters }}
      editable={editable}
      dashboardFilters={dashboardFilters}
      schema={schema}
      onDashboardFiltersChange={onDashboardFiltersChange}
      onSave={onSave}
    >
      <DashboardFilterBar />
    </DashboardProvider>
  )
  return { ...view, onDashboardFiltersChange, onSave }
}

function buttonLabels() {
  return screen.queryAllByRole('button').map(b => `${b.textContent}|${b.getAttribute('title') ?? ''}`)
}

/** Adds `false` to the Active chip's values through the view-mode popover. */
async function changeBoolean() {
  const user = userEvent.setup()
  await user.click(screen.getAllByText('Active')[0])
  await user.click(await screen.findByRole('button', { name: 'Select value...' }))
  await user.click(await screen.findByRole('button', { name: 'false' }))
}

describe('read-only dashboard filters', () => {
  it('shows the same filter bar as an editable dashboard in view mode', () => {
    const editable = renderFilterBar(true)
    const viewModeButtons = buttonLabels()
    editable.unmount()

    renderFilterBar(false)

    expect(viewModeButtons.some(label => label.startsWith('30D|'))).toBe(true)
    expect(buttonLabels()).toEqual(viewModeButtons)
  })

  it('lets a viewer change a filter value without saving the dashboard', async () => {
    const user = userEvent.setup()
    const { onDashboardFiltersChange, onSave } = renderFilterBar(false)

    await user.click(screen.getAllByRole('button', { name: '30D' })[0])

    const updated: DashboardFilter[] = onDashboardFiltersChange.mock.calls.at(-1)?.[0]
    expect(updated.map(f => f.id)).toEqual(['period', 'active'])
    expect(updated.find(f => f.id === 'period')?.filter).toMatchObject({ dateRange: 'last 30 days' })
    expect(onSave).not.toHaveBeenCalled()
  })

  it('keeps boolean-only viewer controls without date creation on either layout', async () => {
    server.use(...createLoadHandler([{ 'Employees.isActive': false }]))
    const { onDashboardFiltersChange, onSave } = renderFilterBar(false, [filters[1]])

    // Both responsive layouts remain mounted in jsdom.
    expect(screen.getAllByText('Active')).toHaveLength(2)
    await changeBoolean()

    const updated: DashboardFilter[] = onDashboardFiltersChange.mock.calls.at(-1)?.[0]
    expect(updated).toEqual([{ ...filters[1], filter: {
      member: 'Employees.isActive', operator: 'equals', values: [true, false]
    } }])
    expect(screen.queryAllByRole('button', { name: '30D' })).toHaveLength(0)
    expect(screen.queryAllByRole('button', { name: 'Custom' })).toHaveLength(0)
    expect(screen.queryAllByRole('button', { name: 'XTD' })).toHaveLength(0)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('keeps date creation on editable boolean-only dashboards in view mode', async () => {
    const user = userEvent.setup()
    const { onDashboardFiltersChange, onSave } = renderFilterBar(true, [filters[1]])

    await user.click(screen.getAllByRole('button', { name: '30D' })[0])

    expect(onDashboardFiltersChange).toHaveBeenLastCalledWith([
      filters[1],
      expect.objectContaining({
        isUniversalTime: true,
        filter: expect.objectContaining({ member: '__universal_time__', dateRange: 'last 30 days' })
      })
    ])
    expect(onSave).not.toHaveBeenCalled()
  })

  it('changes a plain date filter value without adding a definition', async () => {
    const user = userEvent.setup()
    const dateFilter: DashboardFilter = {
      id: 'created-date', label: 'Created date',
      filter: { member: 'Employees.createdAt', operator: 'inDateRange', values: ['last 7 days'] }
    }
    const { onDashboardFiltersChange, onSave } = renderFilterBar(false, [dateFilter, filters[1]])

    await user.click(screen.getAllByRole('button', { name: '30D' })[0])

    expect(onDashboardFiltersChange).toHaveBeenLastCalledWith([
      { ...dateFilter, filter: { ...dateFilter.filter, values: [], dateRange: 'last 30 days' } },
      filters[1]
    ])
    expect(onSave).not.toHaveBeenCalled()
  })
})

/** The host owns config state; the real dashboard/provider emits queries through MSW. */
function renderQueryDashboard(editable?: boolean) {
  const queries: CubeQuery[] = []
  const onSave = vi.fn()
  const initialConfig: DashboardConfig = {
    eagerLoad: true, // jsdom's intersection observer never makes lazy portlets visible.
    filters,
    portlets: [
      {
        id: 'mapped', title: 'Mapped employees', x: 0, y: 0, w: 6, h: 4,
        query: JSON.stringify({
          measures: ['Employees.count'],
          timeDimensions: [{ dimension: 'Employees.createdAt', dateRange: 'last 7 days' }]
        }),
        chartType: 'kpiNumber', chartConfig: { yAxis: ['Employees.count'] },
        dashboardFilterMapping: ['period', { filterId: 'active', member: 'Employees.isEnabled' }]
      },
      {
        id: 'unmapped', title: 'Unmapped departments', x: 6, y: 0, w: 6, h: 4,
        query: JSON.stringify({
          measures: ['Departments.count'],
          filters: [{ member: 'Departments.name', operator: 'equals', values: ['Engineering'] }]
        }),
        chartType: 'kpiNumber', chartConfig: { yAxis: ['Departments.count'] }
      }
    ]
  }
  let currentConfig = initialConfig
  function respond(query: CubeQuery) {
    queries.push(query)
    return HttpResponse.json({
      data: query.dimensions?.includes('Employees.isActive')
        ? [{ 'Employees.isActive': false }] : [],
      query,
      annotation: { measures: {}, dimensions: {}, timeDimensions: {} }
    })
  }
  server.use(
    createMetaHandler({
      ...mockMeta,
      cubes: mockMeta.cubes.map(cube => cube.name === 'Employees' ? {
        ...cube, segments: [],
        dimensions: [...cube.dimensions,
          { name: 'Employees.isActive', title: 'Is Active', type: 'boolean' },
          { name: 'Employees.isEnabled', title: 'Is Enabled', type: 'boolean' }
        ]
      } : { ...cube, segments: [] })
    }),
    http.get('*/cubejs-api/v1/load', ({ request }) =>
      respond(JSON.parse(new URL(request.url).searchParams.get('query') ?? '{}'))),
    http.post('*/cubejs-api/v1/load', async ({ request }) => {
      const body = await request.json() as { query: CubeQuery }
      return respond(body.query)
    })
  )
  function Host() {
    const [hostConfig, setConfig] = useState(initialConfig)
    return <AnalyticsDashboard
      config={hostConfig}
      editable={editable}
      onConfigChange={next => {
        currentConfig = next
        setConfig(next)
      }}
      onSave={onSave}
    />
  }
  renderWithProviders(<Host />)
  return {
    queries, onSave, initialConfig,
    getConfig: () => currentConfig,
    lastQuery: (measure: string) => queries.filter(query => query.measures?.includes(measure)).at(-1)
  }
}

describe('config-backed public dashboard viewer queries', () => {
  it.each([
    ['editable=false', false],
    ['editable omitted', undefined]
  ] as const)('applies saved dates and round-trips 30D without saving (%s)', async (_, editable) => {
    const user = userEvent.setup()
    const host = renderQueryDashboard(editable)

    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({
      timeDimensions: [{ dimension: 'Employees.createdAt', dateRange: 'last 12 months' }],
      filters: [{ member: 'Employees.isEnabled', operator: 'equals', values: [true] }]
    }))
    await waitFor(() => expect(host.lastQuery('Departments.count')).toBeDefined())
    const unmappedQuery = host.lastQuery('Departments.count')

    await user.click(screen.getAllByRole('button', { name: '30D' })[0])

    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({
      timeDimensions: [{ dimension: 'Employees.createdAt', dateRange: 'last 30 days' }],
      filters: [{ member: 'Employees.isEnabled', operator: 'equals', values: [true] }]
    }))
    expect(host.getConfig().filters).toEqual([
      { ...filters[0], filter: { ...filters[0].filter, values: [], dateRange: 'last 30 days' } },
      filters[1]
    ])
    expect(host.getConfig().portlets).toEqual(host.initialConfig.portlets)
    expect(host.lastQuery('Departments.count')).toEqual(unmappedQuery)
    expect(host.onSave).not.toHaveBeenCalled()
  })

  it('round-trips a boolean chip through its member mapping and preserves the unmapped query', async () => {
    const host = renderQueryDashboard(false)
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({
      filters: [{ member: 'Employees.isEnabled', operator: 'equals', values: [true] }]
    }))
    await waitFor(() => expect(host.lastQuery('Departments.count')).toMatchObject({
      measures: ['Departments.count'],
      filters: [{ member: 'Departments.name', operator: 'equals', values: ['Engineering'] }]
    }))
    const unmappedQuery = host.lastQuery('Departments.count')

    await changeBoolean()

    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({
      filters: [{ member: 'Employees.isEnabled', operator: 'equals', values: [true, false] }],
      timeDimensions: [{ dimension: 'Employees.createdAt', dateRange: 'last 12 months' }]
    }))
    expect(host.getConfig().filters).toEqual([
      filters[0],
      { ...filters[1], filter: { ...filters[1].filter, values: [true, false] } }
    ])
    expect(host.getConfig().portlets).toEqual(host.initialConfig.portlets)
    expect(host.queries.filter(query => query.measures?.includes('Departments.count'))
      .every(query => JSON.stringify(query) === JSON.stringify(unmappedQuery))).toBe(true)
    expect(host.onSave).not.toHaveBeenCalled()
  })
})
