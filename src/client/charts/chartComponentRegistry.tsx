/**
 * Chart Component Registry
 *
 * Holds the shared mutable state and the custom (plugin) chart registration API
 * for the lazy chart loader. This module deliberately does NOT import the built-in
 * chart import map (which dynamically imports DataTable and pulls in CubeProvider /
 * the chart plugin system). Keeping the registration API here — separate from
 * `ChartLoader.tsx` — lets `chartPlugin.ts` register/unregister charts without
 * creating an import cycle (chartPlugin → ChartLoader → DataTable → CubeProvider →
 * chartPlugin).
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react'
import type { ChartType, ChartProps } from '../types.js'
import { MissingDependencyFallback } from '../components/charts/MissingDependencyFallback.js'
import { useTranslation } from '../hooks/useTranslation.js'
// chartRegistry only imports pure helpers at runtime, so this stays free of the
// import-map cycle that this module is careful to avoid.
import { getChartEntry } from './chartRegistry.js'

// Type for lazy-loaded chart components
export type LazyChartComponent = ComponentType<ChartProps>

// Chart loader cache to prevent re-creating lazy components
export const chartLoaderCache = new Map<ChartType, LazyExoticComponent<LazyChartComponent>>()

// Track which chart types have failed to load due to missing dependencies
export const failedChartTypes = new Set<ChartType>()

// Registry for custom (plugin) chart components
export const customChartMap = new Map<string, LazyExoticComponent<LazyChartComponent>>()

/**
 * Creates a fallback component for an unknown/unregistered chart type.
 */
export function createUnknownChartFallback(chartType: string): LazyChartComponent {
  const Fallback: LazyChartComponent = ({ height }) => {
    const { t } = useTranslation()
    return (
      <div
        className="dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full dc:gap-2"
        style={{ height: typeof height === 'number' ? `${height}px` : height || '200px' }}
      >
        <div className="dc:text-sm dc:font-semibold text-dc-text-muted">{t('chart.runtime.unknownChartType')}</div>
        <div className="dc:text-xs text-dc-text-muted">&ldquo;{chartType}&rdquo; is not registered</div>
      </div>
    )
  }
  Fallback.displayName = `UnknownChart_${chartType}`
  return Fallback
}

/**
 * Creates a fallback component for a chart type with missing dependencies.
 */
export function createFallbackComponent(chartType: ChartType): LazyChartComponent {
  // Dependencies are declared on the chart's unified entry (custom or built-in).
  const depInfo = getChartEntry(chartType)?.dependencies

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
export function createSafeImport(
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
