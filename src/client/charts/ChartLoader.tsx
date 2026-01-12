/**
 * Lazy Chart Loader
 *
 * Provides React.lazy-based dynamic loading for chart components.
 * This enables code splitting - each chart type loads only when needed.
 */

import { lazy, Suspense, ComponentType, ReactNode, LazyExoticComponent } from 'react'
import type { ChartType, ChartProps } from '../types'

// Type for lazy-loaded chart components
type LazyChartComponent = ComponentType<ChartProps>

// Chart loader cache to prevent re-creating lazy components
const chartLoaderCache = new Map<ChartType, LazyExoticComponent<LazyChartComponent>>()

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
}

/**
 * Get or create a lazy component for a chart type
 */
function getLazyChart(chartType: ChartType): LazyExoticComponent<LazyChartComponent> {
  if (!chartLoaderCache.has(chartType)) {
    const importFn = chartImportMap[chartType]
    if (!importFn) {
      throw new Error(`Unknown chart type: ${chartType}`)
    }
    chartLoaderCache.set(chartType, lazy(importFn))
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
