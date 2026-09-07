import { AnalysisConfig } from '../types/analysisConfig.js';
export type { AnalysisConfig as ShareableState };
/**
 * Result of compression with fallback
 */
export interface CompressionResult {
    encoded: string | null;
    queryOnly: boolean;
}
/**
 * Compress AnalysisConfig to URL-safe encoded string
 */
export declare function compressAndEncode(config: AnalysisConfig): string;
/**
 * Decompress URL-safe encoded string back to AnalysisConfig
 * Returns null if decompression, parsing, or validation fails.
 *
 * Note: This does not support legacy share URL formats (breaking change).
 */
export declare function decodeAndDecompress(encoded: string): AnalysisConfig | null;
/**
 * Check if compressed config fits within URL length limit
 */
export declare function isShareableSize(config: AnalysisConfig): {
    ok: boolean;
    size: number;
    maxSize: number;
};
/**
 * Compress config with automatic fallback
 * If full config is too large, tries with query only (preserving essential fields)
 * Returns null encoded if even query-only is too large
 */
export declare function compressWithFallback(config: AnalysisConfig): CompressionResult;
/**
 * Generate full share URL with compressed config in hash
 */
export declare function generateShareUrl(config: AnalysisConfig): string | null;
/**
 * Parse share hash from current URL
 * Returns encoded string if #share= is present, null otherwise
 */
export declare function parseShareHash(): string | null;
/**
 * Clear share hash from URL without page reload
 */
export declare function clearShareHash(): void;
/**
 * Get the maximum allowed hash length
 */
export declare function getMaxHashLength(): number;
/**
 * Create a share URL from store's save() method output
 * This is the primary entry point for creating share URLs.
 */
export declare function createShareUrl(config: AnalysisConfig): string | null;
/**
 * Parse and validate share URL, returning AnalysisConfig or null
 * This is the primary entry point for loading from share URLs.
 */
export declare function parseShareUrl(): AnalysisConfig | null;
