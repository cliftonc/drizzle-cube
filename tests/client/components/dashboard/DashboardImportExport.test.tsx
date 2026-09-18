/**
 * Tests for the dashboard import/export add-on (features.dashboardImportExport):
 * the edit-bar buttons gated by the feature flag, Export offered only for a dashboard
 * with portlets and outside edit mode, Import only for a still-empty one while editing,
 * export download, import confirm
 * flow through onConfigChange/onSave/onDashboardMetaChange, error dialog, and the
 * empty-state import button.
 */

import React from 'react'
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import DashboardProvider from '../../../../src/client/components/dashboard/DashboardProvider'
import DashboardToolbar from '../../../../src/client/components/dashboard/DashboardToolbar'
import DashboardGridSurface from '../../../../src/client/components/dashboard/DashboardGridSurface'
import DashboardModals from '../../../../src/client/components/dashboard/DashboardModals'
import {
  createDashboardExport,
  serializeDashboardExport,
} from '../../../../src/client/utils/dashboardExport'
import type { DashboardExportFile } from '../../../../src/client/utils/dashboardExport'
import type { DashboardConfig, PortletConfig, FeaturesConfig } from '../../../../src/client/types'

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
      {props.onImportDashboard && <button data-testid="floating-import" onClick={props.onImportDashboard}>import</button>}
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

function importedFile(name = 'Imported dashboard') {
  const config: DashboardConfig = {
    portlets: [
      {
        id: 'imported-1',
        title: 'Imported portlet',
        analysisConfig: {
          version: 1,
          analysisType: 'query',
          activeView: 'chart',
          charts: { query: { chartType: 'line', chartConfig: {}, displayConfig: {} } },
          query: { measures: ['Sales.total'], dimensions: [] },
        },
        x: 0,
        y: 0,
        w: 12,
        h: 4,
      },
    ],
    layoutMode: 'grid',
  }
  const file = createDashboardExport(config, { name, description: 'From a file' })
  return {
    config: file.config,
    file: new File([serializeDashboardExport(file)], 'sales.json', { type: 'application/json' }),
  }
}

/** The edit-bar Export button (the floating toolbar's is a test id). */
function editBarExportButton() {
  return screen.queryByRole('button', { name: 'Export' })
}

function pickFile(file: File) {
  const inputs = screen.getAllByTestId('dashboard-import-file-input')
  fireEvent.change(inputs[0], { target: { files: [file] } })
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

describe('Dashboard import / export add-on', () => {
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

  it('renders no export/import controls when the feature is off', () => {
    mockFeatures = {}
    renderDashboard(createTestConfig(2))

    expect(editBarExportButton()).toBeNull()
    expect(screen.queryByText('Import')).toBeNull()
    expect(screen.queryByTestId('floating-export')).toBeNull()
    expect(screen.queryByTestId('dashboard-import-file-input')).toBeNull()
  })

  it('offers only Export on a dashboard with portlets, never Import', async () => {
    renderDashboard(createTestConfig(2))

    expect(editBarExportButton()).toBeInTheDocument()
    expect(screen.getByTestId('floating-export')).toBeInTheDocument()
    expect(screen.queryByTestId('floating-import')).toBeNull()

    // Editing a populated dashboard offers neither: Export is hidden while editing
    fireEvent.click(screen.getByText('Edit'))
    await waitFor(() => expect(screen.getByText('Add Portlet')).toBeInTheDocument())
    expect(editBarExportButton()).toBeNull()
    expect(screen.queryByTestId('floating-export')).toBeNull()
    expect(screen.queryByText('Import')).toBeNull()
    expect(screen.queryByTestId('floating-import')).toBeNull()
    expect(screen.queryByTestId('dashboard-import-file-input')).toBeNull()
  })

  it('offers only Import on an empty dashboard while editing, never Export', async () => {
    renderDashboard({ portlets: [] })

    // Nothing to export, so the edit bar carries no export button
    expect(editBarExportButton()).toBeNull()
    expect(screen.queryByTestId('floating-export')).toBeNull()

    fireEvent.click(screen.getByText('Edit'))
    await waitFor(() => expect(screen.getByTestId('floating-import')).toBeInTheDocument())
    expect(screen.getAllByRole('button', { name: 'Import' }).length).toBeGreaterThan(0)
    expect(editBarExportButton()).toBeNull()
  })

  it.each([{ editable: false }, { editable: undefined }])('shows only Export on a read-only dashboard (%o)', (props) => {
    renderDashboard(createTestConfig(2), props)

    expect(editBarExportButton()).toBeInTheDocument()
    expect(screen.queryByText('Import')).toBeNull()
    expect(screen.getByTestId('floating-export')).toBeInTheDocument()
    expect(screen.queryByText('Edit')).toBeNull()
    expect(screen.queryByTestId('floating-edit-toggle')).toBeNull()
    expect(screen.queryByText('Add Portlet')).toBeNull()
  })

  it('renders no toolbar on a read-only dashboard when the feature is off', () => {
    mockFeatures = {}
    renderDashboard(createTestConfig(2), { editable: false })

    expect(editBarExportButton()).toBeNull()
    expect(screen.queryByTestId('floating-toolbar')).toBeNull()
    expect(screen.queryByText('Edit')).toBeNull()
  })

  it('renders no toolbar when hideToolbar is set, editable or not', () => {
    const { unmount } = renderDashboard(createTestConfig(2), { hideToolbar: true })
    expect(editBarExportButton()).toBeNull()
    expect(screen.queryByTestId('floating-toolbar')).toBeNull()
    unmount()

    renderDashboard(createTestConfig(2), { editable: false, hideToolbar: true })
    expect(editBarExportButton()).toBeNull()
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
    fireEvent.click(editBarExportButton()!)

    expect(blobs).toHaveLength(1)
    const file = JSON.parse(await blobs[0].text()) as DashboardExportFile
    expect(file.name).toBe('Sales overview')
    expect(file.description).toBe('Weekly')
    expect(file.config.portlets.map((p) => p.id)).toEqual(['portlet-0', 'portlet-1'])
  })

  it('imports a file after confirmation, saving the config and renaming via onDashboardMetaChange', async () => {
    const onConfigChange = vi.fn()
    const onSave = vi.fn().mockResolvedValue(undefined)
    const onDashboardMetaChange = vi.fn().mockResolvedValue(undefined)
    const { config, file } = importedFile('Imported dashboard')

    renderDashboard({ portlets: [] }, { onConfigChange, onSave, onDashboardMetaChange })

    await act(async () => {
      pickFile(file)
    })

    await waitFor(() => expect(screen.getByText('Import dashboard')).toBeInTheDocument())
    expect(screen.getByText(/1 portlets in "sales.json"/)).toBeInTheDocument()
    expect(screen.getByText(/renamed to "Imported dashboard"/)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Replace dashboard'))

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    expect(onConfigChange).toHaveBeenCalledWith(config)
    expect(onSave).toHaveBeenCalledWith(config)
    await waitFor(() =>
      expect(onDashboardMetaChange).toHaveBeenCalledWith({ name: 'Imported dashboard', description: 'From a file' })
    )
    await waitFor(() => expect(screen.queryByText('Import dashboard')).toBeNull())
  })

  it('does not mention renaming when the host gave no onDashboardMetaChange', async () => {
    const onConfigChange = vi.fn()
    const { file } = importedFile()

    renderDashboard({ portlets: [] }, { onConfigChange })

    await act(async () => {
      pickFile(file)
    })

    await waitFor(() => expect(screen.getByText('Import dashboard')).toBeInTheDocument())
    expect(screen.queryByText(/renamed to/)).toBeNull()

    fireEvent.click(screen.getByText('Cancel'))
    await waitFor(() => expect(screen.queryByText('Import dashboard')).toBeNull())
    expect(onConfigChange).not.toHaveBeenCalled()
  })

  it('shows the error dialog for a file that is not a dashboard export', async () => {
    const onConfigChange = vi.fn()
    renderDashboard({ portlets: [] }, { onConfigChange })

    await act(async () => {
      pickFile(new File(['{"hello": "world"}'], 'notes.json', { type: 'application/json' }))
    })

    await waitFor(() => expect(screen.getByText('Could not import dashboard')).toBeInTheDocument())
    expect(screen.getByText('The file is not a drizzle-cube dashboard export.')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Close'))
    await waitFor(() => expect(screen.queryByText('Could not import dashboard')).toBeNull())
    expect(onConfigChange).not.toHaveBeenCalled()
  })

  it('offers Import on an empty editable dashboard', async () => {
    const onConfigChange = vi.fn()
    const { config, file } = importedFile()

    renderDashboard({ portlets: [] }, { onConfigChange })
    expect(screen.getByText('Import')).toBeInTheDocument()

    await act(async () => {
      pickFile(file)
    })
    await waitFor(() => expect(screen.getByText('Import dashboard')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Replace dashboard'))
    await waitFor(() => expect(onConfigChange).toHaveBeenCalledWith(config))
  })

  it('hides the empty-state Import when the feature is off', () => {
    mockFeatures = {}
    renderDashboard({ portlets: [] })
    expect(screen.queryByText('Import')).toBeNull()
  })

  it('hides Export while editing a populated dashboard', async () => {
    renderDashboard(createTestConfig(1))
    expect(editBarExportButton()).toBeInTheDocument()

    fireEvent.click(screen.getByText('Edit'))
    await waitFor(() => expect(screen.getByText('Add Portlet')).toBeInTheDocument())
    expect(editBarExportButton()).toBeNull()
    expect(screen.queryByTestId('floating-export')).toBeNull()

    // Leaving edit mode brings it back
    fireEvent.click(screen.getByText('Finish Editing'))
    await waitFor(() => expect(editBarExportButton()).toBeInTheDocument())
  })
})
