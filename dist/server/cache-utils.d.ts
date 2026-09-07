import { SemanticQuery, SecurityContext } from './types/index.js';
/**
 * Configuration for cache key generation
 */
export interface CacheKeyConfig {
    /** Prefix for all cache keys */
    keyPrefix?: string;
    /** Whether to include security context in cache key */
    includeSecurityContext?: boolean;
    /** Custom serializer for security context */
    securityContextSerializer?: (ctx: SecurityContext) => string;
}
/**
 * Generate a deterministic cache key from query and security context
 *
 * Key structure: {prefix}query:{queryHash}:ctx:{securityHash}
 *
 * Uses a 128-bit FNV-1a-based hash (see {@link strongHash}) for both the query
 * and the security context. A 128-bit digest is required here for correctness,
 * not just speed: the security-context hash provides tenant isolation, and a
 * collision serves one tenant's cached result to another. The full input is
 * hashed (no truncation) so large queries cannot collide on a shared prefix.
 *
 * @param query - The semantic query to cache
 * @param securityContext - Security context for tenant isolation
 * @param config - Cache key configuration
 * @param cubeSetKey - Identifies the cube definitions behind the result. Always
 *   included when present: `includeSecurityContext: false` and a custom
 *   `securityContextSerializer` can each hash two tenants identically, so the
 *   security-context hash alone cannot keep differing cube sets apart.
 * @returns Deterministic cache key string
 */
export declare function generateCacheKey(query: SemanticQuery, securityContext: SecurityContext, config?: CacheKeyConfig, cubeSetKey?: string): string;
/**
 * Normalize query for consistent hashing
 * Sorts arrays and object keys to ensure same query = same hash
 *
 * @param query - The semantic query to normalize
 * @returns Normalized query with sorted arrays and keys
 */
export declare function normalizeQuery(query: SemanticQuery): SemanticQuery;
/**
 * Recursively sort object keys for deterministic serialization
 *
 * @param obj - Object to sort
 * @returns Object with sorted keys (recursively)
 */
export declare function sortObject<T>(obj: T): T;
/**
 * FNV-1a hash - fast, non-cryptographic 32-bit hash function
 * Returns hex string for cache key readability
 *
 * Properties:
 * - O(n) time complexity
 * - Low collision rate for similar strings
 * - Deterministic across runs
 *
 * Note: a 32-bit digest is too narrow to isolate tenants by itself — use
 * {@link strongHash} for cache keys. Retained for backwards compatibility.
 *
 * @param str - String to hash
 * @returns 8-character hex string
 */
export declare function fnv1aHash(str: string): string;
/**
 * 128-bit FNV-1a-based hash for cache keys.
 *
 * Computes four independent 32-bit FNV-1a lanes (distinct offset bases, each
 * mixed with the byte position) and concatenates them into a 32-character hex
 * digest. This widens the key space from 2^32 to 2^128 so security-context and
 * query collisions are vanishingly unlikely — collisions here are not merely a
 * cache miss, they are a cross-tenant data-disclosure risk.
 *
 * The entire input is hashed (no truncation), and the input length is mixed in
 * to disambiguate shared prefixes. `Math.imul` performs a true 32-bit multiply.
 *
 * @param str - String to hash
 * @returns 32-character hex string (128 bits)
 */
export declare function strongHash(str: string): string;
/**
 * Generate invalidation pattern for a cube
 * Used when cube data changes and all related cache entries need clearing
 *
 * @param cubeName - Name of the cube to invalidate
 * @param keyPrefix - Cache key prefix
 * @returns Glob pattern for cache invalidation
 */
export declare function getCubeInvalidationPattern(cubeName: string, keyPrefix?: string): string;
