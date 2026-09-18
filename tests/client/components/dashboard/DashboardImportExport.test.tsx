/**
 * Tests for the dashboard export add-on (features.dashboardImportExport):
 * toolbar buttons gated by the feature flag and the export download.
 */

import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import DashboardProvider from '../../../../src/client/components/dashboard/DashboardProvider'
import DashboardToolbar from '../../../../src/client/components/dashboard/DashboardToolbar'
import DashboardGridSurface from '../../../../src/client/components/dashboard/DashboardGridSurface'
import DashboardModals from '../../../../src/client/components/dashboard/DashboardModals'
import type { DashboardConfig, PortletConfig, FeaturesConfig } from '../../../../src/client/types'
import type { DashboardExportFile } from '../../../../src/client/utils/dashboardExport'

let mockFeatures: FeaturesConfig = {}

vi.mock('../../../../src/client/providers/CubeProvider', () => ({
  useCubeFeatures: vi.fn(() => ({
    features: mockFeatures,
    dashboardModes: ['grid', 'rows']
  }))
}))

vi.mock('../../../../src/client/providers/CubeFeaturesProvider', () => ({
  useCubeFeatures: vi.fn(() => ({
    features: mockFeatures,
    dashboardModes: ['grid', 'rows'],
    updateFeatures: vi.fn()
  })),
  CubeFeaturesProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

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

vi.mock('react-grid-layout', () => ({
  default: (props: any) => <div data-testid="grid-layout">{props.children}</div>,
  verticalCompactor: { compact: () => [] }
}))

vi.mock('../../../../src/client/hooks/useResponsiveDashboard', () => ({
  useResponsiveDashboard: () => ({
    containerRef: vi.fn(),
    containerWidth: 1200,
    displayMode: 'desktop',
    scaleFactor: 1,
    isEditable: true,
    designWidth: 1200
  })
}))

vi.mock('../../../../src/client/providers/ScrollContainerContext', () => ({
  ScrollContainerProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

vi.mock('../../../../src/client/components/AnalyticsPortlet', () => ({
  default: React.forwardRef((props: any) => <div data-testid="analytics-portlet" data-query={props.query} />)
}))

vi.mock('../../../../src/client/components/PortletFilterConfigModal', () => ({ default: () => null }))
vi.mock('../../../../src/client/components/PortletAnalysisModal', () => ({ default: () => null }))
vi.mock('../../../../src/client/components/TextPortletModal', () => ({ default: () => null }))
vi.mock('../../../../src/client/components/DebugModal', () => ({ default: () => null }))
vi.mock('../../../../src/client/components/ColorPaletteSelector', () => ({
  default: () => <button data-testid="palette-selector">Palette</button>
}))
vi.mock('../../../../src/client/components/DashboardFilterPanel', () => ({
  default: () => <div data-testid="filter-panel" />
}))
vi.mock('../../../../src/client/components/ScaledGridWrapper', () => ({
  default: ({ children }: any) => <div data-testid="scaled-wrapper">{children}</div>
}))
vi.mock('../../../../src/client/components/MobileStackedLayout', () => ({
  default: () => <div data-testid="mobile-layout" />
}))
vi.mock('../../../../src/client/components/FloatingEditToolbar', () => ({
  default: (props: any) => (
    <div data-testid="floating-toolbar">
      {props.canEdit !== false && <button data-testid="floating-edit-toggle" onClick={props.onEditModeToggle}>edit</button>}
      {props.onExportDashboard && <button data-testid="floating-export" onClick={props.onExportDashboard}>export</button>}
    </div>
  )
}))

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

// The import flow runs on TanStack mutations, so the tree needs a QueryClient (CubeProvider supplies it in apps)
function renderDashboard(config: DashboardConfig, props: Partial<React.ComponentProps<typeof DashboardProvider>> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardProvider config={config} editable {...props}>
        <DashboardToolbar />
        <DashboardGridSurface />
        <DashboardModals />
      </DashboardProvider>
    </QueryClientProvider>
  )
}

describe('Dashboard export add-on', () => {
  const originalCreate = URL.createObjectURL
  const originalRevoke = URL.revokeObjectURL

  beforeEach(() => {
    vi.clearAllMocks()
    mockFeatures = { dashboardImportExport: { enabled: true } }
  })

  afterEach(() => {
    URL.createObjectURL = originalCreate
    URL.revokeObjectURL = originalRevoke
    vi.restoreAllMocks()
  })

  it('renders no export controls when the feature is off', () => {
    mockFeatures = {}
    renderDashboard(createTestConfig(2))

    expect(screen.queryByText('Export')).toBeNull()
    expect(screen.queryByTestId('floating-export')).toBeNull()
  })

  it('shows Export in both the edit bar and the floating toolbar, in view and edit mode', async () => {
    renderDashboard(createTestConfig(2))

    expect(screen.getByText('Export')).toBeInTheDocument()
    expect(screen.getByTestId('floating-export')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Edit'))
    expect(await screen.findByText('Finish Editing')).toBeInTheDocument()
    expect(screen.getByText('Export')).toBeInTheDocument()
  })

  it.each([{ editable: false }, { editable: undefined }])('shows only Export on a read-only dashboard (%o)', (props) => {
    renderDashboard(createTestConfig(2), props)

    expect(screen.getByText('Export')).toBeInTheDocument()
    expect(screen.getByTestId('floating-export')).toBeInTheDocument()
    expect(screen.queryByText('Edit')).toBeNull()
    expect(screen.queryByTestId('floating-edit-toggle')).toBeNull()
    expect(screen.queryByText('Add Portlet')).toBeNull()
  })

  it('renders no toolbar on a read-only dashboard when the feature is off', () => {
    mockFeatures = {}
    renderDashboard(createTestConfig(2), { editable: false })

    expect(screen.queryByText('Export')).toBeNull()
    expect(screen.queryByTestId('floating-toolbar')).toBeNull()
    expect(screen.queryByText('Edit')).toBeNull()
  })

  it('renders no toolbar when hideToolbar is set, editable or not', () => {
    const { unmount } = renderDashboard(createTestConfig(2), { hideToolbar: true })
    expect(screen.queryByText('Export')).toBeNull()
    expect(screen.queryByTestId('floating-toolbar')).toBeNull()
    unmount()

    renderDashboard(createTestConfig(2), { editable: false, hideToolbar: true })
    expect(screen.queryByText('Export')).toBeNull()
    expect(screen.queryByTestId('floating-toolbar')).toBeNull()
  })

  it('keeps the edit toggle and edit actions when editable', () => {
    renderDashboard(createTestConfig(2))

    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByTestId('floating-edit-toggle')).toBeInTheDocument()
  })

  it('exports the current config with the dashboard name as a JSON download', async () => {
    const blobs: Blob[] = []
    URL.createObjectURL = vi.fn((blob: Blob) => {
      blobs.push(blob)
      return 'blob:mock'
    })
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    renderDashboard(createTestConfig(2), { dashboardMeta: { name: 'Sales overview', description: 'Weekly' } })
    fireEvent.click(screen.getByText('Export'))

    expect(blobs).toHaveLength(1)
    const file = JSON.parse(await blobs[0].text()) as DashboardExportFile
    expect(file.name).toBe('Sales overview')
    expect(file.description).toBe('Weekly')
    expect(file.config.portlets.map((p) => p.id)).toEqual(['portlet-0', 'portlet-1'])
  })
})
