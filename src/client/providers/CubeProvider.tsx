/**
 * CubeProvider - Backward Compatibility Wrapper
 *
 * This provider wraps the three specialized context providers (API, Meta, Features)
 * to maintain 100% backward compatibility with existing code using useCubeContext().
 *
 * New code should use the specialized hooks (useCubeApi, useCubeMeta, useCubeFeatures)
 * for better performance and selective re-rendering.
 */

import { useMemo, type ReactNode } from 'react'
import { CubeApiProvider, useCubeApi } from './CubeApiProvider'
import { CubeMetaProvider, useCubeMeta } from './CubeMetaProvider'
import { CubeFeaturesProvider, useCubeFeatures } from './CubeFeaturesProvider'
import type { CubeQueryOptions, CubeApiOptions, FeaturesConfig, DashboardLayoutMode } from '../types'
import type { CubeMeta, FieldLabelMap } from '../hooks/useCubeMeta'
import type { CubeClient } from '../client/CubeClient'
import type { BatchCoordinator } from '../client/BatchCoordinator'

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
  children
}: CubeProviderProps) {
  return (
    <CubeApiProvider
      apiOptions={apiOptions || { apiUrl: '/cubejs-api/v1' }}
      token={token}
      options={options}
      enableBatching={enableBatching}
      batchDelayMs={batchDelayMs}
    >
      <CubeMetaProvider>
        <CubeFeaturesProvider features={features} dashboardModes={dashboardModes}>
          {children}
        </CubeFeaturesProvider>
      </CubeMetaProvider>
    </CubeApiProvider>
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
