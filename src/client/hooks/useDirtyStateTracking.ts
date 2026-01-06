/**
 * useDirtyStateTracking - Track configuration changes and dirty state
 *
 * Extracts dirty state tracking logic from AnalyticsDashboard:
 * - Tracks initial config to prevent saves during initial load
 * - Detects meaningful changes from initial state
 * - Manages dirty state through onDirtyStateChange callback
 *
 * @example
 * const { handleConfigChange, handleSave } = useDirtyStateTracking({
 *   initialConfig: config,
 *   onConfigChange,
 *   onSave,
 *   onDirtyStateChange,
 * })
 */

import { useCallback, useRef } from 'react'

export interface UseDirtyStateTrackingOptions<T> {
  /** Initial configuration to compare against */
  initialConfig: T
  /** Original config change handler */
  onConfigChange?: (config: T) => void
  /** Original save handler */
  onSave?: (config: T) => Promise<void> | void
  /** Dirty state change callback */
  onDirtyStateChange?: (isDirty: boolean) => void
}

export interface UseDirtyStateTrackingResult<T> {
  /** Wrapped config change handler that tracks dirty state */
  handleConfigChange: (config: T) => void
  /** Wrapped save handler that tracks dirty state */
  handleSave: (config: T) => Promise<void>
  /** Whether config has changed from initial */
  hasChanged: () => boolean
  /** Reset the initial config reference (e.g., after external config update) */
  resetInitialConfig: (config: T) => void
}

export function useDirtyStateTracking<T>({
  initialConfig,
  onConfigChange,
  onSave,
  onDirtyStateChange,
}: UseDirtyStateTrackingOptions<T>): UseDirtyStateTrackingResult<T> {
  // Track initial config to prevent saves during initial load
  const initialConfigRef = useRef(initialConfig)
  const hasConfigChangedFromInitial = useRef(false)

  // Enhanced save handler that tracks dirty state and prevents saves during initial load
  const handleSave = useCallback(
    async (config: T) => {
      // Don't save if this config hasn't actually changed from the initial load
      if (!hasConfigChangedFromInitial.current) {
        return // Prevent saves during initial load/responsive changes
      }

      if (onDirtyStateChange) {
        onDirtyStateChange(true) // Mark as dirty when save starts
      }

      try {
        if (onSave) {
          await onSave(config)
        }

        // Update our reference point after successful save
        initialConfigRef.current = config

        // Mark as clean after successful save
        if (onDirtyStateChange) {
          onDirtyStateChange(false)
        }
      } catch (error) {
        // Keep dirty state if save failed
        console.error('Save failed:', error)
        throw error
      }
    },
    [onSave, onDirtyStateChange]
  )

  // Enhanced config change handler that marks as dirty (only after initial load)
  const handleConfigChange = useCallback(
    (config: T) => {
      if (onConfigChange) {
        onConfigChange(config)
      }

      // Check if this is a meaningful change from the initial config
      const configString = JSON.stringify(config)
      const initialConfigString = JSON.stringify(initialConfigRef.current)

      if (configString !== initialConfigString) {
        hasConfigChangedFromInitial.current = true

        if (onDirtyStateChange) {
          onDirtyStateChange(true)
        }
      }
    },
    [onConfigChange, onDirtyStateChange]
  )

  // Check if config has changed from initial
  const hasChanged = useCallback(() => {
    return hasConfigChangedFromInitial.current
  }, [])

  // Reset initial config reference (useful when config is updated externally)
  const resetInitialConfig = useCallback((config: T) => {
    initialConfigRef.current = config
    hasConfigChangedFromInitial.current = false
  }, [])

  return {
    handleConfigChange,
    handleSave,
    hasChanged,
    resetInitialConfig,
  }
}
