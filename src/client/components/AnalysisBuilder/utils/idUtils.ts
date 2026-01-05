/**
 * ID Generation Utilities for AnalysisBuilder
 */

/**
 * Generate a unique ID for items
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate letter label for metrics (A, B, C, ..., AA, AB, ...)
 */
export function generateMetricLabel(index: number): string {
  let label = ''
  let n = index
  do {
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return label
}
