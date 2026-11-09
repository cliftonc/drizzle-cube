/**
 * Request headers the drizzle-cube client sends, which a cross-origin
 * deployment's CORS preflight must allow. Adapters add them to a configured
 * `allowHeaders` list so the integrator does not have to list them:
 *
 * - `X-DC-Locale` — the viewer's locale (see `locale.ts`)
 * - `X-Cache-Max-Age` — the oldest cached result accepted (interval refresh
 *   sends one on every tick)
 * - `X-Cache-Control` — `no-cache` on a cache bust
 */

/** Client request headers, in the casing added to an allow list. */
export const CLIENT_REQUEST_HEADERS = ['X-DC-Locale', 'X-Cache-Max-Age', 'X-Cache-Control'] as const

/**
 * Add each of `required` to an allow list (array or comma-separated string)
 * unless it is already there, compared case-insensitively.
 */
export function ensureAllowedHeaders(
  allowHeaders: string[] | string | undefined,
  required: readonly string[]
): string[] {
  const headers = Array.isArray(allowHeaders)
    ? [...allowHeaders]
    : (allowHeaders ?? '')
        .split(',')
        .map((header) => header.trim())
        .filter(Boolean)

  const present = new Set(headers.map((header) => header.toLowerCase()))
  for (const header of required) {
    if (!present.has(header.toLowerCase())) headers.push(header)
  }
  return headers
}

/**
 * Add every client request header to a configured CORS allow list.
 *
 * Returns `undefined` when no list is configured (unset or empty), so the CORS
 * library keeps its default of allowing the headers the preflight asks for.
 * Turning a missing list into just the client headers would block
 * `Content-Type` and `Authorization`, and with them every cross-origin JSON
 * POST.
 */
export function ensureClientRequestHeaders(allowHeaders?: string[] | string): string[] | undefined {
  if (isEmptyHeaderList(allowHeaders)) return undefined
  return ensureAllowedHeaders(allowHeaders, CLIENT_REQUEST_HEADERS)
}

function isEmptyHeaderList(allowHeaders: string[] | string | undefined): boolean {
  if (allowHeaders === undefined) return true
  if (Array.isArray(allowHeaders)) return allowHeaders.length === 0
  return allowHeaders.trim() === ''
}
