/**
 * Lightweight CubeProvider implementation
 * Replaces @cubejs-client/react provider
 */

import React, { createContext, useContext } from 'react'
import type { CubeClient } from '../client/CubeClient'
import type { CubeQueryOptions } from '../types'

interface CubeContextValue {
  cubeApi: CubeClient
  options?: CubeQueryOptions
}

const CubeContext = createContext<CubeContextValue | null>(null)

interface CubeProviderProps {
  cubeApi: CubeClient
  options?: CubeQueryOptions
  children: React.ReactNode
}

export function CubeProvider({ cubeApi, options = {}, children }: CubeProviderProps) {
  const contextValue = { cubeApi, options }
  
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