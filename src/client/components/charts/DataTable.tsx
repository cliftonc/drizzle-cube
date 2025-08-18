/**
 * Simple Data Table component
 * Minimal styling with Tailwind
 */

import type { ChartProps } from '../../types'

export default function DataTable({ 
  data, 
  height = 300 
}: ChartProps) {
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center w-full text-gray-500" style={{ height }}>
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">No data available</div>
          <div className="text-xs">No data to display in table</div>
        </div>
      </div>
    )
  }

  const columns = Object.keys(data[0] || {})

  if (columns.length === 0) {
    return (
      <div className="flex items-center justify-center w-full text-gray-500" style={{ height }}>
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">No columns available</div>
          <div className="text-xs">Data structure is invalid</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-auto" style={{ height }}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td
                  key={column}
                  className="px-3 py-2 whitespace-nowrap text-sm text-gray-900"
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