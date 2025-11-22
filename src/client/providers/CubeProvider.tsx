/**
 * Lightweight CubeProvider implementation
 * Replaces @cubejs-client/react provider
 */

import React, { createContext, useContext, useMemo, useState } from 'react'
import { createCubeClient, type CubeClient } from '../client/CubeClient'
import type { CubeQueryOptions, CubeApiOptions, FeaturesConfig } from '../types'
import { useCubeMeta, type CubeMeta, type FieldLabelMap } from '../hooks/useCubeMeta'
import { BatchCoordinator } from '../client/BatchCoordinator'

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
}

const CubeContext = createContext<CubeContextValue | null>(null)

interface CubeProviderProps {
  cubeApi?: CubeClient
  apiOptions?: CubeApiOptions
  token?: string
  options?: CubeQueryOptions
  features?: FeaturesConfig
  enableBatching?: boolean
  children: React.ReactNode
}

export function CubeProvider({
  cubeApi: initialCubeApi,
  apiOptions: initialApiOptions,
  token: initialToken,
  options = {},
  features = { enableAI: true, aiEndpoint: '/api/ai/generate' }, // Default to AI enabled for backward compatibility
  enableBatching = true, // Default to batching enabled
  children
}: CubeProviderProps) {
  // State for dynamic API configuration (only for updates via updateApiConfig)
  const [dynamicConfig, setDynamicConfig] = useState<{ apiOptions: CubeApiOptions; token?: string } | null>(null)

  // Determine current config: dynamic config takes precedence over props
  const currentConfig = dynamicConfig || {
    apiOptions: initialApiOptions || { apiUrl: '/cubejs-api/v1' },
    token: initialToken
  }

  // Create or use the provided CubeClient, recreating when config changes
  const cubeApi = useMemo(() => {
    if (initialCubeApi && !initialApiOptions && !initialToken) {
      // Use provided client if no initial config specified
      return initialCubeApi
    }

    // Create client with current config
    return createCubeClient(currentConfig.token, currentConfig.apiOptions)
  }, [initialCubeApi, initialApiOptions, initialToken, currentConfig.apiOptions, currentConfig.token])

  // Create BatchCoordinator if batching is enabled
  const batchCoordinator = useMemo(() => {
    if (!enableBatching) {
      return null
    }

    // Create batch executor function that uses cubeApi.batchLoad
    const batchExecutor = (queries: any[]) => cubeApi.batchLoad(queries)

    return new BatchCoordinator(batchExecutor)
  }, [enableBatching, cubeApi])

  const { meta, labelMap, loading: metaLoading, error: metaError, getFieldLabel, refetch: refetchMeta } = useCubeMeta(cubeApi)
  
  const updateApiConfig = (newApiOptions: CubeApiOptions, newToken?: string) => {
    setDynamicConfig({
      apiOptions: newApiOptions,
      token: newToken
    })
  }
  
  const contextValue = {
    cubeApi,
    options,
    meta,
    labelMap,
    metaLoading,
    metaError,
    getFieldLabel,
    refetchMeta,
    updateApiConfig,
    features,
    batchCoordinator,
    enableBatching
  }
  
  return (
    <CubeContext.Provider value={contextValue}>
      {children}
    </CubeContext.Provider>
  )
}

export function useCubeContext() {
  const context = useContext(CubeContext)
  
  if (!context) {
    throw new Error('useCubeContext must be used within a CubeProvider')
  }
  return context
}