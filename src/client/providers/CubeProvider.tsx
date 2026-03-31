/**
 * CubeProvider - Backward Compatibility Wrapper
 *
 * This provider wraps the three specialized context providers (API, Meta, Features)
 * to maintain 100% backward compatibility with existing code using useCubeContext().
 *
 * New code should use the specialized hooks (useCubeApi, useCubeMeta, useCubeFeatures)
 * for better performance and selective re-rendering.
 *
 * Also includes TanStack Query's QueryClientProvider for data fetching in
 * AnalysisBuilder and other components that use TanStack Query hooks.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CubeApiProvider, useCubeApi } from './CubeApiProvider'
import { CubeMetaProvider } from './CubeMetaProvider'
import { useCubeMeta } from './CubeMetaContext'
import { CubeFeaturesProvider, useCubeFeatures } from './CubeFeaturesProvider'
import type { CubeQueryOptions, CubeApiOptions, FeaturesConfig, DashboardLayoutMode, CubeMeta, FieldLabelMap } from '../types'
import type { CubeClient } from '../client/CubeClient'
import type { BatchCoordinator } from '../client/BatchCoordinator'
import type { ChartDefinition } from '../charts/chartPlugin'
import { chartPluginRegistry } from '../charts/chartPlugin'
import { I18nProvider } from './I18nProvider'

const DEFAULT_API_OPTIONS: CubeApiOptions = { apiUrl: '/cubejs-api/v1' }

export const createCubeQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes (matches existing cache duration)
      staleTime: 5 * 60 * 1000,
      // GC time: 15 minutes
      gcTime: 15 * 60 * 1000,
      // Retry failed queries up to 3 times
      retry: 3,
      // Don't refetch on window focus by default (can be overridden per-query)
      refetchOnWindowFocus: false,
    },
  },
})

// Legacy default client (useful for tests or explicit injection)
export const queryClient = createCubeQueryClient()

// Backward compatible interface - merges all three contexts
interface CubeContextValue {
  cubeApi: CubeClient
  options?: CubeQueryOptions
  meta: CubeMeta | null
  labelMap: FieldLabelMap
  metaLoading: boolean
  metaError: string | null
  getFieldLabel: (fieldName: string) => string
  refetchMeta: () => void
  updateApiConfig: (apiOptions: CubeApiOptions, token?: string) => void
  features: FeaturesConfig
  batchCoordinator: BatchCoordinator | null
  enableBatching: boolean
  dashboardModes: DashboardLayoutMode[]
}

interface CubeProviderProps {
  cubeApi?: CubeClient
  apiOptions?: CubeApiOptions
  token?: string
  options?: CubeQueryOptions
  features?: FeaturesConfig
  dashboardModes?: DashboardLayoutMode[]
  enableBatching?: boolean
  batchDelayMs?: number  // Delay in ms to collect queries before batching (default: 100)
  queryClient?: QueryClient
  /** Custom chart definitions to register. Overrides built-in charts when `type` matches. */
  customCharts?: ChartDefinition[]
  /** Locale code for i18n (default: 'en-GB'). Bundled locales are loaded via dynamic import. */
  locale?: string
  /** Optional translation overrides merged on top of the loaded locale. */
  translations?: Record<string, string>
  children: ReactNode
}

/**
 * CubeProvider - Three-layer context wrapper
 *
 * Wraps children in three isolated context providers for optimal performance:
 * 1. CubeApiProvider - Stable API layer (changes only on auth)
 * 2. CubeMetaProvider - Metadata layer (changes on metadata load)
 * 3. CubeFeaturesProvider - Feature flags layer (changes on feature updates)
 */
export function CubeProvider({
  cubeApi: _initialCubeApi, // Intentionally unused - for backward compatibility
  apiOptions,
  token,
  options,
  features,
  dashboardModes,
  enableBatching,
  batchDelayMs,
  queryClient: providedQueryClient,
  customCharts,
  locale,
  translations,
  children
}: CubeProviderProps) {
  const [internalQueryClient] = useState(() => createCubeQueryClient())
  const queryClient = providedQueryClient ?? internalQueryClient

  // Register/unregister custom charts
  const registeredTypesRef = useRef<string[]>([])
  useEffect(() => {
    if (!customCharts || customCharts.length === 0) {
      // Unregister any previously registered charts
      for (const type of registeredTypesRef.current) {
        chartPluginRegistry.unregister(type)
      }
      registeredTypesRef.current = []
      return
    }

    // Unregister old charts that are no longer in the list
    const newTypes = new Set(customCharts.map(c => c.type))
    for (const type of registeredTypesRef.current) {
      if (!newTypes.has(type)) {
        chartPluginRegistry.unregister(type)
      }
    }

    // Register all current charts
    for (const chart of customCharts) {
      chartPluginRegistry.register(chart)
    }
    registeredTypesRef.current = customCharts.map(c => c.type)

    return () => {
      for (const type of registeredTypesRef.current) {
        chartPluginRegistry.unregister(type)
      }
      registeredTypesRef.current = []
    }
  }, [customCharts])

  return (
    <I18nProvider locale={locale} translations={translations}>
      <QueryClientProvider client={queryClient}>
        <CubeApiProvider
          apiOptions={apiOptions || DEFAULT_API_OPTIONS}
          token={token}
          options={options}
          locale={locale}
          enableBatching={enableBatching}
          batchDelayMs={batchDelayMs}
        >
          <CubeMetaProvider>
            <CubeFeaturesProvider features={features} dashboardModes={dashboardModes}>
              {children}
            </CubeFeaturesProvider>
          </CubeMetaProvider>
        </CubeApiProvider>
      </QueryClientProvider>
    </I18nProvider>
  )
}

/**
 * useCubeContext - Backward compatible hook
 *
 * Merges all three contexts into a single object for backward compatibility.
 * Components using this hook will re-render when ANY context changes.
 *
 * For better performance, use specialized hooks:
 * - useCubeApi() - Only re-renders on API changes
 * - useCubeMeta() - Only re-renders on metadata changes
 * - useCubeFeatures() - Only re-renders on feature changes
 */
export function useCubeContext(): CubeContextValue {
  const api = useCubeApi()
  const meta = useCubeMeta()
  const featuresCtx = useCubeFeatures()

  return useMemo(() => ({
    ...api,
    ...meta,
    features: featuresCtx.features,
    dashboardModes: featuresCtx.dashboardModes
  }), [api, meta, featuresCtx])
}

// Re-export specialized hooks for better tree-shaking and performance
export { useCubeApi, useCubeMeta, useCubeFeatures }

// Export factory for testing and advanced use cases
export { createCubeQueryClient as createQueryClient }
