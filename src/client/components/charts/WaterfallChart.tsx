import React, { useMemo } from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Cell, LabelList, Legend } from 'recharts'
import ChartContainer from './ChartContainer'
import ChartTooltip from './ChartTooltip'
import AngledXAxisTick from './AngledXAxisTick'
import { CHART_MARGINS } from '../../utils/chartConstants'
import { formatAxisValue } from '../../utils/chartUtils'
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel'
import type { ChartProps } from '../../types'

const POSITIVE_COLOR = '#22c55e'
const NEGATIVE_COLOR = '#ef4444'
const TOTAL_COLOR = '#6366f1'
const CONNECTOR_COLOR = '#94a3b8'

interface WaterfallDataPoint {
  label: string
  value: number
  runningBase: number
  isTotal: boolean
  isNegative: boolean
  displayValue: number
  originalIndex: number
}

function transformToWaterfall(
  data: Record<string, unknown>[],
  xField: string,
  yField: string,
  showTotal: boolean,
  getFieldLabel: (field: string) => string
): WaterfallDataPoint[] {
  let running = 0
  const result: WaterfallDataPoint[] = data.map((row, i) => {
    const label = String(row[xField] ?? `Row ${i + 1}`)
    const rawValue = row[yField]
    const value = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue ?? 0)) || 0
    const isNegative = value < 0
    const base = isNegative ? running + value : running
    const point: WaterfallDataPoint = {
      label,
      value: Math.abs(value),
      runningBase: base,
      isTotal: false,
      isNegative,
      displayValue: value,
      originalIndex: i,
    }
    running += value
    return point
  })

  if (showTotal) {
    const totalLabel = getFieldLabel(yField) || 'Total'
    result.push({
      label: totalLabel,
      value: Math.abs(running),
      runningBase: running >= 0 ? 0 : running,
      isTotal: true,
      isNegative: running < 0,
      displayValue: running,
      originalIndex: result.length,
    })
  }

  return result
}

// Custom label that shows the actual value above/below the bar
interface ValueLabelProps {
  x?: number
  y?: number
  width?: number
  value?: number
  isNegative?: boolean
  displayValue?: number
}

function ValueLabel(props: ValueLabelProps) {
  const { x = 0, y = 0, width = 0, value = 0, isNegative, displayValue } = props
  if (displayValue === undefined || displayValue === null) return null
  const numericValue = Number(displayValue)
  const isNeg = isNegative || numericValue < 0
  const yPos = isNeg ? y + value + 14 : y - 6
  return (
    <text
      x={x + width / 2}
      y={yPos}
      fill="currentColor"
      textAnchor="middle"
      fontSize={11}
    >
      {numericValue >= 0 ? '+' : ''}{numericValue.toLocaleString()}
    </text>
  )
}

const WaterfallChart = React.memo(function WaterfallChart({
  data,
  chartConfig,
  displayConfig = {},
  height = '100%',
  onDataPointClick,
  drillEnabled,
}: ChartProps) {
  const getFieldLabel = useCubeFieldLabel()

  const dc = displayConfig as Record<string, unknown>
  const showTotal: boolean = (dc?.showTotal as boolean) ?? true
  const showConnectorLine: boolean = (dc?.showConnectorLine as boolean) ?? true
  const showDataLabels: boolean = (dc?.showDataLabels as boolean) ?? false
  const yAxisFormat = displayConfig?.leftYAxisFormat

  const { xAxisField, yAxisField, configError } = useMemo(() => {
    const xAxisField: string | undefined = Array.isArray(chartConfig?.xAxis)
      ? chartConfig.xAxis[0]
      : chartConfig?.x
    const yAxisField: string | undefined = Array.isArray(chartConfig?.yAxis)
      ? chartConfig.yAxis[0]
      : chartConfig?.y?.[0]
    const configError =
      !xAxisField || !yAxisField
        ? 'Waterfall chart requires an X-axis dimension and a Y-axis measure'
        : null
    return { xAxisField, yAxisField, configError }
  }, [chartConfig])

  const waterfallData = useMemo(() => {
    if (configError || !data || data.length === 0 || !xAxisField || !yAxisField) return []
    return transformToWaterfall(
      data as Record<string, unknown>[],
      xAxisField,
      yAxisField,
      showTotal,
      getFieldLabel
    )
  }, [data, xAxisField, yAxisField, showTotal, getFieldLabel, configError])

  // Connector line data: connects top of each bar to top of next bar
  const connectorData = useMemo(() => {
    if (!showConnectorLine || waterfallData.length === 0) return []
    return waterfallData.map((d) => {
      const connectorY = d.isNegative ? d.runningBase : d.runningBase + d.value
      return { label: d.label, _connector: connectorY }
    })
  }, [waterfallData, showConnectorLine])

  // Merge connector into main data
  const chartData = useMemo(() => {
    return waterfallData.map((d, i) => ({
      ...d,
      _connector: connectorData[i]?._connector,
    }))
  }, [waterfallData, connectorData])

  if (!data || data.length === 0) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted" style={{ height }}>
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">No data available</div>
          <div className="dc:text-xs text-dc-text-secondary">No data points to display in waterfall chart</div>
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

  return (
    <div className="dc:relative dc:w-full" style={{ height }}>
      <ChartContainer height="100%">
        <ComposedChart data={chartData} margin={{ ...CHART_MARGINS, left: 40 }} accessibilityLayer={false}>
          <CartesianGrid strokeDasharray="3 3" style={{ pointerEvents: 'none' }} />
          <XAxis dataKey="label" type="category" tick={<AngledXAxisTick />} height={60} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={yAxisFormat ? (v) => formatAxisValue(v, yAxisFormat) : undefined}
          />
          <ChartTooltip
            formatter={(value: any, name: any, props: any) => {
              if (name === '_connector') return ['', '']
              const entry = props?.payload
              if (!entry) return [value, name]
              const displayValue = entry.displayValue ?? value
              return [
                yAxisFormat ? formatAxisValue(displayValue, yAxisFormat) : displayValue?.toLocaleString?.() ?? displayValue,
                entry.isTotal ? 'Total' : entry.isNegative ? 'Decrease' : 'Increase',
              ]
            }}
            labelFormatter={(label: string) => label}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            {...{
              payload: [
                { value: 'Increase', type: 'rect' as const, color: POSITIVE_COLOR },
                { value: 'Decrease', type: 'rect' as const, color: NEGATIVE_COLOR },
                ...(showTotal ? [{ value: 'Total', type: 'rect' as const, color: TOTAL_COLOR }] : []),
              ],
            }}
          />
          {/* Transparent spacer bar to float the value bar */}
          <Bar dataKey="runningBase" stackId="wf" fill="transparent" legendType="none" isAnimationActive={false} />
          {/* Actual value bar */}
          <Bar
            dataKey="value"
            stackId="wf"
            isAnimationActive={false}
            cursor={drillEnabled ? 'pointer' : undefined}
            onClick={(barData: any, _index: number, event: React.MouseEvent) => {
              if (onDataPointClick && drillEnabled && barData && !barData.isTotal) {
                onDataPointClick({
                  dataPoint: barData,
                  clickedField: yAxisField!,
                  xValue: barData.label,
                  position: { x: event.clientX, y: event.clientY },
                  nativeEvent: event,
                })
              }
            }}
          >
            {showDataLabels && (
              <LabelList
                dataKey="displayValue"
                content={(props: any) => (
                  <ValueLabel
                    {...props}
                    runningBase={chartData[props.index]?.runningBase}
                    isNegative={chartData[props.index]?.isNegative}
                    displayValue={chartData[props.index]?.displayValue}
                  />
                )}
              />
            )}
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isTotal ? TOTAL_COLOR : entry.isNegative ? NEGATIVE_COLOR : POSITIVE_COLOR}
              />
            ))}
          </Bar>
          {/* Connector line */}
          {showConnectorLine && (
            <Line
              type="stepAfter"
              dataKey="_connector"
              stroke={CONNECTOR_COLOR}
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              activeDot={false}
              legendType="none"
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ChartContainer>
    </div>
  )
})

export default WaterfallChart
