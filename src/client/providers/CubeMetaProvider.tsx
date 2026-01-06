/**
 * CubeMetaProvider - Metadata Context Layer
 *
 * Provides cube metadata (meta, labelMap) isolated from API layer.
 * This prevents components from re-rendering when metadata loads
 * if they only need API access.
 *
 * Uses TanStack Query for metadata fetching with built-in caching.
 */

import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react'
import { useCubeMetaQuery } from '../hooks/queries/useCubeMetaQuery'
import type { CubeMeta, FieldLabelMap } from '../types'

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
  // Use TanStack Query hook for metadata fetching
  const {
    meta,
    labelMap,
    isLoading: metaLoading,
    error,
    refetch,
    getFieldLabel: getFieldLabelFromQuery
  } = useCubeMetaQuery()

  // Convert error to string for backward compatibility
  const metaError = error ? (error instanceof Error ? error.message : String(error)) : null

  // Wrap refetch to match expected signature
  const refetchMeta = useCallback(() => {
    refetch()
  }, [refetch])

  // Create stable getFieldLabel that reads from current labelMap
  const getFieldLabel = useCallback((fieldName: string): string => {
    return getFieldLabelFromQuery(fieldName)
  }, [getFieldLabelFromQuery])

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
