/**
 * Tests for buildQuickSearchFilter
 *
 * The Data Browser quick search box turns a free-text term into an OR group of
 * case-insensitive `contains` filters across the visible text (string) columns.
 */

import { describe, it, expect } from 'vitest'
import { buildQuickSearchFilter } from '../../src/client/hooks/useDataBrowser'

// Minimal metadata shape accepted by getFieldType: cubes with typed dimensions/measures
const meta = {
  cubes: [
    {
      name: 'Orders',
      dimensions: [
        { name: 'Orders.status', type: 'string' },
        { name: 'Orders.customer', type: 'string' },
        { name: 'Orders.createdAt', type: 'time' },
      ],
      measures: [
        { name: 'Orders.amount', type: 'number' },
      ],
    },
  ],
}

describe('buildQuickSearchFilter', () => {
  it('returns null for an empty or whitespace-only term', () => {
    expect(buildQuickSearchFilter('', ['Orders.status'], meta)).toBeNull()
    expect(buildQuickSearchFilter('   ', ['Orders.status'], meta)).toBeNull()
  })

  it('returns null when no visible columns are text', () => {
    expect(buildQuickSearchFilter('acme', ['Orders.createdAt', 'Orders.amount'], meta)).toBeNull()
  })

  it('builds an OR group of contains filters over text columns only', () => {
    const result = buildQuickSearchFilter(
      'acme',
      ['Orders.status', 'Orders.customer', 'Orders.createdAt', 'Orders.amount'],
      meta
    )
    expect(result).toEqual({
      type: 'or',
      filters: [
        { member: 'Orders.status', operator: 'contains', values: ['acme'] },
        { member: 'Orders.customer', operator: 'contains', values: ['acme'] },
      ],
    })
  })

  it('trims the search term before building filters', () => {
    const result = buildQuickSearchFilter('  acme  ', ['Orders.status'], meta)
    expect(result).toEqual({
      type: 'or',
      filters: [{ member: 'Orders.status', operator: 'contains', values: ['acme'] }],
    })
  })
})
