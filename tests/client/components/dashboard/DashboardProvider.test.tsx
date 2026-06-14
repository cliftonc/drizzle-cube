/**
 * Tests for the composable dashboard pieces (issue #800).
 * Covers: useDashboardContext guard, custom-toolbar control of the state machine,
 * hideToolbar suppression, and standalone composition parity with DashboardGrid.
 */

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DashboardGrid from '../../../../src/client/components/DashboardGrid'
import DashboardProvider from '../../../../src/client/components/dashboard/DashboardProvider'
import DashboardToolbar from '../../../../src/client/components/dashboard/DashboardToolbar'
import DashboardFilterBar from '../../../../src/client/components/dashboard/DashboardFilterBar'
import DashboardGridSurface from '../../../../src/client/components/dashboard/DashboardGridSurface'
import DashboardModals from '../../../../src/client/components/dashboard/DashboardModals'
import { useDashboardContext } from '../../../../src/client/components/dashboard/DashboardContext'
import type { DashboardConfig, PortletConfig } from '../../../../src/client/types'

vi.mock('../../../../src/client/providers/CubeProvider', () => ({
  useCubeFeatures: vi.fn(() => ({
    features: {},
    dashboardModes: ['grid', 'rows']
  }))
}))

vi.mock('../../../../src/client/providers/CubeFeaturesProvider', () => ({
  useCubeFeatures: vi.fn(() => ({
    features: {},
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
  default: (props: any) => {
    return <div data-testid="grid-layout">{props.children}</div>
  },
  verticalCompactor: { compact: () => [] }
}))

let mockResponsiveState = {
  containerRef: vi.fn(),
  containerWidth: 1200,
  displayMode: 'desktop' as const,
  scaleFactor: 1,
  isEditable: true,
  designWidth: 1200
}
vi.mock('../../../../src/client/hooks/useResponsiveDashboard', () => ({
  useResponsiveDashboard: () => mockResponsiveState
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
vi.mock('../../../../src/client/components/ConfirmModal', () => ({ default: () => null }))
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
  default: () => <div data-testid="floating-toolbar" />
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

describe('DashboardProvider / composable pieces', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockResponsiveState = {
      containerRef: vi.fn(),
      containerWidth: 1200,
      displayMode: 'desktop',
      scaleFactor: 1,
      isEditable: true,
      designWidth: 1200
    }
  })

  it('useDashboardContext throws when used outside a DashboardProvider', () => {
    function Orphan() {
      useDashboardContext()
      return null
    }
    // Silence the expected React error boundary console noise
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Orphan />)).toThrow(/must be used within a DashboardProvider/)
    spy.mockRestore()
  })

  it('exposes the edit-mode state machine to a host-supplied custom toolbar', async () => {
    function CustomToolbar() {
      const { isEditMode, actions } = useDashboardContext()
      return (
        <button data-testid="custom-toolbar-btn" onClick={() => actions.toggleEditMode()}>
          {isEditMode ? 'editing' : 'idle'}
        </button>
      )
    }

    const { getByTestId } = render(
      <DashboardProvider config={createTestConfig(2)} editable>
        <CustomToolbar />
        <DashboardGridSurface />
        <DashboardModals />
      </DashboardProvider>
    )

    const button = getByTestId('custom-toolbar-btn')
    expect(button.textContent).toBe('idle')
    fireEvent.click(button)
    await waitFor(() => expect(button.textContent).toBe('editing'))
  })

  it('hideToolbar suppresses both the top bar and the floating toolbar', () => {
    const config = createTestConfig(2)

    const visible = render(
      <DashboardProvider config={config} editable hideToolbar={false}>
        <DashboardToolbar />
      </DashboardProvider>
    )
    expect(visible.queryByText('Edit')).not.toBeNull()
    expect(visible.queryByTestId('floating-toolbar')).not.toBeNull()
    visible.unmount()

    const hidden = render(
      <DashboardProvider config={config} editable hideToolbar>
        <DashboardToolbar />
      </DashboardProvider>
    )
    expect(hidden.queryByText('Edit')).toBeNull()
    expect(hidden.queryByTestId('floating-toolbar')).toBeNull()
  })

  it('standalone composition renders the same surface as DashboardGrid', () => {
    const config = createTestConfig(3)

    const composed = render(
      <DashboardProvider config={config} editable>
        <DashboardToolbar />
        <DashboardFilterBar />
        <DashboardGridSurface />
        <DashboardModals />
      </DashboardProvider>
    )
    expect(composed.queryByTestId('grid-layout')).not.toBeNull()
    expect(composed.queryByTestId('filter-panel')).not.toBeNull()
    expect(composed.queryByText('Edit')).not.toBeNull()
    expect(composed.container.querySelectorAll('[data-testid="analytics-portlet"]').length).toBe(3)
    composed.unmount()

    const grid = render(<DashboardGrid config={config} editable />)
    expect(grid.queryByTestId('grid-layout')).not.toBeNull()
    expect(grid.queryByTestId('filter-panel')).not.toBeNull()
    expect(grid.queryByText('Edit')).not.toBeNull()
    expect(grid.container.querySelectorAll('[data-testid="analytics-portlet"]').length).toBe(3)
  })

  it('DashboardGrid with hideToolbar still renders the grid surface', () => {
    const { queryByText, queryByTestId } = render(
      <DashboardGrid config={createTestConfig(2)} editable hideToolbar />
    )
    expect(queryByText('Edit')).toBeNull()
    expect(queryByTestId('floating-toolbar')).toBeNull()
    expect(queryByTestId('grid-layout')).not.toBeNull()
  })
})
