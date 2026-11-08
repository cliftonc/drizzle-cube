import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import HeatMapChart from '../../../src/client/components/charts/HeatMapChart'

// @nivo/heatmap is an optional peer. Loading it fails as it does in an app
// without it: the chart shows the install hint instead of crashing (#1422).
vi.mock('@nivo/heatmap', () => {
  throw new Error('Cannot find module @nivo/heatmap')
})

const data = [
  { 'Sales.region': 'East', 'Sales.product': 'A', 'Sales.revenue': 10 },
  { 'Sales.region': 'West', 'Sales.product': 'B', 'Sales.revenue': 20 }
]
const chartConfig = { xAxis: ['Sales.product'], yAxis: ['Sales.region'], valueField: ['Sales.revenue'] }

describe('HeatMapChart without @nivo/heatmap', () => {
  it('shows the missing-dependency fallback with the install command', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<HeatMapChart data={data} chartConfig={chartConfig} />)
    expect(await screen.findByText('npm install @nivo/heatmap')).toBeInTheDocument()
  })
})
