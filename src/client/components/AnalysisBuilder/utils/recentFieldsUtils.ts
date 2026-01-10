/**
 * Recent Fields Storage Utilities for AnalysisBuilder
 *
 * Functions for tracking and retrieving recently used fields.
 */

import type { FieldOption, RecentFieldsStorage } from '../types'
import type { MetaResponse } from '../../../shared/types'
import { schemaToFieldOptions } from './fieldUtils'

const RECENT_FIELDS_KEY = 'drizzle-cube-recent-fields'
const MAX_RECENT_FIELDS = 10

/**
 * Get recent fields from localStorage
 */
export function getRecentFields(): RecentFieldsStorage {
  try {
    const stored = localStorage.getItem(RECENT_FIELDS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore errors
  }
  return { metrics: [], breakdowns: [] }
}

/**
 * Add a field to recent fields
 */
export function addRecentField(fieldName: string, mode: 'metrics' | 'breakdowns'): void {
  try {
    const recent = getRecentFields()
    const list = recent[mode]

    // Remove if already exists
    const filtered = list.filter((f) => f !== fieldName)

    // Add to front
    filtered.unshift(fieldName)

    // Limit size
    recent[mode] = filtered.slice(0, MAX_RECENT_FIELDS)

    localStorage.setItem(RECENT_FIELDS_KEY, JSON.stringify(recent))
  } catch {
    // Ignore errors
  }
}

/**
 * Get recent field options from schema
 */
export function getRecentFieldOptions(
  schema: MetaResponse | null,
  mode: 'metrics' | 'breakdown' | 'filter' | 'dimensionFilter',
  recentFieldNames: string[]
): FieldOption[] {
  if (!schema || recentFieldNames.length === 0) return []

  const allOptions = schemaToFieldOptions(schema, mode)
  const recentOptions: FieldOption[] = []

  for (const fieldName of recentFieldNames) {
    const option = allOptions.find((opt) => opt.name === fieldName)
    if (option) {
      recentOptions.push(option)
    }
  }

  return recentOptions
}
