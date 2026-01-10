/**
 * Tests for Query Mode Adapter
 */

import { describe, it, expect } from 'vitest'
import { queryModeAdapter, type QuerySliceState } from '../../../src/client/adapters/queryModeAdapter'
import type { QueryAnalysisConfig, ChartConfig } from '../../../src/client/types/analysisConfig'
import type { CubeQuery, MultiQueryConfig } from '../../../src/client/types'

describe('queryModeAdapter', () => {
  describe('createInitial', () => {
    it('should create initial state with empty query', () => {
      const state = queryModeAdapter.createInitial()

      expect(state.queryStates).toHaveLength(1)
      expect(state.queryStates[0].metrics).toEqual([])
      expect(state.queryStates[0].breakdowns).toEqual([])
      expect(state.queryStates[0].filters).toEqual([])
      expect(state.activeQueryIndex).toBe(0)
      expect(state.mergeStrategy).toBe('concat')
    })
  })

  describe('canLoad', () => {
    it('should return true for valid query config', () => {
      const config: QueryAnalysisConfig = {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: {},
        query: { measures: ['Test.count'] },
      }

      expect(queryModeAdapter.canLoad(config)).toBe(true)
    })

    it('should return false for funnel config', () => {
      const config = {
        version: 1,
        analysisType: 'funnel',
        activeView: 'chart',
        charts: {},
        query: { funnel: { bindingKey: '', timeDimension: '', steps: [] } },
      }

      expect(queryModeAdapter.canLoad(config)).toBe(false)
    })

    it('should return false for invalid version', () => {
      const config = {
        version: 2,
        analysisType: 'query',
        activeView: 'chart',
        charts: {},
        query: { measures: [] },
      }

      expect(queryModeAdapter.canLoad(config)).toBe(false)
    })

    it('should return false for null', () => {
      expect(queryModeAdapter.canLoad(null)).toBe(false)
    })

    it('should return false for missing query', () => {
      const config = {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: {},
      }

      expect(queryModeAdapter.canLoad(config)).toBe(false)
    })
  })

  describe('load', () => {
    it('should load a single query config', () => {
      const config: QueryAnalysisConfig = {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: {},
        query: {
          measures: ['Employees.count', 'Employees.avgSalary'],
          dimensions: ['Employees.department'],
          timeDimensions: [{ dimension: 'Employees.createdAt', granularity: 'month' }],
          filters: [{ member: 'Employees.active', operator: 'equals', values: [true] }],
        },
      }

      const state = queryModeAdapter.load(config)

      expect(state.queryStates).toHaveLength(1)
      expect(state.queryStates[0].metrics).toHaveLength(2)
      expect(state.queryStates[0].metrics[0].field).toBe('Employees.count')
      expect(state.queryStates[0].metrics[0].label).toBe('A')
      expect(state.queryStates[0].metrics[1].field).toBe('Employees.avgSalary')
      expect(state.queryStates[0].metrics[1].label).toBe('B')
      expect(state.queryStates[0].breakdowns).toHaveLength(2) // 1 dimension + 1 timeDimension
      expect(state.queryStates[0].filters).toHaveLength(1)
      expect(state.mergeStrategy).toBe('concat')
    })

    it('should load a multi-query config', () => {
      const config: QueryAnalysisConfig = {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: {},
        query: {
          queries: [
            { measures: ['Sales.count'], dimensions: ['Sales.date'] },
            { measures: ['Returns.count'], dimensions: ['Returns.date'] },
          ],
          mergeStrategy: 'merge',
        } as MultiQueryConfig,
      }

      const state = queryModeAdapter.load(config)

      expect(state.queryStates).toHaveLength(2)
      expect(state.queryStates[0].metrics[0].field).toBe('Sales.count')
      expect(state.queryStates[1].metrics[0].field).toBe('Returns.count')
      expect(state.mergeStrategy).toBe('merge')
    })

    it('should throw for non-query config', () => {
      const config = {
        version: 1,
        analysisType: 'funnel',
        activeView: 'chart',
        charts: {},
        query: { funnel: {} },
      } as unknown as QueryAnalysisConfig

      expect(() => queryModeAdapter.load(config)).toThrow()
    })
  })

  describe('save', () => {
    it('should save single query state', () => {
      const state: QuerySliceState = {
        queryStates: [{
          metrics: [{ id: '1', field: 'Employees.count', label: 'A' }],
          breakdowns: [{ id: '2', field: 'Employees.department', isTimeDimension: false }],
          filters: [],
          validationStatus: 'idle',
          validationError: null,
        }],
        activeQueryIndex: 0,
        mergeStrategy: 'concat',
      }

      const charts: Partial<Record<'query' | 'funnel', ChartConfig>> = {
        query: { chartType: 'bar', chartConfig: {}, displayConfig: {} },
      }

      const config = queryModeAdapter.save(state, charts, 'chart')

      expect(config.version).toBe(1)
      expect(config.analysisType).toBe('query')
      expect(config.activeView).toBe('chart')
      expect((config.query as CubeQuery).measures).toEqual(['Employees.count'])
      expect((config.query as CubeQuery).dimensions).toEqual(['Employees.department'])
    })

    it('should save multi-query state', () => {
      const state: QuerySliceState = {
        queryStates: [
          {
            metrics: [{ id: '1', field: 'Sales.count', label: 'A' }],
            breakdowns: [],
            filters: [],
            validationStatus: 'idle',
            validationError: null,
          },
          {
            metrics: [{ id: '2', field: 'Returns.count', label: 'A' }],
            breakdowns: [],
            filters: [],
            validationStatus: 'idle',
            validationError: null,
          },
        ],
        activeQueryIndex: 0,
        mergeStrategy: 'merge',
      }

      const charts: Partial<Record<'query' | 'funnel', ChartConfig>> = {}

      const config = queryModeAdapter.save(state, charts, 'table')

      expect(config.activeView).toBe('table')
      expect('queries' in config.query).toBe(true)
      expect((config.query as MultiQueryConfig).queries).toHaveLength(2)
      expect((config.query as MultiQueryConfig).mergeStrategy).toBe('merge')
    })
  })

  describe('validate', () => {
    it('should return valid for state with metrics', () => {
      const state: QuerySliceState = {
        queryStates: [{
          metrics: [{ id: '1', field: 'Test.count', label: 'A' }],
          breakdowns: [],
          filters: [],
          validationStatus: 'idle',
          validationError: null,
        }],
        activeQueryIndex: 0,
        mergeStrategy: 'concat',
      }

      const result = queryModeAdapter.validate(state)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return invalid for state without metrics', () => {
      const state: QuerySliceState = {
        queryStates: [{
          metrics: [],
          breakdowns: [],
          filters: [],
          validationStatus: 'idle',
          validationError: null,
        }],
        activeQueryIndex: 0,
        mergeStrategy: 'concat',
      }

      const result = queryModeAdapter.validate(state)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('At least one metric is required')
    })

    it('should warn for empty query', () => {
      const state: QuerySliceState = {
        queryStates: [{
          metrics: [],
          breakdowns: [],
          filters: [],
          validationStatus: 'idle',
          validationError: null,
        }],
        activeQueryIndex: 0,
        mergeStrategy: 'concat',
      }

      const result = queryModeAdapter.validate(state)

      expect(result.warnings.some(w => w.includes('empty'))).toBe(true)
    })
  })

  describe('clear', () => {
    it('should reset to initial state', () => {
      const state: QuerySliceState = {
        queryStates: [
          { metrics: [{ id: '1', field: 'Test.count', label: 'A' }], breakdowns: [], filters: [], validationStatus: 'idle', validationError: null },
          { metrics: [{ id: '2', field: 'Test.sum', label: 'A' }], breakdowns: [], filters: [], validationStatus: 'idle', validationError: null },
        ],
        activeQueryIndex: 1,
        mergeStrategy: 'merge',
      }

      const cleared = queryModeAdapter.clear(state)

      expect(cleared.queryStates).toHaveLength(1)
      expect(cleared.queryStates[0].metrics).toEqual([])
      expect(cleared.activeQueryIndex).toBe(0)
      expect(cleared.mergeStrategy).toBe('concat')
    })
  })

  describe('getDefaultChartConfig', () => {
    it('should return bar chart config', () => {
      const config = queryModeAdapter.getDefaultChartConfig()

      expect(config.chartType).toBe('bar')
      expect(config.chartConfig).toEqual({})
      expect(config.displayConfig).toEqual({ showLegend: true, showGrid: true, showTooltip: true })
    })
  })

  describe('round-trip', () => {
    it('should preserve data through save -> load cycle', () => {
      const originalState: QuerySliceState = {
        queryStates: [{
          metrics: [
            { id: '1', field: 'Employees.count', label: 'A' },
            { id: '2', field: 'Employees.avgSalary', label: 'B' },
          ],
          breakdowns: [
            { id: '3', field: 'Employees.department', isTimeDimension: false },
            { id: '4', field: 'Employees.createdAt', granularity: 'month', isTimeDimension: true },
          ],
          filters: [{ member: 'Employees.active', operator: 'equals', values: [true] }],
          order: { 'Employees.count': 'desc' },
          validationStatus: 'idle',
          validationError: null,
        }],
        activeQueryIndex: 0,
        mergeStrategy: 'concat',
      }

      const charts: Partial<Record<'query' | 'funnel', ChartConfig>> = {
        query: { chartType: 'line', chartConfig: { xAxis: ['date'] }, displayConfig: { showLegend: true } },
      }

      const config = queryModeAdapter.save(originalState, charts, 'chart')
      const loadedState = queryModeAdapter.load(config)

      // Check metrics match
      expect(loadedState.queryStates[0].metrics).toHaveLength(2)
      expect(loadedState.queryStates[0].metrics.map(m => m.field)).toEqual(['Employees.count', 'Employees.avgSalary'])

      // Check breakdowns match
      expect(loadedState.queryStates[0].breakdowns).toHaveLength(2)
      expect(loadedState.queryStates[0].breakdowns[0].field).toBe('Employees.department')
      expect(loadedState.queryStates[0].breakdowns[1].field).toBe('Employees.createdAt')
      expect(loadedState.queryStates[0].breakdowns[1].granularity).toBe('month')

      // Check filters match
      expect(loadedState.queryStates[0].filters).toHaveLength(1)
      expect(loadedState.queryStates[0].filters[0].member).toBe('Employees.active')

      // Check order matches
      expect(loadedState.queryStates[0].order).toEqual({ 'Employees.count': 'desc' })
    })
  })
})
