/**
 * Shared validation types for analysis-mode config validation
 */

/**
 * Result of validating an analysis-mode config (funnel, flow, retention).
 *
 * `warnings` is optional — flow analysis surfaces non-fatal warnings, while
 * funnel and retention only produce errors (and omit the field entirely).
 */
export interface AnalysisConfigValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}
