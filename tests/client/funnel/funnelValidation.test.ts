/**
 * Tests for funnel validation utility functions
 *
 * These functions validate funnel configurations including binding keys,
 * step queries, and cross-cube compatibility.
 */

import { describe, it, expect } from 'vitest'
import {
  validateBindingKeyExists,
  validateStepQueries,
  canResolveBindingKey,
  validateBindingKeyForSteps,
  validateTimeWindow,
  validateFunnelConfig,
  isMinimumFunnelConfigValid,
  getAvailableBindingKeyDimensions,
  getBindingKeyLabel,
} from '../../../src/client/utils/funnelValidation'
import type { CubeMeta } from '../../../src/client/types'
import type {
  FunnelBindingKey,
  FunnelConfig,
  FunnelStep,
} from '../../../src/client/types/funnel'

// Mock metadata for tests
const mockMeta: CubeMeta = {
  cubes: [
    {
      name: 'Signups',
      title: 'Signups',
      measures: [
        { name: 'Signups.count', type: 'count', title: 'Count' },
      ],
      dimensions: [
        { name: 'Signups.userId', type: 'string', title: 'User ID' },
        { name: 'Signups.email', type: 'string', title: 'Email' },
        { name: 'Signups.createdAt', type: 'time', title: 'Created At' },
      ],
    },
    {
      name: 'Purchases',
      title: 'Purchases',
      measures: [
        { name: 'Purchases.count', type: 'count', title: 'Count' },
        { name: 'Purchases.totalAmount', type: 'sum', title: 'Total Amount' },
      ],
      dimensions: [
        { name: 'Purchases.customerId', type: 'string', title: 'Customer ID' },
        { name: 'Purchases.productId', type: 'number', title: 'Product ID' },
        { name: 'Purchases.orderDate', type: 'time', title: 'Order Date' },
      ],
    },
  ],
}

describe('funnelValidation utilities', () => {
  describe('validateBindingKeyExists', () => {
    it('should pass for valid simple binding key', () => {
      const bindingKey: FunnelBindingKey = {
        dimension: 'Signups.userId',
      }

      const errors = validateBindingKeyExists(bindingKey, mockMeta)

      expect(errors).toHaveLength(0)
    })

    it('should fail for non-existent cube', () => {
      const bindingKey: FunnelBindingKey = {
        dimension: 'NonExistent.userId',
      }

      const errors = validateBindingKeyExists(bindingKey, mockMeta)

      expect(errors).toHaveLength(1)
      expect(errors[0].type).toBe('binding_key')
      expect(errors[0].message).toContain('NonExistent')
    })

    it('should fail for non-existent dimension', () => {
      const bindingKey: FunnelBindingKey = {
        dimension: 'Signups.nonExistentField',
      }

      const errors = validateBindingKeyExists(bindingKey, mockMeta)

      expect(errors).toHaveLength(1)
      expect(errors[0].type).toBe('binding_key')
      expect(errors[0].message).toContain('nonExistentField')
    })

    it('should validate cross-cube binding key mappings', () => {
      const bindingKey: FunnelBindingKey = {
        dimension: [
          { cube: 'Signups', dimension: 'Signups.userId' },
          { cube: 'Purchases', dimension: 'Purchases.customerId' },
        ],
      }

      const errors = validateBindingKeyExists(bindingKey, mockMeta)

      expect(errors).toHaveLength(0)
    })

    it('should fail for invalid cross-cube mapping', () => {
      const bindingKey: FunnelBindingKey = {
        dimension: [
          { cube: 'Signups', dimension: 'Signups.userId' },
          { cube: 'Purchases', dimension: 'Purchases.invalidField' },
        ],
      }

      const errors = validateBindingKeyExists(bindingKey, mockMeta)

      expect(errors).toHaveLength(1)
      expect(errors[0].type).toBe('cross_cube')
    })

    it('should return empty errors when meta is null', () => {
      const bindingKey: FunnelBindingKey = {
        dimension: 'Signups.userId',
      }

      const errors = validateBindingKeyExists(bindingKey, null)

      expect(errors).toHaveLength(0)
    })

    it('should return error when meta has empty cubes', () => {
      const bindingKey: FunnelBindingKey = {
        dimension: 'Signups.userId',
      }

      // When cubes array is empty, the cube won't be found
      const errors = validateBindingKeyExists(bindingKey, { cubes: [] })

      expect(errors).toHaveLength(1)
      expect(errors[0].type).toBe('binding_key')
    })
  })

  describe('validateStepQueries', () => {
    it('should pass for valid step queries', () => {
      const steps: FunnelStep[] = [
        { id: '1', name: 'Step 1', query: { measures: ['Signups.count'] } },
        { id: '2', name: 'Step 2', query: { measures: ['Purchases.count'] } },
      ]

      const errors = validateStepQueries(steps)

      expect(errors).toHaveLength(0)
    })

    it('should pass for queries with only dimensions', () => {
      const steps: FunnelStep[] = [
        { id: '1', name: 'Step 1', query: { dimensions: ['Signups.email'] } },
      ]

      const errors = validateStepQueries(steps)

      expect(errors).toHaveLength(0)
    })

    it('should pass for queries with only timeDimensions', () => {
      const steps: FunnelStep[] = [
        {
          id: '1',
          name: 'Step 1',
          query: {
            timeDimensions: [{ dimension: 'Signups.createdAt', granularity: 'day' }],
          },
        },
      ]

      const errors = validateStepQueries(steps)

      expect(errors).toHaveLength(0)
    })

    it('should fail for empty query', () => {
      const steps: FunnelStep[] = [
        { id: '1', name: 'Empty Step', query: {} },
      ]

      const errors = validateStepQueries(steps)

      expect(errors).toHaveLength(1)
      expect(errors[0].type).toBe('step_query')
      expect(errors[0].stepIndex).toBe(0)
      expect(errors[0].message).toContain('Empty Step')
    })

    it('should fail for multiple invalid steps', () => {
      const steps: FunnelStep[] = [
        { id: '1', name: 'Good Step', query: { measures: ['A.count'] } },
        { id: '2', name: 'Bad Step 1', query: {} },
        { id: '3', name: 'Bad Step 2', query: { measures: [] } },
      ]

      const errors = validateStepQueries(steps)

      expect(errors).toHaveLength(2)
      expect(errors[0].stepIndex).toBe(1)
      expect(errors[1].stepIndex).toBe(2)
    })
  })

  describe('canResolveBindingKey', () => {
    it('should return true for simple binding key', () => {
      const bindingKey: FunnelBindingKey = {
        dimension: 'Users.userId',
      }
      const query = { measures: ['Signups.count'] }

      expect(canResolveBindingKey(bindingKey, query)).toBe(true)
    })

    it('should return true for matching cross-cube binding key', () => {
      const bindingKey: FunnelBindingKey = {
        dimension: [
          { cube: 'Signups', dimension: 'Signups.userId' },
          { cube: 'Purchases', dimension: 'Purchases.customerId' },
        ],
      }
      const query = { measures: ['Purchases.count'] }

      expect(canResolveBindingKey(bindingKey, query)).toBe(true)
    })

    it('should return false for non-matching cross-cube binding key', () => {
      const bindingKey: FunnelBindingKey = {
        dimension: [
          { cube: 'Signups', dimension: 'Signups.userId' },
        ],
      }
      const query = { measures: ['Purchases.count'] }

      expect(canResolveBindingKey(bindingKey, query)).toBe(false)
    })

    it('should return false when cube cannot be determined', () => {
      const bindingKey: FunnelBindingKey = {
        dimension: [
          { cube: 'Signups', dimension: 'Signups.userId' },
        ],
      }
      const query = {}

      expect(canResolveBindingKey(bindingKey, query)).toBe(false)
    })
  })

  describe('validateBindingKeyForSteps', () => {
    it('should pass when all steps can resolve binding key', () => {
      const bindingKey: FunnelBindingKey = {
        dimension: [
          { cube: 'Signups', dimension: 'Signups.userId' },
          { cube: 'Purchases', dimension: 'Purchases.customerId' },
        ],
      }
      const steps: FunnelStep[] = [
        { id: '1', name: 'Step 1', query: { measures: ['Signups.count'] } },
        { id: '2', name: 'Step 2', query: { measures: ['Purchases.count'] } },
      ]

      const errors = validateBindingKeyForSteps(bindingKey, steps)

      expect(errors).toHaveLength(0)
    })

    it('should fail when step cannot resolve binding key', () => {
      const bindingKey: FunnelBindingKey = {
        dimension: [
          { cube: 'Signups', dimension: 'Signups.userId' },
        ],
      }
      const steps: FunnelStep[] = [
        { id: '1', name: 'Step 1', query: { measures: ['Signups.count'] } },
        { id: '2', name: 'Step 2', query: { measures: ['Purchases.count'] } },
      ]

      const errors = validateBindingKeyForSteps(bindingKey, steps)

      expect(errors).toHaveLength(1)
      expect(errors[0].type).toBe('cross_cube')
      expect(errors[0].stepIndex).toBe(1)
      expect(errors[0].message).toContain('Purchases')
    })
  })

  describe('validateTimeWindow', () => {
    it('should return null for undefined duration', () => {
      expect(validateTimeWindow(undefined)).toBeNull()
    })

    it('should accept valid ISO 8601 durations', () => {
      const validDurations = ['P1D', 'P7D', 'P1M', 'P1Y', 'PT1H', 'PT30M', 'PT1H30M', 'P1DT12H']

      for (const duration of validDurations) {
        expect(validateTimeWindow(duration)).toBeNull()
      }
    })

    it('should reject invalid duration formats', () => {
      // Note: 'P' and 'PT' are technically valid per ISO 8601 regex (zero duration)
      const invalidDurations = ['7 days', '1 week', 'invalid', '123', 'P7', 'T1H']

      for (const duration of invalidDurations) {
        const error = validateTimeWindow(duration)
        expect(error).not.toBeNull()
        expect(error?.type).toBe('time_window')
      }
    })
  })

  describe('validateFunnelConfig', () => {
    const validConfig: FunnelConfig = {
      id: 'funnel-1',
      name: 'Test Funnel',
      bindingKey: { dimension: 'Signups.userId' },
      steps: [
        { id: '1', name: 'Step 1', query: { measures: ['Signups.count'] } },
        { id: '2', name: 'Step 2', query: { measures: ['Purchases.count'] } },
      ],
    }

    it('should pass for valid config', () => {
      const result = validateFunnelConfig(validConfig, mockMeta)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail for less than 2 steps', () => {
      const config: FunnelConfig = {
        ...validConfig,
        steps: [
          { id: '1', name: 'Step 1', query: { measures: ['A.count'] } },
        ],
      }

      const result = validateFunnelConfig(config, mockMeta)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.message.includes('at least 2 steps'))).toBe(true)
    })

    it('should fail for missing binding key', () => {
      const config: FunnelConfig = {
        ...validConfig,
        bindingKey: { dimension: '' },
      }

      const result = validateFunnelConfig(config, mockMeta)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.type === 'binding_key')).toBe(true)
    })

    it('should fail for null binding key dimension', () => {
      const config: FunnelConfig = {
        ...validConfig,
        bindingKey: null as unknown as FunnelBindingKey,
      }

      const result = validateFunnelConfig(config, mockMeta)

      expect(result.isValid).toBe(false)
    })

    it('should validate step time windows', () => {
      const config: FunnelConfig = {
        ...validConfig,
        steps: [
          { id: '1', name: 'Step 1', query: { measures: ['A.count'] } },
          { id: '2', name: 'Step 2', query: { measures: ['B.count'] }, timeToConvert: 'invalid' },
        ],
      }

      const result = validateFunnelConfig(config, mockMeta)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.type === 'time_window')).toBe(true)
    })

    it('should validate global time window', () => {
      const config: FunnelConfig = {
        ...validConfig,
        globalTimeWindow: 'bad-format',
      }

      const result = validateFunnelConfig(config, mockMeta)

      expect(result.isValid).toBe(false)
    })

    it('should add warning for more than 5 steps', () => {
      const config: FunnelConfig = {
        ...validConfig,
        bindingKey: { dimension: 'Users.id' },
        steps: Array.from({ length: 6 }, (_, i) => ({
          id: `step-${i}`,
          name: `Step ${i + 1}`,
          query: { measures: ['A.count'] },
        })),
      }

      // Use null meta to skip binding key validation
      const result = validateFunnelConfig(config, null)

      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].message).toContain('more than 5 steps')
    })
  })

  describe('isMinimumFunnelConfigValid', () => {
    it('should return valid for 2+ steps and binding key', () => {
      const bindingKey: FunnelBindingKey = { dimension: 'Users.userId' }

      const result = isMinimumFunnelConfigValid(bindingKey, 2)

      expect(result.isValid).toBe(true)
      expect(result.message).toBeUndefined()
    })

    it('should return invalid for less than 2 queries', () => {
      const bindingKey: FunnelBindingKey = { dimension: 'Users.userId' }

      const result = isMinimumFunnelConfigValid(bindingKey, 1)

      expect(result.isValid).toBe(false)
      expect(result.message).toContain('at least 2 steps')
    })

    it('should return invalid for null binding key', () => {
      const result = isMinimumFunnelConfigValid(null, 2)

      expect(result.isValid).toBe(false)
      expect(result.message).toContain('binding key')
    })

    it('should return invalid for empty string dimension', () => {
      const bindingKey: FunnelBindingKey = { dimension: '' }

      const result = isMinimumFunnelConfigValid(bindingKey, 2)

      expect(result.isValid).toBe(false)
    })

    it('should return invalid for empty array dimension', () => {
      const bindingKey: FunnelBindingKey = { dimension: [] }

      const result = isMinimumFunnelConfigValid(bindingKey, 2)

      expect(result.isValid).toBe(false)
    })

    it('should return valid for array dimension with mappings', () => {
      const bindingKey: FunnelBindingKey = {
        dimension: [{ cube: 'A', dimension: 'A.id' }],
      }

      const result = isMinimumFunnelConfigValid(bindingKey, 2)

      expect(result.isValid).toBe(true)
    })
  })

  describe('getAvailableBindingKeyDimensions', () => {
    it('should return string and number dimensions', () => {
      const dimensions = getAvailableBindingKeyDimensions(mockMeta)

      expect(dimensions.length).toBeGreaterThan(0)

      // Should include string dimensions
      expect(dimensions.some(d => d.dimension === 'Signups.userId')).toBe(true)
      expect(dimensions.some(d => d.dimension === 'Purchases.customerId')).toBe(true)

      // Should include number dimensions
      expect(dimensions.some(d => d.dimension === 'Purchases.productId')).toBe(true)
    })

    it('should exclude time dimensions', () => {
      const dimensions = getAvailableBindingKeyDimensions(mockMeta)

      expect(dimensions.some(d => d.dimension === 'Signups.createdAt')).toBe(false)
      expect(dimensions.some(d => d.dimension === 'Purchases.orderDate')).toBe(false)
    })

    it('should include cube name in each result', () => {
      const dimensions = getAvailableBindingKeyDimensions(mockMeta)

      const signupsDim = dimensions.find(d => d.dimension === 'Signups.userId')
      expect(signupsDim?.cube).toBe('Signups')

      const purchasesDim = dimensions.find(d => d.dimension === 'Purchases.customerId')
      expect(purchasesDim?.cube).toBe('Purchases')
    })

    it('should use title for label when available', () => {
      const dimensions = getAvailableBindingKeyDimensions(mockMeta)

      const userIdDim = dimensions.find(d => d.dimension === 'Signups.userId')
      expect(userIdDim?.label).toBe('User ID')
    })

    it('should return empty array for null meta', () => {
      const dimensions = getAvailableBindingKeyDimensions(null)

      expect(dimensions).toHaveLength(0)
    })

    it('should return empty array for meta with no cubes', () => {
      const dimensions = getAvailableBindingKeyDimensions({ cubes: [] })

      expect(dimensions).toHaveLength(0)
    })

    it('should handle cubes without dimensions', () => {
      const metaWithoutDims: CubeMeta = {
        cubes: [
          {
            name: 'NoDims',
            title: 'No Dimensions',
            measures: [{ name: 'NoDims.count', type: 'count', title: 'Count' }],
          },
        ],
      }

      const dimensions = getAvailableBindingKeyDimensions(metaWithoutDims)

      expect(dimensions).toHaveLength(0)
    })
  })

  describe('getBindingKeyLabel', () => {
    it('should return placeholder for null binding key', () => {
      const label = getBindingKeyLabel(null)

      expect(label).toBe('Select binding key...')
    })

    it('should return placeholder for binding key with no dimension', () => {
      const label = getBindingKeyLabel({ dimension: '' })

      expect(label).toBe('Select binding key...')
    })

    it('should extract dimension name from simple binding key', () => {
      const label = getBindingKeyLabel({ dimension: 'Users.userId' })

      expect(label).toBe('userId')
    })

    it('should handle cross-cube binding key', () => {
      const label = getBindingKeyLabel({
        dimension: [
          { cube: 'Signups', dimension: 'Signups.userId' },
          { cube: 'Purchases', dimension: 'Purchases.customerId' },
        ],
      })

      expect(label).toBe('userId (2 cubes)')
    })

    it('should handle empty cross-cube array', () => {
      const label = getBindingKeyLabel({ dimension: [] })

      expect(label).toBe('Select binding key...')
    })

    it('should use full dimension name as fallback', () => {
      const label = getBindingKeyLabel({ dimension: 'nodot' })

      expect(label).toBe('nodot')
    })
  })
})
