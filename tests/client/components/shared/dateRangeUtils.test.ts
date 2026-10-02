import { renderHook } from '@testing-library/react'
import { useCompactFilterBar } from '../../../../src/client/components/DashboardFilters/useCompactFilterBar'
import type { DashboardFilter } from '../../../../src/client/types'
import { afterEach, expect, test, vi } from 'vitest'
import { calculateDateRange, formatDateRangeDisplay } from '../../../../src/client/components/shared/dateRangeUtils'
import { parseDateRange } from '../../../../src/shared/date-utils'

afterEach(() => vi.useRealTimers())

test('should display a fixed September 1 date without a local timezone shift', () => {
  const range = parseDateRange(['2026-09-01', '2026-09-01'])!
  expect(range.start.toISOString()).toBe('2026-09-01T00:00:00.000Z')
  expect(range.end.toISOString()).toBe('2026-09-01T23:59:59.999Z')
  expect(formatDateRangeDisplay(range.start, range.end)).toBe('Sep 1, 2026')
})

test('should display both UTC years when a range crosses New Year', () => {
  expect(formatDateRangeDisplay(new Date('2025-12-31T00:00:00Z'), new Date('2026-01-01T00:00:00Z')))
    .toBe('Dec 31, 2025 - Jan 1, 2026')
})

test.each([
  ['2026-09-30T23:59:59.000Z', '2025-10-01T00:00:00.000Z', '2026-09-30T23:59:59.999Z'],
  ['2026-10-01T00:00:00.000Z', '2025-11-01T00:00:00.000Z', '2026-10-01T23:59:59.999Z']
])('should display the query boundaries for last 12 months at %s', (now, start, end) => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(now))
  const range = calculateDateRange('last 12 months')!
  expect(range.start.toISOString()).toBe(start)
  expect(range.end.toISOString()).toBe(end)
  expect(range).toEqual(parseDateRange('last 12 months'))
})

test.each(['today', 'yesterday', 'last 7 days', 'last 3 months', 'last 2 quarters', 'last 2 years', 'this week', 'this month', 'this quarter', 'this year', 'last week', 'last month', 'last quarter', 'last year'])('should display the UTC query boundaries for %s', preset => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-01T00:00:00Z'))
  expect(calculateDateRange(preset)).toEqual(parseDateRange(preset))
})

test('should return no display range for an unknown preset', () => {
  expect(calculateDateRange('unknown')).toBeNull()
})


test('should refresh a relative tooltip on rerender after UTC month rollover', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-30T23:59:59Z'))
  const filters: DashboardFilter[] = [{
    id: 'history', label: 'History date', isUniversalTime: true,
    filter: { member: '__universal_time__', operator: 'inDateRange', values: ['last 12 months'], dateRange: 'last 12 months' }
  }]
  const { result, rerender } = renderHook(() => useCompactFilterBar(filters, () => {}))
  expect(result.current.dateRangeTooltip).toBe('Oct 1, 2025 - Sep 30, 2026')
  vi.setSystemTime(new Date('2026-10-01T00:00:00Z'))
  rerender()
  expect(result.current.dateRangeTooltip).toBe('Nov 1, 2025 - Oct 1, 2026')
  expect(result.current.currentDateRange).toBe('last 12 months')
})
