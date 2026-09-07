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
export declare function buildRowUrl(template: string | undefined, row: Record<string, unknown>, origin?: string): string | null;
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
export declare function isSafeUrl(url: string, origin?: string): boolean;
