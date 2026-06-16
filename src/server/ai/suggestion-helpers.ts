/**
 * AI Query Suggestion Engine — helpers
 * Pure step extractions for suggestQuery and parseTimeExpression. Behaviour is
 * identical to the original inline logic; these helpers reduce per-function
 * complexity without changing any output.
 */

import type { CubeMetadata } from '../types/metadata.js'
import { findBestFieldMatch } from './discovery.js'

/** Format a Date as a YYYY-MM-DD string (UTC). */
export function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

/** Resolve a numeric "last N days/weeks/months" expression. */
export function parseRelativeNExpression(
  n: number,
  lowerText: string
): { dateRange: [string, string]; granularity?: string } | null {
  const now = new Date()
  const today = formatDate(now)

  if (/days?/.test(lowerText)) {
    const start = new Date(now)
    start.setDate(start.getDate() - n)
    return { dateRange: [formatDate(start), today], granularity: 'day' }
  }
  if (/weeks?/.test(lowerText)) {
    const start = new Date(now)
    start.setDate(start.getDate() - n * 7)
    return { dateRange: [formatDate(start), today], granularity: n <= 4 ? 'day' : 'week' }
  }
  if (/months?/.test(lowerText)) {
    const start = new Date(now)
    start.setMonth(start.getMonth() - n)
    return { dateRange: [formatDate(start), today], granularity: n <= 3 ? 'day' : 'month' }
  }
  return null
}

/** Resolve a "Q1".."Q4" quarter expression for the current year. */
export function parseQuarterExpression(
  quarterMatch: string
): { dateRange: [string, string]; granularity?: string } {
  const quarter = parseInt(quarterMatch.slice(1), 10)
  const year = new Date().getFullYear()
  const startMonth = (quarter - 1) * 3
  const start = new Date(year, startMonth, 1)
  const end = new Date(year, startMonth + 3, 0)
  return { dateRange: [formatDate(start), formatDate(end)], granularity: 'month' }
}

/**
 * Match measures in the primary cube against keywords in the text.
 * Mutates `measures`/`reasoning` and returns the confidence delta to apply.
 */
export function matchMeasuresInText(
  primaryCube: CubeMetadata,
  lowerText: string,
  measures: string[],
  reasoning: string[]
): number {
  let confidenceDelta = 0
  for (const measure of primaryCube.measures) {
    const measureName = measure.name.split('.').pop() || measure.name
    const namesToCheck = [
      measureName.toLowerCase(),
      measure.title.toLowerCase(),
      ...(measure.synonyms || []).map(s => s.toLowerCase())
    ]
    for (const name of namesToCheck) {
      if (lowerText.includes(name)) {
        measures.push(measure.name)
        reasoning.push(`Matched measure '${measure.name}' via keyword '${name}'`)
        confidenceDelta += 0.15
        break
      }
    }
  }
  return confidenceDelta
}

/** Aggregation intent shape produced by detectAggregationIntent. */
export interface AggregationIntent {
  type: 'sum' | 'count' | 'avg' | 'max' | 'min'
  confidence: number
}

/**
 * Backfill measures when none matched directly, using the aggregation intent.
 * Mutates `measures`/`reasoning`.
 */
export function applyAggregationFallback(
  primaryCube: CubeMetadata,
  aggregationIntent: AggregationIntent,
  measures: string[],
  reasoning: string[]
): void {
  // Find measures matching the aggregation type
  const matchingMeasures = primaryCube.measures.filter(m => m.type === aggregationIntent.type)
  if (matchingMeasures.length > 0) {
    measures.push(matchingMeasures[0].name)
    reasoning.push(`Suggested ${matchingMeasures[0].name} based on ${aggregationIntent.type} intent`)
    return
  }
  if (aggregationIntent.type === 'count') {
    // For count, find any count or countDistinct measure
    const countMeasure = primaryCube.measures.find(m =>
      m.type === 'count' || m.type === 'countDistinct'
    )
    if (countMeasure) {
      measures.push(countMeasure.name)
      reasoning.push(`Suggested ${countMeasure.name} for counting`)
    }
  }
}

/**
 * Resolve grouping dimensions from grouping keywords and explicit "by/per X" text.
 * Mutates `dimensions`/`reasoning` and returns the confidence delta to apply.
 */
export function matchDimensions(
  relevantCubes: CubeMetadata[],
  groupingKeywords: string[],
  lowerText: string,
  dimensions: string[],
  reasoning: string[]
): number {
  let confidenceDelta = 0

  for (const keyword of groupingKeywords) {
    const match = findBestFieldMatch(relevantCubes, keyword, 'dimension')
    if (match) {
      dimensions.push(match.field)
      reasoning.push(`Matched dimension '${match.field}' from grouping keyword '${keyword}'`)
      confidenceDelta += 0.1
    }
  }

  // Also check for dimension keywords in the text
  for (const cube of relevantCubes) {
    for (const dimension of cube.dimensions) {
      const dimName = dimension.name.split('.').pop() || dimension.name
      const namesToCheck = [
        dimName.toLowerCase(),
        dimension.title.toLowerCase(),
        ...(dimension.synonyms || []).map(s => s.toLowerCase())
      ]
      for (const name of namesToCheck) {
        if (lowerText.includes(name) && !dimensions.includes(dimension.name)) {
          // Check if this is likely a grouping dimension
          if (lowerText.includes(`by ${name}`) || lowerText.includes(`per ${name}`)) {
            dimensions.push(dimension.name)
            reasoning.push(`Matched dimension '${dimension.name}' as grouping`)
            confidenceDelta += 0.1
            break
          }
        }
      }
    }
  }

  return confidenceDelta
}
