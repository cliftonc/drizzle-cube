/**
 * Tests for ChoroplethChart component
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ChoroplethChart from '../../../src/client/components/charts/ChoroplethChart'

// Mock @nivo/geo to avoid canvas/WebGL issues in tests
vi.mock('@nivo/geo', () => ({
  ResponsiveChoropleth: ({
    data,
    features,
  }: {
    data: { id: string; value: number }[]
    features: unknown[]
  }) => (
    <div data-testid="nivo-choropleth">
      <div data-testid="feature-count">{features.length} features</div>
      <div data-testid="data-count">{data.length} data points</div>
      {data.map((d) => (
        <div key={d.id} data-testid={`datum-${d.id}`}>
          {d.id}: {d.value}
        </div>
      ))}
    </div>
  ),
}))

// Mock the icon system
vi.mock('../../../src/client/icons', () => ({
  getIcon: () => null,
}))

// Sample GeoJSON features
const sampleFeatures = [
  { type: 'Feature', id: 'US', properties: { name: 'United States' }, geometry: { type: 'Polygon', coordinates: [] } },
  { type: 'Feature', id: 'GB', properties: { name: 'United Kingdom' }, geometry: { type: 'Polygon', coordinates: [] } },
  { type: 'Feature', id: 'DE', properties: { name: 'Germany' }, geometry: { type: 'Polygon', coordinates: [] } },
]

const sampleGeoFeatures = JSON.stringify(sampleFeatures)

const sampleGeoFeaturesCollection = JSON.stringify({
  type: 'FeatureCollection',
  features: sampleFeatures,
})

// Sample query data
const sampleData = [
  { 'Sales.country': 'US', 'Sales.total': 50000 },
  { 'Sales.country': 'GB', 'Sales.total': 30000 },
  { 'Sales.country': 'DE', 'Sales.total': 20000 },
]

const sampleChartConfig = {
  xAxis: ['Sales.country'],
  valueField: ['Sales.total'],
}

describe('ChoroplethChart', () => {
  describe('empty state', () => {
    it('renders no-data message when data is empty', () => {
      render(
        <ChoroplethChart
          data={[]}
          chartConfig={sampleChartConfig}
          displayConfig={{ geoFeatures: sampleGeoFeatures }}
        />
      )
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('renders no-data message when data is null', () => {
      render(
        <ChoroplethChart
          data={null as unknown as unknown[]}
          chartConfig={sampleChartConfig}
          displayConfig={{ geoFeatures: sampleGeoFeatures }}
        />
      )
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('config required state', () => {
    it('shows config required when region dimension is missing', () => {
      render(
        <ChoroplethChart
          data={sampleData}
          chartConfig={{ valueField: ['Sales.total'] }}
          displayConfig={{ geoFeatures: sampleGeoFeatures }}
        />
      )
      expect(screen.getByText('Configuration required')).toBeInTheDocument()
      expect(screen.getByText(/Region dimension required/)).toBeInTheDocument()
    })

    it('shows config required when value field is missing', () => {
      render(
        <ChoroplethChart
          data={sampleData}
          chartConfig={{ xAxis: ['Sales.country'] }}
          displayConfig={{ geoFeatures: sampleGeoFeatures }}
        />
      )
      expect(screen.getByText('Configuration required')).toBeInTheDocument()
      expect(screen.getByText(/Value measure required/)).toBeInTheDocument()
    })
  })

  describe('features required state', () => {
    it('shows features required when no geoFeatures or geoFeaturesUrl provided', () => {
      render(
        <ChoroplethChart
          data={sampleData}
          chartConfig={sampleChartConfig}
        />
      )
      expect(screen.getByText('Geographic data required')).toBeInTheDocument()
    })

    it('shows features required when geoFeatures is an empty string', () => {
      render(
        <ChoroplethChart
          data={sampleData}
          chartConfig={sampleChartConfig}
          displayConfig={{ geoFeatures: '' }}
        />
      )
      expect(screen.getByText('Geographic data required')).toBeInTheDocument()
    })
  })

  describe('rendering with data', () => {
    it('renders choropleth with inline JSON feature array', () => {
      render(
        <ChoroplethChart
          data={sampleData}
          chartConfig={sampleChartConfig}
          displayConfig={{ geoFeatures: sampleGeoFeatures }}
        />
      )
      expect(screen.getByTestId('nivo-choropleth')).toBeInTheDocument()
      expect(screen.getByTestId('feature-count')).toHaveTextContent('3 features')
      expect(screen.getByTestId('data-count')).toHaveTextContent('3 data points')
    })

    it('renders choropleth with FeatureCollection JSON', () => {
      render(
        <ChoroplethChart
          data={sampleData}
          chartConfig={sampleChartConfig}
          displayConfig={{ geoFeatures: sampleGeoFeaturesCollection }}
        />
      )
      expect(screen.getByTestId('nivo-choropleth')).toBeInTheDocument()
      expect(screen.getByTestId('feature-count')).toHaveTextContent('3 features')
    })

    it('renders correct data values from query results', () => {
      render(
        <ChoroplethChart
          data={sampleData}
          chartConfig={sampleChartConfig}
          displayConfig={{ geoFeatures: sampleGeoFeatures }}
        />
      )
      expect(screen.getByTestId('datum-US')).toHaveTextContent('US: 50000')
      expect(screen.getByTestId('datum-GB')).toHaveTextContent('GB: 30000')
      expect(screen.getByTestId('datum-DE')).toHaveTextContent('DE: 20000')
    })

    it('uses array format for xAxis', () => {
      render(
        <ChoroplethChart
          data={sampleData}
          chartConfig={{ xAxis: ['Sales.country'], valueField: ['Sales.total'] }}
          displayConfig={{ geoFeatures: sampleGeoFeatures }}
        />
      )
      expect(screen.getByTestId('nivo-choropleth')).toBeInTheDocument()
      expect(screen.getByTestId('datum-US')).toBeInTheDocument()
    })

    it('skips rows with null region or value', () => {
      const dataWithNulls = [
        { 'Sales.country': 'US', 'Sales.total': 50000 },
        { 'Sales.country': null, 'Sales.total': 10000 },
        { 'Sales.country': 'GB', 'Sales.total': null },
      ]
      render(
        <ChoroplethChart
          data={dataWithNulls}
          chartConfig={sampleChartConfig}
          displayConfig={{ geoFeatures: sampleGeoFeatures }}
        />
      )
      // Only US should be rendered (others have null region or value)
      expect(screen.getByTestId('data-count')).toHaveTextContent('1 data points')
    })
  })

  describe('URL loading', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn())
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('shows loading state while fetching from URL', async () => {
      let resolve: (value: Response) => void = () => {}
      const pending = new Promise<Response>((res) => { resolve = res })
      ;(global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(pending)

      render(
        <ChoroplethChart
          data={sampleData}
          chartConfig={sampleChartConfig}
          displayConfig={{ geoFeaturesUrl: 'https://example.com/world.geojson' }}
        />
      )

      expect(screen.getByText(/Loading geographic data/)).toBeInTheDocument()

      // Resolve so React doesn't warn about state updates after unmount
      resolve(new Response(sampleGeoFeaturesCollection, { status: 200, headers: { 'Content-Type': 'application/json' } }))
    })

    it('shows error state when URL fetch fails', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'))

      render(
        <ChoroplethChart
          data={sampleData}
          chartConfig={sampleChartConfig}
          displayConfig={{ geoFeaturesUrl: 'https://example.com/world.geojson' }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to load geographic data')).toBeInTheDocument()
      })
    })

    it('renders chart after successful URL fetch', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => JSON.parse(sampleGeoFeaturesCollection),
      })

      render(
        <ChoroplethChart
          data={sampleData}
          chartConfig={sampleChartConfig}
          displayConfig={{ geoFeaturesUrl: 'https://example.com/world.geojson' }}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('nivo-choropleth')).toBeInTheDocument()
      })
      expect(screen.getByTestId('feature-count')).toHaveTextContent('3 features')
    })

    it('shows error state when URL returns non-ok response', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 404,
      })

      render(
        <ChoroplethChart
          data={sampleData}
          chartConfig={sampleChartConfig}
          displayConfig={{ geoFeaturesUrl: 'https://example.com/world.geojson' }}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to load geographic data')).toBeInTheDocument()
      })
    })

    it('inline geoFeatures takes priority over geoFeaturesUrl', () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => [] })

      render(
        <ChoroplethChart
          data={sampleData}
          chartConfig={sampleChartConfig}
          displayConfig={{
            geoFeatures: sampleGeoFeatures,
            geoFeaturesUrl: 'https://example.com/world.geojson',
          }}
        />
      )

      // Should render immediately with inline data, not wait for URL
      expect(screen.getByTestId('nivo-choropleth')).toBeInTheDocument()
      // Fetch should not have been called
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })
})
