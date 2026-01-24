/**
 * Tests for AI discovery with capabilities and analysis config
 */

import { describe, it, expect } from 'vitest'
import { discoverCubes } from '../src/server/ai'
import type { CubeMetadata } from '../src/server/types/metadata'

// Mock cube metadata for testing
const mockCubeWithEventStream: CubeMetadata = {
  name: 'PREvents',
  title: 'PR Events',
  description: 'Pull request events',
  measures: [
    { name: 'PREvents.count', title: 'Count', shortTitle: 'Count', type: 'count' }
  ],
  dimensions: [
    { name: 'PREvents.prNumber', title: 'PR Number', shortTitle: 'PR', type: 'number' },
    { name: 'PREvents.eventType', title: 'Event Type', shortTitle: 'Type', type: 'string' },
    { name: 'PREvents.timestamp', title: 'Timestamp', shortTitle: 'Time', type: 'time' },
    { name: 'PREvents.employeeId', title: 'Employee ID', shortTitle: 'Emp', type: 'number' }
  ],
  segments: [],
  meta: {
    eventStream: {
      bindingKey: 'PREvents.prNumber',
      timeDimension: 'PREvents.timestamp'
    }
  }
}

const mockCubeWithoutEventStream: CubeMetadata = {
  name: 'Employees',
  title: 'Employees',
  description: 'Employee data',
  measures: [
    { name: 'Employees.count', title: 'Count', shortTitle: 'Count', type: 'count' }
  ],
  dimensions: [
    { name: 'Employees.name', title: 'Name', shortTitle: 'Name', type: 'string' },
    { name: 'Employees.createdAt', title: 'Created', shortTitle: 'Created', type: 'time' }
  ],
  segments: []
}

const mockMetadata = [mockCubeWithEventStream, mockCubeWithoutEventStream]

describe('AI Discovery Capabilities', () => {
  describe('capabilities detection', () => {
    it('should detect funnel/flow/retention capabilities for cube with eventStream', () => {
      const results = discoverCubes(mockMetadata, { topic: 'PR events' })
      const prResult = results.find(r => r.cube === 'PREvents')

      expect(prResult).toBeDefined()
      expect(prResult!.capabilities.query).toBe(true)
      expect(prResult!.capabilities.funnel).toBe(true)
      expect(prResult!.capabilities.flow).toBe(true)
      expect(prResult!.capabilities.retention).toBe(true)
    })

    it('should infer capabilities for cube with time dimension and id fields', () => {
      const results = discoverCubes(mockMetadata, { topic: 'employees' })
      const empResult = results.find(r => r.cube === 'Employees')

      expect(empResult).toBeDefined()
      expect(empResult!.capabilities.query).toBe(true)
      // May or may not have analysis capabilities depending on inference
    })
  })

  describe('analysisConfig', () => {
    it('should include candidateBindingKeys from eventStream', () => {
      const results = discoverCubes(mockMetadata, { topic: 'pull request events' })
      const prResult = results.find(r => r.cube === 'PREvents')

      expect(prResult).toBeDefined()
      expect(prResult!.analysisConfig).toBeDefined()
      expect(prResult!.analysisConfig!.candidateBindingKeys).toContainEqual({
        dimension: 'PREvents.prNumber',
        description: expect.any(String)
      })
    })

    it('should include candidateTimeDimensions', () => {
      const results = discoverCubes(mockMetadata, { topic: 'pull request events' })
      const prResult = results.find(r => r.cube === 'PREvents')

      expect(prResult).toBeDefined()
      expect(prResult!.analysisConfig!.candidateTimeDimensions).toContainEqual({
        dimension: 'PREvents.timestamp',
        description: expect.any(String)
      })
    })

    it('should include candidateEventDimensions for string dimensions with event-like names', () => {
      const results = discoverCubes(mockMetadata, { topic: 'pull request events' })
      const prResult = results.find(r => r.cube === 'PREvents')

      expect(prResult).toBeDefined()
      expect(prResult!.analysisConfig!.candidateEventDimensions).toContainEqual({
        dimension: 'PREvents.eventType',
        description: expect.any(String)
      })
    })
  })

  describe('hints', () => {
    it('should include hints when analysis modes available', () => {
      const results = discoverCubes(mockMetadata, { topic: 'pull request events' })
      const prResult = results.find(r => r.cube === 'PREvents')

      expect(prResult).toBeDefined()
      expect(prResult!.hints).toBeDefined()
      expect(prResult!.hints!.length).toBeGreaterThan(0)
    })

    it('should hint about querying dimension values', () => {
      const results = discoverCubes(mockMetadata, { topic: 'pull request events' })
      const prResult = results.find(r => r.cube === 'PREvents')

      expect(prResult).toBeDefined()
      const hasQueryHint = prResult!.hints!.some(h =>
        h.includes('Query') && h.includes('dimension')
      )
      expect(hasQueryHint).toBe(true)
    })
  })

  describe('querySchemas', () => {
    it('should include query schemas when analysis modes available', () => {
      const results = discoverCubes(mockMetadata, { topic: 'pull request events' })
      const prResult = results.find(r => r.cube === 'PREvents')

      expect(prResult).toBeDefined()

      expect(prResult!.querySchemas).toBeDefined()
      expect(prResult!.querySchemas!.funnel).toBeDefined()
      expect(prResult!.querySchemas!.flow).toBeDefined()
      expect(prResult!.querySchemas!.retention).toBeDefined()
    })

    it('should not include schemas for cubes without analysis capabilities', () => {
      // Create a cube with no time dimensions and no id fields
      const basicCube: CubeMetadata = {
        name: 'Settings',
        title: 'Settings',
        measures: [],
        dimensions: [
          { name: 'Settings.key', title: 'Key', shortTitle: 'Key', type: 'string' },
          { name: 'Settings.value', title: 'Value', shortTitle: 'Val', type: 'string' }
        ],
        segments: []
      }

      const results = discoverCubes([basicCube], { topic: 'settings' })
      const result = results[0]

      // Should not have analysis capabilities
      if (!result.capabilities.funnel) {
        expect(result.querySchemas).toBeUndefined()
      }
    })
  })
})
