/**
 * Funnel Mode Adapter
 *
 * Handles conversion between UI state and AnalysisConfig for funnel mode.
 * Converts funnelSteps UI state to/from ServerFunnelQuery format.
 */

import type { ModeAdapter, ValidationResult } from './modeAdapter'
import { generateId } from '../components/AnalysisBuilder/utils'
import type {
  AnalysisConfig,
  FunnelAnalysisConfig,
  AnalysisType,
  ChartConfig,
} from '../types/analysisConfig'
import type { FunnelStepState, FunnelBindingKey, Filter } from '../types'
import type { ServerFunnelQuery, ServerFunnelStep } from '../types/funnel'

// ============================================================================
// Funnel Slice State Type
// ============================================================================

/**
 * The shape of funnel mode state in the store.
 * This is what the adapter's load() returns and save() receives.
 */
export interface FunnelSliceState {
  /** The cube all funnel steps use (single-cube mode) */
  funnelCube: string | null
  /** Funnel step definitions */
  funnelSteps: FunnelStepState[]
  /** Currently selected step index */
  activeFunnelStepIndex: number
  /** Time dimension for temporal ordering */
  funnelTimeDimension: string | null
  /** Binding key that links entities across steps */
  funnelBindingKey: FunnelBindingKey | null
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert FunnelSliceState to ServerFunnelQuery
 */
function stateToServerQuery(state: FunnelSliceState): ServerFunnelQuery {
  // Convert binding key to server format
  let bindingKey: ServerFunnelQuery['funnel']['bindingKey'] = ''
  if (state.funnelBindingKey) {
    if (typeof state.funnelBindingKey.dimension === 'string') {
      bindingKey = state.funnelBindingKey.dimension
    } else if (Array.isArray(state.funnelBindingKey.dimension)) {
      bindingKey = state.funnelBindingKey.dimension.map((mapping) => ({
        cube: mapping.cube,
        dimension: mapping.dimension,
      }))
    }
  }

  // Convert time dimension to server format
  let timeDimension: ServerFunnelQuery['funnel']['timeDimension'] =
    state.funnelTimeDimension || ''

  // Convert steps to server format
  const steps: ServerFunnelStep[] = state.funnelSteps.map((step) => {
    const serverStep: ServerFunnelStep = {
      name: step.name,
    }

    // Only include cube if different from default (multi-cube support)
    if (step.cube && step.cube !== state.funnelCube) {
      serverStep.cube = step.cube
    }

    // Include filters if present
    if (step.filters && step.filters.length > 0) {
      // Convert to server filter format
      serverStep.filter =
        step.filters.length === 1
          ? step.filters[0]
          : { and: step.filters }
    }

    // Include timeToConvert if present
    if (step.timeToConvert) {
      serverStep.timeToConvert = step.timeToConvert
    }

    return serverStep
  })

  return {
    funnel: {
      bindingKey,
      timeDimension,
      steps,
      includeTimeMetrics: true,
    },
  }
}

/**
 * Convert ServerFunnelQuery to FunnelSliceState
 */
function serverQueryToState(query: ServerFunnelQuery): FunnelSliceState {
  const { funnel } = query

  // Extract cube from first step or binding key
  let funnelCube: string | null = null
  if (funnel.steps.length > 0 && funnel.steps[0].cube) {
    funnelCube = funnel.steps[0].cube
  } else if (typeof funnel.bindingKey === 'string') {
    // Extract cube from binding key (e.g., "Events.userId" -> "Events")
    const parts = funnel.bindingKey.split('.')
    if (parts.length > 0) {
      funnelCube = parts[0]
    }
  }

  // Convert binding key to client format
  let funnelBindingKey: FunnelBindingKey | null = null
  if (funnel.bindingKey) {
    if (typeof funnel.bindingKey === 'string') {
      funnelBindingKey = { dimension: funnel.bindingKey }
    } else if (Array.isArray(funnel.bindingKey)) {
      funnelBindingKey = {
        dimension: funnel.bindingKey.map((mapping) => ({
          cube: mapping.cube,
          dimension: mapping.dimension,
        })),
      }
    }
  }

  // Convert time dimension
  let funnelTimeDimension: string | null = null
  if (funnel.timeDimension) {
    if (typeof funnel.timeDimension === 'string') {
      funnelTimeDimension = funnel.timeDimension
    } else if (Array.isArray(funnel.timeDimension) && funnel.timeDimension.length > 0) {
      funnelTimeDimension = `${funnel.timeDimension[0].cube}.${funnel.timeDimension[0].dimension}`
    }
  }

  // Convert steps
  const funnelSteps: FunnelStepState[] = funnel.steps.map((step) => {
    // Extract filters
    let filters: Filter[] = []
    if (step.filter) {
      if (Array.isArray(step.filter)) {
        // Already an array of filters
        filters = step.filter as Filter[]
      } else if (
        typeof step.filter === 'object' &&
        'and' in (step.filter as { and?: unknown })
      ) {
        // { and: [...] } format
        filters = (step.filter as { and: Filter[] }).and
      } else {
        // Single filter object - wrap in array
        filters = [step.filter as Filter]
      }
    }

    return {
      id: generateId(),
      name: step.name,
      cube: step.cube || funnelCube || '',
      filters,
      timeToConvert: step.timeToConvert,
    }
  })

  return {
    funnelCube,
    funnelSteps,
    activeFunnelStepIndex: 0,
    funnelTimeDimension,
    funnelBindingKey,
  }
}

/**
 * Check if a config is a valid funnel config
 */
function isValidFunnelConfig(config: unknown): config is FunnelAnalysisConfig {
  if (!config || typeof config !== 'object') return false

  const c = config as Record<string, unknown>

  if (c.version !== 1) return false
  if (c.analysisType !== 'funnel') return false
  if (!c.query || typeof c.query !== 'object') return false

  const query = c.query as Record<string, unknown>
  if (!query.funnel || typeof query.funnel !== 'object') return false

  return true
}

// ============================================================================
// Funnel Mode Adapter
// ============================================================================

export const funnelModeAdapter: ModeAdapter<FunnelSliceState> = {
  type: 'funnel',

  createInitial(): FunnelSliceState {
    return {
      funnelCube: null,
      funnelSteps: [],
      activeFunnelStepIndex: 0,
      funnelTimeDimension: null,
      funnelBindingKey: null,
    }
  },

  extractState(storeState: Record<string, unknown>): FunnelSliceState {
    return {
      funnelCube: storeState.funnelCube as string | null,
      funnelSteps: storeState.funnelSteps as FunnelStepState[],
      activeFunnelStepIndex: storeState.activeFunnelStepIndex as number,
      funnelTimeDimension: storeState.funnelTimeDimension as string | null,
      funnelBindingKey: storeState.funnelBindingKey as FunnelBindingKey | null,
    }
  },

  canLoad(config: unknown): config is AnalysisConfig {
    return isValidFunnelConfig(config)
  },

  load(config: AnalysisConfig): FunnelSliceState {
    // Type guard - ensure it's a funnel config
    if (config.analysisType !== 'funnel') {
      throw new Error(
        `Cannot load ${config.analysisType} config with funnel adapter`
      )
    }

    const funnelConfig = config as FunnelAnalysisConfig
    return serverQueryToState(funnelConfig.query)
  },

  save(
    state: FunnelSliceState,
    charts: Partial<Record<AnalysisType, ChartConfig>>,
    activeView: 'table' | 'chart'
  ): FunnelAnalysisConfig {
    return {
      version: 1,
      analysisType: 'funnel',
      activeView,
      charts: {
        funnel: charts.funnel || this.getDefaultChartConfig(),
      },
      query: stateToServerQuery(state),
    }
  },

  validate(state: FunnelSliceState): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Must have at least 2 steps for a funnel
    if (state.funnelSteps.length < 2) {
      errors.push('A funnel requires at least 2 steps')
    }

    // Must have a binding key
    if (!state.funnelBindingKey?.dimension) {
      errors.push('A binding key is required to link funnel steps')
    }

    // Must have a time dimension
    if (!state.funnelTimeDimension) {
      errors.push('A time dimension is required for funnel ordering')
    }

    // Check each step
    state.funnelSteps.forEach((step, index) => {
      if (!step.name || step.name.trim() === '') {
        warnings.push(`Step ${index + 1} has no name`)
      }

      // Warn if step has no distinguishing filter
      if (step.filters.length === 0) {
        warnings.push(
          `Step ${index + 1} "${step.name}" has no filter - all events will match`
        )
      }
    })

    // Check for duplicate step names
    const names = state.funnelSteps.map((s) => s.name.toLowerCase())
    const duplicates = names.filter(
      (name, index) => names.indexOf(name) !== index
    )
    if (duplicates.length > 0) {
      warnings.push(`Duplicate step names: ${[...new Set(duplicates)].join(', ')}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  },

  clear(state: FunnelSliceState): FunnelSliceState {
    // Keep cube selection but clear steps
    return {
      ...this.createInitial(),
      funnelCube: state.funnelCube,
    }
  },

  getDefaultChartConfig(): ChartConfig {
    return {
      chartType: 'funnel',
      chartConfig: {},
      displayConfig: { showLegend: true, showGrid: true, showTooltip: true },
    }
  },
}
