import { Scatter } from 'recharts'
import { CHART_COLORS } from '../../utils/chartConstants'
import type { ColorPalette } from '../../types'
import type { ScatterPoint } from './ScatterChart.helpers'

interface ScatterSeriesProps {
  hasSeries: boolean
  seriesKeys: string[]
  seriesGroups: Record<string, ScatterPoint[]>
  scatterData: ScatterPoint[]
  colorPalette?: ColorPalette
  hoveredLegend: string | null
}

/** Resolve the fill colour for a series index from the palette. */
function seriesColor(colorPalette: ColorPalette | undefined, index: number): string {
  return (colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) ||
    CHART_COLORS[index % CHART_COLORS.length]
}

/**
 * Renders the `<Scatter>` series for ScatterChart — one per series group when
 * `hasSeries`, otherwise a single series. Returned as a fragment so it composes
 * inside the Recharts chart children. Behaviour matches the original inline JSX.
 */
export function ScatterSeries({
  hasSeries,
  seriesKeys,
  seriesGroups,
  scatterData,
  colorPalette,
  hoveredLegend
}: ScatterSeriesProps) {
  if (hasSeries) {
    return (
      <>
        {seriesKeys.map((seriesKey, index) => (
          <Scatter
            key={seriesKey}
            name={seriesKey}
            data={seriesGroups[seriesKey]}
            fill={seriesColor(colorPalette, index)}
            fillOpacity={hoveredLegend ? (hoveredLegend === seriesKey ? 1 : 0.3) : 1}
          />
        ))}
      </>
    )
  }

  return (
    <Scatter
      name="Data"
      data={scatterData}
      fill={(colorPalette?.colors && colorPalette.colors[0]) || CHART_COLORS[0]}
    />
  )
}
