/**
 * CubeFeaturesProvider - Feature Flags Context Layer
 *
 * Provides feature configuration isolated from API and metadata layers.
 * This prevents components from re-rendering when feature flags change
 * if they don't use features.
 */

import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react'
import type { FeaturesConfig, DashboardLayoutMode } from '../types'

interface CubeFeaturesContextValue {
  features: FeaturesConfig
  dashboardModes: DashboardLayoutMode[]
  updateFeatures: (newFeatures: Partial<FeaturesConfig>) => void
}

const CubeFeaturesContext = createContext<CubeFeaturesContextValue | null>(null)

interface CubeFeaturesProviderProps {
  features?: FeaturesConfig
  dashboardModes?: DashboardLayoutMode[]
  children: ReactNode
}

export function CubeFeaturesProvider({
  features: initialFeatures = {
    enableAI: true,
    aiEndpoint: '/api/ai/generate',
    showSchemaDiagram: false,
    useAnalysisBuilder: false
  },
  dashboardModes = ['rows', 'grid'],
  children
}: CubeFeaturesProviderProps) {
  const [features, setFeatures] = useState<FeaturesConfig>(initialFeatures)

  const updateFeatures = useCallback((newFeatures: Partial<FeaturesConfig>) => {
    setFeatures(prev => ({ ...prev, ...newFeatures }))
  }, [])

  const value = useMemo(() => ({
    features,
    dashboardModes,
    updateFeatures
  }), [features, dashboardModes, updateFeatures])

  return (
    <CubeFeaturesContext.Provider value={value}>
      {children}
    </CubeFeaturesContext.Provider>
  )
}

export function useCubeFeatures() {
  const context = useContext(CubeFeaturesContext)
  if (!context) {
    throw new Error('useCubeFeatures must be used within CubeFeaturesProvider')
  }
  return context
}
