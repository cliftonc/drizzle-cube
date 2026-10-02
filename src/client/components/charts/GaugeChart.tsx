import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'
import { ChartEmptyState, ChartConfigError, ChartRenderError } from './ChartStates.js'
import {
  parseNum,
  finiteOr,
  buildArcPath,
  buildNeedlePath,
  parseThresholds,
  buildThresholdBands,
  buildBandSegments,
  buildScaleTicks,
  computeGaugeLayout,
  computeGaugeGeometry,
  formatGaugeValue,
  polarPoint
} from './gaugeChartHelpers.js'
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel.js'
import type { ChartProps, ThresholdBand } from '../../types.js'

/**
 * Gauge chart: a 270° dial whose arc *is* the threshold banding — one thick,
 * rounded segment per threshold with a small gap between them — read by a
 * tapered needle, with numeric scale labels at the band boundaries and the
 * measure label + value stacked below the centre.
 *
 * All geometry lives in `gaugeChartHelpers.ts`; this component only renders it.
 */
const GaugeChart = React.memo(function GaugeChart({
  data,
  chartConfig,
  displayConfig = {},
  height = '100%',
}: ChartProps) {
  const { t } = useTranslation()
  const getFieldLabel = useCubeFieldLabel()
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height: h } = entry.contentRect
        if (width > 0 && h > 0) setDimensions({ width, height: h })
      }
    })
    observer.observe(el)
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) setDimensions({ width: rect.width, height: rect.height })
    return () => observer.disconnect()
  }, [])

  const { valueField, maxField, configError } = useMemo(() => {
    const yAxis: string[] = Array.isArray(chartConfig?.yAxis)
      ? chartConfig.yAxis
      : []

    const valueField = yAxis[0] ?? ''
    const maxField = yAxis[1] ?? ''

    if (!valueField) {
      return { valueField, maxField, configError: 'Gauge requires at least 1 measure in Y-Axis (current value)' }
    }
    return { valueField, maxField, configError: null }
  }, [chartConfig])

  const thresholds: ThresholdBand[] = useMemo(
    () => parseThresholds(displayConfig?.thresholds),
    [displayConfig?.thresholds]
  )

  const bands = useMemo(() => buildThresholdBands(thresholds), [thresholds])
  const segments = useMemo(() => buildBandSegments(bands), [bands])

  try {
    if (!data || data.length === 0) {
      return <ChartEmptyState height={height} hint={t('chart.runtime.noDataHint.gauge')} />
    }

    if (configError) {
      return <ChartConfigError height={height} hint={configError} />
    }

    const row = (data as Record<string, unknown>[])[0]
    const rawValue = parseNum(row[valueField])
    if (rawValue === null || !Number.isFinite(rawValue)) {
      return (
        <ChartEmptyState
          height={height}
          titleKey="chart.runtime.noValidData"
          hint={t('chart.runtime.noValidDataHint.gauge')}
        />
      )
    }

    const minValue = finiteOr(displayConfig?.minValue, 0)
    const maxFieldValue = maxField ? parseNum(row[maxField]) : null
    const maxValue = finiteOr(displayConfig?.maxValue ?? maxFieldValue, 100)

    const { effectiveMax, fraction, fillColor, needleAngle } =
      computeGaugeGeometry(rawValue, minValue, maxValue, thresholds)

    const showCenterLabel = displayConfig?.showCenterLabel ?? true
    const showPercentage = displayConfig?.showPercentage ?? false
    const yAxisFormat = displayConfig?.leftYAxisFormat

    const containerW = dimensions.width || 300
    const containerH = typeof height === 'number' ? height : (dimensions.height || 200)

    const layout = computeGaugeLayout(containerW, containerH)
    const ticks = buildScaleTicks(bands, minValue, effectiveMax)

    const valueLabel = showPercentage
      ? `${(fraction * 100).toFixed(1)}%`
      : formatGaugeValue(rawValue, yAxisFormat)

    const fieldLabel = getFieldLabel(valueField)

    return (
      <div ref={containerRef} className="dc:relative dc:w-full" style={{ height }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${containerW} ${containerH}`}
          preserveAspectRatio="xMidYMid meet"
          data-testid="gauge-svg"
        >
          <g transform={`translate(${layout.cx}, ${layout.cy})`}>
            {segments.map((segment, i) => (
              <path
                key={i}
                d={buildArcPath(
                  layout.innerRadius,
                  layout.outerRadius,
                  segment.startAngle,
                  segment.endAngle,
                  layout.bandCornerRadius
                )}
                fill={segment.color}
                data-testid={`gauge-band-${i}`}
              />
            ))}

            {ticks.map((tick, i) => {
              const point = polarPoint(tick.angle, layout.tickRadius)
              return (
                <text
                  key={i}
                  x={point.x}
                  y={point.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={layout.tickFontSize}
                  fill="currentColor"
                  className="text-dc-text-muted"
                  data-testid={`gauge-tick-${i}`}
                >
                  {formatGaugeValue(tick.value, yAxisFormat)}
                </text>
              )
            })}

            <path
              d={buildNeedlePath(needleAngle, layout.needleLength, layout.needleHalfWidth)}
              fill="currentColor"
              className="text-dc-text-secondary"
              data-testid="gauge-needle"
              data-fraction={fraction.toFixed(4)}
              data-color={fillColor}
            />
            <circle
              r={layout.hubRadius}
              fill="currentColor"
              className="text-dc-text-secondary"
              data-testid="gauge-hub"
            />

            {showCenterLabel && (
              <g data-testid="gauge-label">
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  y={layout.labelY}
                  fontSize={layout.labelFontSize}
                  fill="currentColor"
                  className="text-dc-text-secondary"
                  data-testid="gauge-field-text"
                >
                  {fieldLabel}
                </text>
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  y={layout.valueY}
                  fontSize={layout.valueFontSize}
                  fontWeight="600"
                  fill="currentColor"
                  className="text-dc-text"
                  data-testid="gauge-value-text"
                >
                  {valueLabel}
                </text>
              </g>
            )}
          </g>
        </svg>
      </div>
    )
  } catch (error) {
    return <ChartRenderError height={height} chartType="Gauge Chart" error={error} />
  }
})

export default GaugeChart
