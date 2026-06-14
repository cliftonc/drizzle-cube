import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { ChartEmptyState, ChartConfigError, ChartRenderError } from './ChartStates'
import {
  START_ANGLE,
  END_ANGLE,
  TRACK_COLOR,
  parseNum,
  buildArcPath,
  parseThresholds,
  buildThresholdBands,
  computeGaugeGeometry,
  formatGaugeValue
} from './gaugeChartHelpers'
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel'
import type { ChartProps, ThresholdBand } from '../../types'

function Needle({ angle, radius }: { angle: number; radius: number }) {
  const needleLen = radius * 0.72
  const needleBase = radius * 0.06
  const x = Math.cos(angle - Math.PI / 2) * needleLen
  const y = Math.sin(angle - Math.PI / 2) * needleLen
  return (
    <g data-testid="gauge-needle">
      <circle r={needleBase} fill="currentColor" className="text-dc-text-secondary" />
      <line
        x1={0}
        y1={0}
        x2={x}
        y2={y}
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        className="text-dc-text-secondary"
      />
    </g>
  )
}

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

  const thresholdBands = buildThresholdBands(thresholds)

  try {
    if (!data || data.length === 0) {
      return <ChartEmptyState height={height} hint={t('chart.runtime.noDataHint.gauge')} />
    }

    if (configError) {
      return <ChartConfigError height={height} hint={configError} />
    }

    const row = (data as Record<string, unknown>[])[0]
    const rawValue = parseNum(row[valueField])
    if (rawValue === null) {
      return (
        <ChartEmptyState
          height={height}
          titleKey="chart.runtime.noValidData"
          hint={t('chart.runtime.noValidDataHint.gauge')}
        />
      )
    }
    const minValue = displayConfig?.minValue ?? 0
    const maxFieldValue = maxField ? parseNum(row[maxField]) : null
    const maxValue = displayConfig?.maxValue ?? (maxFieldValue ?? 100)

    const { effectiveMax, fraction, fillColor, fillAngle, needleAngle } =
      computeGaugeGeometry(rawValue, minValue, maxValue, thresholds)

    const showCenterLabel = displayConfig?.showCenterLabel ?? true
    const showPercentage = displayConfig?.showPercentage ?? false
    const yAxisFormat = displayConfig?.leftYAxisFormat

    const containerW = dimensions.width || 300
    const containerH = typeof height === 'number' ? height : (dimensions.height || 200)

    const radius = Math.min(containerW / 2, containerH * 0.9) * 0.85
    const outerR = radius
    const innerR = radius * 0.6
    const cx = containerW / 2
    const cy = containerH * 0.7

    const trackPath = buildArcPath(innerR, outerR, START_ANGLE, END_ANGLE)
    const fillPath = buildArcPath(innerR, outerR, START_ANGLE, fillAngle)

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
          <g transform={`translate(${cx}, ${cy})`}>
            <path
              d={trackPath}
              fill={TRACK_COLOR}
              data-testid="gauge-track"
            />

            {thresholdBands.map((band, i) => (
              <path
                key={i}
                d={buildArcPath(outerR + 4, outerR + 8, band.start, band.end)}
                fill={band.color}
                data-testid={`gauge-band-${i}`}
              />
            ))}

            <path
              d={fillPath}
              fill={fillColor}
              data-testid="gauge-fill"
              data-fraction={fraction.toFixed(4)}
            />

            <Needle angle={needleAngle} radius={radius} />

            {showCenterLabel && (
              <g data-testid="gauge-label">
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={radius * 0.22}
                  fontWeight="bold"
                  fill="currentColor"
                  dy={radius * 0.12}
                  data-testid="gauge-value-text"
                >
                  {valueLabel}
                </text>
                <text
                  textAnchor="middle"
                  fontSize={radius * 0.13}
                  fill="currentColor"
                  className="text-dc-text-secondary"
                  dy={radius * 0.34}
                >
                  {fieldLabel}
                </text>
              </g>
            )}

            <text
              x={Math.cos(START_ANGLE - Math.PI / 2) * (outerR + 14)}
              y={Math.sin(START_ANGLE - Math.PI / 2) * (outerR + 14)}
              textAnchor="middle"
              fontSize={radius * 0.12}
              fill="currentColor"
              className="text-dc-text-secondary"
              data-testid="gauge-min-label"
            >
              {formatGaugeValue(minValue, yAxisFormat)}
            </text>
            <text
              x={Math.cos(END_ANGLE - Math.PI / 2) * (outerR + 14)}
              y={Math.sin(END_ANGLE - Math.PI / 2) * (outerR + 14)}
              textAnchor="middle"
              fontSize={radius * 0.12}
              fill="currentColor"
              className="text-dc-text-secondary"
              data-testid="gauge-max-label"
            >
              {formatGaugeValue(effectiveMax, yAxisFormat)}
            </text>
          </g>
        </svg>
      </div>
    )
  } catch (error) {
    return <ChartRenderError height={height} chartType="Gauge Chart" error={error} />
  }
})

export default GaugeChart
