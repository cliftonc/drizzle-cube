/**
 * useChartConfiguration Hook
 *
 * Manages chart-related state for AnalysisBuilder:
 * - Chart type, config, and display settings
 * - Color palette management
 * - Chart availability computation
 * - Smart chart defaulting when query changes
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { ChartType, ChartAxisConfig, ChartDisplayConfig, CubeQuery } from '../types'
import type { MetricItem, BreakdownItem, AnalysisBuilderStorageState } from '../components/AnalysisBuilder/types'
import { getAllChartAvailability, getSmartChartDefaults, shouldAutoSwitchChartType, type ChartAvailabilityMap } from '../shared/chartDefaults'
import { getColorPalette, type ColorPalette } from '../utils/colorPalettes'

export interface UseChartConfigurationOptions {
  /** Initial chart config from props */
  initialChartConfig?: {
    chartType?: ChartType
    chartConfig?: ChartAxisConfig
    displayConfig?: ChartDisplayConfig
  }
  /** Cached storage from localStorage */
  cachedStorage: AnalysisBuilderStorageState | null
  /** Initial query (to determine if we should use localStorage) */
  initialQuery?: CubeQuery | any
  /** External color palette (overrides local) - can be string[] or ColorPalette */
  externalColorPalette?: string[] | ColorPalette
  /** All metrics (for chart config) */
  allMetrics: MetricItem[]
  /** All breakdowns (for chart config) */
  allBreakdowns: BreakdownItem[]
  /** Debounced query (triggers smart defaulting) */
  debouncedQuery: CubeQuery | null
}

export interface UseChartConfigurationReturn {
  /** Current chart type */
  chartType: ChartType
  /** Set chart type */
  setChartType: React.Dispatch<React.SetStateAction<ChartType>>
  /** Chart axis configuration */
  chartConfig: ChartAxisConfig
  /** Set chart config */
  setChartConfig: React.Dispatch<React.SetStateAction<ChartAxisConfig>>
  /** Chart display configuration */
  displayConfig: ChartDisplayConfig
  /** Set display config */
  setDisplayConfig: React.Dispatch<React.SetStateAction<ChartDisplayConfig>>
  /** Local palette name */
  localPaletteName: string
  /** Set local palette name */
  setLocalPaletteName: React.Dispatch<React.SetStateAction<string>>
  /** Effective color palette (external or local) */
  effectiveColorPalette: ColorPalette
  /** Whether user manually selected chart type */
  userManuallySelectedChart: boolean
  /** Set user manually selected chart */
  setUserManuallySelectedChart: React.Dispatch<React.SetStateAction<boolean>>
  /** Chart availability by type */
  chartAvailability: ChartAvailabilityMap
  /** Check if chart config is empty */
  isChartConfigEmpty: (config: ChartAxisConfig) => boolean
  /** Ref for previous metrics/breakdowns key */
  prevMetricsBreakdownsRef: React.MutableRefObject<string>
  /** Ref for current chart config */
  chartConfigRef: React.MutableRefObject<ChartAxisConfig>
}

export function useChartConfiguration({
  initialChartConfig,
  cachedStorage,
  initialQuery,
  externalColorPalette,
  allMetrics,
  allBreakdowns,
  debouncedQuery
}: UseChartConfigurationOptions): UseChartConfigurationReturn {
  // Chart type state
  const [chartType, setChartType] = useState<ChartType>(() => {
    if (initialChartConfig?.chartType) {
      return initialChartConfig.chartType
    }
    if (!initialQuery && cachedStorage?.chartType) {
      return cachedStorage.chartType
    }
    return 'line'
  })

  // Chart axis configuration
  const [chartConfig, setChartConfig] = useState<ChartAxisConfig>(() => {
    if (initialChartConfig?.chartConfig) {
      return initialChartConfig.chartConfig
    }
    if (!initialQuery && cachedStorage?.chartConfig) {
      return cachedStorage.chartConfig
    }
    return {}
  })

  // Chart display configuration
  const [displayConfig, setDisplayConfig] = useState<ChartDisplayConfig>(() => {
    if (initialChartConfig?.displayConfig) {
      return initialChartConfig.displayConfig
    }
    if (!initialQuery && cachedStorage?.displayConfig) {
      return cachedStorage.displayConfig
    }
    return { showLegend: true, showGrid: true, showTooltip: true }
  })

  // Local color palette state
  const [localPaletteName, setLocalPaletteName] = useState<string>('default')

  // Effective color palette
  const effectiveColorPalette = useMemo((): ColorPalette => {
    if (externalColorPalette) {
      // If it's a string array, wrap it in a ColorPalette structure
      if (Array.isArray(externalColorPalette) && typeof externalColorPalette[0] === 'string') {
        return {
          name: 'custom',
          label: 'Custom',
          colors: externalColorPalette as string[],
          gradient: externalColorPalette as string[]
        }
      }
      return externalColorPalette as ColorPalette
    }
    return getColorPalette(localPaletteName)
  }, [externalColorPalette, localPaletteName])

  // Track whether user manually selected a chart type
  const [userManuallySelectedChart, setUserManuallySelectedChart] = useState(
    () => !!initialChartConfig?.chartType
  )

  // Chart availability based on metrics and breakdowns
  const chartAvailability = useMemo(
    () => getAllChartAvailability(allMetrics, allBreakdowns),
    [allMetrics, allBreakdowns]
  )

  // Helper to check if chart config is empty
  const isChartConfigEmpty = useCallback((config: ChartAxisConfig): boolean => {
    const keys: (keyof ChartAxisConfig)[] = ['xAxis', 'yAxis', 'series', 'sizeField', 'colorField', 'dateField', 'valueField']
    return keys.every(key => {
      const val = config[key]
      if (val === undefined || val === null) return true
      if (Array.isArray(val)) return val.length === 0
      if (typeof val === 'string') return val === ''
      return false
    })
  }, [])

  // Refs for smart chart defaulting
  const prevMetricsBreakdownsRef = useRef<string>('')
  const chartConfigRef = useRef<ChartAxisConfig>(chartConfig)

  // Keep chartConfigRef in sync
  chartConfigRef.current = chartConfig

  // Smart chart defaulting - auto-configure chart type and axes when debouncedQuery changes
  useEffect(() => {
    if (!debouncedQuery) return

    if (allMetrics.length === 0 && allBreakdowns.length === 0) {
      return // Nothing to configure
    }

    // Create a key from metrics/breakdowns fields to detect actual changes
    const currentKey = JSON.stringify({
      metrics: allMetrics.map(m => m.field),
      breakdowns: allBreakdowns.map(b => ({ field: b.field, isTime: b.isTimeDimension }))
    })

    // Skip if metrics/breakdowns haven't actually changed
    if (currentKey === prevMetricsBreakdownsRef.current) {
      return
    }
    prevMetricsBreakdownsRef.current = currentKey

    // Check if we should auto-switch chart type
    const newChartType = shouldAutoSwitchChartType(
      allMetrics,
      allBreakdowns,
      chartType,
      userManuallySelectedChart
    )

    if (newChartType) {
      // Chart type is changing - get smart defaults for the new chart type
      const { chartConfig: newChartConfig } = getSmartChartDefaults(
        allMetrics,
        allBreakdowns,
        newChartType
      )
      setChartType(newChartType)
      setChartConfig(newChartConfig)
      // Reset user selection flag since we auto-switched
      setUserManuallySelectedChart(false)
    } else if (allMetrics.length > 0 || allBreakdowns.length > 0) {
      // Only apply smart defaults if the chart config is COMPLETELY empty
      if (isChartConfigEmpty(chartConfigRef.current)) {
        const { chartConfig: smartDefaults } = getSmartChartDefaults(
          allMetrics,
          allBreakdowns,
          chartType
        )
        setChartConfig(smartDefaults)
      }
    }
  }, [debouncedQuery, allMetrics, allBreakdowns, chartType, userManuallySelectedChart, isChartConfigEmpty])

  return {
    chartType,
    setChartType,
    chartConfig,
    setChartConfig,
    displayConfig,
    setDisplayConfig,
    localPaletteName,
    setLocalPaletteName,
    effectiveColorPalette,
    userManuallySelectedChart,
    setUserManuallySelectedChart,
    chartAvailability,
    isChartConfigEmpty,
    prevMetricsBreakdownsRef,
    chartConfigRef
  }
}
