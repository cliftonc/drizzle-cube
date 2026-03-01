import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CHART_COLORS } from '../../utils/chartConstants'
import { formatAxisValue } from '../../utils/chartUtils'
import type { ChartProps } from '../../types'

const MAX_BOXES = 50

interface BoxStats {
  label: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
  color: string
}

function parseNumeric(v: unknown): number | null {
  if (v === undefined || v === null) return null
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return isNaN(n) ? null : n
}

/** Build box stats from 5-measure mode fields */
function buildFrom5Measures(
  row: Record<string, unknown>,
  minField: string,
  q1Field: string,
  medianField: string,
  q3Field: string,
  maxField: string,
  label: string,
  color: string
): BoxStats | null {
  const min = parseNumeric(row[minField])
  const q1 = parseNumeric(row[q1Field])
  const median = parseNumeric(row[medianField])
  const q3 = parseNumeric(row[q3Field])
  const max = parseNumeric(row[maxField])
  if (min === null || q1 === null || median === null || q3 === null || max === null) return null
  return { label, min, q1, median, q3, max, color }
}

/** Build approximate box stats from 3-measure mode (avg ± stddev, median) */
function buildFrom3Measures(
  row: Record<string, unknown>,
  avgField: string,
  stddevField: string,
  medianField: string,
  label: string,
  color: string
): BoxStats | null {
  const avg = parseNumeric(row[avgField])
  const sd = parseNumeric(row[stddevField])
  const median = parseNumeric(row[medianField])
  if (avg === null || sd === null || median === null) return null
  const absSd = Math.abs(sd)
  return {
    label,
    min: avg - 2 * absSd,
    q1: avg - absSd,
    median,
    q3: avg + absSd,
    max: avg + 2 * absSd,
    color,
  }
}

// Render a single box plot element
function BoxElement({
  x,
  boxWidth,
  minY,
  q1Y,
  medianY,
  q3Y,
  maxY,
  color,
  label,
}: {
  x: number
  boxWidth: number
  minY: number
  q1Y: number
  medianY: number
  q3Y: number
  maxY: number
  color: string
  label: string
}) {
  const halfWidth = boxWidth / 2
  const whiskerX = x
  const capWidth = boxWidth * 0.4

  return (
    <g data-testid={`box-${label}`}>
      {/* Whisker line (min to max) */}
      <line x1={whiskerX} y1={minY} x2={whiskerX} y2={maxY} stroke={color} strokeWidth={1.5} />
      {/* Min cap */}
      <line
        x1={whiskerX - capWidth / 2}
        y1={minY}
        x2={whiskerX + capWidth / 2}
        y2={minY}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Max cap */}
      <line
        x1={whiskerX - capWidth / 2}
        y1={maxY}
        x2={whiskerX + capWidth / 2}
        y2={maxY}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* IQR Box (Q1 to Q3) */}
      <rect
        x={whiskerX - halfWidth}
        y={Math.min(q1Y, q3Y)}
        width={boxWidth}
        height={Math.abs(q3Y - q1Y) || 2}
        fill={color}
        fillOpacity={0.3}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Median line */}
      <line
        x1={whiskerX - halfWidth}
        y1={medianY}
        x2={whiskerX + halfWidth}
        y2={medianY}
        stroke={color}
        strokeWidth={2.5}
        data-testid={`median-${label}`}
      />
    </g>
  )
}

// Y-axis tick renderer
function YAxis({
  scale,
  domainMin,
  domainMax,
  width,
  tickCount = 5,
  format,
}: {
  scale: (v: number) => number
  domainMin: number
  domainMax: number
  width: number
  tickCount?: number
  format?: (v: number) => string
}) {
  const ticks = useMemo(() => {
    const range = domainMax - domainMin
    if (range === 0) return [domainMin]
    const step = range / (tickCount - 1)
    return Array.from({ length: tickCount }, (_, i) => domainMin + i * step)
  }, [domainMin, domainMax, tickCount])

  return (
    <g data-testid="y-axis">
      {ticks.map((tick, i) => (
        <g key={i} transform={`translate(0, ${scale(tick)})`}>
          <line x1={0} x2={-6} stroke="currentColor" strokeWidth={1} />
          <text
            x={-10}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={11}
            fill="currentColor"
            className="text-dc-text-secondary"
          >
            {format ? format(tick) : tick.toLocaleString()}
          </text>
          <line x1={0} x2={width} stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />
        </g>
      ))}
      <line y1={scale(ticks[0])} y2={scale(ticks[ticks.length - 1])} stroke="currentColor" strokeWidth={1} />
    </g>
  )
}

const BoxPlotChart = React.memo(function BoxPlotChart({
  data,
  chartConfig,
  displayConfig = {},
  height = '100%',
  colorPalette,
  onDataPointClick,
  drillEnabled,
}: ChartProps) {
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

  const yAxisFormat = displayConfig?.leftYAxisFormat

  // Determine config mode and extract fields from chartConfig.yAxis positions
  const { xField, mode, fields, configError } = useMemo(() => {
    const xField = Array.isArray(chartConfig?.xAxis)
      ? chartConfig.xAxis[0]
      : chartConfig?.xAxis ?? chartConfig?.x

    const yAxisFields: string[] = Array.isArray(chartConfig?.yAxis)
      ? chartConfig.yAxis
      : chartConfig?.yAxis
        ? [chartConfig.yAxis as string]
        : []

    if (!xField || yAxisFields.length === 0) {
      return {
        xField,
        mode: 'none' as const,
        fields: {},
        configError: 'BoxPlot requires an X-Axis dimension and at least one measure in Y-Axis',
      }
    }

    // 5-measure mode: yAxis = [min, q1, median, q3, max]
    if (yAxisFields.length >= 5) {
      return {
        xField,
        mode: '5measure' as const,
        fields: {
          minField: yAxisFields[0],
          q1Field: yAxisFields[1],
          medianField: yAxisFields[2],
          q3Field: yAxisFields[3],
          maxField: yAxisFields[4],
        },
        configError: null,
      }
    }

    // 3-measure mode: yAxis = [avg, stddev, median]
    if (yAxisFields.length >= 3) {
      return {
        xField,
        mode: '3measure' as const,
        fields: {
          avgField: yAxisFields[0],
          stddevField: yAxisFields[1],
          medianField: yAxisFields[2],
        },
        configError: null,
      }
    }

    // 2-measure mode is invalid (not enough for any statistical mode)
    if (yAxisFields.length === 2) {
      return {
        xField,
        mode: 'none' as const,
        fields: {},
        configError: 'BoxPlot requires 1 measure (auto), 3 (avg/stddev/median), or 5 (min/q1/median/q3/max)',
      }
    }

    // Auto mode: use yAxis[0] as the value field (treated as median/value)
    return {
      xField,
      mode: 'auto' as const,
      fields: { valueField: yAxisFields[0] },
      configError: null,
    }
  }, [chartConfig])

  const boxes: BoxStats[] = useMemo(() => {
    if (configError || !data || data.length === 0 || mode === 'none') return []
    const rows = (data as Record<string, unknown>[]).slice(0, MAX_BOXES)
    const palette = colorPalette?.colors ?? CHART_COLORS

    const results: BoxStats[] = []
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const label = xField ? String(row[xField] ?? `Row ${i + 1}`) : `Row ${i + 1}`
      const color = palette[i % palette.length]

      let box: BoxStats | null = null
      if (mode === '5measure') {
        box = buildFrom5Measures(
          row,
          fields.minField!,
          fields.q1Field!,
          fields.medianField!,
          fields.q3Field!,
          fields.maxField!,
          label,
          color
        )
      } else if (mode === '3measure') {
        box = buildFrom3Measures(row, fields.avgField!, fields.stddevField!, fields.medianField!, label, color)
      } else {
        // Auto: use value as median, build minimal box (value ± 0)
        const v = parseNumeric(row[fields.valueField!])
        if (v !== null) {
          box = { label, min: v, q1: v, median: v, q3: v, max: v, color }
        }
      }
      if (box) results.push(box)
    }
    return results
  }, [data, xField, mode, fields, colorPalette, configError])

  if (!data || data.length === 0) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted" style={{ height }}>
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">No data available</div>
          <div className="dc:text-xs text-dc-text-secondary">No data points to display in box plot chart</div>
        </div>
      </div>
    )
  }

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

  if (boxes.length === 0) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted" style={{ height }}>
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">No valid data</div>
          <div className="dc:text-xs text-dc-text-secondary">
            Could not compute box plot statistics from the provided data
          </div>
        </div>
      </div>
    )
  }

  // Compute layout
  const margin = { top: 20, right: 20, bottom: 60, left: 60 }
  const containerWidth = dimensions.width || 600
  const containerHeight = typeof height === 'number' ? height : (dimensions.height || 400)
  const innerWidth = Math.max(containerWidth - margin.left - margin.right, 50)
  const innerHeight = Math.max(containerHeight - margin.top - margin.bottom, 50)

  // Y scale: linear from min-of-all to max-of-all
  const allValues = boxes.flatMap((b) => [b.min, b.max])
  const rawMin = Math.min(...allValues)
  const rawMax = Math.max(...allValues)
  const padding = (rawMax - rawMin) * 0.1 || 1
  const domainMin = rawMin - padding
  const domainMax = rawMax + padding

  const domainRange = domainMax - domainMin
  const yScale = (v: number) =>
    domainRange === 0 ? innerHeight / 2 : innerHeight - ((v - domainMin) / domainRange) * innerHeight

  const boxSpacing = innerWidth / boxes.length
  const boxWidth = Math.min(boxSpacing * 0.6, 40)

  const isTruncated = (data as unknown[]).length > MAX_BOXES

  return (
    <div ref={containerRef} className="dc:relative dc:w-full" style={{ height }}>
      <svg
        width="100%"
        height={isTruncated ? `calc(100% - 20px)` : '100%'}
        viewBox={`0 0 ${containerWidth} ${typeof containerHeight === 'number' ? containerHeight : 400}`}
        preserveAspectRatio="none"
        data-testid="boxplot-svg"
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Y Axis */}
          <YAxis
            scale={yScale}
            domainMin={domainMin}
            domainMax={domainMax}
            width={innerWidth}
            tickCount={5}
            format={yAxisFormat ? (v) => formatAxisValue(v, yAxisFormat) : undefined}
          />

          {/* Box plot elements */}
          {boxes.map((box, i) => {
            const cx = boxSpacing * i + boxSpacing / 2
            return (
              <g
                key={`${box.label}-${i}`}
                onClick={(event: React.MouseEvent) => {
                  if (onDataPointClick && drillEnabled) {
                    onDataPointClick({
                      dataPoint: { ...box },
                      clickedField: xField ?? '',
                      xValue: box.label,
                      position: { x: event.clientX, y: event.clientY },
                      nativeEvent: event,
                    })
                  }
                }}
                cursor={drillEnabled ? 'pointer' : undefined}
              >
                <BoxElement
                  x={cx}
                  boxWidth={boxWidth}
                  minY={yScale(box.min)}
                  q1Y={yScale(box.q1)}
                  medianY={yScale(box.median)}
                  q3Y={yScale(box.q3)}
                  maxY={yScale(box.max)}
                  color={box.color}
                  label={box.label}
                />
                {/* X axis label */}
                <text
                  x={cx}
                  y={innerHeight + 20}
                  textAnchor="middle"
                  fontSize={11}
                  fill="currentColor"
                  className="text-dc-text-secondary"
                  data-testid={`x-label-${box.label}`}
                >
                  {box.label}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
      {isTruncated && (
        <div className="dc:text-xs text-dc-text-muted dc:text-center dc:mt-1">
          Data truncated to {MAX_BOXES} groups (original: {(data as unknown[]).length})
        </div>
      )}
    </div>
  )
})

export default BoxPlotChart
