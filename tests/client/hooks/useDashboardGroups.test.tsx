/**
 * Integration tests for portlet groups ("combination portlets") driven through
 * the public useDashboard hook - snap, ungroup, delete, duplicate and the
 * round-trip through onConfigChange that a host would persist.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CubeProvider } from '../../../src/client/providers/CubeProvider'
import { DashboardStoreProvider } from '../../../src/client/stores/dashboardStore'
import { useDashboard } from '../../../src/client/hooks/useDashboardHook'
import type {
  DashboardConfig,
  DashboardGridSettings,
  PortletConfig,
} from '../../../src/client/types'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <CubeProvider
        apiOptions={{ apiUrl: '/api/cubejs-api/v1' }}
        queryClient={queryClient}
        enableBatching={false}
      >
        <DashboardStoreProvider>{children}</DashboardStoreProvider>
      </CubeProvider>
    </QueryClientProvider>
  )
}

const GRID: DashboardGridSettings = { cols: 12, rowHeight: 80, minW: 2, minH: 2 }

function kpi(id: string, x: number): PortletConfig {
  return {
    id,
    title: `KPI ${id}`,
    query: JSON.stringify({ measures: ['Employees.count'] }),
    chartType: 'kpiNumber',
    w: 3,
    h: 3,
    x,
    y: 0,
  }
}

/** Four KPIs across one row - the canonical "KPI strip" starting point. */
function baseConfig(): DashboardConfig {
  return {
    layoutMode: 'rows',
    portlets: [kpi('a', 0), kpi('b', 3), kpi('c', 6), kpi('d', 9)],
    rows: [
      {
        id: 'row-1',
        h: 3,
        columns: [
          { portletId: 'a', w: 3 },
          { portletId: 'b', w: 3 },
          { portletId: 'c', w: 3 },
          { portletId: 'd', w: 3 },
        ],
      },
    ],
  }
}

/**
 * Drives the hook the way a host does: config is a prop, and every mutation
 * arrives back through onConfigChange, which we feed into the next render.
 */
function setup(initial: DashboardConfig = baseConfig()) {
  let config = initial
  const onSave = vi.fn()
  const onConfigChange = vi.fn((next: DashboardConfig) => {
    config = next
  })

  const rendered = renderHook(
    (props: { config: DashboardConfig }) =>
      useDashboard({
        config: props.config,
        editable: true,
        gridSettings: GRID,
        allowedModes: ['rows'],
        onConfigChange,
        onSave,
      }),
    { wrapper: createWrapper(), initialProps: { config: initial } }
  )

  const flush = async () => {
    await act(async () => {
      rendered.rerender({ config })
    })
  }

  return { rendered, onSave, onConfigChange, flush, latest: () => config }
}

describe('portlet groups via useDashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('snapping one portlet onto another creates a group and collapses two columns into one', async () => {
    const { rendered, flush, latest } = setup()

    await act(async () => {
      rendered.result.current.actions.enterEditMode()
      await rendered.result.current.actions.snapPortletIntoGroup('b', 'a', 'right')
    })
    await flush()

    const config = latest()
    expect(config.groups).toHaveLength(1)

    const group = config.groups![0]
    expect(group.direction).toBe('row')
    expect(group.cells.map(cell => cell.portletIds)).toEqual([['a'], ['b']])

    // The row keeps c and d as their own columns; a and b now share one.
    expect(config.rows![0].columns).toHaveLength(3)
    expect(config.rows![0].columns[0].groupId).toBe(group.id)
    expect(config.rows![0].columns.map(col => col.portletId)).toEqual([
      undefined,
      'c',
      'd',
    ])
    // Widths still fill the grid.
    expect(config.rows![0].columns.reduce((sum, col) => sum + col.w, 0)).toBe(12)
  })

  it('every grouped child still gets real x/y/w/h so grid mode and mobile keep working', async () => {
    const { rendered, flush, latest } = setup()

    await act(async () => {
      rendered.result.current.actions.enterEditMode()
      await rendered.result.current.actions.snapPortletIntoGroup('b', 'a', 'right')
    })
    await flush()

    const byId = new Map(latest().portlets.map(p => [p.id, p]))
    const a = byId.get('a')!
    const b = byId.get('b')!

    expect(a.w).toBeGreaterThan(0)
    expect(b.w).toBeGreaterThan(0)
    // Side by side, not overlapping.
    expect(b.x).toBe(a.x + a.w)
    expect(a.y).toBe(b.y)
  })

  it('builds the 1:2 shape - a perpendicular snap joins the target stack rather than nesting', async () => {
    const { rendered, flush, latest } = setup()

    await act(async () => {
      rendered.result.current.actions.enterEditMode()
      await rendered.result.current.actions.snapPortletIntoGroup('b', 'a', 'right')
    })
    await flush()

    await act(async () => {
      await rendered.result.current.actions.snapPortletIntoGroup('c', 'b', 'bottom')
    })
    await flush()

    const group = latest().groups![0]
    expect(group.direction).toBe('row')
    expect(group.cells).toHaveLength(2)
    expect(group.cells.map(cell => cell.portletIds)).toEqual([['a'], ['b', 'c']])
  })

  it('ungrouping restores one column per member', async () => {
    const { rendered, flush, latest } = setup()

    await act(async () => {
      rendered.result.current.actions.enterEditMode()
      await rendered.result.current.actions.snapPortletIntoGroup('b', 'a', 'right')
    })
    await flush()

    await act(async () => {
      await rendered.result.current.actions.ungroupGroup(latest().groups![0].id)
    })
    await flush()

    const config = latest()
    expect(config.groups).toEqual([])
    expect(config.rows![0].columns.map(col => col.portletId)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('deleting the second-to-last member dissolves the group back into a plain column', async () => {
    const { rendered, flush, latest } = setup()

    await act(async () => {
      rendered.result.current.actions.enterEditMode()
      await rendered.result.current.actions.snapPortletIntoGroup('b', 'a', 'right')
    })
    await flush()

    await act(async () => {
      await rendered.result.current.actions.deletePortlet('b')
      await rendered.result.current.actions.confirmDelete()
    })
    await flush()

    const config = latest()
    expect(config.portlets.map(p => p.id)).toEqual(['a', 'c', 'd'])
    expect(config.groups).toEqual([])
    expect(config.rows![0].columns.map(col => col.portletId)).toEqual(['a', 'c', 'd'])
  })

  it('deleting a group removes the group and every portlet inside it', async () => {
    const { rendered, flush, latest } = setup()

    await act(async () => {
      rendered.result.current.actions.enterEditMode()
      await rendered.result.current.actions.snapPortletIntoGroup('b', 'a', 'right')
    })
    await flush()

    await act(async () => {
      rendered.result.current.actions.deleteGroup(latest().groups![0].id)
    })
    await act(async () => {
      await rendered.result.current.actions.confirmDelete()
    })
    await flush()

    const config = latest()
    expect(config.portlets.map(p => p.id)).toEqual(['c', 'd'])
    expect(config.groups).toEqual([])
  })

  it('duplicating a grouped portlet extends its group instead of appending a new row', async () => {
    const { rendered, flush, latest } = setup()

    await act(async () => {
      rendered.result.current.actions.enterEditMode()
      await rendered.result.current.actions.snapPortletIntoGroup('b', 'a', 'right')
    })
    await flush()

    await act(async () => {
      await rendered.result.current.actions.duplicatePortlet('b')
    })
    await flush()

    const config = latest()
    expect(config.rows).toHaveLength(1)
    expect(config.portlets).toHaveLength(5)

    const group = config.groups![0]
    const stacked = group.cells.flatMap(cell => cell.portletIds)
    expect(stacked).toHaveLength(3)
    // The clone sits next to the original, not at the end of the dashboard.
    expect(stacked.indexOf('b')).toBeLessThan(stacked.length - 1)
  })

  it('renames a group and clears the title when set to blank', async () => {
    const { rendered, flush, latest } = setup()

    await act(async () => {
      rendered.result.current.actions.enterEditMode()
      await rendered.result.current.actions.snapPortletIntoGroup('b', 'a', 'right')
    })
    await flush()

    const groupId = latest().groups![0].id

    await act(async () => {
      await rendered.result.current.actions.renameGroup(groupId, 'Revenue KPIs')
    })
    await flush()
    expect(latest().groups![0].title).toBe('Revenue KPIs')

    await act(async () => {
      await rendered.result.current.actions.renameGroup(groupId, '   ')
    })
    await flush()
    expect(latest().groups![0].title).toBeUndefined()
  })

  it('persists groups through a save/reload round trip', async () => {
    const { rendered, onSave, flush, latest } = setup()

    await act(async () => {
      rendered.result.current.actions.enterEditMode()
      await rendered.result.current.actions.snapPortletIntoGroup('b', 'a', 'right')
    })
    await flush()

    expect(onSave).toHaveBeenCalled()
    const saved = onSave.mock.calls.at(-1)![0] as DashboardConfig
    expect(saved.groups).toEqual(latest().groups)

    // Reload from exactly what the host stored.
    const reloaded = setup(JSON.parse(JSON.stringify(saved)) as DashboardConfig)
    expect(reloaded.rendered.result.current.resolvedGroups).toHaveLength(1)
    expect(reloaded.rendered.result.current.resolvedRows[0].columns).toHaveLength(3)
  })

  it('withholds the grid option while a group exists, and restores it after ungrouping', async () => {
    let config = baseConfig()
    const onConfigChange = vi.fn((next: DashboardConfig) => {
      config = next
    })

    const rendered = renderHook(
      (props: { config: DashboardConfig }) =>
        useDashboard({
          config: props.config,
          editable: true,
          gridSettings: GRID,
          allowedModes: ['rows', 'grid'],
          onConfigChange,
          onSave: vi.fn(),
        }),
      { wrapper: createWrapper(), initialProps: { config } }
    )
    const flush = async () => { await act(async () => { rendered.rerender({ config }) }) }

    await act(async () => { rendered.result.current.actions.enterEditMode() })
    await flush()
    expect(rendered.result.current.selectableModes).toEqual(['rows', 'grid'])

    await act(async () => {
      await rendered.result.current.actions.snapPortletIntoGroup('b', 'a', 'right')
    })
    await flush()

    // Grid renders grouped portlets flat and lets you drag them, but rows mode
    // reads rows/groups rather than x/y - so that work would be discarded.
    expect(rendered.result.current.selectableModes).toEqual(['rows'])
    expect(rendered.result.current.canChangeLayoutMode).toBe(false)

    await act(async () => {
      await rendered.result.current.actions.handleLayoutModeChange('grid')
    })
    await flush()

    expect(rendered.result.current.layoutMode).toBe('rows')
    expect(config.groups).toHaveLength(1)
    expect(config.portlets.map(p => p.id).sort()).toEqual(['a', 'b', 'c', 'd'])

    await act(async () => {
      await rendered.result.current.actions.ungroupGroup(config.groups![0].id)
    })
    await flush()

    expect(rendered.result.current.selectableModes).toEqual(['rows', 'grid'])
    expect(rendered.result.current.canChangeLayoutMode).toBe(true)
  })

  it('switching grid -> rows keeps groups and their rows intact', async () => {
    // Reaching grid with groups is only possible from a stored config, but the
    // switch back must still thread groups through normalizeRows - omitting
    // them dropped every group column and deleted the row that held it.
    const stored: DashboardConfig = {
      ...baseConfig(),
      layoutMode: 'grid',
      rows: [
        {
          id: 'row-1',
          h: 3,
          columns: [
            { groupId: 'grp-1', w: 6 },
            { portletId: 'c', w: 3 },
            { portletId: 'd', w: 3 },
          ],
        },
      ],
      groups: [
        {
          id: 'grp-1',
          direction: 'row',
          cells: [
            { portletIds: ['a'] },
            { portletIds: ['b'] },
          ],
        },
      ],
    }

    let config = stored
    const onConfigChange = vi.fn((next: DashboardConfig) => {
      config = next
    })

    const rendered = renderHook(
      (props: { config: DashboardConfig }) =>
        useDashboard({
          config: props.config,
          editable: true,
          gridSettings: GRID,
          allowedModes: ['rows', 'grid'],
          onConfigChange,
          onSave: vi.fn(),
        }),
      { wrapper: createWrapper(), initialProps: { config } }
    )

    // Separate acts: canChangeLayoutMode only becomes true once edit mode has
    // committed, and handleLayoutModeChange is a no-op until then.
    await act(async () => { rendered.result.current.actions.enterEditMode() })
    await act(async () => { rendered.rerender({ config }) })
    await act(async () => {
      await rendered.result.current.actions.handleLayoutModeChange('rows')
    })
    await act(async () => { rendered.rerender({ config }) })

    expect(rendered.result.current.layoutMode).toBe('rows')
    expect(config.portlets.map(p => p.id).sort()).toEqual(['a', 'b', 'c', 'd'])
    expect(config.groups!.map(g => g.id)).toEqual(['grp-1'])
    expect(config.rows).toHaveLength(1)
    expect(config.rows![0].columns.some(col => col.groupId === 'grp-1')).toBe(true)
    expect(rendered.result.current.resolvedGroups[0].cells.map(c => c.portletIds)).toEqual([
      ['a'],
      ['b'],
    ])
  })

  it('a group referenced by no row column is dissolved rather than hiding its portlets', () => {
    const orphaned: DashboardConfig = {
      layoutMode: 'rows',
      portlets: [kpi('a', 0), kpi('b', 3)],
      rows: [{ id: 'row-1', h: 3, columns: [{ portletId: 'a', w: 12 }] }],
      groups: [
        { id: 'group-orphan', direction: 'row', cells: [{ portletIds: ['b'] }] },
      ],
    }

    const { rendered } = setup(orphaned)

    expect(rendered.result.current.resolvedGroups).toEqual([])
    const placed = rendered.result.current.resolvedRows.flatMap(row =>
      row.columns.map(col => col.portletId)
    )
    expect(placed).toContain('a')
    expect(placed).toContain('b')
  })
})
