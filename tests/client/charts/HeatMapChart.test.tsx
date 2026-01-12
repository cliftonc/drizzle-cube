/**
 * Tests for HeatMapChart component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import HeatMapChart from '../../../src/client/components/charts/HeatMapChart'

// Mock the icon system
vi.mock('../../../src/client/icons', () => ({
  getIcon: () => null,
}))

// Mock nivo heatmap to avoid canvas issues in tests
vi.mock('@nivo/heatmap', () => ({
  ResponsiveHeatMap: ({ data }: { data: unknown[] }) => (
    <div data-testid="nivo-heatmap">
      {data.map((row: any, i: number) => (
        <div key={i} data-testid={`heatmap-row-${row.id}`}>
          {row.id}: {row.data.length} cells
        </div>
      ))}
    </div>
  ),
}))

// Sample heatmap data (drizzle-cube format)
const sampleData = [
  { 'Region.name': 'East', 'Product.category': 'Electronics', 'Sales.total': 1500 },
  { 'Region.name': 'East', 'Product.category': 'Clothing', 'Sales.total': 800 },
  { 'Region.name': 'West', 'Product.category': 'Electronics', 'Sales.total': 2100 },
  { 'Region.name': 'West', 'Product.category': 'Clothing', 'Sales.total': 950 },
]

const sampleChartConfig = {
  xAxis: ['Product.category'],
  yAxis: ['Region.name'],
  valueField: ['Sales.total'],
}

describe('HeatMapChart', () => {
  describe('empty state', () => {
    it('should render empty state message when data is null', () => {
      render(<HeatMapChart data={null as unknown as unknown[]} />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should render empty state message when data is empty array', () => {
      render(<HeatMapChart data={[]} />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should render empty state message when data is undefined', () => {
      render(<HeatMapChart data={undefined as unknown as unknown[]} />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('configuration required state', () => {
    it('should show config required when xAxis is missing', () => {
      render(
        <HeatMapChart
          data={sampleData}
          chartConfig={{ yAxis: ['Region.name'], valueField: ['Sales.total'] }}
        />
      )
      expect(screen.getByText('Configuration required')).toBeInTheDocument()
      expect(screen.getByText(/X-axis dimension required/)).toBeInTheDocument()
    })

    it('should show config required when yAxis is missing', () => {
      render(
        <HeatMapChart
          data={sampleData}
          chartConfig={{ xAxis: ['Product.category'], valueField: ['Sales.total'] }}
        />
      )
      expect(screen.getByText('Configuration required')).toBeInTheDocument()
      expect(screen.getByText(/Y-axis dimension required/)).toBeInTheDocument()
    })

    it('should show config required when valueField is missing', () => {
      render(
        <HeatMapChart
          data={sampleData}
          chartConfig={{ xAxis: ['Product.category'], yAxis: ['Region.name'] }}
        />
      )
      expect(screen.getByText('Configuration required')).toBeInTheDocument()
      expect(screen.getByText(/Value measure required/)).toBeInTheDocument()
    })
  })

  describe('rendering with valid config', () => {
    it('should render heatmap with valid data and config', () => {
      render(
        <HeatMapChart
          data={sampleData}
          chartConfig={sampleChartConfig}
        />
      )
      expect(screen.getByTestId('nivo-heatmap')).toBeInTheDocument()
    })

    it('should transform data correctly - creates rows for each Y value', () => {
      render(
        <HeatMapChart
          data={sampleData}
          chartConfig={sampleChartConfig}
        />
      )
      expect(screen.getByTestId('heatmap-row-East')).toBeInTheDocument()
      expect(screen.getByTestId('heatmap-row-West')).toBeInTheDocument()
    })
  })

  describe('data transformation', () => {
    it('should handle sparse matrices', () => {
      const sparseData = [
        { 'Region.name': 'East', 'Product.category': 'Electronics', 'Sales.total': 1500 },
        { 'Region.name': 'West', 'Product.category': 'Clothing', 'Sales.total': 950 },
      ]
      render(
        <HeatMapChart
          data={sparseData}
          chartConfig={sampleChartConfig}
        />
      )
      expect(screen.getByTestId('nivo-heatmap')).toBeInTheDocument()
    })

    it('should coerce string measure values to numbers', () => {
      const stringValueData = [
        { 'Region.name': 'East', 'Product.category': 'Electronics', 'Sales.total': '1500' },
      ]
      render(
        <HeatMapChart
          data={stringValueData}
          chartConfig={sampleChartConfig}
        />
      )
      expect(screen.getByTestId('nivo-heatmap')).toBeInTheDocument()
    })

    it('should handle null dimension values by showing (empty)', () => {
      const nullData = [
        { 'Region.name': null, 'Product.category': 'Electronics', 'Sales.total': 1500 },
        { 'Region.name': 'East', 'Product.category': 'Electronics', 'Sales.total': 800 },
      ]
      render(
        <HeatMapChart
          data={nullData}
          chartConfig={sampleChartConfig}
        />
      )
      // Should have (empty) row for null values
      expect(screen.getByTestId('heatmap-row-(empty)')).toBeInTheDocument()
      expect(screen.getByTestId('heatmap-row-East')).toBeInTheDocument()
    })
  })

  describe('height prop', () => {
    it('should apply custom height', () => {
      const { container } = render(
        <HeatMapChart
          data={sampleData}
          chartConfig={sampleChartConfig}
          height="500px"
        />
      )
      const chartContainer = container.firstChild
      expect(chartContainer).toHaveStyle({ height: '500px' })
    })

    it('should use 100% height by default', () => {
      const { container } = render(
        <HeatMapChart
          data={sampleData}
          chartConfig={sampleChartConfig}
        />
      )
      const chartContainer = container.firstChild
      expect(chartContainer).toHaveStyle({ height: '100%' })
    })
  })
})
