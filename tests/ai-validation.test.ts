/**
 * Tests for AI validation of funnel/flow/retention queries
 */

import { describe, it, expect } from 'vitest'
import { validateQuery } from '../src/server/ai'
import type { CubeMetadata } from '../src/server/types/metadata'
import type { SemanticQuery } from '../src/server/types/query'

const mockMetadata: CubeMetadata[] = [{
  name: 'PREvents',
  title: 'PR Events',
  measures: [
    { name: 'PREvents.count', title: 'Count', shortTitle: 'Count', type: 'count' }
  ],
  dimensions: [
    { name: 'PREvents.prNumber', title: 'PR Number', shortTitle: 'PR', type: 'number' },
    { name: 'PREvents.eventType', title: 'Event Type', shortTitle: 'Type', type: 'string' },
    { name: 'PREvents.timestamp', title: 'Timestamp', shortTitle: 'Time', type: 'time' }
  ],
  segments: []
}]

describe('AI Validation - Funnel Queries', () => {
  it('should pass valid funnel query', () => {
    const query: SemanticQuery = {
      funnel: {
        bindingKey: 'PREvents.prNumber',
        timeDimension: 'PREvents.timestamp',
        steps: [
          { name: 'Opened', filter: { member: 'PREvents.eventType', operator: 'equals', values: ['opened'] } },
          { name: 'Merged', filter: { member: 'PREvents.eventType', operator: 'equals', values: ['merged'] } }
        ]
      }
    }

    const result = validateQuery(query, mockMetadata)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should fail funnel without bindingKey', () => {
    const query: SemanticQuery = {
      funnel: {
        timeDimension: 'PREvents.timestamp',
        steps: [
          { name: 'Step 1', filter: { member: 'PREvents.eventType', operator: 'equals', values: ['a'] } },
          { name: 'Step 2', filter: { member: 'PREvents.eventType', operator: 'equals', values: ['b'] } }
        ]
      }
    } as any

    const result = validateQuery(query, mockMetadata)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.message.includes('bindingKey'))).toBe(true)
  })

  it('should fail funnel with less than 2 steps', () => {
    const query: SemanticQuery = {
      funnel: {
        bindingKey: 'PREvents.prNumber',
        timeDimension: 'PREvents.timestamp',
        steps: [
          { name: 'Only One', filter: { member: 'PREvents.eventType', operator: 'equals', values: ['a'] } }
        ]
      }
    }

    const result = validateQuery(query, mockMetadata)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.message.includes('2 steps'))).toBe(true)
  })

  it('should validate dimension references in funnel', () => {
    const query: SemanticQuery = {
      funnel: {
        bindingKey: 'PREvents.invalidDimension',
        timeDimension: 'PREvents.timestamp',
        steps: [
          { name: 'Step 1', filter: { member: 'PREvents.eventType', operator: 'equals', values: ['a'] } },
          { name: 'Step 2', filter: { member: 'PREvents.eventType', operator: 'equals', values: ['b'] } }
        ]
      }
    }

    const result = validateQuery(query, mockMetadata)
    expect(result.isValid).toBe(false)
  })
})

describe('AI Validation - Flow Queries', () => {
  it('should pass valid flow query', () => {
    const query: SemanticQuery = {
      flow: {
        bindingKey: 'PREvents.prNumber',
        timeDimension: 'PREvents.timestamp',
        eventDimension: 'PREvents.eventType',
        stepsBefore: 2,
        stepsAfter: 2
      }
    }

    const result = validateQuery(query, mockMetadata)
    expect(result.isValid).toBe(true)
  })

  it('should fail flow without eventDimension', () => {
    const query: SemanticQuery = {
      flow: {
        bindingKey: 'PREvents.prNumber',
        timeDimension: 'PREvents.timestamp',
        stepsBefore: 2
      }
    } as any

    const result = validateQuery(query, mockMetadata)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.message.includes('eventDimension'))).toBe(true)
  })

  it('should warn when no steps specified', () => {
    const query: SemanticQuery = {
      flow: {
        bindingKey: 'PREvents.prNumber',
        timeDimension: 'PREvents.timestamp',
        eventDimension: 'PREvents.eventType'
      }
    }

    const result = validateQuery(query, mockMetadata)
    expect(result.warnings.some(w => w.message.includes('stepsBefore') || w.message.includes('stepsAfter'))).toBe(true)
  })
})

describe('AI Validation - Retention Queries', () => {
  it('should pass valid retention query', () => {
    const query: SemanticQuery = {
      retention: {
        bindingKey: 'PREvents.prNumber',
        timeDimension: 'PREvents.timestamp',
        granularity: 'week',
        periods: 8
      }
    }

    const result = validateQuery(query, mockMetadata)
    expect(result.isValid).toBe(true)
  })

  it('should fail retention without timeDimension', () => {
    const query: SemanticQuery = {
      retention: {
        bindingKey: 'PREvents.prNumber',
        granularity: 'week'
      }
    } as any

    const result = validateQuery(query, mockMetadata)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.message.includes('timeDimension'))).toBe(true)
  })

  it('should warn when granularity not specified', () => {
    const query: SemanticQuery = {
      retention: {
        bindingKey: 'PREvents.prNumber',
        timeDimension: 'PREvents.timestamp'
      }
    }

    const result = validateQuery(query, mockMetadata)
    expect(result.warnings.some(w => w.message.includes('granularity'))).toBe(true)
  })
})
