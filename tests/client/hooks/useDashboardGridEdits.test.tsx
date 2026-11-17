/**
 * Grid edits and the stored row layout, driven through the public useDashboard
 * hook the way a host drives it: config is a prop, and every change comes back
 * through onConfigChange.
 *
 * A grid edit changes only portlet x/y/w/h. Rows mode reads `rows` and `groups`
 * when the config has them, so a card that grid mode added must not be missing
 * from the next rows view.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CubeProvider } from '../../../src/client/providers/CubeProvider'
import { DashboardStoreProvider } from '../../../src/client/stores/dashboardStore'
import { useDashboard } from '../../../src/client/hooks/useDashboardHook'
import type {
  DashboardConfig,
  DashboardGridSettings,
  DashboardLayoutMode,
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

function chart(id: string, x: number, y: number, w: number, h: number): PortletConfig {
  return {
    id,
    title: `Chart ${id}`,
    query: JSON.stringify({ measures: ['Employees.count'] }),
    chartType: 'bar',
    x,
    y,
    w,
    h,
  }
}

/**
 * A grid dashboard as a rows -> grid switch stores it: the rows still match
 * the grid positions.
 */
function gridConfig(): DashboardConfig {
  return {
    layoutMode: 'grid',
    portlets: [chart('a', 0, 0, 3, 4), chart('b', 3, 0, 9, 4)],
    rows: [
      {
        id: 'row-1',
        h: 4,
        columns: [
          { portletId: 'a', w: 3 },
          { portletId: 'b', w: 9 },
        ],
      },
    ],
    groups: [],
  }
}

function setup(initial: DashboardConfig, allowedModes: DashboardLayoutMode[] = ['rows', 'grid']) {
  let config = initial
  const onConfigChange = vi.fn((next: DashboardConfig) => {
    config = next
  })

  const rendered = renderHook(
    (props: { config: DashboardConfig }) =>
      useDashboard({
        config: props.config,
        editable: true,
        gridSettings: GRID,
        allowedModes,
        onConfigChange,
        onSave: vi.fn(),
      }),
    { wrapper: createWrapper(), initialProps: { config: initial } }
  )

  const flush = async () => {
    await act(async () => {
      rendered.rerender({ config })
    })
  }

  // canChangeLayoutMode becomes true only after edit mode commits.
  const enterEditMode = async () => {
    await act(async () => {
      rendered.result.current.actions.enterEditMode()
    })
    await flush()
  }

  const switchLayoutMode = async (mode: DashboardLayoutMode) => {
    await act(async () => {
      await rendered.result.current.actions.handleLayoutModeChange(mode)
    })
    await flush()
  }

  return { rendered, flush, enterEditMode, switchLayoutMode, latest: () => config }
}

describe('grid edits and the stored row layout', () => {
  it('should show a portlet added in grid mode after a switch to rows', async () => {
    const { rendered, flush, enterEditMode, switchLayoutMode, latest } = setup(gridConfig())
    await enterEditMode()

    await act(async () => {
      await rendered.result.current.actions.savePortlet({
        title: 'Added in grid',
        query: JSON.stringify({ measures: ['Employees.count'] }),
        chartType: 'bar',
        w: 6,
        h: 3,
      })
    })
    await flush()
    const addedId = latest().portlets[2].id

    await switchLayoutMode('rows')

    expect(rendered.result.current.resolvedRows.map((row) => row.columns)).toEqual([
      [
        { portletId: 'a', w: 3 },
        { portletId: 'b', w: 9 },
      ],
      [{ portletId: addedId, w: 12 }],
    ])
  })

  it('should save a grid add without rows or groups', async () => {
    const { rendered, flush, enterEditMode, latest } = setup(gridConfig())
    await enterEditMode()

    await act(async () => {
      await rendered.result.current.actions.savePortlet({
        title: 'Added in grid',
        query: JSON.stringify({ measures: ['Employees.count'] }),
        chartType: 'bar',
        w: 6,
        h: 3,
      })
    })
    await flush()

    expect(latest()).toStrictEqual({
      layoutMode: 'grid',
      portlets: [
        chart('a', 0, 0, 3, 4),
        chart('b', 3, 0, 9, 4),
        {
          id: latest().portlets[2].id,
          title: 'Added in grid',
          query: JSON.stringify({ measures: ['Employees.count'] }),
          chartType: 'bar',
          x: 0,
          y: 4,
          w: 6,
          h: 3,
        },
      ],
    })
  })

  it('should save a grid duplicate without rows or groups', async () => {
    const { rendered, flush, enterEditMode, latest } = setup(gridConfig())
    await enterEditMode()

    await act(async () => {
      await rendered.result.current.actions.duplicatePortlet('a')
    })
    await flush()

    expect(latest()).toStrictEqual({
      layoutMode: 'grid',
      portlets: [
        chart('a', 0, 0, 3, 4),
        chart('b', 3, 0, 9, 4),
        { ...chart('a', 0, 4, 3, 4), id: latest().portlets[2].id, title: 'Chart a Duplicated' },
      ],
    })
  })

  it('should save a grid delete without rows or groups', async () => {
    const { rendered, flush, enterEditMode, latest } = setup({
      ...gridConfig(),
      groups: [{ id: 'group-1', direction: 'row', cells: [{ portletIds: ['b'] }] }],
    })
    await enterEditMode()

    await act(async () => {
      await rendered.result.current.actions.deletePortlet('a')
    })
    await act(async () => {
      await rendered.result.current.actions.confirmDelete()
    })
    await flush()

    expect(latest()).toStrictEqual({
      layoutMode: 'grid',
      portlets: [chart('b', 3, 0, 9, 4)],
    })
  })

  it('should keep the rows when a grid edit changes only the content of a portlet', async () => {
    const { rendered, flush, enterEditMode, latest } = setup(gridConfig())
    await enterEditMode()

    act(() => {
      rendered.result.current.actions.openEditPortlet(chart('a', 0, 0, 3, 4))
    })
    await act(async () => {
      await rendered.result.current.actions.savePortlet({ ...chart('a', 0, 0, 3, 4), title: 'Renamed' })
    })
    await flush()

    expect(latest()).toStrictEqual({
      ...gridConfig(),
      portlets: [{ ...chart('a', 0, 0, 3, 4), title: 'Renamed' }, chart('b', 3, 0, 9, 4)],
    })
  })

  it('should keep the portlet widths when it switches a grid dashboard without rows to rows', async () => {
    const { enterEditMode, switchLayoutMode, latest } = setup({
      layoutMode: 'grid',
      portlets: [chart('a', 0, 0, 3, 4), chart('b', 3, 0, 9, 4)],
    })
    await enterEditMode()

    await switchLayoutMode('rows')

    expect(latest()).toStrictEqual({
      layoutMode: 'rows',
      portlets: [chart('a', 0, 0, 3, 4), chart('b', 3, 0, 9, 4)],
      rows: [
        {
          id: 'row-0',
          h: 4,
          columns: [
            { portletId: 'a', w: 3 },
            { portletId: 'b', w: 9 },
          ],
        },
      ],
      groups: [],
    })
  })

  it('should show every portlet when a rows-only host loads a grid config with stale rows', () => {
    const { rendered } = setup(
      {
        ...gridConfig(),
        portlets: [chart('a', 0, 0, 3, 4), chart('b', 3, 0, 9, 4), chart('c', 0, 4, 12, 3)],
      },
      ['rows']
    )

    expect(rendered.result.current.layoutMode).toBe('rows')
    expect(rendered.result.current.resolvedRows).toEqual([
      {
        id: 'row-1',
        h: 4,
        columns: [
          { portletId: 'a', w: 3 },
          { portletId: 'b', w: 9 },
        ],
      },
      { id: 'row-4', h: 3, columns: [{ portletId: 'c', w: 12 }] },
    ])
  })

  it('should place a portlet added to an empty rows dashboard in one column only', async () => {
    const { rendered, flush, enterEditMode, latest } = setup(
      { layoutMode: 'rows', portlets: [], rows: [] },
      ['rows']
    )
    await enterEditMode()

    await act(async () => {
      await rendered.result.current.actions.savePortlet({
        title: 'First',
        query: JSON.stringify({ measures: ['Employees.count'] }),
        chartType: 'bar',
        w: 6,
        h: 3,
      })
    })
    await flush()
    const addedId = latest().portlets[0].id

    expect(rendered.result.current.resolvedRows.flatMap((row) => row.columns)).toEqual([
      { portletId: addedId, w: 12 },
    ])
  })
})
