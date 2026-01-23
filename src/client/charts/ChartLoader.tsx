/**
 * Lazy Chart Loader
 *
 * Provides React.lazy-based dynamic loading for chart components.
 * This enables code splitting - each chart type loads only when needed.
 *
 * Handles missing optional dependencies gracefully by showing a fallback
 * component instead of crashing the application.
 */

import { lazy, Suspense, ComponentType, ReactNode, LazyExoticComponent } from 'react'
import type { ChartType, ChartProps } from '../types'
import { MissingDependencyFallback } from '../components/charts/MissingDependencyFallback'

// Type for lazy-loaded chart components
type LazyChartComponent = ComponentType<ChartProps>

// Chart loader cache to prevent re-creating lazy components
const chartLoaderCache = new Map<ChartType, LazyExoticComponent<LazyChartComponent>>()

// Track which chart types have failed to load due to missing dependencies
const failedChartTypes = new Set<ChartType>()

/**
 * Maps chart types to their optional peer dependencies.
 * Charts not listed here have no external dependencies (table, KPIs, markdown).
 */
const chartDependencyMap: Partial<Record<ChartType, { packageName: string; installCommand: string }>> = {
  // Recharts-based charts
  bar: {
    packageName: 'recharts',
    installCommand: 'npm install recharts'
  },
  line: {
    packageName: 'recharts',
    installCommand: 'npm install recharts'
  },
  area: {
    packageName: 'recharts',
    installCommand: 'npm install recharts'
  },
  pie: {
    packageName: 'recharts',
    installCommand: 'npm install recharts'
  },
  scatter: {
    packageName: 'recharts',
    installCommand: 'npm install recharts'
  },
  radar: {
    packageName: 'recharts',
    installCommand: 'npm install recharts'
  },
  radialBar: {
    packageName: 'recharts',
    installCommand: 'npm install recharts'
  },
  treemap: {
    packageName: 'recharts',
    installCommand: 'npm install recharts'
  },
  bubble: {
    packageName: 'recharts',
    installCommand: 'npm install recharts'
  },
  funnel: {
    packageName: 'recharts',
    installCommand: 'npm install recharts'
  },
  sankey: {
    packageName: 'recharts',
    installCommand: 'npm install recharts'
  },
  sunburst: {
    packageName: 'recharts',
    installCommand: 'npm install recharts'
  },
  // Nivo-based charts
  heatmap: {
    packageName: '@nivo/heatmap',
    installCommand: 'npm install @nivo/heatmap'
  }
  // Charts with no external deps: table, activityGrid, kpiNumber, kpiDelta, kpiText, markdown, retentionHeatmap
}

// Dynamic import functions for each chart type
const chartImportMap: Record<ChartType, () => Promise<{ default: LazyChartComponent }>> = {
  bar: () => import('../components/charts/BarChart'),
  line: () => import('../components/charts/LineChart'),
  area: () => import('../components/charts/AreaChart'),
  pie: () => import('../components/charts/PieChart'),
  scatter: () => import('../components/charts/ScatterChart'),
  radar: () => import('../components/charts/RadarChart'),
  radialBar: () => import('../components/charts/RadialBarChart'),
  treemap: () => import('../components/charts/TreeMapChart'),
  bubble: () => import('../components/charts/BubbleChart'),
  table: () => import('../components/charts/DataTable'),
  activityGrid: () => import('../components/charts/ActivityGridChart'),
  kpiNumber: () => import('../components/charts/KpiNumber'),
  kpiDelta: () => import('../components/charts/KpiDelta'),
  kpiText: () => import('../components/charts/KpiText'),
  markdown: () => import('../components/charts/MarkdownChart'),
  funnel: () => import('../components/charts/FunnelChart'),
  sankey: () => import('../components/charts/SankeyChart'),
  sunburst: () => import('../components/charts/SunburstChart'),
  heatmap: () => import('../components/charts/HeatMapChart'),
  retentionHeatmap: () => import('../components/charts/RetentionHeatmap'),
  retentionCombined: () => import('../components/charts/RetentionCombinedChart'),
}

/**
 * Creates a fallback component for a chart type with missing dependencies.
 */
function createFallbackComponent(chartType: ChartType): LazyChartComponent {
  const depInfo = chartDependencyMap[chartType]

  const FallbackComponent: LazyChartComponent = ({ height }) => (
    <MissingDependencyFallback
      chartType={chartType}
      packageName={depInfo?.packageName || 'unknown'}
      installCommand={depInfo?.installCommand || `npm install [package-name]`}
      height={height}
    />
  )

  FallbackComponent.displayName = `${chartType}Fallback`
  return FallbackComponent
}

/**
 * Wraps a chart import function with error handling.
 * If the import fails (e.g., missing dependency), returns a fallback component.
 */
function createSafeImport(
  chartType: ChartType,
  importFn: () => Promise<{ default: LazyChartComponent }>
): () => Promise<{ default: LazyChartComponent }> {
  return async () => {
    try {
      return await importFn()
    } catch (error) {
      // Log the error for debugging
      console.warn(
        `[drizzle-cube] Failed to load ${chartType} chart:`,
        error instanceof Error ? error.message : error
      )

      // Track that this chart type failed
      failedChartTypes.add(chartType)

      // Return the fallback component wrapped in the expected format
      return { default: createFallbackComponent(chartType) }
    }
  }
}

/**
 * Get or create a lazy component for a chart type.
 * Handles import failures gracefully by returning a fallback component.
 */
function getLazyChart(chartType: ChartType): LazyExoticComponent<LazyChartComponent> {
  if (!chartLoaderCache.has(chartType)) {
    const importFn = chartImportMap[chartType]
    if (!importFn) {
      throw new Error(`Unknown chart type: ${chartType}`)
    }
    // Wrap the import with error handling for graceful degradation
    const safeImport = createSafeImport(chartType, importFn)
    chartLoaderCache.set(chartType, lazy(safeImport))
  }
  return chartLoaderCache.get(chartType)!
}

/**
 * Check if a chart type is supported
 */
export function isValidChartType(chartType: string): chartType is ChartType {
  return chartType in chartImportMap
}

// Props for the LazyChart wrapper
export interface LazyChartProps extends ChartProps {
  chartType: ChartType
  fallback?: ReactNode
}

/**
 * Default loading placeholder for charts
 */
function DefaultChartFallback({ height }: { height?: string | number }) {
  return (
    <div
      className="flex items-center justify-center w-full"
      style={{ height: typeof height === 'number' ? `${height}px` : height || '200px' }}
    >
      <div className="animate-pulse bg-dc-surface-secondary rounded w-full h-full min-h-[100px]" />
    </div>
  )
}

/**
 * Lazy Chart Component
 *
 * Renders a chart component with React.lazy dynamic loading.
 * The chart type determines which chart component is loaded.
 *
 * @example
 * ```tsx
 * <LazyChart
 *   chartType="bar"
 *   data={chartData}
 *   chartConfig={{ yAxis: ['value'] }}
 *   height={300}
 * />
 * ```
 */
export function LazyChart({
  chartType,
  fallback,
  height,
  ...chartProps
}: LazyChartProps) {
  const ChartComponent = getLazyChart(chartType)

  return (
    <Suspense fallback={fallback ?? <DefaultChartFallback height={height} />}>
      <ChartComponent height={height} {...chartProps} />
    </Suspense>
  )
}

/**
 * Preload a chart type
 *
 * Triggers the dynamic import without rendering.
 * Useful for prefetching charts that will likely be needed.
 *
 * @example
 * ```tsx
 * // Preload bar chart on hover
 * onMouseEnter={() => preloadChart('bar')}
 * ```
 */
export function preloadChart(chartType: ChartType): void {
  const importFn = chartImportMap[chartType]
  if (importFn) {
    importFn()
  }
}

/**
 * Preload multiple chart types
 *
 * @example
 * ```tsx
 * // Preload common charts on app init
 * useEffect(() => {
 *   preloadCharts(['bar', 'line', 'pie'])
 * }, [])
 * ```
 */
export function preloadCharts(chartTypes: ChartType[]): void {
  chartTypes.forEach(preloadChart)
}

/**
 * Get all available chart types
 */
export function getAvailableChartTypes(): ChartType[] {
  return Object.keys(chartImportMap) as ChartType[]
}

/**
 * Check if a chart type has loaded successfully.
 * Returns false if the chart failed to load due to missing dependencies.
 *
 * Note: This only returns accurate results after the chart has been attempted to load.
 * Use this for conditional UI logic (e.g., hiding unavailable chart types).
 */
export function isChartTypeAvailable(chartType: ChartType): boolean {
  return !failedChartTypes.has(chartType)
}

/**
 * Get list of chart types that failed to load due to missing dependencies.
 */
export function getUnavailableChartTypes(): ChartType[] {
  return Array.from(failedChartTypes)
}
