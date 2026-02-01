/**
 * Comprehensive tests for Dashboard Zustand Store
 * Tests all state and actions: Edit Mode, Modal, Layout, Debug Data, Thumbnail
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React, { type ReactNode } from 'react'
import {
  createDashboardStore,
  DashboardStoreProvider,
  useDashboardStore,
  useDashboardStoreApi,
  useDashboardStoreOptional,
  selectEditModeState,
  selectModalState,
  selectLayoutState,
  selectDebugData,
  selectPortletDebugData,
  selectEditModeActions,
  selectModalActions,
  selectLayoutActions,
  selectDebugDataActions,
  selectThumbnailDirty,
  selectAllActions,
  type DashboardStore,
  type PortletDebugDataEntry,
  type DragState,
} from '../../../src/client/stores/dashboardStore'
import type { StoreApi } from 'zustand'
import type { PortletConfig, RowLayout } from '../../../src/client/types'

// ============================================================================
// Test Setup
// ============================================================================

describe('DashboardStore', () => {
  let store: StoreApi<DashboardStore>

  beforeEach(() => {
    // Create fresh store instance for each test
    store = createDashboardStore()
  })

  afterEach(() => {
    // No localStorage to clear for dashboard store (transient state)
  })

  // ==========================================================================
  // Store Creation & Initial State
  // ==========================================================================
  describe('Store Creation', () => {
    it('should create store with default initial state', () => {
      const state = store.getState()

      // Edit mode state
      expect(state.isEditMode).toBe(false)
      expect(state.selectedFilterId).toBeNull()

      // Modal state
      expect(state.isPortletModalOpen).toBe(false)
      expect(state.editingPortlet).toBeNull()
      expect(state.isFilterConfigModalOpen).toBe(false)
      expect(state.filterConfigPortlet).toBeNull()
      expect(state.deleteConfirmPortletId).toBeNull()

      // Layout state
      expect(state.draftRows).toBeNull()
      expect(state.isDraggingPortlet).toBe(false)
      expect(state.lastKnownLayout).toEqual([])
      expect(state.isInitialized).toBe(false)
      expect(state.dragState).toBeNull()

      // Debug data
      expect(state.debugData).toEqual({})

      // Thumbnail state
      expect(state.thumbnailDirty).toBe(false)
    })

    it('should create store with custom initial edit mode', () => {
      const customStore = createDashboardStore({
        initialEditMode: true,
      })

      const state = customStore.getState()
      expect(state.isEditMode).toBe(true)
    })

    it('should create isolated store instances (no state sharing)', () => {
      const store1 = createDashboardStore()
      const store2 = createDashboardStore()

      // Modify store1
      store1.getState().setEditMode(true)
      store1.getState().setThumbnailDirty(true)

      // store2 should not be affected
      expect(store1.getState().isEditMode).toBe(true)
      expect(store1.getState().thumbnailDirty).toBe(true)
      expect(store2.getState().isEditMode).toBe(false)
      expect(store2.getState().thumbnailDirty).toBe(false)
    })

    it('should create store with initialEditMode false by default', () => {
      const customStore = createDashboardStore({})
      expect(customStore.getState().isEditMode).toBe(false)
    })
  })

  // ==========================================================================
  // Edit Mode Actions
  // ==========================================================================
  describe('Edit Mode Actions', () => {
    describe('setEditMode', () => {
      it('should set edit mode to true', () => {
        store.getState().setEditMode(true)
        expect(store.getState().isEditMode).toBe(true)
      })

      it('should set edit mode to false', () => {
        store.getState().setEditMode(true)
        store.getState().setEditMode(false)
        expect(store.getState().isEditMode).toBe(false)
      })

      it('should clear selectedFilterId when setting edit mode', () => {
        store.getState().setSelectedFilterId('filter-1')
        store.getState().setEditMode(true)
        expect(store.getState().selectedFilterId).toBeNull()
      })

      it('should clear selectedFilterId when leaving edit mode', () => {
        store.getState().setEditMode(true)
        store.getState().setSelectedFilterId('filter-1')
        store.getState().setEditMode(false)
        expect(store.getState().selectedFilterId).toBeNull()
      })
    })

    describe('toggleEditMode', () => {
      it('should toggle from false to true', () => {
        expect(store.getState().isEditMode).toBe(false)
        store.getState().toggleEditMode()
        expect(store.getState().isEditMode).toBe(true)
      })

      it('should toggle from true to false', () => {
        store.getState().setEditMode(true)
        store.getState().toggleEditMode()
        expect(store.getState().isEditMode).toBe(false)
      })

      it('should clear selectedFilterId when toggling', () => {
        store.getState().setEditMode(true)
        store.getState().setSelectedFilterId('filter-1')
        store.getState().toggleEditMode()
        expect(store.getState().selectedFilterId).toBeNull()
      })

      it('should toggle multiple times correctly', () => {
        store.getState().toggleEditMode()
        expect(store.getState().isEditMode).toBe(true)
        store.getState().toggleEditMode()
        expect(store.getState().isEditMode).toBe(false)
        store.getState().toggleEditMode()
        expect(store.getState().isEditMode).toBe(true)
      })
    })

    describe('setSelectedFilterId', () => {
      it('should set selectedFilterId', () => {
        store.getState().setSelectedFilterId('filter-123')
        expect(store.getState().selectedFilterId).toBe('filter-123')
      })

      it('should allow null to clear selection', () => {
        store.getState().setSelectedFilterId('filter-123')
        store.getState().setSelectedFilterId(null)
        expect(store.getState().selectedFilterId).toBeNull()
      })

      it('should allow changing filter selection', () => {
        store.getState().setSelectedFilterId('filter-1')
        store.getState().setSelectedFilterId('filter-2')
        expect(store.getState().selectedFilterId).toBe('filter-2')
      })
    })

    describe('exitFilterSelectionMode', () => {
      it('should clear selectedFilterId', () => {
        store.getState().setSelectedFilterId('filter-123')
        store.getState().exitFilterSelectionMode()
        expect(store.getState().selectedFilterId).toBeNull()
      })

      it('should have no effect if already null', () => {
        store.getState().exitFilterSelectionMode()
        expect(store.getState().selectedFilterId).toBeNull()
      })
    })
  })

  // ==========================================================================
  // Modal Actions
  // ==========================================================================
  describe('Modal Actions', () => {
    // Sample portlet config for testing
    const samplePortlet: PortletConfig = {
      id: 'portlet-1',
      title: 'Test Portlet',
      query: '{}',
      chartType: 'bar',
      w: 6,
      h: 4,
      x: 0,
      y: 0,
    }

    describe('openPortletModal', () => {
      it('should open modal without portlet (add new)', () => {
        store.getState().openPortletModal()
        expect(store.getState().isPortletModalOpen).toBe(true)
        expect(store.getState().editingPortlet).toBeNull()
      })

      it('should open modal with null portlet', () => {
        store.getState().openPortletModal(null)
        expect(store.getState().isPortletModalOpen).toBe(true)
        expect(store.getState().editingPortlet).toBeNull()
      })

      it('should open modal with portlet for editing', () => {
        store.getState().openPortletModal(samplePortlet)
        expect(store.getState().isPortletModalOpen).toBe(true)
        expect(store.getState().editingPortlet).toEqual(samplePortlet)
      })

      it('should replace previous editing portlet', () => {
        const anotherPortlet: PortletConfig = {
          ...samplePortlet,
          id: 'portlet-2',
          title: 'Another Portlet',
        }

        store.getState().openPortletModal(samplePortlet)
        store.getState().openPortletModal(anotherPortlet)
        expect(store.getState().editingPortlet).toEqual(anotherPortlet)
      })
    })

    describe('closePortletModal', () => {
      it('should close modal and clear editing portlet', () => {
        store.getState().openPortletModal(samplePortlet)
        store.getState().closePortletModal()
        expect(store.getState().isPortletModalOpen).toBe(false)
        expect(store.getState().editingPortlet).toBeNull()
      })

      it('should have no effect if modal already closed', () => {
        store.getState().closePortletModal()
        expect(store.getState().isPortletModalOpen).toBe(false)
        expect(store.getState().editingPortlet).toBeNull()
      })
    })

    describe('openFilterConfigModal', () => {
      it('should open filter config modal with portlet', () => {
        store.getState().openFilterConfigModal(samplePortlet)
        expect(store.getState().isFilterConfigModalOpen).toBe(true)
        expect(store.getState().filterConfigPortlet).toEqual(samplePortlet)
      })

      it('should replace previous filter config portlet', () => {
        const anotherPortlet: PortletConfig = {
          ...samplePortlet,
          id: 'portlet-2',
        }

        store.getState().openFilterConfigModal(samplePortlet)
        store.getState().openFilterConfigModal(anotherPortlet)
        expect(store.getState().filterConfigPortlet).toEqual(anotherPortlet)
      })
    })

    describe('closeFilterConfigModal', () => {
      it('should close filter config modal and clear portlet', () => {
        store.getState().openFilterConfigModal(samplePortlet)
        store.getState().closeFilterConfigModal()
        expect(store.getState().isFilterConfigModalOpen).toBe(false)
        expect(store.getState().filterConfigPortlet).toBeNull()
      })

      it('should have no effect if modal already closed', () => {
        store.getState().closeFilterConfigModal()
        expect(store.getState().isFilterConfigModalOpen).toBe(false)
        expect(store.getState().filterConfigPortlet).toBeNull()
      })
    })

    describe('openDeleteConfirm', () => {
      it('should set deleteConfirmPortletId', () => {
        store.getState().openDeleteConfirm('portlet-to-delete')
        expect(store.getState().deleteConfirmPortletId).toBe('portlet-to-delete')
      })

      it('should replace previous delete confirmation', () => {
        store.getState().openDeleteConfirm('portlet-1')
        store.getState().openDeleteConfirm('portlet-2')
        expect(store.getState().deleteConfirmPortletId).toBe('portlet-2')
      })
    })

    describe('closeDeleteConfirm', () => {
      it('should clear deleteConfirmPortletId', () => {
        store.getState().openDeleteConfirm('portlet-1')
        store.getState().closeDeleteConfirm()
        expect(store.getState().deleteConfirmPortletId).toBeNull()
      })

      it('should have no effect if already null', () => {
        store.getState().closeDeleteConfirm()
        expect(store.getState().deleteConfirmPortletId).toBeNull()
      })
    })

    describe('modal state independence', () => {
      it('should allow multiple modals state to be tracked independently', () => {
        // Open portlet modal
        store.getState().openPortletModal(samplePortlet)
        expect(store.getState().isPortletModalOpen).toBe(true)

        // Opening filter config modal doesn't affect portlet modal
        store.getState().openFilterConfigModal(samplePortlet)
        expect(store.getState().isPortletModalOpen).toBe(true)
        expect(store.getState().isFilterConfigModalOpen).toBe(true)

        // Close portlet modal
        store.getState().closePortletModal()
        expect(store.getState().isPortletModalOpen).toBe(false)
        expect(store.getState().isFilterConfigModalOpen).toBe(true)
      })
    })
  })

  // ==========================================================================
  // Layout Actions
  // ==========================================================================
  describe('Layout Actions', () => {
    const sampleRows: RowLayout[] = [
      {
        id: 'row-1',
        portlets: [
          { id: 'portlet-1', title: 'Portlet 1', query: '{}', chartType: 'bar', w: 6, h: 4, x: 0, y: 0 },
        ],
      },
      {
        id: 'row-2',
        portlets: [
          { id: 'portlet-2', title: 'Portlet 2', query: '{}', chartType: 'line', w: 6, h: 4, x: 0, y: 0 },
        ],
      },
    ]

    describe('setDraftRows', () => {
      it('should set draft rows', () => {
        store.getState().setDraftRows(sampleRows)
        expect(store.getState().draftRows).toEqual(sampleRows)
      })

      it('should allow null to clear draft rows', () => {
        store.getState().setDraftRows(sampleRows)
        store.getState().setDraftRows(null)
        expect(store.getState().draftRows).toBeNull()
      })

      it('should replace previous draft rows', () => {
        store.getState().setDraftRows(sampleRows)
        const newRows: RowLayout[] = [{ id: 'row-new', portlets: [] }]
        store.getState().setDraftRows(newRows)
        expect(store.getState().draftRows).toEqual(newRows)
      })

      it('should allow empty array', () => {
        store.getState().setDraftRows([])
        expect(store.getState().draftRows).toEqual([])
      })
    })

    describe('setIsDraggingPortlet', () => {
      it('should set dragging state to true', () => {
        store.getState().setIsDraggingPortlet(true)
        expect(store.getState().isDraggingPortlet).toBe(true)
      })

      it('should set dragging state to false', () => {
        store.getState().setIsDraggingPortlet(true)
        store.getState().setIsDraggingPortlet(false)
        expect(store.getState().isDraggingPortlet).toBe(false)
      })
    })

    describe('setLastKnownLayout', () => {
      it('should set last known layout', () => {
        const layout = [
          { i: 'portlet-1', x: 0, y: 0, w: 6, h: 4 },
          { i: 'portlet-2', x: 6, y: 0, w: 6, h: 4 },
        ]
        store.getState().setLastKnownLayout(layout)
        expect(store.getState().lastKnownLayout).toEqual(layout)
      })

      it('should replace previous layout', () => {
        const layout1 = [{ i: 'portlet-1', x: 0, y: 0, w: 6, h: 4 }]
        const layout2 = [{ i: 'portlet-2', x: 0, y: 0, w: 12, h: 6 }]

        store.getState().setLastKnownLayout(layout1)
        store.getState().setLastKnownLayout(layout2)
        expect(store.getState().lastKnownLayout).toEqual(layout2)
      })

      it('should allow empty array', () => {
        store.getState().setLastKnownLayout([{ i: 'test', x: 0, y: 0, w: 1, h: 1 }])
        store.getState().setLastKnownLayout([])
        expect(store.getState().lastKnownLayout).toEqual([])
      })
    })

    describe('setIsInitialized', () => {
      it('should set initialized to true', () => {
        store.getState().setIsInitialized(true)
        expect(store.getState().isInitialized).toBe(true)
      })

      it('should set initialized to false', () => {
        store.getState().setIsInitialized(true)
        store.getState().setIsInitialized(false)
        expect(store.getState().isInitialized).toBe(false)
      })
    })

    describe('setDragState', () => {
      it('should set drag state', () => {
        const dragState: DragState = {
          rowIndex: 0,
          colIndex: 1,
          portletId: 'portlet-1',
        }
        store.getState().setDragState(dragState)
        expect(store.getState().dragState).toEqual(dragState)
      })

      it('should allow null to clear drag state', () => {
        const dragState: DragState = {
          rowIndex: 0,
          colIndex: 0,
          portletId: 'portlet-1',
        }
        store.getState().setDragState(dragState)
        store.getState().setDragState(null)
        expect(store.getState().dragState).toBeNull()
      })

      it('should replace previous drag state', () => {
        const dragState1: DragState = { rowIndex: 0, colIndex: 0, portletId: 'portlet-1' }
        const dragState2: DragState = { rowIndex: 1, colIndex: 2, portletId: 'portlet-2' }

        store.getState().setDragState(dragState1)
        store.getState().setDragState(dragState2)
        expect(store.getState().dragState).toEqual(dragState2)
      })
    })

    describe('clearDragState', () => {
      it('should clear drag state and isDraggingPortlet', () => {
        store.getState().setDragState({ rowIndex: 0, colIndex: 0, portletId: 'portlet-1' })
        store.getState().setIsDraggingPortlet(true)

        store.getState().clearDragState()

        expect(store.getState().dragState).toBeNull()
        expect(store.getState().isDraggingPortlet).toBe(false)
      })

      it('should work when drag state is already null', () => {
        store.getState().clearDragState()
        expect(store.getState().dragState).toBeNull()
        expect(store.getState().isDraggingPortlet).toBe(false)
      })
    })
  })

  // ==========================================================================
  // Debug Data Actions
  // ==========================================================================
  describe('Debug Data Actions', () => {
    const sampleDebugData: PortletDebugDataEntry = {
      chartConfig: { xAxis: ['dimension'], yAxis: ['measure'] },
      displayConfig: { showLegend: true },
      queryObject: { measures: ['Employees.count'] },
      data: [{ 'Employees.count': 10 }],
      chartType: 'bar',
      cacheInfo: {
        hit: true,
        cachedAt: '2024-01-01T00:00:00Z',
        ttlMs: 60000,
        ttlRemainingMs: 30000,
      },
    }

    describe('setDebugData', () => {
      it('should set debug data for a portlet', () => {
        store.getState().setDebugData('portlet-1', sampleDebugData)
        expect(store.getState().debugData['portlet-1']).toEqual(sampleDebugData)
      })

      it('should allow multiple portlets to have debug data', () => {
        const debugData2: PortletDebugDataEntry = {
          ...sampleDebugData,
          chartType: 'line',
        }

        store.getState().setDebugData('portlet-1', sampleDebugData)
        store.getState().setDebugData('portlet-2', debugData2)

        expect(store.getState().debugData['portlet-1']).toEqual(sampleDebugData)
        expect(store.getState().debugData['portlet-2']).toEqual(debugData2)
      })

      it('should replace existing debug data for same portlet', () => {
        const updatedDebugData: PortletDebugDataEntry = {
          ...sampleDebugData,
          data: [{ 'Employees.count': 20 }],
        }

        store.getState().setDebugData('portlet-1', sampleDebugData)
        store.getState().setDebugData('portlet-1', updatedDebugData)

        expect(store.getState().debugData['portlet-1']).toEqual(updatedDebugData)
      })

      it('should preserve other portlet debug data when updating one', () => {
        store.getState().setDebugData('portlet-1', sampleDebugData)
        store.getState().setDebugData('portlet-2', { ...sampleDebugData, chartType: 'line' })

        // Update portlet-1
        const updatedData = { ...sampleDebugData, chartType: 'pie' as const }
        store.getState().setDebugData('portlet-1', updatedData)

        expect(store.getState().debugData['portlet-1'].chartType).toBe('pie')
        expect(store.getState().debugData['portlet-2'].chartType).toBe('line')
      })

      it('should handle debug data without cacheInfo', () => {
        const dataWithoutCache: PortletDebugDataEntry = {
          chartConfig: {},
          displayConfig: {},
          queryObject: null,
          data: [],
          chartType: 'bar',
        }

        store.getState().setDebugData('portlet-1', dataWithoutCache)
        expect(store.getState().debugData['portlet-1'].cacheInfo).toBeUndefined()
      })
    })

    describe('clearDebugData', () => {
      it('should clear debug data for specific portlet', () => {
        store.getState().setDebugData('portlet-1', sampleDebugData)
        store.getState().setDebugData('portlet-2', sampleDebugData)

        store.getState().clearDebugData('portlet-1')

        expect(store.getState().debugData['portlet-1']).toBeUndefined()
        expect(store.getState().debugData['portlet-2']).toBeDefined()
      })

      it('should clear all debug data when no portletId provided', () => {
        store.getState().setDebugData('portlet-1', sampleDebugData)
        store.getState().setDebugData('portlet-2', sampleDebugData)
        store.getState().setDebugData('portlet-3', sampleDebugData)

        store.getState().clearDebugData()

        expect(store.getState().debugData).toEqual({})
      })

      it('should handle clearing non-existent portlet', () => {
        store.getState().setDebugData('portlet-1', sampleDebugData)
        store.getState().clearDebugData('non-existent')

        // Should not affect existing data
        expect(store.getState().debugData['portlet-1']).toBeDefined()
      })

      it('should handle clearing when debug data is empty', () => {
        store.getState().clearDebugData()
        expect(store.getState().debugData).toEqual({})
      })
    })
  })

  // ==========================================================================
  // Thumbnail Actions
  // ==========================================================================
  describe('Thumbnail Actions', () => {
    describe('setThumbnailDirty', () => {
      it('should set thumbnail dirty to true', () => {
        store.getState().setThumbnailDirty(true)
        expect(store.getState().thumbnailDirty).toBe(true)
      })

      it('should set thumbnail dirty to false', () => {
        store.getState().setThumbnailDirty(true)
        store.getState().setThumbnailDirty(false)
        expect(store.getState().thumbnailDirty).toBe(false)
      })

      it('should toggle correctly', () => {
        store.getState().setThumbnailDirty(true)
        expect(store.getState().thumbnailDirty).toBe(true)
        store.getState().setThumbnailDirty(false)
        expect(store.getState().thumbnailDirty).toBe(false)
        store.getState().setThumbnailDirty(true)
        expect(store.getState().thumbnailDirty).toBe(true)
      })
    })
  })

  // ==========================================================================
  // Reset Action
  // ==========================================================================
  describe('Reset Action', () => {
    it('should reset all state to initial values', () => {
      // Set up various state
      store.getState().setEditMode(true)
      store.getState().setSelectedFilterId('filter-1')
      store.getState().openPortletModal({ id: '1', title: 'Test', query: '{}', chartType: 'bar', w: 6, h: 4, x: 0, y: 0 })
      store.getState().setDraftRows([{ id: 'row-1', portlets: [] }])
      store.getState().setIsDraggingPortlet(true)
      store.getState().setIsInitialized(true)
      store.getState().setDebugData('portlet-1', {
        chartConfig: {},
        displayConfig: {},
        queryObject: null,
        data: [],
        chartType: 'bar',
      })
      store.getState().setThumbnailDirty(true)

      // Reset
      store.getState().reset()

      // Verify all reset to defaults
      const state = store.getState()
      expect(state.isEditMode).toBe(false)
      expect(state.selectedFilterId).toBeNull()
      expect(state.isPortletModalOpen).toBe(false)
      expect(state.editingPortlet).toBeNull()
      expect(state.draftRows).toBeNull()
      expect(state.isDraggingPortlet).toBe(false)
      expect(state.isInitialized).toBe(false)
      expect(state.debugData).toEqual({})
      expect(state.thumbnailDirty).toBe(false)
    })

    it('should reset to custom initial state if provided', () => {
      const customStore = createDashboardStore({ initialEditMode: true })

      customStore.getState().setEditMode(false) // Change it
      customStore.getState().setThumbnailDirty(true)

      customStore.getState().reset()

      // Should reset to initial options
      expect(customStore.getState().isEditMode).toBe(true)
      expect(customStore.getState().thumbnailDirty).toBe(false)
    })
  })

  // ==========================================================================
  // Selectors
  // ==========================================================================
  describe('Selectors', () => {
    const samplePortlet: PortletConfig = {
      id: 'portlet-1',
      title: 'Test',
      query: '{}',
      chartType: 'bar',
      w: 6,
      h: 4,
      x: 0,
      y: 0,
    }

    describe('selectEditModeState', () => {
      it('should return edit mode state', () => {
        store.getState().setEditMode(true)
        store.getState().setSelectedFilterId('filter-1')

        const editModeState = selectEditModeState(store.getState())

        expect(editModeState.isEditMode).toBe(true)
        expect(editModeState.selectedFilterId).toBe('filter-1')
      })
    })

    describe('selectModalState', () => {
      it('should return modal state', () => {
        store.getState().openPortletModal(samplePortlet)
        store.getState().openFilterConfigModal(samplePortlet)

        const modalState = selectModalState(store.getState())

        expect(modalState.isPortletModalOpen).toBe(true)
        expect(modalState.editingPortlet).toEqual(samplePortlet)
        expect(modalState.isFilterConfigModalOpen).toBe(true)
        expect(modalState.filterConfigPortlet).toEqual(samplePortlet)
      })
    })

    describe('selectLayoutState', () => {
      it('should return layout state', () => {
        const rows: RowLayout[] = [{ id: 'row-1', portlets: [] }]
        const layout = [{ i: 'p-1', x: 0, y: 0, w: 6, h: 4 }]
        const dragState: DragState = { rowIndex: 0, colIndex: 0, portletId: 'p-1' }

        store.getState().setDraftRows(rows)
        store.getState().setIsDraggingPortlet(true)
        store.getState().setLastKnownLayout(layout)
        store.getState().setIsInitialized(true)
        store.getState().setDragState(dragState)

        const layoutState = selectLayoutState(store.getState())

        expect(layoutState.draftRows).toEqual(rows)
        expect(layoutState.isDraggingPortlet).toBe(true)
        expect(layoutState.lastKnownLayout).toEqual(layout)
        expect(layoutState.isInitialized).toBe(true)
        expect(layoutState.dragState).toEqual(dragState)
      })
    })

    describe('selectDebugData', () => {
      it('should return all debug data', () => {
        const debugEntry: PortletDebugDataEntry = {
          chartConfig: {},
          displayConfig: {},
          queryObject: null,
          data: [],
          chartType: 'bar',
        }

        store.getState().setDebugData('p-1', debugEntry)
        store.getState().setDebugData('p-2', { ...debugEntry, chartType: 'line' })

        const debugData = selectDebugData(store.getState())

        expect(Object.keys(debugData)).toHaveLength(2)
        expect(debugData['p-1']).toBeDefined()
        expect(debugData['p-2']).toBeDefined()
      })
    })

    describe('selectPortletDebugData', () => {
      it('should return debug data for specific portlet', () => {
        const debugEntry: PortletDebugDataEntry = {
          chartConfig: {},
          displayConfig: {},
          queryObject: null,
          data: [],
          chartType: 'bar',
        }

        store.getState().setDebugData('p-1', debugEntry)

        const portletDebug = selectPortletDebugData('p-1')(store.getState())
        expect(portletDebug).toEqual(debugEntry)
      })

      it('should return undefined for non-existent portlet', () => {
        const portletDebug = selectPortletDebugData('non-existent')(store.getState())
        expect(portletDebug).toBeUndefined()
      })
    })

    describe('selectThumbnailDirty', () => {
      it('should return thumbnail dirty state', () => {
        expect(selectThumbnailDirty(store.getState())).toBe(false)

        store.getState().setThumbnailDirty(true)
        expect(selectThumbnailDirty(store.getState())).toBe(true)
      })
    })

    describe('selectEditModeActions', () => {
      it('should return all edit mode actions', () => {
        const actions = selectEditModeActions(store.getState())

        expect(actions.setEditMode).toBeDefined()
        expect(actions.toggleEditMode).toBeDefined()
        expect(actions.setSelectedFilterId).toBeDefined()
        expect(actions.exitFilterSelectionMode).toBeDefined()
      })
    })

    describe('selectModalActions', () => {
      it('should return all modal actions', () => {
        const actions = selectModalActions(store.getState())

        expect(actions.openPortletModal).toBeDefined()
        expect(actions.closePortletModal).toBeDefined()
        expect(actions.openFilterConfigModal).toBeDefined()
        expect(actions.closeFilterConfigModal).toBeDefined()
        expect(actions.openDeleteConfirm).toBeDefined()
        expect(actions.closeDeleteConfirm).toBeDefined()
      })
    })

    describe('selectLayoutActions', () => {
      it('should return all layout actions', () => {
        const actions = selectLayoutActions(store.getState())

        expect(actions.setDraftRows).toBeDefined()
        expect(actions.setIsDraggingPortlet).toBeDefined()
        expect(actions.setLastKnownLayout).toBeDefined()
        expect(actions.setIsInitialized).toBeDefined()
        expect(actions.setDragState).toBeDefined()
        expect(actions.clearDragState).toBeDefined()
      })
    })

    describe('selectDebugDataActions', () => {
      it('should return all debug data actions', () => {
        const actions = selectDebugDataActions(store.getState())

        expect(actions.setDebugData).toBeDefined()
        expect(actions.clearDebugData).toBeDefined()
      })
    })

    describe('selectAllActions', () => {
      it('should return all actions', () => {
        const actions = selectAllActions(store.getState())

        // Edit mode actions
        expect(actions.setEditMode).toBeDefined()
        expect(actions.toggleEditMode).toBeDefined()
        expect(actions.setSelectedFilterId).toBeDefined()
        expect(actions.exitFilterSelectionMode).toBeDefined()

        // Modal actions
        expect(actions.openPortletModal).toBeDefined()
        expect(actions.closePortletModal).toBeDefined()
        expect(actions.openFilterConfigModal).toBeDefined()
        expect(actions.closeFilterConfigModal).toBeDefined()
        expect(actions.openDeleteConfirm).toBeDefined()
        expect(actions.closeDeleteConfirm).toBeDefined()

        // Layout actions
        expect(actions.setDraftRows).toBeDefined()
        expect(actions.setIsDraggingPortlet).toBeDefined()
        expect(actions.setLastKnownLayout).toBeDefined()
        expect(actions.setIsInitialized).toBeDefined()
        expect(actions.setDragState).toBeDefined()
        expect(actions.clearDragState).toBeDefined()

        // Debug data actions
        expect(actions.setDebugData).toBeDefined()
        expect(actions.clearDebugData).toBeDefined()

        // Thumbnail actions
        expect(actions.setThumbnailDirty).toBeDefined()

        // Utility actions
        expect(actions.reset).toBeDefined()
      })
    })
  })

  // ==========================================================================
  // Context & Provider Tests
  // ==========================================================================
  describe('Context & Provider', () => {
    describe('DashboardStoreProvider', () => {
      it('should provide store to children via context', () => {
        const wrapper = ({ children }: { children: ReactNode }) => (
          <DashboardStoreProvider>{children}</DashboardStoreProvider>
        )

        const { result } = renderHook(() => useDashboardStore((state) => state.isEditMode), {
          wrapper,
        })

        expect(result.current).toBe(false)
      })

      it('should allow initial edit mode via prop', () => {
        const wrapper = ({ children }: { children: ReactNode }) => (
          <DashboardStoreProvider initialEditMode={true}>{children}</DashboardStoreProvider>
        )

        const { result } = renderHook(() => useDashboardStore((state) => state.isEditMode), {
          wrapper,
        })

        expect(result.current).toBe(true)
      })

      it('should create isolated stores per provider', () => {
        // First provider
        const wrapper1 = ({ children }: { children: ReactNode }) => (
          <DashboardStoreProvider>{children}</DashboardStoreProvider>
        )

        // Second provider
        const wrapper2 = ({ children }: { children: ReactNode }) => (
          <DashboardStoreProvider>{children}</DashboardStoreProvider>
        )

        const { result: result1 } = renderHook(
          () => {
            const isEditMode = useDashboardStore((state) => state.isEditMode)
            const setEditMode = useDashboardStore((state) => state.setEditMode)
            return { isEditMode, setEditMode }
          },
          { wrapper: wrapper1 }
        )

        const { result: result2 } = renderHook(
          () => useDashboardStore((state) => state.isEditMode),
          { wrapper: wrapper2 }
        )

        // Modify first store
        act(() => {
          result1.current.setEditMode(true)
        })

        // First store should be updated
        expect(result1.current.isEditMode).toBe(true)

        // Second store should be independent
        expect(result2.current).toBe(false)
      })

      it('should maintain store instance across re-renders', () => {
        const wrapper = ({ children }: { children: ReactNode }) => (
          <DashboardStoreProvider>{children}</DashboardStoreProvider>
        )

        const { result, rerender } = renderHook(
          () => {
            const store = useDashboardStoreApi()
            return store
          },
          { wrapper }
        )

        const storeRef1 = result.current

        rerender()

        const storeRef2 = result.current

        // Should be the same store instance
        expect(storeRef1).toBe(storeRef2)
      })
    })

    describe('useDashboardStore', () => {
      it('should throw error when used outside provider', () => {
        // Suppress console.error for this test
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        expect(() => {
          renderHook(() => useDashboardStore((state) => state.isEditMode))
        }).toThrow('useDashboardStore must be used within DashboardStoreProvider')

        consoleSpy.mockRestore()
      })

      it('should allow selecting specific state', () => {
        const wrapper = ({ children }: { children: ReactNode }) => (
          <DashboardStoreProvider>{children}</DashboardStoreProvider>
        )

        const { result } = renderHook(
          () => {
            const isEditMode = useDashboardStore((state) => state.isEditMode)
            const thumbnailDirty = useDashboardStore((state) => state.thumbnailDirty)
            return { isEditMode, thumbnailDirty }
          },
          { wrapper }
        )

        expect(result.current.isEditMode).toBe(false)
        expect(result.current.thumbnailDirty).toBe(false)
      })

      it('should allow selecting actions', () => {
        const wrapper = ({ children }: { children: ReactNode }) => (
          <DashboardStoreProvider>{children}</DashboardStoreProvider>
        )

        const { result } = renderHook(
          () => {
            const setEditMode = useDashboardStore((state) => state.setEditMode)
            const isEditMode = useDashboardStore((state) => state.isEditMode)
            return { setEditMode, isEditMode }
          },
          { wrapper }
        )

        act(() => {
          result.current.setEditMode(true)
        })

        expect(result.current.isEditMode).toBe(true)
      })
    })

    describe('useDashboardStoreApi', () => {
      it('should throw error when used outside provider', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        expect(() => {
          renderHook(() => useDashboardStoreApi())
        }).toThrow('useDashboardStoreApi must be used within DashboardStoreProvider')

        consoleSpy.mockRestore()
      })

      it('should return raw store API', () => {
        const wrapper = ({ children }: { children: ReactNode }) => (
          <DashboardStoreProvider>{children}</DashboardStoreProvider>
        )

        const { result } = renderHook(() => useDashboardStoreApi(), { wrapper })

        expect(result.current.getState).toBeDefined()
        expect(result.current.setState).toBeDefined()
        expect(result.current.subscribe).toBeDefined()
      })

      it('should allow direct state manipulation', () => {
        const wrapper = ({ children }: { children: ReactNode }) => (
          <DashboardStoreProvider>{children}</DashboardStoreProvider>
        )

        const { result } = renderHook(() => useDashboardStoreApi(), { wrapper })

        act(() => {
          result.current.getState().setEditMode(true)
        })

        expect(result.current.getState().isEditMode).toBe(true)
      })
    })

    describe('useDashboardStoreOptional', () => {
      it('should return null when used outside provider', () => {
        const { result } = renderHook(() =>
          useDashboardStoreOptional((state) => state.isEditMode)
        )

        expect(result.current).toBeNull()
      })

      it('should return state when used inside provider', () => {
        const wrapper = ({ children }: { children: ReactNode }) => (
          <DashboardStoreProvider>{children}</DashboardStoreProvider>
        )

        const { result } = renderHook(
          () => useDashboardStoreOptional((state) => state.isEditMode),
          { wrapper }
        )

        expect(result.current).toBe(false)
      })

      it('should return updated state when store changes', () => {
        const wrapper = ({ children }: { children: ReactNode }) => (
          <DashboardStoreProvider>{children}</DashboardStoreProvider>
        )

        const { result } = renderHook(
          () => {
            const isEditMode = useDashboardStoreOptional((state) => state.isEditMode)
            const setEditMode = useDashboardStoreOptional((state) => state.setEditMode)
            return { isEditMode, setEditMode }
          },
          { wrapper }
        )

        expect(result.current.isEditMode).toBe(false)

        act(() => {
          result.current.setEditMode?.(true)
        })

        expect(result.current.isEditMode).toBe(true)
      })
    })
  })

  // ==========================================================================
  // State Transition Tests
  // ==========================================================================
  describe('State Transitions', () => {
    it('should handle complete edit workflow', () => {
      const portlet: PortletConfig = {
        id: 'p-1',
        title: 'Test',
        query: '{}',
        chartType: 'bar',
        w: 6,
        h: 4,
        x: 0,
        y: 0,
      }

      // Enter edit mode
      store.getState().setEditMode(true)
      expect(store.getState().isEditMode).toBe(true)

      // Open portlet modal for editing
      store.getState().openPortletModal(portlet)
      expect(store.getState().isPortletModalOpen).toBe(true)
      expect(store.getState().editingPortlet).toEqual(portlet)

      // Close modal
      store.getState().closePortletModal()
      expect(store.getState().isPortletModalOpen).toBe(false)
      expect(store.getState().editingPortlet).toBeNull()

      // Start dragging
      store.getState().setIsDraggingPortlet(true)
      store.getState().setDragState({ rowIndex: 0, colIndex: 0, portletId: 'p-1' })

      // Complete drag
      store.getState().clearDragState()
      expect(store.getState().isDraggingPortlet).toBe(false)

      // Mark thumbnail as dirty
      store.getState().setThumbnailDirty(true)
      expect(store.getState().thumbnailDirty).toBe(true)

      // Exit edit mode
      store.getState().setEditMode(false)
      expect(store.getState().isEditMode).toBe(false)
    })

    it('should handle delete confirmation workflow', () => {
      // Open delete confirmation
      store.getState().openDeleteConfirm('portlet-to-delete')
      expect(store.getState().deleteConfirmPortletId).toBe('portlet-to-delete')

      // Cancel delete
      store.getState().closeDeleteConfirm()
      expect(store.getState().deleteConfirmPortletId).toBeNull()

      // Open again
      store.getState().openDeleteConfirm('another-portlet')
      expect(store.getState().deleteConfirmPortletId).toBe('another-portlet')

      // Confirm delete (simulation - would normally delete then close)
      store.getState().closeDeleteConfirm()
      expect(store.getState().deleteConfirmPortletId).toBeNull()
    })

    it('should handle filter selection workflow', () => {
      // Enter edit mode
      store.getState().setEditMode(true)

      // Select a filter
      store.getState().setSelectedFilterId('filter-1')
      expect(store.getState().selectedFilterId).toBe('filter-1')

      // Select another filter
      store.getState().setSelectedFilterId('filter-2')
      expect(store.getState().selectedFilterId).toBe('filter-2')

      // Exit filter selection mode
      store.getState().exitFilterSelectionMode()
      expect(store.getState().selectedFilterId).toBeNull()

      // Edit mode should still be active
      expect(store.getState().isEditMode).toBe(true)
    })

    it('should handle layout initialization workflow', () => {
      // Initially not initialized
      expect(store.getState().isInitialized).toBe(false)

      // Set initial layout
      const layout = [{ i: 'p-1', x: 0, y: 0, w: 6, h: 4 }]
      store.getState().setLastKnownLayout(layout)

      // Mark as initialized
      store.getState().setIsInitialized(true)
      expect(store.getState().isInitialized).toBe(true)

      // Now changes can be tracked
      const newLayout = [{ i: 'p-1', x: 0, y: 0, w: 12, h: 6 }]
      store.getState().setLastKnownLayout(newLayout)
      expect(store.getState().lastKnownLayout).toEqual(newLayout)
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle empty portlet config in modals', () => {
      const emptyPortlet: PortletConfig = {
        id: '',
        title: '',
        query: '',
        chartType: 'bar',
        w: 0,
        h: 0,
        x: 0,
        y: 0,
      }

      store.getState().openPortletModal(emptyPortlet)
      expect(store.getState().editingPortlet).toEqual(emptyPortlet)
    })

    it('should handle special characters in IDs', () => {
      const specialId = 'portlet-with-special-chars-!@#$%^&*()'

      store.getState().openDeleteConfirm(specialId)
      expect(store.getState().deleteConfirmPortletId).toBe(specialId)

      store.getState().setSelectedFilterId('filter-with-spaces and-dashes_underscores')
      expect(store.getState().selectedFilterId).toBe('filter-with-spaces and-dashes_underscores')
    })

    it('should handle very long debug data arrays', () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({ index: i, value: `item-${i}` }))

      const debugEntry: PortletDebugDataEntry = {
        chartConfig: {},
        displayConfig: {},
        queryObject: null,
        data: largeData,
        chartType: 'bar',
      }

      store.getState().setDebugData('portlet-1', debugEntry)
      expect(store.getState().debugData['portlet-1'].data).toHaveLength(10000)
    })

    it('should handle rapid state updates', () => {
      // Rapidly toggle edit mode
      for (let i = 0; i < 100; i++) {
        store.getState().toggleEditMode()
      }

      // After even number of toggles, should be back to false
      expect(store.getState().isEditMode).toBe(false)
    })

    it('should handle multiple simultaneous drag state updates', () => {
      const states: DragState[] = [
        { rowIndex: 0, colIndex: 0, portletId: 'p-1' },
        { rowIndex: 1, colIndex: 1, portletId: 'p-2' },
        { rowIndex: 2, colIndex: 2, portletId: 'p-3' },
      ]

      // Rapidly update drag state
      states.forEach((state) => {
        store.getState().setDragState(state)
      })

      // Should have the last state
      expect(store.getState().dragState).toEqual(states[states.length - 1])
    })

    it('should handle undefined values gracefully', () => {
      // TypeScript would normally prevent this, but testing runtime behavior
      store.getState().setDraftRows(undefined as any)
      // Implementation converts undefined to null internally or handles it
      // The store should still be functional
      expect(store.getState).toBeDefined()
    })

    it('should handle complex nested debug data', () => {
      const complexData: PortletDebugDataEntry = {
        chartConfig: {
          xAxis: ['dim1', 'dim2'],
          yAxis: ['measure1', 'measure2', 'measure3'],
          series: ['series1'],
        },
        displayConfig: {
          showLegend: true,
          showGrid: false,
          colors: ['#ff0000', '#00ff00', '#0000ff'],
        },
        queryObject: {
          measures: ['Cube.measure1', 'Cube.measure2'],
          dimensions: ['Cube.dim1'],
          filters: [
            { member: 'Cube.dim1', operator: 'equals', values: ['value1'] },
          ],
          timeDimensions: [
            { dimension: 'Cube.date', granularity: 'day', dateRange: 'last 7 days' },
          ],
        },
        data: [
          { 'Cube.measure1': 100, 'Cube.measure2': 200, 'Cube.dim1': 'A' },
          { 'Cube.measure1': 150, 'Cube.measure2': 250, 'Cube.dim1': 'B' },
        ],
        chartType: 'bar',
        cacheInfo: {
          hit: true,
          cachedAt: new Date().toISOString(),
          ttlMs: 300000,
          ttlRemainingMs: 150000,
        },
      }

      store.getState().setDebugData('complex-portlet', complexData)
      expect(store.getState().debugData['complex-portlet']).toEqual(complexData)
    })

    it('should handle concurrent modal operations', () => {
      const portlet1: PortletConfig = { id: 'p1', title: 'P1', query: '{}', chartType: 'bar', w: 6, h: 4, x: 0, y: 0 }
      const portlet2: PortletConfig = { id: 'p2', title: 'P2', query: '{}', chartType: 'line', w: 6, h: 4, x: 0, y: 0 }

      // Open both modal types simultaneously
      store.getState().openPortletModal(portlet1)
      store.getState().openFilterConfigModal(portlet2)
      store.getState().openDeleteConfirm('p3')

      // All should be in their respective states
      expect(store.getState().isPortletModalOpen).toBe(true)
      expect(store.getState().editingPortlet).toEqual(portlet1)
      expect(store.getState().isFilterConfigModalOpen).toBe(true)
      expect(store.getState().filterConfigPortlet).toEqual(portlet2)
      expect(store.getState().deleteConfirmPortletId).toBe('p3')

      // Close all
      store.getState().closePortletModal()
      store.getState().closeFilterConfigModal()
      store.getState().closeDeleteConfirm()

      expect(store.getState().isPortletModalOpen).toBe(false)
      expect(store.getState().isFilterConfigModalOpen).toBe(false)
      expect(store.getState().deleteConfirmPortletId).toBeNull()
    })
  })

  // ==========================================================================
  // Subscription Tests
  // ==========================================================================
  describe('Store Subscriptions', () => {
    it('should notify subscribers on state change', () => {
      const listener = vi.fn()
      const unsubscribe = store.subscribe(listener)

      store.getState().setEditMode(true)

      expect(listener).toHaveBeenCalled()

      unsubscribe()
    })

    it('should allow unsubscribing', () => {
      const listener = vi.fn()
      const unsubscribe = store.subscribe(listener)

      unsubscribe()

      store.getState().setEditMode(true)

      expect(listener).not.toHaveBeenCalled()
    })

    it('should support multiple subscribers', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      const unsub1 = store.subscribe(listener1)
      const unsub2 = store.subscribe(listener2)

      store.getState().setEditMode(true)

      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()

      unsub1()
      unsub2()
    })
  })
})
