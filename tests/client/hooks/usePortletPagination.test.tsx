/**
 * Server-side paging and sorting state for a records-table portlet.
 *
 * The behaviours worth pinning down are the ones that would silently show the
 * wrong rows: sorting must go into the query (not just the loaded page), a sort
 * change must return to page 1, and a new base query must reset both.
 */

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePortletPagination } from '../../../src/client/components/analyticsPortlet/usePortletPagination'
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
})
