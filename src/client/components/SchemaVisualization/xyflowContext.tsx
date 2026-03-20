/**
 * React context for @xyflow/react modules.
 *
 * All xyflow imports are dynamic (via SchemaVisualizationLazy) so that
 * the built schema-visualization chunk has NO static imports from
 * @xyflow/react. This prevents consuming projects from failing at
 * build time when @xyflow/react is not installed.
 */

import { createContext, useContext } from 'react'

export type XyflowModule = typeof import('@xyflow/react')

const XyflowContext = createContext<XyflowModule | null>(null)

export const XyflowProvider = XyflowContext.Provider

export function useXyflow(): XyflowModule {
  const ctx = useContext(XyflowContext)
  if (!ctx) throw new Error('useXyflow must be used within XyflowProvider')
  return ctx
}
