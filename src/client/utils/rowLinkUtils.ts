/**
 * Row click-through URLs for the records table.
 *
 * A dashboard author writes a template such as `/employees/{Employees.id}`,
 * and each row fills its own tokens. The template is author-controlled but the
 * *values* are data, so they are percent-encoded before substitution — an
 * encoded value cannot introduce a scheme, a path segment or a query separator.
 *
 * The resulting URL is then checked rather than trusted: only same-origin
 * relative paths and absolute http(s) URLs are allowed through.
 */

const TOKEN_PATTERN = /\{([A-Za-z0-9_]+\.[A-Za-z0-9_]+)\}/g

/** Schemes that must never survive validation, even spelled oddly. */
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

/**
 * Resolve a row link template against one row.
 *
 * Returns `null` — meaning "render no link" — when the template references a
 * field the row does not carry, or when the result is not a URL we are willing
 * to navigate to. Never throws: a malformed template must not take the table
 * down with it.
 *
 * @param template - e.g. `/employees/{Employees.id}?tab=profile`
 * @param row - the row's values, including hidden columns
 * @param origin - the origin relative URLs are resolved against
 */
export function buildRowUrl(
  template: string | undefined,
  row: Record<string, unknown>,
  origin: string = defaultOrigin()
): string | null {
  if (!template) return null

  let unresolved = false
  const substituted = template.replace(TOKEN_PATTERN, (_match, field: string) => {
    const value = row[field]
    if (value === null || value === undefined) {
      unresolved = true
      return ''
    }
    return encodeURIComponent(String(value))
  })

  if (unresolved) return null

  return isSafeUrl(substituted, origin) ? substituted : null
}

/**
 * Whether a URL is one we will navigate to: an absolute `http(s)` URL, or a
 * path that stays on this origin.
 *
 * Rejected, deliberately: `javascript:`, `data:`, `vbscript:` and every other
 * scheme; protocol-relative `//evil.example`, which inherits the current scheme
 * and silently leaves the origin; and backslash forms such as `\\evil.example`
 * or `/\evil.example`, which several browsers normalise into that same
 * protocol-relative shape.
 */
export function isSafeUrl(url: string, origin: string = defaultOrigin()): boolean {
  const trimmed = url.trim()
  if (trimmed === '') return false

  // Control characters, including the tab/newline a browser strips out of a
  // scheme — which turns `java<TAB>script:` back into `javascript:`.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) return false

  if (trimmed.includes('\\')) return false
  if (trimmed.startsWith('//')) return false

  try {
    const parsed = new URL(trimmed, origin)
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return false

    // A relative path is only allowed while it stays here. An absolute http(s)
    // URL to another host is fine — that is the "external link" case — so the
    // origin check applies to inputs that did not declare a scheme.
    const declaresScheme = /^[A-Za-z][A-Za-z0-9+.-]*:/.test(trimmed)
    if (!declaresScheme && parsed.origin !== new URL(origin).origin) return false

    return true
  } catch {
    return false
  }
}

/**
 * The origin to resolve relative links against. Falls back to a placeholder
 * outside a browser (SSR, tests) so validation still runs rather than throwing.
 */
function defaultOrigin(): string {
  return typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'http://localhost'
}
