/**
 * Tests for funnel execution utility functions
 *
 * These are pure utility functions that handle the core logic of funnel
 * query execution including binding key extraction, query building, and
 * result transformation.
 */

import { describe, it, expect } from 'vitest'
import {
  getBindingKeyField,
  getCubeNameFromQuery,
  extractBindingKeyValues,
  buildStepQuery,
  calculateStepMetrics,
  buildStepResult,
  buildFunnelChartData,
  buildFunnelResult,
  createEmptyFunnelResult,
  buildFunnelConfigFromQueries,
  shouldStopFunnelExecution,
  isFunnelData,
  DEFAULT_BINDING_KEY_LIMIT,
} from '../../../src/client/utils/funnelExecution'
import type { CubeQuery } from '../../../src/client/types'
import type {
  FunnelBindingKey,
  FunnelConfig,
  FunnelStep,
  FunnelStepResult,
} from '../../../src/client/types/funnel'

describe('funnelExecution utilities', () => {
  describe('getCubeNameFromQuery', () => {
    it('should extract cube name from measures', () => {
      const query: CubeQuery = {
        measures: ['Signups.count'],
      }
      expect(getCubeNameFromQuery(query)).toBe('Signups')
    })

    it('should extract cube name from dimensions', () => {
      const query: CubeQuery = {
        dimensions: ['Users.email'],
      }
      expect(getCubeNameFromQuery(query)).toBe('Users')
    })

    it('should extract cube name from timeDimensions', () => {
      const query: CubeQuery = {
        timeDimensions: [{ dimension: 'Orders.createdAt', granularity: 'day' }],
      }
      expect(getCubeNameFromQuery(query)).toBe('Orders')
    })

    it('should prefer measures over dimensions', () => {
      const query: CubeQuery = {
        measures: ['Sales.count'],
        dimensions: ['Products.name'],
      }
      expect(getCubeNameFromQuery(query)).toBe('Sales')
    })

    it('should return null for empty query', () => {
      const query: CubeQuery = {}
      expect(getCubeNameFromQuery(query)).toBeNull()
    })

    it('should return null for malformed field names', () => {
      const query: CubeQuery = {
        measures: ['count'],
      }
      expect(getCubeNameFromQuery(query)).toBeNull()
    })
  })

  describe('getBindingKeyField', () => {
    it('should return dimension for simple binding key', () => {
      const bindingKey: FunnelBindingKey = {
        dimension: 'Users.userId',
      }
      const query: CubeQuery = { measures: ['Signups.count'] }

      expect(getBindingKeyField(bindingKey, query)).toBe('Users.userId')
    })

    it('should find matching dimension for cross-cube binding key', () => {
      const bindingKey: FunnelBindingKey = {
        dimension: [
          { cube: 'Signups', dimension: 'Signups.userId' },
          { cube: 'Purchases', dimension: 'Purchases.customerId' },
        ],
      }
      const query: CubeQuery = { measures: ['Purchases.count'] }

      expect(getBindingKeyField(bindingKey, query)).toBe('Purchases.customerId')
    })

    it('should return first mapping when no cube match found', () => {
      const bindingKey: FunnelBindingKey = {
        dimension: [
          { cube: 'Signups', dimension: 'Signups.userId' },
          { cube: 'Purchases', dimension: 'Purchases.customerId' },
        ],
      }
      const query: CubeQuery = { measures: ['UnknownCube.count'] }

      expect(getBindingKeyField(bindingKey, query)).toBe('Signups.userId')
    })

    it('should return first mapping when cube cannot be determined', () => {
      const bindingKey: FunnelBindingKey = {
        dimension: [
          { cube: 'Signups', dimension: 'Signups.userId' },
        ],
      }
      const query: CubeQuery = {}

      expect(getBindingKeyField(bindingKey, query)).toBe('Signups.userId')
    })

    it('should return empty string for empty cross-cube mappings', () => {
      const bindingKey: FunnelBindingKey = {
        dimension: [],
      }
      const query: CubeQuery = { measures: ['Test.count'] }

      expect(getBindingKeyField(bindingKey, query)).toBe('')
    })
  })

  describe('extractBindingKeyValues', () => {
    it('should extract unique string values', () => {
      const data = [
        { 'Users.userId': 'user-1' },
        { 'Users.userId': 'user-2' },
        { 'Users.userId': 'user-1' }, // duplicate
      ]

      const result = extractBindingKeyValues(data, 'Users.userId')

      expect(result.values).toContain('user-1')
      expect(result.values).toContain('user-2')
      expect(result.totalCount).toBe(2)
      expect(result.wasTruncated).toBe(false)
    })

    it('should extract unique number values', () => {
      const data = [
        { 'Orders.id': 1 },
        { 'Orders.id': 2 },
        { 'Orders.id': 1 }, // duplicate
      ]

      const result = extractBindingKeyValues(data, 'Orders.id')

      expect(result.values).toContain(1)
      expect(result.values).toContain(2)
      expect(result.totalCount).toBe(2)
    })

    it('should skip null and undefined values', () => {
      const data = [
        { 'Users.userId': 'user-1' },
        { 'Users.userId': null },
        { 'Users.userId': undefined },
        { 'Users.userId': 'user-2' },
      ]

      const result = extractBindingKeyValues(data, 'Users.userId')

      expect(result.values).toHaveLength(2)
      expect(result.totalCount).toBe(2)
    })

    it('should apply limit', () => {
      const data = Array.from({ length: 10 }, (_, i) => ({
        'Users.userId': `user-${i}`,
      }))

      const result = extractBindingKeyValues(data, 'Users.userId', 5)

      expect(result.values).toHaveLength(5)
      expect(result.totalCount).toBe(10)
      expect(result.wasTruncated).toBe(true)
    })

    it('should handle empty data', () => {
      const result = extractBindingKeyValues([], 'Users.userId')

      expect(result.values).toHaveLength(0)
      expect(result.totalCount).toBe(0)
      expect(result.wasTruncated).toBe(false)
    })

    it('should handle missing field in data', () => {
      const data = [
        { 'Other.field': 'value' },
      ]

      const result = extractBindingKeyValues(data, 'Users.userId')

      expect(result.values).toHaveLength(0)
      expect(result.totalCount).toBe(0)
    })

    it('should convert non-string/number values to strings', () => {
      const data = [
        { 'Users.userId': true },
        { 'Users.userId': false },
      ]

      const result = extractBindingKeyValues(data, 'Users.userId')

      expect(result.values).toContain('true')
      expect(result.values).toContain('false')
      expect(result.totalCount).toBe(2)
    })

    it('should use DEFAULT_BINDING_KEY_LIMIT by default', () => {
      const data = Array.from({ length: DEFAULT_BINDING_KEY_LIMIT + 100 }, (_, i) => ({
        'Users.userId': `user-${i}`,
      }))

      const result = extractBindingKeyValues(data, 'Users.userId')

      expect(result.values).toHaveLength(DEFAULT_BINDING_KEY_LIMIT)
      expect(result.wasTruncated).toBe(true)
    })
  })

  describe('buildStepQuery', () => {
    const bindingKey: FunnelBindingKey = { dimension: 'Users.userId' }

    it('should add binding key dimension if not present', () => {
      const step: FunnelStep = {
        id: 'step-1',
        name: 'Step 1',
        query: { measures: ['Signups.count'] },
      }

      const result = buildStepQuery(step, bindingKey, null)

      expect(result.dimensions).toContain('Users.userId')
      expect(result.measures).toContain('Signups.count')
    })

    it('should not duplicate binding key dimension', () => {
      const step: FunnelStep = {
        id: 'step-1',
        name: 'Step 1',
        query: {
          measures: ['Signups.count'],
          dimensions: ['Users.userId'],
        },
      }

      const result = buildStepQuery(step, bindingKey, null)

      expect(result.dimensions?.filter(d => d === 'Users.userId')).toHaveLength(1)
    })

    it('should not add filter for first step (null previousValues)', () => {
      const step: FunnelStep = {
        id: 'step-1',
        name: 'Step 1',
        query: { measures: ['Signups.count'] },
      }

      const result = buildStepQuery(step, bindingKey, null)

      expect(result.filters).toBeUndefined()
    })

    it('should add IN filter for subsequent steps', () => {
      const step: FunnelStep = {
        id: 'step-2',
        name: 'Step 2',
        query: { measures: ['Purchases.count'] },
      }
      const previousValues = ['user-1', 'user-2', 'user-3']

      const result = buildStepQuery(step, bindingKey, previousValues)

      expect(result.filters).toHaveLength(1)
      expect(result.filters![0]).toMatchObject({
        member: 'Users.userId',
        operator: 'in',
        values: previousValues,
      })
    })

    it('should not add filter for empty previous values', () => {
      const step: FunnelStep = {
        id: 'step-2',
        name: 'Step 2',
        query: { measures: ['Purchases.count'] },
      }

      const result = buildStepQuery(step, bindingKey, [])

      expect(result.filters).toBeUndefined()
    })

    it('should preserve existing filters', () => {
      const step: FunnelStep = {
        id: 'step-2',
        name: 'Step 2',
        query: {
          measures: ['Purchases.count'],
          filters: [{ member: 'Purchases.status', operator: 'equals', values: ['completed'] }],
        },
      }
      const previousValues = ['user-1']

      const result = buildStepQuery(step, bindingKey, previousValues)

      expect(result.filters).toHaveLength(2)
    })
  })

  describe('calculateStepMetrics', () => {
    it('should calculate conversion rate from previous step', () => {
      const result = calculateStepMetrics(50, 100, 100)

      expect(result.conversionRate).toBe(0.5)
      expect(result.cumulativeConversionRate).toBe(0.5)
    })

    it('should return null conversion rate for first step', () => {
      const result = calculateStepMetrics(100, null, 100)

      expect(result.conversionRate).toBeNull()
      expect(result.cumulativeConversionRate).toBe(1.0)
    })

    it('should handle zero previous count', () => {
      const result = calculateStepMetrics(0, 0, 100)

      expect(result.conversionRate).toBeNull()
      expect(result.cumulativeConversionRate).toBe(0)
    })

    it('should handle zero first step count', () => {
      const result = calculateStepMetrics(0, 50, 0)

      expect(result.cumulativeConversionRate).toBe(1.0)
    })
  })

  describe('buildStepResult', () => {
    const step: FunnelStep = {
      id: 'step-1',
      name: 'Signups',
      query: { measures: ['Signups.count'] },
    }

    it('should build result for first step', () => {
      const data = [
        { 'Users.userId': 'user-1' },
        { 'Users.userId': 'user-2' },
      ]

      const result = buildStepResult(
        step,
        0,
        data,
        'Users.userId',
        true,
        null,
        0, // first step
        100
      )

      expect(result.stepIndex).toBe(0)
      expect(result.stepName).toBe('Signups')
      expect(result.stepId).toBe('step-1')
      expect(result.count).toBe(2) // unique count
      expect(result.conversionRate).toBeNull()
      expect(result.cumulativeConversionRate).toBe(1.0)
      expect(result.bindingKeyValues).toHaveLength(2)
      expect(result.executionTime).toBe(100)
      expect(result.error).toBeNull()
    })

    it('should build result for subsequent step with conversion', () => {
      const data = [
        { 'Users.userId': 'user-1' },
      ]

      const result = buildStepResult(
        step,
        1,
        data,
        'Users.userId',
        true,
        2, // previous count
        2, // first step count
        50
      )

      expect(result.count).toBe(1)
      expect(result.conversionRate).toBe(0.5)
      expect(result.cumulativeConversionRate).toBe(0.5)
    })

    it('should count rows when countUnique is false', () => {
      const data = [
        { 'Users.userId': 'user-1' },
        { 'Users.userId': 'user-1' }, // duplicate
        { 'Users.userId': 'user-2' },
      ]

      const result = buildStepResult(
        step,
        0,
        data,
        'Users.userId',
        false, // countUnique = false
        null,
        0,
        100
      )

      expect(result.count).toBe(3) // row count, not unique count
      expect(result.bindingKeyValues).toHaveLength(2) // still extracts unique for next step
    })

    it('should handle error state', () => {
      const error = new Error('Query failed')

      const result = buildStepResult(
        step,
        0,
        [],
        'Users.userId',
        true,
        null,
        0,
        100,
        error
      )

      expect(result.count).toBe(0)
      expect(result.error).toBe(error)
      expect(result.bindingKeyValues).toHaveLength(0)
    })
  })

  describe('buildFunnelChartData', () => {
    it('should convert step results to chart data', () => {
      const stepResults: FunnelStepResult[] = [
        {
          stepIndex: 0,
          stepName: 'Signups',
          stepId: 'step-1',
          data: [],
          bindingKeyValues: [],
          bindingKeyTotalCount: 100,
          count: 100,
          conversionRate: null,
          cumulativeConversionRate: 1.0,
          executionTime: 50,
          error: null,
        },
        {
          stepIndex: 1,
          stepName: 'Purchases',
          stepId: 'step-2',
          data: [],
          bindingKeyValues: [],
          bindingKeyTotalCount: 50,
          count: 50,
          conversionRate: 0.5,
          cumulativeConversionRate: 0.5,
          executionTime: 50,
          error: null,
        },
      ]

      const chartData = buildFunnelChartData(stepResults)

      expect(chartData).toHaveLength(2)
      expect(chartData[0]).toMatchObject({
        name: 'Signups',
        value: 100,
        percentage: 100,
        stepIndex: 0,
      })
      expect(chartData[1]).toMatchObject({
        name: 'Purchases',
        value: 50,
        percentage: 50,
        stepIndex: 1,
      })
    })

    it('should handle empty step results', () => {
      const chartData = buildFunnelChartData([])

      expect(chartData).toHaveLength(0)
    })

    it('should handle zero first step count', () => {
      const stepResults: FunnelStepResult[] = [
        {
          stepIndex: 0,
          stepName: 'Empty',
          stepId: 'step-1',
          data: [],
          bindingKeyValues: [],
          bindingKeyTotalCount: 0,
          count: 0,
          conversionRate: null,
          cumulativeConversionRate: 1.0,
          executionTime: 50,
          error: null,
        },
      ]

      const chartData = buildFunnelChartData(stepResults)

      expect(chartData[0].percentage).toBe(0)
    })
  })

  describe('buildFunnelResult', () => {
    const config: FunnelConfig = {
      id: 'funnel-1',
      name: 'Test Funnel',
      bindingKey: { dimension: 'Users.userId' },
      steps: [
        { id: 'step-1', name: 'Step 1', query: { measures: ['A.count'] } },
        { id: 'step-2', name: 'Step 2', query: { measures: ['B.count'] } },
      ],
    }

    it('should build complete funnel result', () => {
      const stepResults: FunnelStepResult[] = [
        {
          stepIndex: 0,
          stepName: 'Step 1',
          stepId: 'step-1',
          data: [],
          bindingKeyValues: [],
          bindingKeyTotalCount: 100,
          count: 100,
          conversionRate: null,
          cumulativeConversionRate: 1.0,
          executionTime: 50,
          error: null,
        },
        {
          stepIndex: 1,
          stepName: 'Step 2',
          stepId: 'step-2',
          data: [],
          bindingKeyValues: [],
          bindingKeyTotalCount: 25,
          count: 25,
          conversionRate: 0.25,
          cumulativeConversionRate: 0.25,
          executionTime: 50,
          error: null,
        },
      ]

      const result = buildFunnelResult(config, stepResults, 'success')

      expect(result.config).toBe(config)
      expect(result.steps).toBe(stepResults)
      expect(result.status).toBe('success')
      expect(result.summary.totalEntries).toBe(100)
      expect(result.summary.totalCompletions).toBe(25)
      expect(result.summary.overallConversionRate).toBe(0.25)
      expect(result.summary.totalExecutionTime).toBe(100)
      expect(result.chartData).toHaveLength(2)
    })

    it('should handle error state', () => {
      const error = new Error('Execution failed')

      const result = buildFunnelResult(config, [], 'error', error)

      expect(result.status).toBe('error')
      expect(result.error).toBe(error)
    })
  })

  describe('createEmptyFunnelResult', () => {
    it('should create empty result with idle status', () => {
      const config: FunnelConfig = {
        id: 'funnel-1',
        name: 'Test',
        bindingKey: { dimension: 'Users.userId' },
        steps: [],
      }

      const result = createEmptyFunnelResult(config)

      expect(result.config).toBe(config)
      expect(result.steps).toHaveLength(0)
      expect(result.status).toBe('idle')
      expect(result.summary.totalEntries).toBe(0)
      expect(result.summary.overallConversionRate).toBe(0)
      expect(result.chartData).toHaveLength(0)
    })
  })

  describe('buildFunnelConfigFromQueries', () => {
    it('should build config from queries array', () => {
      const queries: CubeQuery[] = [
        { measures: ['Signups.count'] },
        { measures: ['Purchases.count'] },
      ]
      const bindingKey: FunnelBindingKey = { dimension: 'Users.userId' }

      const config = buildFunnelConfigFromQueries(queries, bindingKey)

      expect(config.steps).toHaveLength(2)
      expect(config.steps[0].name).toBe('Step 1')
      expect(config.steps[0].query).toEqual(queries[0])
      expect(config.steps[1].name).toBe('Step 2')
      expect(config.bindingKey).toBe(bindingKey)
      expect(config.countUnique).toBe(true)
    })

    it('should use custom step labels', () => {
      const queries: CubeQuery[] = [
        { measures: ['A.count'] },
        { measures: ['B.count'] },
      ]
      const bindingKey: FunnelBindingKey = { dimension: 'id' }
      const labels = ['Signup', 'Purchase']

      const config = buildFunnelConfigFromQueries(queries, bindingKey, labels)

      expect(config.steps[0].name).toBe('Signup')
      expect(config.steps[1].name).toBe('Purchase')
    })

    it('should set time windows per step', () => {
      const queries: CubeQuery[] = [
        { measures: ['A.count'] },
        { measures: ['B.count'] },
      ]
      const bindingKey: FunnelBindingKey = { dimension: 'id' }
      const timeWindows = [null, 'P7D']

      const config = buildFunnelConfigFromQueries(queries, bindingKey, undefined, timeWindows)

      expect(config.steps[0].timeToConvert).toBeUndefined()
      expect(config.steps[1].timeToConvert).toBe('P7D')
    })
  })

  describe('shouldStopFunnelExecution', () => {
    it('should return true when binding key values are empty', () => {
      const stepResult: FunnelStepResult = {
        stepIndex: 0,
        stepName: 'Test',
        stepId: 'test',
        data: [],
        bindingKeyValues: [],
        bindingKeyTotalCount: 0,
        count: 0,
        conversionRate: null,
        cumulativeConversionRate: 1.0,
        executionTime: 50,
        error: null,
      }

      expect(shouldStopFunnelExecution(stepResult)).toBe(true)
    })

    it('should return true when step has error', () => {
      const stepResult: FunnelStepResult = {
        stepIndex: 0,
        stepName: 'Test',
        stepId: 'test',
        data: [],
        bindingKeyValues: ['user-1'],
        bindingKeyTotalCount: 1,
        count: 1,
        conversionRate: null,
        cumulativeConversionRate: 1.0,
        executionTime: 50,
        error: new Error('Failed'),
      }

      expect(shouldStopFunnelExecution(stepResult)).toBe(true)
    })

    it('should return false when step has values and no error', () => {
      const stepResult: FunnelStepResult = {
        stepIndex: 0,
        stepName: 'Test',
        stepId: 'test',
        data: [],
        bindingKeyValues: ['user-1', 'user-2'],
        bindingKeyTotalCount: 2,
        count: 2,
        conversionRate: null,
        cumulativeConversionRate: 1.0,
        executionTime: 50,
        error: null,
      }

      expect(shouldStopFunnelExecution(stepResult)).toBe(false)
    })
  })

  describe('isFunnelData', () => {
    it('should return true for data with __stepIndex field', () => {
      const data = [
        { __stepIndex: 0, value: 100 },
        { __stepIndex: 1, value: 50 },
      ]

      expect(isFunnelData(data)).toBe(true)
    })

    it('should return false for regular data', () => {
      const data = [
        { 'Users.count': 100 },
        { 'Users.count': 50 },
      ]

      expect(isFunnelData(data)).toBe(false)
    })

    it('should return false for empty array', () => {
      expect(isFunnelData([])).toBe(false)
    })

    it('should return false for non-object data', () => {
      const data = [1, 2, 3] as unknown[]

      expect(isFunnelData(data)).toBe(false)
    })

    it('should return false for null first element', () => {
      const data = [null, { __stepIndex: 0 }] as unknown[]

      expect(isFunnelData(data)).toBe(false)
    })
  })

  describe('DEFAULT_BINDING_KEY_LIMIT', () => {
    it('should be exported and have expected value', () => {
      expect(DEFAULT_BINDING_KEY_LIMIT).toBe(500)
    })
  })
})
