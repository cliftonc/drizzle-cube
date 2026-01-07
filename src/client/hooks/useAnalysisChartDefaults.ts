/**
 * useAnalysisChartDefaults
 *
 * Manages chart configuration, availability, and smart defaulting.
 * Handles color palette resolution and chart type auto-switching.
 */

import { useMemo, useEffect, useRef } from 'react'
import { useAnalysisBuilderStore } from '../stores/analysisBuilderStore'
import { getAllChartAvailability, getSmartChartDefaults, shouldAutoSwitchChartType } from '../shared/chartDefaults'
import { getColorPalette, type ColorPalette } from '../utils/colorPalettes'
import type { ChartType, ChartAxisConfig, ChartDisplayConfig } from '../types'
import type { MetricItem, BreakdownItem } from '../components/AnalysisBuilder/types'
import type { ChartAvailabilityMap } from '../shared/chartDefaults'

export interface UseAnalysisChartDefaultsOptions {
  /** External color palette (overrides local) */
  externalColorPalette?: string[] | ColorPalette
  /** Combined metrics from all queries */
  combinedMetrics: MetricItem[]
  /** Combined breakdowns from all queries */
  combinedBreakdowns: BreakdownItem[]
  /** Whether query has been debounced (triggers smart defaults) */
  hasDebounced: boolean
}

export interface UseAnalysisChartDefaultsResult {
  /** Current chart type */
  chartType: ChartType
  /** Chart axis configuration */
  chartConfig: ChartAxisConfig
  /** Chart display configuration */
  displayConfig: ChartDisplayConfig
  /** Effective color palette */
  colorPalette: ColorPalette
  /** Local palette name (when not using external) */
  localPaletteName: string
  /** Chart availability map */
  chartAvailability: ChartAvailabilityMap
  /** User manually selected chart */
  userManuallySelectedChart: boolean

  // Actions
  setChartType: (type: ChartType) => void
  setChartConfig: (config: ChartAxisConfig) => void
  setDisplayConfig: (config: ChartDisplayConfig) => void
  setLocalPaletteName: (name: string) => void
}

export function useAnalysisChartDefaults(
  options: UseAnalysisChartDefaultsOptions
): UseAnalysisChartDefaultsResult {
  const { externalColorPalette, combinedMetrics, combinedBreakdowns, hasDebounced } = options

  // Store state
  const chartType = useAnalysisBuilderStore((state) => state.chartType)
  const chartConfig = useAnalysisBuilderStore((state) => state.chartConfig)
  const displayConfig = useAnalysisBuilderStore((state) => state.displayConfig)
  const userManuallySelectedChart = useAnalysisBuilderStore((state) => state.userManuallySelectedChart)
  const localPaletteName = useAnalysisBuilderStore((state) => state.localPaletteName)

  // Store actions
  const setChartType = useAnalysisBuilderStore((state) => state.setChartType)
  const setChartTypeManual = useAnalysisBuilderStore((state) => state.setChartTypeManual)
  const setChartConfig = useAnalysisBuilderStore((state) => state.setChartConfig)
  const setDisplayConfig = useAnalysisBuilderStore((state) => state.setDisplayConfig)
  const setLocalPaletteName = useAnalysisBuilderStore((state) => state.setLocalPaletteName)
  const setUserManuallySelectedChart = useAnalysisBuilderStore((state) => state.setUserManuallySelectedChart)

  // Chart availability
  const chartAvailability = useMemo(
    () => getAllChartAvailability(combinedMetrics, combinedBreakdowns),
    [combinedMetrics, combinedBreakdowns]
  )

  // Effective color palette
  const colorPalette = useMemo((): ColorPalette => {
    if (externalColorPalette) {
      if (Array.isArray(externalColorPalette) && typeof externalColorPalette[0] === 'string') {
        return {
          name: 'custom',
          label: 'Custom',
          colors: externalColorPalette as string[],
          gradient: externalColorPalette as string[],
        }
      }
      return externalColorPalette as ColorPalette
    }
    return getColorPalette(localPaletteName)
  }, [externalColorPalette, localPaletteName])

  // Smart chart defaulting
  const prevMetricsBreakdownsRef = useRef<string>('')

  useEffect(() => {
    if (!hasDebounced) return
    if (combinedMetrics.length === 0 && combinedBreakdowns.length === 0) return

    const currentKey = JSON.stringify({
      metrics: combinedMetrics.map((m) => m.field),
      breakdowns: combinedBreakdowns.map((b) => ({ field: b.field, isTime: b.isTimeDimension })),
    })

    if (currentKey === prevMetricsBreakdownsRef.current) return
    prevMetricsBreakdownsRef.current = currentKey

    const newChartType = shouldAutoSwitchChartType(
      combinedMetrics,
      combinedBreakdowns,
      chartType,
      userManuallySelectedChart
    )

    if (newChartType) {
      const { chartConfig: newConfig } = getSmartChartDefaults(
        combinedMetrics,
        combinedBreakdowns,
        newChartType
      )
      setChartType(newChartType)
      setChartConfig(newConfig)
      setUserManuallySelectedChart(false)
    } else if (combinedMetrics.length > 0 || combinedBreakdowns.length > 0) {
      // Apply smart defaults only if chart config is empty
      const isChartConfigEmpty =
        !chartConfig.xAxis?.length &&
        !chartConfig.yAxis?.length &&
        !chartConfig.series?.length
      if (isChartConfigEmpty) {
        const { chartConfig: smartDefaults } = getSmartChartDefaults(
          combinedMetrics,
          combinedBreakdowns,
          chartType
        )
        setChartConfig(smartDefaults)
      }
    }
  }, [
    hasDebounced,
    combinedMetrics,
    combinedBreakdowns,
    chartType,
    userManuallySelectedChart,
    chartConfig,
    setChartType,
    setChartConfig,
    setUserManuallySelectedChart,
  ])

  return {
    chartType,
    chartConfig,
    displayConfig,
    colorPalette,
    localPaletteName,
    chartAvailability,
    userManuallySelectedChart,

    // Actions - use manual setter for user interactions
    setChartType: setChartTypeManual,
    setChartConfig,
    setDisplayConfig,
    setLocalPaletteName,
  }
}
