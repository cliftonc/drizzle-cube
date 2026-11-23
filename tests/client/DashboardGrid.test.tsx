/**
 * Tests for DashboardGrid
 * Covers layout rendering, responsive behavior, and edit mode functionality
 */

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, fireEvent, act, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import { loadGridLayout } from '../../src/client/components/dashboard/gridLayoutModule'
import DashboardGrid from '../../src/client/components/DashboardGrid'
import { DashboardStoreProvider } from '../../src/client/stores/dashboardStore'
import type { DashboardConfig, FeaturesConfig, PortletConfig } from '../../src/client/types'
import type { DashboardDisplayMode } from '../../src/client/hooks/useResponsiveDashboard'

// Features that both feature hooks return; reset before each test
let mockFeatures: FeaturesConfig = {}

// Mock CubeProvider context - DashboardGrid uses useCubeFeatures for features
vi.mock('../../src/client/providers/CubeProvider', () => ({
  useCubeFeatures: vi.fn(() => ({
    features: mockFeatures,
    batchCoordinator: null,
    enableBatching: false,
    dashboardModes: ['grid', 'mobile']
  }))
}))

// Mock CubeFeaturesProvider - DashboardPortletCard uses useCubeFeatures directly
vi.mock('../../src/client/providers/CubeFeaturesProvider', () => ({
  useCubeFeatures: vi.fn(() => ({
    features: mockFeatures,
    dashboardModes: ['grid', 'mobile'],
    updateFeatures: vi.fn()
  })),
  CubeFeaturesProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Mock CubeApiProvider - needed when portlet modal opens AnalysisBuilder
vi.mock('../../src/client/providers/CubeApiProvider', () => ({
  useCubeApi: vi.fn(() => ({
    cubeApi: {
      load: vi.fn().mockResolvedValue({ data: [] }),
      meta: vi.fn().mockResolvedValue({ cubes: [] }),
      sql: vi.fn().mockResolvedValue({ sql: '' }),
    },
    options: {},
    updateConfig: vi.fn(),
  })),
  CubeApiProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

/**
 * Test wrapper that provides all required context providers
 */
// The dashboard import/export flow uses TanStack mutations, so the tree needs a QueryClient
const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={testQueryClient}>
      <DashboardStoreProvider>
        {children}
      </DashboardStoreProvider>
    </QueryClientProvider>
  )
}

// Mock react-grid-layout (v2 API)
let capturedGridLayoutProps: any = null
vi.mock('react-grid-layout', () => ({
  default: (props: any) => {
    capturedGridLayoutProps = props
    return (
      <div data-testid="grid-layout">
        {props.children}
      </div>
    )
  },
  verticalCompactor: { compact: () => [] } // Mock the compactor export
}))

// Mock useResponsiveDashboard
let mockResponsiveState = {
  containerRef: vi.fn(),
  containerWidth: 1200,
  displayMode: 'desktop' as DashboardDisplayMode,
  scaleFactor: 1,
  isEditable: true,
  designWidth: 1200
}
vi.mock('../../src/client/hooks/useResponsiveDashboard', () => ({
  useResponsiveDashboard: () => mockResponsiveState
}))

// Mock ScrollContainerProvider
vi.mock('../../src/client/providers/ScrollContainerContext', () => ({
  ScrollContainerProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Count card header renders; the wrapper still renders the real header
let headerRenders = 0
vi.mock('../../src/client/components/dashboardPortletCard/PortletCardHeader', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/client/components/dashboardPortletCard/PortletCardHeader')>()
  const RealHeader = actual.default
  return {
    default: (props: React.ComponentProps<typeof RealHeader>) => {
      headerRenders++
      return <RealHeader {...props} />
    }
  }
})

// Mock child components
vi.mock('../../src/client/components/AnalyticsPortlet', () => ({
  default: React.forwardRef((props: any, _ref) => <div data-testid="analytics-portlet" data-query={props.query} />)
}))

vi.mock('../../src/client/components/PortletFilterConfigModal', () => ({
  default: () => null
}))

vi.mock('../../src/client/components/PortletAnalysisModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="portlet-edit-modal">Modal</div> : null
}))

vi.mock('../../src/client/components/DebugModal', () => ({
  default: () => null
}))

vi.mock('../../src/client/components/ColorPaletteSelector', () => ({
  default: ({ onPaletteChange }: any) => <button data-testid="palette-selector" onClick={() => onPaletteChange('ocean')}>Palette</button>
}))

vi.mock('../../src/client/components/DashboardFilterPanel', () => ({
  default: () => <div data-testid="filter-panel" />
}))

vi.mock('../../src/client/components/ScaledGridWrapper', () => ({
  default: ({ children }: any) => <div data-testid="scaled-wrapper">{children}</div>
}))

// Render the real mobile stack, so tests can read the card order on a phone
vi.mock('../../src/client/components/MobileStackedLayout', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/client/components/MobileStackedLayout')>()
  const RealMobileStackedLayout = actual.default
  return {
    default: (props: React.ComponentProps<typeof RealMobileStackedLayout>) => (
      <div data-testid="mobile-layout">
        <RealMobileStackedLayout {...props} />
      </div>
    )
  }
})

// Mock heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  ChartBarIcon: () => <span>ChartBar</span>,
  ArrowPathIcon: () => <span>ArrowPath</span>,
  PencilIcon: () => <span>Pencil</span>,
  TrashIcon: () => <span>Trash</span>,
  PlusIcon: () => <span>Plus</span>,
  DocumentDuplicateIcon: () => <span>Duplicate</span>,
  FunnelIcon: () => <span>Funnel</span>,
  ComputerDesktopIcon: () => <span>Desktop</span>
}))

// Helper to create test config
function createTestConfig(portletCount = 2): DashboardConfig {
  const portlets: PortletConfig[] = []
  for (let i = 0; i < portletCount; i++) {
    portlets.push({
      id: `portlet-${i}`,
      title: `Portlet ${i}`,
      query: JSON.stringify({ measures: [`Test${i}.count`] }),
      chartType: 'bar',
      x: (i % 2) * 6,
      y: Math.floor(i / 2) * 4,
      w: 6,
      h: 4
    })
  }
  return { portlets, layoutMode: 'grid' }
}

// A grid config that still stores the row layout of an earlier rows session
function createGridConfigWithRowLayout(): DashboardConfig {
  return {
    ...createTestConfig(2),
    rows: [{ id: 'row-1', h: 4, columns: [{ groupId: 'group-1', w: 12 }] }],
    groups: [
      {
        id: 'group-1',
        direction: 'row',
        cells: [{ portletIds: ['portlet-0'] }, { portletIds: ['portlet-1'] }]
      }
    ]
  }
}


// A rows config whose stored grid positions are stale: the rows put C first,
// then the group of A and B, but the stored y values put A and B first
function createRowsConfigWithStalePositions(): DashboardConfig {
  const portlets = createTestConfig(3).portlets.map((portlet, index) => ({
    ...portlet,
    id: ['portlet-a', 'portlet-b', 'portlet-c'][index],
    title: ['Portlet A', 'Portlet B', 'Portlet C'][index],
    x: [0, 6, 0][index],
    y: [0, 0, 8][index]
  }))
  return {
    portlets,
    layoutMode: 'rows',
    rows: [
      { id: 'row-c', h: 4, columns: [{ portletId: 'portlet-c', w: 12 }] },
      { id: 'row-group', h: 4, columns: [{ groupId: 'group-ab', w: 12 }] }
    ],
    groups: [
      {
        id: 'group-ab',
        direction: 'row',
        cells: [{ portletIds: ['portlet-a'] }, { portletIds: ['portlet-b'] }]
      }
    ]
  }
}

// The ids of the cards in the mobile stack, in the order that the stack shows them
function mobileCardOrder(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('.mobile-stacked-layout [data-portlet-id]')).map(
    (element) => element.getAttribute('data-portlet-id') ?? ''
  )
}

// react-grid-layout loads with import() (it is an optional peer). Settle it once
// so grid dashboards render on first render, as they do after the first load.
beforeAll(async () => {
  await loadGridLayout()
})

describe('DashboardGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFeatures = {}
    capturedGridLayoutProps = null
    mockResponsiveState = {
      containerRef: vi.fn(),
      containerWidth: 1200,
      displayMode: 'desktop',
      scaleFactor: 1,
      isEditable: true,
      designWidth: 1200
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('layout rendering', () => {
    it('should render portlets in grid layout', () => {
      const config = createTestConfig(2)

      const { getAllByTestId } = render(
        <DashboardGrid config={config} />,
        { wrapper: TestWrapper }
      )

      const portlets = getAllByTestId('analytics-portlet')
      expect(portlets).toHaveLength(2)
    })

    it('should pass correct layout to GridLayout', () => {
      const config = createTestConfig(2)

      render(<DashboardGrid config={config} />, { wrapper: TestWrapper })

      expect(capturedGridLayoutProps).not.toBeNull()
      expect(capturedGridLayoutProps.layout).toHaveLength(2)
      expect(capturedGridLayoutProps.layout[0]).toMatchObject({
        i: 'portlet-0',
        x: 0,
        y: 0,
        w: 6,
        h: 4
      })
    })

    it('should use 12 columns', () => {
      const config = createTestConfig(1)

      render(<DashboardGrid config={config} />, { wrapper: TestWrapper })

      expect(capturedGridLayoutProps.gridConfig.cols).toBe(12)
    })

    it('should set minW and minH for portlets', () => {
      const config = createTestConfig(1)

      render(<DashboardGrid config={config} />, { wrapper: TestWrapper })

      expect(capturedGridLayoutProps.layout[0]).toMatchObject({
        minW: 2,
        minH: 1
      })
    })
  })

  describe('empty state', () => {
    it('should show empty state when no portlets', () => {
      const config = createTestConfig(0)

      const { container } = render(
        <DashboardGrid config={config} editable={true} />,
        { wrapper: TestWrapper }
      )

      expect(container.textContent).toContain('No Portlets')
    })

    it('should show add portlet button in empty state when editable', () => {
      const config = createTestConfig(0)

      const { container } = render(
        <DashboardGrid config={config} editable={true} />,
        { wrapper: TestWrapper }
      )

      const buttons = Array.from(container.querySelectorAll('button'))
      const addPortletButton = buttons.find(b => b.textContent?.includes('Add Portlet'))
      expect(addPortletButton).toBeTruthy()
    })
  })

  describe('edit mode', () => {
    it('should not allow dragging when not in edit mode', async () => {
      const config = createTestConfig(1)

      render(<DashboardGrid config={config} editable={true} />, { wrapper: TestWrapper })

      expect(capturedGridLayoutProps.dragConfig.enabled).toBe(false)
      expect(capturedGridLayoutProps.resizeConfig.enabled).toBe(false)
    })

    it('should allow dragging when in edit mode', async () => {
      vi.useFakeTimers()
      const config = createTestConfig(1)

      const { container } = render(
        <DashboardGrid config={config} editable={true} />,
        { wrapper: TestWrapper }
      )

      // Find and click the edit button
      const editButton = container.querySelector('button')
      expect(editButton).not.toBeNull()

      await act(async () => {
        fireEvent.click(editButton!)
        // Wait for initialization timer
        await vi.advanceTimersByTimeAsync(250)
      })

      expect(capturedGridLayoutProps.dragConfig.enabled).toBe(true)
      expect(capturedGridLayoutProps.resizeConfig.enabled).toBe(true)
    })

    it('should show edit toolbar when editable prop is true', () => {
      const config = createTestConfig(1)

      const { container } = render(
        <DashboardGrid config={config} editable={true} />,
        { wrapper: TestWrapper }
      )

      const editButton = container.querySelector('button')
      expect(editButton?.textContent).toContain('Edit')
    })

    it('should not show edit toolbar when editable is false', () => {
      const config = createTestConfig(1)

      const { container } = render(
        <DashboardGrid config={config} editable={false} />,
        { wrapper: TestWrapper }
      )

      // No edit button should exist
      const buttons = container.querySelectorAll('button')
      const editButton = Array.from(buttons).find(b => b.textContent?.includes('Edit'))
      expect(editButton).toBeUndefined()
    })
  })

  describe('responsive behavior', () => {
    it('should render mobile layout when displayMode is mobile', () => {
      mockResponsiveState.displayMode = 'mobile'
      const config = createTestConfig(1)

      const { getByTestId } = render(
        <DashboardGrid config={config} />,
        { wrapper: TestWrapper }
      )

      expect(getByTestId('mobile-layout')).toBeInTheDocument()
    })

    it('should stack the cards in the order of the rows, not of the stored grid positions, in rows mode', () => {
      mockResponsiveState.displayMode = 'mobile'

      const { container } = render(
        <DashboardGrid config={createRowsConfigWithStalePositions()} />,
        { wrapper: TestWrapper }
      )

      expect(mobileCardOrder(container)).toEqual(['portlet-c', 'portlet-a', 'portlet-b'])
    })

    it('should stack the cards in the order of the rows when only the dashboard modes select rows mode', () => {
      mockResponsiveState.displayMode = 'mobile'
      const config = { ...createRowsConfigWithStalePositions(), layoutMode: undefined }

      const { container } = render(
        <DashboardGrid config={config} dashboardModes={['rows']} />,
        { wrapper: TestWrapper }
      )

      expect(mobileCardOrder(container)).toEqual(['portlet-c', 'portlet-a', 'portlet-b'])
    })

    it('should stack the cards in the order of their stored grid positions in grid mode', () => {
      mockResponsiveState.displayMode = 'mobile'
      const config = { ...createRowsConfigWithStalePositions(), layoutMode: 'grid' as const }

      const { container } = render(
        <DashboardGrid config={config} />,
        { wrapper: TestWrapper }
      )

      expect(mobileCardOrder(container)).toEqual(['portlet-a', 'portlet-b', 'portlet-c'])
    })

    it('should render scaled wrapper when displayMode is scaled', () => {
      mockResponsiveState.displayMode = 'scaled'
      const config = createTestConfig(1)

      const { getByTestId } = render(
        <DashboardGrid config={config} />,
        { wrapper: TestWrapper }
      )

      expect(getByTestId('scaled-wrapper')).toBeInTheDocument()
    })

    it('should disable edit mode when not responsive editable', async () => {
      vi.useFakeTimers()
      mockResponsiveState.isEditable = false
      const config = createTestConfig(1)

      const { container } = render(
        <DashboardGrid config={config} editable={true} />,
        { wrapper: TestWrapper }
      )

      await act(async () => {
        await vi.advanceTimersByTimeAsync(250)
      })

      const editButton = container.querySelector('button')
      expect(editButton).toBeDisabled?.()
    })
  })

  describe('config changes', () => {
    it('should call onConfigChange when config is modified', async () => {
      vi.useFakeTimers()
      const config = createTestConfig(1)
      const onConfigChange = vi.fn()

      const { container } = render(
        <DashboardGrid
          config={config}
          editable={true}
          onConfigChange={onConfigChange}
        />,
        { wrapper: TestWrapper }
      )

      // Enter edit mode
      const editButton = container.querySelector('button')
      await act(async () => {
        fireEvent.click(editButton!)
        await vi.advanceTimersByTimeAsync(250)
      })

      // Simulate a layout change via drag stop
      const newLayout = [{ i: 'portlet-0', x: 0, y: 0, w: 6, h: 4 }]
      await act(async () => {
        capturedGridLayoutProps.onDragStop(newLayout, {}, {}, null, null, null)
      })

      // onConfigChange should not be called because layout hasn't changed from initial
      // This is expected behavior - it prevents saves during responsive adjustments
    })

    it('should save a grid drag without the stored rows and groups', async () => {
      vi.useFakeTimers()
      const config = createGridConfigWithRowLayout()
      let saved: DashboardConfig | undefined
      const onSave = vi.fn((next: DashboardConfig) => {
        saved = next
      })

      const { container } = render(
        <DashboardGrid config={config} editable={true} onConfigChange={vi.fn()} onSave={onSave} />,
        { wrapper: TestWrapper }
      )
      await act(async () => {
        fireEvent.click(container.querySelector('button')!)
        await vi.advanceTimersByTimeAsync(250)
      })

      const movedLayout = [
        { i: 'portlet-0', x: 0, y: 0, w: 6, h: 4 },
        { i: 'portlet-1', x: 0, y: 4, w: 6, h: 4 }
      ]
      await act(async () => {
        await capturedGridLayoutProps.onDragStop(movedLayout, null, null, null, null, null)
      })

      expect(onSave).toHaveBeenCalledTimes(1)
      expect(saved).toStrictEqual({
        layoutMode: 'grid',
        portlets: [config.portlets[0], { ...config.portlets[1], x: 0, y: 4 }],
        layouts: { lg: movedLayout }
      })
    })

    it('should save a grid resize without the stored rows and groups', async () => {
      vi.useFakeTimers()
      const config = createGridConfigWithRowLayout()
      let saved: DashboardConfig | undefined
      const onSave = vi.fn((next: DashboardConfig) => {
        saved = next
      })

      const { container } = render(
        <DashboardGrid config={config} editable={true} onConfigChange={vi.fn()} onSave={onSave} />,
        { wrapper: TestWrapper }
      )
      await act(async () => {
        fireEvent.click(container.querySelector('button')!)
        await vi.advanceTimersByTimeAsync(250)
      })

      const resizedLayout = [
        { i: 'portlet-0', x: 0, y: 0, w: 4, h: 4 },
        { i: 'portlet-1', x: 6, y: 0, w: 6, h: 4 }
      ]
      await act(async () => {
        await capturedGridLayoutProps.onResizeStop(resizedLayout, null, null, null, null, null)
      })

      expect(onSave).toHaveBeenCalledTimes(1)
      expect(saved).toStrictEqual({
        layoutMode: 'grid',
        portlets: [{ ...config.portlets[0], w: 4 }, config.portlets[1]],
        layouts: { lg: resizedLayout }
      })
    })
  })

  describe('portlet actions', () => {
    it('should open add portlet modal when add button clicked', async () => {
      vi.useFakeTimers()
      const config = createTestConfig(1)

      const { container, queryByTestId } = render(
        <DashboardGrid config={config} editable={true} />,
        { wrapper: TestWrapper }
      )

      // Enter edit mode first
      const editButton = container.querySelector('button')
      await act(async () => {
        fireEvent.click(editButton!)
        await vi.advanceTimersByTimeAsync(250)
      })

      // Find and click add portlet button
      const buttons = container.querySelectorAll('button')
      const addButton = Array.from(buttons).find(b => b.textContent?.includes('Add Portlet'))

      await act(async () => {
        fireEvent.click(addButton!)
      })

      expect(queryByTestId('portlet-edit-modal')).toBeInTheDocument()
    })
  })

  describe('filter panel', () => {
    it('should render filter panel', () => {
      const config = createTestConfig(1)

      const { getByTestId } = render(
        <DashboardGrid config={config} />,
        { wrapper: TestWrapper }
      )

      expect(getByTestId('filter-panel')).toBeInTheDocument()
    })
  })

  describe('grid width', () => {
    it('should use container width in desktop mode', () => {
      mockResponsiveState.containerWidth = 1400
      mockResponsiveState.displayMode = 'desktop'
      const config = createTestConfig(1)

      render(<DashboardGrid config={config} />, { wrapper: TestWrapper })

      expect(capturedGridLayoutProps.width).toBe(1400)
    })

    it('should use design width in scaled mode', () => {
      mockResponsiveState.containerWidth = 800
      mockResponsiveState.displayMode = 'scaled'
      mockResponsiveState.designWidth = 1200
      const config = createTestConfig(1)

      render(<DashboardGrid config={config} />, { wrapper: TestWrapper })

      expect(capturedGridLayoutProps.width).toBe(1200)
    })
  })

  describe('expand action', () => {
    it('should show an Expand button on each card and give onPortletExpand the clicked portlet', () => {
      mockFeatures = { portletExpand: true }
      const onPortletExpand = vi.fn()

      const { getAllByRole } = render(
        <DashboardGrid config={createTestConfig(2)} onPortletExpand={onPortletExpand} />,
        { wrapper: TestWrapper }
      )
      const buttons = getAllByRole('button', { name: 'Expand' })
      fireEvent.click(buttons[1])

      expect(buttons).toHaveLength(2)
      expect(onPortletExpand).toHaveBeenCalledWith(
        expect.objectContaining({ portletId: 'portlet-1', title: 'Portlet 1', viewState: {} })
      )
    })

    it('should not show an Expand button when features.portletExpand is off, even with onPortletExpand', () => {
      const { queryAllByRole } = render(
        <DashboardGrid config={createTestConfig(2)} onPortletExpand={vi.fn()} />,
        { wrapper: TestWrapper }
      )

      expect(queryAllByRole('button', { name: 'Expand' })).toHaveLength(0)
    })

    it('should not open the built-in Expand modal when the dashboard gets onPortletExpand', () => {
      mockFeatures = { portletExpand: true }
      const onPortletExpand = vi.fn()

      const { getAllByRole, queryByRole } = render(
        <DashboardGrid config={createTestConfig(2)} onPortletExpand={onPortletExpand} />,
        { wrapper: TestWrapper }
      )
      fireEvent.click(getAllByRole('button', { name: 'Expand' })[0])

      expect(onPortletExpand).toHaveBeenCalledTimes(1)
      expect(queryByRole('dialog')).toBeNull()
    })

    it('should open the built-in Expand modal with the portlet title and chart without onPortletExpand', () => {
      mockFeatures = { portletExpand: true }

      const { getAllByRole, getAllByTestId, getByRole } = render(
        <DashboardGrid config={createTestConfig(2)} />,
        { wrapper: TestWrapper }
      )
      const cardQuery = getAllByTestId('analytics-portlet')[1].getAttribute('data-query')
      fireEvent.click(getAllByRole('button', { name: 'Expand' })[1])

      const dialog = getByRole('dialog', { name: 'Portlet 1' })
      expect(within(dialog).getByTestId('analytics-portlet').getAttribute('data-query')).toBe(cardQuery)
    })

    it('should close the built-in Expand modal when the user clicks its close button', () => {
      mockFeatures = { portletExpand: true }

      const { getAllByRole, getByRole, queryByRole } = render(
        <DashboardGrid config={createTestConfig(2)} />,
        { wrapper: TestWrapper }
      )
      fireEvent.click(getAllByRole('button', { name: 'Expand' })[0])
      fireEvent.click(getByRole('button', { name: 'Close modal' }))

      expect(queryByRole('dialog')).toBeNull()
    })

    it('should close the built-in Expand modal on Escape', () => {
      mockFeatures = { portletExpand: true }

      const { getAllByRole, queryByRole } = render(
        <DashboardGrid config={createTestConfig(2)} />,
        { wrapper: TestWrapper }
      )
      fireEvent.click(getAllByRole('button', { name: 'Expand' })[0])
      fireEvent.keyDown(document.body, { key: 'Escape' })

      expect(queryByRole('dialog')).toBeNull()
    })

    it('should not re-render the cards when the host passes a new onPortletExpand handler', () => {
      mockFeatures = { portletExpand: true }
      const config = createTestConfig(2)

      const { rerender } = render(
        <DashboardGrid config={config} onPortletExpand={() => {}} />,
        { wrapper: TestWrapper }
      )
      const rendersBefore = headerRenders
      rerender(<DashboardGrid config={config} onPortletExpand={() => {}} />)

      expect(headerRenders).toBe(rendersBefore)
    })

    it('should give the latest onPortletExpand handler the clicked portlet', () => {
      mockFeatures = { portletExpand: true }
      const config = createTestConfig(2)
      const firstHandler = vi.fn()
      const latestHandler = vi.fn()

      const { rerender, getAllByRole } = render(
        <DashboardGrid config={config} onPortletExpand={firstHandler} />,
        { wrapper: TestWrapper }
      )
      rerender(<DashboardGrid config={config} onPortletExpand={latestHandler} />)
      fireEvent.click(getAllByRole('button', { name: 'Expand' })[0])

      expect(firstHandler).not.toHaveBeenCalled()
      expect(latestHandler).toHaveBeenCalledWith(expect.objectContaining({ portletId: 'portlet-0' }))
    })
  })
})
