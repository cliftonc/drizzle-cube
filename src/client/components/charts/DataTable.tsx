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
  getOrderedColumnsFromQuery,
  type PivotedTableData,
  type PivotColumn,
  type PivotRow
} from '../../utils/pivotUtils'
import { formatAxisValue } from '../../utils/chartUtils'
import type { ChartProps, AxisFormatConfig } from '../../types'

export default function DataTable({
  data,
  chartConfig,
  displayConfig = {},
  queryObject,
  height = 300
}: ChartProps) {
  const { getFieldLabel, meta } = useCubeContext()

  // Detect if we should pivot based on query structure
  // Pass chartConfig.xAxis to respect user-configured column ordering
  const pivotConfig = useMemo(
    () => hasTimeDimensionForPivot(queryObject, chartConfig?.xAxis),
    [queryObject, chartConfig?.xAxis]
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
        leftYAxisFormat={displayConfig?.leftYAxisFormat}
      />
    )
  }

  // Fallback to flat table rendering
  return (
    <FlatTable
      data={data}
      chartConfig={chartConfig}
      queryObject={queryObject}
      height={height}
      getFieldLabel={getFieldLabel}
      leftYAxisFormat={displayConfig?.leftYAxisFormat}
    />
  )
}

/**
 * Pivoted table component - renders time dimension as columns
 */
function PivotedTable({
  pivotedData,
  height,
  meta,
  leftYAxisFormat
}: {
  pivotedData: PivotedTableData
  height: number | string
  meta: any
  leftYAxisFormat?: AxisFormatConfig
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
              leftYAxisFormat={leftYAxisFormat}
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
  meta,
  leftYAxisFormat
}: {
  row: PivotRow
  columns: PivotColumn[]
  meta: any
  leftYAxisFormat?: AxisFormatConfig
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

        // Time column - right-aligned, formatted values (these are measure values)
        if (col.isTimeColumn) {
          return (
            <td
              key={col.key}
              className="px-3 py-2 whitespace-nowrap text-sm text-right text-dc-text"
            >
              {formatPivotCellValue(value, leftYAxisFormat)}
            </td>
          )
        }

        // Dimension column - left-aligned (no row spanning) - no number formatting
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
function formatPivotCellValue(value: any, formatConfig?: AxisFormatConfig): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') {
    // Use formatAxisValue if config provided
    if (formatConfig) {
      return formatAxisValue(value, formatConfig)
    }
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
  queryObject,
  height,
  getFieldLabel,
  leftYAxisFormat
}: {
  data: any[]
  chartConfig?: { xAxis?: string[] }
  queryObject?: ChartProps['queryObject']
  height: number | string
  getFieldLabel: (field: string) => string
  leftYAxisFormat?: AxisFormatConfig
}) {
  // Get all columns available in data
  const allColumns = Object.keys(data[0] || {})

  // Determine column order with proper fallback:
  // 1. If xAxis is configured, use that order
  // 2. Otherwise, derive order from queryObject (dimensions + timeDimensions + measures)
  // 3. Fallback: Object.keys order
  const columns = useMemo(() => {
    // If xAxis is configured, use that order (filtered to existing columns)
    if (chartConfig?.xAxis && chartConfig.xAxis.length > 0) {
      return chartConfig.xAxis.filter(col => allColumns.includes(col))
    }

    // Derive order from queryObject
    const queryOrder = getOrderedColumnsFromQuery(queryObject)
    if (queryOrder.length > 0) {
      // Filter to only columns that exist in data
      const ordered = queryOrder.filter(col => allColumns.includes(col))
      // Add any columns in data that weren't in query (edge case)
      const remaining = allColumns.filter(col => !ordered.includes(col))
      return [...ordered, ...remaining]
    }

    // Final fallback: Object.keys order
    return allColumns
  }, [chartConfig?.xAxis, queryObject, allColumns])

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
                  {formatCellValue(row[column], leftYAxisFormat)}
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
function formatCellValue(value: any, formatConfig?: AxisFormatConfig): string {
  if (value == null) return ''
  if (typeof value === 'number') {
    // Use formatAxisValue if config provided
    if (formatConfig) {
      return formatAxisValue(value, formatConfig)
    }
    return value.toLocaleString()
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  return String(value)
}
