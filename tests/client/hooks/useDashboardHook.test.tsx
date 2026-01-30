import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import React, { type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CubeProvider } from '../../../src/client/providers/CubeProvider'
import { DashboardStoreProvider } from '../../../src/client/stores/dashboardStore'
import { useDashboard } from '../../../src/client/hooks/useDashboardHook'
import type { DashboardConfig, PortletConfig, DashboardGridSettings, DashboardFilter } from '../../../src/client/types'

// ============================================================================
// Test Utilities
// ============================================================================

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface WrapperProps {
  children: ReactNode
}

function createDashboardWrapper(options: { features?: Record<string, boolean | object> } = {}) {
  const queryClient = createTestQueryClient()

  const wrapper = ({ children }: WrapperProps) => (
    <QueryClientProvider client={queryClient}>
      <CubeProvider
        apiOptions={{ apiUrl: '/api/cubejs-api/v1' }}
        features={options.features}
        queryClient={queryClient}
        enableBatching={false}
      >
        <DashboardStoreProvider>
          {children}
        </DashboardStoreProvider>
      </CubeProvider>
    </QueryClientProvider>
  )

  return { wrapper, queryClient }
}

// ============================================================================
// Test Data
// ============================================================================

const mockGridSettings: DashboardGridSettings = {
  cols: 12,
  rowHeight: 80,
  minW: 2,
  minH: 2,
  margin: [10, 10],
  containerPadding: [10, 10],
}

const mockPortlet: PortletConfig = {
  id: 'portlet-1',
  title: 'Test Chart',
  query: JSON.stringify({ measures: ['Employees.count'] }),
  chartType: 'bar',
  w: 6,
  h: 4,
  x: 0,
  y: 0,
}

const mockPortlet2: PortletConfig = {
  id: 'portlet-2',
  title: 'Second Chart',
  query: JSON.stringify({ measures: ['Employees.totalSalary'] }),
  chartType: 'line',
  w: 6,
  h: 4,
  x: 6,
  y: 0,
}

const mockConfig: DashboardConfig = {
  id: 'test-dashboard',
  name: 'Test Dashboard',
  portlets: [mockPortlet],
  layoutMode: 'grid',
}

const mockConfigWithMultiplePortlets: DashboardConfig = {
  id: 'test-dashboard',
  name: 'Test Dashboard',
  portlets: [mockPortlet, mockPortlet2],
  layoutMode: 'grid',
}

const mockDashboardFilters: DashboardFilter[] = [
  {
    id: 'filter-1',
    dimension: 'Employees.department',
    label: 'Department',
    type: 'single',
  },
  {
    id: 'filter-2',
    dimension: 'Employees.status',
    label: 'Status',
    type: 'multi',
  },
]

// ============================================================================
// Tests
// ============================================================================

describe('useDashboardHook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // Initial State Tests
  // ==========================================================================

  describe('initial state', () => {
    it('should start in view mode (not edit mode)', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      expect(result.current.isEditMode).toBe(false)
    })

    it('should have no selected filter initially', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      expect(result.current.selectedFilterId).toBeNull()
      expect(result.current.selectedFilter).toBeNull()
    })

    it('should have portlet modal closed initially', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      expect(result.current.isPortletModalOpen).toBe(false)
      expect(result.current.editingPortlet).toBeNull()
    })

    it('should have filter config modal closed initially', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      expect(result.current.isFilterConfigModalOpen).toBe(false)
      expect(result.current.filterConfigPortlet).toBeNull()
    })

    it('should have no delete confirmation active initially', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      expect(result.current.deleteConfirmPortletId).toBeNull()
    })

    it('should not be dragging initially', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      expect(result.current.isDraggingPortlet).toBe(false)
      expect(result.current.draftRows).toBeNull()
    })

    it('should not be initialized initially', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      expect(result.current.isInitialized).toBe(false)
    })

    it('should have empty debug data initially', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      expect(result.current.debugData).toEqual({})
    })
  })

  // ==========================================================================
  // Edit Mode Tests
  // ==========================================================================

  describe('edit mode management', () => {
    it('should enter edit mode', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, editable: true, gridSettings: mockGridSettings }),
        { wrapper }
      )

      act(() => {
        result.current.actions.enterEditMode()
      })

      expect(result.current.isEditMode).toBe(true)
    })

    it('should exit edit mode', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, editable: true, gridSettings: mockGridSettings }),
        { wrapper }
      )

      act(() => {
        result.current.actions.enterEditMode()
      })

      expect(result.current.isEditMode).toBe(true)

      act(() => {
        result.current.actions.exitEditMode()
      })

      expect(result.current.isEditMode).toBe(false)
    })

    it('should toggle edit mode', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, editable: true, gridSettings: mockGridSettings }),
        { wrapper }
      )

      expect(result.current.isEditMode).toBe(false)

      act(() => {
        result.current.actions.toggleEditMode()
      })

      expect(result.current.isEditMode).toBe(true)

      act(() => {
        result.current.actions.toggleEditMode()
      })

      expect(result.current.isEditMode).toBe(false)
    })

    it('should not toggle edit mode when not responsive editable', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          editable: true,
          gridSettings: mockGridSettings,
          isResponsiveEditable: false,
        }),
        { wrapper }
      )

      act(() => {
        result.current.actions.toggleEditMode()
      })

      // Should remain in view mode
      expect(result.current.isEditMode).toBe(false)
    })
  })

  // ==========================================================================
  // Computed Values Tests
  // ==========================================================================

  describe('computed values', () => {
    it('should compute canEdit correctly when in edit mode', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, editable: true, gridSettings: mockGridSettings }),
        { wrapper }
      )

      // Not editable when not in edit mode
      expect(result.current.canEdit).toBe(false)

      act(() => {
        result.current.actions.enterEditMode()
      })

      expect(result.current.canEdit).toBe(true)
    })

    it('should compute canEdit as false when not editable', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, editable: false, gridSettings: mockGridSettings }),
        { wrapper }
      )

      act(() => {
        result.current.actions.enterEditMode()
      })

      // Still not editable because editable prop is false
      expect(result.current.canEdit).toBe(false)
    })

    it('should compute canEdit as false when filter is selected', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          editable: true,
          dashboardFilters: mockDashboardFilters,
          gridSettings: mockGridSettings,
        }),
        { wrapper }
      )

      act(() => {
        result.current.actions.enterEditMode()
        result.current.actions.selectFilter('filter-1')
      })

      // Not editable when in filter selection mode
      expect(result.current.canEdit).toBe(false)
    })

    it('should compute selectedFilter correctly', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          dashboardFilters: mockDashboardFilters,
          gridSettings: mockGridSettings,
        }),
        { wrapper }
      )

      act(() => {
        result.current.actions.selectFilter('filter-1')
      })

      expect(result.current.selectedFilter).toEqual(mockDashboardFilters[0])
    })

    it('should return null selectedFilter when no filter selected', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          dashboardFilters: mockDashboardFilters,
          gridSettings: mockGridSettings,
        }),
        { wrapper }
      )

      expect(result.current.selectedFilter).toBeNull()
    })

    it('should compute allowedModes from props', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          gridSettings: mockGridSettings,
          allowedModes: ['grid'],
        }),
        { wrapper }
      )

      expect(result.current.allowedModes).toEqual(['grid'])
    })

    it('should default allowedModes to rows and grid', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      expect(result.current.allowedModes).toEqual(['rows', 'grid'])
    })

    it('should compute layoutMode from config', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: { ...mockConfig, layoutMode: 'rows' },
          gridSettings: mockGridSettings,
        }),
        { wrapper }
      )

      expect(result.current.layoutMode).toBe('rows')
    })

    it('should fall back to allowed mode when config mode not allowed', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: { ...mockConfig, layoutMode: 'grid' },
          gridSettings: mockGridSettings,
          allowedModes: ['rows'],
        }),
        { wrapper }
      )

      expect(result.current.layoutMode).toBe('rows')
    })

    it('should compute canChangeLayoutMode correctly', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          editable: true,
          gridSettings: mockGridSettings,
          allowedModes: ['rows', 'grid'],
        }),
        { wrapper }
      )

      // Not in edit mode
      expect(result.current.canChangeLayoutMode).toBe(false)

      act(() => {
        result.current.actions.enterEditMode()
      })

      expect(result.current.canChangeLayoutMode).toBe(true)
    })

    it('should not allow layout mode change with single mode', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          editable: true,
          gridSettings: mockGridSettings,
          allowedModes: ['grid'],
        }),
        { wrapper }
      )

      act(() => {
        result.current.actions.enterEditMode()
      })

      expect(result.current.canChangeLayoutMode).toBe(false)
    })
  })

  // ==========================================================================
  // Modal Management Tests
  // ==========================================================================

  describe('modal management', () => {
    it('should open add portlet modal', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      act(() => {
        result.current.actions.openAddPortlet()
      })

      expect(result.current.isPortletModalOpen).toBe(true)
      expect(result.current.editingPortlet).toBeNull()
    })

    it('should open edit portlet modal with portlet', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      act(() => {
        result.current.actions.openEditPortlet(mockPortlet)
      })

      expect(result.current.isPortletModalOpen).toBe(true)
      expect(result.current.editingPortlet).toEqual(mockPortlet)
    })

    it('should close portlet modal', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      act(() => {
        result.current.actions.openAddPortlet()
      })

      expect(result.current.isPortletModalOpen).toBe(true)

      act(() => {
        result.current.actions.closePortletModal()
      })

      expect(result.current.isPortletModalOpen).toBe(false)
    })

    it('should open filter config modal', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      act(() => {
        result.current.actions.openFilterConfig(mockPortlet)
      })

      expect(result.current.isFilterConfigModalOpen).toBe(true)
      expect(result.current.filterConfigPortlet).toEqual(mockPortlet)
    })

    it('should close filter config modal', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      act(() => {
        result.current.actions.openFilterConfig(mockPortlet)
      })

      act(() => {
        result.current.actions.closeFilterConfig()
      })

      expect(result.current.isFilterConfigModalOpen).toBe(false)
      expect(result.current.filterConfigPortlet).toBeNull()
    })
  })

  // ==========================================================================
  // Filter Selection Tests
  // ==========================================================================

  describe('filter selection', () => {
    it('should select a filter', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          dashboardFilters: mockDashboardFilters,
          gridSettings: mockGridSettings,
        }),
        { wrapper }
      )

      act(() => {
        result.current.actions.selectFilter('filter-1')
      })

      expect(result.current.selectedFilterId).toBe('filter-1')
    })

    it('should toggle filter selection off when same filter selected', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          dashboardFilters: mockDashboardFilters,
          gridSettings: mockGridSettings,
        }),
        { wrapper }
      )

      act(() => {
        result.current.actions.selectFilter('filter-1')
      })

      expect(result.current.selectedFilterId).toBe('filter-1')

      act(() => {
        result.current.actions.selectFilter('filter-1')
      })

      expect(result.current.selectedFilterId).toBeNull()
    })

    it('should switch to different filter', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          dashboardFilters: mockDashboardFilters,
          gridSettings: mockGridSettings,
        }),
        { wrapper }
      )

      act(() => {
        result.current.actions.selectFilter('filter-1')
      })

      act(() => {
        result.current.actions.selectFilter('filter-2')
      })

      expect(result.current.selectedFilterId).toBe('filter-2')
    })

    it('should exit filter selection mode', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          dashboardFilters: mockDashboardFilters,
          gridSettings: mockGridSettings,
        }),
        { wrapper }
      )

      act(() => {
        result.current.actions.selectFilter('filter-1')
      })

      act(() => {
        result.current.actions.exitFilterSelectionMode()
      })

      expect(result.current.selectedFilterId).toBeNull()
    })
  })

  // ==========================================================================
  // Delete Confirmation Tests
  // ==========================================================================

  describe('delete confirmation', () => {
    it('should open delete confirmation', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      act(() => {
        result.current.actions.openDeleteConfirm('portlet-1')
      })

      expect(result.current.deleteConfirmPortletId).toBe('portlet-1')
    })

    it('should close delete confirmation', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      act(() => {
        result.current.actions.openDeleteConfirm('portlet-1')
      })

      act(() => {
        result.current.actions.closeDeleteConfirm()
      })

      expect(result.current.deleteConfirmPortletId).toBeNull()
    })

    it('should confirm delete and call onConfigChange', async () => {
      const onConfigChange = vi.fn()
      const onSave = vi.fn().mockResolvedValue(undefined)
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          gridSettings: mockGridSettings,
          onConfigChange,
          onSave,
        }),
        { wrapper }
      )

      act(() => {
        result.current.actions.openDeleteConfirm('portlet-1')
      })

      await act(async () => {
        await result.current.actions.confirmDelete()
      })

      expect(onConfigChange).toHaveBeenCalled()
      expect(result.current.deleteConfirmPortletId).toBeNull()
    })

    it('should not confirm delete when no portlet selected', async () => {
      const onConfigChange = vi.fn()
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          gridSettings: mockGridSettings,
          onConfigChange,
        }),
        { wrapper }
      )

      await act(async () => {
        await result.current.actions.confirmDelete()
      })

      expect(onConfigChange).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Layout State Tests
  // ==========================================================================

  describe('layout state', () => {
    it('should set draft rows', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      const draftRows = [{ id: 'row-1', h: 4, columns: [{ portletId: 'portlet-1', w: 12 }] }]

      act(() => {
        result.current.actions.setDraftRows(draftRows)
      })

      expect(result.current.draftRows).toEqual(draftRows)
    })

    it('should clear draft rows', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      act(() => {
        result.current.actions.setDraftRows([{ id: 'row-1', h: 4, columns: [] }])
      })

      act(() => {
        result.current.actions.setDraftRows(null)
      })

      expect(result.current.draftRows).toBeNull()
    })

    it('should set dragging state', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      act(() => {
        result.current.actions.setIsDraggingPortlet(true)
      })

      expect(result.current.isDraggingPortlet).toBe(true)
    })

    it('should set initialized state', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      act(() => {
        result.current.actions.setIsInitialized(true)
      })

      expect(result.current.isInitialized).toBe(true)
    })

    it('should set last known layout', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      const layout = [{ i: 'portlet-1', x: 0, y: 0, w: 6, h: 4 }]

      act(() => {
        result.current.actions.setLastKnownLayout(layout)
      })

      expect(result.current.lastKnownLayout).toEqual(layout)
    })

    it('should set and clear drag state', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      const dragState = { rowIndex: 0, colIndex: 0, portletId: 'portlet-1' }

      act(() => {
        result.current.actions.setDragState(dragState)
      })

      // Note: dragState is internal to the store, we can verify via clearDragState behavior
      act(() => {
        result.current.actions.clearDragState()
      })

      expect(result.current.isDraggingPortlet).toBe(false)
    })
  })

  // ==========================================================================
  // Layout Change Detection Tests
  // ==========================================================================

  describe('layout change detection', () => {
    it('should detect layout changes', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      const initialLayout = [{ i: 'portlet-1', x: 0, y: 0, w: 6, h: 4 }]

      act(() => {
        result.current.actions.setIsInitialized(true)
        result.current.actions.setLastKnownLayout(initialLayout)
      })

      const newLayout = [{ i: 'portlet-1', x: 2, y: 0, w: 6, h: 4 }]

      expect(result.current.actions.hasLayoutActuallyChanged(newLayout)).toBe(true)
    })

    it('should detect no change when layout is the same', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      const layout = [{ i: 'portlet-1', x: 0, y: 0, w: 6, h: 4 }]

      act(() => {
        result.current.actions.setIsInitialized(true)
        result.current.actions.setLastKnownLayout(layout)
      })

      expect(result.current.actions.hasLayoutActuallyChanged(layout)).toBe(false)
    })

    it('should return false when not initialized', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      const newLayout = [{ i: 'portlet-1', x: 2, y: 0, w: 6, h: 4 }]

      expect(result.current.actions.hasLayoutActuallyChanged(newLayout)).toBe(false)
    })
  })

  // ==========================================================================
  // Portlet CRUD Tests
  // ==========================================================================

  describe('portlet CRUD operations', () => {
    it('should save new portlet and call onConfigChange', async () => {
      const onConfigChange = vi.fn()
      const onSave = vi.fn().mockResolvedValue(undefined)
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          gridSettings: mockGridSettings,
          onConfigChange,
          onSave,
        }),
        { wrapper }
      )

      const newPortletData = {
        title: 'New Chart',
        query: JSON.stringify({ measures: ['Employees.avgSalary'] }),
        chartType: 'line' as const,
        w: 6,
        h: 4,
      }

      await act(async () => {
        const portletId = await result.current.actions.savePortlet(newPortletData)
        expect(portletId).not.toBeNull()
      })

      expect(onConfigChange).toHaveBeenCalled()
      const newConfig = onConfigChange.mock.calls[0][0] as DashboardConfig
      expect(newConfig.portlets.length).toBe(2)
    })

    it('should update existing portlet when editingPortlet is set', async () => {
      const onConfigChange = vi.fn()
      const onSave = vi.fn().mockResolvedValue(undefined)
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          gridSettings: mockGridSettings,
          onConfigChange,
          onSave,
        }),
        { wrapper }
      )

      // Open edit modal first
      act(() => {
        result.current.actions.openEditPortlet(mockPortlet)
      })

      const updatedPortlet = {
        ...mockPortlet,
        title: 'Updated Chart Title',
      }

      await act(async () => {
        await result.current.actions.savePortlet(updatedPortlet)
      })

      expect(onConfigChange).toHaveBeenCalled()
      const newConfig = onConfigChange.mock.calls[0][0] as DashboardConfig
      expect(newConfig.portlets[0].title).toBe('Updated Chart Title')
    })

    it('should delete portlet via deletePortlet action', async () => {
      const onConfigChange = vi.fn()
      const onSave = vi.fn().mockResolvedValue(undefined)
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfigWithMultiplePortlets,
          gridSettings: mockGridSettings,
          onConfigChange,
          onSave,
        }),
        { wrapper }
      )

      // deletePortlet opens confirmation modal
      await act(async () => {
        await result.current.actions.deletePortlet('portlet-1')
      })

      expect(result.current.deleteConfirmPortletId).toBe('portlet-1')

      // Confirm the delete
      await act(async () => {
        await result.current.actions.confirmDelete()
      })

      expect(onConfigChange).toHaveBeenCalled()
      const newConfig = onConfigChange.mock.calls[0][0] as DashboardConfig
      expect(newConfig.portlets.length).toBe(1)
      expect(newConfig.portlets[0].id).toBe('portlet-2')
    })

    it('should duplicate portlet', async () => {
      const onConfigChange = vi.fn()
      const onSave = vi.fn().mockResolvedValue(undefined)
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          gridSettings: mockGridSettings,
          onConfigChange,
          onSave,
        }),
        { wrapper }
      )

      await act(async () => {
        const newId = await result.current.actions.duplicatePortlet('portlet-1')
        expect(newId).toBeDefined()
      })

      expect(onConfigChange).toHaveBeenCalled()
      const newConfig = onConfigChange.mock.calls[0][0] as DashboardConfig
      expect(newConfig.portlets.length).toBe(2)
      expect(newConfig.portlets[1].title).toBe('Test Chart Duplicated')
    })

    it('should not duplicate non-existent portlet', async () => {
      const onConfigChange = vi.fn()
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          gridSettings: mockGridSettings,
          onConfigChange,
        }),
        { wrapper }
      )

      await act(async () => {
        const newId = await result.current.actions.duplicatePortlet('non-existent')
        expect(newId).toBeUndefined()
      })

      expect(onConfigChange).not.toHaveBeenCalled()
    })

    it('should not perform CRUD without onConfigChange', async () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          gridSettings: mockGridSettings,
          // No onConfigChange provided
        }),
        { wrapper }
      )

      await act(async () => {
        const portletId = await result.current.actions.savePortlet({
          title: 'Test',
          query: '{}',
          chartType: 'bar',
          w: 6,
          h: 4,
        })
        expect(portletId).toBeNull()
      })
    })
  })

  // ==========================================================================
  // Filter Operations Tests
  // ==========================================================================

  describe('filter operations', () => {
    it('should toggle filter for portlet', async () => {
      const onConfigChange = vi.fn()
      const onSave = vi.fn().mockResolvedValue(undefined)
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          dashboardFilters: mockDashboardFilters,
          gridSettings: mockGridSettings,
          onConfigChange,
          onSave,
        }),
        { wrapper }
      )

      await act(async () => {
        await result.current.actions.toggleFilterForPortlet('portlet-1', 'filter-1')
      })

      expect(onConfigChange).toHaveBeenCalled()
      const newConfig = onConfigChange.mock.calls[0][0] as DashboardConfig
      expect(newConfig.portlets[0].dashboardFilterMapping).toContain('filter-1')
    })

    it('should remove filter from portlet when toggled twice', async () => {
      const configWithFilter: DashboardConfig = {
        ...mockConfig,
        portlets: [{
          ...mockPortlet,
          dashboardFilterMapping: ['filter-1'],
        }],
      }

      const onConfigChange = vi.fn()
      const onSave = vi.fn().mockResolvedValue(undefined)
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: configWithFilter,
          dashboardFilters: mockDashboardFilters,
          gridSettings: mockGridSettings,
          onConfigChange,
          onSave,
        }),
        { wrapper }
      )

      await act(async () => {
        await result.current.actions.toggleFilterForPortlet('portlet-1', 'filter-1')
      })

      expect(onConfigChange).toHaveBeenCalled()
      const newConfig = onConfigChange.mock.calls[0][0] as DashboardConfig
      expect(newConfig.portlets[0].dashboardFilterMapping).not.toContain('filter-1')
    })

    it('should select all portlets for a filter', async () => {
      const onConfigChange = vi.fn()
      const onSave = vi.fn().mockResolvedValue(undefined)
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfigWithMultiplePortlets,
          dashboardFilters: mockDashboardFilters,
          gridSettings: mockGridSettings,
          onConfigChange,
          onSave,
        }),
        { wrapper }
      )

      await act(async () => {
        await result.current.actions.selectAllForFilter('filter-1')
      })

      expect(onConfigChange).toHaveBeenCalled()
      const newConfig = onConfigChange.mock.calls[0][0] as DashboardConfig
      expect(newConfig.portlets[0].dashboardFilterMapping).toContain('filter-1')
      expect(newConfig.portlets[1].dashboardFilterMapping).toContain('filter-1')
    })

    it('should save filter config for portlet', async () => {
      const onConfigChange = vi.fn()
      const onSave = vi.fn().mockResolvedValue(undefined)
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          dashboardFilters: mockDashboardFilters,
          gridSettings: mockGridSettings,
          onConfigChange,
          onSave,
        }),
        { wrapper }
      )

      // Open filter config modal first
      act(() => {
        result.current.actions.openFilterConfig(mockPortlet)
      })

      await act(async () => {
        await result.current.actions.saveFilterConfig(['filter-1', 'filter-2'])
      })

      expect(onConfigChange).toHaveBeenCalled()
      const newConfig = onConfigChange.mock.calls[0][0] as DashboardConfig
      expect(newConfig.portlets[0].dashboardFilterMapping).toEqual(['filter-1', 'filter-2'])
    })
  })

  // ==========================================================================
  // Config Operations Tests
  // ==========================================================================

  describe('config operations', () => {
    it('should handle palette change', async () => {
      const onConfigChange = vi.fn()
      const onSave = vi.fn().mockResolvedValue(undefined)
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          gridSettings: mockGridSettings,
          onConfigChange,
          onSave,
        }),
        { wrapper }
      )

      await act(async () => {
        await result.current.actions.handlePaletteChange('sunset')
      })

      expect(onConfigChange).toHaveBeenCalled()
      const newConfig = onConfigChange.mock.calls[0][0] as DashboardConfig
      expect(newConfig.colorPalette).toBe('sunset')
    })

    it('should call onSave when palette changes', async () => {
      const onConfigChange = vi.fn()
      const onSave = vi.fn().mockResolvedValue(undefined)
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          gridSettings: mockGridSettings,
          onConfigChange,
          onSave,
        }),
        { wrapper }
      )

      await act(async () => {
        await result.current.actions.handlePaletteChange('ocean')
      })

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled()
      })
    })
  })

  // ==========================================================================
  // Debug Data Tests
  // ==========================================================================

  describe('debug data', () => {
    it('should set debug data for a portlet', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      const debugEntry = {
        chartConfig: { xAxis: ['Employees.name'], yAxis: ['Employees.count'] },
        displayConfig: { showLegend: true },
        queryObject: { measures: ['Employees.count'] },
        data: [{ 'Employees.count': 10 }],
        chartType: 'bar' as const,
      }

      act(() => {
        result.current.actions.setDebugData('portlet-1', debugEntry)
      })

      expect(result.current.debugData['portlet-1']).toEqual(debugEntry)
    })

    it('should clear debug data for a specific portlet', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      const debugEntry = {
        chartConfig: {},
        displayConfig: {},
        queryObject: null,
        data: [],
        chartType: 'bar' as const,
      }

      act(() => {
        result.current.actions.setDebugData('portlet-1', debugEntry)
        result.current.actions.setDebugData('portlet-2', debugEntry)
      })

      act(() => {
        result.current.actions.clearDebugData('portlet-1')
      })

      expect(result.current.debugData['portlet-1']).toBeUndefined()
      expect(result.current.debugData['portlet-2']).toBeDefined()
    })

    it('should clear all debug data when no portletId specified', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({ config: mockConfig, gridSettings: mockGridSettings }),
        { wrapper }
      )

      const debugEntry = {
        chartConfig: {},
        displayConfig: {},
        queryObject: null,
        data: [],
        chartType: 'bar' as const,
      }

      act(() => {
        result.current.actions.setDebugData('portlet-1', debugEntry)
        result.current.actions.setDebugData('portlet-2', debugEntry)
      })

      act(() => {
        result.current.actions.clearDebugData()
      })

      expect(result.current.debugData).toEqual({})
    })
  })

  // ==========================================================================
  // Refresh Portlet Tests
  // ==========================================================================

  describe('refresh portlet', () => {
    it('should call portletComponentRefs refresh method', () => {
      const mockRefresh = vi.fn()
      const portletComponentRefs = {
        current: {
          'portlet-1': { refresh: mockRefresh },
        },
      }

      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          gridSettings: mockGridSettings,
          portletComponentRefs: portletComponentRefs as React.MutableRefObject<Record<string, { refresh: (options?: { bustCache?: boolean }) => void } | null>>,
        }),
        { wrapper }
      )

      act(() => {
        result.current.actions.refreshPortlet('portlet-1')
      })

      expect(mockRefresh).toHaveBeenCalled()
    })

    it('should call onPortletRefresh callback', () => {
      const onPortletRefresh = vi.fn()

      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          gridSettings: mockGridSettings,
          onPortletRefresh,
        }),
        { wrapper }
      )

      act(() => {
        result.current.actions.refreshPortlet('portlet-1', { bustCache: true })
      })

      expect(onPortletRefresh).toHaveBeenCalledWith('portlet-1', { bustCache: true })
    })
  })

  // ==========================================================================
  // Layout Mode Change Tests
  // ==========================================================================

  describe('layout mode change', () => {
    it('should change layout mode and call onConfigChange', async () => {
      const onConfigChange = vi.fn()
      const onSave = vi.fn().mockResolvedValue(undefined)
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          editable: true,
          gridSettings: mockGridSettings,
          onConfigChange,
          onSave,
          allowedModes: ['rows', 'grid'],
        }),
        { wrapper }
      )

      act(() => {
        result.current.actions.enterEditMode()
      })

      await act(async () => {
        await result.current.actions.handleLayoutModeChange('rows')
      })

      expect(onConfigChange).toHaveBeenCalled()
      const newConfig = onConfigChange.mock.calls[0][0] as DashboardConfig
      expect(newConfig.layoutMode).toBe('rows')
    })

    it('should not change layout mode when not allowed', async () => {
      const onConfigChange = vi.fn()
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: mockConfig,
          editable: true,
          gridSettings: mockGridSettings,
          onConfigChange,
          allowedModes: ['grid'],
        }),
        { wrapper }
      )

      act(() => {
        result.current.actions.enterEditMode()
      })

      await act(async () => {
        await result.current.actions.handleLayoutModeChange('rows')
      })

      expect(onConfigChange).not.toHaveBeenCalled()
    })

    it('should not change layout mode when same mode', async () => {
      const onConfigChange = vi.fn()
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: { ...mockConfig, layoutMode: 'grid' },
          editable: true,
          gridSettings: mockGridSettings,
          onConfigChange,
          allowedModes: ['rows', 'grid'],
        }),
        { wrapper }
      )

      act(() => {
        result.current.actions.enterEditMode()
      })

      await act(async () => {
        await result.current.actions.handleLayoutModeChange('grid')
      })

      expect(onConfigChange).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Row Layout Tests
  // ==========================================================================

  describe('row layout', () => {
    it('should compute resolvedRows for rows layout mode', () => {
      const configWithRows: DashboardConfig = {
        ...mockConfig,
        layoutMode: 'rows',
        rows: [
          { id: 'row-1', h: 4, columns: [{ portletId: 'portlet-1', w: 12 }] },
        ],
      }

      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: configWithRows,
          gridSettings: mockGridSettings,
        }),
        { wrapper }
      )

      expect(result.current.resolvedRows.length).toBeGreaterThan(0)
    })

    it('should return empty resolvedRows for grid layout mode', () => {
      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: { ...mockConfig, layoutMode: 'grid' },
          gridSettings: mockGridSettings,
        }),
        { wrapper }
      )

      expect(result.current.resolvedRows).toEqual([])
    })

    it('should update row layout and call onConfigChange', async () => {
      const onConfigChange = vi.fn()
      const onSave = vi.fn().mockResolvedValue(undefined)
      const configWithRows: DashboardConfig = {
        ...mockConfig,
        layoutMode: 'rows',
      }

      const { wrapper } = createDashboardWrapper()
      const { result } = renderHook(
        () => useDashboard({
          config: configWithRows,
          gridSettings: mockGridSettings,
          onConfigChange,
          onSave,
        }),
        { wrapper }
      )

      const newRows = [
        { id: 'row-1', h: 6, columns: [{ portletId: 'portlet-1', w: 12 }] },
      ]

      await act(async () => {
        await result.current.actions.updateRowLayout(newRows)
      })

      expect(onConfigChange).toHaveBeenCalled()
    })
  })
})
