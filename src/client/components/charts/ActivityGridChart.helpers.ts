/**
 * Co-located data/config helpers for ActivityGridChart (no D3 side effects).
 */
import { formatTimeValue } from '../../utils/chartUtils'
import type { CubeQuery } from '../../types'

export interface GridCell {
  x: number
  y: number
  value: number
  date: Date
  label: string
}

export interface GridMapping {
  extractX: (date: Date) => number
  extractY: (date: Date) => number
  xLabels: string[]
  yLabels: string[]
  xFormat: (value: number) => string
  yFormat: (value: number) => string
  cellWidth: number
  cellHeight: number
  hasHierarchicalLabels?: boolean
  getYearFromX?: (value: number) => number
}

const getQuarter = (date: Date): number => Math.floor(date.getMonth() / 3) + 1 // 1-4
const getMonthOfQuarter = (date: Date): number => (date.getMonth() % 3) + 1 // 1-3
const getWeekOfMonth = (date: Date): number => Math.floor((date.getDate() - 1) / 7) + 1 // 1-5

const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const QUARTER_LABELS = ['Q1', 'Q2', 'Q3', 'Q4']
const MONTH_OF_QUARTER_LABELS = ['Month 1', 'Month 2', 'Month 3']
const WEEK_LABELS = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5']
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOUR_BLOCK_LABELS = ['00-03', '03-06', '06-09', '09-12', '12-15', '15-18', '18-21', '21-00']

/** Week-of-year (1-53) with the ISO-aligned year for the given date. */
export function getWeekOfYear(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const year = d.getUTCFullYear()
  const yearStart = new Date(Date.UTC(year, 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return { year, week }
}

const GRID_MAPPINGS: Record<string, GridMapping> = {
  quarter: {
    extractX: (date) => date.getFullYear(),
    extractY: (date) => getQuarter(date) - 1,
    xLabels: [],
    yLabels: QUARTER_LABELS,
    xFormat: (value) => `'${value.toString().slice(-2)}`,
    yFormat: (value) => QUARTER_LABELS[value] || '',
    cellWidth: 16,
    cellHeight: 16
  },
  month: {
    extractX: (date) => date.getFullYear() * 10 + getQuarter(date),
    extractY: (date) => getMonthOfQuarter(date) - 1,
    xLabels: [],
    yLabels: MONTH_OF_QUARTER_LABELS,
    xFormat: (value) => `Q${value % 10}`,
    yFormat: (value) => MONTH_OF_QUARTER_LABELS[value] || '',
    cellWidth: 16,
    cellHeight: 16,
    hasHierarchicalLabels: true,
    getYearFromX: (value) => Math.floor(value / 10)
  },
  week: {
    extractX: (date) => date.getFullYear() * 100 + (date.getMonth() + 1),
    extractY: (date) => getWeekOfMonth(date) - 1,
    xLabels: [],
    yLabels: WEEK_LABELS,
    xFormat: (value) => MONTH_INITIALS[(value % 100) - 1] || '',
    yFormat: (value) => WEEK_LABELS[value] || '',
    cellWidth: 16,
    cellHeight: 16,
    hasHierarchicalLabels: true,
    getYearFromX: (value) => Math.floor(value / 100)
  },
  day: {
    extractX: (date) => {
      const { year, week } = getWeekOfYear(date)
      return year * 100 + week
    },
    extractY: (date) => date.getDay(),
    xLabels: [],
    yLabels: DAY_LABELS,
    xFormat: (value) => `${value % 100}`,
    yFormat: (value) => DAY_LABELS[value] || '',
    cellWidth: 16,
    cellHeight: 16,
    hasHierarchicalLabels: true,
    getYearFromX: (value) => Math.floor(value / 100)
  },
  hour: {
    extractX: (date) =>
      date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate(),
    extractY: (date) => Math.floor(date.getHours() / 3),
    xLabels: [],
    yLabels: HOUR_BLOCK_LABELS,
    xFormat: (value) => `${value % 100}`,
    yFormat: (value) => HOUR_BLOCK_LABELS[value] || '',
    cellWidth: 16,
    cellHeight: 16,
    hasHierarchicalLabels: true,
    getYearFromX: (value) => Math.floor(value / 100)
  }
}

/** Get the grid coordinate mapping for a granularity (null when unsupported). */
export function getGridMapping(granularity: string): GridMapping | null {
  return GRID_MAPPINGS[granularity?.toLowerCase()] ?? null
}

/** Resolve the first matching field (string | array) for a date config value. */
export function firstDateField(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined
  return Array.isArray(value) ? value[0] : value
}

/** Get the query granularity for the date field, falling back to 'day'. */
export function getQueryGranularity(
  queryObject: CubeQuery | undefined,
  dateField: string
): string {
  const timeDims = queryObject?.timeDimensions
  if (!timeDims || timeDims.length === 0) return 'day'

  const timeDim = timeDims.find(
    (td: { dimension: string }) => td.dimension === dateField || td.dimension.includes(dateField)
  )
  if (timeDim && timeDim.granularity) return timeDim.granularity

  const firstTimeDim = timeDims[0]
  if (firstTimeDim && firstTimeDim.granularity) return firstTimeDim.granularity

  return 'day'
}

/** Parse a raw cell date value (string variants or number) to a Date. */
function parseCellDate(dateValue: unknown): Date {
  if (typeof dateValue === 'string') {
    let isoStr = dateValue
    if (dateValue.includes(' ')) {
      isoStr = dateValue.replace(' ', 'T').replace('+00', 'Z').replace(/\+\d{2}:\d{2}$/, 'Z')
    }
    if (!isoStr.endsWith('Z') && !isoStr.includes('+')) {
      isoStr = isoStr + 'Z'
    }
    return new Date(isoStr)
  }
  return new Date(dateValue as number)
}

/** Transform query rows into grid cells, skipping invalid dates. */
export function buildGridData(
  data: Record<string, any>[],
  dateField: string,
  valueField: string,
  gridMapping: GridMapping,
  granularity: string
): GridCell[] {
  return data
    .map((item) => {
      const dateValue = item[dateField]
      const value =
        typeof item[valueField] === 'string' ? parseFloat(item[valueField]) : item[valueField] || 0
      const date = parseCellDate(dateValue)
      if (isNaN(date.getTime())) return null

      return {
        x: gridMapping.extractX(date),
        y: gridMapping.extractY(date),
        value,
        date,
        label: formatTimeValue(dateValue, granularity)
      }
    })
    .filter((cell): cell is GridCell => cell !== null)
}
