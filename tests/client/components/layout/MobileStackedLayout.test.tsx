/**
 * Tests for MobileStackedLayout component
 * Covers mobile responsive layout with stacked portlets
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import MobileStackedLayout from '../../../../src/client/components/MobileStackedLayout'
import type { DashboardConfig, PortletConfig, DashboardFilter } from '../../../../src/client/types'
import type { ColorPalette } from '../../../../src/client/utils/colorPalettes'

// Mock CubeProvider context
vi.mock('../../../../src/client/providers/CubeProvider', () => ({
  useCubeFeatures: vi.fn(() => ({
    features: {},
    batchCoordinator: null,
    enableBatching: false,
    dashboardModes: ['grid', 'mobile']
  }))
}))

// Mock CubeFeaturesProvider
vi.mock('../../../../src/client/providers/CubeFeaturesProvider', () => ({
  useCubeFeatures: vi.fn(() => ({
    features: {},
    dashboardModes: ['grid', 'mobile'],
    updateFeatures: vi.fn()
  })),
  CubeFeaturesProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Mock CubeApiProvider
vi.mock('../../../../src/client/providers/CubeApiProvider', () => ({
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

// Mock ScrollContainerProvider
vi.mock('../../../../src/client/providers/ScrollContainerContext', () => ({
  ScrollContainerProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Track portlet refresh calls
const mockPortletRefresh = vi.fn()

// Mock AnalyticsPortlet
vi.mock('../../../../src/client/components/AnalyticsPortlet', () => ({
  default: React.forwardRef((props: any, ref: any) => {
    // Expose refresh method through ref
    React.useImperativeHandle(ref, () => ({
      refresh: mockPortletRefresh
    }))
    return (
      <div
        data-testid="analytics-portlet"
        data-query={props.query}
        data-chart-type={props.chartType}
        data-height={props.height}
        data-title={props.title}
        data-eager-load={props.eagerLoad}
      >
        Mock Portlet: {props.title}
      </div>
    )
  })
}))

// Mock icons
vi.mock('../../../../src/client/icons', () => ({
  getIcon: (name: string) => () => <span data-testid={`icon-${name}`}>{name}</span>
}))

// Mock configMigration utility
vi.mock('../../../../src/client/utils/configMigration', () => ({
  ensureAnalysisConfig: (portlet: PortletConfig) => ({
    ...portlet,
    analysisConfig: portlet.analysisConfig || {
      version: 1,
      analysisType: 'query',
      activeView: 'chart',
      charts: {
        query: {
          chartType: portlet.chartType || 'bar',
          chartConfig: portlet.chartConfig || {},
          displayConfig: portlet.displayConfig || {}
        }
      },
      query: JSON.parse(portlet.query || '{}')
    }
  })
}))

// Helper to create test portlets
function createTestPortlet(overrides: Partial<PortletConfig> = {}): PortletConfig {
  return {
    id: `portlet-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Test Portlet',
    query: JSON.stringify({ measures: ['Test.count'] }),
    chartType: 'bar',
    x: 0,
    y: 0,
    w: 6,
    h: 4,
    ...overrides
  }
}

// Helper to create test config
function createTestConfig(portlets: PortletConfig[] = []): DashboardConfig {
  return {
    portlets,
    layoutMode: 'grid'
  }
}

describe('MobileStackedLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPortletRefresh.mockClear()
  })

  describe('basic rendering', () => {
    it('should render with mobile-stacked-layout class', () => {
      const config = createTestConfig([createTestPortlet()])

      const { container } = render(<MobileStackedLayout config={config} />)

      expect(container.querySelector('.mobile-stacked-layout')).toBeInTheDocument()
    })

    it('should render portlets', () => {
      const config = createTestConfig([
        createTestPortlet({ id: 'p1', title: 'Portlet 1' }),
        createTestPortlet({ id: 'p2', title: 'Portlet 2' })
      ])

      render(<MobileStackedLayout config={config} />)

      expect(screen.getAllByTestId('analytics-portlet')).toHaveLength(2)
    })

    it('should render empty state when no portlets', () => {
      const config = createTestConfig([])

      const { container } = render(<MobileStackedLayout config={config} />)

      expect(container.querySelector('.mobile-stacked-layout')).toBeInTheDocument()
      expect(screen.queryByTestId('analytics-portlet')).not.toBeInTheDocument()
    })

    it('should pass data-portlet-id attribute', () => {
      const config = createTestConfig([
        createTestPortlet({ id: 'test-portlet-1' })
      ])

      const { container } = render(<MobileStackedLayout config={config} />)

      const portletWrapper = container.querySelector('[data-portlet-id="test-portlet-1"]')
      expect(portletWrapper).toBeInTheDocument()
    })
  })

  describe('portlet sorting', () => {
    it('should sort portlets by y position first', () => {
      const config = createTestConfig([
        createTestPortlet({ id: 'p1', title: 'Bottom', y: 8, x: 0 }),
        createTestPortlet({ id: 'p2', title: 'Top', y: 0, x: 0 }),
        createTestPortlet({ id: 'p3', title: 'Middle', y: 4, x: 0 })
      ])

      render(<MobileStackedLayout config={config} />)

      const portlets = screen.getAllByTestId('analytics-portlet')
      expect(portlets[0]).toHaveAttribute('data-title', 'Top')
      expect(portlets[1]).toHaveAttribute('data-title', 'Middle')
      expect(portlets[2]).toHaveAttribute('data-title', 'Bottom')
    })

    it('should sort by x position when y is equal', () => {
      const config = createTestConfig([
        createTestPortlet({ id: 'p1', title: 'Right', y: 0, x: 6 }),
        createTestPortlet({ id: 'p2', title: 'Left', y: 0, x: 0 }),
        createTestPortlet({ id: 'p3', title: 'Center', y: 0, x: 3 })
      ])

      render(<MobileStackedLayout config={config} />)

      const portlets = screen.getAllByTestId('analytics-portlet')
      expect(portlets[0]).toHaveAttribute('data-title', 'Left')
      expect(portlets[1]).toHaveAttribute('data-title', 'Center')
      expect(portlets[2]).toHaveAttribute('data-title', 'Right')
    })

    it('should handle combined y and x sorting', () => {
      const config = createTestConfig([
        createTestPortlet({ id: 'p1', title: 'Row2-Right', y: 4, x: 6 }),
        createTestPortlet({ id: 'p2', title: 'Row1-Right', y: 0, x: 6 }),
        createTestPortlet({ id: 'p3', title: 'Row1-Left', y: 0, x: 0 }),
        createTestPortlet({ id: 'p4', title: 'Row2-Left', y: 4, x: 0 })
      ])

      render(<MobileStackedLayout config={config} />)

      const portlets = screen.getAllByTestId('analytics-portlet')
      expect(portlets[0]).toHaveAttribute('data-title', 'Row1-Left')
      expect(portlets[1]).toHaveAttribute('data-title', 'Row1-Right')
      expect(portlets[2]).toHaveAttribute('data-title', 'Row2-Left')
      expect(portlets[3]).toHaveAttribute('data-title', 'Row2-Right')
    })
  })

  describe('portlet header', () => {
    it('should render portlet title in header', () => {
      const config = createTestConfig([
        createTestPortlet({ title: 'Sales Analysis' })
      ])

      render(<MobileStackedLayout config={config} />)

      expect(screen.getByText('Sales Analysis')).toBeInTheDocument()
    })

    it('should render refresh button', () => {
      const config = createTestConfig([createTestPortlet()])

      const { container } = render(<MobileStackedLayout config={config} />)

      const refreshButton = container.querySelector('button[title="Refresh portlet data"]')
      expect(refreshButton).toBeInTheDocument()
    })

    it('should hide header when hideHeader is true in displayConfig', () => {
      const config = createTestConfig([
        createTestPortlet({
          id: 'hidden-header',
          title: 'Hidden Header Test',
          displayConfig: { hideHeader: true }
        })
      ])

      render(<MobileStackedLayout config={config} />)

      // The title should not appear in a header element
      // Note: the portlet component itself may still show title, but the mobile layout header should be hidden
      const headers = screen.queryAllByRole('heading')
      const titleInHeader = headers.find(h => h.textContent === 'Hidden Header Test')
      expect(titleInHeader).toBeUndefined()
    })

    it('should show header when hideHeader is false', () => {
      const config = createTestConfig([
        createTestPortlet({
          title: 'Visible Header',
          displayConfig: { hideHeader: false }
        })
      ])

      render(<MobileStackedLayout config={config} />)

      expect(screen.getByText('Visible Header')).toBeInTheDocument()
    })
  })

  describe('refresh functionality', () => {
    it('should call onPortletRefresh when refresh button is clicked', async () => {
      const onPortletRefresh = vi.fn()
      const config = createTestConfig([
        createTestPortlet({ id: 'refresh-test' })
      ])

      const { container } = render(
        <MobileStackedLayout
          config={config}
          onPortletRefresh={onPortletRefresh}
        />
      )

      const refreshButton = container.querySelector('button[title="Refresh portlet data"]')
      expect(refreshButton).toBeInTheDocument()

      fireEvent.click(refreshButton!)

      await waitFor(() => {
        expect(onPortletRefresh).toHaveBeenCalledWith('refresh-test')
      })
    })

    it('should call portlet refresh method when refresh button is clicked', async () => {
      const config = createTestConfig([createTestPortlet({ id: 'portlet-1' })])

      const { container } = render(<MobileStackedLayout config={config} />)

      const refreshButton = container.querySelector('button[title="Refresh portlet data"]')
      fireEvent.click(refreshButton!)

      await waitFor(() => {
        expect(mockPortletRefresh).toHaveBeenCalled()
      })
    })

    it('should work without onPortletRefresh callback', async () => {
      const config = createTestConfig([createTestPortlet()])

      const { container } = render(<MobileStackedLayout config={config} />)

      const refreshButton = container.querySelector('button[title="Refresh portlet data"]')

      // Should not throw when clicked without callback
      expect(() => fireEvent.click(refreshButton!)).not.toThrow()
    })
  })

  describe('portlet height calculation', () => {
    it('should calculate height based on h value and rowHeight', () => {
      const config = createTestConfig([
        createTestPortlet({ h: 4 }) // 4 * 80 = 320, but minimum is 300
      ])

      render(<MobileStackedLayout config={config} />)

      const portlet = screen.getByTestId('analytics-portlet')
      // Total height = 320, header = 40, padding = 24, content height = 320 - 40 - 24 = 256
      expect(portlet).toHaveAttribute('data-height', '256')
    })

    it('should enforce minimum height of 300px', () => {
      const config = createTestConfig([
        createTestPortlet({ h: 1 }) // 1 * 80 = 80, but minimum is 300
      ])

      render(<MobileStackedLayout config={config} />)

      const portlet = screen.getByTestId('analytics-portlet')
      // Total height = 300, header = 40, padding = 24, content height = 300 - 40 - 24 = 236
      expect(portlet).toHaveAttribute('data-height', '236')
    })

    it('should handle large h values', () => {
      const config = createTestConfig([
        createTestPortlet({ h: 8 }) // 8 * 80 = 640
      ])

      render(<MobileStackedLayout config={config} />)

      const portlet = screen.getByTestId('analytics-portlet')
      // Total height = 640, header = 40, padding = 24, content height = 640 - 40 - 24 = 576
      expect(portlet).toHaveAttribute('data-height', '576')
    })

    it('should not subtract header height when header is hidden', () => {
      const config = createTestConfig([
        createTestPortlet({
          h: 4,
          displayConfig: { hideHeader: true }
        })
      ])

      render(<MobileStackedLayout config={config} />)

      const portlet = screen.getByTestId('analytics-portlet')
      // Total height = 320, no header, padding = 24, content height = 320 - 0 - 24 = 296
      expect(portlet).toHaveAttribute('data-height', '296')
    })
  })

  describe('props forwarding to AnalyticsPortlet', () => {
    it('should pass query to portlet', () => {
      const query = JSON.stringify({ measures: ['Sales.revenue'] })
      const config = createTestConfig([
        createTestPortlet({ query })
      ])

      render(<MobileStackedLayout config={config} />)

      const portlet = screen.getByTestId('analytics-portlet')
      expect(portlet).toHaveAttribute('data-query', query)
    })

    it('should pass chartType to portlet', () => {
      const config = createTestConfig([
        createTestPortlet({ chartType: 'line' })
      ])

      render(<MobileStackedLayout config={config} />)

      const portlet = screen.getByTestId('analytics-portlet')
      expect(portlet).toHaveAttribute('data-chart-type', 'line')
    })

    it('should pass title to portlet', () => {
      const config = createTestConfig([
        createTestPortlet({ title: 'Revenue Chart' })
      ])

      render(<MobileStackedLayout config={config} />)

      const portlet = screen.getByTestId('analytics-portlet')
      expect(portlet).toHaveAttribute('data-title', 'Revenue Chart')
    })

    it('should pass colorPalette prop', () => {
      const config = createTestConfig([createTestPortlet()])
      const colorPalette: ColorPalette = ['#ff0000', '#00ff00', '#0000ff']

      render(
        <MobileStackedLayout
          config={config}
          colorPalette={colorPalette}
        />
      )

      // Verifies component renders without error with colorPalette
      expect(screen.getByTestId('analytics-portlet')).toBeInTheDocument()
    })

    it('should pass dashboardFilters prop', () => {
      const config = createTestConfig([createTestPortlet()])
      const filters: DashboardFilter[] = [
        { id: 'f1', field: 'date', operator: 'inDateRange', values: ['2024-01-01', '2024-12-31'] }
      ]

      render(
        <MobileStackedLayout
          config={config}
          dashboardFilters={filters}
        />
      )

      // Verifies component renders without error with filters
      expect(screen.getByTestId('analytics-portlet')).toBeInTheDocument()
    })

    it('should use portlet eagerLoad when set', () => {
      const config = createTestConfig([
        createTestPortlet({ eagerLoad: true })
      ])

      render(<MobileStackedLayout config={config} />)

      const portlet = screen.getByTestId('analytics-portlet')
      expect(portlet).toHaveAttribute('data-eager-load', 'true')
    })

    it('should use config eagerLoad when portlet eagerLoad not set', () => {
      const config: DashboardConfig = {
        portlets: [createTestPortlet()],
        eagerLoad: true
      }

      render(<MobileStackedLayout config={config} />)

      const portlet = screen.getByTestId('analytics-portlet')
      expect(portlet).toHaveAttribute('data-eager-load', 'true')
    })

    it('should default to false for eagerLoad when not specified', () => {
      const config = createTestConfig([createTestPortlet()])

      render(<MobileStackedLayout config={config} />)

      const portlet = screen.getByTestId('analytics-portlet')
      expect(portlet).toHaveAttribute('data-eager-load', 'false')
    })
  })

  describe('styling', () => {
    it('should have dc:space-y-4 for vertical spacing', () => {
      const config = createTestConfig([createTestPortlet()])

      const { container } = render(<MobileStackedLayout config={config} />)

      const layout = container.querySelector('.mobile-stacked-layout')
      expect(layout?.classList.contains('dc:space-y-4')).toBe(true)
    })

    it('should have dc:px-2 for horizontal padding', () => {
      const config = createTestConfig([createTestPortlet()])

      const { container } = render(<MobileStackedLayout config={config} />)

      const layout = container.querySelector('.mobile-stacked-layout')
      expect(layout?.classList.contains('dc:px-2')).toBe(true)
    })

    it('should apply rounded corners to portlet cards', () => {
      const config = createTestConfig([createTestPortlet()])

      const { container } = render(<MobileStackedLayout config={config} />)

      const portletCard = container.querySelector('[data-portlet-id]')
      expect(portletCard?.classList.contains('dc:rounded-lg')).toBe(true)
    })

    it('should apply border to portlet cards', () => {
      const config = createTestConfig([createTestPortlet()])

      const { container } = render(<MobileStackedLayout config={config} />)

      const portletCard = container.querySelector('[data-portlet-id]')
      expect(portletCard?.classList.contains('dc:border')).toBe(true)
    })
  })

  describe('multiple portlets', () => {
    it('should render many portlets', () => {
      const portlets = Array.from({ length: 10 }, (_, i) =>
        createTestPortlet({ id: `p${i}`, title: `Portlet ${i}`, y: i })
      )
      const config = createTestConfig(portlets)

      render(<MobileStackedLayout config={config} />)

      expect(screen.getAllByTestId('analytics-portlet')).toHaveLength(10)
    })

    it('should maintain correct order for many portlets', () => {
      const portlets = [
        createTestPortlet({ id: 'p5', title: 'Fifth', y: 4 }),
        createTestPortlet({ id: 'p1', title: 'First', y: 0 }),
        createTestPortlet({ id: 'p3', title: 'Third', y: 2 }),
        createTestPortlet({ id: 'p2', title: 'Second', y: 1 }),
        createTestPortlet({ id: 'p4', title: 'Fourth', y: 3 })
      ]
      const config = createTestConfig(portlets)

      render(<MobileStackedLayout config={config} />)

      const renderedPortlets = screen.getAllByTestId('analytics-portlet')
      expect(renderedPortlets[0]).toHaveAttribute('data-title', 'First')
      expect(renderedPortlets[1]).toHaveAttribute('data-title', 'Second')
      expect(renderedPortlets[2]).toHaveAttribute('data-title', 'Third')
      expect(renderedPortlets[3]).toHaveAttribute('data-title', 'Fourth')
      expect(renderedPortlets[4]).toHaveAttribute('data-title', 'Fifth')
    })
  })
})
