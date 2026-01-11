/**
 * Dashboard Zustand Store (Instance-based)
 *
 * Centralized state management for Dashboard components, consolidating:
 * - Edit mode state (isEditMode, selectedFilterId)
 * - Modal state (portlet edit, analysis, filter config)
 * - Layout state (draftRows, drag state, initialization)
 * - Debug data (per-portlet debug information)
 *
 * KEY ARCHITECTURE: Instance-based stores
 * - Each Dashboard gets its own store instance via Context
 * - No localStorage persistence (dashboard state is transient)
 * - State is per-dashboard session, not persisted
 *
 * Uses Zustand's createStore (factory) instead of create (singleton).
 * Store is provided via React Context.
 */

import { createContext, useContext, useRef, type ReactNode } from 'react'
import { createStore, useStore, type StoreApi } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type { LayoutItem } from 'react-grid-layout'
import type {
  PortletConfig,
  RowLayout,
  ChartType,
  ChartAxisConfig,
  ChartDisplayConfig,
  CubeQuery,
} from '../types'
import type { FlowChartData } from '../types/flow'

// ============================================================================
// Types
// ============================================================================

/**
 * Debug data entry for a portlet (used by chart inspector)
 */
export interface PortletDebugDataEntry {
  chartConfig: ChartAxisConfig
  displayConfig: ChartDisplayConfig
  queryObject: CubeQuery | null
  data: unknown[] | FlowChartData
  chartType: ChartType
  cacheInfo?: {
    hit: boolean
    cachedAt: string
    ttlMs: number
    ttlRemainingMs: number
  } | null
}

/**
 * @deprecated Use PortletDebugDataEntry instead. Kept for backward compatibility.
 */
export type DebugDataEntry = PortletDebugDataEntry

/**
 * Drag state for row-based layout
 */
export interface DragState {
  rowIndex: number
  colIndex: number
  portletId: string
}

/**
 * Complete store state interface
 */
export interface DashboardStoreState {
  // =========================================================================
  // Edit Mode State
  // =========================================================================
  /** Whether dashboard is in edit mode */
  isEditMode: boolean
  /** Currently selected filter ID for filter-assignment mode */
  selectedFilterId: string | null

  // =========================================================================
  // Modal State
  // =========================================================================
  /** Whether portlet edit modal is open */
  isPortletModalOpen: boolean
  /** Portlet being edited (null = adding new) */
  editingPortlet: PortletConfig | null
  /** Whether filter config modal is open */
  isFilterConfigModalOpen: boolean
  /** Portlet for filter configuration */
  filterConfigPortlet: PortletConfig | null
  /** Portlet ID pending delete confirmation (null = no confirmation active) */
  deleteConfirmPortletId: string | null

  // =========================================================================
  // Layout State
  // =========================================================================
  /** Draft row layout during drag operations (rows mode) */
  draftRows: RowLayout[] | null
  /** Whether a portlet is currently being dragged */
  isDraggingPortlet: boolean
  /** Last known layout for change detection */
  lastKnownLayout: LayoutItem[]
  /** Whether component has been initialized (prevents saves during load) */
  isInitialized: boolean
  /** Current drag state for row-based layout */
  dragState: DragState | null

  // =========================================================================
  // Debug Data
  // =========================================================================
  /** Debug data keyed by portlet ID (for chart inspector) */
  debugData: Record<string, DebugDataEntry>
}

/**
 * Store actions interface
 */
export interface DashboardStoreActions {
  // =========================================================================
  // Edit Mode Actions
  // =========================================================================
  /** Set edit mode */
  setEditMode: (isEdit: boolean) => void
  /** Toggle edit mode */
  toggleEditMode: () => void
  /** Set selected filter ID for filter selection mode */
  setSelectedFilterId: (filterId: string | null) => void
  /** Exit filter selection mode */
  exitFilterSelectionMode: () => void

  // =========================================================================
  // Modal Actions
  // =========================================================================
  /** Open portlet modal (optionally with a portlet to edit) */
  openPortletModal: (portlet?: PortletConfig | null) => void
  /** Close portlet modal */
  closePortletModal: () => void
  /** Open filter config modal for a portlet */
  openFilterConfigModal: (portlet: PortletConfig) => void
  /** Close filter config modal */
  closeFilterConfigModal: () => void
  /** Open delete confirmation for a portlet */
  openDeleteConfirm: (portletId: string) => void
  /** Close delete confirmation */
  closeDeleteConfirm: () => void

  // =========================================================================
  // Layout Actions
  // =========================================================================
  /** Set draft rows during drag operations */
  setDraftRows: (rows: RowLayout[] | null) => void
  /** Set whether a portlet is being dragged */
  setIsDraggingPortlet: (isDragging: boolean) => void
  /** Set last known layout for change detection */
  setLastKnownLayout: (layout: LayoutItem[]) => void
  /** Set whether component is initialized */
  setIsInitialized: (initialized: boolean) => void
  /** Set drag state */
  setDragState: (state: DragState | null) => void
  /** Clear drag state */
  clearDragState: () => void

  // =========================================================================
  // Debug Data Actions
  // =========================================================================
  /** Set debug data for a portlet */
  setDebugData: (portletId: string, data: DebugDataEntry) => void
  /** Clear debug data for a portlet (or all if no portletId) */
  clearDebugData: (portletId?: string) => void

  // =========================================================================
  // Utility Actions
  // =========================================================================
  /** Reset store to initial state */
  reset: () => void
}

/**
 * Combined store type
 */
export type DashboardStore = DashboardStoreState & DashboardStoreActions

/**
 * Options for creating a store instance
 */
export interface CreateDashboardStoreOptions {
  /** Initial edit mode state */
  initialEditMode?: boolean
}

// ============================================================================
// Initial State
// ============================================================================

const createDefaultState = (): DashboardStoreState => ({
  // Edit mode
  isEditMode: false,
  selectedFilterId: null,

  // Modal state
  isPortletModalOpen: false,
  editingPortlet: null,
  isFilterConfigModalOpen: false,
  filterConfigPortlet: null,
  deleteConfirmPortletId: null,

  // Layout state
  draftRows: null,
  isDraggingPortlet: false,
  lastKnownLayout: [],
  isInitialized: false,
  dragState: null,

  // Debug data
  debugData: {},
})

/**
 * Build initial state from options
 */
function buildInitialState(options: CreateDashboardStoreOptions): DashboardStoreState {
  const defaultState = createDefaultState()

  return {
    ...defaultState,
    isEditMode: options.initialEditMode ?? false,
  }
}

// ============================================================================
// Store Factory
// ============================================================================

/**
 * Create store actions
 */
function createStoreActions(
  set: (
    partial:
      | Partial<DashboardStore>
      | ((state: DashboardStore) => Partial<DashboardStore>)
  ) => void,
  _get: () => DashboardStore,
  initialState: DashboardStoreState
): DashboardStoreActions {
  return {
    // =================================================================
    // Edit Mode Actions
    // =================================================================

    setEditMode: (isEdit) =>
      set({
        isEditMode: isEdit,
        // Exit filter selection mode when leaving edit mode
        selectedFilterId: isEdit ? null : null,
      }),

    toggleEditMode: () =>
      set((state) => ({
        isEditMode: !state.isEditMode,
        // Exit filter selection mode when toggling
        selectedFilterId: null,
      })),

    setSelectedFilterId: (filterId) => set({ selectedFilterId: filterId }),

    exitFilterSelectionMode: () => set({ selectedFilterId: null }),

    // =================================================================
    // Modal Actions
    // =================================================================

    openPortletModal: (portlet) =>
      set({
        isPortletModalOpen: true,
        editingPortlet: portlet ?? null,
      }),

    closePortletModal: () =>
      set({
        isPortletModalOpen: false,
        editingPortlet: null,
      }),

    openFilterConfigModal: (portlet) =>
      set({
        isFilterConfigModalOpen: true,
        filterConfigPortlet: portlet,
      }),

    closeFilterConfigModal: () =>
      set({
        isFilterConfigModalOpen: false,
        filterConfigPortlet: null,
      }),

    openDeleteConfirm: (portletId: string) =>
      set({ deleteConfirmPortletId: portletId }),

    closeDeleteConfirm: () =>
      set({ deleteConfirmPortletId: null }),

    // =================================================================
    // Layout Actions
    // =================================================================

    setDraftRows: (rows) => set({ draftRows: rows }),

    setIsDraggingPortlet: (isDragging) => set({ isDraggingPortlet: isDragging }),

    setLastKnownLayout: (layout) => set({ lastKnownLayout: layout }),

    setIsInitialized: (initialized) => set({ isInitialized: initialized }),

    setDragState: (state) => set({ dragState: state }),

    clearDragState: () =>
      set({
        dragState: null,
        isDraggingPortlet: false,
      }),

    // =================================================================
    // Debug Data Actions
    // =================================================================

    setDebugData: (portletId, data) =>
      set((state) => ({
        debugData: {
          ...state.debugData,
          [portletId]: data,
        },
      })),

    clearDebugData: (portletId) =>
      set((state) => {
        if (portletId) {
          const { [portletId]: _, ...rest } = state.debugData
          return { debugData: rest }
        }
        return { debugData: {} }
      }),

    // =================================================================
    // Utility Actions
    // =================================================================

    reset: () => set(initialState),
  }
}

/**
 * Create a new dashboard store instance
 */
export function createDashboardStore(options: CreateDashboardStoreOptions = {}) {
  const initialState = buildInitialState(options)

  // No localStorage persistence - dashboard state is transient
  return createStore<DashboardStore>()(
    devtools(
      subscribeWithSelector((set, get) => ({
        ...initialState,
        ...createStoreActions(set, get, initialState),
      })),
      { name: 'DashboardStore' }
    )
  )
}

/**
 * Fallback store for useDashboardStoreOptional - created lazily at module level
 * This allows the hook to always call useStore unconditionally (React hooks rules)
 */
let fallbackStore: StoreApi<DashboardStore> | null = null
function getFallbackStore(): StoreApi<DashboardStore> {
  if (!fallbackStore) {
    fallbackStore = createDashboardStore()
  }
  return fallbackStore
}

// ============================================================================
// React Context & Provider
// ============================================================================

/**
 * Context for the store instance
 */
const DashboardStoreContext = createContext<StoreApi<DashboardStore> | null>(null)

/**
 * Provider props
 */
export interface DashboardStoreProviderProps {
  children: ReactNode
  /** Initial edit mode state */
  initialEditMode?: boolean
}

/**
 * Provider component that creates a store instance per Dashboard
 */
export function DashboardStoreProvider({
  children,
  initialEditMode,
}: DashboardStoreProviderProps) {
  // Create store instance once per provider mount
  const storeRef = useRef<StoreApi<DashboardStore> | null>(null)

  if (!storeRef.current) {
    storeRef.current = createDashboardStore({
      initialEditMode,
    })
  }

  return (
    <DashboardStoreContext.Provider value={storeRef.current}>
      {children}
    </DashboardStoreContext.Provider>
  )
}

/**
 * Hook to access the store from context
 * @throws Error if used outside of provider
 */
export function useDashboardStore<T>(selector: (state: DashboardStore) => T): T {
  const store = useContext(DashboardStoreContext)
  if (!store) {
    throw new Error('useDashboardStore must be used within DashboardStoreProvider')
  }
  return useStore(store, selector)
}

/**
 * Hook to get the raw store API (for actions that need direct access)
 */
export function useDashboardStoreApi(): StoreApi<DashboardStore> {
  const store = useContext(DashboardStoreContext)
  if (!store) {
    throw new Error('useDashboardStoreApi must be used within DashboardStoreProvider')
  }
  return store
}

/**
 * Optional hook that returns null if used outside provider (for optional store access)
 * Uses a fallback store to ensure useStore is always called (React hooks rules compliance)
 */
export function useDashboardStoreOptional<T>(
  selector: (state: DashboardStore) => T
): T | null {
  const contextStore = useContext(DashboardStoreContext)
  // Always call useStore unconditionally (React hooks rules)
  // Use fallback store when context is null to maintain hook order
  const result = useStore(contextStore ?? getFallbackStore(), selector)
  // Return null if there was no real store (using fallback)
  return contextStore ? result : null
}

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

/**
 * Select edit mode state
 */
export const selectEditModeState = (state: DashboardStore) => ({
  isEditMode: state.isEditMode,
  selectedFilterId: state.selectedFilterId,
})

/**
 * Select modal state
 */
export const selectModalState = (state: DashboardStore) => ({
  isPortletModalOpen: state.isPortletModalOpen,
  editingPortlet: state.editingPortlet,
  isFilterConfigModalOpen: state.isFilterConfigModalOpen,
  filterConfigPortlet: state.filterConfigPortlet,
})

/**
 * Select layout state
 */
export const selectLayoutState = (state: DashboardStore) => ({
  draftRows: state.draftRows,
  isDraggingPortlet: state.isDraggingPortlet,
  lastKnownLayout: state.lastKnownLayout,
  isInitialized: state.isInitialized,
  dragState: state.dragState,
})

/**
 * Select debug data
 */
export const selectDebugData = (state: DashboardStore) => state.debugData

/**
 * Select debug data for a specific portlet
 */
export const selectPortletDebugData = (portletId: string) => (state: DashboardStore) =>
  state.debugData[portletId]

/**
 * Select all edit mode actions
 */
export const selectEditModeActions = (state: DashboardStore) => ({
  setEditMode: state.setEditMode,
  toggleEditMode: state.toggleEditMode,
  setSelectedFilterId: state.setSelectedFilterId,
  exitFilterSelectionMode: state.exitFilterSelectionMode,
})

/**
 * Select all modal actions
 */
export const selectModalActions = (state: DashboardStore) => ({
  openPortletModal: state.openPortletModal,
  closePortletModal: state.closePortletModal,
  openFilterConfigModal: state.openFilterConfigModal,
  closeFilterConfigModal: state.closeFilterConfigModal,
  openDeleteConfirm: state.openDeleteConfirm,
  closeDeleteConfirm: state.closeDeleteConfirm,
})

/**
 * Select all layout actions
 */
export const selectLayoutActions = (state: DashboardStore) => ({
  setDraftRows: state.setDraftRows,
  setIsDraggingPortlet: state.setIsDraggingPortlet,
  setLastKnownLayout: state.setLastKnownLayout,
  setIsInitialized: state.setIsInitialized,
  setDragState: state.setDragState,
  clearDragState: state.clearDragState,
})

/**
 * Select all debug data actions
 */
export const selectDebugDataActions = (state: DashboardStore) => ({
  setDebugData: state.setDebugData,
  clearDebugData: state.clearDebugData,
})

/**
 * Select all actions
 */
export const selectAllActions = (state: DashboardStore) => ({
  // Edit mode
  setEditMode: state.setEditMode,
  toggleEditMode: state.toggleEditMode,
  setSelectedFilterId: state.setSelectedFilterId,
  exitFilterSelectionMode: state.exitFilterSelectionMode,
  // Modals
  openPortletModal: state.openPortletModal,
  closePortletModal: state.closePortletModal,
  openFilterConfigModal: state.openFilterConfigModal,
  closeFilterConfigModal: state.closeFilterConfigModal,
  openDeleteConfirm: state.openDeleteConfirm,
  closeDeleteConfirm: state.closeDeleteConfirm,
  // Layout
  setDraftRows: state.setDraftRows,
  setIsDraggingPortlet: state.setIsDraggingPortlet,
  setLastKnownLayout: state.setLastKnownLayout,
  setIsInitialized: state.setIsInitialized,
  setDragState: state.setDragState,
  clearDragState: state.clearDragState,
  // Debug data
  setDebugData: state.setDebugData,
  clearDebugData: state.clearDebugData,
  // Utility
  reset: state.reset,
})
