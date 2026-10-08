import { describe, expect, it } from 'vitest'
import { normalizeTimeDimensions } from '../../src/server/execution/query-normalizer'
import type { SemanticQuery } from '../../src/server/types'

const member = 'Snapshots.capturedAt'

describe('native time dimension selection normalization', () => {
  it('gives an explicit grouped selection precedence over the same raw member without mutating input', () => {
    const query: SemanticQuery = {
      dimensions: [member, 'Other.capturedAt', 'Snapshots.rawCapturedAt'],
      timeDimensions: [{ dimension: member, granularity: 'year' }],
      order: { [member]: 'desc' }
    }
    const original = structuredClone(query)
    const normalized = normalizeTimeDimensions(query)
    expect(normalized.dimensions).toEqual(['Other.capturedAt', 'Snapshots.rawCapturedAt'])
    expect(normalized.timeDimensions).toEqual(query.timeDimensions)
    expect(normalized.order).toBe(query.order)
    expect(query).toEqual(original)
    expect(normalizeTimeDimensions(normalized)).toBe(normalized)
  })
  it('retains an explicitly selected raw member when its time selector only filters', () => {
    const query: SemanticQuery = {
      dimensions: [member],
      timeDimensions: [{ dimension: member, dateRange: ['2025-01-01', '2026-12-31'] }]
    }
    const normalized = normalizeTimeDimensions(query)
    expect(normalized.dimensions).toEqual(query.dimensions)
    expect(normalized.timeDimensions).toBeUndefined()
    expect(normalized.filters).toEqual([{ member, operator: 'inDateRange', values: [], dateRange: ['2025-01-01', '2026-12-31'] }])
  })
  it('normalizes grouped overlaps and unrelated filter-only dates together', () => {
    const query: SemanticQuery = {
      dimensions: [member, 'Other.capturedAt'],
      timeDimensions: [
        { dimension: member, granularity: 'month' },
        { dimension: 'Other.capturedAt', dateRange: 'this year' }
      ]
    }
    const normalized = normalizeTimeDimensions(query)
    expect(normalized.dimensions).toEqual(['Other.capturedAt'])
    expect(normalized.timeDimensions).toEqual([{ dimension: member, granularity: 'month' }])
    expect(normalized.filters).toEqual([{ member: 'Other.capturedAt', operator: 'inDateRange', values: [], dateRange: 'this year' }])
  })
  it('leaves ungrouped row selections unchanged', () => {
    const query: SemanticQuery = { ungrouped: true, dimensions: [member], timeDimensions: [{ dimension: member, granularity: 'year' }] }
    expect(normalizeTimeDimensions(query)).toBe(query)
  })
  it('retains granularity-less comparison selectors and their raw dimensions', () => {
    const query: SemanticQuery = { dimensions: [member], timeDimensions: [{ dimension: member, compareDateRange: [['2025-01-01', '2025-12-31']] }] }
    expect(normalizeTimeDimensions(query)).toBe(query)
  })
})
