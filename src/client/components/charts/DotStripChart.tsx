import React, { useMemo, useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel.js'
import { CHART_COLORS } from '../../utils/chartConstants.js'
import { formatAxisValue } from '../../utils/chartUtils.js'
import { ChartConfigError, ChartEmptyState, ChartRenderError } from './ChartStates.js'
import { useChartDimensions } from './useChartDimensions.js'
import {
  DOT_RADIUS,
  MAX_BANDS,
  computeDomain,
  computeSpread,
  computeTicks,
  groupIntoBands,
  median,
  packSwarm,
  swarmHeight,
  type BandSort,
  type BandStats,
  type PlacedDot,
} from './DotStripChart.helpers.js'
import type { ChartProps } from '../../types.js'

const GUTTER_WIDTH = 190
const AXIS_HEIGHT = 44
const PLOT_PADDING_X = 24

/**
 * Height the left gutter needs for its own content, so a band with a flat swarm
 * still gets a row tall enough for the name and the badges. Folded into the
 * band height rather than left to the grid, so the strip SVG always fills the
 * whole row and its gridlines stay continuous between bands.
 *
 * `dc:text-sm` line (20) + `dc:gap-1` (4) + badge line (20) + `dc:py-2` (16).
 */
const GUTTER_HEIGHT_WITH_STATS = 60
const GUTTER_HEIGHT_NAME_ONLY = 36

/**
 * Read a drop zone's field, tolerating both shapes it is stored in: the
 * AnalysisBuilder writes a bare string into any zone with `maxItems: 1`
 * (`addFieldToAxis` in `AnalysisBuilder/utils/axisConfigUtils.ts`), while the
 * agent's `inferChartConfig` always writes an array.
 */
function firstField(value: unknown): string | undefined {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined
  return typeof value === 'string' && value !== '' ? value : undefined
}

interface HoveredDot {
  band: string
  dot: PlacedDot
  clientX: number
  clientY: number
}

/**
 * One band's strip: gridlines, the baseline, the median tick and the swarm.
 * The x-scale is passed in so every band and the axis share one domain.
 */
function BandStrip({
  band,
  width,
  radius,
  ticks,
  scale,
  showGrid,
  showMedianMarker,
  showExtremeLabels,
  color,
  accentColor,
  drillEnabled,
  onDotClick,
  onDotHover,
  onDotLeave,
}: {
  band: BandStats
  width: number
  radius: number
  ticks: number[]
  scale: (v: number) => number
  showGrid: boolean
  showMedianMarker: boolean
  showExtremeLabels: boolean
  color: string
  accentColor: string
  drillEnabled: boolean
  onDotClick: (band: BandStats, dot: PlacedDot, event: React.MouseEvent) => void
  onDotHover: (band: BandStats, dot: PlacedDot, event: React.MouseEvent) => void
  onDotLeave: () => void
}) {
  const centreY = band.height / 2
  const extremes = useMemo(() => {
    if (!showExtremeLabels || band.dots.length < 2) return new Set<PlacedDot>()
    const sorted = [...band.dots].sort((a, b) => a.value - b.value)
    return new Set<PlacedDot>([sorted[0], sorted[sorted.length - 1]])
  }, [band.dots, showExtremeLabels])

  return (
    <svg
      width={width}
      height={band.height}
      viewBox={`0 0 ${width} ${band.height}`}
      data-testid={`dot-strip-band-${band.label}`}
    >
      {showGrid &&
        ticks.map((tick, i) => (
          <line
            key={i}
            x1={scale(tick)}
            x2={scale(tick)}
            y1={0}
            y2={band.height}
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={1}
            className="text-dc-text-secondary"
          />
        ))}

      {band.dots.length > 0 && (
        <line
          x1={scale(band.min!)}
          x2={scale(band.max!)}
          y1={centreY}
          y2={centreY}
          stroke="currentColor"
          strokeOpacity={0.25}
          strokeWidth={1}
          className="text-dc-text-secondary"
        />
      )}

      {showMedianMarker && band.median !== null && (
        <line
          x1={scale(band.median)}
          x2={scale(band.median)}
          y1={centreY - Math.min(centreY - 2, 16)}
          y2={centreY + Math.min(centreY - 2, 16)}
          stroke="currentColor"
          strokeOpacity={0.55}
          strokeWidth={2}
          className="text-dc-text-secondary"
          data-testid={`dot-strip-median-${band.label}`}
        />
      )}

      {band.dots.map((dot, i) => {
        const isExtreme = extremes.has(dot)
        return (
          <g key={`${dot.label}-${i}`}>
            <circle
              cx={dot.x}
              cy={centreY + dot.y}
              r={radius}
              fill={isExtreme ? accentColor : color}
              stroke="var(--dc-surface, #ffffff)"
              strokeWidth={1.25}
              cursor={drillEnabled ? 'pointer' : undefined}
              data-testid="dot-strip-dot"
              onClick={(event) => onDotClick(band, dot, event)}
              onMouseEnter={(event) => onDotHover(band, dot, event)}
              onMouseLeave={onDotLeave}
            />
            {isExtreme && (
              <text
                x={dot.x}
                y={centreY + dot.y + (dot.y <= 0 ? -radius - 6 : radius + 14)}
                textAnchor="middle"
                fontSize={11}
                fill={accentColor}
                data-testid={`dot-strip-extreme-${dot.label}`}
              >
                {dot.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

const DotStripChart = React.memo(function DotStripChart({
  data,
  chartConfig,
  displayConfig = {},
  height = '100%',
  colorPalette,
  onDataPointClick,
  drillEnabled,
}: ChartProps) {
  const { t } = useTranslation()
  const getFieldLabel = useCubeFieldLabel()
  const { containerRef, dimensions } = useChartDimensions()
  const [hovered, setHovered] = useState<HoveredDot | null>(null)

  const showGrid = displayConfig.showGrid !== false
  const showTooltip = displayConfig.showTooltip !== false
  const showMedianMarker = displayConfig.showMedianMarker !== false
  const showBandStats = displayConfig.showBandStats !== false
  const showExtremeLabels = displayConfig.showExtremeLabels === true
  const radius = DOT_RADIUS[displayConfig.dotSize ?? 'medium'] ?? DOT_RADIUS.medium
  const bandSort: BandSort = displayConfig.bandSort ?? 'none'
  const xAxisFormat = displayConfig.xAxisFormat

  const { bandField, valueField, labelField, configError } = useMemo(() => {
    const bandField = firstField(chartConfig?.xAxis) ?? firstField(chartConfig?.x)
    const valueField = firstField(chartConfig?.yAxis) ?? firstField(chartConfig?.y)
    const labelField = firstField(chartConfig?.series)

    if (!bandField || !valueField) {
      return {
        bandField,
        valueField,
        labelField,
        configError: t('chart.runtime.configErrorHint.dotStrip'),
      }
    }
    return { bandField, valueField, labelField, configError: null as string | null }
  }, [chartConfig, t])

  const plotWidth = Math.max((dimensions.width || 720) - GUTTER_WIDTH - PLOT_PADDING_X, 80)

  const gutterHeight = showBandStats ? GUTTER_HEIGHT_WITH_STATS : GUTTER_HEIGHT_NAME_ONLY

  const { bands, ticks, scale, truncated } = useMemo(() => {
    const empty = { bands: [] as BandStats[], ticks: [] as number[], scale: (_: number) => 0, truncated: false }
    if (configError || !bandField || !valueField || !data || data.length === 0) return empty

    const rows = data as Record<string, unknown>[]
    const grouped = groupIntoBands(rows, bandField, valueField, labelField, bandSort)

    const allValues = grouped.flatMap((b) => b.values.map((d) => d.value))
    const domain = computeDomain(allValues)
    const span = domain.max - domain.min
    const inner = Math.max(plotWidth - 2 * radius - 2, 10)
    const scale = (v: number) => radius + 1 + (span === 0 ? inner / 2 : ((v - domain.min) / span) * inner)

    const bands: BandStats[] = grouped.map((group) => {
      const placed = packSwarm(group.values, scale, radius)
      const sortedValues = group.values.map((d) => d.value).sort((a, b) => a - b)
      const min = sortedValues.length > 0 ? sortedValues[0] : null
      const max = sortedValues.length > 0 ? sortedValues[sortedValues.length - 1] : null
      return {
        label: group.label,
        dots: placed,
        count: placed.length,
        median: median(sortedValues),
        min,
        max,
        spread: computeSpread(min, max, placed.length),
        noData: placed.length === 0,
        height: Math.max(swarmHeight(placed, radius), gutterHeight),
        truncated: group.truncated,
      }
    })

    return {
      bands,
      ticks: computeTicks(domain.min, domain.max, 5),
      scale,
      truncated: new Set(rows.map((r) => String(r[bandField] ?? ''))).size > MAX_BANDS,
    }
  }, [data, bandField, valueField, labelField, bandSort, configError, plotWidth, radius, gutterHeight])

  const palette = colorPalette?.colors ?? CHART_COLORS
  const color = palette[0]
  const accentColor = palette[palette.length > 1 ? 1 : 0]

  const formatValue = (v: number) => formatAxisValue(v, xAxisFormat)

  const handleDotClick = (band: BandStats, dot: PlacedDot, event: React.MouseEvent) => {
    if (!onDataPointClick || !drillEnabled || !bandField) return
    onDataPointClick({
      dataPoint: dot.row,
      clickedField: bandField,
      xValue: band.label,
      position: { x: event.clientX, y: event.clientY },
      nativeEvent: event,
    })
  }

  const handleDotHover = (band: BandStats, dot: PlacedDot, event: React.MouseEvent) => {
    if (!showTooltip) return
    setHovered({ band: band.label, dot, clientX: event.clientX, clientY: event.clientY })
  }

  if (configError) {
    return <ChartConfigError height={height} hint={configError} />
  }

  if (!data || data.length === 0) {
    return <ChartEmptyState height={height} hint={t('chart.runtime.noDataHint.dotStrip')} />
  }

  if (bands.length === 0) {
    return (
      <ChartEmptyState
        height={height}
        titleKey="chart.runtime.noValidData"
        hint={t('chart.runtime.noValidDataHint.dotStrip')}
      />
    )
  }

  try {
    return (
      <div ref={containerRef} className="dc:relative dc:w-full dc:overflow-y-auto" style={{ height }}>
        <div
          className="dc:grid dc:items-stretch"
          style={{ gridTemplateColumns: `${GUTTER_WIDTH}px 1fr` }}
          data-testid="dot-strip-grid"
        >
          {bands.map((band) => (
            <React.Fragment key={band.label}>
              <div
                className="dc:flex dc:flex-col dc:justify-center dc:gap-1 dc:pr-3 dc:py-2 dc:border-b border-dc-border"
                style={{ minHeight: band.height }}
              >
                <div className="dc:text-sm dc:font-semibold dc:truncate text-dc-text" title={band.label}>
                  {band.label || t('chart.runtime.dotStrip.unlabelledBand')}
                </div>
                {showBandStats && (
                  <div className="dc:flex dc:flex-wrap dc:gap-1 dc:text-xs">
                    <span className="dc:rounded-sm dc:px-1.5 dc:py-0.5 bg-dc-surface-secondary text-dc-text-secondary">
                      {t(
                        band.truncated
                          ? 'chart.runtime.dotStrip.countTruncated'
                          : 'chart.runtime.dotStrip.count',
                        { count: band.count }
                      )}
                    </span>
                    {band.noData ? (
                      <span className="dc:rounded-sm dc:px-1.5 dc:py-0.5 bg-dc-surface-secondary text-dc-text-muted">
                        {t('chart.runtime.dotStrip.noDataRecorded')}
                      </span>
                    ) : (
                      band.spread !== null && (
                        <span className="dc:rounded-sm dc:px-1.5 dc:py-0.5 bg-dc-surface-secondary text-dc-text-secondary">
                          {t('chart.runtime.dotStrip.spread', { spread: band.spread.toFixed(2) })}
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
              <div
                className="dc:flex dc:items-center dc:border-b border-dc-border"
                style={{ minHeight: band.height, paddingRight: PLOT_PADDING_X }}
              >
                <BandStrip
                  band={band}
                  width={plotWidth}
                  radius={radius}
                  ticks={ticks}
                  scale={scale}
                  showGrid={showGrid}
                  showMedianMarker={showMedianMarker}
                  showExtremeLabels={showExtremeLabels}
                  color={color}
                  accentColor={accentColor}
                  drillEnabled={drillEnabled === true}
                  onDotClick={handleDotClick}
                  onDotHover={handleDotHover}
                  onDotLeave={() => setHovered(null)}
                />
              </div>
            </React.Fragment>
          ))}

          <div />
          <div style={{ paddingRight: PLOT_PADDING_X }}>
            <svg
              width={plotWidth}
              height={AXIS_HEIGHT}
              viewBox={`0 0 ${plotWidth} ${AXIS_HEIGHT}`}
              data-testid="dot-strip-axis"
            >
              <line x1={0} x2={plotWidth} y1={1} y2={1} stroke="currentColor" strokeOpacity={0.2} className="text-dc-text-secondary" />
              {ticks.map((tick, i) => (
                <g key={i} transform={`translate(${scale(tick)}, 0)`}>
                  <line y1={1} y2={7} stroke="currentColor" strokeOpacity={0.4} className="text-dc-text-secondary" />
                  <text
                    y={22}
                    textAnchor="middle"
                    fontSize={11}
                    fill="currentColor"
                    className="text-dc-text-secondary"
                  >
                    {formatValue(tick)}
                  </text>
                </g>
              ))}
              {valueField && (
                <text
                  x={plotWidth / 2}
                  y={39}
                  textAnchor="middle"
                  fontSize={11}
                  fill="currentColor"
                  className="text-dc-text-muted"
                >
                  {getFieldLabel(valueField)}
                </text>
              )}
            </svg>
          </div>
        </div>

        {truncated && (
          <div className="dc:text-xs text-dc-warning dc:text-center dc:mt-1">
            {t('chart.runtime.dotStrip.truncated', { max: MAX_BANDS })}
          </div>
        )}

        {showTooltip && hovered && (
          <div
            className="dc:fixed dc:z-50 dc:pointer-events-none dc:rounded-sm dc:px-2 dc:py-1 dc:text-xs dc:shadow-lg bg-dc-surface text-dc-text dc:border border-dc-border"
            style={{ left: hovered.clientX + 12, top: hovered.clientY + 12 }}
            data-testid="dot-strip-tooltip"
          >
            <div className="dc:font-semibold">{hovered.dot.label}</div>
            <div className="text-dc-text-secondary">{hovered.band}</div>
            <div>{formatValue(hovered.dot.value)}</div>
          </div>
        )}
      </div>
    )
  } catch (error) {
    return <ChartRenderError height={height} chartType="Dot Strip Chart" error={error} />
  }
})

export default DotStripChart
