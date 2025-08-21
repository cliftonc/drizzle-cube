/**
 * Lightweight CubeProvider implementation
 * Replaces @cubejs-client/react provider
 */

import React, { createContext, useContext } from 'react'
import type { CubeClient } from '../client/CubeClient'
import type { CubeQueryOptions } from '../types'
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
}

const CubeContext = createContext<CubeContextValue | null>(null)

interface CubeProviderProps {
  cubeApi: CubeClient
  options?: CubeQueryOptions
  children: React.ReactNode
}

export function CubeProvider({ cubeApi, options = {}, children }: CubeProviderProps) {
  const { meta, labelMap, loading: metaLoading, error: metaError, getFieldLabel, refetch: refetchMeta } = useCubeMeta(cubeApi)
  
  const contextValue = { 
    cubeApi, 
    options, 
    meta, 
    labelMap, 
    metaLoading, 
    metaError, 
    getFieldLabel, 
    refetchMeta 
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