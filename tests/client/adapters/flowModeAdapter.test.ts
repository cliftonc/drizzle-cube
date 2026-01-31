/**
 * Tests for Flow Mode Adapter
 *
 * Tests the flow analysis adapter that handles:
 * - Bidirectional flow exploration (steps before and after starting step)
 * - Sankey diagram visualization configuration
 * - Event dimension categorization
 * - Join strategy selection
 */

import { describe, it, expect } from 'vitest'
import { flowModeAdapter } from '../../../src/client/adapters/flowModeAdapter'
import type { FlowSliceState, ServerFlowQuery } from '../../../src/client/types/flow'
import type { FlowAnalysisConfig, ChartConfig, AnalysisType, AnalysisConfig } from '../../../src/client/types/analysisConfig'
import type { SimpleFilter } from '../../../src/client/types'

// Type assertion helper to extract flow query from config
function getFlowQuery(config: AnalysisConfig | FlowAnalysisConfig): ServerFlowQuery['flow'] {
  return (config.query as ServerFlowQuery).flow
}

describe('flowModeAdapter', () => {
  describe('type property', () => {
    it('should return "flow"', () => {
      expect(flowModeAdapter.type).toBe('flow')
    })
  })

  describe('createInitial', () => {
    it('should create initial state with correct defaults', () => {
      const state = flowModeAdapter.createInitial()

      expect(state.flowCube).toBeNull()
      expect(state.flowBindingKey).toBeNull()
      expect(state.flowTimeDimension).toBeNull()
      expect(state.eventDimension).toBeNull()
      expect(state.joinStrategy).toBe('auto')
    })

    it('should have stepsBefore and stepsAfter defaulting to 3', () => {
      const state = flowModeAdapter.createInitial()

      expect(state.stepsBefore).toBe(3)
      expect(state.stepsAfter).toBe(3)
    })

    it('should have startingStep with empty name and filters', () => {
      const state = flowModeAdapter.createInitial()

      expect(state.startingStep).toEqual({
        name: '',
        filters: [],
      })
    })
  })

  describe('extractState', () => {
    it('should extract flow-specific fields from store state', () => {
      const storeState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: 'Purchase',
          filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
        },
        stepsBefore: 2,
        stepsAfter: 4,
        eventDimension: 'Events.eventType',
        joinStrategy: 'lateral',
        // Other store fields that should be ignored
        analysisType: 'flow',
        queryStates: [],
        charts: {},
      }

      const extracted = flowModeAdapter.extractState(storeState)

      expect(extracted.flowCube).toBe('Events')
      expect(extracted.flowBindingKey).toEqual({ dimension: 'Events.userId' })
      expect(extracted.flowTimeDimension).toBe('Events.timestamp')
      expect(extracted.startingStep.name).toBe('Purchase')
      expect(extracted.startingStep.filters).toHaveLength(1)
      expect(extracted.stepsBefore).toBe(2)
      expect(extracted.stepsAfter).toBe(4)
      expect(extracted.eventDimension).toBe('Events.eventType')
      expect(extracted.joinStrategy).toBe('lateral')
    })

    it('should handle missing fields gracefully with defaults', () => {
      const storeState = {
        flowCube: 'Events',
        // Most fields missing
      }

      const extracted = flowModeAdapter.extractState(storeState)

      expect(extracted.flowCube).toBe('Events')
      // Missing fields are cast as-is (undefined becomes the typed value)
      expect(extracted.flowBindingKey).toBeUndefined()
      expect(extracted.flowTimeDimension).toBeUndefined()
      expect(extracted.joinStrategy).toBe('auto') // Default when undefined
    })

    it('should handle undefined joinStrategy by defaulting to auto', () => {
      const storeState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: { name: '', filters: [] },
        stepsBefore: 3,
        stepsAfter: 3,
        eventDimension: null,
        joinStrategy: undefined,
      }

      const extracted = flowModeAdapter.extractState(storeState)

      expect(extracted.joinStrategy).toBe('auto')
    })
  })

  describe('canLoad', () => {
    it('should return true for valid flow config', () => {
      const config: FlowAnalysisConfig = {
        version: 1,
        analysisType: 'flow',
        activeView: 'chart',
        charts: {},
        query: {
          flow: {
            bindingKey: 'Events.userId',
            timeDimension: 'Events.timestamp',
            eventDimension: 'Events.eventType',
            startingStep: {
              name: 'Purchase',
              filter: { member: 'Events.type', operator: 'equals', values: ['purchase'] },
            },
            stepsBefore: 3,
            stepsAfter: 3,
            joinStrategy: 'auto',
          },
        },
      }

      expect(flowModeAdapter.canLoad(config)).toBe(true)
    })

    it('should return false for query config', () => {
      const config = {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: {},
        query: { measures: [] },
      }

      expect(flowModeAdapter.canLoad(config)).toBe(false)
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
            steps: [],
          },
        },
      }

      expect(flowModeAdapter.canLoad(config)).toBe(false)
    })

    it('should return false for retention config', () => {
      const config = {
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
          },
        },
      }

      expect(flowModeAdapter.canLoad(config)).toBe(false)
    })

    it('should return false for missing flow property', () => {
      const config = {
        version: 1,
        analysisType: 'flow',
        activeView: 'chart',
        charts: {},
        query: {},
      }

      expect(flowModeAdapter.canLoad(config)).toBe(false)
    })

    it('should return false for null', () => {
      expect(flowModeAdapter.canLoad(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(flowModeAdapter.canLoad(undefined)).toBe(false)
    })

    it('should return false for invalid version', () => {
      const config = {
        version: 2,
        analysisType: 'flow',
        activeView: 'chart',
        charts: {},
        query: {
          flow: {
            bindingKey: 'Events.userId',
            timeDimension: 'Events.timestamp',
            eventDimension: 'Events.eventType',
            startingStep: { name: 'Purchase' },
            stepsBefore: 3,
            stepsAfter: 3,
            joinStrategy: 'auto',
          },
        },
      }

      expect(flowModeAdapter.canLoad(config)).toBe(false)
    })

    it('should return false for non-object config', () => {
      expect(flowModeAdapter.canLoad('invalid')).toBe(false)
      expect(flowModeAdapter.canLoad(123)).toBe(false)
      expect(flowModeAdapter.canLoad([])).toBe(false)
    })
  })

  describe('load', () => {
    it('should convert ServerFlowQuery to FlowSliceState', () => {
      const config: FlowAnalysisConfig = {
        version: 1,
        analysisType: 'flow',
        activeView: 'chart',
        charts: {},
        query: {
          flow: {
            bindingKey: 'Events.userId',
            timeDimension: 'Events.timestamp',
            eventDimension: 'Events.eventType',
            startingStep: {
              name: 'Purchase',
              filter: { member: 'Events.type', operator: 'equals', values: ['purchase'] },
            },
            stepsBefore: 2,
            stepsAfter: 4,
            joinStrategy: 'lateral',
          },
        },
      }

      const state = flowModeAdapter.load(config)

      expect(state.flowCube).toBe('Events')
      expect(state.flowTimeDimension).toBe('Events.timestamp')
      expect(state.eventDimension).toBe('Events.eventType')
      expect(state.stepsBefore).toBe(2)
      expect(state.stepsAfter).toBe(4)
      expect(state.joinStrategy).toBe('lateral')
    })

    it('should handle string bindingKey', () => {
      const config: FlowAnalysisConfig = {
        version: 1,
        analysisType: 'flow',
        activeView: 'chart',
        charts: {},
        query: {
          flow: {
            bindingKey: 'Events.userId',
            timeDimension: 'Events.timestamp',
            eventDimension: 'Events.eventType',
            startingStep: { name: 'Start' },
            stepsBefore: 3,
            stepsAfter: 3,
            joinStrategy: 'auto',
          },
        },
      }

      const state = flowModeAdapter.load(config)

      expect(state.flowBindingKey).toEqual({ dimension: 'Events.userId' })
      expect(state.flowCube).toBe('Events')
    })

    it('should handle array bindingKey (multi-cube)', () => {
      const config: FlowAnalysisConfig = {
        version: 1,
        analysisType: 'flow',
        activeView: 'chart',
        charts: {},
        query: {
          flow: {
            bindingKey: [
              { cube: 'Events', dimension: 'userId' },
              { cube: 'Orders', dimension: 'customerId' },
            ],
            timeDimension: 'Events.timestamp',
            eventDimension: 'Events.eventType',
            startingStep: { name: 'Start' },
            stepsBefore: 3,
            stepsAfter: 3,
            joinStrategy: 'auto',
          },
        },
      }

      const state = flowModeAdapter.load(config)

      expect(state.flowBindingKey?.dimension).toEqual([
        { cube: 'Events', dimension: 'userId' },
        { cube: 'Orders', dimension: 'customerId' },
      ])
      expect(state.flowCube).toBe('Events') // First cube in array
    })

    it('should handle startingStep with single filter', () => {
      const config: FlowAnalysisConfig = {
        version: 1,
        analysisType: 'flow',
        activeView: 'chart',
        charts: {},
        query: {
          flow: {
            bindingKey: 'Events.userId',
            timeDimension: 'Events.timestamp',
            eventDimension: 'Events.eventType',
            startingStep: {
              name: 'Purchase',
              filter: { member: 'Events.type', operator: 'equals', values: ['purchase'] },
            },
            stepsBefore: 3,
            stepsAfter: 3,
            joinStrategy: 'auto',
          },
        },
      }

      const state = flowModeAdapter.load(config)

      expect(state.startingStep.name).toBe('Purchase')
      expect(state.startingStep.filters).toHaveLength(1)
      expect(state.startingStep.filters[0]).toEqual({
        member: 'Events.type',
        operator: 'equals',
        values: ['purchase'],
      })
    })

    it('should handle startingStep with multiple filters', () => {
      const config: FlowAnalysisConfig = {
        version: 1,
        analysisType: 'flow',
        activeView: 'chart',
        charts: {},
        query: {
          flow: {
            bindingKey: 'Events.userId',
            timeDimension: 'Events.timestamp',
            eventDimension: 'Events.eventType',
            startingStep: {
              name: 'Checkout',
              filter: [
                { member: 'Events.type', operator: 'equals', values: ['checkout'] },
                { member: 'Events.platform', operator: 'equals', values: ['web'] },
              ],
            },
            stepsBefore: 3,
            stepsAfter: 3,
            joinStrategy: 'auto',
          },
        },
      }

      const state = flowModeAdapter.load(config)

      expect(state.startingStep.name).toBe('Checkout')
      expect(state.startingStep.filters).toHaveLength(2)
      expect((state.startingStep.filters[0] as SimpleFilter).member).toBe('Events.type')
      expect((state.startingStep.filters[1] as SimpleFilter).member).toBe('Events.platform')
    })

    it('should handle startingStep with no filter', () => {
      const config: FlowAnalysisConfig = {
        version: 1,
        analysisType: 'flow',
        activeView: 'chart',
        charts: {},
        query: {
          flow: {
            bindingKey: 'Events.userId',
            timeDimension: 'Events.timestamp',
            eventDimension: 'Events.eventType',
            startingStep: {
              name: 'Any Event',
            },
            stepsBefore: 3,
            stepsAfter: 3,
            joinStrategy: 'auto',
          },
        },
      }

      const state = flowModeAdapter.load(config)

      expect(state.startingStep.name).toBe('Any Event')
      expect(state.startingStep.filters).toEqual([])
    })

    it('should handle array timeDimension format', () => {
      const config: FlowAnalysisConfig = {
        version: 1,
        analysisType: 'flow',
        activeView: 'chart',
        charts: {},
        query: {
          flow: {
            bindingKey: 'Events.userId',
            timeDimension: [{ cube: 'Events', dimension: 'timestamp' }],
            eventDimension: 'Events.eventType',
            startingStep: { name: 'Start' },
            stepsBefore: 3,
            stepsAfter: 3,
            joinStrategy: 'auto',
          },
        },
      }

      const state = flowModeAdapter.load(config)

      expect(state.flowTimeDimension).toBe('Events.timestamp')
    })

    it('should throw for non-flow config', () => {
      const config = {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: {},
        query: { measures: [] },
      } as unknown as FlowAnalysisConfig

      expect(() => flowModeAdapter.load(config)).toThrow()
    })

    it('should use default values for missing optional fields', () => {
      const config: FlowAnalysisConfig = {
        version: 1,
        analysisType: 'flow',
        activeView: 'chart',
        charts: {},
        query: {
          flow: {
            bindingKey: 'Events.userId',
            timeDimension: 'Events.timestamp',
            eventDimension: 'Events.eventType',
            startingStep: { name: 'Start' },
            stepsBefore: 3,
            stepsAfter: 3,
            joinStrategy: 'auto',
          },
        },
      }

      const state = flowModeAdapter.load(config)

      expect(state.stepsBefore).toBe(3)
      expect(state.stepsAfter).toBe(3)
      expect(state.joinStrategy).toBe('auto')
    })
  })

  describe('save', () => {
    it('should convert FlowSliceState to FlowAnalysisConfig', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: 'Purchase',
          filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
        },
        stepsBefore: 2,
        stepsAfter: 4,
        eventDimension: 'Events.eventType',
        joinStrategy: 'lateral',
      }

      const charts: Partial<Record<AnalysisType, ChartConfig>> = {
        flow: { chartType: 'sankey', chartConfig: {}, displayConfig: {} },
      }

      const config = flowModeAdapter.save(state, charts, 'chart')

      expect(getFlowQuery(config).bindingKey).toBe('Events.userId')
      expect(getFlowQuery(config).timeDimension).toBe('Events.timestamp')
      expect(getFlowQuery(config).eventDimension).toBe('Events.eventType')
      expect(getFlowQuery(config).stepsBefore).toBe(2)
      expect(getFlowQuery(config).stepsAfter).toBe(4)
      expect(getFlowQuery(config).joinStrategy).toBe('lateral')
    })

    it('should include correct version and analysisType', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: { name: 'Start', filters: [] },
        stepsBefore: 3,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const config = flowModeAdapter.save(state, {}, 'chart')

      expect(config.version).toBe(1)
      expect(config.analysisType).toBe('flow')
    })

    it('should convert single string bindingKey to server format', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: { name: 'Start', filters: [] },
        stepsBefore: 3,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const config = flowModeAdapter.save(state, {}, 'chart')

      expect(getFlowQuery(config).bindingKey).toBe('Events.userId')
    })

    it('should convert array bindingKey to server format', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: {
          dimension: [
            { cube: 'Events', dimension: 'userId' },
            { cube: 'Orders', dimension: 'customerId' },
          ],
        },
        flowTimeDimension: 'Events.timestamp',
        startingStep: { name: 'Start', filters: [] },
        stepsBefore: 3,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const config = flowModeAdapter.save(state, {}, 'chart')

      expect(getFlowQuery(config).bindingKey).toEqual([
        { cube: 'Events', dimension: 'userId' },
        { cube: 'Orders', dimension: 'customerId' },
      ])
    })

    it('should include charts and activeView', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: { name: 'Start', filters: [] },
        stepsBefore: 3,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const charts: Partial<Record<AnalysisType, ChartConfig>> = {
        flow: {
          chartType: 'sankey',
          chartConfig: { xAxis: ['layer'] },
          displayConfig: { showLegend: true },
        },
      }

      const config = flowModeAdapter.save(state, charts, 'table')

      expect(config.activeView).toBe('table')
      expect(config.charts.flow?.chartType).toBe('sankey')
      expect(config.charts.flow?.displayConfig.showLegend).toBe(true)
    })

    it('should use default chart config when none provided', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: { name: 'Start', filters: [] },
        stepsBefore: 3,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const config = flowModeAdapter.save(state, {}, 'chart')

      expect(config.charts.flow?.chartType).toBe('sankey')
    })

    it('should save single filter in startingStep', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: 'Purchase',
          filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
        },
        stepsBefore: 3,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const config = flowModeAdapter.save(state, {}, 'chart')

      // Single filter should be unwrapped
      expect(getFlowQuery(config).startingStep.filter).toEqual({
        member: 'Events.type',
        operator: 'equals',
        values: ['purchase'],
      })
    })

    it('should save multiple filters as array in startingStep', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: 'Checkout',
          filters: [
            { member: 'Events.type', operator: 'equals', values: ['checkout'] },
            { member: 'Events.platform', operator: 'equals', values: ['web'] },
          ],
        },
        stepsBefore: 3,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const config = flowModeAdapter.save(state, {}, 'chart')

      expect(getFlowQuery(config).startingStep.filter).toEqual([
        { member: 'Events.type', operator: 'equals', values: ['checkout'] },
        { member: 'Events.platform', operator: 'equals', values: ['web'] },
      ])
    })

    it('should use default starting step name when empty', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: '',
          filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
        },
        stepsBefore: 3,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const config = flowModeAdapter.save(state, {}, 'chart')

      expect(getFlowQuery(config).startingStep.name).toBe('Starting Step')
    })
  })

  describe('validate', () => {
    it('should return error when missing cube', () => {
      const state: FlowSliceState = {
        flowCube: null,
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: 'Purchase',
          filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
        },
        stepsBefore: 3,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const result = flowModeAdapter.validate(state)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.toLowerCase().includes('cube'))).toBe(true)
    })

    it('should return error when missing bindingKey', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: null,
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: 'Purchase',
          filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
        },
        stepsBefore: 3,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const result = flowModeAdapter.validate(state)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.toLowerCase().includes('binding key'))).toBe(true)
    })

    it('should return error when missing timeDimension', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: null,
        startingStep: {
          name: 'Purchase',
          filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
        },
        stepsBefore: 3,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const result = flowModeAdapter.validate(state)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.toLowerCase().includes('time dimension'))).toBe(true)
    })

    it('should return error when missing eventDimension', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: 'Purchase',
          filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
        },
        stepsBefore: 3,
        stepsAfter: 3,
        eventDimension: null,
        joinStrategy: 'auto',
      }

      const result = flowModeAdapter.validate(state)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.toLowerCase().includes('event dimension'))).toBe(true)
    })

    it('should return error when startingStep has no filters', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: 'Purchase',
          filters: [],
        },
        stepsBefore: 3,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const result = flowModeAdapter.validate(state)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.toLowerCase().includes('starting step') || e.toLowerCase().includes('filter'))).toBe(true)
    })

    it('should return error for invalid stepsBefore (negative)', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: 'Purchase',
          filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
        },
        stepsBefore: -1,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const result = flowModeAdapter.validate(state)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.toLowerCase().includes('steps before') || e.includes('0') || e.includes('5'))).toBe(true)
    })

    it('should return error for invalid stepsBefore (too high)', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: 'Purchase',
          filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
        },
        stepsBefore: 6,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const result = flowModeAdapter.validate(state)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.toLowerCase().includes('steps before') || e.includes('0') || e.includes('5'))).toBe(true)
    })

    it('should return error for invalid stepsAfter (negative)', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: 'Purchase',
          filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
        },
        stepsBefore: 3,
        stepsAfter: -1,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const result = flowModeAdapter.validate(state)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.toLowerCase().includes('steps after') || e.includes('0') || e.includes('5'))).toBe(true)
    })

    it('should return error for invalid stepsAfter (too high)', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: 'Purchase',
          filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
        },
        stepsBefore: 3,
        stepsAfter: 6,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const result = flowModeAdapter.validate(state)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.toLowerCase().includes('steps after') || e.includes('0') || e.includes('5'))).toBe(true)
    })

    it('should return warning for no startingStep name', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: '',
          filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
        },
        stepsBefore: 3,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const result = flowModeAdapter.validate(state)

      expect(result.warnings.some(w => w.toLowerCase().includes('name') || w.toLowerCase().includes('default'))).toBe(true)
    })

    it('should return warning for high step depth (stepsBefore = 4)', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: 'Purchase',
          filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
        },
        stepsBefore: 4,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const result = flowModeAdapter.validate(state)

      expect(result.isValid).toBe(true) // High depth is a warning, not error
      expect(result.warnings.some(w => w.toLowerCase().includes('performance') || w.includes('4') || w.includes('5'))).toBe(true)
    })

    it('should return warning for high step depth (stepsAfter = 5)', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: 'Purchase',
          filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
        },
        stepsBefore: 3,
        stepsAfter: 5,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const result = flowModeAdapter.validate(state)

      expect(result.isValid).toBe(true)
      expect(result.warnings.some(w => w.toLowerCase().includes('performance') || w.includes('4') || w.includes('5'))).toBe(true)
    })

    it('should return isValid:true when all required fields present', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: 'Purchase',
          filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
        },
        stepsBefore: 3,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const result = flowModeAdapter.validate(state)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate all join strategies as valid', () => {
      const baseState: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: 'Purchase',
          filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
        },
        stepsBefore: 3,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      for (const strategy of ['auto', 'lateral', 'window'] as const) {
        const state = { ...baseState, joinStrategy: strategy }
        const result = flowModeAdapter.validate(state)
        expect(result.isValid).toBe(true)
      }
    })

    it('should return error for invalid join strategy', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: 'Purchase',
          filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
        },
        stepsBefore: 3,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'invalid' as 'auto',
      }

      const result = flowModeAdapter.validate(state)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.toLowerCase().includes('join strategy'))).toBe(true)
    })
  })

  describe('clear', () => {
    it('should clear state but keep flowCube', () => {
      const state: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: 'Purchase',
          filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
        },
        stepsBefore: 2,
        stepsAfter: 4,
        eventDimension: 'Events.eventType',
        joinStrategy: 'lateral',
      }

      const cleared = flowModeAdapter.clear(state)

      // Should keep cube
      expect(cleared.flowCube).toBe('Events')

      // Should reset everything else to initial state
      expect(cleared.flowBindingKey).toBeNull()
      expect(cleared.flowTimeDimension).toBeNull()
      expect(cleared.eventDimension).toBeNull()
      expect(cleared.startingStep.name).toBe('')
      expect(cleared.startingStep.filters).toEqual([])
      expect(cleared.stepsBefore).toBe(3)
      expect(cleared.stepsAfter).toBe(3)
      expect(cleared.joinStrategy).toBe('auto')
    })

    it('should handle null flowCube', () => {
      const state: FlowSliceState = {
        flowCube: null,
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: { name: 'Test', filters: [] },
        stepsBefore: 3,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const cleared = flowModeAdapter.clear(state)

      expect(cleared.flowCube).toBeNull()
    })
  })

  describe('getDefaultChartConfig', () => {
    it('should return sankey chart type', () => {
      const config = flowModeAdapter.getDefaultChartConfig()

      expect(config.chartType).toBe('sankey')
    })

    it('should include display config', () => {
      const config = flowModeAdapter.getDefaultChartConfig()

      expect(config.displayConfig).toBeDefined()
      expect(config.displayConfig.showLegend).toBe(true)
      expect(config.displayConfig.showTooltip).toBe(true)
    })

    it('should include chart config object', () => {
      const config = flowModeAdapter.getDefaultChartConfig()

      expect(config.chartConfig).toBeDefined()
      expect(typeof config.chartConfig).toBe('object')
    })
  })

  describe('round-trip', () => {
    it('should preserve data through save -> load cycle', () => {
      const originalState: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: 'Purchase',
          filters: [
            { member: 'Events.type', operator: 'equals', values: ['purchase'] },
            { member: 'Events.platform', operator: 'equals', values: ['mobile'] },
          ],
        },
        stepsBefore: 2,
        stepsAfter: 4,
        eventDimension: 'Events.eventType',
        joinStrategy: 'lateral',
      }

      const charts: Partial<Record<AnalysisType, ChartConfig>> = {
        flow: { chartType: 'sankey', chartConfig: {}, displayConfig: { showLegend: true } },
      }

      // Save
      const config = flowModeAdapter.save(originalState, charts, 'chart')

      // Load
      const loadedState = flowModeAdapter.load(config)

      // Check all values match
      expect(loadedState.flowCube).toBe('Events')
      expect(loadedState.flowBindingKey).toEqual({ dimension: 'Events.userId' })
      expect(loadedState.flowTimeDimension).toBe('Events.timestamp')
      expect(loadedState.eventDimension).toBe('Events.eventType')
      expect(loadedState.stepsBefore).toBe(2)
      expect(loadedState.stepsAfter).toBe(4)
      expect(loadedState.joinStrategy).toBe('lateral')
      expect(loadedState.startingStep.name).toBe('Purchase')
      expect(loadedState.startingStep.filters).toHaveLength(2)
    })

    it('should preserve multi-cube binding key through round-trip', () => {
      const originalState: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: {
          dimension: [
            { cube: 'Events', dimension: 'userId' },
            { cube: 'Orders', dimension: 'customerId' },
          ],
        },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: 'Start',
          filters: [{ member: 'Events.type', operator: 'equals', values: ['start'] }],
        },
        stepsBefore: 3,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const config = flowModeAdapter.save(originalState, {}, 'chart')
      const loadedState = flowModeAdapter.load(config)

      expect(loadedState.flowBindingKey?.dimension).toEqual([
        { cube: 'Events', dimension: 'userId' },
        { cube: 'Orders', dimension: 'customerId' },
      ])
    })

    it('should preserve single filter through round-trip', () => {
      const originalState: FlowSliceState = {
        flowCube: 'Events',
        flowBindingKey: { dimension: 'Events.userId' },
        flowTimeDimension: 'Events.timestamp',
        startingStep: {
          name: 'Purchase',
          filters: [{ member: 'Events.type', operator: 'equals', values: ['purchase'] }],
        },
        stepsBefore: 3,
        stepsAfter: 3,
        eventDimension: 'Events.eventType',
        joinStrategy: 'auto',
      }

      const config = flowModeAdapter.save(originalState, {}, 'chart')
      const loadedState = flowModeAdapter.load(config)

      expect(loadedState.startingStep.filters).toHaveLength(1)
      expect(loadedState.startingStep.filters[0]).toEqual({
        member: 'Events.type',
        operator: 'equals',
        values: ['purchase'],
      })
    })
  })
})
