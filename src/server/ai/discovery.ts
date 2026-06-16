/**
 * AI Discovery Engine
 * Schema-aware intelligence for discovering relevant cubes and fields
 */

import type { CubeMetadata } from '../types/metadata.js'
import { QUERY_SCHEMAS } from './schemas.js'
import {
  accumulateFieldScores,
  topScoredFields,
  scoreFieldForBestMatch,
  type ScoreFns,
} from './discovery-helpers.js'

/**
 * Discovery result for a cube
 */
export interface CubeDiscoveryResult {
  cube: string
  title: string
  description?: string
  relevanceScore: number
  matchedOn: ('name' | 'title' | 'description' | 'exampleQuestions' | 'measures' | 'dimensions')[]
  suggestedMeasures: string[]
  suggestedDimensions: string[]

  // Analysis capabilities
  capabilities: {
    query: true
    funnel: boolean
    flow: boolean
    retention: boolean
  }

  // Config for advanced modes (only present if capabilities exist)
  analysisConfig?: {
    candidateBindingKeys: Array<{
      dimension: string
      description?: string
    }>
    candidateTimeDimensions: Array<{
      dimension: string
      description?: string
    }>
    candidateEventDimensions: Array<{
      dimension: string
      description?: string
    }>
  }

  // Hints for AI on next steps
  hints?: string[]

  // Query schemas (included when capabilities.funnel/flow/retention is true)
  querySchemas?: typeof QUERY_SCHEMAS
}

/**
 * Discovery request options
 */
export interface DiscoveryOptions {
  /** Topic or intent to search for */
  topic?: string
  /** Natural language intent */
  intent?: string
  /** Maximum number of results */
  limit?: number
  /** Minimum relevance score (0-1) */
  minScore?: number
}

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length > 500 || b.length > 500) return a.length + b.length
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

/**
 * Calculate fuzzy match score between two strings (0-1, higher is better)
 */
function fuzzyMatchScore(query: string, target: string): number {
  const q = query.toLowerCase().trim()
  const t = target.toLowerCase().trim()

  // Exact match
  if (q === t) return 1.0

  // Contains match
  if (t.includes(q)) return 0.9

  // Word boundary match
  const words = t.split(/[\s_-]+/)
  for (const word of words) {
    if (word === q) return 0.85
    if (word.startsWith(q)) return 0.75
  }

  // Levenshtein-based fuzzy match
  const distance = levenshteinDistance(q, t)
  const maxLen = Math.max(q.length, t.length)
  const similarity = 1 - distance / maxLen

  return similarity > 0.5 ? similarity * 0.7 : 0
}

/**
 * Match a query against an array of strings (names, synonyms, etc.)
 */
function matchAgainstArray(query: string, targets: string[]): number {
  let bestScore = 0
  for (const target of targets) {
    const score = fuzzyMatchScore(query, target)
    if (score > bestScore) {
      bestScore = score
    }
  }
  return bestScore
}

/**
 * Extract keywords from a natural language query
 */
function extractKeywords(text: string): string[] {
  // Common stop words to filter out
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'and', 'or', 'but', 'if',
    'then', 'else', 'when', 'where', 'why', 'how', 'what', 'which', 'who',
    'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you',
    'your', 'he', 'she', 'it', 'they', 'them', 'their', 'in', 'on', 'at',
    'to', 'for', 'of', 'with', 'by', 'from', 'up', 'down', 'out', 'over',
    'under', 'about', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'show', 'me', 'get', 'find', 'list',
    'give', 'tell', 'display', 'want', 'need', 'see', 'know'
  ])

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
}

const SCORE_FNS: ScoreFns = { fuzzyMatchScore, matchAgainstArray }

/** Score a cube's identity fields (name/title/description/exampleQuestions) for one keyword. */
function scoreCubeIdentity(
  keyword: string,
  cube: CubeMetadata,
  matchedOn: CubeDiscoveryResult['matchedOn']
): number {
  let added = 0

  // Match cube name
  const nameScore = fuzzyMatchScore(keyword, cube.name)
  if (nameScore > 0.5) {
    added += nameScore * 2 // Weight cube name matches higher
    if (!matchedOn.includes('name')) matchedOn.push('name')
  }

  // Match cube title
  const titleScore = fuzzyMatchScore(keyword, cube.title)
  if (titleScore > 0.5) {
    added += titleScore * 1.5
    if (!matchedOn.includes('title')) matchedOn.push('title')
  }

  // Match cube description
  if (cube.description) {
    const descScore = fuzzyMatchScore(keyword, cube.description)
    if (descScore > 0.3) {
      added += descScore
      if (!matchedOn.includes('description')) matchedOn.push('description')
    }
  }

  // Match example questions
  if (cube.exampleQuestions) {
    for (const question of cube.exampleQuestions) {
      const qScore = fuzzyMatchScore(keyword, question)
      if (qScore > 0.3) {
        added += qScore * 1.5 // Example questions are valuable
        if (!matchedOn.includes('exampleQuestions')) matchedOn.push('exampleQuestions')
      }
    }
  }

  return added
}

/**
 * Score a cube against discovery criteria
 */
function scoreCube(
  cube: CubeMetadata,
  keywords: string[]
): { score: number; matchedOn: CubeDiscoveryResult['matchedOn']; suggestedMeasures: string[]; suggestedDimensions: string[] } {
  let totalScore = 0
  const matchedOn: CubeDiscoveryResult['matchedOn'] = []
  const measureScores: Map<string, number> = new Map()
  const dimensionScores: Map<string, number> = new Map()

  for (const keyword of keywords) {
    totalScore += scoreCubeIdentity(keyword, cube, matchedOn)

    const measureHit = { hit: false }
    totalScore += accumulateFieldScores(keyword, cube.measures, SCORE_FNS, measureScores, measureHit)
    if (measureHit.hit && !matchedOn.includes('measures')) matchedOn.push('measures')

    const dimensionHit = { hit: false }
    totalScore += accumulateFieldScores(keyword, cube.dimensions, SCORE_FNS, dimensionScores, dimensionHit)
    if (dimensionHit.hit && !matchedOn.includes('dimensions')) matchedOn.push('dimensions')
  }

  // Normalize score
  const normalizedScore = Math.min(1, totalScore / (keywords.length * 2))

  return {
    score: normalizedScore,
    matchedOn,
    suggestedMeasures: topScoredFields(measureScores, 5),
    suggestedDimensions: topScoredFields(dimensionScores, 5),
  }
}

/**
 * Detect analysis capabilities from cube metadata
 */
function detectCapabilities(cube: CubeMetadata): CubeDiscoveryResult['capabilities'] {
  // Check if cube has explicit eventStream meta
  const hasEventStream = !!(cube.meta?.eventStream)

  // Check if cube has time dimensions (needed for analysis modes)
  const hasTimeDimension = cube.dimensions.some(d => d.type === 'time')

  // Check for potential binding keys (dimensions that could identify entities)
  const hasPotentialBindingKey = cube.dimensions.some(d =>
    d.name.toLowerCase().includes('id') ||
    d.type === 'number' ||
    (cube.meta?.eventStream?.bindingKey && d.name === cube.meta.eventStream.bindingKey)
  )

  // Analysis modes available if explicit eventStream OR has needed dimensions
  const supportsAnalysisModes = hasEventStream || (hasTimeDimension && hasPotentialBindingKey)

  return {
    query: true,
    funnel: supportsAnalysisModes,
    flow: supportsAnalysisModes,
    retention: supportsAnalysisModes
  }
}

/**
 * Build analysis config with candidate dimensions
 */
function buildAnalysisConfig(cube: CubeMetadata): CubeDiscoveryResult['analysisConfig'] | undefined {
  const capabilities = detectCapabilities(cube)

  // Only include config if analysis modes are available
  if (!capabilities.funnel && !capabilities.flow && !capabilities.retention) {
    return undefined
  }

  // Candidate binding keys: explicit from meta, or inferred from dimension names
  const candidateBindingKeys: Array<{ dimension: string; description?: string }> = []

  // Check explicit eventStream config first
  if (cube.meta?.eventStream?.bindingKey) {
    const bindingDim = cube.dimensions.find(d => d.name === cube.meta?.eventStream?.bindingKey)
    candidateBindingKeys.push({
      dimension: cube.meta.eventStream.bindingKey,
      description: bindingDim?.description || 'Configured binding key'
    })
  }

  // Add dimensions with 'id' in name as candidates
  for (const dim of cube.dimensions) {
    const dimShortName = dim.name.split('.').pop()?.toLowerCase() || ''
    if (dimShortName.includes('id') && !candidateBindingKeys.some(c => c.dimension === dim.name)) {
      candidateBindingKeys.push({
        dimension: dim.name,
        description: dim.description || `Potential entity identifier`
      })
    }
  }

  // Candidate time dimensions
  const candidateTimeDimensions: Array<{ dimension: string; description?: string }> = []

  // Check explicit eventStream config first
  if (cube.meta?.eventStream?.timeDimension) {
    const timeDim = cube.dimensions.find(d => d.name === cube.meta?.eventStream?.timeDimension)
    candidateTimeDimensions.push({
      dimension: cube.meta.eventStream.timeDimension,
      description: timeDim?.description || 'Configured time dimension'
    })
  }

  // Add all time dimensions as candidates
  for (const dim of cube.dimensions) {
    if (dim.type === 'time' && !candidateTimeDimensions.some(c => c.dimension === dim.name)) {
      candidateTimeDimensions.push({
        dimension: dim.name,
        description: dim.description
      })
    }
  }

  // Candidate event dimensions (string dimensions that could represent event types)
  const candidateEventDimensions: Array<{ dimension: string; description?: string }> = []
  for (const dim of cube.dimensions) {
    const dimShortName = dim.name.split('.').pop()?.toLowerCase() || ''
    if (dim.type === 'string' && (
      dimShortName.includes('type') ||
      dimShortName.includes('event') ||
      dimShortName.includes('status') ||
      dimShortName.includes('state') ||
      dimShortName.includes('action')
    )) {
      candidateEventDimensions.push({
        dimension: dim.name,
        description: dim.description || 'Potential event type dimension'
      })
    }
  }

  return {
    candidateBindingKeys,
    candidateTimeDimensions,
    candidateEventDimensions
  }
}

/**
 * Generate hints for AI on next steps
 */
function generateHints(_cube: CubeMetadata, analysisConfig?: CubeDiscoveryResult['analysisConfig']): string[] {
  const hints: string[] = []

  if (!analysisConfig) {
    return hints
  }

  // Hint about choosing binding key if multiple options
  if (analysisConfig.candidateBindingKeys.length > 1) {
    hints.push('Choose bindingKey based on what entity to track through the analysis')
  }

  // Hint about discovering event types
  if (analysisConfig.candidateEventDimensions.length > 0) {
    const eventDim = analysisConfig.candidateEventDimensions[0].dimension
    hints.push(`Query ${eventDim} dimension to discover available values for funnel steps`)
  }

  // General workflow hint
  hints.push('Use /mcp/load with a standard query to discover dimension values before building analysis queries')

  return hints
}

/**
 * Discover relevant cubes based on topic or intent
 */
export function discoverCubes(
  metadata: CubeMetadata[],
  options: DiscoveryOptions = {}
): CubeDiscoveryResult[] {
  const { topic, intent, limit = 10, minScore = 0.1 } = options

  // Combine topic and intent into search text
  const searchText = [topic, intent].filter(Boolean).join(' ')
  if (!searchText.trim()) {
    // Return all cubes with basic info if no search criteria
    return metadata.slice(0, limit).map(cube => {
      const capabilities = detectCapabilities(cube)
      const analysisConfig = buildAnalysisConfig(cube)
      const hints = generateHints(cube, analysisConfig)
      const hasAnalysisModes = capabilities.funnel || capabilities.flow || capabilities.retention

      return {
        cube: cube.name,
        title: cube.title,
        description: cube.description,
        relevanceScore: 1,
        matchedOn: [] as CubeDiscoveryResult['matchedOn'],
        suggestedMeasures: cube.measures.slice(0, 5).map(m => m.name),
        suggestedDimensions: cube.dimensions.slice(0, 5).map(d => d.name),
        capabilities,
        analysisConfig,
        hints: hints.length > 0 ? hints : undefined,
        querySchemas: hasAnalysisModes ? QUERY_SCHEMAS : undefined
      }
    })
  }

  // Extract keywords from search text
  const keywords = extractKeywords(searchText)
  if (keywords.length === 0) {
    return []
  }

  // Score each cube
  const results: CubeDiscoveryResult[] = []
  for (const cube of metadata) {
    const { score, matchedOn, suggestedMeasures, suggestedDimensions } = scoreCube(cube, keywords)

    if (score >= minScore) {
      const capabilities = detectCapabilities(cube)
      const analysisConfig = buildAnalysisConfig(cube)
      const hints = generateHints(cube, analysisConfig)

      // Only include schemas if analysis modes are available
      const hasAnalysisModes = capabilities.funnel || capabilities.flow || capabilities.retention

      results.push({
        cube: cube.name,
        title: cube.title,
        description: cube.description,
        relevanceScore: score,
        matchedOn,
        suggestedMeasures,
        suggestedDimensions,
        capabilities,
        analysisConfig,
        hints: hints.length > 0 ? hints : undefined,
        querySchemas: hasAnalysisModes ? QUERY_SCHEMAS : undefined
      })
    }
  }

  // Sort by relevance and limit
  return results
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit)
}

/**
 * Find the best matching field across all cubes
 */
export function findBestFieldMatch(
  metadata: CubeMetadata[],
  fieldName: string,
  fieldType?: 'measure' | 'dimension'
): { field: string; cube: string; score: number; type: 'measure' | 'dimension' } | null {
  type Match = { field: string; cube: string; score: number; type: 'measure' | 'dimension' }
  let bestMatch: Match | null = null

  const considerFields = (
    cube: CubeMetadata,
    fields: CubeMetadata['measures'] | CubeMetadata['dimensions'],
    type: 'measure' | 'dimension'
  ): void => {
    for (const field of fields) {
      const score = scoreFieldForBestMatch(fieldName, field, SCORE_FNS)
      if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { field: field.name, cube: cube.name, score, type }
      }
    }
  }

  for (const cube of metadata) {
    if (!fieldType || fieldType === 'measure') {
      considerFields(cube, cube.measures, 'measure')
    }
    if (!fieldType || fieldType === 'dimension') {
      considerFields(cube, cube.dimensions, 'dimension')
    }
  }

  return bestMatch
}
