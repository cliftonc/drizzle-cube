/**
 * useDrillInteraction - Hook for managing drill-down interaction state
 * Coordinates between chart clicks, drill menu, and query updates
 */

import { useState, useCallback, useMemo } from 'react'
import type {
  ChartDataPointClickEvent,
  DrillOption,
  DrillPathEntry,
  DrillInteraction,
  UseDrillInteractionOptions
} from '../types/drill'
import type { ChartAxisConfig, CubeQuery } from '../types'
import {
  buildDrillOptions,
  buildDrillQuery,
  getMeasureDrillMembers
} from '../utils/drillQueryBuilder'

/**
 * Hook for managing drill-down interaction
 *
 * @param options - Configuration options
 * @returns DrillInteraction object with handlers and state
 */
export function useDrillInteraction(options: UseDrillInteractionOptions): DrillInteraction {
  const {
    query,
    metadata,
    onQueryChange,
    chartConfig,
    dashboardFilters,
    dashboardFilterMapping,
    // onDashboardFilterChange is no longer used - dashboard-scope options removed
    enabled = true
  } = options

  // Menu state
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [menuOptions, setMenuOptions] = useState<DrillOption[]>([])
  const [currentClickEvent, setCurrentClickEvent] = useState<ChartDataPointClickEvent | null>(null)

  // Drill path (breadcrumb navigation)
  const [drillPath, setDrillPath] = useState<DrillPathEntry[]>([])

  // Track the original granularity before any drilling (to detect when we should go back to root)
  const [originalGranularity, setOriginalGranularity] = useState<string | null>(null)

  // Track the original chart config to restore on drill up to root
  const [originalChartConfig, setOriginalChartConfig] = useState<ChartAxisConfig | null>(null)

  // Current chart config override (from drill details)
  const [currentChartConfig, setCurrentChartConfig] = useState<ChartAxisConfig | null>(null)

  // Track the complete original query to restore on drill up to root
  const [originalQuery, setOriginalQuery] = useState<CubeQuery | null>(null)

  /**
   * Check if any drill options are available for the current query/metadata
   */
  const drillEnabled = useMemo(() => {
    if (!enabled || !metadata) {
      return false
    }

    // Check if query has time dimensions (can drill time)
    const hasTimeDimensions = (query.timeDimensions?.length ?? 0) > 0

    // Check if query has dimensions that might be in hierarchies
    const hasDimensions = (query.dimensions?.length ?? 0) > 0

    // Check if any measures have drillMembers
    const hasDrillMembers = query.measures?.some(measure =>
      getMeasureDrillMembers(measure, metadata) !== null
    ) ?? false

    return hasTimeDimensions || hasDimensions || hasDrillMembers
  }, [enabled, metadata, query])

  /**
   * Check if any dimension in the query matches a dashboard filter
   */
  const hasDashboardFilterMatch = useMemo(() => {
    if (!dashboardFilters || !dashboardFilterMapping) {
      return false
    }

    // Check for universal time filter
    return dashboardFilters.some(f =>
      f.isUniversalTime && dashboardFilterMapping.includes(f.id)
    )
  }, [dashboardFilters, dashboardFilterMapping])

  /**
   * Handle data point click from chart
   */
  const handleDataPointClick = useCallback((event: ChartDataPointClickEvent) => {
    if (!enabled || !metadata) {
      return
    }

    // Build drill options for this click
    const options = buildDrillOptions(
      event,
      query,
      metadata,
      dashboardFilters,
      dashboardFilterMapping
    )

    if (options.length === 0) {
      return
    }

    // Store the click event and show menu
    setCurrentClickEvent(event)
    setMenuOptions(options)
    setMenuPosition(event.position)
    setMenuOpen(true)
  }, [enabled, metadata, query, dashboardFilters, dashboardFilterMapping])

  /**
   * Handle drill option selection
   */
  const handleOptionSelect = useCallback((option: DrillOption) => {
    if (!currentClickEvent || !metadata) {
      return
    }

    try {
      // For time dimension drilling, check if we should navigate back instead of creating new entries
      if (option.targetGranularity && drillPath.length > 0) {
        // Check if target granularity exists in drill path (navigate back to that level)
        const existingLevelIndex = drillPath.findIndex(entry =>
          entry.granularity === option.targetGranularity
        )

        if (existingLevelIndex !== -1) {
          // Navigate back to the existing level
          const targetIndex = existingLevelIndex + 1
          if (targetIndex < drillPath.length) {
            const newPath = drillPath.slice(0, targetIndex)
            const targetEntry = newPath[newPath.length - 1]
            setDrillPath(newPath)
            onQueryChange(targetEntry.query)
            setCurrentChartConfig(targetEntry.chartConfig || null)
          }
          setMenuOpen(false)
          setCurrentClickEvent(null)
          return
        }

        // Check if drilling back to the original granularity (return to root)
        if (originalGranularity && option.targetGranularity === originalGranularity) {
          // Restore the complete original query
          const restoredQuery = originalQuery || query
          setDrillPath([])
          // Restore original chart config (or clear if none was stored)
          setCurrentChartConfig(originalChartConfig)
          setOriginalChartConfig(null)
          setOriginalGranularity(null)
          setOriginalQuery(null)
          onQueryChange(restoredQuery)
          setMenuOpen(false)
          setCurrentClickEvent(null)
          return
        }
      }

      // For hierarchy dimension drilling, check if we should navigate back
      if (option.targetDimension && drillPath.length > 0) {
        const existingLevelIndex = drillPath.findIndex(entry =>
          entry.dimension === option.targetDimension
        )

        if (existingLevelIndex !== -1) {
          // Navigate back to the existing level
          const targetIndex = existingLevelIndex + 1
          if (targetIndex < drillPath.length) {
            const newPath = drillPath.slice(0, targetIndex)
            const targetEntry = newPath[newPath.length - 1]
            setDrillPath(newPath)
            onQueryChange(targetEntry.query)
            setCurrentChartConfig(targetEntry.chartConfig || null)
          }
          setMenuOpen(false)
          setCurrentClickEvent(null)
          return
        }
      }

      // Build the drill query
      const result = buildDrillQuery(option, currentClickEvent, query, metadata)

      // Track original state when first drilling
      if (drillPath.length === 0) {
        // Store the complete original query for restoration on drill back to root
        setOriginalQuery(query)

        // Store original chart config for restoration on drill back to root
        if (chartConfig) {
          setOriginalChartConfig(chartConfig)
        }

        // Track original granularity for detecting drill-back-to-root via time granularity
        if (option.targetGranularity && query.timeDimensions?.[0]) {
          const currentGran = query.timeDimensions[0].granularity
          if (currentGran) {
            setOriginalGranularity(currentGran)
          }
        }
      }

      // Add to drill path and update query
      setDrillPath(prev => [...prev, result.pathEntry])
      onQueryChange(result.query)

      // Update chart config if provided (e.g., when drilling to details)
      if (result.chartConfig) {
        setCurrentChartConfig(result.chartConfig)
      }
    } catch (error) {
      console.error('Error building drill query:', error)
    }

    // Close menu
    setMenuOpen(false)
    setCurrentClickEvent(null)
  }, [currentClickEvent, metadata, query, drillPath, originalGranularity, originalQuery, onQueryChange, chartConfig, originalChartConfig])

  /**
   * Close the drill menu
   */
  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    setMenuPosition(null)
    setMenuOptions([])
    setCurrentClickEvent(null)
  }, [])

  /**
   * Navigate back one level in the drill path
   */
  const navigateBack = useCallback(() => {
    if (drillPath.length === 0) {
      return
    }

    if (drillPath.length === 1) {
      // Going back to root - restore the complete original query
      // Use stored originalQuery to fully restore dimensions, measures, filters, etc.
      const restoredQuery = originalQuery || query

      setDrillPath([])
      // Restore original chart config (or clear if none was stored)
      setCurrentChartConfig(originalChartConfig)
      setOriginalChartConfig(null)
      setOriginalGranularity(null)
      setOriginalQuery(null)
      onQueryChange(restoredQuery)
    } else {
      // Go back to previous level
      const newPath = drillPath.slice(0, -1)
      const previousEntry = newPath[newPath.length - 1]
      setDrillPath(newPath)
      onQueryChange(previousEntry.query)
      // Restore chart config from previous entry
      setCurrentChartConfig(previousEntry.chartConfig || null)
    }
  }, [drillPath, onQueryChange, originalChartConfig, originalQuery, query])

  /**
   * Navigate to a specific level in the drill path
   */
  const navigateToLevel = useCallback((index: number) => {
    if (index <= 0) {
      // Navigate to root - restore the complete original query
      // Use stored originalQuery to fully restore dimensions, measures, filters, etc.
      const restoredQuery = originalQuery || query

      setDrillPath([])
      // Restore original chart config (or clear if none was stored)
      setCurrentChartConfig(originalChartConfig)
      setOriginalChartConfig(null)
      setOriginalGranularity(null)
      setOriginalQuery(null)
      onQueryChange(restoredQuery)
    } else if (index < drillPath.length) {
      // Navigate to a specific level
      const newPath = drillPath.slice(0, index)
      const targetEntry = newPath[newPath.length - 1]
      setDrillPath(newPath)
      onQueryChange(targetEntry.query)
      // Restore chart config from target entry
      setCurrentChartConfig(targetEntry.chartConfig || null)
    }
  }, [drillPath, onQueryChange, originalChartConfig, originalQuery, query])

  return {
    handleDataPointClick,
    menuOpen,
    menuPosition,
    menuOptions,
    handleOptionSelect,
    closeMenu,
    drillPath,
    navigateBack,
    navigateToLevel,
    drillEnabled,
    hasDashboardFilterMatch,
    currentChartConfig
  }
}

export default useDrillInteraction
