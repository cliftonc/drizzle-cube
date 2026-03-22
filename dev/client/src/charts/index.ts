/**
 * Custom chart definitions for the dev site.
 *
 * Demonstrates the chart plugin system by registering a custom
 * Horizontal Bar chart alongside the built-in chart types.
 */

import type { ChartDefinition } from '@drizzle-cube/client'
import HorizontalBarChart from './HorizontalBarChart'
import { horizontalBarConfig } from './HorizontalBarChart.config'

export const customCharts: ChartDefinition[] = [
  {
    type: 'horizontalBar',
    label: 'Horizontal Bar',
    config: horizontalBarConfig,
    component: HorizontalBarChart,
  },
]
