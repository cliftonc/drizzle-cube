/**
 * Dropping members the model no longer has.
 *
 * The load-bearing distinction is projection vs filter: dropping a column
 * narrows what is shown, dropping a filter would widen the result set, so only
 * the former may be recovered from.
 */

import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  prunableMembers,
  usePortletDeadMembers,
  withoutMembers
} from '../../../src/client/components/analyticsPortlet/usePortletDeadMembers'
import type { CubeQuery, CubeValidationIssue } from '../../../src/client/types'

function failure(issues: CubeValidationIssue[]): Error & { issues: CubeValidationIssue[] } {
  return Object.assign(new Error('Query validation failed'), { issues })
}

const deadColumn: CubeValidationIssue = {
  source: 'dimension',
  member: 'Employees.attr_9',
  message: "Dimension 'attr_9' not found on cube 'Employees'"
}

const deadFilter: CubeValidationIssue = {
  source: 'filter',
  member: 'Employees.attr_8',
  message: "Filter field 'attr_8' not found on cube 'Employees'"
}

const deadTimeDimension: CubeValidationIssue = {
  source: 'timeDimension',
  member: 'Employees.hiredAt',
  message: "TimeDimension 'hiredAt' not found on cube 'Employees' (must be a dimension with time type)"
}

describe('prunableMembers', () => {
  const columnQuery: CubeQuery = { dimensions: ['Employees.name', 'Employees.attr_9'] }

  it('returns the members of a projection-only failure', () => {
    expect(prunableMembers(failure([deadColumn]), columnQuery)).toEqual(['Employees.attr_9'])
  })

  it('refuses to prune when a filter member is also missing', () => {
    // Re-running without the column would still carry the dead filter, and
    // dropping the filter would show rows the author excluded.
    expect(prunableMembers(failure([deadColumn, deadFilter]), columnQuery)).toBeNull()
  })

  it('returns null for an error with no structured issues', () => {
    expect(prunableMembers(new Error('connection refused'), columnQuery)).toBeNull()
    expect(prunableMembers(null, columnQuery)).toBeNull()
    expect(prunableMembers(failure([]), columnQuery)).toBeNull()
  })

  it('deduplicates a member reported more than once', () => {
    expect(prunableMembers(failure([deadColumn, { ...deadColumn, source: 'measure' }]), columnQuery))
      .toEqual(['Employees.attr_9'])
  })

  it('returns a dead time dimension that only groups by a granularity', () => {
    const query: CubeQuery = {
      measures: ['Employees.count'],
      timeDimensions: [{ dimension: 'Employees.hiredAt', granularity: 'month' }]
    }

    expect(prunableMembers(failure([deadTimeDimension]), query)).toEqual(['Employees.hiredAt'])
  })

  it('refuses to prune a dead time dimension that carries a dateRange', () => {
    // The dateRange filters the rows. Dropping the time dimension drops the
    // date predicate too, and the chart would show every date.
    const query: CubeQuery = {
      measures: ['Employees.count'],
      timeDimensions: [{ dimension: 'Employees.hiredAt', dateRange: 'last 7 days' }]
    }

    expect(prunableMembers(failure([deadTimeDimension]), query)).toBeNull()
  })

  it('refuses to prune a dead time dimension that carries a compareDateRange', () => {
    const query: CubeQuery = {
      measures: ['Employees.count'],
      timeDimensions: [{
        dimension: 'Employees.hiredAt',
        granularity: 'day',
        compareDateRange: ['last 7 days', ['2026-01-01', '2026-01-07']]
      }]
    }

    expect(prunableMembers(failure([deadTimeDimension]), query)).toBeNull()
  })

  it('refuses to prune a dead column when a dead time dimension carries a dateRange', () => {
    const query: CubeQuery = {
      dimensions: ['Employees.attr_9'],
      timeDimensions: [{ dimension: 'Employees.hiredAt', granularity: 'month', dateRange: 'last 7 days' }]
    }

    expect(prunableMembers(failure([deadColumn, deadTimeDimension]), query)).toBeNull()
  })

  it('returns a dead time dimension when only another time dimension carries a dateRange', () => {
    const query: CubeQuery = {
      measures: ['Employees.count'],
      timeDimensions: [
        { dimension: 'Employees.hiredAt', granularity: 'month' },
        { dimension: 'Employees.createdAt', dateRange: 'last 7 days' }
      ]
    }

    expect(prunableMembers(failure([deadTimeDimension]), query)).toEqual(['Employees.hiredAt'])
  })
})

describe('withoutMembers', () => {
  const query: CubeQuery = {
    measures: ['Employees.count'],
    dimensions: ['Employees.name', 'Employees.attr_9'],
    timeDimensions: [{ dimension: 'Employees.hiredAt', granularity: 'month' }],
    order: { 'Employees.attr_9': 'asc', 'Employees.name': 'desc' },
    filters: [{ member: 'Employees.attr_9', operator: 'equals', values: ['x'] }]
  }

  it('removes the member from projections and ordering', () => {
    const pruned = withoutMembers(query, ['Employees.attr_9'])

    expect(pruned.dimensions).toEqual(['Employees.name'])
    expect(pruned.order).toEqual({ 'Employees.name': 'desc' })
  })

  it('leaves filters untouched, even when they name the dead member', () => {
    expect(withoutMembers(query, ['Employees.attr_9']).filters).toEqual(query.filters)
  })

  it('removes a dead time dimension', () => {
    expect(withoutMembers(query, ['Employees.hiredAt']).timeDimensions).toEqual([])
  })

  it('returns the query untouched when nothing is dropped', () => {
    expect(withoutMembers(query, [])).toBe(query)
  })

  it('drops order entirely when its only member is gone', () => {
    const single: CubeQuery = { dimensions: ['A.b'], order: { 'A.b': 'asc' } }
    expect(withoutMembers(single, ['A.b']).order).toBeUndefined()
  })
})

describe('usePortletDeadMembers', () => {
  const query: CubeQuery = { dimensions: ['Employees.name', 'Employees.attr_9'] }

  it('passes the query through when nothing has failed', () => {
    const { result } = renderHook(() => usePortletDeadMembers({ queryObject: query, error: null }))

    expect(result.current.query).toEqual(query)
    expect(result.current.droppedMembers).toEqual([])
  })

  it('drops the dead column and reports it', () => {
    const { result } = renderHook(() =>
      usePortletDeadMembers({ queryObject: query, error: failure([deadColumn]) })
    )

    expect(result.current.query?.dimensions).toEqual(['Employees.name'])
    expect(result.current.droppedMembers).toEqual(['Employees.attr_9'])
  })

  it('leaves the query alone when a filter is the problem', () => {
    const { result } = renderHook(() =>
      usePortletDeadMembers({ queryObject: query, error: failure([deadFilter]) })
    )

    expect(result.current.query).toEqual(query)
    expect(result.current.droppedMembers).toEqual([])
  })

  it('accumulates across successive failures', () => {
    const { result, rerender } = renderHook(
      ({ error }) => usePortletDeadMembers({ queryObject: query, error }),
      { initialProps: { error: failure([deadColumn]) as unknown } }
    )

    rerender({ error: failure([{ ...deadColumn, member: 'Employees.attr_7' }]) })

    expect(result.current.droppedMembers).toEqual(['Employees.attr_9', 'Employees.attr_7'])
  })

  it('starts over when the base query changes', () => {
    const { result, rerender } = renderHook(
      ({ queryObject }) => usePortletDeadMembers({ queryObject, error: null }),
      { initialProps: { queryObject: query } }
    )

    rerender({ queryObject: { ...query, dimensions: ['Employees.name'] } })

    expect(result.current.droppedMembers).toEqual([])
  })

  describe('a dead time dimension', () => {
    const datedQuery: CubeQuery = {
      measures: ['Employees.count'],
      timeDimensions: [{ dimension: 'Employees.hiredAt', granularity: 'month', dateRange: 'last 7 days' }]
    }
    const undatedQuery: CubeQuery = {
      measures: ['Employees.count'],
      timeDimensions: [{ dimension: 'Employees.hiredAt', granularity: 'month' }]
    }

    it('leaves the query alone when the time dimension carries a dateRange', () => {
      const { result } = renderHook(() =>
        usePortletDeadMembers({ queryObject: datedQuery, error: failure([deadTimeDimension]) })
      )

      expect(result.current.query).toEqual(datedQuery)
      expect(result.current.droppedMembers).toEqual([])
    })

    it('reads the dateRange of the query that arrives with the failure', () => {
      const { result, rerender } = renderHook(
        ({ queryObject, error }) => usePortletDeadMembers({ queryObject, error }),
        { initialProps: { queryObject: undatedQuery, error: null as unknown } }
      )

      rerender({ queryObject: datedQuery, error: failure([deadTimeDimension]) })

      expect(result.current.query).toEqual(datedQuery)
      expect(result.current.droppedMembers).toEqual([])
    })

    it('does not apply an earlier failure to a changed base query', () => {
      // The earlier failure belongs to the dated query. The new query has not
      // run yet, so nothing is known about it.
      const error = failure([deadTimeDimension])
      const { result, rerender } = renderHook(
        ({ queryObject }) => usePortletDeadMembers({ queryObject, error }),
        { initialProps: { queryObject: datedQuery } }
      )

      rerender({ queryObject: undatedQuery })

      expect(result.current.query).toEqual(undatedQuery)
      expect(result.current.droppedMembers).toEqual([])
    })

    it('drops the time dimension when a query without the dateRange fails', () => {
      const { result, rerender } = renderHook(
        ({ queryObject, error }) => usePortletDeadMembers({ queryObject, error }),
        { initialProps: { queryObject: datedQuery, error: failure([deadTimeDimension]) as unknown } }
      )

      rerender({ queryObject: undatedQuery, error: failure([deadTimeDimension]) })

      expect(result.current.query).toEqual({ measures: ['Employees.count'], timeDimensions: [] })
      expect(result.current.droppedMembers).toEqual(['Employees.hiredAt'])
    })
  })
})
