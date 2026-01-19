/**
 * CubeFeaturesProvider - Feature Flags Context Layer
 *
 * Provides feature configuration isolated from API and metadata layers.
 * This prevents components from re-rendering when feature flags change
 * if they don't use features.
 */

import { createContext, useContext, useState, useMemo, useCallback, useEffect, type ReactNode } from 'react'
import type { FeaturesConfig, DashboardLayoutMode } from '../types'
import { warnIfScreenshotLibMissing } from '../utils/thumbnail'

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

const DEFAULT_FEATURES: FeaturesConfig = {
  enableAI: true,
  aiEndpoint: '/api/ai/generate',
  showSchemaDiagram: false,
  useAnalysisBuilder: false,
  editToolbar: 'both',
  floatingToolbarPosition: 'right'
}

export function CubeFeaturesProvider({
  features: initialFeatures,
  dashboardModes = ['rows', 'grid'],
  children
}: CubeFeaturesProviderProps) {
  // Merge passed features with defaults so new features get default values
  const [features, setFeatures] = useState<FeaturesConfig>(() => ({
    ...DEFAULT_FEATURES,
    ...initialFeatures
  }))

  // Warn in development if thumbnail feature is enabled but modern-screenshot is not installed
  useEffect(() => {
    warnIfScreenshotLibMissing(features.thumbnail)
  }, [features.thumbnail])

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

// Default context value when used outside provider (safe fallback for hooks)
const DEFAULT_CONTEXT: CubeFeaturesContextValue = {
  features: DEFAULT_FEATURES,
  dashboardModes: ['rows', 'grid'],
  updateFeatures: () => {
    // No-op when used outside provider
  }
}

/**
 * Hook to access cube features context.
 * Returns default values if used outside CubeFeaturesProvider (graceful fallback).
 */
export function useCubeFeatures() {
  const context = useContext(CubeFeaturesContext)
  // Return default context if not within provider (allows hooks like useCubeLoadQuery to work in isolation)
  return context ?? DEFAULT_CONTEXT
}
