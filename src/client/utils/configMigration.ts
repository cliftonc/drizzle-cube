/**
 * Config Migration Utilities
 *
 * Handles migration from legacy portlet/share formats to AnalysisConfig.
 * Used for backward compatibility when loading old saved configurations.
 */

import type {
  AnalysisConfig,
  QueryAnalysisConfig,
  FunnelAnalysisConfig,
  ChartConfig,
} from '../types/analysisConfig'
import { createDefaultQueryConfig, isValidAnalysisConfig } from '../types/analysisConfig'
import type {
  ChartType,
  ChartAxisConfig,
  ChartDisplayConfig,
  CubeQuery,
  MultiQueryConfig,
  FunnelBindingKey,
  QueryMergeStrategy,
} from '../types'
import type { ServerFunnelQuery, ServerFunnelStep } from '../types/funnel'

// ============================================================================
// Legacy Portlet Format
// ============================================================================

/**
 * Legacy portlet format (before AnalysisConfig)
 */
export interface LegacyPortlet {
  /** JSON string of CubeQuery or MultiQueryConfig */
  query: string
  chartType?: ChartType
  chartConfig?: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
  analysisType?: 'query' | 'funnel'
  // Funnel-specific legacy fields
  funnelChartType?: ChartType
  funnelChartConfig?: ChartAxisConfig
  funnelDisplayConfig?: ChartDisplayConfig
}

/**
 * Legacy MultiQueryConfig with funnel merge strategy
 * This is a standalone type (not extending MultiQueryConfig) to handle old data
 * where mergeStrategy was 'funnel' before it was removed from QueryMergeStrategy.
 */
export interface LegacyFunnelMultiQuery {
  queries: CubeQuery[]
  mergeStrategy: 'funnel'
  mergeKeys?: string[]
  queryLabels?: string[]
  funnelBindingKey?: FunnelBindingKey | null
  stepTimeToConvert?: (string | null)[]
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a query is a MultiQueryConfig
 */
function isMultiQueryConfig(query: unknown): query is MultiQueryConfig {
  return (
    typeof query === 'object' &&
    query !== null &&
    'queries' in query &&
    Array.isArray((query as MultiQueryConfig).queries)
  )
}

/**
 * Check if a query is a legacy funnel multi-query
 * Uses type assertion since 'funnel' is no longer in QueryMergeStrategy
 */
function isLegacyFunnelMultiQuery(
  query: unknown
): query is LegacyFunnelMultiQuery {
  return (
    typeof query === 'object' &&
    query !== null &&
    'queries' in query &&
    Array.isArray((query as { queries?: unknown[] }).queries) &&
    'mergeStrategy' in query &&
    (query as { mergeStrategy?: string }).mergeStrategy === 'funnel'
  )
}

/**
 * Check if a query is a ServerFunnelQuery
 */
function isServerFunnelQuery(query: unknown): query is ServerFunnelQuery {
  return (
    typeof query === 'object' &&
    query !== null &&
    'funnel' in query &&
    typeof (query as ServerFunnelQuery).funnel === 'object'
  )
}

// ============================================================================
// Migration Functions
// ============================================================================

/**
 * Extract chart config from legacy portlet fields
 */
function extractChartConfig(
  portlet: LegacyPortlet,
  analysisType: 'query' | 'funnel'
): ChartConfig {
  if (analysisType === 'funnel') {
    return {
      chartType: portlet.funnelChartType || portlet.chartType || 'funnel',
      chartConfig: portlet.funnelChartConfig || portlet.chartConfig || {},
      displayConfig: portlet.funnelDisplayConfig || portlet.displayConfig || {},
    }
  }

  return {
    chartType: portlet.chartType || 'bar',
    chartConfig: portlet.chartConfig || {},
    displayConfig: portlet.displayConfig || {},
  }
}

/**
 * Migrate a legacy portlet to AnalysisConfig format
 *
 * Handles:
 * - Single CubeQuery → QueryAnalysisConfig
 * - MultiQueryConfig → QueryAnalysisConfig
 * - ServerFunnelQuery → FunnelAnalysisConfig
 * - Legacy mergeStrategy:'funnel' → FunnelAnalysisConfig (via migrateLegacyFunnelMerge)
 *
 * @param portlet - Legacy portlet with query string
 * @returns AnalysisConfig in new format
 */
export function migrateLegacyPortlet(portlet: LegacyPortlet): AnalysisConfig {
  try {
    const query = JSON.parse(portlet.query)

    // Check if it's already a ServerFunnelQuery
    if (isServerFunnelQuery(query)) {
      const chartConfig = extractChartConfig(portlet, 'funnel')
      return {
        version: 1,
        analysisType: 'funnel',
        activeView: 'chart',
        charts: {
          funnel: chartConfig,
        },
        query,
      } as FunnelAnalysisConfig
    }

    // Check if it's a legacy funnel multi-query
    if (isLegacyFunnelMultiQuery(query)) {
      return migrateLegacyFunnelMerge(query, portlet)
    }

    // Check explicit analysisType
    if (portlet.analysisType === 'funnel') {
      // Treat as funnel even if query isn't ServerFunnelQuery format
      // (This handles edge cases where analysisType was set but query wasn't converted)
      const chartConfig = extractChartConfig(portlet, 'funnel')
      return {
        version: 1,
        analysisType: 'funnel',
        activeView: 'chart',
        charts: {
          funnel: chartConfig,
        },
        query: isServerFunnelQuery(query)
          ? query
          : {
              funnel: {
                bindingKey: '',
                timeDimension: '',
                steps: [],
              },
            },
      } as FunnelAnalysisConfig
    }

    // Handle regular query or multi-query
    const chartConfig = extractChartConfig(portlet, 'query')

    // MultiQueryConfig (non-funnel, since isLegacyFunnelMultiQuery was checked earlier)
    if (isMultiQueryConfig(query)) {
      // Defensive: convert any lingering 'funnel' strategy to 'concat'
      const strategy = (query.mergeStrategy as string) === 'funnel' ? 'concat' : query.mergeStrategy
      return {
        version: 1,
        analysisType: 'query',
        activeView: 'chart',
        charts: {
          query: chartConfig,
        },
        query: {
          queries: query.queries,
          mergeStrategy: strategy as QueryMergeStrategy,
          mergeKeys: query.mergeKeys,
          queryLabels: query.queryLabels,
        },
      } as QueryAnalysisConfig
    }

    // Single CubeQuery
    return {
      version: 1,
      analysisType: 'query',
      activeView: 'chart',
      charts: {
        query: chartConfig,
      },
      query: query as CubeQuery,
    } as QueryAnalysisConfig
  } catch (error) {
    // If parsing fails, return default config
    console.warn('[configMigration] Failed to parse legacy portlet:', error)
    return createDefaultQueryConfig()
  }
}

/**
 * Migrate legacy mergeStrategy:'funnel' to FunnelAnalysisConfig
 *
 * This handles the old pattern where funnels were created using multi-query
 * with mergeStrategy: 'funnel'. Converts to the new dedicated funnel format.
 *
 * @param legacyQuery - MultiQueryConfig with mergeStrategy: 'funnel'
 * @param portlet - Legacy portlet for chart config
 * @returns FunnelAnalysisConfig in new format
 */
export function migrateLegacyFunnelMerge(
  legacyQuery: LegacyFunnelMultiQuery,
  portlet?: LegacyPortlet
): FunnelAnalysisConfig {
  // Extract binding key
  let bindingKey: ServerFunnelQuery['funnel']['bindingKey'] = ''
  if (legacyQuery.funnelBindingKey?.dimension) {
    if (typeof legacyQuery.funnelBindingKey.dimension === 'string') {
      bindingKey = legacyQuery.funnelBindingKey.dimension
    } else if (Array.isArray(legacyQuery.funnelBindingKey.dimension)) {
      bindingKey = legacyQuery.funnelBindingKey.dimension.map((m) => ({
        cube: m.cube,
        dimension: m.dimension,
      }))
    }
  }

  // Extract time dimension from first query
  let timeDimension: string = ''
  if (
    legacyQuery.queries.length > 0 &&
    legacyQuery.queries[0].timeDimensions?.length
  ) {
    timeDimension = legacyQuery.queries[0].timeDimensions[0].dimension
  }

  // Convert queries to funnel steps
  const steps: ServerFunnelStep[] = legacyQuery.queries.map((query, index) => {
    const step: ServerFunnelStep = {
      name:
        legacyQuery.queryLabels?.[index] ||
        `Step ${index + 1}`,
    }

    // Convert filters
    if (query.filters && query.filters.length > 0) {
      step.filter =
        query.filters.length === 1 ? query.filters[0] : { and: query.filters }
    }

    // Add time to convert if specified
    if (
      legacyQuery.stepTimeToConvert &&
      legacyQuery.stepTimeToConvert[index]
    ) {
      step.timeToConvert = legacyQuery.stepTimeToConvert[index] as string
    }

    return step
  })

  // Build chart config
  const chartConfig: ChartConfig = portlet
    ? extractChartConfig(portlet, 'funnel')
    : {
        chartType: 'funnel',
        chartConfig: {},
        displayConfig: {},
      }

  return {
    version: 1,
    analysisType: 'funnel',
    activeView: 'chart',
    charts: {
      funnel: chartConfig,
    },
    query: {
      funnel: {
        bindingKey,
        timeDimension,
        steps,
        includeTimeMetrics: true,
      },
    },
  }
}

/**
 * Migrate any config to the latest version
 *
 * Handles:
 * - Already valid AnalysisConfig (returns as-is)
 * - Legacy portlet format (converts to AnalysisConfig)
 * - Unknown format (returns default config)
 *
 * @param config - Unknown config value
 * @returns Valid AnalysisConfig
 */
export function migrateConfig(config: unknown): AnalysisConfig {
  // Already valid?
  if (isValidAnalysisConfig(config)) {
    return config
  }

  // Check if it looks like a legacy portlet
  if (
    config &&
    typeof config === 'object' &&
    'query' in config &&
    typeof (config as { query: unknown }).query === 'string'
  ) {
    return migrateLegacyPortlet(config as LegacyPortlet)
  }

  // Check if it's a raw query object (not wrapped in portlet)
  if (config && typeof config === 'object') {
    try {
      // Try to wrap it as a portlet and migrate
      const wrapped: LegacyPortlet = {
        query: JSON.stringify(config),
      }
      return migrateLegacyPortlet(wrapped)
    } catch {
      // Fall through to default
    }
  }

  // Return default config
  console.warn('[configMigration] Unknown config format, using defaults')
  return createDefaultQueryConfig()
}

/**
 * Check if a portlet has the new AnalysisConfig format
 */
export function hasAnalysisConfig(
  portlet: unknown
): portlet is { analysisConfig: AnalysisConfig } {
  return (
    typeof portlet === 'object' &&
    portlet !== null &&
    'analysisConfig' in portlet &&
    isValidAnalysisConfig((portlet as { analysisConfig: unknown }).analysisConfig)
  )
}
