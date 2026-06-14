/**
 * AI Discovery Engine — scoring helpers
 * Pure per-field scoring extractions for discovery.ts. Behaviour is identical to
 * the original inline scoring; these helpers exist to reduce per-function complexity.
 */

import type { CubeMetadata } from '../types/metadata'

/** A measure or dimension as carried in cube metadata. */
type Field = CubeMetadata['measures'][number] | CubeMetadata['dimensions'][number]

/** Scoring callbacks shared with discovery.ts (avoids a circular import). */
export interface ScoreFns {
  fuzzyMatchScore: (query: string, target: string) => number
  matchAgainstArray: (query: string, targets: string[]) => number
}

/**
 * Score a single field (measure or dimension) against a keyword.
 * Returns the best score across name, title, description and synonyms.
 */
export function scoreField(keyword: string, field: Field, fns: ScoreFns): number {
  let score = 0

  // Match field name (without cube prefix)
  const shortName = field.name.split('.').pop() || field.name
  score = Math.max(score, fns.fuzzyMatchScore(keyword, shortName))

  // Match field title
  score = Math.max(score, fns.fuzzyMatchScore(keyword, field.title))

  // Match field description (weighted lower)
  if (field.description) {
    score = Math.max(score, fns.fuzzyMatchScore(keyword, field.description) * 0.8)
  }

  // Match field synonyms
  if (field.synonyms) {
    score = Math.max(score, fns.matchAgainstArray(keyword, field.synonyms))
  }

  return score
}

/**
 * Accumulate field scores for a keyword into a running totals map.
 * Adds to `totalScore` (returned) and records the per-field best score when the
 * field clears the relevance threshold, mutating `scores` and `matchedOn`.
 */
export function accumulateFieldScores(
  keyword: string,
  fields: Field[],
  fns: ScoreFns,
  scores: Map<string, number>,
  matchedOn: { hit: boolean }
): number {
  let added = 0
  for (const field of fields) {
    const fieldScore = scoreField(keyword, field, fns)
    if (fieldScore > 0.4) {
      added += fieldScore
      matchedOn.hit = true
      const current = scores.get(field.name) || 0
      scores.set(field.name, Math.max(current, fieldScore))
    }
  }
  return added
}

/** Return the top-N field names from a score map, highest score first. */
export function topScoredFields(scores: Map<string, number>, limit: number): string[] {
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name)
}

/**
 * Score a single field as a best-match candidate (used by findBestFieldMatch).
 * Returns the best score across name, title and synonyms (no description match).
 */
export function scoreFieldForBestMatch(fieldName: string, field: Field, fns: ScoreFns): number {
  const shortName = field.name.split('.').pop() || field.name
  let score = fns.fuzzyMatchScore(fieldName, shortName)
  score = Math.max(score, fns.fuzzyMatchScore(fieldName, field.title))
  if (field.synonyms) {
    score = Math.max(score, fns.matchAgainstArray(fieldName, field.synonyms))
  }
  return score
}
