/**
 * Share utilities for QueryBuilder
 *
 * Handles compression, encoding, and URL generation for sharing analysis state.
 * Uses LZ-String for compression which produces URL-safe output.
 *
 * Phase 3: Now uses AnalysisConfig format exclusively.
 * Old share URLs will not parse (breaking change as per plan).
 */

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import type { AnalysisConfig } from '../types/analysisConfig'
import { isValidAnalysisConfig } from '../types/analysisConfig'

// Re-export for backward compatibility during transition
export type { AnalysisConfig as ShareableState }

/**
 * Result of compression with fallback
 */
export interface CompressionResult {
  encoded: string | null
  queryOnly: boolean
}

// Max safe URL hash length (conservative for browser compatibility)
const MAX_HASH_LENGTH = 1800
const SHARE_PREFIX = 'share='

/**
 * Compress AnalysisConfig to URL-safe encoded string
 */
export function compressAndEncode(config: AnalysisConfig): string {
  const json = JSON.stringify(config)
  return compressToEncodedURIComponent(json)
}

/**
 * Decompress URL-safe encoded string back to AnalysisConfig
 * Returns null if decompression, parsing, or validation fails.
 *
 * Note: This does not support legacy share URL formats (breaking change).
 */
export function decodeAndDecompress(encoded: string): AnalysisConfig | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded)
    if (!json) return null

    const parsed = JSON.parse(json)

    // Validate using the AnalysisConfig type guard
    if (!isValidAnalysisConfig(parsed)) {
      console.warn('[shareUtils] Invalid AnalysisConfig in share URL')
      return null
    }

    return parsed
  } catch {
    return null
  }
}

/**
 * Check if compressed config fits within URL length limit
 */
export function isShareableSize(config: AnalysisConfig): { ok: boolean; size: number; maxSize: number } {
  const encoded = compressAndEncode(config)
  return {
    ok: encoded.length <= MAX_HASH_LENGTH,
    size: encoded.length,
    maxSize: MAX_HASH_LENGTH
  }
}

/**
 * Compress config with automatic fallback
 * If full config is too large, tries with query only (preserving essential fields)
 * Returns null encoded if even query-only is too large
 */
export function compressWithFallback(config: AnalysisConfig): CompressionResult {
  // Try full config first
  const fullEncoded = compressAndEncode(config)
  if (fullEncoded.length <= MAX_HASH_LENGTH) {
    return { encoded: fullEncoded, queryOnly: false }
  }

  // Fall back to minimal config (query + essential fields only)
  const minimalConfig: AnalysisConfig = {
    version: config.version,
    analysisType: config.analysisType,
    activeView: config.activeView,
    charts: {}, // Drop chart config to save space
    query: config.query,
  } as AnalysisConfig

  const minimalEncoded = compressAndEncode(minimalConfig)
  if (minimalEncoded.length <= MAX_HASH_LENGTH) {
    return { encoded: minimalEncoded, queryOnly: true }
  }

  // Even minimal is too large
  return { encoded: null, queryOnly: true }
}

/**
 * Generate full share URL with compressed config in hash
 */
export function generateShareUrl(config: AnalysisConfig): string | null {
  const { encoded } = compressWithFallback(config)
  if (!encoded) return null

  return `${window.location.origin}${window.location.pathname}#${SHARE_PREFIX}${encoded}`
}

/**
 * Parse share hash from current URL
 * Returns encoded string if #share= is present, null otherwise
 */
export function parseShareHash(): string | null {
  if (typeof window === 'undefined') return null

  const hash = window.location.hash
  if (!hash || !hash.startsWith(`#${SHARE_PREFIX}`)) {
    return null
  }

  return hash.slice(SHARE_PREFIX.length + 1) // +1 for the #
}

/**
 * Clear share hash from URL without page reload
 */
export function clearShareHash(): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  url.hash = ''
  window.history.replaceState(null, '', url.toString())
}

/**
 * Get the maximum allowed hash length
 */
export function getMaxHashLength(): number {
  return MAX_HASH_LENGTH
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a share URL from store's save() method output
 * This is the primary entry point for creating share URLs.
 */
export function createShareUrl(config: AnalysisConfig): string | null {
  return generateShareUrl(config)
}

/**
 * Parse and validate share URL, returning AnalysisConfig or null
 * This is the primary entry point for loading from share URLs.
 */
export function parseShareUrl(): AnalysisConfig | null {
  const encoded = parseShareHash()
  if (!encoded) return null
  return decodeAndDecompress(encoded)
}
