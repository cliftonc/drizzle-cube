import { CHART_COLORS_GRADIENT } from '../../utils/chartConstants.js'
import type { AxisFormatConfig } from '../../types.js'
import {
  seriesMinMax,
  formatSeriesValue,
  type LegendEntry
} from './TreeMapChart.helpers.js'

interface TreeMapLegendProps {
  isNumericSeries: boolean
  seriesField?: string
  seriesLabel: string
  legendPayload: LegendEntry[]
  data: Record<string, any>[]
  leftYAxisFormat?: AxisFormatConfig
}

/** Gradient ramp legend for a numeric series field. */
function NumericLegend({
  seriesLabel,
  data,
  seriesField,
  leftYAxisFormat,
}: {
  seriesLabel: string
  data: Record<string, any>[]
  seriesField: string
  leftYAxisFormat?: AxisFormatConfig
}) {
  const { min, max } = seriesMinMax(data, seriesField)
  return (
    <div className="dc:flex dc:flex-col dc:items-center">
      <div className="dc:text-xs dc:font-semibold text-dc-text-primary dc:mb-2">
        {seriesLabel}
      </div>
      <div className="dc:flex dc:items-center dc:gap-2">
        <span className="dc:text-xs text-dc-text-muted">
          {formatSeriesValue(min, leftYAxisFormat)}
        </span>
        <div
          className="dc:h-4 dc:rounded-sm"
          style={{
            width: '200px',
            background: `linear-gradient(to right, ${CHART_COLORS_GRADIENT.join(', ')})`
          }}
        />
        <span className="dc:text-xs text-dc-text-muted">
          {formatSeriesValue(max, leftYAxisFormat)}
        </span>
      </div>
    </div>
  )
}

/** Discrete swatch legend for a categorical series field. */
function CategoricalLegend({ legendPayload }: { legendPayload: LegendEntry[] }) {
  return (
    <div className="dc:flex dc:flex-wrap dc:justify-center dc:gap-4">
      {legendPayload.map((item, index) => (
        <div key={index} className="dc:flex dc:items-center dc:gap-2">
          <div className="dc:w-3 dc:h-3 rounded-xs" style={{ backgroundColor: item.color }} />
          <span className="dc:text-xs text-dc-text-muted">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

/** Treemap legend wrapper — gradient for numeric series, swatches otherwise. */
export function TreeMapLegend({
  isNumericSeries,
  seriesField,
  seriesLabel,
  legendPayload,
  data,
  leftYAxisFormat,
}: TreeMapLegendProps) {
  return (
    <div className="dc:flex dc:justify-center dc:items-center dc:mt-4 dc:pb-2">
      {isNumericSeries && seriesField ? (
        <NumericLegend
          seriesLabel={seriesLabel}
          data={data}
          seriesField={seriesField}
          leftYAxisFormat={leftYAxisFormat}
        />
      ) : (
        <CategoricalLegend legendPayload={legendPayload} />
      )}
    </div>
  )
}
