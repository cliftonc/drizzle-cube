/**
 * Co-located helpers for FunnelChart.
 *
 * Pure data-shaping + display-option resolution extracted from the component.
 * No behaviour change — mirrors the original inline logic exactly.
 */
import type { ChartDisplayConfig } from '../../types'
import type { FunnelChartData } from '../../types/funnel'
import { formatDuration } from '../../utils/funnelExecution'

/** Check if data is already in funnel data format. */
export function isFunnelData(data: unknown[]): data is FunnelChartData[] {
  if (!data || data.length === 0) return false
  const first = data[0]
  return (
    typeof first === 'object' &&
    first !== null &&
    'name' in first &&
    'value' in first &&
    'percentage' in first
  )
}

/**
 * Render time metrics based on config options - returns array of lines for
 * vertical stacking.
 */
export function getTimeMetricsLines(
  step: FunnelChartData,
  showAvg: boolean,
  showMedian: boolean,
  showP90: boolean
): string[] {
  const lines: string[] = []
  if (showAvg && step.avgSecondsToConvert != null) {
    lines.push(`Avg: ${formatDuration(step.avgSecondsToConvert)}`)
  }
  if (showMedian && step.medianSecondsToConvert != null) {
    lines.push(`Med: ${formatDuration(step.medianSecondsToConvert)}`)
  }
  if (showP90 && step.p90SecondsToConvert != null) {
    lines.push(`P90: ${formatDuration(step.p90SecondsToConvert)}`)
  }
  return lines
}

/** Coerce arbitrary query rows into FunnelChartData by probing field names. */
export function toFunnelData(data: unknown[]): FunnelChartData[] {
  if (!data || data.length === 0) return []
  if (isFunnelData(data)) return data

  return data.map((row, index) => {
    const record = row as Record<string, unknown>

    const nameField = Object.keys(record).find(
      (k) => k.toLowerCase().includes('step') || k.toLowerCase().includes('name') || k === '__stepName'
    )
    const name = nameField ? String(record[nameField]) : `Step ${index + 1}`

    const valueField = Object.keys(record).find(
      (k) => k.toLowerCase().includes('count') || k.toLowerCase().includes('value') || k === '__count'
    )
    const value = valueField ? Number(record[valueField]) || 0 : 0

    const percentField = Object.keys(record).find(
      (k) => k.toLowerCase().includes('percent') || k === '__percentage'
    )
    const percentage = percentField ? Number(record[percentField]) || 0 : 0

    const convRateField = Object.keys(record).find(
      (k) => k.toLowerCase().includes('conversion') || k === '__conversionRate'
    )
    const conversionRate = convRateField ? Number(record[convRateField]) || null : null

    return { name, value, percentage, conversionRate, stepIndex: index }
  })
}

export interface FunnelDisplayOptions {
  customStepLabels?: string[]
  isVertical: boolean
  funnelStyle: NonNullable<ChartDisplayConfig['funnelStyle']>
  showConversion: boolean
  showAvgTime: boolean
  showMedianTime: boolean
  showP90Time: boolean
  hideSummaryFooter: boolean
}

/** Resolve every funnel display option (with backward-compat for time metrics). */
export function resolveFunnelDisplayOptions(
  displayConfig: ChartDisplayConfig | undefined
): FunnelDisplayOptions {
  return {
    customStepLabels: displayConfig?.funnelStepLabels,
    isVertical: (displayConfig?.funnelOrientation || 'horizontal') === 'vertical',
    funnelStyle: displayConfig?.funnelStyle ?? 'bars',
    showConversion: displayConfig?.showFunnelConversion ?? true,
    // Time metrics - individual toggles with backward compat for showFunnelTimeMetrics
    showAvgTime: displayConfig?.showFunnelAvgTime ?? (displayConfig?.showFunnelTimeMetrics ?? false),
    showMedianTime: displayConfig?.showFunnelMedianTime ?? false,
    showP90Time: displayConfig?.showFunnelP90Time ?? false,
    hideSummaryFooter: displayConfig?.hideSummaryFooter ?? false
  }
}

/** Color for a funnel step (cyclic over the palette or the default funnel gradient). */
export function getStepColor(index: number, colorPalette: string[]): string {
  return colorPalette[index % colorPalette.length]
}
