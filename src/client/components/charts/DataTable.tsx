/**
 * Data Table component with time dimension pivoting
 *
 * When a query includes a time dimension with granularity, the table
 * automatically pivots to show time periods as columns.
 */

import { useMemo } from 'react'
import { useCubeContext } from '../../providers/CubeProvider'
import { getMeasureTypeIcon } from '../../icons'
import {
  hasTimeDimensionForPivot,
  pivotTableData,
  getMeasureType,
  type PivotedTableData,
  type PivotColumn,
  type PivotRow
} from '../../utils/pivotUtils'
import type { ChartProps } from '../../types'

export default function DataTable({
  data,
  chartConfig,
  displayConfig = {},
  queryObject,
  height = 300
}: ChartProps) {
  const { getFieldLabel, meta } = useCubeContext()

  // Detect if we should pivot based on query structure
  const pivotConfig = useMemo(
    () => hasTimeDimensionForPivot(queryObject),
    [queryObject]
  )

  // Check if pivoting is enabled (default: true when time dimension present)
  const enablePivot = displayConfig?.pivotTimeDimension !== false

  // Compute pivoted data if applicable
  const pivotedData = useMemo<PivotedTableData | null>(() => {
    if (!pivotConfig || !enablePivot) return null
    return pivotTableData(data, pivotConfig, getFieldLabel, meta)
  }, [data, pivotConfig, enablePivot, getFieldLabel, meta])

  // Empty state
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

  // Render pivoted table if applicable
  if (pivotedData?.isPivoted && pivotedData.columns.length > 0) {
    return (
      <PivotedTable
        pivotedData={pivotedData}
        height={height}
        meta={meta}
      />
    )
  }

  // Fallback to flat table rendering
  return (
    <FlatTable
      data={data}
      chartConfig={chartConfig}
      height={height}
      getFieldLabel={getFieldLabel}
    />
  )
}

/**
 * Pivoted table component - renders time dimension as columns
 */
function PivotedTable({
  pivotedData,
  height,
  meta
}: {
  pivotedData: PivotedTableData
  height: number | string
  meta: any
}) {
  const { columns, rows } = pivotedData

  if (columns.length === 0 || rows.length === 0) {
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

  return (
    <div className="w-full overflow-auto" style={{ height }}>
      <table className="min-w-full divide-y border-dc-border">
        <thead className="bg-dc-surface-secondary sticky top-0">
          <tr>
            {columns.map((col: PivotColumn) => (
              <th
                key={col.key}
                className={`px-3 py-2 text-xs font-medium text-dc-text-muted uppercase tracking-wider whitespace-nowrap ${
                  col.isTimeColumn ? 'text-right' : 'text-left'
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-dc-surface divide-y border-dc-border">
          {rows.map((row: PivotRow) => (
            <PivotedTableRow
              key={row.id}
              row={row}
              columns={columns}
              meta={meta}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Single row in the pivoted table
 * Supports row spanning for measure cells when grouped by measure
 */
function PivotedTableRow({
  row,
  columns,
  meta
}: {
  row: PivotRow
  columns: PivotColumn[]
  meta: any
}) {
  // Get measure icon for this row
  const measureType = getMeasureType(row.measureField, meta)
  const MeasureIcon = getMeasureTypeIcon(measureType)

  return (
    <tr className="hover:bg-dc-surface-secondary">
      {columns.map((col: PivotColumn) => {
        const value = row.values[col.key]

        // Measure column - show icon + label with row spanning
        if (col.isMeasureColumn) {
          // Skip this cell if not first in measure group
          if (row.isFirstInGroup === false) {
            return null
          }

          return (
            <td
              key={col.key}
              className="px-3 py-2 whitespace-nowrap text-sm text-dc-text align-top"
              rowSpan={row.dimensionRowSpan}
            >
              <div className="flex items-center">
                <MeasureIcon className="w-3.5 h-3.5 mr-1.5 text-dc-text-muted shrink-0" />
                <span>{value}</span>
              </div>
            </td>
          )
        }

        // Time column - right-aligned, formatted values
        if (col.isTimeColumn) {
          return (
            <td
              key={col.key}
              className="px-3 py-2 whitespace-nowrap text-sm text-right text-dc-text"
            >
              {formatPivotCellValue(value)}
            </td>
          )
        }

        // Dimension column - left-aligned (no row spanning)
        return (
          <td
            key={col.key}
            className="px-3 py-2 whitespace-nowrap text-sm text-dc-text"
          >
            {formatPivotCellValue(value)}
          </td>
        )
      })}
    </tr>
  )
}

/**
 * Format cell value for pivoted table display
 * Shows "-" for null/undefined values
 */
function formatPivotCellValue(value: any): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') {
    // Format with locale and up to 2 decimal places
    if (Number.isInteger(value)) {
      return value.toLocaleString()
    }
    return parseFloat(value.toFixed(2)).toLocaleString()
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  return String(value)
}

/**
 * Flat table component - original non-pivoted table rendering
 */
function FlatTable({
  data,
  chartConfig,
  height,
  getFieldLabel
}: {
  data: any[]
  chartConfig?: { xAxis?: string[] }
  height: number | string
  getFieldLabel: (field: string) => string
}) {
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

/**
 * Format cell value for flat table display
 */
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
