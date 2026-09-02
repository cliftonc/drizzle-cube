/**
 * Chart Config Validation for Agent Tool
 *
 * Validates chartConfig against drop zone requirements defined in the chart config registry.
 * Auto-infers missing fields from the query structure.
 * Builds per-chart-type guidance for the tool description.
 */

import { t, isTranslationKey } from '../../i18n/runtime.js'
import { chartConfigRegistry, isRecordGrainChart } from '../../client/charts/chartConfigRegistry.js'
import type { ChartTypeConfig } from '../../client/charts/chartConfigs.js'

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/** True if a chartConfig value is non-empty (array with items, or a truthy scalar). */
function hasConfigValue(value: unknown): boolean {
  return Array.isArray(value) ? value.length > 0 : !!value
}

/** Collect errors for missing mandatory drop zones. */
function validateMandatoryZones(
  config: ChartTypeConfig,
  chartType: string,
  chartConfig: Record<string, unknown> | undefined,
  errors: string[]
): void {
  for (const zone of config.dropZones) {
    if (!zone.mandatory) continue
    if (hasConfigValue(chartConfig?.[zone.key])) continue
    const acceptDesc = zone.acceptTypes?.join('/') ?? 'fields'
    errors.push(t('server.validation.chart.dropZoneRequired', { key: zone.key, chartType, label: zone.label, acceptDesc }))
  }
}

/** Collect the bar-chart xAxis requirement error, if applicable. */
function validateBarXAxis(
  chartConfig: Record<string, unknown> | undefined,
  query: Record<string, unknown>,
  errors: string[]
): void {
  if (hasConfigValue(chartConfig?.xAxis)) return
  const dimensions = (query.dimensions as string[] | undefined) ?? []
  const timeDimensions = (query.timeDimensions as Array<{ dimension: string }> | undefined) ?? []
  const hasDimensions = dimensions.length > 0 || timeDimensions.length > 0
  errors.push(t(hasDimensions
    ? 'server.validation.chart.barXAxisRequired'
    : 'server.validation.chart.barNeedsDimension'))
}

/** Normalize a chartConfig field that may be a string or string[] into a string[]. */
function toFieldArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [value as string]
}

/** Collect the error for series fields that duplicate xAxis fields. */
function validateSeriesNotDuplicatingXAxis(
  chartConfig: Record<string, unknown> | undefined,
  errors: string[]
): void {
  if (!chartConfig?.xAxis || !chartConfig?.series) return
  const xAxisFields = new Set(toFieldArray(chartConfig.xAxis))
  const duplicates = toFieldArray(chartConfig.series).filter(f => xAxisFields.has(f))
  if (duplicates.length > 0) {
    errors.push(t('server.validation.chart.seriesDuplicatesXAxis', { duplicates: duplicates.join(', ') }))
  }
}

/**
 * Collect the record-grain requirement error, if applicable.
 *
 * A listing chart shows one row per record, so its query must be ungrouped —
 * otherwise the rows come back aggregated and the table silently lists group
 * totals instead of records.
 */
function validateRecordGrainQuery(
  chartType: string,
  query: Record<string, unknown>,
  errors: string[]
): void {
  if (!isRecordGrainChart(chartType)) return
  if (query.ungrouped === true) return
  errors.push(t('server.validation.chart.recordGrainNeedsUngrouped', { chartType }))
}

/**
 * Validate chartConfig against the chart type's drop zone requirements.
 */
export function validateChartConfig(
  chartType: string,
  chartConfig: Record<string, unknown> | undefined,
  query: Record<string, unknown>
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

  validateMandatoryZones(config, chartType, chartConfig, errors)

  // Listing charts need row-level data, not aggregates
  validateRecordGrainQuery(chartType, query, errors)

  // Bar charts must have an xAxis dimension
  if (chartType === 'bar') {
    validateBarXAxis(chartConfig, query, errors)
  }

  // series must not duplicate xAxis (causes sparse, broken-looking charts)
  validateSeriesNotDuplicatingXAxis(chartConfig, errors)

  return { isValid: errors.length === 0, errors }
}

/**
 * Pick a chart type that can actually render the query.
 *
 * A `bar` over a measures-only query has no category axis: `resolveChartAxisFields`
 * reports `axisInvalid` and the portlet renders a config-error card. Rejecting it
 * instead costs the model a full query+portlet rebuild, so swap to a type that
 * shows the same numbers and tell it what happened.
 *
 * The note is model-facing, not user-facing, so it is deliberately not translated.
 */
export function resolveChartTypeFallback(
  chartType: string,
  chartConfig: Record<string, unknown> | undefined,
  query: Record<string, unknown>
): { chartType: string; note?: string } {
  if (chartType !== 'bar') return { chartType }
  if (hasConfigValue(chartConfig?.xAxis)) return { chartType }

  const dimensions = (query.dimensions as string[] | undefined) ?? []
  const timeDimensions = (query.timeDimensions as Array<{ dimension: string }> | undefined) ?? []
  if (dimensions.length > 0 || timeDimensions.length > 0) return { chartType }

  const measureCount = ((query.measures as string[] | undefined) ?? []).length
  const replacement = measureCount === 1 ? 'kpiNumber' : 'table'
  return {
    chartType: replacement,
    note: `Note: chartType was changed from "bar" to "${replacement}" because the query has `
      + 'no dimension, so a bar chart would have no category axis to label its bars. '
      + 'For a real bar chart, put the category in the query\'s dimensions and use a single '
      + 'measure. To plot several measures as an ordered profile instead, use "measureProfile".',
  }
}

/**
 * Auto-infer missing chartConfig fields from the query structure.
 * Fills in xAxis, yAxis, series, sizeField, etc. based on query measures/dimensions
 * and the chart type's drop zone acceptTypes.
 */
/** Query fields extracted for chart-config inference. */
interface InferenceFields {
  measures: string[]
  dimensions: string[]
  timeDimFields: string[]
}

type DropZone = ChartTypeConfig['dropZones'][number]

/** Infer a scalar field (sizeField/colorField): a measure not already used by other zones. */
function inferScalarField(
  zone: DropZone,
  config: ChartTypeConfig,
  result: Record<string, unknown>,
  measures: string[]
): void {
  const accept = zone.acceptTypes ?? []
  if (!accept.includes('measure')) return

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

/** Every field already assigned to a zone other than `exceptKey`. */
function collectAssignedFields(result: Record<string, unknown>, exceptKey: string): Set<string> {
  const used = new Set<string>()
  for (const [key, value] of Object.entries(result)) {
    if (key === exceptKey) continue
    if (Array.isArray(value)) {
      for (const v of value) if (typeof v === 'string') used.add(v)
    } else if (typeof value === 'string') {
      used.add(value)
    }
  }
  return used
}

/** Infer an array field (xAxis/yAxis/series/...) from accepted candidate field types. */
function inferArrayField(
  zone: DropZone,
  result: Record<string, unknown>,
  fields: InferenceFields
): void {
  const accept = zone.acceptTypes ?? []
  const candidates: string[] = []
  if (accept.includes('dimension')) candidates.push(...fields.dimensions)
  if (accept.includes('timeDimension')) candidates.push(...fields.timeDimFields)
  if (accept.includes('measure')) candidates.push(...fields.measures)

  if (candidates.length === 0) return

  // Never hand the same field to two zones. `result` starts as a copy of the
  // agent's own chartConfig, so this also stops inference filling xAxis with a
  // field the agent put in series and then failing its own duplicate check —
  // and stops heatmap getting one dimension on both axes, or scatter one
  // measure on both.
  const used = collectAssignedFields(result, zone.key)
  const filtered = candidates.filter(f => !used.has(f))
  if (filtered.length === 0) return

  const max = zone.maxItems ?? Infinity
  const sliced = filtered.slice(0, max)
  if (sliced.length > 0) {
    result[zone.key] = sliced
  }
}

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

  const timeDimensions = (query.timeDimensions as Array<{ dimension: string }> | undefined) ?? []
  const fields: InferenceFields = {
    measures: (query.measures as string[] | undefined) ?? [],
    dimensions: (query.dimensions as string[] | undefined) ?? [],
    timeDimFields: timeDimensions.map(td => td.dimension),
  }

  for (const zone of config.dropZones) {
    if (zone.excludeFromInference) continue // Opt-in only — inferring it changes what renders
    if (hasConfigValue(result[zone.key])) continue // Already set by agent

    if (zone.key === 'sizeField' || zone.key === 'colorField') {
      inferScalarField(zone, config, result, fields.measures)
    } else {
      inferArrayField(zone, result, fields)
    }
  }

  return result
}

/**
 * Resolve a chart-config string that is an i18n key for built-in charts, and may
 * be literal text for plugin charts.
 */
function resolveConfigText(value: string | undefined): string {
  if (!value) return ''
  return isTranslationKey(value) ? t(value) : value
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

    // Build the description/useCase prefix. Both are i18n keys on the registry
    // entry, so they need resolving — an unresolved key tells the model nothing.
    const desc = resolveConfigText(config.description)
    const useCase = resolveConfigText(config.useCase)
    const context = [desc, useCase].filter(Boolean).join('. ')
    const contextSuffix = context ? ` — ${context}.` : ''
    // A listing chart is only correct over row-level data.
    const grainNote = isRecordGrainChart(chartType)
      ? ' Query MUST set "ungrouped": true, which also means one cube plus its to-one joins — an ungrouped query cannot span a hasMany relationship.'
      : ''

    const mandatoryZones = config.dropZones.filter(z => z.mandatory)
    if (mandatoryZones.length === 0 && !config.skipQuery) {
      lines.push(`  ${chartType}${contextSuffix}${grainNote} chartConfig auto-inferred from query.`)
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
    lines.push(`  ${chartType}${contextSuffix}${grainNote} Requires ${zoneDescs.join(', ')}.`)
  }

  return lines.join('\n')
}
