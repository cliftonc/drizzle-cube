import { formatAxisValue } from '../../utils/chartUtils.js'
import type { AxisFormatConfig } from '../../types.js'
import type { ScatterPoint } from './ScatterChart.helpers.js'

interface ScatterTooltipProps {
  active?: boolean
  payload?: Array<{ payload?: ScatterPoint }>
  xAxisField: string
  yAxisField: string
  xAxisFormat?: AxisFormatConfig
  yAxisFormat?: AxisFormatConfig
  getFieldLabel: (field: string) => string
}

/**
 * Custom Recharts tooltip content for ScatterChart.
 *
 * Extracted from the inline `content` render prop to keep the chart body lean.
 * Renders the point name, any time-dimension values, and the formatted x/y.
 */
export function ScatterTooltip({
  active,
  payload,
  xAxisField,
  yAxisField,
  xAxisFormat,
  yAxisFormat,
  getFieldLabel
}: ScatterTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  // Only show the first (active) point
  const point = payload[0]?.payload
  if (!point) return null

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      color: '#1f2937',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '8px 12px'
    }}>
      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{point.name}</div>
      {/* Show time dimension values if present */}
      {point.timeValues && Object.keys(point.timeValues).length > 0 && (
        <div style={{ marginBottom: '4px', color: '#6b7280' }}>
          {Object.entries(point.timeValues).map(([field, value]) => (
            <div key={field}>{getFieldLabel(field)}: {value as string}</div>
          ))}
        </div>
      )}
      <div>{xAxisFormat?.label || getFieldLabel(xAxisField)}: {formatAxisValue(point.x, xAxisFormat)}</div>
      <div>{yAxisFormat?.label || getFieldLabel(yAxisField)}: {formatAxisValue(point.y, yAxisFormat)}</div>
    </div>
  )
}
