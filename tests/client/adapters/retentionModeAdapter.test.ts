/**
 * Tests for Retention Mode Adapter
 *
 * Tests the simplified Mixpanel-style retention format with:
 * - Single cube for all analysis
 * - Single timestamp dimension
 * - Optional breakdowns for segmentation
 * - Granularity = viewing periods
 */

import { describe, it, expect } from 'vitest'
import { retentionModeAdapter } from '../../../src/client/adapters/retentionModeAdapter'
import type { RetentionSliceState } from '../../../src/client/types/retention'
import type { RetentionAnalysisConfig, ChartConfig, AnalysisType } from '../../../src/client/types/analysisConfig'

describe('retentionModeAdapter', () => {
  describe('createInitial', () => {
    it('should create initial state with default values', () => {
      const state = retentionModeAdapter.createInitial()

      expect(state.retentionCube).toBeNull()
      expect(state.retentionBindingKey).toBeNull()
      expect(state.retentionTimeDimension).toBeNull()
      expect(state.retentionDateRange).toBeDefined()
      expect(state.retentionViewGranularity).toBe('week')
      expect(state.retentionPeriods).toBe(12)
      expect(state.retentionType).toBe('classic')
      expect(state.retentionCohortFilters).toEqual([])
      expect(state.retentionActivityFilters).toEqual([])
      expect(state.retentionBreakdowns).toEqual([])
    })
  })

  describe('canLoad', () => {
    it('should return true for valid retention config', () => {
      const config: RetentionAnalysisConfig = {
        version: 1,
        analysisType: 'retention',
        activeView: 'chart',
        charts: {},
        query: {
          retention: {
            timeDimension: 'Events.timestamp',
            bindingKey: 'Events.userId',
            dateRange: { start: '2024-01-01', end: '2024-12-31' },
            granularity: 'week',
            periods: 12,
            retentionType: 'classic'
          }
        }
      }

      expect(retentionModeAdapter.canLoad(config)).toBe(true)
    })

    it('should return false for query config', () => {
      const config = {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: {},
        query: { measures: [] }
      }

      expect(retentionModeAdapter.canLoad(config)).toBe(false)
    })

    it('should return false for funnel config', () => {
      const config = {
        version: 1,
        analysisType: 'funnel',
        activeView: 'chart',
        charts: {},
        query: {
          funnel: {
            bindingKey: 'Events.userId',
            timeDimension: 'Events.timestamp',
            steps: []
          }
        }
      }

      expect(retentionModeAdapter.canLoad(config)).toBe(false)
    })

    it('should return false for invalid object', () => {
      expect(retentionModeAdapter.canLoad(null)).toBe(false)
      expect(retentionModeAdapter.canLoad(undefined)).toBe(false)
      expect(retentionModeAdapter.canLoad({})).toBe(false)
      expect(retentionModeAdapter.canLoad({ version: 2 })).toBe(false)
    })
  })

  describe('load', () => {
    it('should load retention config into state', () => {
      const config: RetentionAnalysisConfig = {
        version: 1,
        analysisType: 'retention',
        activeView: 'chart',
        charts: {},
        query: {
          retention: {
            timeDimension: 'Events.timestamp',
            bindingKey: 'Events.userId',
            dateRange: { start: '2024-01-01', end: '2024-12-31' },
            granularity: 'week',
            periods: 8,
            retentionType: 'rolling'
          }
        }
      }

      const state = retentionModeAdapter.load(config)

      expect(state.retentionCube).toBe('Events')
      expect(state.retentionBindingKey).toEqual({ dimension: 'Events.userId' })
      expect(state.retentionTimeDimension).toBe('Events.timestamp')
      expect(state.retentionDateRange).toEqual({ start: '2024-01-01', end: '2024-12-31' })
      expect(state.retentionViewGranularity).toBe('week')
      expect(state.retentionPeriods).toBe(8)
      expect(state.retentionType).toBe('rolling')
    })

    it('should load retention config with filters', () => {
      const config: RetentionAnalysisConfig = {
        version: 1,
        analysisType: 'retention',
        activeView: 'chart',
        charts: {},
        query: {
          retention: {
            timeDimension: 'Events.timestamp',
            bindingKey: 'Events.userId',
            dateRange: { start: '2024-01-01', end: '2024-12-31' },
            granularity: 'month',
            periods: 6,
            retentionType: 'classic',
            cohortFilters: { member: 'Events.type', operator: 'equals', values: ['signup'] },
            activityFilters: { member: 'Events.type', operator: 'equals', values: ['login'] }
          }
        }
      }

      const state = retentionModeAdapter.load(config)

      expect(state.retentionCohortFilters).toEqual([
        { member: 'Events.type', operator: 'equals', values: ['signup'] }
      ])
      expect(state.retentionActivityFilters).toEqual([
        { member: 'Events.type', operator: 'equals', values: ['login'] }
      ])
    })

    it('should load retention config with breakdowns', () => {
      const config: RetentionAnalysisConfig = {
        version: 1,
        analysisType: 'retention',
        activeView: 'chart',
        charts: {},
        query: {
          retention: {
            timeDimension: 'Events.timestamp',
            bindingKey: 'Events.userId',
            dateRange: { start: '2024-01-01', end: '2024-12-31' },
            granularity: 'week',
            periods: 12,
            retentionType: 'classic',
            breakdownDimensions: ['Events.country', 'Events.plan']
          }
        }
      }

      const state = retentionModeAdapter.load(config)

      expect(state.retentionBreakdowns).toEqual([
        { field: 'Events.country', label: 'country' },
        { field: 'Events.plan', label: 'plan' }
      ])
    })

    it('should throw error for non-retention config', () => {
      const config = {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: {},
        query: { measures: [] }
      } as unknown as RetentionAnalysisConfig

      expect(() => retentionModeAdapter.load(config)).toThrow()
    })
  })

  describe('save', () => {
    it('should save state to retention config', () => {
      const state: RetentionSliceState = {
        retentionCube: 'Events',
        retentionBindingKey: { dimension: 'Events.userId' },
        retentionTimeDimension: 'Events.timestamp',
        retentionDateRange: { start: '2024-01-01', end: '2024-12-31' },
        retentionViewGranularity: 'week',
        retentionPeriods: 12,
        retentionType: 'classic',
        retentionCohortFilters: [],
        retentionActivityFilters: [],
        retentionBreakdowns: []
      }

      const charts: Partial<Record<AnalysisType, ChartConfig>> = {}
      const config = retentionModeAdapter.save(state, charts, 'chart')

      expect(config.version).toBe(1)
      expect(config.analysisType).toBe('retention')
      expect(config.activeView).toBe('chart')
      expect(config.query.retention.timeDimension).toBe('Events.timestamp')
      expect(config.query.retention.bindingKey).toBe('Events.userId')
      expect(config.query.retention.dateRange).toEqual({ start: '2024-01-01', end: '2024-12-31' })
      expect(config.query.retention.granularity).toBe('week')
      expect(config.query.retention.periods).toBe(12)
      expect(config.query.retention.retentionType).toBe('classic')
    })

    it('should save state with filters', () => {
      const state: RetentionSliceState = {
        retentionCube: 'Events',
        retentionBindingKey: { dimension: 'Events.userId' },
        retentionTimeDimension: 'Events.timestamp',
        retentionDateRange: { start: '2024-01-01', end: '2024-12-31' },
        retentionViewGranularity: 'month',
        retentionPeriods: 6,
        retentionType: 'classic',
        retentionCohortFilters: [{ member: 'Events.type', operator: 'equals', values: ['signup'] }],
        retentionActivityFilters: [{ member: 'Events.type', operator: 'equals', values: ['login'] }],
        retentionBreakdowns: []
      }

      const config = retentionModeAdapter.save(state, {}, 'chart')

      expect(config.query.retention.cohortFilters).toEqual(
        { member: 'Events.type', operator: 'equals', values: ['signup'] }
      )
      expect(config.query.retention.activityFilters).toEqual(
        { member: 'Events.type', operator: 'equals', values: ['login'] }
      )
    })

    it('should save state with breakdowns', () => {
      const state: RetentionSliceState = {
        retentionCube: 'Events',
        retentionBindingKey: { dimension: 'Events.userId' },
        retentionTimeDimension: 'Events.timestamp',
        retentionDateRange: { start: '2024-01-01', end: '2024-12-31' },
        retentionViewGranularity: 'week',
        retentionPeriods: 12,
        retentionType: 'classic',
        retentionCohortFilters: [],
        retentionActivityFilters: [],
        retentionBreakdowns: [
          { field: 'Events.country', label: 'Country' },
          { field: 'Events.plan', label: 'Plan' }
        ]
      }

      const config = retentionModeAdapter.save(state, {}, 'chart')

      expect(config.query.retention.breakdownDimensions).toEqual([
        'Events.country',
        'Events.plan'
      ])
    })

    it('should include chart config in saved config', () => {
      const state: RetentionSliceState = {
        retentionCube: 'Events',
        retentionBindingKey: { dimension: 'Events.userId' },
        retentionTimeDimension: 'Events.timestamp',
        retentionDateRange: { start: '2024-01-01', end: '2024-12-31' },
        retentionViewGranularity: 'week',
        retentionPeriods: 12,
        retentionType: 'classic',
        retentionCohortFilters: [],
        retentionActivityFilters: [],
        retentionBreakdowns: []
      }

      const charts: Partial<Record<AnalysisType, ChartConfig>> = {
        retention: {
          chartType: 'retentionCombined',
          chartConfig: {},
          displayConfig: { showLegend: true }
        }
      }

      const config = retentionModeAdapter.save(state, charts, 'chart')

      expect(config.charts.retention).toEqual({
        chartType: 'retentionCombined',
        chartConfig: {},
        displayConfig: { showLegend: true }
      })
    })
  })

  describe('validate', () => {
    it('should return valid for complete config', () => {
      const state: RetentionSliceState = {
        retentionCube: 'Events',
        retentionBindingKey: { dimension: 'Events.userId' },
        retentionTimeDimension: 'Events.timestamp',
        retentionDateRange: { start: '2024-01-01', end: '2024-12-31' },
        retentionViewGranularity: 'week',
        retentionPeriods: 12,
        retentionType: 'classic',
        retentionCohortFilters: [],
        retentionActivityFilters: [],
        retentionBreakdowns: []
      }

      const result = retentionModeAdapter.validate(state)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return error for missing cube', () => {
      const state: RetentionSliceState = {
        retentionCube: null,
        retentionBindingKey: { dimension: 'Events.userId' },
        retentionTimeDimension: 'Events.timestamp',
        retentionDateRange: { start: '2024-01-01', end: '2024-12-31' },
        retentionViewGranularity: 'week',
        retentionPeriods: 12,
        retentionType: 'classic',
        retentionCohortFilters: [],
        retentionActivityFilters: [],
        retentionBreakdowns: []
      }

      const result = retentionModeAdapter.validate(state)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Select a cube for retention analysis')
    })

    it('should return error for missing time dimension', () => {
      const state: RetentionSliceState = {
        retentionCube: 'Events',
        retentionBindingKey: { dimension: 'Events.userId' },
        retentionTimeDimension: null,
        retentionDateRange: { start: '2024-01-01', end: '2024-12-31' },
        retentionViewGranularity: 'week',
        retentionPeriods: 12,
        retentionType: 'classic',
        retentionCohortFilters: [],
        retentionActivityFilters: [],
        retentionBreakdowns: []
      }

      const result = retentionModeAdapter.validate(state)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Select a timestamp dimension for the analysis')
    })

    it('should return error for missing binding key', () => {
      const state: RetentionSliceState = {
        retentionCube: 'Events',
        retentionBindingKey: null,
        retentionTimeDimension: 'Events.timestamp',
        retentionDateRange: { start: '2024-01-01', end: '2024-12-31' },
        retentionViewGranularity: 'week',
        retentionPeriods: 12,
        retentionType: 'classic',
        retentionCohortFilters: [],
        retentionActivityFilters: [],
        retentionBreakdowns: []
      }

      const result = retentionModeAdapter.validate(state)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Select a user identifier (binding key) to track retention')
    })

    it('should return error for missing date range', () => {
      const state: RetentionSliceState = {
        retentionCube: 'Events',
        retentionBindingKey: { dimension: 'Events.userId' },
        retentionTimeDimension: 'Events.timestamp',
        retentionDateRange: { start: '', end: '' },
        retentionViewGranularity: 'week',
        retentionPeriods: 12,
        retentionType: 'classic',
        retentionCohortFilters: [],
        retentionActivityFilters: [],
        retentionBreakdowns: []
      }

      const result = retentionModeAdapter.validate(state)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Date range is required for retention analysis')
    })

    it('should return warning for high period count', () => {
      const state: RetentionSliceState = {
        retentionCube: 'Events',
        retentionBindingKey: { dimension: 'Events.userId' },
        retentionTimeDimension: 'Events.timestamp',
        retentionDateRange: { start: '2024-01-01', end: '2024-12-31' },
        retentionViewGranularity: 'day',
        retentionPeriods: 60,
        retentionType: 'classic',
        retentionCohortFilters: [],
        retentionActivityFilters: [],
        retentionBreakdowns: []
      }

      const result = retentionModeAdapter.validate(state)

      expect(result.isValid).toBe(true) // High periods is a warning, not an error
      expect(result.warnings).toContain('More than 52 periods may impact performance')
    })
  })

  describe('clear', () => {
    it('should clear state but keep cube and date range', () => {
      const state: RetentionSliceState = {
        retentionCube: 'Events',
        retentionBindingKey: { dimension: 'Events.userId' },
        retentionTimeDimension: 'Events.timestamp',
        retentionDateRange: { start: '2024-01-01', end: '2024-12-31' },
        retentionViewGranularity: 'month',
        retentionPeriods: 6,
        retentionType: 'rolling',
        retentionCohortFilters: [{ member: 'Events.type', operator: 'equals', values: ['signup'] }],
        retentionActivityFilters: [{ member: 'Events.type', operator: 'equals', values: ['login'] }],
        retentionBreakdowns: [{ field: 'Events.country', label: 'Country' }]
      }

      const clearedState = retentionModeAdapter.clear(state)

      // Should preserve cube and date range
      expect(clearedState.retentionCube).toBe('Events')
      expect(clearedState.retentionDateRange).toEqual({ start: '2024-01-01', end: '2024-12-31' })

      // Should clear everything else
      expect(clearedState.retentionBindingKey).toBeNull()
      expect(clearedState.retentionTimeDimension).toBeNull()
      expect(clearedState.retentionCohortFilters).toEqual([])
      expect(clearedState.retentionActivityFilters).toEqual([])
      expect(clearedState.retentionBreakdowns).toEqual([])
    })
  })

  describe('getDefaultChartConfig', () => {
    it('should return retentionCombined as default chart type', () => {
      const chartConfig = retentionModeAdapter.getDefaultChartConfig()

      expect(chartConfig.chartType).toBe('retentionCombined')
      expect(chartConfig.displayConfig).toBeDefined()
      expect(chartConfig.displayConfig.showLegend).toBe(true)
    })
  })

  describe('extractState', () => {
    it('should extract retention state from store', () => {
      const storeState = {
        retentionCube: 'Events',
        retentionBindingKey: { dimension: 'Events.userId' },
        retentionTimeDimension: 'Events.timestamp',
        retentionDateRange: { start: '2024-01-01', end: '2024-12-31' },
        retentionViewGranularity: 'week',
        retentionPeriods: 12,
        retentionType: 'classic',
        retentionCohortFilters: [],
        retentionActivityFilters: [],
        retentionBreakdowns: [],
        // Other store fields that should be ignored
        analysisType: 'retention',
        queryStates: [],
        charts: {}
      }

      const extracted = retentionModeAdapter.extractState(storeState)

      expect(extracted.retentionCube).toBe('Events')
      expect(extracted.retentionBindingKey).toEqual({ dimension: 'Events.userId' })
      expect(extracted.retentionTimeDimension).toBe('Events.timestamp')
      expect(extracted.retentionDateRange).toEqual({ start: '2024-01-01', end: '2024-12-31' })
      expect(extracted.retentionViewGranularity).toBe('week')
      expect(extracted.retentionPeriods).toBe(12)
      expect(extracted.retentionType).toBe('classic')
      expect(extracted.retentionCohortFilters).toEqual([])
      expect(extracted.retentionActivityFilters).toEqual([])
      expect(extracted.retentionBreakdowns).toEqual([])
    })

    it('should use defaults for missing values', () => {
      const storeState = {
        retentionCube: 'Events'
        // Other fields missing
      }

      const extracted = retentionModeAdapter.extractState(storeState)

      expect(extracted.retentionCube).toBe('Events')
      expect(extracted.retentionViewGranularity).toBe('week') // default
      expect(extracted.retentionPeriods).toBe(12) // default
      expect(extracted.retentionType).toBe('classic') // default
    })
  })

  describe('round-trip', () => {
    it('should preserve data through save -> load cycle', () => {
      const originalState: RetentionSliceState = {
        retentionCube: 'Events',
        retentionBindingKey: { dimension: 'Events.userId' },
        retentionTimeDimension: 'Events.timestamp',
        retentionDateRange: { start: '2024-01-01', end: '2024-12-31' },
        retentionViewGranularity: 'month',
        retentionPeriods: 6,
        retentionType: 'rolling',
        retentionCohortFilters: [{ member: 'Events.type', operator: 'equals', values: ['signup'] }],
        retentionActivityFilters: [{ member: 'Events.type', operator: 'equals', values: ['login'] }],
        retentionBreakdowns: [{ field: 'Events.country', label: 'Country' }]
      }

      // Save
      const config = retentionModeAdapter.save(originalState, {}, 'chart')

      // Load
      const loadedState = retentionModeAdapter.load(config)

      // Check all values match
      expect(loadedState.retentionCube).toBe('Events')
      expect(loadedState.retentionBindingKey).toEqual({ dimension: 'Events.userId' })
      expect(loadedState.retentionTimeDimension).toBe('Events.timestamp')
      expect(loadedState.retentionDateRange).toEqual({ start: '2024-01-01', end: '2024-12-31' })
      expect(loadedState.retentionViewGranularity).toBe('month')
      expect(loadedState.retentionPeriods).toBe(6)
      expect(loadedState.retentionType).toBe('rolling')
      expect(loadedState.retentionCohortFilters).toEqual([
        { member: 'Events.type', operator: 'equals', values: ['signup'] }
      ])
      expect(loadedState.retentionActivityFilters).toEqual([
        { member: 'Events.type', operator: 'equals', values: ['login'] }
      ])
      // Note: label is derived from field name on load
      expect(loadedState.retentionBreakdowns[0].field).toBe('Events.country')
    })
  })
})
