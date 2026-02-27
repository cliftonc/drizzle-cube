import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { arc } from 'd3-shape'
import { formatAxisValue } from '../../utils/chartUtils'
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel'
import type { ChartProps } from '../../types'

// ---------- types ----------

interface ThresholdBand {
  value: number
  color: string
}

interface GaugeDisplayConfig {
  minValue?: number
  maxValue?: number
  thresholds?: ThresholdBand[]
  showCenterLabel?: boolean
  showPercentage?: boolean
  leftYAxisFormat?: unknown
}

// ---------- constants ----------

const START_ANGLE = -Math.PI * 0.75 // -135°
const END_ANGLE = Math.PI * 0.75   //  135°
const TRACK_COLOR = '#e2e8f0'
const DEFAULT_FILL = '#6366f1'

// ---------- helpers ----------

function parseNum(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''))
  return isNaN(n) ? 0 : n
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

/** Map a value in [min, max] to an angle in [START_ANGLE, END_ANGLE] */
function valueToAngle(value: number, min: number, max: number): number {
  const span = max === min ? 1 : max - min
  const t = clamp((value - min) / span, 0, 1)
  return START_ANGLE + t * (END_ANGLE - START_ANGLE)
}

/** Resolve threshold color for a given fill fraction */
function resolveColor(fraction: number, thresholds: ThresholdBand[]): string {
  const sorted = [...thresholds].sort((a, b) => a.value - b.value)
  let color = DEFAULT_FILL
  for (const t of sorted) {
    if (fraction >= t.value) color = t.color
  }
  return color
}

// ---------- Arc path builder ----------

function buildArcPath(
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const pathFn = arc()
  return pathFn({ innerRadius, outerRadius, startAngle, endAngle }) ?? ''
}

// ---------- Needle ----------

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

// ---------- Main component ----------

const GaugeChart = React.memo(function GaugeChart({
  data,
  chartConfig,
  displayConfig = {},
  height = '100%',
}: ChartProps) {
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

  const dc = (displayConfig ?? {}) as GaugeDisplayConfig

  // ---- field resolution ----
  const { valueField, maxField, configError } = useMemo(() => {
    const yAxis: string[] = Array.isArray(chartConfig?.yAxis)
      ? chartConfig.yAxis
      : chartConfig?.yAxis
        ? [chartConfig.yAxis as string]
        : []

    const dcRec = displayConfig as Record<string, unknown>
    const valueField = String(dcRec?.valueField ?? yAxis[0] ?? '')
    const maxField = String(dcRec?.maxField ?? yAxis[1] ?? '')

    if (!valueField) {
      return { valueField, maxField, configError: 'Gauge requires at least 1 measure in Y-Axis (current value)' }
    }
    return { valueField, maxField, configError: null }
  }, [chartConfig, displayConfig])

  // ---- empty state ----
  if (!data || data.length === 0) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted" style={{ height }}>
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">No data available</div>
          <div className="dc:text-xs text-dc-text-secondary">No data points to display in gauge chart</div>
        </div>
      </div>
    )
  }

  // ---- config error ----
  if (configError) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-warning" style={{ height }}>
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">Configuration Error</div>
          <div className="dc:text-xs">{configError}</div>
        </div>
      </div>
    )
  }

  // ---- value extraction (use first row) ----
  const row = (data as Record<string, unknown>[])[0]
  const rawValue = parseNum(row[valueField])
  const minValue = dc.minValue ?? 0
  const maxValue =
    dc.maxValue !== undefined
      ? dc.maxValue
      : maxField
        ? parseNum(row[maxField])
        : 100

  const effectiveMax = maxValue === minValue ? minValue + 1 : maxValue
  const clampedValue = clamp(rawValue, minValue, effectiveMax)
  const fraction = (clampedValue - minValue) / (effectiveMax - minValue)

  const thresholds: ThresholdBand[] = Array.isArray(dc.thresholds) ? dc.thresholds : []
  const fillColor = thresholds.length > 0 ? resolveColor(fraction, thresholds) : DEFAULT_FILL

  const showCenterLabel = dc.showCenterLabel ?? true
  const showPercentage = dc.showPercentage ?? false
  const yAxisFormat = dc.leftYAxisFormat

  // ---- layout ----
  const containerW = dimensions.width || 300
  const containerH = typeof height === 'number' ? height : dimensions.height || 200
  const containerHNum = typeof containerH === 'number' ? containerH : parseInt(String(containerH))

  // Gauge fills the lower ~60% of the container height (half-circle with padding)
  const radius = Math.min(containerW / 2, containerHNum * 0.9) * 0.85
  const outerR = radius
  const innerR = radius * 0.6
  const cx = containerW / 2
  const cy = containerH as number * 0.7

  // Arc paths
  const trackPath = buildArcPath(innerR, outerR, START_ANGLE, END_ANGLE)
  const fillAngle = valueToAngle(clampedValue, minValue, effectiveMax)
  const fillPath = buildArcPath(innerR, outerR, START_ANGLE, fillAngle)

  // Threshold band arcs
  const thresholdBands = useMemo(() => {
    if (thresholds.length === 0) return []
    const sorted = [...thresholds].sort((a, b) => a.value - b.value)
    return sorted.map((t, i) => {
      const bandStart = i === 0 ? START_ANGLE : valueToAngle(sorted[i - 1].value, 0, 1)
      const bandEnd = valueToAngle(t.value, 0, 1)
      return { color: t.color, start: bandStart, end: bandEnd }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thresholds])

  const needleAngle = valueToAngle(clampedValue, minValue, effectiveMax)

  const displayValue = yAxisFormat
    ? formatAxisValue(rawValue, yAxisFormat as Parameters<typeof formatAxisValue>[1])
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
        viewBox={`0 0 ${containerW} ${containerHNum}`}
        preserveAspectRatio="xMidYMid meet"
        data-testid="gauge-svg"
      >
        <g transform={`translate(${cx}, ${cy})`}>
          {/* Track (background arc) */}
          <path
            d={trackPath}
            fill={TRACK_COLOR}
            data-testid="gauge-track"
          />

          {/* Threshold band arcs (decorative markers) */}
          {thresholdBands.map((band, i) => (
            <path
              key={i}
              d={buildArcPath(outerR + 4, outerR + 8, band.start, band.end)}
              fill={band.color}
              data-testid={`gauge-band-${i}`}
            />
          ))}

          {/* Fill arc */}
          <path
            d={fillPath}
            fill={fillColor}
            data-testid="gauge-fill"
            data-fraction={fraction.toFixed(4)}
          />

          {/* Needle */}
          <Needle angle={needleAngle} radius={radius} />

          {/* Center label */}
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

          {/* Min / max labels */}
          <text
            x={Math.cos(START_ANGLE - Math.PI / 2) * (outerR + 14)}
            y={Math.sin(START_ANGLE - Math.PI / 2) * (outerR + 14)}
            textAnchor="middle"
            fontSize={radius * 0.12}
            fill="currentColor"
            className="text-dc-text-secondary"
            data-testid="gauge-min-label"
          >
            {yAxisFormat ? formatAxisValue(minValue, yAxisFormat as Parameters<typeof formatAxisValue>[1]) : minValue.toLocaleString()}
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
            {yAxisFormat ? formatAxisValue(effectiveMax, yAxisFormat as Parameters<typeof formatAxisValue>[1]) : effectiveMax.toLocaleString()}
          </text>
        </g>
      </svg>
    </div>
  )
})

export default GaugeChart
