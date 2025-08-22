/**
 * Lightweight CubeProvider implementation
 * Replaces @cubejs-client/react provider
 */

import React, { createContext, useContext, useMemo, useState } from 'react'
import { createCubeClient, type CubeClient } from '../client/CubeClient'
import type { CubeQueryOptions, CubeApiOptions } from '../types'
import { useCubeMeta, type CubeMeta, type FieldLabelMap } from '../hooks/useCubeMeta'

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
}

const CubeContext = createContext<CubeContextValue | null>(null)

interface CubeProviderProps {
  cubeApi?: CubeClient
  apiOptions?: CubeApiOptions
  token?: string
  options?: CubeQueryOptions
  children: React.ReactNode
}

export function CubeProvider({ 
  cubeApi: initialCubeApi, 
  apiOptions: initialApiOptions,
  token: initialToken,
  options = {}, 
  children 
}: CubeProviderProps) {
  // State for dynamic API configuration
  const [apiConfig, setApiConfig] = useState<{ apiOptions: CubeApiOptions; token?: string }>({
    apiOptions: initialApiOptions || { apiUrl: '/cubejs-api/v1' },
    token: initialToken
  })

  // Create or use the provided CubeClient, recreating when config changes
  const cubeApi = useMemo(() => {
    if (initialCubeApi && !initialApiOptions && !initialToken) {
      // Use provided client if no initial config specified
      return initialCubeApi
    }
    
    // Create client with current config
    return createCubeClient(apiConfig.token, apiConfig.apiOptions)
  }, [initialCubeApi, initialApiOptions, initialToken, apiConfig.apiOptions, apiConfig.token])

  const { meta, labelMap, loading: metaLoading, error: metaError, getFieldLabel, refetch: refetchMeta } = useCubeMeta(cubeApi)
  
  const updateApiConfig = (newApiOptions: CubeApiOptions, newToken?: string) => {
    setApiConfig({
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
    updateApiConfig
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