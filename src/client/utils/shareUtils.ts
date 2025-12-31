/**
 * Share utilities for QueryBuilder
 *
 * Handles compression, encoding, and URL generation for sharing analysis state.
 * Uses LZ-String for compression which produces URL-safe output.
 */

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import type { CubeQuery, ChartType, ChartAxisConfig, ChartDisplayConfig } from '../types'

/**
 * State that can be shared via URL
 * Query is required, chart config is optional (may be dropped if too large)
 */
export interface ShareableState {
  query: CubeQuery
  chartType?: ChartType
  chartConfig?: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
  activeView?: 'table' | 'chart'
}

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
 * Compress state to URL-safe encoded string
 */
export function compressAndEncode(state: ShareableState): string {
  const json = JSON.stringify(state)
  return compressToEncodedURIComponent(json)
}

/**
 * Decompress URL-safe encoded string back to state
 * Returns null if decompression or parsing fails
 */
export function decodeAndDecompress(encoded: string): ShareableState | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded)
    if (!json) return null

    const state = JSON.parse(json) as ShareableState

    // Validate required field
    if (!state.query || typeof state.query !== 'object') {
      return null
    }

    return state
  } catch {
    return null
  }
}

/**
 * Check if compressed state fits within URL length limit
 */
export function isShareableSize(state: ShareableState): { ok: boolean; size: number; maxSize: number } {
  const encoded = compressAndEncode(state)
  return {
    ok: encoded.length <= MAX_HASH_LENGTH,
    size: encoded.length,
    maxSize: MAX_HASH_LENGTH
  }
}

/**
 * Compress state with automatic fallback
 * If full state is too large, tries with query only
 * Returns null encoded if even query-only is too large
 */
export function compressWithFallback(state: ShareableState): CompressionResult {
  // Try full state first
  const fullEncoded = compressAndEncode(state)
  if (fullEncoded.length <= MAX_HASH_LENGTH) {
    return { encoded: fullEncoded, queryOnly: false }
  }

  // Fall back to query only
  const queryOnlyState: ShareableState = { query: state.query }
  const queryOnlyEncoded = compressAndEncode(queryOnlyState)

  if (queryOnlyEncoded.length <= MAX_HASH_LENGTH) {
    return { encoded: queryOnlyEncoded, queryOnly: true }
  }

  // Even query-only is too large
  return { encoded: null, queryOnly: true }
}

/**
 * Generate full share URL with compressed state in hash
 */
export function generateShareUrl(state: ShareableState): string | null {
  const { encoded } = compressWithFallback(state)
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
