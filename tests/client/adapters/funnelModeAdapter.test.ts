/**
 * Tests for Funnel Mode Adapter
 */

import { describe, it, expect } from 'vitest'
import { funnelModeAdapter, type FunnelSliceState } from '../../../src/client/adapters/funnelModeAdapter'
import type { FunnelAnalysisConfig, ChartConfig } from '../../../src/client/types/analysisConfig'

describe('funnelModeAdapter', () => {
  describe('createInitial', () => {
    it('should create initial state with no steps', () => {
      const state = funnelModeAdapter.createInitial()

      expect(state.funnelCube).toBeNull()
      expect(state.funnelSteps).toEqual([])
      expect(state.activeFunnelStepIndex).toBe(0)
      expect(state.funnelTimeDimension).toBeNull()
      expect(state.funnelBindingKey).toBeNull()
    })
  })

  describe('canLoad', () => {
    it('should return true for valid funnel config', () => {
      const config: FunnelAnalysisConfig = {
        version: 1,
        analysisType: 'funnel',
        activeView: 'chart',
        charts: {},
        query: {
          funnel: {
            bindingKey: 'Events.userId',
            timeDimension: 'Events.timestamp',
            steps: [],
          },
        },
      }

      expect(funnelModeAdapter.canLoad(config)).toBe(true)
    })

    it('should return false for query config', () => {
      const config = {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: {},
        query: { measures: [] },
      }

      expect(funnelModeAdapter.canLoad(config)).toBe(false)
    })

    it('should return false for missing funnel property', () => {
      const config = {
        version: 1,
        analysisType: 'funnel',
        activeView: 'chart',
        charts: {},
        query: {},
      }

      expect(funnelModeAdapter.canLoad(config)).toBe(false)
    })

    it('should return false for null', () => {
      expect(funnelModeAdapter.canLoad(null)).toBe(false)
    })
  })

  describe('load', () => {
    it('should load a funnel config with string binding key', () => {
      const config: FunnelAnalysisConfig = {
        version: 1,
        analysisType: 'funnel',
        activeView: 'chart',
        charts: {},
        query: {
          funnel: {
            bindingKey: 'Events.userId',
            timeDimension: 'Events.timestamp',
            steps: [
              { name: 'Page View', filter: { member: 'Events.type', operator: 'equals', values: ['pageview'] } },
              { name: 'Sign Up', filter: { member: 'Events.type', operator: 'equals', values: ['signup'] }, timeToConvert: 'P7D' },
            ],
          },
        },
      }

      const state = funnelModeAdapter.load(config)

      expect(state.funnelBindingKey).toEqual({ dimension: 'Events.userId' })
      expect(state.funnelTimeDimension).toBe('Events.timestamp')
      expect(state.funnelSteps).toHaveLength(2)
      expect(state.funnelSteps[0].name).toBe('Page View')
      expect(state.funnelSteps[0].filters).toHaveLength(1)
      expect(state.funnelSteps[1].timeToConvert).toBe('P7D')
    })

    it('should load a funnel config with array binding key', () => {
      const config: FunnelAnalysisConfig = {
        version: 1,
        analysisType: 'funnel',
        activeView: 'chart',
        charts: {},
        query: {
          funnel: {
            bindingKey: [
              { cube: 'Events', dimension: 'userId' },
              { cube: 'Orders', dimension: 'customerId' },
            ],
            timeDimension: 'Events.timestamp',
            steps: [],
          },
        },
      }

      const state = funnelModeAdapter.load(config)

      expect(state.funnelBindingKey?.dimension).toEqual([
        { cube: 'Events', dimension: 'userId' },
        { cube: 'Orders', dimension: 'customerId' },
      ])
    })

    it('should extract cube from binding key', () => {
      const config: FunnelAnalysisConfig = {
        version: 1,
        analysisType: 'funnel',
        activeView: 'chart',
        charts: {},
        query: {
          funnel: {
            bindingKey: 'Events.userId',
            timeDimension: 'Events.timestamp',
            steps: [{ name: 'Step 1' }],
          },
        },
      }

      const state = funnelModeAdapter.load(config)

      expect(state.funnelCube).toBe('Events')
    })

    it('should throw for non-funnel config', () => {
      const config = {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: {},
        query: { measures: [] },
      } as unknown as FunnelAnalysisConfig

      expect(() => funnelModeAdapter.load(config)).toThrow()
    })
  })

  describe('save', () => {
    it('should save funnel state with string binding key', () => {
      const state: FunnelSliceState = {
        funnelCube: 'Events',
        funnelSteps: [
          { id: '1', name: 'Page View', cube: 'Events', filters: [{ member: 'Events.type', operator: 'equals', values: ['pageview'] }] },
          { id: '2', name: 'Sign Up', cube: 'Events', filters: [{ member: 'Events.type', operator: 'equals', values: ['signup'] }], timeToConvert: 'P7D' },
        ],
        activeFunnelStepIndex: 0,
        funnelTimeDimension: 'Events.timestamp',
        funnelBindingKey: { dimension: 'Events.userId' },
      }

      const charts: Partial<Record<'query' | 'funnel', ChartConfig>> = {
        funnel: { chartType: 'funnel', chartConfig: {}, displayConfig: {} },
      }

      const config = funnelModeAdapter.save(state, charts, 'chart')

      expect(config.version).toBe(1)
      expect(config.analysisType).toBe('funnel')
      expect(config.query.funnel.bindingKey).toBe('Events.userId')
      expect(config.query.funnel.timeDimension).toBe('Events.timestamp')
      expect(config.query.funnel.steps).toHaveLength(2)
      expect(config.query.funnel.steps[0].name).toBe('Page View')
      expect(config.query.funnel.steps[1].timeToConvert).toBe('P7D')
    })

    it('should save multi-cube funnel with array binding key', () => {
      const state: FunnelSliceState = {
        funnelCube: 'Events',
        funnelSteps: [],
        activeFunnelStepIndex: 0,
        funnelTimeDimension: 'Events.timestamp',
        funnelBindingKey: {
          dimension: [
            { cube: 'Events', dimension: 'userId' },
            { cube: 'Orders', dimension: 'customerId' },
          ],
        },
      }

      const charts: Partial<Record<'query' | 'funnel', ChartConfig>> = {}

      const config = funnelModeAdapter.save(state, charts, 'chart')

      expect(config.query.funnel.bindingKey).toEqual([
        { cube: 'Events', dimension: 'userId' },
        { cube: 'Orders', dimension: 'customerId' },
      ])
    })

    it('should not include cube on steps matching funnelCube', () => {
      const state: FunnelSliceState = {
        funnelCube: 'Events',
        funnelSteps: [
          { id: '1', name: 'Step 1', cube: 'Events', filters: [] },
        ],
        activeFunnelStepIndex: 0,
        funnelTimeDimension: 'Events.timestamp',
        funnelBindingKey: { dimension: 'Events.userId' },
      }

      const config = funnelModeAdapter.save(state, {}, 'chart')

      expect(config.query.funnel.steps[0].cube).toBeUndefined()
    })
  })

  describe('validate', () => {
    it('should return invalid for less than 2 steps', () => {
      const state: FunnelSliceState = {
        funnelCube: 'Events',
        funnelSteps: [{ id: '1', name: 'Step 1', cube: 'Events', filters: [] }],
        activeFunnelStepIndex: 0,
        funnelTimeDimension: 'Events.timestamp',
        funnelBindingKey: { dimension: 'Events.userId' },
      }

      const result = funnelModeAdapter.validate(state)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('2 steps'))).toBe(true)
    })

    it('should return invalid for missing binding key', () => {
      const state: FunnelSliceState = {
        funnelCube: 'Events',
        funnelSteps: [
          { id: '1', name: 'Step 1', cube: 'Events', filters: [] },
          { id: '2', name: 'Step 2', cube: 'Events', filters: [] },
        ],
        activeFunnelStepIndex: 0,
        funnelTimeDimension: 'Events.timestamp',
        funnelBindingKey: null,
      }

      const result = funnelModeAdapter.validate(state)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('binding key'))).toBe(true)
    })

    it('should return invalid for missing time dimension', () => {
      const state: FunnelSliceState = {
        funnelCube: 'Events',
        funnelSteps: [
          { id: '1', name: 'Step 1', cube: 'Events', filters: [] },
          { id: '2', name: 'Step 2', cube: 'Events', filters: [] },
        ],
        activeFunnelStepIndex: 0,
        funnelTimeDimension: null,
        funnelBindingKey: { dimension: 'Events.userId' },
      }

      const result = funnelModeAdapter.validate(state)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('time dimension'))).toBe(true)
    })

    it('should return valid for complete funnel', () => {
      const state: FunnelSliceState = {
        funnelCube: 'Events',
        funnelSteps: [
          { id: '1', name: 'Step 1', cube: 'Events', filters: [{ member: 'Events.type', operator: 'equals', values: ['a'] }] },
          { id: '2', name: 'Step 2', cube: 'Events', filters: [{ member: 'Events.type', operator: 'equals', values: ['b'] }] },
        ],
        activeFunnelStepIndex: 0,
        funnelTimeDimension: 'Events.timestamp',
        funnelBindingKey: { dimension: 'Events.userId' },
      }

      const result = funnelModeAdapter.validate(state)

      expect(result.isValid).toBe(true)
    })

    it('should warn for steps without filters', () => {
      const state: FunnelSliceState = {
        funnelCube: 'Events',
        funnelSteps: [
          { id: '1', name: 'Step 1', cube: 'Events', filters: [] },
          { id: '2', name: 'Step 2', cube: 'Events', filters: [] },
        ],
        activeFunnelStepIndex: 0,
        funnelTimeDimension: 'Events.timestamp',
        funnelBindingKey: { dimension: 'Events.userId' },
      }

      const result = funnelModeAdapter.validate(state)

      expect(result.warnings.some(w => w.includes('no filter'))).toBe(true)
    })
  })

  describe('clear', () => {
    it('should reset steps but keep cube', () => {
      const state: FunnelSliceState = {
        funnelCube: 'Events',
        funnelSteps: [
          { id: '1', name: 'Step 1', cube: 'Events', filters: [] },
        ],
        activeFunnelStepIndex: 0,
        funnelTimeDimension: 'Events.timestamp',
        funnelBindingKey: { dimension: 'Events.userId' },
      }

      const cleared = funnelModeAdapter.clear(state)

      expect(cleared.funnelCube).toBe('Events')
      expect(cleared.funnelSteps).toEqual([])
      expect(cleared.funnelTimeDimension).toBeNull()
      expect(cleared.funnelBindingKey).toBeNull()
    })
  })

  describe('getDefaultChartConfig', () => {
    it('should return funnel chart config', () => {
      const config = funnelModeAdapter.getDefaultChartConfig()

      expect(config.chartType).toBe('funnel')
      expect(config.chartConfig).toEqual({})
      expect(config.displayConfig).toEqual({ showLegend: true, showGrid: true, showTooltip: true })
    })
  })

  describe('round-trip', () => {
    it('should preserve data through save -> load cycle', () => {
      const originalState: FunnelSliceState = {
        funnelCube: 'Events',
        funnelSteps: [
          { id: '1', name: 'Page View', cube: 'Events', filters: [{ member: 'Events.type', operator: 'equals', values: ['pageview'] }] },
          { id: '2', name: 'Sign Up', cube: 'Events', filters: [{ member: 'Events.type', operator: 'equals', values: ['signup'] }], timeToConvert: 'P7D' },
          { id: '3', name: 'Purchase', cube: 'Events', filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }], timeToConvert: 'P30D' },
        ],
        activeFunnelStepIndex: 1,
        funnelTimeDimension: 'Events.timestamp',
        funnelBindingKey: { dimension: 'Events.userId' },
      }

      const charts: Partial<Record<'query' | 'funnel', ChartConfig>> = {
        funnel: { chartType: 'funnel', chartConfig: {}, displayConfig: { showLegend: true } },
      }

      const config = funnelModeAdapter.save(originalState, charts, 'chart')
      const loadedState = funnelModeAdapter.load(config)

      // Check steps match
      expect(loadedState.funnelSteps).toHaveLength(3)
      expect(loadedState.funnelSteps.map(s => s.name)).toEqual(['Page View', 'Sign Up', 'Purchase'])
      expect(loadedState.funnelSteps[1].timeToConvert).toBe('P7D')
      expect(loadedState.funnelSteps[2].timeToConvert).toBe('P30D')

      // Check binding key
      expect(loadedState.funnelBindingKey).toEqual({ dimension: 'Events.userId' })

      // Check time dimension
      expect(loadedState.funnelTimeDimension).toBe('Events.timestamp')

      // Check cube
      expect(loadedState.funnelCube).toBe('Events')
    })
  })
})
