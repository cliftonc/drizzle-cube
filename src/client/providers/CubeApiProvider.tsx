/**
 * CubeApiProvider - Stable API Context Layer
 *
 * Provides the CubeClient API instance that only changes on authentication updates.
 * Isolated from metadata and feature contexts to prevent unnecessary re-renders.
 */

import { createContext, useContext, useState, useMemo, useCallback, useEffect, type ReactNode } from 'react'
import { createCubeClient, type CubeClient } from '../client/CubeClient'
import type { CubeQueryOptions, CubeApiOptions } from '../types'
import { BatchCoordinator } from '../client/BatchCoordinator'

interface CubeApiContextValue {
  cubeApi: CubeClient
  options?: CubeQueryOptions
  updateApiConfig: (apiOptions: CubeApiOptions, token?: string) => void
  batchCoordinator: BatchCoordinator | null
  enableBatching: boolean
}

const CubeApiContext = createContext<CubeApiContextValue | null>(null)

interface CubeApiProviderProps {
  apiOptions: CubeApiOptions
  token?: string
  options?: CubeQueryOptions
  enableBatching?: boolean
  batchDelayMs?: number
  children: ReactNode
}

export function CubeApiProvider({
  apiOptions: initialApiOptions,
  token: initialToken,
  options = {},
  enableBatching = true,
  batchDelayMs = 50,
  children
}: CubeApiProviderProps) {
  const baseConfig = useMemo(
    () => ({ apiOptions: initialApiOptions, token: initialToken }),
    [initialApiOptions, initialToken]
  )
  const [overrideConfig, setOverrideConfig] = useState<{
    apiOptions: CubeApiOptions
    token?: string
  } | null>(null)

  useEffect(() => {
    setOverrideConfig(null)
  }, [baseConfig])

  const config = overrideConfig ?? baseConfig

  // Create CubeClient - only recreates when config changes
  const cubeApi = useMemo(() =>
    createCubeClient(config.token, config.apiOptions),
    [config.apiOptions, config.token]
  )

  // Create BatchCoordinator - only recreates when cubeApi or batching config changes
  const batchCoordinator = useMemo(() => {
    if (!enableBatching) return null
    return new BatchCoordinator((queries) => cubeApi.batchLoad(queries), batchDelayMs)
  }, [enableBatching, cubeApi, batchDelayMs])

  // Stable callback for updating config
  const updateApiConfig = useCallback((newApiOptions: CubeApiOptions, newToken?: string) => {
    setOverrideConfig({ apiOptions: newApiOptions, token: newToken })
  }, [])

  // Memoize context value - only changes when cubeApi/options change
  const value = useMemo(() => ({
    cubeApi,
    options,
    updateApiConfig,
    batchCoordinator,
    enableBatching
  }), [cubeApi, options, updateApiConfig, batchCoordinator, enableBatching])

  return (
    <CubeApiContext.Provider value={value}>
      {children}
    </CubeApiContext.Provider>
  )
}

export function useCubeApi() {
  const context = useContext(CubeApiContext)
  if (!context) {
    throw new Error('useCubeApi must be used within CubeApiProvider')
  }
  return context
}
