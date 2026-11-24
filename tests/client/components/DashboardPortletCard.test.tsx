import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import React from 'react'
import type { ChartExportHandler, FeaturesConfig } from '../../../src/client/types'

// The export that the mocked chart registers with onExportReady
const chartExportMock = vi.hoisted(() => ({ handler: null as ChartExportHandler | null }))

// The built-in XLSX export: whether exceljs is installed, and the export of the debug data
const xlsxMocks = vi.hoisted(() => ({
  isExportAvailable: vi.fn(),
  exportPortletToXlsx: vi.fn()
}))
vi.mock('../../../src/client/utils/exportXlsx', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/client/utils/exportXlsx')>()),
  isExportAvailable: xlsxMocks.isExportAvailable,
  exportPortletToXlsx: xlsxMocks.exportPortletToXlsx
}))

// Freshness the mocked AnalyticsPortlet reports on mount, when set
type FreshnessGlobal = typeof globalThis & {
  __dcAnalyticsPortletFreshness?: { computedAt?: string; isFetching: boolean }
}

// Mock AnalyticsPortlet - complex child component
// Must be before the component import
vi.mock('../../../src/client/components/AnalyticsPortlet', () => {
  const ReactMock = require('react')
  return {
    default: ReactMock.forwardRef(function MockAnalyticsPortlet(
      props: {
        title?: string
        chartType?: string
        height?: string | number
        onDebugDataReady?: (data: unknown) => void
        onFreshnessChange?: (freshness: { computedAt?: string; isFetching: boolean }) => void
        onExportReady?: (handler: ChartExportHandler | null) => void
      },
      ref: React.Ref<unknown>
    ) {
      const { onFreshnessChange, onExportReady } = props
      ReactMock.useEffect(() => {
        const freshness = (globalThis as FreshnessGlobal).__dcAnalyticsPortletFreshness
        if (freshness) onFreshnessChange?.(freshness)
      }, [onFreshnessChange])
      ;(globalThis as any).__dcAnalyticsPortletRenderCount = ((globalThis as any).__dcAnalyticsPortletRenderCount || 0) + 1
      ReactMock.useImperativeHandle(ref, () => ({
        refresh: vi.fn(),
        getViewState: () => (globalThis as any).__dcAnalyticsPortletViewState ?? {}
      }))
      return ReactMock.createElement(
        'div',
        {
          'data-testid': 'analytics-portlet',
          'data-chart-type': props.chartType,
          'data-height': props.height,
          'data-export-ready': onExportReady ? 'set' : 'unset'
        },
        props.title || 'Portlet Content',
        onExportReady && ReactMock.createElement(
          'button',
          { type: 'button', onClick: () => onExportReady(chartExportMock.handler) },
          'Register chart export'
        ),
        onExportReady && ReactMock.createElement(
          'button',
          { type: 'button', onClick: () => onExportReady(null) },
          'Remove chart export'
        )
      )
    })
  }
})

function resetAnalyticsPortletRenderCount() {
  ;(globalThis as any).__dcAnalyticsPortletRenderCount = 0
}

function getAnalyticsPortletRenderCount(): number {
  return (globalThis as any).__dcAnalyticsPortletRenderCount || 0
}

// Mock DebugModal
vi.mock('../../../src/client/components/DebugModal', () => {
  const ReactMock = require('react')
  return {
    default: function MockDebugModal() {
      return ReactMock.createElement('div', { 'data-testid': 'debug-modal' }, 'Debug')
    }
  }
})

// Mock thumbnail utilities - must include all exports used by CubeFeaturesProvider
vi.mock('../../../src/client/utils/thumbnail', () => ({
  isPortletCopyAvailable: vi.fn().mockResolvedValue(false),
  copyPortletToClipboard: vi.fn().mockResolvedValue(false),
  captureThumbnail: vi.fn().mockResolvedValue(null),
  isThumbnailCaptureAvailable: vi.fn().mockResolvedValue(false),
  warnIfScreenshotLibMissing: vi.fn()
}))

import DashboardPortletCard from '../../../src/client/components/DashboardPortletCard'
import type { PortletConfig, DashboardLayoutMode } from '../../../src/client/types'
import type { HTMLAttributes } from 'react'
import type { AnalysisConfig } from '../../../src/client/types/analysisConfig'
import { DashboardStoreProvider, useDashboardStore, type PortletDebugDataEntry } from '../../../src/client/stores/dashboardStore'
import { CubeFeaturesProvider, useCubeFeatures } from '../../../src/client/providers/CubeFeaturesProvider'
import { chartPluginRegistry } from '../../../src/client/charts/chartPlugin'

// Mock icon components
const MockIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} data-testid="mock-icon" />
)

const mockIcons = {
  RefreshIcon: MockIcon,
  EditIcon: MockIcon,
  DeleteIcon: MockIcon,
  CopyIcon: MockIcon,
  FilterIcon: MockIcon
}

// Create a valid analysis config
const createMockAnalysisConfig = (): AnalysisConfig => ({
  version: 1,
  analysisType: 'query',
  activeView: 'chart',
  charts: {
    query: {
      chartType: 'bar',
      chartConfig: {},
      displayConfig: {}
    }
  },
  query: {
    measures: ['Sales.total']
  }
})

// Create mock portlet config
const createMockPortlet = (overrides?: Partial<PortletConfig>): PortletConfig => ({
  id: 'portlet-1',
  title: 'Sales Overview',
  w: 6,
  h: 4,
  x: 0,
  y: 0,
  analysisConfig: createMockAnalysisConfig(),
  ...overrides
})

// Default props
const createDefaultProps = () => ({
  portlet: createMockPortlet(),
  editable: true,
  layoutMode: 'grid' as DashboardLayoutMode,
  containerProps: undefined as HTMLAttributes<HTMLDivElement> | undefined,
  setPortletRef: vi.fn(),
  setPortletComponentRef: vi.fn(),
  callbacks: {
    onToggleFilter: vi.fn(),
    onRefresh: vi.fn(),
    onDuplicate: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onOpenFilterConfig: vi.fn()
  },
  icons: mockIcons
})

// Wrapper component that provides required context
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CubeFeaturesProvider features={{}}>
      <DashboardStoreProvider>
        {children}
      </DashboardStoreProvider>
    </CubeFeaturesProvider>
  )
}

// Wrapper with edit mode enabled
function TestWrapperEditMode({ children }: { children: React.ReactNode }) {
  return (
    <CubeFeaturesProvider features={{}}>
      <DashboardStoreProvider initialEditMode={true}>
        {children}
      </DashboardStoreProvider>
    </CubeFeaturesProvider>
  )
}

describe('DashboardPortletCard', () => {
  describe('view mode (isEditMode=false)', () => {
    it('should render title in header', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      // Use heading role to find the title specifically
      expect(screen.getByRole('heading', { name: 'Sales Overview' })).toBeInTheDocument()
    })

    it('should render children (chart content)', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      expect(screen.getByTestId('analytics-portlet')).toBeInTheDocument()
    })

    it('should NOT show edit button', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      // Edit button has "Edit portlet" title
      expect(screen.queryByTitle('Edit portlet')).not.toBeInTheDocument()
    })

    it('should NOT show delete button', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      expect(screen.queryByTitle('Delete portlet')).not.toBeInTheDocument()
    })

    it('should NOT show duplicate button', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      expect(screen.queryByTitle('Duplicate portlet')).not.toBeInTheDocument()
    })

    it('should show refresh button in view mode', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      // Refresh button should be visible in all modes
      expect(screen.getByTitle(/refresh portlet data/i)).toBeInTheDocument()
    })
  })

  describe('edit mode (isEditMode=true)', () => {
    it('should show edit button', () => {
      const props = createDefaultProps()

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      expect(screen.getByTitle('Edit portlet')).toBeInTheDocument()
    })

    it('should show delete button', () => {
      const props = createDefaultProps()

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      expect(screen.getByTitle('Delete portlet')).toBeInTheDocument()
    })

    it('should show duplicate button', () => {
      const props = createDefaultProps()

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      expect(screen.getByTitle('Duplicate portlet')).toBeInTheDocument()
    })

    it('should show filter config button', () => {
      const props = createDefaultProps()

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      expect(screen.getByTitle(/configure dashboard filters/i)).toBeInTheDocument()
    })

    it('should call onEdit when edit button clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      await user.click(screen.getByTitle('Edit portlet'))

      expect(props.callbacks.onEdit).toHaveBeenCalledWith(props.portlet)
    })

    it('should call onDelete when delete button clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      await user.click(screen.getByTitle('Delete portlet'))

      expect(props.callbacks.onDelete).toHaveBeenCalledWith('portlet-1')
    })

    it('should call onDuplicate when duplicate button clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      await user.click(screen.getByTitle('Duplicate portlet'))

      expect(props.callbacks.onDuplicate).toHaveBeenCalledWith('portlet-1')
    })

    it('should call onOpenFilterConfig when filter button clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      await user.click(screen.getByTitle(/configure dashboard filters/i))

      expect(props.callbacks.onOpenFilterConfig).toHaveBeenCalledWith(props.portlet)
    })
  })

  describe('refresh functionality', () => {
    it('should call onRefresh when refresh button clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      await user.click(screen.getByTitle(/refresh portlet data/i))

      expect(props.callbacks.onRefresh).toHaveBeenCalledWith('portlet-1', { bustCache: false })
    })

    it('should show tooltip about shift+click for cache bust', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      const refreshButton = screen.getByTitle(/refresh portlet data/i)
      expect(refreshButton.title).toContain('Shift+click')
    })

    it('spins the refresh icon and marks the button busy while the portlet fetches', () => {
      ;(globalThis as FreshnessGlobal).__dcAnalyticsPortletFreshness = { isFetching: true }
      try {
        render(
          <TestWrapper>
            <DashboardPortletCard {...createDefaultProps()} />
          </TestWrapper>
        )

        const refreshButton = screen.getByTestId('portlet-refresh')
        expect(refreshButton).toHaveAttribute('aria-busy', 'true')
        expect(refreshButton).toHaveAttribute('title', 'Refreshing…')
        expect(refreshButton.querySelector('svg')).toHaveClass('dc:animate-spin')
      } finally {
        delete (globalThis as FreshnessGlobal).__dcAnalyticsPortletFreshness
      }
    })
  })

  describe('ref callbacks', () => {
    it('should call setPortletRef on mount', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      expect(props.setPortletRef).toHaveBeenCalledWith('portlet-1', expect.any(HTMLDivElement))
    })

    it('should call setPortletComponentRef with refresh method', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      expect(props.setPortletComponentRef).toHaveBeenCalledWith('portlet-1', expect.objectContaining({
        refresh: expect.any(Function)
      }))
    })
  })

  describe('editable prop', () => {
    it('should not show edit controls when editable is false even in edit mode', () => {
      const props = createDefaultProps()
      props.editable = false

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      expect(screen.queryByTitle('Edit portlet')).not.toBeInTheDocument()
      expect(screen.queryByTitle('Delete portlet')).not.toBeInTheDocument()
      expect(screen.queryByTitle('Duplicate portlet')).not.toBeInTheDocument()
    })
  })

  describe('header visibility', () => {
    it('should show header by default', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      // Use heading role to be specific about the header title
      expect(screen.getByRole('heading', { name: 'Sales Overview' })).toBeInTheDocument()
    })

    it('should hide header when displayConfig.hideHeader is true in view mode', () => {
      const analysisConfig = createMockAnalysisConfig()
      analysisConfig.charts.query!.displayConfig = { hideHeader: true }
      const props = createDefaultProps()
      props.portlet = createMockPortlet({ analysisConfig })

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      // The h3 heading should not be rendered when header is hidden
      expect(screen.queryByRole('heading', { name: 'Sales Overview' })).not.toBeInTheDocument()
    })

    it('should show header in edit mode even when hideHeader is true', () => {
      const analysisConfig = createMockAnalysisConfig()
      analysisConfig.charts.query!.displayConfig = { hideHeader: true }
      const props = createDefaultProps()
      props.portlet = createMockPortlet({ analysisConfig })

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      // In edit mode, header should be visible for editing controls
      expect(screen.getByRole('heading', { name: 'Sales Overview' })).toBeInTheDocument()
    })

    it('should hide header in view mode when markdown transparentBackground is true even if hideHeader is false', () => {
      const analysisConfig = createMockAnalysisConfig()
      analysisConfig.charts.query!.chartType = 'markdown'
      analysisConfig.charts.query!.displayConfig = {
        hideHeader: false,
        transparentBackground: true
      }
      const props = createDefaultProps()
      props.portlet = createMockPortlet({ analysisConfig })

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      expect(screen.queryByRole('heading', { name: 'Sales Overview' })).not.toBeInTheDocument()
    })
  })

  describe('dashboard filter mapping indicator', () => {
    it('should show filter count in title when portlet has dashboard filter mapping', () => {
      const props = createDefaultProps()
      props.portlet = createMockPortlet({
        dashboardFilterMapping: ['filter-1', 'filter-2']
      })

      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...props} />
        </TestWrapperEditMode>
      )

      const filterButton = screen.getByTitle(/configure dashboard filters.*2 active/i)
      expect(filterButton).toBeInTheDocument()
    })
  })

  describe('filter selection mode field chip', () => {
    const selectionDashboardFilters = [
      {
        id: 'filter-1',
        label: 'Employee',
        filter: { member: 'Employees.name', operator: 'contains' as const, values: ['Engineering'] }
      }
    ]

    // Enters filter selection mode for filter-1 via the store
    function SelectFilter({ children }: { children: React.ReactNode }) {
      const setSelectedFilterId = useDashboardStore((s) => s.setSelectedFilterId)
      React.useEffect(() => {
        setSelectedFilterId('filter-1')
      }, [setSelectedFilterId])
      return <>{children}</>
    }

    function renderInSelectionMode(props: ReturnType<typeof createDefaultProps>) {
      return render(
        <TestWrapperEditMode>
          <SelectFilter>
            <DashboardPortletCard {...props} dashboardFilters={selectionDashboardFilters} />
          </SelectFilter>
        </TestWrapperEditMode>
      )
    }

    it('should show the filter field chip on portlets that have the selected filter', () => {
      const props = createDefaultProps()
      props.portlet = createMockPortlet({ dashboardFilterMapping: ['filter-1'] })

      renderInSelectionMode(props)

      expect(screen.getByText('Employees.name')).toBeInTheDocument()
    })

    it('should show the override field when the mapping has a member override', () => {
      const props = createDefaultProps()
      props.portlet = createMockPortlet({
        dashboardFilterMapping: [{ filterId: 'filter-1', member: 'Departments.name' }]
      })

      renderInSelectionMode(props)

      expect(screen.getByText('Departments.name')).toBeInTheDocument()
      expect(screen.queryByText('Employees.name')).not.toBeInTheDocument()
    })

    it('should not show the chip when the portlet does not have the selected filter', () => {
      const props = createDefaultProps()
      props.portlet = createMockPortlet({ dashboardFilterMapping: [] })

      renderInSelectionMode(props)

      expect(screen.queryByText('Employees.name')).not.toBeInTheDocument()
    })

    it('should open the filter config modal when the chip is clicked, without toggling the filter', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.portlet = createMockPortlet({ dashboardFilterMapping: ['filter-1'] })

      renderInSelectionMode(props)

      await user.click(screen.getByText('Employees.name'))

      expect(props.callbacks.onOpenFilterConfig).toHaveBeenCalledWith(props.portlet)
      expect(props.callbacks.onToggleFilter).not.toHaveBeenCalled()
    })
  })

  describe('data-portlet-id attribute', () => {
    it('should set data-portlet-id attribute on container', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      const container = document.querySelector('[data-portlet-id="portlet-1"]')
      expect(container).toBeInTheDocument()
    })
  })

  describe('container props passthrough', () => {
    it('should merge className from containerProps', () => {
      const props = createDefaultProps()
      props.containerProps = { className: 'custom-class' }

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      const container = document.querySelector('[data-portlet-id="portlet-1"]')
      expect(container?.className).toContain('custom-class')
    })
  })

  describe('render performance', () => {
    it('should not re-render AnalyticsPortlet when edit mode toggles', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      resetAnalyticsPortletRenderCount()

      function EditModeStoreHarness() {
        const isEditMode = useDashboardStore((state) => state.isEditMode)
        const setEditMode = useDashboardStore((state) => state.setEditMode)
        return (
          <>
            <button onClick={() => setEditMode(!isEditMode)}>toggle-edit-mode</button>
            <DashboardPortletCard {...props} />
          </>
        )
      }

      render(
        <CubeFeaturesProvider features={{}}>
          <DashboardStoreProvider>
            <EditModeStoreHarness />
          </DashboardStoreProvider>
        </CubeFeaturesProvider>
      )

      const initialRenderCount = getAnalyticsPortletRenderCount()
      await user.click(screen.getByRole('button', { name: 'toggle-edit-mode' }))

      expect(getAnalyticsPortletRenderCount()).toBe(initialRenderCount)
    })
  })

  describe('markdown height policy', () => {
    it('should keep fixed height in grid layout even when markdown autoHeight is enabled', () => {
      const analysisConfig = createMockAnalysisConfig()
      analysisConfig.charts.query!.chartType = 'markdown'
      analysisConfig.charts.query!.displayConfig = { autoHeight: true }
      const props = createDefaultProps()
      props.portlet = createMockPortlet({ analysisConfig })

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      const container = document.querySelector('[data-portlet-id="portlet-1"]')
      expect(container?.className).toContain('dc:h-full')
      expect(screen.getByTestId('analytics-portlet')).toHaveAttribute('data-height', '100%')
    })

    it('should use auto height in rows layout when markdown autoHeight is enabled', () => {
      const analysisConfig = createMockAnalysisConfig()
      analysisConfig.charts.query!.chartType = 'markdown'
      analysisConfig.charts.query!.displayConfig = { autoHeight: true }
      const props = createDefaultProps()
      props.portlet = createMockPortlet({ analysisConfig })
      props.layoutMode = 'rows'

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} />
        </TestWrapper>
      )

      const container = document.querySelector('[data-portlet-id="portlet-1"]')
      expect(container?.className).not.toContain('dc:h-full')
      expect(screen.getByTestId('analytics-portlet')).toHaveAttribute('data-height', 'auto')
    })

    it('should fill a fixed-height row in rows layout even when markdown autoHeight is enabled', () => {
      const analysisConfig = createMockAnalysisConfig()
      analysisConfig.charts.query!.chartType = 'markdown'
      analysisConfig.charts.query!.displayConfig = { autoHeight: true }
      const props = createDefaultProps()
      props.portlet = createMockPortlet({ analysisConfig })
      props.layoutMode = 'rows'

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} inFixedHeightRow />
        </TestWrapper>
      )

      const container = document.querySelector('[data-portlet-id="portlet-1"]')
      expect(container?.className).toContain('dc:h-full')
      expect(screen.getByTestId('analytics-portlet')).toHaveAttribute('data-height', '100%')
    })
  })

  describe('unreachable dashboard date filter indicator', () => {
    const universalFilter = {
      id: 'date',
      label: 'Date Range',
      isUniversalTime: true,
      filter: { member: '__universal_time__', operator: 'inDateRange' as const, values: [], dateRange: 'last 7 days' }
    }

    it('warns when a mapped universal date filter cannot reach a portlet without time dimensions', () => {
      const props = createDefaultProps()
      props.portlet = createMockPortlet({ dashboardFilterMapping: ['date'] })

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} dashboardFilters={[universalFilter]} />
        </TestWrapper>
      )

      expect(screen.getByTestId('portlet-date-filter-not-applied')).toHaveAttribute(
        'title',
        expect.stringContaining('"Date Range" does not narrow this portlet')
      )
    })

    it('does not warn once the universal date filter is pinned to a field', () => {
      const props = createDefaultProps()
      props.portlet = createMockPortlet({ dashboardFilterMapping: [{ filterId: 'date', member: 'Sales.createdAt' }] })

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} dashboardFilters={[universalFilter]} />
        </TestWrapper>
      )

      expect(screen.queryByTestId('portlet-date-filter-not-applied')).not.toBeInTheDocument()
    })

    it('does not warn when the portlet has a time dimension', () => {
      const props = createDefaultProps()
      const analysisConfig = createMockAnalysisConfig()
      analysisConfig.query = {
        measures: ['Sales.total'],
        timeDimensions: [{ dimension: 'Sales.createdAt', granularity: 'day' }]
      }
      props.portlet = createMockPortlet({ analysisConfig, dashboardFilterMapping: ['date'] })

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} dashboardFilters={[universalFilter]} />
        </TestWrapper>
      )

      expect(screen.queryByTestId('portlet-date-filter-not-applied')).not.toBeInTheDocument()
    })
  })

  describe('expand action', () => {
    afterEach(() => {
      delete (globalThis as any).__dcAnalyticsPortletViewState
    })

    it('should show an Expand button next to Refresh in view mode when onPortletExpand is set', () => {
      const props = createDefaultProps()

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} onPortletExpand={vi.fn()} />
        </TestWrapper>
      )

      const expand = screen.getByRole('button', { name: 'Expand' })
      expect(expand).toHaveAttribute('title', 'Expand')
      expect(screen.getByTitle(/refresh portlet data/i).nextElementSibling).toBe(expand)
    })

    it('should not show an Expand button without onPortletExpand', () => {
      render(
        <TestWrapper>
          <DashboardPortletCard {...createDefaultProps()} />
        </TestWrapper>
      )

      expect(screen.queryByRole('button', { name: 'Expand' })).not.toBeInTheDocument()
    })

    it('should not show an Expand button in edit mode', () => {
      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...createDefaultProps()} onPortletExpand={vi.fn()} />
        </TestWrapperEditMode>
      )

      expect(screen.getByTitle('Edit portlet')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Expand' })).not.toBeInTheDocument()
    })

    it('should not show an Expand button in filter selection mode', () => {
      function SelectFilter({ children }: { children: React.ReactNode }) {
        const setSelectedFilterId = useDashboardStore((s) => s.setSelectedFilterId)
        React.useEffect(() => {
          setSelectedFilterId('filter-1')
        }, [setSelectedFilterId])
        return <>{children}</>
      }

      render(
        <TestWrapper>
          <SelectFilter>
            <DashboardPortletCard {...createDefaultProps()} onPortletExpand={vi.fn()} />
          </SelectFilter>
        </TestWrapper>
      )

      expect(screen.queryByRole('button', { name: 'Expand' })).not.toBeInTheDocument()
    })

    it('should not show an Expand button when the header is hidden', () => {
      const analysisConfig = createMockAnalysisConfig()
      analysisConfig.charts.query!.displayConfig = { hideHeader: true }
      const props = createDefaultProps()
      props.portlet = createMockPortlet({ analysisConfig })

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} onPortletExpand={vi.fn()} />
        </TestWrapper>
      )

      expect(screen.queryByRole('button', { name: 'Expand' })).not.toBeInTheDocument()
    })

    it('should give onPortletExpand the resolved chart properties and the chart view state', async () => {
      const user = userEvent.setup()
      const onPortletExpand = vi.fn()
      const dashboardFilters = [
        { id: 'filter-1', label: 'Region', filter: { member: 'Sales.region', operator: 'equals' as const, values: ['EU'] } }
      ]
      const props = createDefaultProps()
      props.portlet = createMockPortlet({ dashboardFilterMapping: ['filter-1'] })
      ;(globalThis as any).__dcAnalyticsPortletViewState = { chart: { page: 2 } }

      render(
        <TestWrapper>
          <DashboardPortletCard {...props} dashboardFilters={dashboardFilters} onPortletExpand={onPortletExpand} />
        </TestWrapper>
      )
      await user.click(screen.getByRole('button', { name: 'Expand' }))

      expect(onPortletExpand).toHaveBeenCalledWith({
        portletId: 'portlet-1',
        title: 'Sales Overview',
        chartProps: expect.objectContaining({
          query: JSON.stringify({ measures: ['Sales.total'] }),
          chartType: 'bar',
          chartConfig: {},
          displayConfig: {},
          dashboardFilters,
          dashboardFilterMapping: ['filter-1'],
          title: 'Sales Overview'
        }),
        viewState: { chart: { page: 2 } }
      })
      expect(props.callbacks.onRefresh).not.toHaveBeenCalled()
    })

    it('should show an Expand button in the hover strip of a grouped portlet in view mode', async () => {
      const user = userEvent.setup()
      const onPortletExpand = vi.fn()

      render(
        <TestWrapper>
          <DashboardPortletCard {...createDefaultProps()} variant="groupChild" onPortletExpand={onPortletExpand} />
        </TestWrapper>
      )
      await user.click(screen.getByRole('button', { name: 'Expand' }))

      expect(onPortletExpand).toHaveBeenCalledWith(expect.objectContaining({ portletId: 'portlet-1' }))
    })

    it('should not show an Expand button in the hover strip of a grouped portlet in edit mode', () => {
      render(
        <TestWrapperEditMode>
          <DashboardPortletCard {...createDefaultProps()} variant="groupChild" onPortletExpand={vi.fn()} />
        </TestWrapperEditMode>
      )

      expect(screen.getByTitle('Delete portlet')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Expand' })).not.toBeInTheDocument()
    })
  })

  describe('action order (features.portletActionOrder)', () => {
    function OrderedWrapper({ children }: { children: React.ReactNode }) {
      return (
        <CubeFeaturesProvider features={{ portletActionOrder: ['expand', 'refresh'] }}>
          <DashboardStoreProvider>
            {children}
          </DashboardStoreProvider>
        </CubeFeaturesProvider>
      )
    }

    it('should show the header actions in the host order', () => {
      render(
        <OrderedWrapper>
          <DashboardPortletCard {...createDefaultProps()} onPortletExpand={vi.fn()} />
        </OrderedWrapper>
      )

      expect(screen.getByRole('button', { name: 'Expand' }).nextElementSibling).toBe(
        screen.getByTitle(/refresh portlet data/i)
      )
    })

    it('should show the hover strip actions of a grouped portlet in the host order', () => {
      render(
        <OrderedWrapper>
          <DashboardPortletCard {...createDefaultProps()} variant="groupChild" onPortletExpand={vi.fn()} />
        </OrderedWrapper>
      )

      expect(screen.getByRole('button', { name: 'Expand' }).nextElementSibling).toBe(
        screen.getByTitle('Refresh portlet')
      )
    })
  })

  describe('chart export (onExportReady)', () => {
    const DOWNLOAD = 'Download data as XLSX'
    const EXPORTING = 'Exporting...'
    const debugData: PortletDebugDataEntry = {
      chartConfig: {},
      displayConfig: {},
      queryObject: { measures: ['Sales.total'] },
      data: [{ 'Sales.total': 10 }],
      chartType: 'bar'
    }

    function SeedDebugData() {
      const setDebugData = useDashboardStore((state) => state.setDebugData)
      React.useLayoutEffect(() => {
        setDebugData('portlet-1', debugData)
      }, [setDebugData])
      return null
    }

    function renderCard(options: {
      xlsExport?: boolean
      withDebugData?: boolean
      variant?: 'standalone' | 'groupChild'
    } = {}) {
      let updateFeatures: (features: Partial<FeaturesConfig>) => void = () => {}
      function ReadUpdateFeatures() {
        updateFeatures = useCubeFeatures().updateFeatures
        return null
      }
      render(
        <CubeFeaturesProvider features={{ xlsExport: { enabled: options.xlsExport ?? true } }}>
          <ReadUpdateFeatures />
          <DashboardStoreProvider>
            {options.withDebugData && <SeedDebugData />}
            <DashboardPortletCard {...createDefaultProps()} variant={options.variant} />
          </DashboardStoreProvider>
        </CubeFeaturesProvider>
      )
      return {
        setXlsExport: (enabled: boolean) => act(() => {
          updateFeatures({ xlsExport: { enabled } })
        })
      }
    }

    async function flushExportAvailability() {
      await act(async () => {})
    }

    beforeEach(() => {
      xlsxMocks.isExportAvailable.mockReset().mockResolvedValue(true)
      xlsxMocks.exportPortletToXlsx.mockReset().mockResolvedValue(true)
      chartExportMock.handler = vi.fn(async () => {})
    })

    afterEach(() => {
      chartExportMock.handler = null
      vi.useRealTimers()
      vi.restoreAllMocks()
    })

    it('should not pass onExportReady to the chart when features.xlsExport is disabled', () => {
      renderCard({ xlsExport: false })

      expect(screen.getByTestId('analytics-portlet')).toHaveAttribute('data-export-ready', 'unset')
    })

    it('should pass onExportReady to the chart when features.xlsExport is enabled', () => {
      renderCard()

      expect(screen.getByTestId('analytics-portlet')).toHaveAttribute('data-export-ready', 'set')
    })

    it('should not show Download without a chart export and without debug data', async () => {
      renderCard()
      await flushExportAvailability()

      expect(screen.queryByTitle(DOWNLOAD)).not.toBeInTheDocument()
    })

    it('should show Download for debug data without a chart export', async () => {
      renderCard({ withDebugData: true })

      expect(await screen.findByTitle(DOWNLOAD)).toBeInTheDocument()
    })

    it('should show Download in the header when the chart registers an export, also without debug data', async () => {
      const user = userEvent.setup()
      renderCard()

      await user.click(screen.getByRole('button', { name: 'Register chart export' }))

      expect(screen.getByTitle(DOWNLOAD)).toBeInTheDocument()
    })

    it('should show Download for a chart export when exceljs is not installed', async () => {
      const user = userEvent.setup()
      xlsxMocks.isExportAvailable.mockResolvedValue(false)
      renderCard()
      await flushExportAvailability()

      await user.click(screen.getByRole('button', { name: 'Register chart export' }))

      expect(screen.getByTitle(DOWNLOAD)).toBeInTheDocument()
    })

    it('should call the chart export with the file name of the built-in export', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date(2026, 10, 3, 12, 0, 0))
      vi.spyOn(crypto, 'randomUUID').mockReturnValue('ab12cd34-0000-4000-8000-000000000000')
      const user = userEvent.setup()
      renderCard()

      await user.click(screen.getByRole('button', { name: 'Register chart export' }))
      await user.click(screen.getByTitle(DOWNLOAD))

      expect(chartExportMock.handler).toHaveBeenCalledTimes(1)
      expect(chartExportMock.handler).toHaveBeenCalledWith({ fileName: 'sales-overview-20261103-AB12.xlsx' })
      expect(xlsxMocks.exportPortletToXlsx).not.toHaveBeenCalled()
    })

    it('should call the chart export and not export the debug data when the card has both', async () => {
      const user = userEvent.setup()
      renderCard({ withDebugData: true })

      await user.click(screen.getByRole('button', { name: 'Register chart export' }))
      await user.click(await screen.findByTitle(DOWNLOAD))

      expect(chartExportMock.handler).toHaveBeenCalledTimes(1)
      expect(xlsxMocks.exportPortletToXlsx).not.toHaveBeenCalled()
    })

    it('should disable Download with the title "Exporting..." until the chart export settles', async () => {
      const user = userEvent.setup()
      let finishExport: () => void = () => {}
      chartExportMock.handler = vi.fn(() => new Promise<void>((resolve) => {
        finishExport = resolve
      }))
      renderCard()

      await user.click(screen.getByRole('button', { name: 'Register chart export' }))
      await user.click(screen.getByTitle(DOWNLOAD))

      expect(screen.getByTitle(EXPORTING)).toBeDisabled()

      await act(async () => {
        finishExport()
      })

      expect(screen.getByTitle(DOWNLOAD)).toBeEnabled()
    })

    it('should log a rejected chart export and enable Download again', async () => {
      const user = userEvent.setup()
      const error = new Error('Export failed')
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      chartExportMock.handler = vi.fn(async () => {
        throw error
      })
      renderCard()

      await user.click(screen.getByRole('button', { name: 'Register chart export' }))
      await user.click(screen.getByTitle(DOWNLOAD))

      expect(consoleError).toHaveBeenCalledWith('[drizzle-cube] Failed to export XLSX:', error)
      expect(screen.getByTitle(DOWNLOAD)).toBeEnabled()
    })

    it('should not show Download after the chart removes its export', async () => {
      const user = userEvent.setup()
      renderCard()

      await user.click(screen.getByRole('button', { name: 'Register chart export' }))
      await user.click(screen.getByRole('button', { name: 'Remove chart export' }))

      expect(screen.queryByTitle(DOWNLOAD)).not.toBeInTheDocument()
    })

    it('should not show Download for a chart export after features.xlsExport is disabled', async () => {
      const user = userEvent.setup()
      const { setXlsExport } = renderCard()
      await user.click(screen.getByRole('button', { name: 'Register chart export' }))

      setXlsExport(false)
      await flushExportAvailability()

      expect(screen.queryByTitle(DOWNLOAD)).not.toBeInTheDocument()
    })

    it('should show Download in the hover strip of a grouped card when the chart registers an export', async () => {
      const user = userEvent.setup()
      renderCard({ variant: 'groupChild' })

      await user.click(screen.getByRole('button', { name: 'Register chart export' }))
      await user.click(screen.getByTitle(DOWNLOAD))

      expect(chartExportMock.handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('a chart that loads its own data', () => {
    const staleDebugData: PortletDebugDataEntry = {
      chartConfig: {},
      displayConfig: {},
      queryObject: { measures: ['Sales.total'] },
      data: [{ 'Sales.total': 10 }],
      chartType: 'bar'
    }

    afterEach(() => {
      chartPluginRegistry.unregister('ownDataTest')
    })

    function renderWithDebugData(chartType: string) {
      let storedDebugData: PortletDebugDataEntry | undefined
      function SeedDebugData() {
        const setDebugData = useDashboardStore((state) => state.setDebugData)
        storedDebugData = useDashboardStore((state) => state.debugData['portlet-1'])
        React.useLayoutEffect(() => {
          setDebugData('portlet-1', staleDebugData)
        }, [setDebugData])
        return null
      }
      const props = createDefaultProps()
      const portlet = createMockPortlet({
        analysisConfig: {
          ...createMockAnalysisConfig(),
          charts: { query: { chartType, chartConfig: {}, displayConfig: {} } }
        }
      })
      render(
        <TestWrapperEditMode>
          <SeedDebugData />
          <DashboardPortletCard {...props} portlet={portlet} />
        </TestWrapperEditMode>
      )
      return { readDebugData: () => storedDebugData }
    }

    it('should show the debug data of a chart that uses the portlet query', async () => {
      const { readDebugData } = renderWithDebugData('bar')

      expect(await screen.findByTestId('debug-modal')).toBeInTheDocument()
      expect(readDebugData()).toEqual(staleDebugData)
    })

    it('should not show stale debug data, and should clear it', async () => {
      chartPluginRegistry.register({
        type: 'ownDataTest',
        label: 'Own data test',
        config: { label: 'Own data test', dropZones: [], fetchesOwnData: true },
        component: () => null
      })

      const { readDebugData } = renderWithDebugData('ownDataTest')

      await waitFor(() => {
        expect(readDebugData()).toBeUndefined()
      })
      expect(screen.queryByTestId('debug-modal')).not.toBeInTheDocument()
    })
  })
})
