import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { arc } from 'd3-shape'
import { formatAxisValue } from '../../utils/chartUtils'
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel'
import type { ChartProps, ThresholdBand } from '../../types'

const START_ANGLE = -Math.PI * 0.75
const END_ANGLE = Math.PI * 0.75
const TRACK_COLOR = '#e2e8f0'
const DEFAULT_FILL = '#6366f1'

function parseNum(v: unknown): number | null {
  if (v === undefined || v === null) return null
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return isNaN(n) ? null : n
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

function valueToAngle(value: number, min: number, max: number): number {
  const span = max === min ? 1 : max - min
  const t = clamp((value - min) / span, 0, 1)
  return START_ANGLE + t * (END_ANGLE - START_ANGLE)
}

function resolveColor(fraction: number, thresholds: ThresholdBand[]): string {
  const sorted = [...thresholds].sort((a, b) => a.value - b.value)
  let color = DEFAULT_FILL
  for (const t of sorted) {
    if (fraction >= t.value) color = t.color
  }
  return color
}

function buildArcPath(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const pathFn = arc()
  return pathFn({ innerRadius, outerRadius, startAngle, endAngle }) ?? ''
}

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

  const thresholds: ThresholdBand[] = useMemo(() => {
    const raw = displayConfig?.thresholds
    let arr: unknown[] | null = null
    if (Array.isArray(raw)) {
      arr = raw
    } else if (typeof raw === 'string' && raw.trim()) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) arr = parsed
      } catch (e) {
        console.warn('GaugeChart: invalid threshold JSON', e)
        return []
      }
    }
    if (!arr) return []
    return arr.filter(
      (entry): entry is ThresholdBand =>
        entry !== null &&
        typeof entry === 'object' &&
        typeof (entry as ThresholdBand).value === 'number' &&
        typeof (entry as ThresholdBand).color === 'string'
    )
  }, [displayConfig?.thresholds])

  const thresholdBands = thresholds.length === 0
    ? []
    : [...thresholds].sort((a, b) => a.value - b.value).map((t, i, sorted) => {
        const bandStart = i === 0 ? START_ANGLE : valueToAngle(sorted[i - 1].value, 0, 1)
        const bandEnd = valueToAngle(t.value, 0, 1)
        return { color: t.color, start: bandStart, end: bandEnd }
      })

  try {
    if (!data || data.length === 0) {
      return (
        <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted" style={{ height }}>
          <div className="dc:text-center">
            <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.noData')}</div>
            <div className="dc:text-xs text-dc-text-secondary">{t('chart.runtime.noDataHint.gauge')}</div>
          </div>
        </div>
      )
    }

    if (configError) {
      return (
        <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-warning" style={{ height }}>
          <div className="dc:text-center">
            <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.configError')}</div>
            <div className="dc:text-xs">{configError}</div>
          </div>
        </div>
      )
    }

    const row = (data as Record<string, unknown>[])[0]
    const rawValue = parseNum(row[valueField])
    if (rawValue === null) {
      return (
        <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted" style={{ height }}>
          <div className="dc:text-center">
            <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.noValidData')}</div>
            <div className="dc:text-xs text-dc-text-secondary">{t('chart.runtime.noValidDataHint.gauge')}</div>
          </div>
        </div>
      )
    }
    const minValue = displayConfig?.minValue ?? 0
    const maxFieldValue = maxField ? parseNum(row[maxField]) : null
    const maxValue = displayConfig?.maxValue ?? (maxFieldValue ?? 100)

    const effectiveMax = maxValue === minValue ? minValue + 1 : maxValue
    const clampedValue = clamp(rawValue, minValue, effectiveMax)
    const fraction = (clampedValue - minValue) / (effectiveMax - minValue)

    const fillColor = thresholds.length > 0 ? resolveColor(fraction, thresholds) : DEFAULT_FILL

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
    const fillAngle = valueToAngle(clampedValue, minValue, effectiveMax)
    const fillPath = buildArcPath(innerR, outerR, START_ANGLE, fillAngle)

    const needleAngle = valueToAngle(clampedValue, minValue, effectiveMax)

    const displayValue = yAxisFormat
      ? formatAxisValue(rawValue, yAxisFormat)
      : rawValue.toLocaleString()

    const valueLabel = showPercentage
      ? `${(fraction * 100).toFixed(1)}%`
      : displayValue

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
              {yAxisFormat ? formatAxisValue(minValue, yAxisFormat) : minValue.toLocaleString()}
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
              {yAxisFormat ? formatAxisValue(effectiveMax, yAxisFormat) : effectiveMax.toLocaleString()}
            </text>
          </g>
        </svg>
      </div>
    )
  } catch (error) {
    return (
      <div className="dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full text-dc-error dc:p-4" style={{ height }}>
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.chartError', { chartType: 'Gauge Chart' })}</div>
          <div className="dc:text-xs dc:mb-2">{error instanceof Error ? error.message : t('chart.runtime.unknownError')}</div>
          <div className="dc:text-xs text-dc-text-muted">{t('chart.runtime.checkConfig')}</div>
        </div>
      </div>
    )
  }
})

export default GaugeChart
