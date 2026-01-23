/**
 * AnalysisConfig - Versioned, mode-agnostic configuration format
 *
 * This is the canonical format for persisting analysis state to:
 * - localStorage (standalone AnalysisBuilder)
 * - Share URLs
 * - Dashboard portlets (via analysisConfig field)
 *
 * Key design principles:
 * - `query` field IS the executable query (no transformation needed)
 * - Per-mode chart config via `charts[analysisType]` map
 * - No UI state (activeQueryIndex, activeFunnelStepIndex) - those are transient
 */

import type {
  ChartType,
  ChartAxisConfig,
  ChartDisplayConfig,
  CubeQuery,
  MultiQueryConfig,
} from '../types'
import type { ServerFunnelQuery } from './funnel'
import type { ServerFlowQuery } from './flow'
import type { ServerRetentionQuery } from './retention'

// ============================================================================
// Chart Configuration
// ============================================================================

/**
 * Chart configuration - shared across all analysis types
 */
export interface ChartConfig {
  chartType: ChartType
  chartConfig: ChartAxisConfig
  displayConfig: ChartDisplayConfig
}

// ============================================================================
// Analysis Type
// ============================================================================

/**
 * Analysis type discriminator
 * Future modes: 'cohort'
 */
export type AnalysisType = 'query' | 'funnel' | 'flow' | 'retention'

// ============================================================================
// Base Configuration
// ============================================================================

/**
 * Base config - common to all analysis types
 */
interface AnalysisConfigBase {
  /** Version number for migration support */
  version: 1

  /** Which analysis mode this config represents */
  analysisType: AnalysisType

  /** Whether to show table or chart view */
  activeView: 'table' | 'chart'

  /**
   * Per-mode chart configuration map.
   * Each mode owns its own chart settings, allowing users to configure
   * different chart types for query mode vs funnel mode.
   */
  charts: {
    [K in AnalysisType]?: ChartConfig
  }
}

// ============================================================================
// Query Mode Configuration
// ============================================================================

/**
 * Query mode config - for single queries and multi-query analysis
 *
 * The `query` field is the actual executable query:
 * - Single query: CubeQuery object
 * - Multi-query: MultiQueryConfig with queries array and merge strategy
 */
export interface QueryAnalysisConfig extends AnalysisConfigBase {
  analysisType: 'query'

  /**
   * The executable query.
   * - CubeQuery: Single query with measures, dimensions, filters
   * - MultiQueryConfig: Multiple queries with merge strategy
   */
  query: CubeQuery | MultiQueryConfig
}

// ============================================================================
// Funnel Mode Configuration
// ============================================================================

/**
 * Funnel mode config - for funnel analysis
 *
 * The `query` field is the ServerFunnelQuery which can be sent
 * directly to the server for execution.
 */
export interface FunnelAnalysisConfig extends AnalysisConfigBase {
  analysisType: 'funnel'

  /**
   * Server funnel query - executable as-is.
   * Contains bindingKey, timeDimension, steps[], and options.
   */
  query: ServerFunnelQuery
}

// ============================================================================
// Flow Mode Configuration
// ============================================================================

/**
 * Flow mode config - for bidirectional flow analysis
 *
 * The `query` field is the ServerFlowQuery which can be sent
 * directly to the server for execution.
 */
export interface FlowAnalysisConfig extends AnalysisConfigBase {
  analysisType: 'flow'

  /**
   * Server flow query - executable as-is.
   * Contains bindingKey, timeDimension, eventDimension, startingStep, and depth config.
   */
  query: ServerFlowQuery
}

// ============================================================================
// Retention Mode Configuration
// ============================================================================

/**
 * Retention mode config - for cohort-based retention analysis
 *
 * The `query` field is the ServerRetentionQuery which can be sent
 * directly to the server for execution.
 */
export interface RetentionAnalysisConfig extends AnalysisConfigBase {
  analysisType: 'retention'

  /**
   * Server retention query - executable as-is.
   * Contains cohortTimeDimension, activityTimeDimension, bindingKey,
   * granularity settings, and period configuration.
   */
  query: ServerRetentionQuery
}

// ============================================================================
// Union Type
// ============================================================================

/**
 * AnalysisConfig - union of all analysis mode configurations
 */
export type AnalysisConfig = QueryAnalysisConfig | FunnelAnalysisConfig | FlowAnalysisConfig | RetentionAnalysisConfig

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if config is for query mode
 */
export const isQueryConfig = (c: AnalysisConfig): c is QueryAnalysisConfig =>
  c.analysisType === 'query'

/**
 * Check if config is for funnel mode
 */
export const isFunnelConfig = (c: AnalysisConfig): c is FunnelAnalysisConfig =>
  c.analysisType === 'funnel'

/**
 * Check if config is for flow mode
 */
export const isFlowConfig = (c: AnalysisConfig): c is FlowAnalysisConfig =>
  c.analysisType === 'flow'

/**
 * Check if config is for retention mode
 */
export const isRetentionConfig = (c: AnalysisConfig): c is RetentionAnalysisConfig =>
  c.analysisType === 'retention'

/**
 * Check if a query config contains multiple queries
 */
export const isMultiQuery = (config: QueryAnalysisConfig): boolean =>
  'queries' in config.query &&
  Array.isArray((config.query as MultiQueryConfig).queries)

/**
 * Check if a query config contains a single query
 */
export const isSingleQuery = (config: QueryAnalysisConfig): boolean =>
  !isMultiQuery(config)

/**
 * Type guard to validate if an unknown value is a valid AnalysisConfig
 */
export const isValidAnalysisConfig = (
  config: unknown
): config is AnalysisConfig => {
  if (!config || typeof config !== 'object') return false

  const c = config as Record<string, unknown>

  // Check version
  if (c.version !== 1) return false

  // Check analysisType
  if (c.analysisType !== 'query' && c.analysisType !== 'funnel' && c.analysisType !== 'flow' && c.analysisType !== 'retention') return false

  // Check query exists
  if (!c.query || typeof c.query !== 'object') return false

  // Check activeView
  if (c.activeView !== 'table' && c.activeView !== 'chart') return false

  return true
}

// ============================================================================
// Default Factories
// ============================================================================

/**
 * Create a default empty query analysis config
 */
export const createDefaultQueryConfig = (): QueryAnalysisConfig => ({
  version: 1,
  analysisType: 'query',
  activeView: 'chart',
  charts: {
    query: {
      chartType: 'bar',
      chartConfig: {},
      displayConfig: {},
    },
  },
  query: {
    measures: [],
    dimensions: [],
  },
})

/**
 * Create a default empty funnel analysis config
 */
export const createDefaultFunnelConfig = (): FunnelAnalysisConfig => ({
  version: 1,
  analysisType: 'funnel',
  activeView: 'chart',
  charts: {
    funnel: {
      chartType: 'funnel',
      chartConfig: {},
      displayConfig: {},
    },
  },
  query: {
    funnel: {
      bindingKey: '',
      timeDimension: '',
      steps: [],
    },
  },
})

/**
 * Create a default empty flow analysis config
 */
export const createDefaultFlowConfig = (): FlowAnalysisConfig => ({
  version: 1,
  analysisType: 'flow',
  activeView: 'chart',
  charts: {
    flow: {
      chartType: 'sankey',
      chartConfig: {},
      displayConfig: {},
    },
  },
  query: {
    flow: {
      bindingKey: '',
      timeDimension: '',
      eventDimension: '',
      startingStep: {
        name: '',
        filter: undefined,
      },
      stepsBefore: 3,
      stepsAfter: 3,
      joinStrategy: 'auto',
    },
  },
})

/**
 * Create a default empty retention analysis config
 */
export const createDefaultRetentionConfig = (): RetentionAnalysisConfig => ({
  version: 1,
  analysisType: 'retention',
  activeView: 'chart',
  charts: {
    retention: {
      chartType: 'heatmap',
      chartConfig: {},
      displayConfig: {},
    },
  },
  query: {
    retention: {
      timeDimension: '',
      bindingKey: '',
      dateRange: { start: '', end: '' },
      granularity: 'week',
      periods: 12,
      retentionType: 'classic',
    },
  },
})

/**
 * Create a default config for the given analysis type
 */
export const createDefaultConfig = (
  type: AnalysisType = 'query'
): AnalysisConfig => {
  switch (type) {
    case 'funnel':
      return createDefaultFunnelConfig()
    case 'flow':
      return createDefaultFlowConfig()
    case 'retention':
      return createDefaultRetentionConfig()
    case 'query':
    default:
      return createDefaultQueryConfig()
  }
}

// ============================================================================
// Workspace Format (localStorage persistence)
// ============================================================================

/**
 * AnalysisWorkspace - Multi-mode persistence format for localStorage
 *
 * Unlike AnalysisConfig (which represents a single analysis mode),
 * AnalysisWorkspace preserves state for ALL modes. This prevents state
 * loss when switching between query, funnel, flow, and retention modes.
 *
 * Usage:
 * - localStorage persistence → AnalysisWorkspace (preserves all modes)
 * - Share URLs → AnalysisConfig (shares one specific analysis)
 * - Dashboard portlets → AnalysisConfig (embeds one specific analysis)
 */
export interface AnalysisWorkspace {
  /** Version number for migration support */
  version: 1

  /** Currently active analysis type */
  activeType: AnalysisType

  /**
   * Per-mode configurations.
   * Each mode stores its complete AnalysisConfig independently.
   * Charts are duplicated per-mode but merged on load.
   */
  modes: {
    query?: QueryAnalysisConfig
    funnel?: FunnelAnalysisConfig
    flow?: FlowAnalysisConfig
    retention?: RetentionAnalysisConfig
  }
}

/**
 * Type guard to validate if an unknown value is a valid AnalysisWorkspace
 */
export const isValidAnalysisWorkspace = (
  data: unknown
): data is AnalysisWorkspace => {
  if (!data || typeof data !== 'object') return false

  const w = data as Record<string, unknown>

  // Check version
  if (w.version !== 1) return false

  // Check activeType
  if (w.activeType !== 'query' && w.activeType !== 'funnel' && w.activeType !== 'flow' && w.activeType !== 'retention') return false

  // Check modes exists and is an object
  if (!w.modes || typeof w.modes !== 'object') return false

  return true
}

/**
 * Create a default empty workspace with all modes initialized
 */
export const createDefaultWorkspace = (): AnalysisWorkspace => ({
  version: 1,
  activeType: 'query',
  modes: {
    query: createDefaultQueryConfig(),
    funnel: createDefaultFunnelConfig(),
    flow: createDefaultFlowConfig(),
    retention: createDefaultRetentionConfig(),
  },
})
