import type { ColorPalette } from '../../types'

/**
 * Co-located pure helpers for KpiText: value extraction, statistics, number
 * formatting, template processing, and colour resolution. Extracted so the
 * component body stays focused on dimensioning + render. Pure extraction — no
 * behaviour change.
 */

/** Extract the configured measure fields from a chart config (string or array). */
export function extractValueFields(yAxis: string | string[] | undefined): string[] {
  if (!yAxis) return []
  if (typeof yAxis === 'string') return [yAxis]
  if (Array.isArray(yAxis)) return yAxis
  return []
}

/**
 * Extract the values for a field from each row, falling back to the first
 * available field when the configured field is absent. Null/undefined dropped.
 */
export function extractValues(data: Record<string, any>[], valueField: string): any[] {
  return data
    .map(row => {
      if (row[valueField] !== undefined) return row[valueField]
      const availableFields = Object.keys(row)
      if (availableFields.length > 0) return row[availableFields[0]]
      return undefined
    })
    .filter(val => val !== null && val !== undefined)
}

export interface KpiStats {
  mainValue: any
  min: number | null
  max: number | null
  showStats: boolean
}

/**
 * Reduce extracted values to the displayed main value plus optional min/max
 * statistics. Numeric multi-value sets average and expose min/max; non-numeric
 * sets concatenate.
 */
export function computeKpiStats(values: any[]): KpiStats {
  const numericValues = values.map(val => Number(val)).filter(val => !isNaN(val))

  if (numericValues.length > 0) {
    if (values.length === 1) {
      return { mainValue: values[0], min: null, max: null, showStats: false }
    }
    const sum = numericValues.reduce((acc, val) => acc + val, 0)
    return {
      mainValue: sum / numericValues.length,
      min: Math.min(...numericValues),
      max: Math.max(...numericValues),
      showStats: true
    }
  }

  return {
    mainValue: values.length === 1 ? values[0] : values.join(', '),
    min: null,
    max: null,
    showStats: false
  }
}

interface NumberFormatOptions {
  formatValue?: (value: any) => string
  decimals?: number
}

/** Format a number with K/M/B abbreviation, honouring a custom formatter. */
export function formatKpiNumber(value: number | null | undefined, options: NumberFormatOptions): string {
  if (options.formatValue) {
    return options.formatValue(value)
  }
  if (value === null || value === undefined) {
    return '—'
  }

  const decimals = options.decimals ?? 2
  const abs = Math.abs(value)
  if (abs >= 1e9) return (value / 1e9).toFixed(decimals) + 'B'
  if (abs >= 1e6) return (value / 1e6).toFixed(decimals) + 'M'
  if (abs >= 1e3) return (value / 1e3).toFixed(decimals) + 'K'
  return value.toFixed(decimals)
}

interface TemplateContext {
  value: any
  valueField: string
  fieldLabel: string
  min: number | null
  max: number | null
  count: number
  formatNumber: (value: number | null | undefined) => string
}

/** Replace `${var}` tokens in a KPI template, falling back to the raw value. */
export function processKpiTemplate(template: string, ctx: TemplateContext): string {
  const { value, valueField, fieldLabel, min, max, count, formatNumber } = ctx
  try {
    const templateVars = {
      value: typeof value === 'number' ? formatNumber(value) : String(value),
      rawValue: value,
      field: valueField,
      fieldLabel,
      min: min !== null ? formatNumber(min) : '',
      max: max !== null ? formatNumber(max) : '',
      count
    }
    return template.replace(/\$\{(\w+)\}/g, (match, varName) => {
      if (varName in templateVars) {
        return String(templateVars[varName as keyof typeof templateVars])
      }
      return match
    })
  } catch {
    return String(value)
  }
}

/** Resolve the KPI text colour from the palette by index, with a fallback. */
export function resolveValueColor(
  valueColorIndex: number | undefined,
  colorPalette: ColorPalette | undefined
): string {
  if (valueColorIndex !== undefined && colorPalette?.colors) {
    if (valueColorIndex >= 0 && valueColorIndex < colorPalette.colors.length) {
      return colorPalette.colors[valueColorIndex]
    }
  }
  return colorPalette?.colors?.[0] || '#1f2937'
}
