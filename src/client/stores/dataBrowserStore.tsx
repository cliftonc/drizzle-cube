/**
 * Data Browser Zustand Store (Instance-based)
 *
 * Manages UI state for the DataBrowser component:
 * - Selected cube and visible columns
 * - Sorting, pagination, and filters
 * - Column picker and filter bar visibility
 *
 * Uses Zustand's createStore (factory) for instance isolation.
 */

import { createContext, useContext, useRef, type ReactNode } from 'react'
import { createStore, useStore, type StoreApi } from 'zustand'
import type { Filter } from '../types'

// ============================================================================
// Types
// ============================================================================

export interface DataBrowserStore {
  // Selected cube
  selectedCube: string | null

  // Visible columns (fully qualified: 'CubeName.fieldName')
  visibleColumns: string[]

  // Sorting
  sortColumn: string | null
  sortDirection: 'asc' | 'desc'

  // Pagination
  page: number
  pageSize: number

  // Filters
  filters: Filter[]

  // UI state
  showFilterBar: boolean
  showColumnPicker: boolean

  // Column widths (purely cosmetic — never affects queries)
  columnWidths: Record<string, number>

  // Actions
  selectCube: (cubeName: string, allDimensions: string[]) => void
  setVisibleColumns: (columns: string[]) => void
  toggleColumn: (column: string) => void
  setSort: (column: string) => void
  clearSort: () => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setFilters: (filters: Filter[]) => void
  toggleFilterBar: () => void
  setShowColumnPicker: (show: boolean) => void
  setColumnWidth: (column: string, width: number) => void
  setColumnWidths: (widths: Record<string, number>) => void
}

// ============================================================================
// Store Factory
// ============================================================================

interface DataBrowserStoreOptions {
  defaultPageSize?: number
  defaultCube?: string
  defaultColumns?: string[]
}

const COLUMN_WIDTHS_STORAGE_KEY = 'dc-data-browser-column-widths'

function loadColumnWidths(cubeName: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(COLUMN_WIDTHS_STORAGE_KEY)
    if (!raw) return {}
    const all = JSON.parse(raw)
    return all[cubeName] ?? {}
  } catch {
    return {}
  }
}

function saveColumnWidths(cubeName: string, widths: Record<string, number>): void {
  try {
    const raw = localStorage.getItem(COLUMN_WIDTHS_STORAGE_KEY)
    const all = raw ? JSON.parse(raw) : {}
    all[cubeName] = widths
    localStorage.setItem(COLUMN_WIDTHS_STORAGE_KEY, JSON.stringify(all))
  } catch {
    // localStorage unavailable — silently ignore
  }
}

function createDataBrowserStore(options: DataBrowserStoreOptions = {}) {
  return createStore<DataBrowserStore>()((set, get) => ({
    // Initial state
    selectedCube: options.defaultCube ?? null,
    visibleColumns: options.defaultColumns ?? [],
    sortColumn: null,
    sortDirection: 'asc',
    page: 0,
    pageSize: options.defaultPageSize ?? 20,
    filters: [],
    showFilterBar: false,
    showColumnPicker: false,
    columnWidths: options.defaultCube ? loadColumnWidths(options.defaultCube) : {},

    // Actions
    selectCube: (cubeName, allDimensions) =>
      set({
        selectedCube: cubeName,
        visibleColumns: allDimensions,
        sortColumn: null,
        sortDirection: 'asc',
        page: 0,
        filters: [],
        showFilterBar: false,
        columnWidths: loadColumnWidths(cubeName),
      }),

    setVisibleColumns: (columns) =>
      set({ visibleColumns: columns, page: 0 }),

    toggleColumn: (column) =>
      set((state) => {
        const idx = state.visibleColumns.indexOf(column)
        const next =
          idx >= 0
            ? state.visibleColumns.filter((c) => c !== column)
            : [...state.visibleColumns, column]
        return {
          visibleColumns: next,
          page: 0,
          // Clear sort if the sorted column was removed
          sortColumn: idx >= 0 && state.sortColumn === column ? null : state.sortColumn,
        }
      }),

    setSort: (column) =>
      set((state) => {
        if (state.sortColumn === column) {
          // Toggle direction, or clear if already desc
          if (state.sortDirection === 'asc') {
            return { sortDirection: 'desc' as const, page: 0 }
          }
          return { sortColumn: null, sortDirection: 'asc' as const, page: 0 }
        }
        return { sortColumn: column, sortDirection: 'asc' as const, page: 0 }
      }),

    clearSort: () => set({ sortColumn: null, sortDirection: 'asc', page: 0 }),

    setPage: (page) => set({ page }),

    setPageSize: (size) => set({ pageSize: size, page: 0 }),

    setFilters: (filters) => set({ filters, page: 0 }),

    toggleFilterBar: () =>
      set((state) => ({ showFilterBar: !state.showFilterBar })),

    setShowColumnPicker: (show) => set({ showColumnPicker: show }),

    setColumnWidth: (column, width) =>
      set((state) => {
        const updated = { ...state.columnWidths, [column]: width }
        if (state.selectedCube) saveColumnWidths(state.selectedCube, updated)
        return { columnWidths: updated }
      }),

    setColumnWidths: (widths) => {
      const cube = get().selectedCube
      if (cube) saveColumnWidths(cube, widths)
      set({ columnWidths: widths })
    },
  }))
}

// ============================================================================
// React Context + Provider
// ============================================================================

const DataBrowserStoreContext = createContext<StoreApi<DataBrowserStore> | null>(null)

export interface DataBrowserStoreProviderProps {
  children: ReactNode
  defaultPageSize?: number
  defaultCube?: string
  defaultColumns?: string[]
}

export function DataBrowserStoreProvider({
  children,
  defaultPageSize,
  defaultCube,
  defaultColumns,
}: DataBrowserStoreProviderProps) {
  const storeRef = useRef<StoreApi<DataBrowserStore> | null>(null)

  if (!storeRef.current) {
    storeRef.current = createDataBrowserStore({
      defaultPageSize,
      defaultCube,
      defaultColumns,
    })
  }

  return (
    <DataBrowserStoreContext.Provider value={storeRef.current}>
      {children}
    </DataBrowserStoreContext.Provider>
  )
}

export function useDataBrowserStore<T>(selector: (state: DataBrowserStore) => T): T {
  const store = useContext(DataBrowserStoreContext)
  if (!store) {
    throw new Error('useDataBrowserStore must be used within DataBrowserStoreProvider')
  }
  return useStore(store, selector)
}
