/**
 * Tests for DataBrowser Zustand store
 * Covers state management, actions, and localStorage persistence of column widths
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { DataBrowserStoreProvider, useDataBrowserStore } from '../../../../src/client/stores/dataBrowserStore'

function createWrapper(props: { defaultPageSize?: number; defaultCube?: string } = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      DataBrowserStoreProvider,
      { ...props },
      children
    )
  }
}

describe('DataBrowserStore', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('Initial state', () => {
    it('should have null selectedCube by default', () => {
      const { result } = renderHook(
        () => useDataBrowserStore((s) => s.selectedCube),
        { wrapper: createWrapper() }
      )
      expect(result.current).toBeNull()
    })

    it('should use defaultPageSize', () => {
      const { result } = renderHook(
        () => useDataBrowserStore((s) => s.pageSize),
        { wrapper: createWrapper({ defaultPageSize: 50 }) }
      )
      expect(result.current).toBe(50)
    })

    it('should default to page 0', () => {
      const { result } = renderHook(
        () => useDataBrowserStore((s) => s.page),
        { wrapper: createWrapper() }
      )
      expect(result.current).toBe(0)
    })

    it('should have empty filters', () => {
      const { result } = renderHook(
        () => useDataBrowserStore((s) => s.filters),
        { wrapper: createWrapper() }
      )
      expect(result.current).toEqual([])
    })
  })

  describe('selectCube', () => {
    it('should set selectedCube and visibleColumns', () => {
      const { result } = renderHook(
        () => ({
          selectedCube: useDataBrowserStore((s) => s.selectedCube),
          visibleColumns: useDataBrowserStore((s) => s.visibleColumns),
          selectCube: useDataBrowserStore((s) => s.selectCube),
        }),
        { wrapper: createWrapper() }
      )

      act(() => {
        result.current.selectCube('Employees', ['Employees.id', 'Employees.name'])
      })

      expect(result.current.selectedCube).toBe('Employees')
      expect(result.current.visibleColumns).toEqual(['Employees.id', 'Employees.name'])
    })

    it('should reset page, sort, and filters on cube switch', () => {
      const { result } = renderHook(
        () => ({
          page: useDataBrowserStore((s) => s.page),
          sortColumn: useDataBrowserStore((s) => s.sortColumn),
          filters: useDataBrowserStore((s) => s.filters),
          selectCube: useDataBrowserStore((s) => s.selectCube),
          setPage: useDataBrowserStore((s) => s.setPage),
          setSort: useDataBrowserStore((s) => s.setSort),
          setFilters: useDataBrowserStore((s) => s.setFilters),
        }),
        { wrapper: createWrapper() }
      )

      // Set up some state
      act(() => {
        result.current.selectCube('Employees', ['Employees.id'])
      })
      act(() => {
        result.current.setSort('Employees.id')
        result.current.setFilters([{ member: 'Employees.name', operator: 'equals', values: ['Alice'] }])
      })
      act(() => {
        result.current.setPage(3)
      })

      expect(result.current.page).toBe(3)
      expect(result.current.sortColumn).toBe('Employees.id')
      expect(result.current.filters).toHaveLength(1)

      // Switch cube — should reset
      act(() => {
        result.current.selectCube('Departments', ['Departments.id', 'Departments.name'])
      })

      expect(result.current.page).toBe(0)
      expect(result.current.sortColumn).toBeNull()
      expect(result.current.filters).toEqual([])
    })
  })

  describe('toggleColumn', () => {
    it('should add a column', () => {
      const { result } = renderHook(
        () => ({
          visibleColumns: useDataBrowserStore((s) => s.visibleColumns),
          selectCube: useDataBrowserStore((s) => s.selectCube),
          toggleColumn: useDataBrowserStore((s) => s.toggleColumn),
        }),
        { wrapper: createWrapper() }
      )

      act(() => {
        result.current.selectCube('Employees', ['Employees.id'])
      })

      act(() => {
        result.current.toggleColumn('Employees.name')
      })

      expect(result.current.visibleColumns).toEqual(['Employees.id', 'Employees.name'])
    })

    it('should remove an existing column', () => {
      const { result } = renderHook(
        () => ({
          visibleColumns: useDataBrowserStore((s) => s.visibleColumns),
          selectCube: useDataBrowserStore((s) => s.selectCube),
          toggleColumn: useDataBrowserStore((s) => s.toggleColumn),
        }),
        { wrapper: createWrapper() }
      )

      act(() => {
        result.current.selectCube('Employees', ['Employees.id', 'Employees.name'])
      })

      act(() => {
        result.current.toggleColumn('Employees.id')
      })

      expect(result.current.visibleColumns).toEqual(['Employees.name'])
    })

    it('should clear sort if sorted column is removed', () => {
      const { result } = renderHook(
        () => ({
          visibleColumns: useDataBrowserStore((s) => s.visibleColumns),
          sortColumn: useDataBrowserStore((s) => s.sortColumn),
          selectCube: useDataBrowserStore((s) => s.selectCube),
          toggleColumn: useDataBrowserStore((s) => s.toggleColumn),
          setSort: useDataBrowserStore((s) => s.setSort),
        }),
        { wrapper: createWrapper() }
      )

      act(() => {
        result.current.selectCube('Employees', ['Employees.id', 'Employees.name'])
        result.current.setSort('Employees.id')
      })

      expect(result.current.sortColumn).toBe('Employees.id')

      act(() => {
        result.current.toggleColumn('Employees.id')
      })

      expect(result.current.sortColumn).toBeNull()
    })
  })

  describe('setSort', () => {
    it('should set sort column ascending on first click', () => {
      const { result } = renderHook(
        () => ({
          sortColumn: useDataBrowserStore((s) => s.sortColumn),
          sortDirection: useDataBrowserStore((s) => s.sortDirection),
          setSort: useDataBrowserStore((s) => s.setSort),
        }),
        { wrapper: createWrapper() }
      )

      act(() => {
        result.current.setSort('Employees.name')
      })

      expect(result.current.sortColumn).toBe('Employees.name')
      expect(result.current.sortDirection).toBe('asc')
    })

    it('should toggle to descending on second click', () => {
      const { result } = renderHook(
        () => ({
          sortColumn: useDataBrowserStore((s) => s.sortColumn),
          sortDirection: useDataBrowserStore((s) => s.sortDirection),
          setSort: useDataBrowserStore((s) => s.setSort),
        }),
        { wrapper: createWrapper() }
      )

      act(() => {
        result.current.setSort('Employees.name')
      })
      act(() => {
        result.current.setSort('Employees.name')
      })

      expect(result.current.sortColumn).toBe('Employees.name')
      expect(result.current.sortDirection).toBe('desc')
    })

    it('should clear sort on third click', () => {
      const { result } = renderHook(
        () => ({
          sortColumn: useDataBrowserStore((s) => s.sortColumn),
          sortDirection: useDataBrowserStore((s) => s.sortDirection),
          setSort: useDataBrowserStore((s) => s.setSort),
        }),
        { wrapper: createWrapper() }
      )

      act(() => result.current.setSort('Employees.name'))
      act(() => result.current.setSort('Employees.name'))
      act(() => result.current.setSort('Employees.name'))

      expect(result.current.sortColumn).toBeNull()
      expect(result.current.sortDirection).toBe('asc')
    })

    it('should switch to new column on different column click', () => {
      const { result } = renderHook(
        () => ({
          sortColumn: useDataBrowserStore((s) => s.sortColumn),
          sortDirection: useDataBrowserStore((s) => s.sortDirection),
          setSort: useDataBrowserStore((s) => s.setSort),
        }),
        { wrapper: createWrapper() }
      )

      act(() => result.current.setSort('Employees.name'))
      act(() => result.current.setSort('Employees.email'))

      expect(result.current.sortColumn).toBe('Employees.email')
      expect(result.current.sortDirection).toBe('asc')
    })
  })

  describe('Pagination', () => {
    it('should reset page when pageSize changes', () => {
      const { result } = renderHook(
        () => ({
          page: useDataBrowserStore((s) => s.page),
          pageSize: useDataBrowserStore((s) => s.pageSize),
          setPage: useDataBrowserStore((s) => s.setPage),
          setPageSize: useDataBrowserStore((s) => s.setPageSize),
        }),
        { wrapper: createWrapper() }
      )

      act(() => result.current.setPage(5))
      expect(result.current.page).toBe(5)

      act(() => result.current.setPageSize(50))
      expect(result.current.page).toBe(0)
      expect(result.current.pageSize).toBe(50)
    })
  })

  describe('Column widths (localStorage)', () => {
    it('should persist column widths to localStorage', () => {
      const { result } = renderHook(
        () => ({
          columnWidths: useDataBrowserStore((s) => s.columnWidths),
          selectCube: useDataBrowserStore((s) => s.selectCube),
          setColumnWidth: useDataBrowserStore((s) => s.setColumnWidth),
        }),
        { wrapper: createWrapper() }
      )

      act(() => {
        result.current.selectCube('Employees', ['Employees.id'])
        result.current.setColumnWidth('Employees.id', 200)
      })

      expect(result.current.columnWidths['Employees.id']).toBe(200)

      // Check localStorage
      const stored = JSON.parse(localStorage.getItem('dc-data-browser-column-widths') || '{}')
      expect(stored.Employees['Employees.id']).toBe(200)
    })

    it('should restore column widths from localStorage on cube select', () => {
      // Pre-populate localStorage
      localStorage.setItem('dc-data-browser-column-widths', JSON.stringify({
        Employees: { 'Employees.id': 250, 'Employees.name': 300 }
      }))

      const { result } = renderHook(
        () => ({
          columnWidths: useDataBrowserStore((s) => s.columnWidths),
          selectCube: useDataBrowserStore((s) => s.selectCube),
        }),
        { wrapper: createWrapper() }
      )

      act(() => {
        result.current.selectCube('Employees', ['Employees.id', 'Employees.name'])
      })

      expect(result.current.columnWidths['Employees.id']).toBe(250)
      expect(result.current.columnWidths['Employees.name']).toBe(300)
    })

    it('should keep separate widths per cube', () => {
      const { result } = renderHook(
        () => ({
          columnWidths: useDataBrowserStore((s) => s.columnWidths),
          selectCube: useDataBrowserStore((s) => s.selectCube),
          setColumnWidth: useDataBrowserStore((s) => s.setColumnWidth),
        }),
        { wrapper: createWrapper() }
      )

      // Set width for Employees
      act(() => {
        result.current.selectCube('Employees', ['Employees.id'])
        result.current.setColumnWidth('Employees.id', 200)
      })

      // Switch to Departments
      act(() => {
        result.current.selectCube('Departments', ['Departments.id'])
        result.current.setColumnWidth('Departments.id', 350)
      })

      // Switch back to Employees — should restore its widths
      act(() => {
        result.current.selectCube('Employees', ['Employees.id'])
      })

      expect(result.current.columnWidths['Employees.id']).toBe(200)
    })

    it('should not affect query-related state when setting column widths', () => {
      const { result } = renderHook(
        () => ({
          page: useDataBrowserStore((s) => s.page),
          sortColumn: useDataBrowserStore((s) => s.sortColumn),
          filters: useDataBrowserStore((s) => s.filters),
          selectCube: useDataBrowserStore((s) => s.selectCube),
          setColumnWidth: useDataBrowserStore((s) => s.setColumnWidth),
          setPage: useDataBrowserStore((s) => s.setPage),
          setSort: useDataBrowserStore((s) => s.setSort),
        }),
        { wrapper: createWrapper() }
      )

      act(() => {
        result.current.selectCube('Employees', ['Employees.id', 'Employees.name'])
      })
      act(() => {
        result.current.setSort('Employees.name')
      })
      act(() => {
        result.current.setPage(2)
      })

      expect(result.current.page).toBe(2)
      expect(result.current.sortColumn).toBe('Employees.name')

      // Set column width — should NOT change page, sort, or filters
      act(() => {
        result.current.setColumnWidth('Employees.id', 300)
      })

      expect(result.current.page).toBe(2)
      expect(result.current.sortColumn).toBe('Employees.name')
      expect(result.current.filters).toEqual([])
    })
  })
})
