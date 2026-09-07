import { SecurityContext } from '../../server/index.js';
/** Returns the base (pre-locale) security context for a request. */
export type BaseSecurityContextThunk = () => SecurityContext | Promise<SecurityContext>;
/** Reads a request header by (case-insensitive) name. */
export type HeaderReader = (name: string) => string | undefined;
/**
 * Merge the request locale (from the `X-DC-Locale` header) into a base security
 * context. Replaces the per-adapter `extractSecurityContextWithLocale` wrappers.
 */
export declare function withLocaleFromHeaders(base: SecurityContext, readHeader: HeaderReader): SecurityContext;
/**
 * Resolve the base security context and merge the request locale in one step —
 * the standard preamble for every authenticated core handler.
 */
export declare function resolveSecurityContext(getBaseSecurityContext: BaseSecurityContextThunk, readHeader: HeaderReader): Promise<SecurityContext>;
/** Strip CR/LF from a thrown value for single-line logging (log-injection guard). */
export declare function sanitizeForLog(error: unknown): string;
