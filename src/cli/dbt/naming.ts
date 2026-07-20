/**
 * Pure, deterministic identifier / title helpers.
 *
 * No function here touches the filesystem or `process`. All transformations
 * are case-agnostic and stable so identical inputs produce identical outputs.
 */

const ACRONYMS = new Set(['id', 'url', 'uuid', 'sku', 'iso', 'utm'])

/** Reserved TS keywords that must not be emitted as bare identifiers. */
const RESERVED_KEYWORDS = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally',
  'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'null',
  'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof',
  'var', 'void', 'while', 'with', 'as', 'async', 'await', 'yield', 'let',
  'static', 'from', 'of',
])

/**
 * Split snake_case, kebab-case, dotted names, spaces, and camelCase/PascalCase
 * boundaries into lowercase tokens. Empty tokens are discarded.
 */
function tokenize(input: string): string[] {
  if (!input) return []
  // Insert boundaries before internal capitals, then split on non-word chars.
  const spaced = input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
  return spaced
    .split(/[^A-Za-z0-9]+/)
    .map((t) => t.toLowerCase())
    .filter((t) => t.length > 0)
}

/** `customer_id` → `customerId`; `order-lines` → `orderLines`; `orders.total` → `ordersTotal`. */
export function toCamelCase(input: string): string {
  const tokens = tokenize(input)
  if (tokens.length === 0) return ''
  return (
    tokens[0] +
    tokens
      .slice(1)
      .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
      .join('')
  )
}

/** `customer_id` → `CustomerId`. */
export function toPascalCase(input: string): string {
  const tokens = tokenize(input)
  return tokens.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join('')
}

/** `order_lines` → `order-lines` (used for file names). */
export function toKebabCase(input: string): string {
  return tokenize(input).join('-')
}

/**
 * Title-case from lowercased tokens, uppercasing allowlist acronyms so
 * `customer_id` → `Customer ID`. Deterministic regardless of input case.
 */
export function humanizeTitle(input: string): string {
  const tokens = tokenize(input)
  return tokens
    .map((t) => (ACRONYMS.has(t) ? t.toUpperCase() : t.charAt(0).toUpperCase() + t.slice(1)))
    .join(' ')
}

/** Double internal single quotes for SQL-name embedding. */
export function quoteStringLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

/**
 * Strip non-`[A-Za-z0-9_]`, prefix digit-leading names with `_`, append `_` to
 * reserved TS keywords. Empty/invalid input becomes `_`. Never throws.
 */
export function sanitizeIdentifier(input: string): string {
  const cleaned = input.replace(/[^A-Za-z0-9_]/g, '')
  if (cleaned === '') return '_'
  let result = cleaned
  if (/^[0-9]/.test(result)) {
    result = `_${result}`
  }
  if (RESERVED_KEYWORDS.has(result)) {
    result = `${result}_`
  }
  return result
}

/**
 * Return `base` if it is not already in `used`, else append a numeric suffix
 * until unique. Mutates `used` in place so callers track the reservation.
 */
export function makeUniqueIdentifier(base: string, used: Set<string>): string {
  let candidate = base
  let counter = 1
  while (used.has(candidate)) {
    candidate = `${base}${counter}`
    counter++
  }
  used.add(candidate)
  return candidate
}
