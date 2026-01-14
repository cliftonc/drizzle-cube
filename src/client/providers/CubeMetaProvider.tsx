/**
 * CubeMetaProvider - Metadata Context Layer
 *
 * Provides cube metadata (meta, labelMap) isolated from API layer.
 * This prevents components from re-rendering when metadata loads
 * if they only need API access.
 *
 * Uses TanStack Query for metadata fetching with built-in caching.
 */

import { useCallback, useMemo, type ReactNode } from 'react'
import { useCubeMetaQuery } from '../hooks/queries/useCubeMetaQuery'
import { CubeMetaContext } from './CubeMetaContext'

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
