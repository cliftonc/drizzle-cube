/**
 * ChoroplethChart Component
 *
 * Renders a choropleth map — geographic regions colour-coded by a measure value.
 * Uses @nivo/geo for rendering.
 *
 * Geographic features (country/state boundaries) must be provided via:
 *   - displayConfig.geoFeatures — a JSON string of a GeoJSON Feature array, OR
 *   - displayConfig.geoFeaturesUrl — a URL that returns a GeoJSON FeatureCollection
 *     or Feature array
 *
 * The dimension field (xAxis) must contain values that match each feature's id
 * (or the property named in displayConfig.geoIdProperty).
 */

import React, { useMemo, useState, useEffect } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { ResponsiveChoropleth } from '@nivo/geo'
import type { ChartProps } from '../../types'

// ─── Feature helpers ──────────────────────────────────────────────────────────

type GeoFeature = Record<string, unknown>

/**
 * Parse a raw GeoJSON value into a Feature array.
 * Accepts: Feature array, FeatureCollection object, or raw JSON string of either.
 */
function parseFeatures(raw: unknown): GeoFeature[] | null {
  try {
    let parsed: unknown = raw
    if (typeof raw === 'string') {
      parsed = JSON.parse(raw)
    }
    if (!parsed || typeof parsed !== 'object') return null
    const obj = parsed as Record<string, unknown>
    // FeatureCollection
    if (obj.type === 'FeatureCollection' && Array.isArray(obj.features)) {
      return obj.features as GeoFeature[]
    }
    // Plain array of features
    if (Array.isArray(parsed)) {
      return parsed as GeoFeature[]
    }
    return null
  } catch {
    return null
  }
}

// ─── Data transform ───────────────────────────────────────────────────────────

interface ChartDatum {
  id: string
  value: number
}

/**
 * Transform flat drizzle-cube query rows into @nivo/geo data format.
 *
 * Input: [{ 'Sales.country': 'US', 'Sales.total': 1000 }, ...]
 * Output: [{ id: 'US', value: 1000 }, ...]
 */
function transformToGeoData(
  data: Record<string, unknown>[],
  regionField: string,
  valueField: string
): ChartDatum[] {
  return data
    .map((row) => {
      const id = row[regionField]
      const value = row[valueField]
      if (id == null || value == null) return null
      const numValue = Number(value)
      if (isNaN(numValue)) return null
      return { id: String(id), value: numValue }
    })
    .filter((d): d is ChartDatum => d !== null)
}

// ─── Component ────────────────────────────────────────────────────────────────

const ChoroplethChart = React.memo(function ChoroplethChart({
  data,
  height = '100%',
  chartConfig,
  colorPalette,
  displayConfig,
  onDataPointClick,
}: ChartProps) {
  const { t } = useTranslation()
  const displayConfigAny = displayConfig as Record<string, unknown> | undefined

  // Config values
  const geoFeaturesRaw = displayConfigAny?.geoFeatures as string | undefined
  const geoFeaturesUrl = displayConfigAny?.geoFeaturesUrl as string | undefined
  const geoProjection = (displayConfigAny?.geoProjection as string | undefined) ?? 'naturalEarth1'
  const geoIdProperty = displayConfigAny?.geoIdProperty as string | undefined
  const unknownColor = (displayConfigAny?.unknownColor as string | undefined) ?? '#cccccc'
  const showGraticule = (displayConfigAny?.showGraticule as boolean | undefined) ?? false
  const showLegend = (displayConfigAny?.showLegend as boolean | undefined) ?? true

  // Extract field names
  const regionField = chartConfig?.xAxis
    ? (Array.isArray(chartConfig.xAxis) ? chartConfig.xAxis[0] : chartConfig.xAxis)
    : undefined
  const valueField = chartConfig?.valueField
    ? (Array.isArray(chartConfig.valueField) ? chartConfig.valueField[0] : chartConfig.valueField)
    : undefined

  // URL-loaded features state
  const [urlFeatures, setUrlFeatures] = useState<GeoFeature[] | null>(null)
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState(false)

  useEffect(() => {
    if (!geoFeaturesUrl || geoFeaturesRaw) {
      setUrlFeatures(null)
      setUrlLoading(false)
      setUrlError(false)
      return
    }
    let cancelled = false
    setUrlLoading(true)
    setUrlError(false)
    fetch(geoFeaturesUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => {
        if (cancelled) return
        const parsed = parseFeatures(json)
        setUrlFeatures(parsed)
        setUrlLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setUrlError(true)
        setUrlLoading(false)
      })
    return () => { cancelled = true }
  }, [geoFeaturesUrl, geoFeaturesRaw])

  // Resolve features from inline config or URL
  const features = useMemo<GeoFeature[] | null>(() => {
    if (geoFeaturesRaw) return parseFeatures(geoFeaturesRaw)
    if (urlFeatures) return urlFeatures
    return null
  }, [geoFeaturesRaw, urlFeatures])

  // Transform query data
  const chartData = useMemo<ChartDatum[]>(() => {
    if (!data || data.length === 0 || !regionField || !valueField) return []
    return transformToGeoData(data as Record<string, unknown>[], regionField, valueField)
  }, [data, regionField, valueField])

  // Domain
  const domain = useMemo<[number, number]>(() => {
    if (chartData.length === 0) return [0, 100]
    const values = chartData.map((d) => d.value)
    return [Math.min(...values), Math.max(...values)]
  }, [chartData])

  // Color scale from palette gradient
  const colors = useMemo(() => {
    if (colorPalette?.gradient && colorPalette.gradient.length >= 2) {
      return colorPalette.gradient
    }
    return ['#e0f2fe', '#0369a1']
  }, [colorPalette])

  // ── Empty states ─────────────────────────────────────────────────────────────

  if (!data || data.length === 0) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted" style={{ height }}>
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.noData')}</div>
          <div className="dc:text-xs text-dc-text-secondary">{t('chart.runtime.noDataHint.choropleth')}</div>
        </div>
      </div>
    )
  }

  if (!regionField || !valueField) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted" style={{ height }}>
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.choroplethConfigRequired')}</div>
          <div className="dc:text-xs text-dc-text-secondary">
            {!regionField && <span>{t('chart.runtime.choroplethRegionRequired')} </span>}
            {!valueField && <span>{t('chart.runtime.choroplethValueRequired')}</span>}
          </div>
        </div>
      </div>
    )
  }

  if (urlLoading) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted" style={{ height }}>
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.choroplethFeaturesLoading')}</div>
        </div>
      </div>
    )
  }

  if (urlError) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted" style={{ height }}>
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.choroplethFeaturesLoadError')}</div>
          <div className="dc:text-xs text-dc-text-secondary">{t('chart.runtime.choroplethFeaturesLoadErrorHint')}</div>
        </div>
      </div>
    )
  }

  if (!features || features.length === 0) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted" style={{ height }}>
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.choroplethFeaturesRequired')}</div>
          <div className="dc:text-xs text-dc-text-secondary dc:max-w-xs dc:mx-auto dc:mt-1">{t('chart.runtime.choroplethFeaturesHint')}</div>
        </div>
      </div>
    )
  }

  // ── Chart ─────────────────────────────────────────────────────────────────────

  // Build a match function that respects geoIdProperty
  const matchFn = geoIdProperty
    ? (feature: GeoFeature, datum: ChartDatum) => {
        const props = feature.properties as Record<string, unknown> | undefined
        const featureId = props ? String(props[geoIdProperty] ?? '') : String(feature.id ?? '')
        return featureId === datum.id
      }
    : 'id'

  return (
    <div className="dc:relative dc:w-full dc:h-full" style={{ height }}>
      <ResponsiveChoropleth
        data={chartData}
        features={features}
        margin={{ top: 0, right: 0, bottom: showLegend ? 50 : 0, left: 0 }}
        domain={domain}
        match={matchFn as any}
        colors={colors as any}
        unknownColor={unknownColor}
        projectionType={geoProjection as any}
        projectionScale={160}
        projectionTranslation={[0.5, 0.5]}
        projectionRotation={[0, 0, 0]}
        enableGraticule={showGraticule}
        graticuleLineColor="rgba(0,0,0,0.2)"
        borderWidth={0.5}
        borderColor="var(--dc-surface)"
        isInteractive
        onClick={
          onDataPointClick
            ? (feature, event) => {
                const featureAny = feature as any
                const regionId = geoIdProperty
                  ? String(featureAny.data?.properties?.[geoIdProperty] ?? featureAny.id ?? '')
                  : String(featureAny.id ?? '')
                onDataPointClick({
                  dataPoint: { [regionField ?? 'id']: regionId, value: featureAny.value },
                  clickedField: regionField ?? 'id',
                  xValue: regionId,
                  position: { x: (event as any)?.clientX ?? 0, y: (event as any)?.clientY ?? 0 },
                  nativeEvent: event as any,
                })
              }
            : undefined
        }
        legends={
          showLegend
            ? [
                {
                  anchor: 'bottom-left',
                  direction: 'row',
                  justify: true,
                  translateX: 20,
                  translateY: -20,
                  itemsSpacing: 0,
                  itemWidth: 94,
                  itemHeight: 18,
                  itemDirection: 'left-to-right',
                  itemOpacity: 0.85,
                  symbolSize: 18,
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemTextColor: 'var(--dc-text)',
                        itemOpacity: 1,
                      },
                    },
                  ],
                },
              ]
            : []
        }
        theme={{
          text: { fill: 'var(--dc-text)' },
          tooltip: {
            container: {
              background: 'var(--dc-surface)',
              color: 'var(--dc-text)',
              borderRadius: '4px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
            },
          },
        }}
        tooltip={({ feature }) => {
          const featureAny = feature as any
          const featureId = geoIdProperty
            ? String(featureAny.data?.properties?.[geoIdProperty] ?? featureAny.id ?? '')
            : String(featureAny.id ?? '')
          const label = featureAny.label ?? featureId
          const value = featureAny.value
          return (
            <div
              className="dc:px-3 dc:py-2 dc:text-sm"
              style={{
                background: 'var(--dc-surface)',
                color: 'var(--dc-text)',
                borderRadius: 4,
                boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
              }}
            >
              <strong>{label}</strong>
              {value !== undefined && value !== null && (
                <span className="dc:ml-2">{typeof value === 'number' ? value.toLocaleString() : value}</span>
              )}
            </div>
          )
        }}
      />
    </div>
  )
})

export default ChoroplethChart
