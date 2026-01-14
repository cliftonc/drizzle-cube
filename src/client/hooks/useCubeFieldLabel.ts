/**
 * Optimized hook that only subscribes to field label functionality
 * from CubeMeta context. This prevents re-renders when unrelated
 * contexts (CubeApi, Features) change.
 *
 * Use this instead of useCubeContext() when you only need getFieldLabel.
 */

import { useContext, useMemo } from 'react'
import { CubeMetaContext, type CubeMetaContextValue } from '../providers/CubeMetaContext'

/**
 * Returns a stable reference to the getFieldLabel function.
 * Components using this hook will only re-render when the field label
 * mapping actually changes, not when unrelated API or feature contexts update.
 *
 * @returns Function to get human-readable label for a field name
 * @throws Error if used outside CubeProvider
 */
export function useCubeFieldLabel(): (fieldName: string) => string {
  const context = useContext(CubeMetaContext) as CubeMetaContextValue | null

  if (!context) {
    throw new Error('useCubeFieldLabel must be used within CubeProvider')
  }

  // Return stable reference - only changes when getFieldLabel itself changes
  return useMemo(() => context.getFieldLabel, [context.getFieldLabel])
}
