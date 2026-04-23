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

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { ResponsiveChoropleth } from '@nivo/geo'
import {
  geoNaturalEarth1,
  geoMercator,
  geoEqualEarth,
  geoEquirectangular,
  type GeoProjection,
} from 'd3-geo'
import type { ChartProps } from '../../types'
import { formatAxisValue } from '../../utils/chartUtils'
import { useCubeFeatures } from '../../providers/CubeFeaturesProvider'

// d3-geo projection constructors keyed by nivo's projection-type strings.
// Used to compute fit-to-bounds scale/translation from the actual feature
// collection, which handles region-specific maps (e.g. US states) that
// would otherwise render tiny inside a world-sized sphere projection.
const PROJECTION_CTORS: Record<string, () => GeoProjection> = {
  naturalEarth1: geoNaturalEarth1,
  mercator: geoMercator,
  equalEarth: geoEqualEarth,
  equirectangular: geoEquirectangular,
}

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
  const { features: cubeFeatures } = useCubeFeatures()
  const displayConfigAny = displayConfig as Record<string, unknown> | undefined

  // User-editable display options (via portlet config)
  const geoProjection = (displayConfigAny?.geoProjection as string | undefined) ?? 'naturalEarth1'
  const showGraticule = (displayConfigAny?.showGraticule as boolean | undefined) ?? false
  const showLegend = (displayConfigAny?.showLegend as boolean | undefined) ?? true

  // Resolve the map dataset from developer-level feature config.
  // End users only pick by id; URLs / GeoJSON / idProperty are set by the app.
  const choroplethFeature = cubeFeatures.choropleth
  const availableMaps = choroplethFeature?.maps ?? {}
  const requestedMapId = displayConfigAny?.mapId as string | undefined
  const mapId =
    (requestedMapId && availableMaps[requestedMapId] ? requestedMapId : undefined) ??
    choroplethFeature?.defaultMap ??
    Object.keys(availableMaps)[0]
  const mapDataset = mapId ? availableMaps[mapId] : undefined
  const geoFeaturesRaw = mapDataset?.features
  const geoFeaturesUrl = mapDataset?.url
  const geoIdProperty = mapDataset?.idProperty

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

  // Track container size so the projection can fit the actual portlet
  // dimensions. We use a callback ref so the ResizeObserver attaches the
  // moment the wrapper div mounts — the chart renders empty states
  // (loading/missing-features) before the real map wrapper exists, so a
  // traditional useRef + useEffect on mount would miss the element.
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const observerRef = React.useRef<ResizeObserver | null>(null)
  const mapContainerRef = useCallback((el: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
    if (!el) {
      setContainerSize({ w: 0, h: 0 })
      return
    }
    // Seed synchronously from the element's current box — RO only fires on
    // the next change, so without this the first render sees 0×0.
    const rect = el.getBoundingClientRect()
    setContainerSize({ w: rect.width, h: rect.height })
    const ro = new ResizeObserver(([entry]) => {
      setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    ro.observe(el)
    observerRef.current = ro
  }, [])
  useEffect(() => () => observerRef.current?.disconnect(), [])

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

  // Domain — use reduce to avoid call-stack limits on large datasets
  const domain = useMemo<[number, number]>(() => {
    if (chartData.length === 0) return [0, 100]
    let min = chartData[0].value
    let max = chartData[0].value
    for (const d of chartData) {
      if (d.value < min) min = d.value
      if (d.value > max) max = d.value
    }
    return [min, max]
  }, [chartData])

  // Color scale from palette gradient
  const colors = useMemo(() => {
    if (colorPalette?.gradient && colorPalette.gradient.length >= 2) {
      return colorPalette.gradient
    }
    return ['#e0f2fe', '#0369a1']
  }, [colorPalette])

  // Fit the projection to the actual feature bounds + container size. Region-
  // specific maps (e.g. US states) would otherwise render tiny as a small patch
  // of a sphere-sized projection. We compute the projected cartesian bounds at
  // scale=1/translate=[0,0] via geoPath, then derive the scale that fits those
  // bounds into the container and the translation that centers them. This is
  // more robust than projection.fitSize() for GeoJSON with longitudes outside
  // [-180, 180] (Alaska in some US datasets), which can confuse d3's
  // spherical-bounds calculation.
  // Returned values match what nivo expects: absolute `scale` plus
  // `[tx/w, ty/h]` translation ratios that it multiplies by its inner width/
  // height (outer minus margin — we account for the 4px margin below).
  // Compute projectionScale and projectionTranslation from the actual feature
  // bounds so region-specific maps (e.g. US states) fill the portlet instead
  // of rendering as a tiny patch of a sphere-sized projection. We deliberately
  // walk coordinates manually through a unit-scale projection rather than use
  // `d3.geoPath(projection).bounds()` — the latter runs through d3's stream
  // with antimeridian clipping and polar-cutting, which can inflate bounds to
  // the full sphere whenever geometry touches a discontinuity.
  const { projectionScale, projectionTranslation } = useMemo<{
    projectionScale: number
    projectionTranslation: [number, number]
  }>(() => {
    const defaults = {
      projectionScale: 160,
      projectionTranslation: [0.5, 0.5] as [number, number],
    }
    if (!features || features.length === 0) return defaults
    if (containerSize.w === 0 || containerSize.h === 0) return defaults
    const ctor = PROJECTION_CTORS[geoProjection] ?? PROJECTION_CTORS.naturalEarth1
    const project = ctor().scale(1).translate([0, 0]).rotate([0, 0, 0])
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    let pointCount = 0
    const visitPoint = (lon: number, lat: number) => {
      const p = project([lon, lat])
      if (!p) return
      const [x, y] = p
      if (!isFinite(x) || !isFinite(y)) return
      if (x < x0) x0 = x; if (x > x1) x1 = x
      if (y < y0) y0 = y; if (y > y1) y1 = y
      pointCount++
    }
    const visitCoords = (coords: any) => {
      if (typeof coords?.[0] === 'number') {
        visitPoint(coords[0], coords[1])
      } else if (Array.isArray(coords)) {
        for (const c of coords) visitCoords(c)
      }
    }
    for (const f of features) {
      const geom = (f as any).geometry
      if (geom?.coordinates) visitCoords(geom.coordinates)
    }
    const projectedW = x1 - x0
    const projectedH = y1 - y0
    if (pointCount === 0 || !isFinite(projectedW) || !isFinite(projectedH) || projectedW <= 0 || projectedH <= 0) {
      return defaults
    }
    // Nivo's inner dimensions = container outer minus our 4px margin on each side.
    const innerW = Math.max(1, containerSize.w - 8)
    const innerH = Math.max(1, containerSize.h - 8)
    // Fit within 95% of inner dims so the map breathes inside the portlet.
    const scale = Math.min((innerW * 0.95) / projectedW, (innerH * 0.95) / projectedH)
    // Center the projected bounds within inner dimensions.
    const tx = innerW / 2 - ((x0 + x1) / 2) * scale
    const ty = innerH / 2 - ((y0 + y1) / 2) * scale
    return {
      projectionScale: scale,
      projectionTranslation: [tx / innerW, ty / innerH],
    }
  }, [features, containerSize, geoProjection])

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

  const gradientCss = `linear-gradient(to right, ${colors.join(', ')})`
  const minLabel = formatAxisValue(domain[0])
  const maxLabel = formatAxisValue(domain[1])

  return (
    <div className="dc:relative dc:w-full dc:h-full dc:flex dc:flex-col dc:p-2" style={{ height }}>
      <div ref={mapContainerRef} className="dc:flex-1 dc:min-h-0">
        <ResponsiveChoropleth
          data={chartData}
          features={features}
          margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
          domain={domain}
          match={matchFn as any}
          colors={colors as any}
          unknownColor="var(--dc-surface-tertiary)"
          projectionType={geoProjection as any}
          projectionScale={projectionScale}
          projectionTranslation={projectionTranslation}
          projectionRotation={[0, 0, 0]}
          enableGraticule={showGraticule}
          graticuleLineColor="rgba(0,0,0,0.2)"
          borderWidth={0.75}
          borderColor="var(--dc-border-secondary)"
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
          legends={[]}
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
                  <span className="dc:ml-2">{formatAxisValue(Number(value))}</span>
                )}
              </div>
            )
          }}
        />
      </div>
      {showLegend && chartData.length > 0 && (
        <div className="dc:flex dc:items-center dc:gap-2 dc:px-2 dc:pt-2 dc:pb-1 dc:text-xs text-dc-text-secondary">
          <span>{minLabel}</span>
          <div
            className="dc:flex-1 dc:h-2 dc:rounded-sm"
            style={{ background: gradientCss }}
            aria-hidden="true"
          />
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  )
})

export default ChoroplethChart
