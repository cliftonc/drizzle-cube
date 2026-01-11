/**
 * Flow Mode Adapter
 *
 * Handles conversion between UI state and AnalysisConfig for flow mode.
 * Converts FlowSliceState UI state to/from ServerFlowQuery format.
 */

import type { ModeAdapter, ValidationResult } from './modeAdapter'
import type {
  AnalysisConfig,
  FlowAnalysisConfig,
  AnalysisType,
  ChartConfig,
} from '../types/analysisConfig'
import type { Filter, FunnelBindingKey } from '../types'
import type {
  FlowSliceState,
  ServerFlowQuery,
  FlowStartingStep,
} from '../types/flow'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert FlowSliceState to ServerFlowQuery
 */
function stateToServerQuery(state: FlowSliceState): ServerFlowQuery {
  // Convert binding key to server format
  let bindingKey: ServerFlowQuery['flow']['bindingKey'] = ''
  if (state.flowBindingKey) {
    if (typeof state.flowBindingKey.dimension === 'string') {
      bindingKey = state.flowBindingKey.dimension
    } else if (Array.isArray(state.flowBindingKey.dimension)) {
      bindingKey = state.flowBindingKey.dimension.map((mapping) => ({
        cube: mapping.cube,
        dimension: mapping.dimension,
      }))
    }
  }

  // Convert time dimension to server format
  const timeDimension: ServerFlowQuery['flow']['timeDimension'] =
    state.flowTimeDimension || ''

  // Convert starting step to server format
  // Server accepts Filter | Filter[] for multiple filters
  const startingStep: ServerFlowQuery['flow']['startingStep'] = {
    name: state.startingStep.name || 'Starting Step',
    filter:
      state.startingStep.filters.length === 1
        ? state.startingStep.filters[0]
        : state.startingStep.filters.length > 1
          ? state.startingStep.filters
          : undefined,
  }

  return {
    flow: {
      bindingKey,
      timeDimension,
      startingStep,
      stepsBefore: state.stepsBefore,
      stepsAfter: state.stepsAfter,
      eventDimension: state.eventDimension || '',
      joinStrategy: state.joinStrategy,
    },
  }
}

/**
 * Convert ServerFlowQuery to FlowSliceState
 */
function serverQueryToState(query: ServerFlowQuery): FlowSliceState {
  const { flow } = query

  // Extract cube from binding key or event dimension
  let flowCube: string | null = null
  if (typeof flow.bindingKey === 'string') {
    const parts = flow.bindingKey.split('.')
    if (parts.length > 0) {
      flowCube = parts[0]
    }
  } else if (Array.isArray(flow.bindingKey) && flow.bindingKey.length > 0) {
    flowCube = flow.bindingKey[0].cube
  }

  // Convert binding key to client format
  let flowBindingKey: FunnelBindingKey | null = null
  if (flow.bindingKey) {
    if (typeof flow.bindingKey === 'string') {
      flowBindingKey = { dimension: flow.bindingKey }
    } else if (Array.isArray(flow.bindingKey)) {
      flowBindingKey = {
        dimension: flow.bindingKey.map((mapping) => ({
          cube: mapping.cube,
          dimension: mapping.dimension,
        })),
      }
    }
  }

  // Convert time dimension
  let flowTimeDimension: string | null = null
  if (flow.timeDimension) {
    if (typeof flow.timeDimension === 'string') {
      flowTimeDimension = flow.timeDimension
    } else if (Array.isArray(flow.timeDimension) && flow.timeDimension.length > 0) {
      flowTimeDimension = `${flow.timeDimension[0].cube}.${flow.timeDimension[0].dimension}`
    }
  }

  // Convert starting step filters
  let startingStepFilters: Filter[] = []
  if (flow.startingStep.filter) {
    if (Array.isArray(flow.startingStep.filter)) {
      startingStepFilters = flow.startingStep.filter
    } else {
      startingStepFilters = [flow.startingStep.filter]
    }
  }

  return {
    flowCube,
    flowBindingKey,
    flowTimeDimension,
    startingStep: {
      name: flow.startingStep.name || '',
      filters: startingStepFilters,
    },
    stepsBefore: flow.stepsBefore || 3,
    stepsAfter: flow.stepsAfter || 3,
    eventDimension: flow.eventDimension || null,
    joinStrategy: flow.joinStrategy || 'auto',
  }
}

/**
 * Check if a config is a valid flow config
 */
function isValidFlowConfig(config: unknown): config is FlowAnalysisConfig {
  if (!config || typeof config !== 'object') return false

  const c = config as Record<string, unknown>

  if (c.version !== 1) return false
  if (c.analysisType !== 'flow') return false
  if (!c.query || typeof c.query !== 'object') return false

  const query = c.query as Record<string, unknown>
  if (!query.flow || typeof query.flow !== 'object') return false

  return true
}

// ============================================================================
// Flow Mode Adapter
// ============================================================================

export const flowModeAdapter: ModeAdapter<FlowSliceState> = {
  type: 'flow',

  createInitial(): FlowSliceState {
    return {
      flowCube: null,
      flowBindingKey: null,
      flowTimeDimension: null,
      startingStep: {
        name: '',
        filters: [],
      },
      stepsBefore: 3,
      stepsAfter: 3,
      eventDimension: null,
      joinStrategy: 'auto',
    }
  },

  extractState(storeState: Record<string, unknown>): FlowSliceState {
    return {
      flowCube: storeState.flowCube as string | null,
      flowBindingKey: storeState.flowBindingKey as FunnelBindingKey | null,
      flowTimeDimension: storeState.flowTimeDimension as string | null,
      startingStep: storeState.startingStep as FlowStartingStep,
      stepsBefore: storeState.stepsBefore as number,
      stepsAfter: storeState.stepsAfter as number,
      eventDimension: storeState.eventDimension as string | null,
      joinStrategy: (storeState.joinStrategy as 'auto' | 'lateral' | 'window') || 'auto',
    }
  },

  canLoad(config: unknown): config is AnalysisConfig {
    return isValidFlowConfig(config)
  },

  load(config: AnalysisConfig): FlowSliceState {
    // Type guard - ensure it's a flow config
    if (config.analysisType !== 'flow') {
      throw new Error(
        `Cannot load ${config.analysisType} config with flow adapter`
      )
    }

    const flowConfig = config as FlowAnalysisConfig
    return serverQueryToState(flowConfig.query)
  },

  save(
    state: FlowSliceState,
    charts: Partial<Record<AnalysisType, ChartConfig>>,
    activeView: 'table' | 'chart'
  ): FlowAnalysisConfig {
    return {
      version: 1,
      analysisType: 'flow',
      activeView,
      charts: {
        flow: charts.flow || this.getDefaultChartConfig(),
      },
      query: stateToServerQuery(state),
    }
  },

  validate(state: FlowSliceState): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Must have a cube selected
    if (!state.flowCube) {
      errors.push('Select an event stream cube for flow analysis')
    }

    // Must have a binding key
    if (!state.flowBindingKey?.dimension) {
      errors.push('A binding key is required to link events to entities')
    }

    // Must have a time dimension
    if (!state.flowTimeDimension) {
      errors.push('A time dimension is required for event ordering')
    }

    // Must have an event dimension
    if (!state.eventDimension) {
      errors.push('An event dimension is required to categorize events')
    }

    // Must have starting step filters
    if (state.startingStep.filters.length === 0) {
      errors.push('The starting step must have at least one filter to identify the anchor event')
    }

    // Validate depth bounds
    if (state.stepsBefore < 0 || state.stepsBefore > 5) {
      errors.push(`Steps before must be between 0 and 5`)
    }
    if (state.stepsAfter < 0 || state.stepsAfter > 5) {
      errors.push(`Steps after must be between 0 and 5`)
    }

    if (
      state.joinStrategy &&
      !['auto', 'lateral', 'window'].includes(state.joinStrategy)
    ) {
      errors.push('Join strategy must be auto, lateral, or window')
    }

    // Warnings
    if (!state.startingStep.name) {
      warnings.push('Starting step has no name - using default')
    }

    // Performance warnings for high depth
    if (state.stepsBefore >= 4 || state.stepsAfter >= 4) {
      warnings.push('High step depth (4-5) may impact query performance on large datasets')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  },

  clear(state: FlowSliceState): FlowSliceState {
    // Keep cube selection but clear other settings
    return {
      ...this.createInitial(),
      flowCube: state.flowCube,
    }
  },

  getDefaultChartConfig(): ChartConfig {
    return {
      chartType: 'sankey',
      chartConfig: {},
      displayConfig: {
        showLegend: true,
        showGrid: false,
        showTooltip: true,
      },
    }
  },
}
