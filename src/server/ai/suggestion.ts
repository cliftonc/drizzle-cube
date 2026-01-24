/**
 * AI Query Suggestion Engine
 * Parse natural language intent and generate query structure
 */

import type { CubeMetadata } from '../types/metadata'
import type { SemanticQuery, TimeDimension } from '../types/query'
import { discoverCubes, findBestFieldMatch } from './discovery'

/**
 * Suggested query result
 */
export interface QuerySuggestion {
  query: Partial<SemanticQuery>
  confidence: number
  reasoning: string[]
  warnings?: string[]
  /** Detected analysis mode */
  analysisMode: 'query' | 'funnel' | 'flow' | 'retention'
  /** Next steps when mode != 'query' */
  nextSteps?: string[]
}

/**
 * Time expression patterns
 */
interface TimeExpression {
  pattern: RegExp
  getDateRange: () => [string, string]
  granularity?: string
}

/**
 * Get time expressions with current date context
 */
function getTimeExpressions(): TimeExpression[] {
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  // Helper to format date
  const formatDate = (d: Date): string => d.toISOString().split('T')[0]

  // Helper to get start of period
  const startOfMonth = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), 1)
  const startOfYear = (d: Date): Date => new Date(d.getFullYear(), 0, 1)
  const startOfQuarter = (d: Date): Date => {
    const quarter = Math.floor(d.getMonth() / 3)
    return new Date(d.getFullYear(), quarter * 3, 1)
  }
  const startOfWeek = (d: Date): Date => {
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.getFullYear(), d.getMonth(), diff)
  }

  return [
    // Today
    {
      pattern: /\btoday\b/i,
      getDateRange: () => [today, today],
      granularity: 'day'
    },
    // Yesterday
    {
      pattern: /\byesterday\b/i,
      getDateRange: () => {
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        const d = formatDate(yesterday)
        return [d, d]
      },
      granularity: 'day'
    },
    // This week
    {
      pattern: /\bthis week\b/i,
      getDateRange: () => [formatDate(startOfWeek(now)), today],
      granularity: 'day'
    },
    // Last week
    {
      pattern: /\blast week\b/i,
      getDateRange: () => {
        const lastWeekStart = new Date(startOfWeek(now))
        lastWeekStart.setDate(lastWeekStart.getDate() - 7)
        const lastWeekEnd = new Date(lastWeekStart)
        lastWeekEnd.setDate(lastWeekEnd.getDate() + 6)
        return [formatDate(lastWeekStart), formatDate(lastWeekEnd)]
      },
      granularity: 'day'
    },
    // This month
    {
      pattern: /\bthis month\b/i,
      getDateRange: () => [formatDate(startOfMonth(now)), today],
      granularity: 'day'
    },
    // Last month
    {
      pattern: /\blast month\b/i,
      getDateRange: () => {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        return [formatDate(lastMonth), formatDate(lastMonthEnd)]
      },
      granularity: 'day'
    },
    // This quarter
    {
      pattern: /\bthis quarter\b/i,
      getDateRange: () => [formatDate(startOfQuarter(now)), today],
      granularity: 'month'
    },
    // Last quarter
    {
      pattern: /\blast quarter\b/i,
      getDateRange: () => {
        const lastQuarterStart = new Date(startOfQuarter(now))
        lastQuarterStart.setMonth(lastQuarterStart.getMonth() - 3)
        const lastQuarterEnd = new Date(startOfQuarter(now))
        lastQuarterEnd.setDate(lastQuarterEnd.getDate() - 1)
        return [formatDate(lastQuarterStart), formatDate(lastQuarterEnd)]
      },
      granularity: 'month'
    },
    // This year
    {
      pattern: /\bthis year\b/i,
      getDateRange: () => [formatDate(startOfYear(now)), today],
      granularity: 'month'
    },
    // Last year
    {
      pattern: /\blast year\b/i,
      getDateRange: () => {
        const lastYear = new Date(now.getFullYear() - 1, 0, 1)
        const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31)
        return [formatDate(lastYear), formatDate(lastYearEnd)]
      },
      granularity: 'month'
    },
    // Last N days
    {
      pattern: /\blast (\d+) days?\b/i,
      getDateRange: () => {
        // Default to 7 days, actual value extracted separately
        const start = new Date(now)
        start.setDate(start.getDate() - 7)
        return [formatDate(start), today]
      },
      granularity: 'day'
    },
    // Last N weeks
    {
      pattern: /\blast (\d+) weeks?\b/i,
      getDateRange: () => {
        const start = new Date(now)
        start.setDate(start.getDate() - 7 * 4)
        return [formatDate(start), today]
      },
      granularity: 'week'
    },
    // Last N months
    {
      pattern: /\blast (\d+) months?\b/i,
      getDateRange: () => {
        const start = new Date(now)
        start.setMonth(start.getMonth() - 3)
        return [formatDate(start), today]
      },
      granularity: 'month'
    },
    // Q1, Q2, Q3, Q4 patterns
    {
      pattern: /\bq([1-4])\b/i,
      getDateRange: () => {
        // Default Q1 of current year
        return [formatDate(new Date(now.getFullYear(), 0, 1)), formatDate(new Date(now.getFullYear(), 2, 31))]
      },
      granularity: 'month'
    }
  ]
}

/**
 * Analysis mode detection patterns
 */
const ANALYSIS_MODE_PATTERNS = {
  funnel: /\b(funnel|conversion|drop.?off|steps?|journey|pipeline|stages?)\b/i,
  flow: /\b(flows?|paths?|sequence|before|after|next|previous|user.?journey)\b/i,
  retention: /\b(retention|cohort|return|churn|comeback|retained|day.?\d+)\b/i
}

/**
 * Detect analysis mode from natural language
 */
function detectAnalysisMode(text: string): 'query' | 'funnel' | 'flow' | 'retention' {
  const lowerText = text.toLowerCase()

  if (ANALYSIS_MODE_PATTERNS.funnel.test(lowerText)) {
    return 'funnel'
  }
  if (ANALYSIS_MODE_PATTERNS.flow.test(lowerText)) {
    return 'flow'
  }
  if (ANALYSIS_MODE_PATTERNS.retention.test(lowerText)) {
    return 'retention'
  }

  return 'query'
}

/**
 * Generate next steps for analysis modes
 */
function generateNextSteps(mode: 'funnel' | 'flow' | 'retention', cubeName?: string): string[] {
  const cubeRef = cubeName ? cubeName : 'the relevant cube'

  switch (mode) {
    case 'funnel':
      return [
        `Use /mcp/discover to get ${cubeRef} funnel configuration and schema`,
        `Query the event dimension to discover available event types for funnel steps`,
        'Build funnel query with discovered values using the schema from discover'
      ]
    case 'flow':
      return [
        `Use /mcp/discover to get ${cubeRef} flow configuration and schema`,
        `Query the event dimension to discover available event types`,
        'Build flow query specifying the starting event and steps before/after'
      ]
    case 'retention':
      return [
        `Use /mcp/discover to get ${cubeRef} retention configuration and schema`,
        'Build retention query specifying granularity (day/week/month) and number of periods'
      ]
  }
}

/**
 * Parse time expression from natural language
 */
function parseTimeExpression(text: string): { dateRange: [string, string]; granularity?: string } | null {
  const expressions = getTimeExpressions()
  const lowerText = text.toLowerCase()

  for (const expr of expressions) {
    const match = lowerText.match(expr.pattern)
    if (match) {
      // Handle patterns with numeric capture groups
      if (match[1] && /^\d+$/.test(match[1])) {
        const n = parseInt(match[1], 10)
        const now = new Date()
        const today = now.toISOString().split('T')[0]
        const formatDate = (d: Date): string => d.toISOString().split('T')[0]

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
      }

      // Handle Q1-Q4
      if (/^q[1-4]$/i.test(match[0])) {
        const quarter = parseInt(match[1], 10)
        const now = new Date()
        const year = now.getFullYear()
        const startMonth = (quarter - 1) * 3
        const start = new Date(year, startMonth, 1)
        const end = new Date(year, startMonth + 3, 0)
        const formatDate = (d: Date): string => d.toISOString().split('T')[0]
        return { dateRange: [formatDate(start), formatDate(end)], granularity: 'month' }
      }

      return { dateRange: expr.getDateRange(), granularity: expr.granularity }
    }
  }

  return null
}

/**
 * Detect aggregation intent from natural language
 */
function detectAggregationIntent(text: string): { type: 'sum' | 'count' | 'avg' | 'max' | 'min'; confidence: number } | null {
  const lowerText = text.toLowerCase()

  const patterns: Array<{ pattern: RegExp; type: 'sum' | 'count' | 'avg' | 'max' | 'min' }> = [
    { pattern: /\b(total|sum|combined)\b/i, type: 'sum' },
    { pattern: /\b(count|number of|how many)\b/i, type: 'count' },
    { pattern: /\b(average|avg|mean)\b/i, type: 'avg' },
    { pattern: /\b(maximum|max|highest|top)\b/i, type: 'max' },
    { pattern: /\b(minimum|min|lowest|bottom)\b/i, type: 'min' }
  ]

  for (const { pattern, type } of patterns) {
    if (pattern.test(lowerText)) {
      return { type, confidence: 0.8 }
    }
  }

  return null
}

/**
 * Detect grouping/breakdown intent
 */
function detectGroupingIntent(text: string): string[] {
  const lowerText = text.toLowerCase()
  const groupingKeywords: string[] = []

  // Look for "by X" patterns
  const byPattern = /\bby\s+(\w+(?:\s+\w+)?)/gi
  let match
  while ((match = byPattern.exec(lowerText)) !== null) {
    groupingKeywords.push(match[1].trim())
  }

  // Look for "per X" patterns
  const perPattern = /\bper\s+(\w+)/gi
  while ((match = perPattern.exec(lowerText)) !== null) {
    groupingKeywords.push(match[1].trim())
  }

  // Look for "for each X" patterns
  const forEachPattern = /\bfor each\s+(\w+)/gi
  while ((match = forEachPattern.exec(lowerText)) !== null) {
    groupingKeywords.push(match[1].trim())
  }

  return groupingKeywords
}

/**
 * Suggest a query based on natural language input
 */
export function suggestQuery(
  metadata: CubeMetadata[],
  naturalLanguage: string,
  targetCube?: string
): QuerySuggestion {
  const reasoning: string[] = []
  const warnings: string[] = []
  const query: Partial<SemanticQuery> = {}

  // Detect analysis mode
  const analysisMode = detectAnalysisMode(naturalLanguage)

  // Step 1: Discover relevant cubes if not specified
  let relevantCubes: CubeMetadata[]
  if (targetCube) {
    const cube = metadata.find(c => c.name === targetCube)
    if (cube) {
      relevantCubes = [cube]
      reasoning.push(`Using specified cube: ${targetCube}`)
    } else {
      warnings.push(`Specified cube '${targetCube}' not found`)
      relevantCubes = []
    }
  } else {
    const discoveryResults = discoverCubes(metadata, { intent: naturalLanguage, limit: 3 })
    relevantCubes = discoveryResults
      .map(r => metadata.find(c => c.name === r.cube))
      .filter((c): c is CubeMetadata => c !== undefined)

    if (relevantCubes.length > 0) {
      reasoning.push(`Identified relevant cubes: ${relevantCubes.map(c => c.name).join(', ')}`)
    }
  }

  if (relevantCubes.length === 0) {
    // For analysis modes, still provide nextSteps guidance even without cubes
    const nextSteps = analysisMode !== 'query'
      ? generateNextSteps(analysisMode, undefined)
      : undefined
    return {
      query: {},
      confidence: 0,
      reasoning: ['Could not identify relevant cubes for this query'],
      warnings,
      analysisMode,
      nextSteps
    }
  }

  const primaryCube = relevantCubes[0]
  let confidence = 0.5 // Base confidence

  // Step 2: Detect aggregation intent
  const aggregationIntent = detectAggregationIntent(naturalLanguage)
  if (aggregationIntent) {
    reasoning.push(`Detected ${aggregationIntent.type} aggregation intent`)
    confidence += 0.1
  }

  // Step 3: Find matching measures
  const measures: string[] = []
  const lowerText = naturalLanguage.toLowerCase()

  // Look for measure keywords in the text
  for (const measure of primaryCube.measures) {
    const measureName = measure.name.split('.').pop() || measure.name

    // Check name, title, and synonyms
    const namesToCheck = [
      measureName.toLowerCase(),
      measure.title.toLowerCase(),
      ...(measure.synonyms || []).map(s => s.toLowerCase())
    ]

    for (const name of namesToCheck) {
      if (lowerText.includes(name)) {
        measures.push(measure.name)
        reasoning.push(`Matched measure '${measure.name}' via keyword '${name}'`)
        confidence += 0.15
        break
      }
    }
  }

  // If no specific measures found, suggest based on aggregation intent
  if (measures.length === 0 && aggregationIntent) {
    // Find measures matching the aggregation type
    const matchingMeasures = primaryCube.measures.filter(m => m.type === aggregationIntent.type)
    if (matchingMeasures.length > 0) {
      measures.push(matchingMeasures[0].name)
      reasoning.push(`Suggested ${matchingMeasures[0].name} based on ${aggregationIntent.type} intent`)
    } else if (aggregationIntent.type === 'count') {
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

  // If still no measures, use first available
  if (measures.length === 0 && primaryCube.measures.length > 0) {
    measures.push(primaryCube.measures[0].name)
    reasoning.push(`Using default measure: ${primaryCube.measures[0].name}`)
    warnings.push('Could not determine specific measure from query, using default')
  }

  query.measures = measures

  // Step 4: Detect and resolve grouping dimensions
  const groupingKeywords = detectGroupingIntent(naturalLanguage)
  const dimensions: string[] = []

  for (const keyword of groupingKeywords) {
    const match = findBestFieldMatch(relevantCubes, keyword, 'dimension')
    if (match) {
      dimensions.push(match.field)
      reasoning.push(`Matched dimension '${match.field}' from grouping keyword '${keyword}'`)
      confidence += 0.1
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
            confidence += 0.1
            break
          }
        }
      }
    }
  }

  if (dimensions.length > 0) {
    query.dimensions = dimensions
  }

  // Step 5: Parse time expressions
  const timeExpr = parseTimeExpression(naturalLanguage)
  if (timeExpr) {
    // Find a time dimension in the primary cube
    const timeDimension = primaryCube.dimensions.find(d => d.type === 'time')
    if (timeDimension) {
      const td: TimeDimension = {
        dimension: timeDimension.name,
        dateRange: timeExpr.dateRange
      }
      if (timeExpr.granularity) {
        td.granularity = timeExpr.granularity as any
      }
      query.timeDimensions = [td]
      reasoning.push(`Applied time filter: ${timeExpr.dateRange[0]} to ${timeExpr.dateRange[1]}`)
      confidence += 0.15
    } else {
      warnings.push('Time expression found but no time dimension in cube')
    }
  }

  // Normalize confidence to 0-1
  confidence = Math.min(1, confidence)

  // For analysis modes, return guidance instead of building query
  if (analysisMode !== 'query') {
    const primaryCubeName = relevantCubes.length > 0 ? relevantCubes[0].name : undefined
    return {
      query: {},
      confidence: 0.7,
      reasoning: [
        `Detected ${analysisMode} intent from natural language`,
        ...(primaryCubeName ? [`Found relevant cube: ${primaryCubeName}`] : [])
      ],
      warnings: warnings.length > 0 ? warnings : undefined,
      analysisMode,
      nextSteps: generateNextSteps(analysisMode, primaryCubeName)
    }
  }

  return {
    query,
    confidence,
    reasoning,
    warnings: warnings.length > 0 ? warnings : undefined,
    analysisMode: 'query'
  }
}
