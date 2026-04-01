import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { formatAxisValue } from '../../utils/chartUtils'
import type { ChartProps } from '../../types'

const BULL_COLOR_DEFAULT = '#22c55e'
const BEAR_COLOR_DEFAULT = '#ef4444'
const WICK_COLOR = '#94a3b8'
const MAX_CANDLES = 200

interface CandleData {
  label: string
  open: number
  close: number
  high: number
  low: number
  isBullish: boolean
  originalIndex: number
}

function parseNum(v: unknown): number | null {
  if (v === undefined || v === null) return null
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return isNaN(n) ? null : n
}

function Candle({
  x,
  candleWidth,
  openY,
  closeY,
  highY,
  lowY,
  isBullish,
  bullColor,
  bearColor,
  showWicks,
  label,
}: {
  x: number
  candleWidth: number
  openY: number
  closeY: number
  highY: number
  lowY: number
  isBullish: boolean
  bullColor: string
  bearColor: string
  showWicks: boolean
  label: string
}) {
  const fill = isBullish ? bullColor : bearColor
  const bodyTop = Math.min(openY, closeY)
  const bodyBottom = Math.max(openY, closeY)
  const bodyHeight = Math.max(bodyBottom - bodyTop, 1)
  const halfWidth = candleWidth / 2

  return (
    <g data-testid={`candle-${label}`}>
      <rect
        x={x - halfWidth}
        y={bodyTop}
        width={candleWidth}
        height={bodyHeight}
        fill={fill}
        data-testid={`candle-body-${label}`}
        data-bullish={isBullish}
      />
      {showWicks && (
        <>
          <line
            x1={x}
            y1={highY}
            x2={x}
            y2={bodyTop}
            stroke={WICK_COLOR}
            strokeWidth={1}
            data-testid={`wick-high-${label}`}
          />
          <line
            x1={x}
            y1={bodyBottom}
            x2={x}
            y2={lowY}
            stroke={WICK_COLOR}
            strokeWidth={1}
            data-testid={`wick-low-${label}`}
          />
        </>
      )}
    </g>
  )
}

function YAxisTicks({
  domainMin,
  domainMax,
  innerHeight,
  tickCount,
  format,
}: {
  domainMin: number
  domainMax: number
  innerHeight: number
  tickCount: number
  format?: (v: number) => string
}) {
  const ticks = useMemo(() => {
    const step = (domainMax - domainMin) / (tickCount - 1)
    return Array.from({ length: tickCount }, (_, i) => domainMin + i * step)
  }, [domainMin, domainMax, tickCount])

  const yScale = (v: number) => innerHeight - ((v - domainMin) / (domainMax - domainMin)) * innerHeight

  return (
    <g data-testid="y-axis">
      <line y1={0} y2={innerHeight} stroke="currentColor" strokeWidth={1} />
      {ticks.map((tick, i) => (
        <g key={i} transform={`translate(0, ${yScale(tick)})`}>
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
          <line x1={0} x2="100%" stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />
        </g>
      ))}
    </g>
  )
}

const CandlestickChart = React.memo(function CandlestickChart({
  data,
  chartConfig,
  displayConfig = {},
  height = '100%',
  onDataPointClick,
  drillEnabled,
}: ChartProps) {
  const { t } = useTranslation()
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

  const bullColor = displayConfig?.bullColor ?? BULL_COLOR_DEFAULT
  const bearColor = displayConfig?.bearColor ?? BEAR_COLOR_DEFAULT
  const showWicks = displayConfig?.showWicks ?? true
  const rangeMode = displayConfig?.rangeMode ?? 'ohlc'
  const yAxisFormat = displayConfig?.leftYAxisFormat

  const { xField, openField, closeField, highField, lowField, configError } = useMemo(() => {
    const xField = Array.isArray(chartConfig?.xAxis)
      ? chartConfig.xAxis[0]
      : chartConfig?.xAxis ?? chartConfig?.x

    const yAxisFields: string[] = Array.isArray(chartConfig?.yAxis)
      ? chartConfig.yAxis
      : []

    const openField = yAxisFields[0] ?? ''
    const closeField = (rangeMode === 'range' ? yAxisFields[0] : yAxisFields[1]) ?? ''
    const highField = (rangeMode === 'range' ? yAxisFields[0] : yAxisFields[2]) ?? ''
    const lowField = (rangeMode === 'range' ? yAxisFields[1] : yAxisFields[3]) ?? ''

    if (!xField) {
      return {
        xField,
        openField,
        closeField,
        highField,
        lowField,
        configError: 'Candlestick chart requires an X-Axis (time or category dimension)',
      }
    }

    if (rangeMode === 'range' && (!highField || !lowField)) {
      return {
        xField,
        openField,
        closeField,
        highField,
        lowField,
        configError: 'Range mode requires at least 2 measures (high, low) in Y-Axis',
      }
    }

    if (rangeMode === 'ohlc' && (!openField || !closeField)) {
      return {
        xField,
        openField,
        closeField,
        highField,
        lowField,
        configError: 'OHLC mode requires at least 2 measures (open, close) in Y-Axis',
      }
    }

    return { xField, openField, closeField, highField, lowField, configError: null }
  }, [chartConfig, rangeMode])

  const candles: CandleData[] = useMemo(() => {
    if (configError || !data || data.length === 0) return []
    const rows = (data as Record<string, unknown>[]).slice(0, MAX_CANDLES)
    const result: CandleData[] = []
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const label = String(row[xField!] ?? `Bar ${i + 1}`)
      const rawOpen = parseNum(row[openField])
      const rawClose = parseNum(row[closeField])
      if (rawOpen === null || rawClose === null) continue

      let open = rawOpen
      let close = rawClose
      const high = highField ? (parseNum(row[highField]) ?? Math.max(open, close)) : Math.max(open, close)
      const low = lowField ? (parseNum(row[lowField]) ?? Math.min(open, close)) : Math.min(open, close)

      if (rangeMode === 'range') {
        open = low
        close = high
      }

      result.push({
        label,
        open,
        close,
        high: Math.max(open, close, high),
        low: Math.min(open, close, low),
        isBullish: close >= open,
        originalIndex: i,
      })
    }
    return result
  }, [data, xField, openField, closeField, highField, lowField, rangeMode, configError])

  try {
    if (!data || data.length === 0) {
      return (
        <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted" style={{ height }}>
          <div className="dc:text-center">
            <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.noData')}</div>
            <div className="dc:text-xs text-dc-text-secondary">{t('chart.runtime.noDataHint.candlestick')}</div>
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
    const margin = { top: 20, right: 20, bottom: 60, left: 70 }
    const containerWidth = dimensions.width || 600
    const containerHeight =
      typeof height === 'number' ? height : dimensions.height || 400
    const innerWidth = Math.max(containerWidth - margin.left - margin.right, 50)
    const innerHeight = Math.max(
      (typeof containerHeight === 'number' ? containerHeight : parseInt(String(containerHeight)) || 400) -
        margin.top -
        margin.bottom,
      50
    )

    const allValues = candles.flatMap((c) => [c.low, c.high])
    const rawMin = Math.min(...allValues)
    const rawMax = Math.max(...allValues)
    const pad = (rawMax - rawMin) * 0.05 || 1
    const domainMin = rawMin - pad
    const domainMax = rawMax + pad

    const yScale = (v: number) =>
      innerHeight - ((v - domainMin) / (domainMax - domainMin)) * innerHeight

    const candleSpacing = innerWidth / candles.length
    const candleWidth = Math.min(candleSpacing * 0.7, 20)

    const isTruncated = (data as unknown[]).length > MAX_CANDLES

    return (
      <div ref={containerRef} className="dc:relative dc:w-full" style={{ height }}>
        <svg
          width="100%"
          height={isTruncated ? 'calc(100% - 20px)' : '100%'}
          viewBox={`0 0 ${containerWidth} ${typeof containerHeight === 'number' ? containerHeight : 400}`}
          data-testid="candlestick-svg"
        >
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            <YAxisTicks
              domainMin={domainMin}
              domainMax={domainMax}
              innerHeight={innerHeight}
              tickCount={5}
              format={yAxisFormat ? (v) => formatAxisValue(v, yAxisFormat) : undefined}
            />

            {candles.map((candle, i) => {
              const cx = candleSpacing * i + candleSpacing / 2
              return (
                <g
                  key={candle.label + i}
                  onClick={(event: React.MouseEvent) => {
                    if (onDataPointClick && drillEnabled) {
                      onDataPointClick({
                        dataPoint: { ...candle },
                        clickedField: xField ?? '',
                        xValue: candle.label,
                        position: { x: event.clientX, y: event.clientY },
                        nativeEvent: event,
                      })
                    }
                  }}
                  cursor={drillEnabled ? 'pointer' : undefined}
                >
                  <title>{`${candle.label}: O=${candle.open} H=${candle.high} L=${candle.low} C=${candle.close}`}</title>
                  <Candle
                    x={cx}
                    candleWidth={candleWidth}
                    openY={yScale(candle.open)}
                    closeY={yScale(candle.close)}
                    highY={yScale(candle.high)}
                    lowY={yScale(candle.low)}
                    isBullish={candle.isBullish}
                    bullColor={bullColor}
                    bearColor={bearColor}
                    showWicks={showWicks}
                    label={candle.label}
                  />
                  <text
                    x={cx}
                    y={innerHeight + 20}
                    textAnchor="middle"
                    fontSize={10}
                    fill="currentColor"
                    className="text-dc-text-secondary"
                    data-testid={`x-label-${candle.label}`}
                  >
                    {candle.label}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>
        {isTruncated && (
          <div className="dc:text-xs text-dc-warning dc:text-center dc:mt-1">
            {t('chart.runtime.candlestick.truncated', {
              max: MAX_CANDLES,
              total: (data as unknown[]).length
            })}
          </div>
        )}
      </div>
    )
  } catch (error) {
    return (
      <div className="dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full text-dc-error dc:p-4" style={{ height }}>
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.chartError', { chartType: 'Candlestick Chart' })}</div>
          <div className="dc:text-xs dc:mb-2">{error instanceof Error ? error.message : t('chart.runtime.unknownError')}</div>
          <div className="dc:text-xs text-dc-text-muted">{t('chart.runtime.checkConfig')}</div>
        </div>
      </div>
    )
  }
})

export default CandlestickChart
