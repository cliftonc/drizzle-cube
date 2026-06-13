/**
 * Query-mode detection unit tests
 * Covers the single source of truth in src/server/query-modes.ts, including the
 * null-safety regression (a partial `funnel: {}` payload must not throw).
 */
import { describe, it, expect } from 'vitest'
import {
  detectQueryMode,
  getActiveQueryModes,
  hasFunnelMode,
  hasFlowMode,
  hasRetentionMode,
  hasComparisonMode
} from '../src/server/query-modes'
import type { SemanticQuery } from '../src/server/types'

describe('query-modes', () => {
  it('detects a regular query when no mode config is present', () => {
    const query: SemanticQuery = { measures: ['Orders.count'] }
    expect(detectQueryMode(query)).toBe('regular')
    expect(getActiveQueryModes(query)).toEqual([])
  })

  it('detects funnel with >= 2 steps', () => {
    const query = {
      funnel: { steps: [{}, {}] }
    } as unknown as SemanticQuery
    expect(hasFunnelMode(query)).toBe(true)
    expect(detectQueryMode(query)).toBe('funnel')
  })

  it('does NOT throw on a partial funnel payload (regression for #850)', () => {
    // Previously the funnel builder used query.funnel.steps.length (no ?.),
    // which threw a raw TypeError on `funnel: {}` before validation could run.
    const query = { funnel: {} } as unknown as SemanticQuery
    expect(() => hasFunnelMode(query)).not.toThrow()
    expect(hasFunnelMode(query)).toBe(false)
    expect(detectQueryMode(query)).toBe('regular')
  })

  it('does not treat a single-step funnel as a funnel', () => {
    const query = { funnel: { steps: [{}] } } as unknown as SemanticQuery
    expect(hasFunnelMode(query)).toBe(false)
  })

  it('detects flow via startingStep + eventDimension', () => {
    const query = {
      flow: { bindingKey: 'X.id', startingStep: {}, eventDimension: 'X.event' }
    } as unknown as SemanticQuery
    expect(hasFlowMode(query)).toBe(true)
    expect(detectQueryMode(query)).toBe('flow')
  })

  it('detects retention via timeDimension + bindingKey', () => {
    const query = {
      retention: { timeDimension: 'X.ts', bindingKey: 'X.id' }
    } as unknown as SemanticQuery
    expect(hasRetentionMode(query)).toBe(true)
    expect(detectQueryMode(query)).toBe('retention')
  })

  it('detects comparison via compareDateRange with >= 2 ranges', () => {
    const query = {
      timeDimensions: [{ dimension: 'X.ts', compareDateRange: ['last 7 days', 'last 14 days'] }]
    } as unknown as SemanticQuery
    expect(hasComparisonMode(query)).toBe(true)
    expect(detectQueryMode(query)).toBe('comparison')
  })

  it('comparison takes priority in the active-modes ordering', () => {
    const query = {
      timeDimensions: [{ dimension: 'X.ts', compareDateRange: ['a', 'b'] }],
      funnel: { steps: [{}, {}] }
    } as unknown as SemanticQuery
    expect(getActiveQueryModes(query)).toEqual(['comparison', 'funnel'])
    expect(detectQueryMode(query)).toBe('comparison')
  })
})
