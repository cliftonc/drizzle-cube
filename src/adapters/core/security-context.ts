/**
 * Security-context helpers shared by every core handler.
 *
 * This is the single home for the request-locale wrapper that adapters used to
 * re-declare as `extractSecurityContextWithLocale`. Adapters supply a base
 * (pre-locale) context thunk; the core merges the request locale here.
 */

import type { SecurityContext } from '../../server/index.js'
import { resolveRequestLocale, withLocaleInSecurityContext } from '../locale.js'

/** Returns the base (pre-locale) security context for a request. */
export type BaseSecurityContextThunk = () => SecurityContext | Promise<SecurityContext>

/** Reads a request header by (case-insensitive) name. */
export type HeaderReader = (name: string) => string | undefined

/**
 * Merge the request locale (from the `X-DC-Locale` header) into a base security
 * context. Replaces the per-adapter `extractSecurityContextWithLocale` wrappers.
 */
export function withLocaleFromHeaders(
  base: SecurityContext,
  readHeader: HeaderReader
): SecurityContext {
  return withLocaleInSecurityContext(base, resolveRequestLocale(readHeader))
}

/**
 * Resolve the base security context and merge the request locale in one step —
 * the standard preamble for every authenticated core handler.
 */
export async function resolveSecurityContext(
  getBaseSecurityContext: BaseSecurityContextThunk,
  readHeader: HeaderReader
): Promise<SecurityContext> {
  return withLocaleFromHeaders(await getBaseSecurityContext(), readHeader)
}

/** Strip CR/LF from a thrown value for single-line logging (log-injection guard). */
export function sanitizeForLog(error: unknown): string {
  return String(error).replace(/\n|\r/g, '')
}
