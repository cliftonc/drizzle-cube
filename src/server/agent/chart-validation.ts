/**
 * Chart Config Validation for Agent Tool
 *
 * Validates chartConfig against drop zone requirements defined in the chart config registry.
 * Auto-infers missing fields from the query structure.
 * Builds per-chart-type guidance for the tool description.
 */

import { t } from '../../i18n/runtime'
import { chartConfigRegistry } from '../../client/charts/chartConfigRegistry'
import type { ChartTypeConfig } from '../../client/charts/chartConfigs'

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Validate chartConfig against the chart type's drop zone requirements.
 */
export function validateChartConfig(
  chartType: string,
  chartConfig: Record<string, unknown> | undefined,
  _query: Record<string, unknown>
): ValidationResult {
  const config = chartConfigRegistry[chartType] as ChartTypeConfig | undefined
  if (!config) {
    return { isValid: true, errors: [] } // Unknown chart type — skip validation
  }

  // Charts that skip query requirements (e.g., markdown) need no validation
  if (config.skipQuery) {
    return { isValid: true, errors: [] }
  }

  const errors: string[] = []

  for (const zone of config.dropZones) {
    if (!zone.mandatory) continue

    const value = chartConfig?.[zone.key]
    const hasValue = Array.isArray(value) ? value.length > 0 : !!value

    if (!hasValue) {
      const acceptDesc = zone.acceptTypes?.join('/') ?? 'fields'
      errors.push(t('server.validation.chart.dropZoneRequired', { key: zone.key, chartType, label: zone.label, acceptDesc }))
    }
  }

  // Bar charts must have an xAxis dimension
  if (chartType === 'bar') {
    const xAxis = chartConfig?.xAxis
    const hasXAxis = Array.isArray(xAxis) ? xAxis.length > 0 : !!xAxis
    if (!hasXAxis) {
      const dimensions = (_query.dimensions as string[] | undefined) ?? []
      const timeDimensions = (_query.timeDimensions as Array<{ dimension: string }> | undefined) ?? []
      const hasDimensions = dimensions.length > 0 || timeDimensions.length > 0
      if (hasDimensions) {
        errors.push(t('server.validation.chart.barXAxisRequired'))
      } else {
        errors.push(t('server.validation.chart.barNeedsDimension'))
      }
    }
  }

  // series must not duplicate xAxis (causes sparse, broken-looking charts)
  if (chartConfig?.xAxis && chartConfig?.series) {
    const xAxisFields = new Set(
      Array.isArray(chartConfig.xAxis)
        ? (chartConfig.xAxis as string[])
        : [chartConfig.xAxis as string]
    )
    const seriesFields = Array.isArray(chartConfig.series)
      ? (chartConfig.series as string[])
      : [chartConfig.series as string]
    const duplicates = seriesFields.filter(f => xAxisFields.has(f))
    if (duplicates.length > 0) {
      errors.push(t('server.validation.chart.seriesDuplicatesXAxis', { duplicates: duplicates.join(', ') }))
    }
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * Auto-infer missing chartConfig fields from the query structure.
 * Fills in xAxis, yAxis, series, sizeField, etc. based on query measures/dimensions
 * and the chart type's drop zone acceptTypes.
 */
export function inferChartConfig(
  chartType: string,
  chartConfig: Record<string, unknown> | undefined,
  query: Record<string, unknown>
): Record<string, unknown> {
  const config = chartConfigRegistry[chartType] as ChartTypeConfig | undefined
  if (!config) {
    return chartConfig ?? {}
  }

  const result: Record<string, unknown> = { ...chartConfig }

  const measures = (query.measures as string[] | undefined) ?? []
  const dimensions = (query.dimensions as string[] | undefined) ?? []
  const timeDimensions = (query.timeDimensions as Array<{ dimension: string }> | undefined) ?? []
  const timeDimFields = timeDimensions.map(td => td.dimension)

  for (const zone of config.dropZones) {
    const existing = result[zone.key]
    const hasValue = Array.isArray(existing) ? existing.length > 0 : !!existing
    if (hasValue) continue // Already set by agent

    const accept = zone.acceptTypes ?? []

    if (zone.key === 'sizeField' || zone.key === 'colorField') {
      // Scalar fields — pick a measure not already used
      if (accept.includes('measure')) {
        const usedMeasures = new Set<string>()
        for (const z of config.dropZones) {
          if (z.key === zone.key) continue
          const v = result[z.key]
          if (Array.isArray(v)) v.forEach(m => usedMeasures.add(m as string))
          else if (typeof v === 'string') usedMeasures.add(v)
        }
        const available = measures.filter(m => !usedMeasures.has(m))
        if (available.length > 0) {
          result[zone.key] = available[0]
        }
      }
      continue
    }

    // Array fields — collect candidates based on acceptTypes
    const candidates: string[] = []
    if (accept.includes('dimension')) candidates.push(...dimensions)
    if (accept.includes('timeDimension')) candidates.push(...timeDimFields)
    if (accept.includes('measure')) candidates.push(...measures)

    if (candidates.length === 0) continue

    // For series zone, exclude fields already used in xAxis to prevent duplicates
    let filtered = candidates
    if (zone.key === 'series') {
      const xAxisFields = new Set(
        Array.isArray(result.xAxis)
          ? (result.xAxis as string[])
          : result.xAxis ? [result.xAxis as string] : []
      )
      filtered = candidates.filter(f => !xAxisFields.has(f))
      if (filtered.length === 0) continue
    }

    const max = zone.maxItems ?? Infinity
    const sliced = filtered.slice(0, max)

    if (sliced.length > 0) {
      result[zone.key] = sliced
    }
  }

  return result
}

/**
 * Build per-chart-type requirements text for the agent tool description.
 * Includes description, useCase, and drop zone requirements for each chart type.
 */
export function buildChartRequirementsDescription(allowedChartTypes: string[]): string {
  const lines: string[] = ['\nChart config requirements by type:']

  for (const chartType of allowedChartTypes) {
    const config = chartConfigRegistry[chartType] as ChartTypeConfig | undefined
    if (!config) continue

    // Build the description/useCase prefix
    const desc = config.description ?? ''
    const useCase = config.useCase ?? ''
    const context = [desc, useCase].filter(Boolean).join('. ')
    const contextSuffix = context ? ` — ${context}.` : ''

    const mandatoryZones = config.dropZones.filter(z => z.mandatory)
    if (mandatoryZones.length === 0 && !config.skipQuery) {
      lines.push(`  ${chartType}${contextSuffix} chartConfig auto-inferred from query.`)
      continue
    }

    if (config.skipQuery) {
      lines.push(`  ${chartType}${contextSuffix} No query needed.`)
      continue
    }

    const zoneDescs = mandatoryZones.map(z => {
      const accept = z.acceptTypes?.join('/') ?? 'any'
      const maxNote = z.maxItems ? ` (max ${z.maxItems})` : ''
      return `${z.key}=[${accept}]${maxNote}`
    })
    lines.push(`  ${chartType}${contextSuffix} Requires ${zoneDescs.join(', ')}.`)
  }

  return lines.join('\n')
}
