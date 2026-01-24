/**
 * Tests for AI suggestion with mode detection
 */

import { describe, it, expect } from 'vitest'
import { suggestQuery } from '../src/server/ai'
import type { CubeMetadata } from '../src/server/types/metadata'

const mockCubeWithEventStream: CubeMetadata = {
  name: 'PREvents',
  title: 'PR Events',
  description: 'Pull request events for funnel analysis',
  exampleQuestions: ['Show PR conversion funnel'],
  measures: [
    { name: 'PREvents.count', title: 'Count', shortTitle: 'Count', type: 'count' }
  ],
  dimensions: [
    { name: 'PREvents.prNumber', title: 'PR Number', shortTitle: 'PR', type: 'number' },
    { name: 'PREvents.eventType', title: 'Event Type', shortTitle: 'Type', type: 'string' },
    { name: 'PREvents.timestamp', title: 'Timestamp', shortTitle: 'Time', type: 'time' }
  ],
  segments: [],
  meta: {
    eventStream: {
      bindingKey: 'PREvents.prNumber',
      timeDimension: 'PREvents.timestamp'
    }
  }
}

const mockMetadata = [mockCubeWithEventStream]

describe('AI Suggestion Mode Detection', () => {
  describe('funnel mode detection', () => {
    it('should detect funnel mode from "funnel" keyword', () => {
      const result = suggestQuery(mockMetadata, 'Show me the PR funnel')

      expect(result.analysisMode).toBe('funnel')
      expect(result.nextSteps).toBeDefined()
      expect(result.nextSteps!.length).toBeGreaterThan(0)
    })

    it('should detect funnel mode from "conversion" keyword', () => {
      const result = suggestQuery(mockMetadata, 'What is the PR conversion rate?')

      expect(result.analysisMode).toBe('funnel')
    })

    it('should detect funnel mode from "drop-off" keyword', () => {
      const result = suggestQuery(mockMetadata, 'Where is the biggest drop-off?')

      expect(result.analysisMode).toBe('funnel')
    })
  })

  describe('flow mode detection', () => {
    it('should detect flow mode from "flow" keyword', () => {
      const result = suggestQuery(mockMetadata, 'Show me the user flow')

      expect(result.analysisMode).toBe('flow')
      expect(result.nextSteps).toBeDefined()
    })

    it('should detect flow mode from "path" keyword', () => {
      const result = suggestQuery(mockMetadata, 'What paths do users take?')

      expect(result.analysisMode).toBe('flow')
    })

    it('should detect flow mode from "before/after" keywords', () => {
      const result = suggestQuery(mockMetadata, 'What happens before merge?')

      expect(result.analysisMode).toBe('flow')
    })
  })

  describe('retention mode detection', () => {
    it('should detect retention mode from "retention" keyword', () => {
      const result = suggestQuery(mockMetadata, 'Show user retention')

      expect(result.analysisMode).toBe('retention')
      expect(result.nextSteps).toBeDefined()
    })

    it('should detect retention mode from "cohort" keyword', () => {
      const result = suggestQuery(mockMetadata, 'Cohort analysis by week')

      expect(result.analysisMode).toBe('retention')
    })

    it('should detect retention mode from "churn" keyword', () => {
      const result = suggestQuery(mockMetadata, 'What is the churn rate?')

      expect(result.analysisMode).toBe('retention')
    })
  })

  describe('standard query mode', () => {
    it('should default to query mode for standard requests', () => {
      const result = suggestQuery(mockMetadata, 'How many PRs were created last month?')

      expect(result.analysisMode).toBe('query')
      expect(result.nextSteps).toBeUndefined()
    })

    it('should build query for standard mode', () => {
      const result = suggestQuery(mockMetadata, 'Count PRs')

      expect(result.analysisMode).toBe('query')
      expect(result.query.measures).toBeDefined()
    })
  })

  describe('nextSteps guidance', () => {
    it('should include discover step for funnel mode', () => {
      const result = suggestQuery(mockMetadata, 'PR funnel')

      expect(result.nextSteps).toBeDefined()
      const hasDiscoverStep = result.nextSteps!.some(s => s.toLowerCase().includes('discover'))
      expect(hasDiscoverStep).toBe(true)
    })

    it('should mention cube name in nextSteps when found', () => {
      const result = suggestQuery(mockMetadata, 'PR funnel')

      expect(result.nextSteps).toBeDefined()
      const hasCubeName = result.nextSteps!.some(s => s.includes('PREvents'))
      expect(hasCubeName).toBe(true)
    })
  })
})
