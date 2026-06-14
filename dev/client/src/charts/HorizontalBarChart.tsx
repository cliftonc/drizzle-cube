/**
 * Example Custom Chart Plugin: Horizontal Bar Chart
 *
 * A simple CSS-based horizontal bar chart with no external dependencies.
 * Demonstrates how to build a custom chart that integrates with drizzle-cube's
 * chart plugin system, including:
 * - Reading from chartConfig (xAxis/yAxis field mapping)
 * - Reading from displayConfig (visual options)
 * - Handling empty data
 * - Using the colorPalette
 */

import React, { useMemo } from 'react'
import type { ChartProps } from '@drizzle-cube/client'
import {
  HorizontalBarMessage,
  HorizontalBarList,
  parseBarItems,
  resolveBarFields,
  resolveBarPlaceholder,
  resolveBarDisplay,
} from './horizontalBarChartHelpers'

const HorizontalBarChart = React.memo(function HorizontalBarChart({
  data,
  chartConfig,
  displayConfig = {},
  height = '100%',
  colorPalette,
}: ChartProps) {
  const { categoryField, valueField } = resolveBarFields(chartConfig)

  const { items, maxValue } = useMemo(
    () => parseBarItems(data, categoryField, valueField),
    [data, categoryField, valueField]
  )

  const placeholder = resolveBarPlaceholder(Boolean(data && data.length > 0), categoryField, valueField)
  if (placeholder) {
    return <HorizontalBarMessage height={height}>{placeholder}</HorizontalBarMessage>
  }

  const { colors, showGrid, showValues } = resolveBarDisplay(displayConfig, colorPalette)

  return (
    <HorizontalBarList
      items={items}
      maxValue={maxValue}
      height={height}
      colors={colors}
      showGrid={showGrid}
      showValues={showValues}
    />
  )
})

export default HorizontalBarChart
