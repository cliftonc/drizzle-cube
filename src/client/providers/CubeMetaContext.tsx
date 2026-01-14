/**
 * CubeMetaContext - Metadata context definitions.
 *
 * Split from CubeMetaProvider so consumers can access metadata context
 * without pulling in TanStack Query dependencies.
 */

import { createContext, useContext } from 'react'
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

export function useCubeMeta() {
  const context = useContext(CubeMetaContext)
  if (!context) {
    throw new Error('useCubeMeta must be used within CubeMetaProvider')
  }
  return context
}
