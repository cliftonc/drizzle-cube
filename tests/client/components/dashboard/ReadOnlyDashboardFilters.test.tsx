/**
 * Read-only dashboards (editable={false}) show the view-mode filter bar: viewers can
 * change filter values, but cannot add, edit or remove filters.
 */

import { useState } from 'react'
import { http, HttpResponse } from 'msw'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AnalyticsDashboard from '../../../../src/client/components/AnalyticsDashboard'
import DashboardProvider from '../../../../src/client/components/dashboard/DashboardProvider'
import DashboardFilterBar from '../../../../src/client/components/dashboard/DashboardFilterBar'
import type { DashboardConfig, DashboardFilter, CubeMeta, CubeQuery } from '../../../../src/client/types'
import { createLoadHandler, createMetaHandler, mockMeta } from '../../../client-setup/msw-handlers'
import { server } from '../../../client-setup/msw-server'
import { renderWithProviders } from '../../../client-setup/test-utils'

afterEach(() => vi.restoreAllMocks())

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

  it('offers no date creation on an editable dashboard in view mode', () => {
    renderFilterBar(true, [filters[1]])

    expect(screen.getAllByText('Active')).toHaveLength(2)
    expect(screen.queryAllByRole('button', { name: '30D' })).toHaveLength(0)
    expect(screen.queryAllByRole('button', { name: 'Custom' })).toHaveLength(0)
    expect(screen.queryAllByRole('button', { name: 'XTD' })).toHaveLength(0)
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
    ], 'created-date')
    expect(onSave).not.toHaveBeenCalled()
  })
})

/** The host owns config state; the real dashboard/provider emits queries through MSW. */
function renderQueryDashboard(editable?: boolean, options: {
  configCallback?: boolean
  propFilters?: DashboardFilter[]
  configFilters?: DashboardFilter[]
  propCallback?: boolean
  acceptChanges?: boolean
} = {}) {
  if (editable) vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1280)
  const queries: CubeQuery[] = []
  const onSave = vi.fn()
  const onDirtyStateChange = vi.fn()
  const onConfigChange = vi.fn()
  const onDashboardFiltersChange = vi.fn()
  const initialConfig: DashboardConfig = {
    eagerLoad: true, // jsdom's intersection observer never makes lazy portlets visible.
    filters: options.configFilters ?? filters,
    portlets: [
      {
        id: 'mapped', title: 'Mapped employees', x: 0, y: 0, w: 6, h: 4,
        query: JSON.stringify({
          measures: ['Employees.count'],
          timeDimensions: [{ dimension: 'Employees.createdAt', dateRange: 'last 7 days' }]
        }),
        chartType: 'kpiNumber', chartConfig: { yAxis: ['Employees.count'] },
        dashboardFilterMapping: [options.configFilters?.find(f => f.isUniversalTime)?.id ?? 'period',
          { filterId: 'active', member: 'Employees.isEnabled' }]
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
  let updateConfig: (next: DashboardConfig) => void
  let updateOverrides: (next: DashboardFilter[]) => void
  let updateConfigCallback: (enabled: boolean) => void
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
    const [overrides, setOverrides] = useState(options.propFilters)
    const [configCallback, setConfigCallback] = useState(options.configCallback !== false)
    updateConfig = next => { currentConfig = next; setConfig(next) }
    updateOverrides = setOverrides
    updateConfigCallback = setConfigCallback
    return <AnalyticsDashboard
      config={hostConfig}
      dashboardFilters={overrides}
      editable={editable}
      onConfigChange={!configCallback ? undefined : next => {
        onConfigChange(next)
        if (options.acceptChanges !== false) updateConfig(next)
      }}
      onDashboardFiltersChange={options.propCallback ? (next, changedFilterId) => {
        onDashboardFiltersChange(next, changedFilterId)
        if (options.acceptChanges !== false) setOverrides(next)
      } : undefined}
      onSave={onSave}
      onDirtyStateChange={onDirtyStateChange}
    />
  }
  renderWithProviders(<Host />)
  return {
    queries, onSave, initialConfig, onConfigChange, onDashboardFiltersChange, onDirtyStateChange,
    setConfig: (next: DashboardConfig) => act(() => updateConfig(next)),
    setOverrides: (next: DashboardFilter[]) => act(() => updateOverrides(next)),
    setConfigCallback: (enabled: boolean) => act(() => updateConfigCallback(enabled)),
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

describe('public dashboard filter ownership', () => {
  it.each(['constructor', '__proto__'])('supports arbitrary filter ID %s', async id => {
    const user = userEvent.setup()
    const host = renderQueryDashboard(false, {
      configCallback: false, configFilters: [{ ...filters[0], id }, filters[1]]
    })
    await waitFor(() => expect(host.lastQuery('Employees.count')).toBeDefined())
    await user.click(screen.getAllByRole('button', { name: '30D' })[0])
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({
      timeDimensions: [{ dateRange: 'last 30 days' }]
    }))
    expect(screen.getAllByRole('button', { name: '30D' })[0]).toHaveAttribute('aria-pressed', 'true')
  })

  it('uses temporary viewer values in queries without changing or dirtying saved config', async () => {
    const user = userEvent.setup()
    const host = renderQueryDashboard(false, { configCallback: false })
    await waitFor(() => expect(host.lastQuery('Employees.count')).toBeDefined())
    await user.click(screen.getAllByRole('button', { name: '30D' })[0])
    await changeBoolean()
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({
      timeDimensions: [{ dateRange: 'last 30 days' }],
      filters: [{ member: 'Employees.isEnabled', values: [true, false] }]
    }))
    expect(screen.getAllByRole('button', { name: '30D' })[0]).toHaveAttribute('aria-pressed', 'true')
    expect(host.getConfig()).toEqual(host.initialConfig)
    expect(host.onConfigChange).not.toHaveBeenCalled()
    expect(host.onDirtyStateChange).not.toHaveBeenCalledWith(true)
    expect(host.onSave).not.toHaveBeenCalled()
  })

  it('routes changes per ID and sends only prop overrides to the new callback', async () => {
    const user = userEvent.setup()
    const override = { ...filters[0], label: 'Host period' }
    const host = renderQueryDashboard(false, { propFilters: [override], propCallback: true })
    await waitFor(() => expect(host.lastQuery('Employees.count')).toBeDefined())
    await user.click(screen.getAllByRole('button', { name: '30D' })[0])
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({
      timeDimensions: [{ dateRange: 'last 30 days' }]
    }))
    expect(host.onDashboardFiltersChange).toHaveBeenLastCalledWith([
      { ...override, filter: { ...override.filter, values: [], dateRange: 'last 30 days' } }
    ], 'period')
    expect(host.onConfigChange).not.toHaveBeenCalled()
    await changeBoolean()
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({
      timeDimensions: [{ dateRange: 'last 30 days' }],
      filters: [{ member: 'Employees.isEnabled', values: [true, false] }]
    }))
    expect(host.getConfig().filters?.[0]).toEqual(filters[0])
    expect(host.onDashboardFiltersChange).toHaveBeenCalledTimes(1)
  })

  it.each(['prop', 'config'] as const)('keeps rejected or pending %s selections off the bar and queries', async owner => {
    const user = userEvent.setup()
    const host = renderQueryDashboard(false, {
      ...(owner === 'prop' ? { propFilters: [filters[0]], propCallback: true } : {}),
      acceptChanges: false
    })
    await waitFor(() => expect(host.lastQuery('Employees.count')).toBeDefined())
    await user.click(screen.getAllByRole('button', { name: '30D' })[0])
    expect(owner === 'prop' ? host.onDashboardFiltersChange : host.onConfigChange).toHaveBeenCalledOnce()
    expect(screen.getAllByRole('button', { name: '30D' })[0]).toHaveAttribute('aria-pressed', 'false')
    expect(host.lastQuery('Employees.count')).toMatchObject({ timeDimensions: [{ dateRange: 'last 12 months' }] })
    if (owner === 'prop') host.setOverrides(host.onDashboardFiltersChange.mock.lastCall![0])
    else host.setConfig(host.onConfigChange.mock.lastCall![0])
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({
      timeDimensions: [{ dateRange: 'last 30 days' }]
    }))
    expect(screen.getAllByRole('button', { name: '30D' })[0]).toHaveAttribute('aria-pressed', 'true')
  })

  it('disables only host-owned controls without a callback on both layouts', async () => {
    const host = renderQueryDashboard(false, { propFilters: [filters[0]], configCallback: false })
    await waitFor(() => expect(host.lastQuery('Employees.count')).toBeDefined())
    for (const name of ['30D', 'Custom', 'XTD']) {
      for (const button of screen.getAllByRole('button', { name })) {
        expect(button).toBeDisabled()
        expect(button).toHaveAccessibleDescription('This filter is controlled by the host application.')
      }
    }
    await changeBoolean()
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({
      timeDimensions: [{ dateRange: 'last 12 months' }],
      filters: [{ values: [true, false] }]
    }))
  })

  it('keeps temporary values across layout changes and replaces their snapshot on a new pick', async () => {
    const user = userEvent.setup()
    const host = renderQueryDashboard(false, { configCallback: false })
    await waitFor(() => expect(host.lastQuery('Employees.count')).toBeDefined())
    await user.click(screen.getAllByRole('button', { name: '30D' })[0])
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({ timeDimensions: [{ dateRange: 'last 30 days' }] }))
    host.setConfig({ ...host.initialConfig,
      filters: filters.map(f => ({ ...f, filter: { ...f.filter } })),
      portlets: host.initialConfig.portlets.map(p => ({ ...p, title: `${p.title} renamed` }))
    })
    expect(screen.getAllByText('Mapped employees renamed')[0]).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '30D' })[0]).toHaveAttribute('aria-pressed', 'true')
    host.setConfig({ ...host.initialConfig, filters: filters.map(f => ({ ...f, label: `${f.label} renamed` })) })
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({ timeDimensions: [{ dateRange: 'last 12 months' }] }))
    expect(screen.getAllByRole('button', { name: '30D' })[0]).toHaveAttribute('aria-pressed', 'false')
    await user.click(screen.getAllByRole('button', { name: '30D' })[0])
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({ timeDimensions: [{ dateRange: 'last 30 days' }] }))
    host.setConfig({ ...host.initialConfig, filters: [
      { ...filters[0], filter: { ...filters[0].filter, values: ['last 7 days'] } }, filters[1]
    ] })
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({ timeDimensions: [{ dateRange: 'last 7 days' }] }))
    expect(screen.getAllByRole('button', { name: '30D' })[0]).toHaveAttribute('aria-pressed', 'false')
    host.setConfig(host.initialConfig)
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({ timeDimensions: [{ dateRange: 'last 12 months' }] }))
    expect(screen.getAllByRole('button', { name: '30D' })[0]).toHaveAttribute('aria-pressed', 'false')
  })

  it('lets a host override mask a temporary value until the override is removed', async () => {
    const user = userEvent.setup()
    const host = renderQueryDashboard(false, { configCallback: false })
    await waitFor(() => expect(host.lastQuery('Employees.count')).toBeDefined())
    await user.click(screen.getAllByRole('button', { name: '30D' })[0])
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({ timeDimensions: [{ dateRange: 'last 30 days' }] }))
    host.setOverrides([{ ...filters[0], filter: { ...filters[0].filter, values: ['last 7 days'] } }])
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({ timeDimensions: [{ dateRange: 'last 7 days' }] }))
    expect(screen.getAllByRole('button', { name: '30D' })[0]).toHaveAttribute('aria-pressed', 'false')
    host.setOverrides([])
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({ timeDimensions: [{ dateRange: 'last 30 days' }] }))
    expect(screen.getAllByRole('button', { name: '30D' })[0]).toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps prop-only filters out of saved config and applies host updates to their queries', async () => {
    const user = userEvent.setup()
    const host = renderQueryDashboard(false, { configFilters: [], propFilters: filters, propCallback: true })
    await waitFor(() => expect(host.lastQuery('Employees.count')).toBeDefined())
    await user.click(screen.getAllByRole('button', { name: '30D' })[0])
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({ timeDimensions: [{ dateRange: 'last 30 days' }] }))
    expect(host.onConfigChange).not.toHaveBeenCalled()
    expect(host.getConfig().filters).toEqual([])
    expect(host.onDashboardFiltersChange).toHaveBeenCalledWith([
      { ...filters[0], filter: { ...filters[0].filter, values: [], dateRange: 'last 30 days' } }, filters[1]
    ], 'period')
  })

  it('uses saved values while the host owns config changes and restores picks when it releases them', async () => {
    const user = userEvent.setup()
    const host = renderQueryDashboard(false, { configCallback: false })
    await waitFor(() => expect(host.lastQuery('Employees.count')).toBeDefined())
    await user.click(screen.getAllByRole('button', { name: '30D' })[0])
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({ timeDimensions: [{ dateRange: 'last 30 days' }] }))
    host.setConfigCallback(true)
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({ timeDimensions: [{ dateRange: 'last 12 months' }] }))
    expect(screen.getAllByRole('button', { name: '30D' })[0]).toHaveAttribute('aria-pressed', 'false')
    host.setConfigCallback(false)
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({ timeDimensions: [{ dateRange: 'last 30 days' }] }))
    expect(screen.getAllByRole('button', { name: '30D' })[0]).toHaveAttribute('aria-pressed', 'true')
    expect(host.onConfigChange).not.toHaveBeenCalled()
    expect(host.onSave).not.toHaveBeenCalled()
  })

  it('uses saved values while filters differ and restores picks when the original filters return', async () => {
    const user = userEvent.setup()
    const host = renderQueryDashboard(false, { configCallback: false, propFilters: [] })
    await waitFor(() => expect(host.lastQuery('Employees.count')).toBeDefined())
    await user.click(screen.getAllByRole('button', { name: '30D' })[0])
    await changeBoolean()
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({
      timeDimensions: [{ dateRange: 'last 30 days' }], filters: [{ values: [true, false] }]
    }))
    host.setConfig({ ...host.initialConfig, filters: [filters[1]] })
    expect(screen.queryByRole('button', { name: '30D' })).not.toBeInTheDocument()
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({ filters: [{ values: [true] }] }))
    host.setConfig({ ...host.initialConfig, filters: [filters[0], {
      ...filters[1], filter: { member: 'Employees.isActive', operator: 'notEquals', values: [true] }
    }] })
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({
      timeDimensions: [{ dateRange: 'last 12 months' }],
      filters: [{ member: 'Employees.isEnabled', operator: 'notEquals', values: [true] }]
    }))
    host.setConfig(host.initialConfig)
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({
      timeDimensions: [{ dateRange: 'last 30 days' }],
      filters: [{ member: 'Employees.isEnabled', operator: 'equals', values: [true, false] }]
    }))
    expect(screen.getAllByRole('button', { name: '30D' })[0]).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('button', { name: /Active.*in \(true, false\)/ })).toHaveLength(2)
  })

  it('makes a host-owned field chip read-only while keeping config-owned dates interactive', async () => {
    const user = userEvent.setup()
    const host = renderQueryDashboard(false, { propFilters: [filters[1]], configCallback: false })
    await waitFor(() => expect(host.lastQuery('Employees.count')).toBeDefined())
    for (const chip of screen.getAllByRole('button', { name: /Active.*true/ })) {
      expect(chip).toHaveAttribute('aria-disabled', 'true')
      expect(chip).toHaveAccessibleDescription('This filter is controlled by the host application.')
      await user.click(chip)
      expect(screen.queryByRole('button', { name: 'Select value...' })).not.toBeInTheDocument()
    }
    await user.click(screen.getAllByRole('button', { name: '30D' })[0])
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({
      timeDimensions: [{ dateRange: 'last 30 days' }], filters: [{ values: [true] }]
    }))
  })
})

describe('filter definition persistence', () => {
  it('saves a newly added definition for an onSave-only host', async () => {
    const user = userEvent.setup()
    const host = renderQueryDashboard(true, { configCallback: false, configFilters: [] })
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getAllByRole('button', { name: /Add date range filter/ })[0])

    await waitFor(() => expect(host.onSave).toHaveBeenCalledOnce())
    expect(host.onSave.mock.calls[0][0].filters).toEqual([expect.objectContaining({
      isUniversalTime: true, filter: { member: '__universal_time__', operator: 'inDateRange', values: ['last 30 days'] }
    })])
  })

  it('edits a saved default even when its viewer value is overridden', async () => {
    const user = userEvent.setup()
    const saved: DashboardFilter = {
      id: 'active', label: 'Name', filter: { member: 'Employees.name', operator: 'contains', values: ['east'] }
    }
    const host = renderQueryDashboard(true, {
      configFilters: [filters[0], saved], propCallback: true,
      propFilters: [{ ...saved, filter: { ...saved.filter, values: ['north'] } }]
    })
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getAllByRole('button', { name: 'Edit filter' })[1])
    const value = await screen.findByDisplayValue('east')
    await user.clear(value)
    await user.type(value, 'west')
    await user.click(screen.getByRole('button', { name: 'Done' }))

    await waitFor(() => expect(host.onSave).toHaveBeenCalledExactlyOnceWith({
      ...host.initialConfig, filters: [filters[0], { ...saved, filter: { ...saved.filter, values: ['west'] } }]
    }))
    expect(host.onConfigChange).toHaveBeenLastCalledWith(host.onSave.mock.calls[0][0])
    expect(host.onDashboardFiltersChange).not.toHaveBeenCalled()
  })

  it('saves a definition change when the host only supplies onSave', async () => {
    const user = userEvent.setup()
    const host = renderQueryDashboard(true, { configCallback: false })
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getAllByRole('button', { name: 'Remove filter' })[1])

    await waitFor(() => expect(host.onSave).toHaveBeenCalledExactlyOnceWith({
      ...host.initialConfig, filters: [filters[0]]
    }))
    expect(host.onDirtyStateChange).toHaveBeenCalledWith(true)
  })

  it('sends the same saved definitions to change and save without persisting host overrides', async () => {
    const user = userEvent.setup()
    const host = renderQueryDashboard(true, { propCallback: true, propFilters: [
      { ...filters[0], filter: { ...filters[0].filter, values: ['last 7 days'] } },
      { ...filters[1], id: 'host-only', label: 'Host-only' }
    ] })
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getAllByRole('button', { name: 'Remove filter' })[1])

    await waitFor(() => expect(host.onSave).toHaveBeenCalledExactlyOnceWith({
      ...host.initialConfig, filters: [filters[0]]
    }))
    expect(host.onConfigChange).toHaveBeenLastCalledWith(host.onSave.mock.calls[0][0])
    expect(host.onDashboardFiltersChange).not.toHaveBeenCalled()
    expect(screen.queryByText('Host-only')).not.toBeInTheDocument()
  })

  it('preserves saved defaults after temporary viewer changes', async () => {
    const user = userEvent.setup()
    const host = renderQueryDashboard(true, { configCallback: false })
    await user.click(screen.getAllByRole('button', { name: '30D' })[0])
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getAllByRole('button', { name: 'Remove filter' })[1])

    await waitFor(() => expect(host.onSave).toHaveBeenCalledExactlyOnceWith({
      ...host.initialConfig, filters: [filters[0]]
    }))
  })
})

describe('pending viewer input', () => {
  it.each(['prop', 'config'] as const)('keeps an unaccepted %s pick when another filter changes', async owner => {
    const user = userEvent.setup()
    const host = renderQueryDashboard(false, {
      ...(owner === 'prop' ? { propFilters: filters, propCallback: true } : {}),
      acceptChanges: false
    })
    await waitFor(() => expect(host.lastQuery('Employees.count')).toBeDefined())
    await user.click(screen.getAllByRole('button', { name: '30D' })[0])
    await changeBoolean()

    // A host that applies both requests in order ends with both picks.
    const callback = owner === 'prop' ? host.onDashboardFiltersChange : host.onConfigChange
    expect(callback).toHaveBeenCalledTimes(2)
    for (const [request] of callback.mock.calls) {
      if (owner === 'prop') host.setOverrides(request)
      else host.setConfig(request)
    }
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({
      timeDimensions: [{ dateRange: 'last 30 days' }],
      filters: [{ member: 'Employees.isEnabled', values: [true, false] }]
    }))
    expect(screen.getAllByRole('button', { name: '30D' })[0]).toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps a pending config pick when the host applies a later prop pick first', async () => {
    const user = userEvent.setup()
    const override = { ...filters[0], label: 'Host period' }
    const host = renderQueryDashboard(false, { propFilters: [override], propCallback: true, acceptChanges: false })
    await waitFor(() => expect(host.lastQuery('Employees.count')).toBeDefined())
    await changeBoolean()
    await user.click(screen.getAllByRole('button', { name: '30D' })[0])
    host.setOverrides(host.onDashboardFiltersChange.mock.lastCall![0])
    await user.click(screen.getAllByRole('button', { name: '7D' })[0])

    // Each pick goes only to the owner of the filter it changed.
    expect(host.onConfigChange).toHaveBeenCalledTimes(1)
    expect(host.onDashboardFiltersChange).toHaveBeenLastCalledWith([
      { ...override, filter: { ...override.filter, values: [], dateRange: 'last 7 days' } }
    ], 'period')
    host.setOverrides(host.onDashboardFiltersChange.mock.lastCall![0])
    host.setConfig(host.onConfigChange.mock.lastCall![0])
    await waitFor(() => expect(host.lastQuery('Employees.count')).toMatchObject({
      timeDimensions: [{ dateRange: 'last 7 days' }],
      filters: [{ member: 'Employees.isEnabled', values: [true, false] }]
    }))
  })

  it.each(['prop', 'config'] as const)('sends a deletion back to the accepted %s value', async owner => {
    const user = userEvent.setup()
    const name: DashboardFilter = {
      id: 'active', label: 'Name', filter: { member: 'Employees.name', operator: 'contains', values: ['a'] }
    }
    const host = renderQueryDashboard(false, {
      configFilters: [name],
      ...(owner === 'prop' ? { propFilters: [name], propCallback: true } : {}),
      acceptChanges: false
    })
    await user.click(screen.getAllByText('Name')[0])
    await user.type(screen.getByRole('textbox'), 'b{Backspace}')

    const requested = owner === 'prop'
      ? host.onDashboardFiltersChange.mock.calls.map(([next]) => next[0].filter.values)
      : host.onConfigChange.mock.calls.map(([next]) => next.filters[0].filter.values)
    expect(requested).toEqual([['ab'], ['a']])
    for (const [request] of (owner === 'prop' ? host.onDashboardFiltersChange : host.onConfigChange).mock.calls) {
      if (owner === 'prop') host.setOverrides(request)
      else host.setConfig(request)
    }
    expect(screen.getByRole('textbox')).toHaveValue('a')
    expect(screen.getAllByRole('button', { name: /Name/ })[0]).not.toHaveTextContent('ab')
  })

  it('preserves a newer deletion through delayed acknowledgements of repeated values', async () => {
    const user = userEvent.setup()
    const host = renderQueryDashboard(false, { acceptChanges: false, configFilters: [{
      id: 'active', label: 'Name', filter: { member: 'Employees.name', operator: 'contains', values: [] }
    }] })
    await user.click(screen.getAllByText('Name')[0])
    await user.type(screen.getByRole('textbox'), 'ab{Backspace}')
    expect(screen.getByRole('textbox')).toHaveValue('a')

    for (const [request] of host.onConfigChange.mock.calls) {
      host.setConfig(request)
      expect(screen.getByRole('textbox')).toHaveValue('a')
    }
  })

  it.each([
    { label: 'Name', member: 'Employees.name', operator: 'contains' as const, text: 'north', value: 'north', reset: 'south', role: 'textbox' },
    { label: 'Salary', member: 'Employees.salary', operator: 'gt' as const, text: '123', value: 123, reset: 456, role: 'spinbutton' }
  ])('keeps a $label draft until accepted, reset, or closed', async ({ label, member, operator, text, value, reset, role }) => {
    const user = userEvent.setup()
    const filter: DashboardFilter = { id: 'active', label, filter: { member, operator, values: [] } }
    const host = renderQueryDashboard(false, { configFilters: [filter], acceptChanges: false })
    await waitFor(() => expect(host.lastQuery('Employees.count')).toBeDefined())
    const initialQuery = host.lastQuery('Employees.count')
    await user.click(screen.getAllByText(label)[0])
    await user.type(screen.getByRole(role), text)

    expect(screen.getByRole(role)).toHaveValue(value)
    const request: DashboardConfig = host.onConfigChange.mock.calls.at(-1)?.[0]
    expect(request.filters?.[0].filter).toMatchObject({ values: [value] })
    expect(host.lastQuery('Employees.count')).toEqual(initialQuery)
    expect(screen.getAllByRole('button', { name: new RegExp(label) })[0]).not.toHaveTextContent(text)

    // A delayed acknowledgement of the first keystroke must preserve the newer draft.
    host.setConfig(host.onConfigChange.mock.calls[0][0])
    expect(screen.getByRole(role)).toHaveValue(value)
    host.setConfig(request)
    expect(screen.getByRole(role)).toHaveValue(value)
    // A host value the viewer never requested replaces pending input.
    await user.type(screen.getByRole(role), text)
    host.setConfig({ ...host.initialConfig, filters: [{ ...filter, filter: { ...filter.filter, values: [reset] } }] })
    expect(screen.getByRole(role)).toHaveValue(reset)
    host.setConfig(host.initialConfig)
    expect(screen.getByRole(role)).toHaveValue(role === 'textbox' ? '' : null)
    await user.type(screen.getByRole(role), text)
    await user.click(screen.getByRole('button', { name: 'Close' }))
    await user.click(screen.getAllByText(label)[0])
    expect(screen.getByRole(role)).toHaveValue(role === 'textbox' ? '' : null)
  })
})
