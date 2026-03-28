/**
 * XLSX Export Utility
 *
 * Provides optional XLSX export functionality for portlet data.
 * Requires exceljs as an optional peer dependency.
 *
 * Adapted from Guidemode's xlsx-helpers.ts with theme-aware formatting
 * that resolves drizzle-cube CSS variables at export time.
 *
 * Usage:
 * 1. Install the optional dependency: npm install exceljs
 * 2. Enable in CubeProvider: features={{ xlsExport: { enabled: true } }}
 * 3. Download button appears on portlets with data
 */

import type { XlsExportFeatureConfig } from '../types'
import type { FlowChartData } from '../types/flow'
import type { RetentionChartData } from '../types/retention'
import type { PortletDebugDataEntry } from '../stores/dashboardStore'

// Type for ExcelJS module (optional dependency)
type ExcelJSModule = { Workbook: new () => ExcelJSWorkbook }

// Minimal ExcelJS types for the subset of API we use
interface ExcelJSWorkbook {
  addWorksheet: (name: string) => ExcelJSWorksheet
  xlsx: { writeBuffer: () => Promise<ArrayBuffer> }
}

interface ExcelJSWorksheet {
  addRow: (values: unknown[]) => ExcelJSRow
  getRow: (rowNumber: number) => ExcelJSRow
  columns?: ExcelJSColumn[]
  views: Array<{ state: string; ySplit: number }>
  autoFilter: { from: { row: number; column: number }; to: { row: number; column: number } }
  eachRow: (callback: (row: ExcelJSRow) => void) => void
}

interface ExcelJSRow {
  number: number
  height: number
  eachCell: (callback: (cell: ExcelJSCell) => void) => void
}

interface ExcelJSColumn {
  width: number
  eachCell?: (options: { includeEmpty: boolean }, callback: (cell: ExcelJSCell) => void) => void
}

interface ExcelJSCell {
  value: unknown
  font: Record<string, unknown>
  fill: Record<string, unknown>
  alignment: Record<string, unknown>
  border: Record<string, unknown>
}

// Cache the import result to avoid repeated dynamic imports
let excelModule: ExcelJSModule | null = null
let moduleChecked = false

// ============================================================================
// Theme Color Resolution
// ============================================================================

interface ThemeColors {
  headerBg: string    // ARGB hex for header background
  headerText: string  // ARGB hex for header text
  borderColor: string // ARGB hex for cell borders
}

/** Default colors (light theme fallback) */
const DEFAULT_THEME_COLORS: ThemeColors = {
  headerBg: 'FF3B82F6',     // --dc-primary light default
  headerText: 'FFFFFFFF',   // --dc-primary-content light default
  borderColor: 'FFE5E7EB',  // --dc-border light default
}

/**
 * Convert a CSS color string (hex, rgb, rgba) to ARGB hex format for ExcelJS.
 * Returns null if the color cannot be parsed.
 */
function cssColorToArgb(cssColor: string): string | null {
  if (!cssColor) return null

  const trimmed = cssColor.trim()

  // Handle #hex format
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1)
    if (hex.length === 3) {
      const expanded = hex.split('').map(c => c + c).join('')
      return `FF${expanded.toUpperCase()}`
    }
    if (hex.length === 6) {
      return `FF${hex.toUpperCase()}`
    }
    if (hex.length === 8) {
      // Already has alpha: RRGGBBAA → AARRGGBB
      return `${hex.slice(6, 8)}${hex.slice(0, 6)}`.toUpperCase()
    }
    return null
  }

  // Handle rgb/rgba format
  const rgbMatch = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/)
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0')
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0')
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0')
    const a = rgbMatch[4] !== undefined
      ? Math.round(parseFloat(rgbMatch[4]) * 255).toString(16).padStart(2, '0')
      : 'FF'
    return `${a}${r}${g}${b}`.toUpperCase()
  }

  return null
}

/**
 * Resolve theme colors from CSS custom properties at export time.
 * Falls back to hardcoded defaults if running outside browser or variables aren't set.
 */
function resolveThemeColors(): ThemeColors {
  if (typeof document === 'undefined') return DEFAULT_THEME_COLORS

  const style = getComputedStyle(document.documentElement)

  const primary = style.getPropertyValue('--dc-primary').trim()
  const primaryContent = style.getPropertyValue('--dc-primary-content').trim()
  const border = style.getPropertyValue('--dc-border').trim()

  return {
    headerBg: cssColorToArgb(primary) ?? DEFAULT_THEME_COLORS.headerBg,
    headerText: cssColorToArgb(primaryContent) ?? DEFAULT_THEME_COLORS.headerText,
    borderColor: cssColorToArgb(border) ?? DEFAULT_THEME_COLORS.borderColor,
  }
}

// ============================================================================
// Cell Value Normalization
// ============================================================================

function normalizeCellValue(value: unknown): string | number | boolean | Date | null {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.map(item => String(item)).join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// ============================================================================
// Worksheet Formatting
// ============================================================================

function applyHeaderStyle(row: ExcelJSRow, colors: ThemeColors): void {
  row.height = 18
  row.eachCell((cell: ExcelJSCell) => {
    cell.font = { bold: true, color: { argb: colors.headerText } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors.headerBg },
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  })
}

function applyBorders(worksheet: ExcelJSWorksheet, colors: ThemeColors): void {
  worksheet.eachRow((row: ExcelJSRow) => {
    row.eachCell((cell: ExcelJSCell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: colors.borderColor } },
        left: { style: 'thin', color: { argb: colors.borderColor } },
        bottom: { style: 'thin', color: { argb: colors.borderColor } },
        right: { style: 'thin', color: { argb: colors.borderColor } },
      }
      cell.alignment = { vertical: 'top', wrapText: true }
    })
  })
}

function autoFitColumns(worksheet: ExcelJSWorksheet, minWidths: number[] = []): void {
  worksheet.columns?.forEach((column: ExcelJSColumn, index: number) => {
    let maxLength = minWidths[index] ?? 10
    column.eachCell?.({ includeEmpty: true }, (cell: ExcelJSCell) => {
      const cellLength = String(cell.value ?? '').length
      if (cellLength > maxLength) maxLength = cellLength
    })
    column.width = Math.min(Math.max(maxLength + 2, minWidths[index] ?? 10), 70)
  })
}

function addTableSheet(
  workbook: ExcelJSWorkbook,
  name: string,
  rows: Array<Record<string, unknown>>,
  colors: ThemeColors
): void {
  const worksheet = workbook.addWorksheet(name)

  if (rows.length === 0) {
    worksheet.addRow(['No data available'])
    autoFitColumns(worksheet, [32])
    return
  }

  const headers = Object.keys(rows[0])
  const headerRow = worksheet.addRow(headers)
  applyHeaderStyle(headerRow, colors)

  for (const row of rows) {
    worksheet.addRow(headers.map(header => normalizeCellValue(row[header])))
  }

  worksheet.views = [{ state: 'frozen', ySplit: 1 }]
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  }

  applyBorders(worksheet, colors)
  autoFitColumns(worksheet)
}

// ============================================================================
// Filename Generation
// ============================================================================

function slugifyFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function generateDownloadFilename(baseFilename: string, extension: string): string {
  const slugifiedBase = slugifyFilename(baseFilename)
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const dateStamp = `${year}${month}${day}`
  const uniqueSuffix = crypto.randomUUID().slice(0, 4).toUpperCase()
  return `${slugifiedBase}-${dateStamp}-${uniqueSuffix}.${extension}`
}

// ============================================================================
// Module Availability
// ============================================================================

/**
 * Check if ExcelJS is available (installed as peer dependency)
 */
async function getExcelModule(): Promise<ExcelJSModule | null> {
  if (moduleChecked) {
    return excelModule
  }

  try {
    // Dynamic import - exceljs is an optional peer dependency
    // @ts-ignore - exceljs may not be installed
    excelModule = await import('exceljs') as ExcelJSModule
    moduleChecked = true
    return excelModule
  } catch {
    moduleChecked = true
    excelModule = null
    return null
  }
}

/**
 * Check if XLSX export is available (ExcelJS installed)
 */
export async function isExportAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const mod = await getExcelModule()
  return mod !== null
}

// Extend Window interface for warning flag
declare global {
  interface Window {
    __drizzle_cube_xls_export_warning__?: boolean
  }
}

/**
 * Log a development-mode warning when xlsExport feature is enabled but exceljs is missing
 */
export function warnIfExcelJsMissing(xlsExportConfig: XlsExportFeatureConfig | undefined): void {
  if (typeof window === 'undefined') return
  if (!xlsExportConfig?.enabled) return

  // Only warn once per session
  if (window.__drizzle_cube_xls_export_warning__) return

  getExcelModule().then((mod) => {
    if (!mod && typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      console.warn(
        '[drizzle-cube] XLS export feature enabled but exceljs not installed. ' +
        'Run: npm install exceljs'
      )
      window.__drizzle_cube_xls_export_warning__ = true
    }
  })
}

// ============================================================================
// Data Type Detection
// ============================================================================

function isFlowChartData(data: unknown): data is FlowChartData {
  return (
    !!data &&
    typeof data === 'object' &&
    'nodes' in data &&
    'links' in data &&
    Array.isArray((data as FlowChartData).nodes) &&
    Array.isArray((data as FlowChartData).links)
  )
}

function isRetentionChartData(data: unknown): data is RetentionChartData {
  return (
    !!data &&
    typeof data === 'object' &&
    'rows' in data &&
    'periods' in data &&
    Array.isArray((data as RetentionChartData).rows) &&
    Array.isArray((data as RetentionChartData).periods)
  )
}

// ============================================================================
// Browser Download
// ============================================================================

function triggerDownload(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Export portlet data as a formatted XLSX file.
 * Returns true on success, false on failure.
 */
export async function exportPortletToXlsx(
  portletTitle: string,
  debugData: PortletDebugDataEntry
): Promise<boolean> {
  const ExcelJS = await getExcelModule()
  if (!ExcelJS) {
    console.warn('[drizzle-cube] Cannot export: exceljs not available')
    return false
  }

  try {
    const workbook = new ExcelJS.Workbook()
    const colors = resolveThemeColors()
    const { data } = debugData

    if (isFlowChartData(data)) {
      // Flow data: two sheets for nodes and links
      addTableSheet(workbook, 'Nodes', data.nodes as unknown as Record<string, unknown>[], colors)
      addTableSheet(workbook, 'Links', data.links as unknown as Record<string, unknown>[], colors)
    } else if (isRetentionChartData(data)) {
      // Retention data: export rows
      addTableSheet(workbook, portletTitle, data.rows as unknown as Record<string, unknown>[], colors)
    } else if (Array.isArray(data)) {
      // Standard flat data
      addTableSheet(workbook, portletTitle, data as Record<string, unknown>[], colors)
    } else {
      console.warn('[drizzle-cube] Cannot export: unrecognized data format')
      return false
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = generateDownloadFilename(portletTitle || 'export', 'xlsx')
    triggerDownload(buffer as ArrayBuffer, filename)

    return true
  } catch (error) {
    console.error('[drizzle-cube] Failed to export XLSX:', error)
    return false
  }
}
