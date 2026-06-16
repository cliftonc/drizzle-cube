import { ResponsiveHeatMap } from '@nivo/heatmap'
import {
  getContrastingTextColor,
  makeAxisFormatter,
  makeValueFormatter,
  resolveHeatMapColors,
  type HeatMapDisplayOptions
} from './HeatMapChart.helpers.js'

interface HeatMapDatum {
  x: string
  y: number | null
}
interface HeatMapSerie {
  id: string
  data: HeatMapDatum[]
}

interface HeatMapCanvasProps {
  data: HeatMapSerie[]
  truncated: boolean
  colors: string[]
  options: HeatMapDisplayOptions
  xAxisField: string
  yAxisField: string
  valueField: string
}

const NIVO_THEME = {
  text: { fill: 'var(--dc-text)' },
  axis: {
    legend: { text: { fill: 'var(--dc-text)' } },
    ticks: { text: { fill: 'var(--dc-text-secondary)' } },
  },
  legends: {
    text: { fill: 'var(--dc-text-secondary)' },
    title: { text: { fill: 'var(--dc-text)' } },
  },
  tooltip: {
    container: {
      background: 'var(--dc-surface)',
      color: 'var(--dc-text)',
      borderRadius: '4px',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
    },
  },
}

/**
 * The nivo `<ResponsiveHeatMap>` for HeatMapChart, with all axis/legend/colour
 * config resolved from helpers. Extracted so the chart component stays a thin
 * orchestrator. Behaviour matches the original inline JSX.
 */
export function HeatMapCanvas({
  data,
  truncated,
  colors,
  options,
  xAxisField,
  yAxisField,
  valueField,
}: HeatMapCanvasProps) {
  const { showLabels, cellShape, showLegend, xAxisFormat, yAxisFormat, valueFormat } = options

  return (
    <ResponsiveHeatMap
      data={data}
      margin={{ top: truncated ? 40 : 20, right: 20, bottom: 120, left: 120 }}
      valueFormat={makeValueFormatter(valueFormat)}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: -45,
        legend: xAxisFormat?.label || xAxisField?.split('.').pop() || 'X Axis',
        legendPosition: 'middle',
        legendOffset: 70,
        format: makeAxisFormatter(xAxisFormat),
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: yAxisFormat?.label || yAxisField?.split('.').pop() || 'Y Axis',
        legendPosition: 'middle',
        legendOffset: -80,
        format: makeAxisFormatter(yAxisFormat),
      }}
      colors={resolveHeatMapColors(colors)}
      emptyColor="var(--dc-surface-tertiary)"
      cellComponent={cellShape === 'circle' ? 'circle' : 'rect'}
      enableLabels={showLabels}
      labelTextColor={({ color }) => getContrastingTextColor(color)}
      legends={
        showLegend
          ? [
              {
                anchor: 'bottom',
                translateX: 0,
                translateY: 95,
                length: 400,
                thickness: 8,
                direction: 'row',
                tickPosition: 'after',
                tickSize: 3,
                tickSpacing: 4,
                tickOverlap: false,
                title: valueField?.split('.').pop() || 'Value',
                titleAlign: 'start',
                titleOffset: 4,
              },
            ]
          : []
      }
      annotations={[]}
      theme={NIVO_THEME}
    />
  )
}
