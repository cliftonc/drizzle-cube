/**
 * CubeMetaProvider - Metadata Context Layer
 *
 * Provides cube metadata (meta, labelMap) isolated from API layer.
 * This prevents components from re-rendering when metadata loads
 * if they only need API access.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useCubeApi } from './CubeApiProvider'
import { useCubeMeta as useCubeMetaHook, type CubeMeta, type FieldLabelMap } from '../hooks/useCubeMeta'

export interface CubeMetaContextValue {
  meta: CubeMeta | null
  labelMap: FieldLabelMap
  metaLoading: boolean
  metaError: string | null
  getFieldLabel: (fieldName: string) => string
  refetchMeta: () => void
}

export const CubeMetaContext = createContext<CubeMetaContextValue | null>(null)

interface CubeMetaProviderProps {
  children: ReactNode
}

export function CubeMetaProvider({ children }: CubeMetaProviderProps) {
  const { cubeApi } = useCubeApi()

  // Use existing useCubeMeta hook
  const {
    meta,
    labelMap,
    loading: metaLoading,
    error: metaError,
    getFieldLabel,
    refetch: refetchMeta
  } = useCubeMetaHook(cubeApi)

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    meta,
    labelMap,
    metaLoading,
    metaError,
    getFieldLabel,
    refetchMeta
  }), [meta, labelMap, metaLoading, metaError, getFieldLabel, refetchMeta])

  return (
    <CubeMetaContext.Provider value={value}>
      {children}
    </CubeMetaContext.Provider>
  )
}

export function useCubeMeta() {
  const context = useContext(CubeMetaContext)
  if (!context) {
    throw new Error('useCubeMeta must be used within CubeMetaProvider')
  }
  return context
}
