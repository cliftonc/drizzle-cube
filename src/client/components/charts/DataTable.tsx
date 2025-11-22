/**
 * Simple Data Table component
 * Minimal styling with Tailwind
 */

import { useCubeContext } from '../../providers/CubeProvider'
import type { ChartProps } from '../../types'

export default function DataTable({ 
  data, 
  chartConfig,
  height = 300 
}: ChartProps) {
  const { getFieldLabel } = useCubeContext()
  
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center w-full"
        style={{ height }}
      >
        <div className="text-center text-dc-text-muted">
          <div className="text-sm font-semibold mb-1">No data available</div>
          <div className="text-xs text-dc-text-secondary">No data to display in table</div>
        </div>
      </div>
    )
  }

  // Use chartConfig.xAxis to filter columns, or show all if not specified
  const allColumns = Object.keys(data[0] || {})
  const columns = chartConfig?.xAxis && chartConfig.xAxis.length > 0 
    ? chartConfig.xAxis.filter(col => allColumns.includes(col))
    : allColumns

  if (columns.length === 0) {
    return (
      <div
        className="flex items-center justify-center w-full"
        style={{ height }}
      >
        <div className="text-center text-dc-text-muted">
          <div className="text-sm font-semibold mb-1">No columns available</div>
          <div className="text-xs text-dc-text-secondary">Data structure is invalid</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-auto" style={{ height }}>
      <table className="min-w-full divide-y border-dc-border">
        <thead className="bg-dc-surface-secondary sticky top-0">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="px-3 py-2 text-left text-xs font-medium text-dc-text-muted uppercase tracking-wider"
              >
                {getFieldLabel(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-dc-surface divide-y border-dc-border">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-dc-surface-secondary">
              {columns.map((column) => (
                <td
                  key={column}
                  className="px-3 py-2 whitespace-nowrap text-sm text-dc-text"
                >
                  {formatCellValue(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatCellValue(value: any): string {
  if (value == null) return ''
  if (typeof value === 'number') {
    return value.toLocaleString()
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  return String(value)
}