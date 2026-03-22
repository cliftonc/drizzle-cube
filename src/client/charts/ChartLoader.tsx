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
import type { BuiltInChartType, ChartType, ChartProps } from '../types'
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
const chartDependencyMap: Partial<Record<BuiltInChartType, { packageName: string; installCommand: string }>> = {
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
  },
  waterfall: {
    packageName: 'recharts',
    installCommand: 'npm install recharts'
  },
  measureProfile: {
    packageName: 'recharts',
    installCommand: 'npm install recharts'
  },
  gauge: {
    packageName: 'd3-shape',
    installCommand: 'npm install d3-shape'
  },
  // Charts with no external deps: table, activityGrid, kpiNumber, kpiDelta, kpiText, markdown, retentionHeatmap, boxPlot, candlestick
}

// Dynamic import functions for built-in chart types
const chartImportMap: Record<BuiltInChartType, () => Promise<{ default: LazyChartComponent }>> = {
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
  boxPlot: () => import('../components/charts/BoxPlotChart'),
  waterfall: () => import('../components/charts/WaterfallChart'),
  candlestick: () => import('../components/charts/CandlestickChart'),
  measureProfile: () => import('../components/charts/MeasureProfileChart'),
  gauge: () => import('../components/charts/GaugeChart'),
}

// Registry for custom (plugin) chart components
const customChartMap = new Map<string, LazyExoticComponent<LazyChartComponent>>()

/**
 * Creates a fallback component for an unknown/unregistered chart type.
 */
function createUnknownChartFallback(chartType: string): LazyChartComponent {
  const Fallback: LazyChartComponent = ({ height }) => (
    <div
      className="dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full dc:gap-2"
      style={{ height: typeof height === 'number' ? `${height}px` : height || '200px' }}
    >
      <div className="dc:text-sm dc:font-semibold text-dc-text-muted">Unknown chart type</div>
      <div className="dc:text-xs text-dc-text-muted">&ldquo;{chartType}&rdquo; is not registered</div>
    </div>
  )
  Fallback.displayName = `UnknownChart_${chartType}`
  return Fallback
}

/**
 * Creates a fallback component for a chart type with missing dependencies.
 */
function createFallbackComponent(chartType: ChartType): LazyChartComponent {
  const depInfo = chartDependencyMap[chartType as BuiltInChartType]

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
 * Checks custom (plugin) charts first, then built-in charts.
 * Returns an unknown chart fallback for unregistered types instead of throwing.
 */
function getLazyChart(chartType: ChartType): LazyExoticComponent<LazyChartComponent> {
  // 1. Check custom charts first (allows overriding built-ins)
  const customChart = customChartMap.get(chartType)
  if (customChart) {
    return customChart
  }

  // 2. Check built-in cache
  if (chartLoaderCache.has(chartType)) {
    return chartLoaderCache.get(chartType)!
  }

  // 3. Check built-in import map
  const importFn = chartImportMap[chartType as BuiltInChartType]
  if (importFn) {
    const safeImport = createSafeImport(chartType, importFn)
    chartLoaderCache.set(chartType, lazy(safeImport))
    return chartLoaderCache.get(chartType)!
  }

  // 4. Unknown chart type — return graceful fallback
  return lazy(() => Promise.resolve({ default: createUnknownChartFallback(chartType) }))
}

/**
 * Check if a chart type is supported (built-in or custom plugin)
 */
export function isValidChartType(chartType: string): chartType is ChartType {
  return chartType in chartImportMap || customChartMap.has(chartType)
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
      className="dc:flex dc:items-center dc:justify-center dc:w-full"
      style={{ height: typeof height === 'number' ? `${height}px` : height || '200px' }}
    >
      <div className="dc:animate-pulse bg-dc-surface-secondary dc:rounded dc:w-full dc:h-full dc:min-h-[100px]" />
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
  const importFn = chartImportMap[chartType as BuiltInChartType]
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
 * Get all available chart types (built-in + custom plugins)
 */
export function getAvailableChartTypes(): ChartType[] {
  const builtIn = Object.keys(chartImportMap) as ChartType[]
  const custom = Array.from(customChartMap.keys())
  // Deduplicate in case a custom chart overrides a built-in
  return [...new Set([...builtIn, ...custom])]
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

/**
 * Register a custom chart component.
 * Used by the chart plugin system.
 */
export function registerChartComponent(
  type: string,
  component?: ComponentType<ChartProps>,
  lazyComponent?: () => Promise<{ default: ComponentType<ChartProps> }>,
  dependencies?: { packageName: string; installCommand: string }
): void {
  // Clear any existing built-in cache entry so the custom chart takes priority
  chartLoaderCache.delete(type as ChartType)
  failedChartTypes.delete(type as ChartType)

  if (lazyComponent) {
    // Lazy import factory — wrap with safe import for graceful degradation
    const safeImport = dependencies
      ? createSafeImport(type as ChartType, lazyComponent)
      : lazyComponent
    customChartMap.set(type, lazy(safeImport))
  } else if (component) {
    // Eager component — wrap in a resolved lazy for consistent Suspense handling
    const comp = component
    customChartMap.set(type, lazy(() => Promise.resolve({ default: comp as LazyChartComponent })))
  }
}

/**
 * Unregister a custom chart component.
 * Used by the chart plugin system.
 */
export function unregisterChartComponent(type: string): void {
  customChartMap.delete(type)
  chartLoaderCache.delete(type as ChartType)
  failedChartTypes.delete(type as ChartType)
}
