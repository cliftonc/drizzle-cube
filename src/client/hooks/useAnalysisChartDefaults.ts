/**
 * useAnalysisChartDefaults
 *
 * Manages chart configuration, availability, and smart defaulting.
 * Handles color palette resolution and chart type auto-switching.
 *
 * Returns mode-appropriate chart config based on analysisType:
 * - Query mode: uses chartType, chartConfig, displayConfig
 * - Funnel mode: uses funnelChartType, funnelChartConfig, funnelDisplayConfig
 */

import { useMemo, useEffect, useRef, useCallback } from 'react'
import { useAnalysisBuilderStore, selectChartConfig } from '../stores/analysisBuilderStore'
import { useShallow } from 'zustand/react/shallow'
import { getAllChartAvailability, getSmartChartDefaults, shouldAutoSwitchChartType } from '../shared/chartDefaults'
import { getColorPalette, type ColorPalette } from '../utils/colorPalettes'
import { useCubeFeatures } from '../providers/CubeFeaturesProvider'
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

  // Get analysis type to determine which config to use
  const analysisType = useAnalysisBuilderStore((state) => state.analysisType)

  // Use the mode-aware selector to get the appropriate chart config
  const { chartType, chartConfig, displayConfig } = useAnalysisBuilderStore(useShallow(selectChartConfig))

  // Store state (shared)
  const userManuallySelectedChart = useAnalysisBuilderStore((state) => state.userManuallySelectedChart)
  const localPaletteName = useAnalysisBuilderStore((state) => state.localPaletteName)

  // Store actions - Query mode
  const setChartTypeManual = useAnalysisBuilderStore((state) => state.setChartTypeManual)
  const setQueryChartConfig = useAnalysisBuilderStore((state) => state.setChartConfig)
  const setQueryDisplayConfig = useAnalysisBuilderStore((state) => state.setDisplayConfig)

  // Store actions - Funnel mode
  const setFunnelChartType = useAnalysisBuilderStore((state) => state.setFunnelChartType)
  const setFunnelChartConfig = useAnalysisBuilderStore((state) => state.setFunnelChartConfig)
  const setFunnelDisplayConfig = useAnalysisBuilderStore((state) => state.setFunnelDisplayConfig)

  // Shared actions
  const setLocalPaletteName = useAnalysisBuilderStore((state) => state.setLocalPaletteName)
  const setUserManuallySelectedChart = useAnalysisBuilderStore((state) => state.setUserManuallySelectedChart)

  // Feature config — pass through to availability/defaults so chart configs can gate on
  // developer-level setup (e.g. choropleth needs features.choropleth.maps to be registered).
  const { features: cubeFeatures } = useCubeFeatures()

  // Mode-aware setters - route to appropriate store action based on analysis type
  const setChartType = useCallback(
    (type: ChartType) => {
      if (analysisType === 'funnel') {
        setFunnelChartType(type)
      } else {
        setChartTypeManual(type)
        const { chartConfig: smartConfig } = getSmartChartDefaults(
          combinedMetrics,
          combinedBreakdowns,
          type,
          cubeFeatures
        )
        setQueryChartConfig(smartConfig)
      }
    },
    [
      analysisType,
      combinedMetrics,
      combinedBreakdowns,
      cubeFeatures,
      setFunnelChartType,
      setChartTypeManual,
      setQueryChartConfig,
    ]
  )

  const setChartConfig = useCallback(
    (config: ChartAxisConfig) => {
      if (analysisType === 'funnel') {
        setFunnelChartConfig(config)
      } else {
        setQueryChartConfig(config)
      }
    },
    [analysisType, setFunnelChartConfig, setQueryChartConfig]
  )

  const setDisplayConfig = useCallback(
    (config: ChartDisplayConfig) => {
      if (analysisType === 'funnel') {
        setFunnelDisplayConfig(config)
      } else {
        setQueryDisplayConfig(config)
      }
    },
    [analysisType, setFunnelDisplayConfig, setQueryDisplayConfig]
  )

  // Chart availability — uses the cubeFeatures hoisted above so chart configs can
  // gate on developer-level setup (e.g. features.choropleth.maps registration).
  const chartAvailability = useMemo(
    () => getAllChartAvailability(combinedMetrics, combinedBreakdowns, cubeFeatures),
    [combinedMetrics, combinedBreakdowns, cubeFeatures]
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
      userManuallySelectedChart,
      cubeFeatures
    )

    if (newChartType) {
      const { chartConfig: newConfig } = getSmartChartDefaults(
        combinedMetrics,
        combinedBreakdowns,
        newChartType,
        cubeFeatures
      )
      setChartType(newChartType)
      setChartConfig(newConfig)
      setUserManuallySelectedChart(false)
    } else if (combinedMetrics.length > 0 || combinedBreakdowns.length > 0) {
      if (chartType === 'table') {
        // Table columns should reflect all selected fields — append any
        // missing ones to preserve existing column ordering.
        const allFields = [
          ...combinedBreakdowns.map((b) => b.field),
          ...combinedMetrics.map((m) => m.field),
        ]
        const currentXAxis = Array.isArray(chartConfig.xAxis) ? chartConfig.xAxis : []
        const missingFields = allFields.filter((f) => !currentXAxis.includes(f))
        if (missingFields.length > 0) {
          setChartConfig({
            ...chartConfig,
            xAxis: [...currentXAxis, ...missingFields],
          })
        }
      } else {
        // Apply smart defaults only if chart config is empty
        const isChartConfigEmpty =
          !chartConfig.xAxis?.length &&
          !chartConfig.yAxis?.length &&
          !chartConfig.series?.length
        if (isChartConfigEmpty) {
          const { chartConfig: smartDefaults } = getSmartChartDefaults(
            combinedMetrics,
            combinedBreakdowns,
            chartType,
            cubeFeatures
          )
          setChartConfig(smartDefaults)
        }
      }
    }
  }, [
    hasDebounced,
    combinedMetrics,
    combinedBreakdowns,
    chartType,
    userManuallySelectedChart,
    chartConfig,
    cubeFeatures,
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

    // Actions - mode-aware setters route to appropriate store fields
    setChartType,
    setChartConfig,
    setDisplayConfig,
    setLocalPaletteName,
  }
}
