/**
 * Tests for ChoroplethChart component.
 *
 * GeoJSON source (url / inline features / idProperty) is developer-level
 * configuration supplied via CubeFeaturesProvider's features.choropleth.maps.
 * End-user display config only stores `mapId` — a key into that map registry.
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ChoroplethChart from '../../../src/client/components/charts/ChoroplethChart'
import { CubeFeaturesProvider } from '../../../src/client/providers/CubeFeaturesProvider'
import type { FeaturesConfig } from '../../../src/client/types'

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

// Wrap with CubeFeaturesProvider for every render so the chart sees the
// developer-registered maps. Tests that need a specific map pass it via `features`.
function renderWithFeatures(ui: React.ReactElement, features: FeaturesConfig = {}) {
  return render(<CubeFeaturesProvider features={features}>{ui}</CubeFeaturesProvider>)
}

// Feature config with an inline-features map — exercises the inline JSON path.
const inlineMapFeatures: FeaturesConfig = {
  choropleth: {
    enabled: true,
    defaultMap: 'test',
    maps: {
      test: { label: 'Test Map', features: sampleGeoFeatures },
    },
  },
}

// Feature config with a URL-loaded map — exercises the async fetch path.
const urlMapFeatures: FeaturesConfig = {
  choropleth: {
    enabled: true,
    defaultMap: 'test',
    maps: {
      test: { label: 'Test Map', url: 'https://example.com/world.geojson' },
    },
  },
}

describe('ChoroplethChart', () => {
  describe('empty state', () => {
    it('renders no-data message when data is empty', () => {
      renderWithFeatures(
        <ChoroplethChart data={[]} chartConfig={sampleChartConfig} displayConfig={{}} />,
        inlineMapFeatures,
      )
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('renders no-data message when data is null', () => {
      renderWithFeatures(
        <ChoroplethChart
          data={null as unknown as unknown[]}
          chartConfig={sampleChartConfig}
          displayConfig={{}}
        />,
        inlineMapFeatures,
      )
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('config required state', () => {
    it('shows config required when region dimension is missing', () => {
      renderWithFeatures(
        <ChoroplethChart
          data={sampleData}
          chartConfig={{ valueField: ['Sales.total'] }}
          displayConfig={{}}
        />,
        inlineMapFeatures,
      )
      expect(screen.getByText('Configuration required')).toBeInTheDocument()
      expect(screen.getByText(/Region dimension required/)).toBeInTheDocument()
    })

    it('shows config required when value field is missing', () => {
      renderWithFeatures(
        <ChoroplethChart
          data={sampleData}
          chartConfig={{ xAxis: ['Sales.country'] }}
          displayConfig={{}}
        />,
        inlineMapFeatures,
      )
      expect(screen.getByText('Configuration required')).toBeInTheDocument()
      expect(screen.getByText(/Value measure required/)).toBeInTheDocument()
    })
  })

  describe('no map configured state', () => {
    it('shows "no map available" when features.choropleth is undefined', () => {
      renderWithFeatures(
        <ChoroplethChart data={sampleData} chartConfig={sampleChartConfig} displayConfig={{}} />,
        {},
      )
      expect(screen.getByText('No map available')).toBeInTheDocument()
    })

    it('shows "no map available" when the maps registry is empty', () => {
      renderWithFeatures(
        <ChoroplethChart data={sampleData} chartConfig={sampleChartConfig} displayConfig={{}} />,
        { choropleth: { enabled: true, maps: {} } },
      )
      expect(screen.getByText('No map available')).toBeInTheDocument()
    })
  })

  describe('rendering with data', () => {
    it('renders choropleth using inline features from feature config', () => {
      renderWithFeatures(
        <ChoroplethChart data={sampleData} chartConfig={sampleChartConfig} displayConfig={{}} />,
        inlineMapFeatures,
      )
      expect(screen.getByTestId('nivo-choropleth')).toBeInTheDocument()
      expect(screen.getByTestId('feature-count')).toHaveTextContent('3 features')
      expect(screen.getByTestId('data-count')).toHaveTextContent('3 data points')
    })

    it('renders choropleth when inline features are supplied as a FeatureCollection', () => {
      renderWithFeatures(
        <ChoroplethChart data={sampleData} chartConfig={sampleChartConfig} displayConfig={{}} />,
        {
          choropleth: {
            enabled: true,
            defaultMap: 'test',
            maps: { test: { label: 'Test Map', features: sampleGeoFeaturesCollection } },
          },
        },
      )
      expect(screen.getByTestId('nivo-choropleth')).toBeInTheDocument()
      expect(screen.getByTestId('feature-count')).toHaveTextContent('3 features')
    })

    it('renders correct data values from query results', () => {
      renderWithFeatures(
        <ChoroplethChart data={sampleData} chartConfig={sampleChartConfig} displayConfig={{}} />,
        inlineMapFeatures,
      )
      expect(screen.getByTestId('datum-US')).toHaveTextContent('US: 50000')
      expect(screen.getByTestId('datum-GB')).toHaveTextContent('GB: 30000')
      expect(screen.getByTestId('datum-DE')).toHaveTextContent('DE: 20000')
    })

    it('skips rows with null region or value', () => {
      const dataWithNulls = [
        { 'Sales.country': 'US', 'Sales.total': 50000 },
        { 'Sales.country': null, 'Sales.total': 10000 },
        { 'Sales.country': 'GB', 'Sales.total': null },
      ]
      renderWithFeatures(
        <ChoroplethChart data={dataWithNulls} chartConfig={sampleChartConfig} displayConfig={{}} />,
        inlineMapFeatures,
      )
      // Only US should be rendered (others have null region or value)
      expect(screen.getByTestId('data-count')).toHaveTextContent('1 data points')
    })

    it('uses defaultMap when displayConfig.mapId is omitted', () => {
      renderWithFeatures(
        <ChoroplethChart data={sampleData} chartConfig={sampleChartConfig} displayConfig={{}} />,
        {
          choropleth: {
            enabled: true,
            defaultMap: 'world',
            maps: {
              world: { label: 'World', features: sampleGeoFeatures },
              other: { label: 'Other', features: JSON.stringify([]) },
            },
          },
        },
      )
      // Should pick world map's 3 features, not other's 0
      expect(screen.getByTestId('feature-count')).toHaveTextContent('3 features')
    })

    it('honours displayConfig.mapId when it names a registered map', () => {
      renderWithFeatures(
        <ChoroplethChart
          data={sampleData}
          chartConfig={sampleChartConfig}
          displayConfig={{ mapId: 'other' }}
        />,
        {
          choropleth: {
            enabled: true,
            defaultMap: 'world',
            maps: {
              world: { label: 'World', features: sampleGeoFeatures },
              other: { label: 'Other', features: JSON.stringify([sampleFeatures[0]]) },
            },
          },
        },
      )
      // Should pick the `other` map (1 feature) — overrides the default
      expect(screen.getByTestId('feature-count')).toHaveTextContent('1 features')
    })

    it('falls back to defaultMap when displayConfig.mapId is unknown', () => {
      renderWithFeatures(
        <ChoroplethChart
          data={sampleData}
          chartConfig={sampleChartConfig}
          displayConfig={{ mapId: 'nonexistent' }}
        />,
        inlineMapFeatures,
      )
      // The default 'test' map has 3 features; unknown id should fall back to it
      expect(screen.getByTestId('feature-count')).toHaveTextContent('3 features')
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

      renderWithFeatures(
        <ChoroplethChart data={sampleData} chartConfig={sampleChartConfig} displayConfig={{}} />,
        urlMapFeatures,
      )

      expect(screen.getByText(/Loading map/)).toBeInTheDocument()

      // Resolve so React doesn't warn about state updates after unmount
      resolve(new Response(sampleGeoFeaturesCollection, { status: 200, headers: { 'Content-Type': 'application/json' } }))
    })

    it('shows error state when URL fetch fails', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'))

      renderWithFeatures(
        <ChoroplethChart data={sampleData} chartConfig={sampleChartConfig} displayConfig={{}} />,
        urlMapFeatures,
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to load map')).toBeInTheDocument()
      })
    })

    it('renders chart after successful URL fetch', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => JSON.parse(sampleGeoFeaturesCollection),
      })

      renderWithFeatures(
        <ChoroplethChart data={sampleData} chartConfig={sampleChartConfig} displayConfig={{}} />,
        urlMapFeatures,
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

      renderWithFeatures(
        <ChoroplethChart data={sampleData} chartConfig={sampleChartConfig} displayConfig={{}} />,
        urlMapFeatures,
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to load map')).toBeInTheDocument()
      })
    })

    it('inline features on the map dataset take priority over url', () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => [] })

      renderWithFeatures(
        <ChoroplethChart data={sampleData} chartConfig={sampleChartConfig} displayConfig={{}} />,
        {
          choropleth: {
            enabled: true,
            defaultMap: 'test',
            maps: {
              test: {
                label: 'Test Map',
                features: sampleGeoFeatures,
                url: 'https://example.com/world.geojson',
              },
            },
          },
        },
      )

      // Should render immediately with inline data, not wait for URL
      expect(screen.getByTestId('nivo-choropleth')).toBeInTheDocument()
      // Fetch should not have been called
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })
})
