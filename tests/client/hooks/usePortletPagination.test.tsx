/**
 * Server-side paging and sorting state for a records-table portlet.
 *
 * The behaviours worth pinning down are the ones that would silently show the
 * wrong rows: sorting must go into the query (not just the loaded page), a sort
 * change must return to page 1, and a new base query must reset both.
 */

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  parsePortletPaginationViewState,
  usePortletPagination
} from '../../../src/client/components/analyticsPortlet/usePortletPagination'
import type { CubeQuery } from '../../../src/client/types'

const query: CubeQuery = { dimensions: ['Employees.name'], ungrouped: true }

describe('usePortletPagination', () => {
  it('leaves other chart types alone', () => {
    const { result } = renderHook(() => usePortletPagination({ chartType: 'bar', activeQuery: query }))

    expect(result.current.pagination).toBeUndefined()
    expect(result.current.paginatedQuery).toBe(query)
  })

  it('merges an explicit limit, offset and total into the query', () => {
    const { result } = renderHook(() =>
      usePortletPagination({ chartType: 'recordsTable', activeQuery: query, pageSize: 50 })
    )

    expect(result.current.paginatedQuery).toMatchObject({ limit: 50, offset: 0, total: true })

    act(() => result.current.pagination!.setPage(2))
    expect(result.current.paginatedQuery).toMatchObject({ limit: 50, offset: 100 })
  })

  it('puts the sort into the query rather than leaving it to the page', () => {
    const { result } = renderHook(() =>
      usePortletPagination({ chartType: 'recordsTable', activeQuery: query })
    )

    act(() => result.current.pagination!.toggleSort('Employees.name'))
    expect(result.current.paginatedQuery?.order).toEqual({ 'Employees.name': 'asc' })

    act(() => result.current.pagination!.toggleSort('Employees.name'))
    expect(result.current.paginatedQuery?.order).toEqual({ 'Employees.name': 'desc' })

    act(() => result.current.pagination!.toggleSort('Employees.name'))
    expect(result.current.paginatedQuery?.order).toBeUndefined()
  })

  it('returns to the first page when the sort or page size changes', () => {
    const { result } = renderHook(() =>
      usePortletPagination({ chartType: 'recordsTable', activeQuery: query })
    )

    act(() => result.current.pagination!.setPage(3))
    expect(result.current.pagination!.page).toBe(3)

    act(() => result.current.pagination!.toggleSort('Employees.name'))
    expect(result.current.pagination!.page).toBe(0)

    act(() => result.current.pagination!.setPage(3))
    act(() => result.current.pagination!.setPageSize(100))
    expect(result.current.pagination!.page).toBe(0)
    expect(result.current.paginatedQuery).toMatchObject({ limit: 100, offset: 0 })
  })

  it('resets when the base query changes, since page 3 of a filtered set is meaningless', () => {
    const { result, rerender } = renderHook(
      ({ activeQuery }) => usePortletPagination({ chartType: 'recordsTable', activeQuery }),
      { initialProps: { activeQuery: query } }
    )

    act(() => result.current.pagination!.setPage(2))
    act(() => result.current.pagination!.toggleSort('Employees.name'))
    act(() => result.current.pagination!.setPage(2))

    rerender({ activeQuery: { ...query, filters: [{ member: 'Employees.isActive', operator: 'equals', values: [true] }] } })

    expect(result.current.pagination!.page).toBe(0)
    expect(result.current.pagination!.sort).toBeUndefined()
  })

  it('keeps the query’s own order when the viewer has not sorted', () => {
    const ordered: CubeQuery = { ...query, order: { 'Employees.name': 'desc' } }
    const { result } = renderHook(() =>
      usePortletPagination({ chartType: 'recordsTable', activeQuery: ordered })
    )

    expect(result.current.paginatedQuery?.order).toEqual({ 'Employees.name': 'desc' })
  })

  describe('view state', () => {
    const startState = {
      version: 1,
      baseQuery: JSON.stringify(query),
      page: 2,
      pageSize: 50,
      sort: { column: 'Employees.name', direction: 'desc' }
    }

    it('returns the page, page size and sort as view state', () => {
      const { result } = renderHook(() =>
        usePortletPagination({ chartType: 'recordsTable', activeQuery: query })
      )

      act(() => result.current.pagination!.toggleSort('Employees.name'))
      act(() => result.current.pagination!.setPage(1))

      expect(result.current.viewState).toEqual({
        version: 1,
        baseQuery: JSON.stringify(query),
        page: 1,
        pageSize: 25,
        sort: { column: 'Employees.name', direction: 'asc' }
      })
    })

    it('returns no view state for chart types that do not page', () => {
      const { result } = renderHook(() => usePortletPagination({ chartType: 'bar', activeQuery: query }))

      expect(result.current.viewState).toBeUndefined()
    })

    it('starts on the page, page size and sort of initialState, past the mount-time resets', () => {
      const { result } = renderHook(() =>
        usePortletPagination({ chartType: 'recordsTable', activeQuery: query, pageSize: 25, initialState: startState })
      )

      expect(result.current.pagination).toMatchObject({ page: 2, pageSize: 50, sort: startState.sort })
      expect(result.current.paginatedQuery).toMatchObject({
        limit: 50,
        offset: 100,
        order: { 'Employees.name': 'desc' }
      })
    })

    it('still resets a started instance when the base query changes', () => {
      const { result, rerender } = renderHook(
        ({ activeQuery }) =>
          usePortletPagination({ chartType: 'recordsTable', activeQuery, initialState: startState }),
        { initialProps: { activeQuery: query } }
      )

      rerender({ activeQuery: { ...query, limit: 10 } })

      expect(result.current.pagination).toMatchObject({ page: 0, sort: undefined })
    })

    it('ignores a view state taken from another query', () => {
      expect(parsePortletPaginationViewState(startState, JSON.stringify({ dimensions: ['Other.name'] }), 25)).toBeNull()
    })

    it.each([
      ['an unknown version', { ...startState, version: 2 }],
      ['a negative page', { ...startState, page: -1 }],
      ['a page size the table does not offer', { ...startState, pageSize: 7 }],
      ['an unknown sort direction', { ...startState, sort: { column: 'Employees.name', direction: 'up' } }],
      ['a value that is not an object', 'page 2']
    ])('ignores a view state with %s', (_label, value) => {
      expect(parsePortletPaginationViewState(value, JSON.stringify(query), 25)).toBeNull()
    })

    it('accepts the authored page size even when the table does not offer it', () => {
      expect(parsePortletPaginationViewState({ ...startState, pageSize: 40 }, JSON.stringify(query), 40))
        .toMatchObject({ pageSize: 40 })
    })
  })
})
