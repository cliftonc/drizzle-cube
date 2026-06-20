/**
 * Deterministic identifier and title helpers for the dbt generator.
 *
 * Every function here is pure: identical input → identical output. This is
 * what makes `--check` / drift mode meaningful (re-running on unchanged
 * inputs is a zero diff). No function touches the filesystem or `process`.
 */

/** A small allowlist of acronyms rendered uppercase in titles. */
const TITLE_ACRONYMS = new Set(['id', 'url', 'uuid', 'sku', 'iso', 'utm'])

/** Reserved TypeScript keywords/identifiers that need a suffix when emitted. */
const RESERVED = new Set([
  'abstract', 'as', 'async', 'await', 'break', 'case', 'catch', 'class',
  'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'enum',
  'export', 'extends', 'false', 'finally', 'for', 'from', 'function', 'get',
  'if', 'implements', 'import', 'in', 'instanceof', 'interface', 'is', 'let',
  'new', 'null', 'package', 'private', 'protected', 'public', 'readonly',
  'require', 'return', 'set', 'static', 'super', 'switch', 'this', 'throw',
  'true', 'try', 'type', 'typeof', 'undefined', 'var', 'void', 'while', 'with',
  'yield',
])

/** A TypeScript-safe leading identifier prefix for names starting with digits. */
const IDENT_LEADING_DIGIT_PREFIX = '_'

/**
 * Split a dbt/SQL name into word tokens. Handles snake_case, kebab-case,
 * dotted names, spaces, and camelCase/PascalCase boundaries. Empty tokens
 * (from leading/trailing/duplicate separators) are discarded.
 */
function tokenize(name: string): string[] {
  if (typeof name !== 'string') return []
  // Insert a separator before each uppercase run that follows a lowercase
  // letter or digit (camelCase/PascalCase boundary), then split on separators.
  const separated = name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .split(/[\s_.-]+/)
  return separated
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

/** Capitalize the first character of a word, leaving the rest untouched. */
function capitalize(word: string): string {
  if (word.length === 0) return word
  return word.charAt(0).toUpperCase() + word.slice(1)
}

/**
 * Convert any dbt/SQL name to lowerCamelCase.
 *
 * `customer_id` → `customerId`, `order-lines` → `orderLines`,
 * `orders.total` → `ordersTotal`.
 */
export function toCamelCase(name: string): string {
  const tokens = tokenize(name)
  if (tokens.length === 0) return ''
  const head = tokens[0].toLowerCase()
  const rest = tokens.slice(1).map((t) => capitalize(t.toLowerCase()))
  return sanitizeIdentifier(head + rest.join(''))
}

/**
 * Convert any dbt/SQL name to PascalCase.
 *
 * `customer_id` → `CustomerId`, `order_lines` → `OrderLines`.
 */
export function toPascalCase(name: string): string {
  const tokens = tokenize(name)
  if (tokens.length === 0) return ''
  const pascal = tokens.map((t) => capitalize(t.toLowerCase())).join('')
  return sanitizeIdentifier(pascal)
}

/**
 * Convert any dbt/SQL name to kebab-case.
 *
 * `customerId` → `customer-id`, `Orders` → `orders`.
 */
export function toKebabCase(name: string): string {
  const tokens = tokenize(name)
  if (tokens.length === 0) return ''
  return tokens.map((t) => t.toLowerCase()).join('-')
}

/**
 * Produce a human-readable, title-cased label from a SQL name.
 *
 * `customer_id` → `Customer Id` (acronyms in the allowlist are uppercased:
 * `id` → `ID`). Words are title-cased from their lowercased form so casing
 * is deterministic regardless of the input case.
 */
export function humanizeTitle(name: string): string {
  const tokens = tokenize(name)
  if (tokens.length === 0) return ''
  return tokens
    .map((t) => {
      const lower = t.toLowerCase()
      if (TITLE_ACRONYMS.has(lower)) return lower.toUpperCase()
      return capitalize(lower)
    })
    .join(' ')
}

/**
 * Render a SQL string literal body (without surrounding quotes) safely for
 * embedding in generated code. The caller is expected to wrap the result in
 * single quotes. Doubles internal single quotes.
 */
export function quoteStringLiteral(value: string): string {
  return value.replace(/'/g, "''")
}

/**
 * Sanitize a candidate identifier into a valid TypeScript identifier.
 *
 * - Strips characters that are not letters, digits, or underscores.
 * - Prefixes names starting with a digit.
 * - Appends `_` to reserved words so emitted code always compiles.
 *
 * This never throws; it always returns a non-empty, valid identifier (an
 * empty/invalid input becomes `_`).
 */
export function sanitizeIdentifier(candidate: string): string {
  let cleaned = (candidate ?? '').replace(/[^A-Za-z0-9_]/g, '')
  if (cleaned.length === 0) {
    return '_'
  }
  if (/^[0-9]/.test(cleaned)) {
    cleaned = IDENT_LEADING_DIGIT_PREFIX + cleaned
  }
  if (RESERVED.has(cleaned)) {
    cleaned = cleaned + '_'
  }
  return cleaned
}

/**
 * Return a non-colliding identifier derived from `base`, suffixing with a
 * numeric counter when `base` is already in `used`.
 *
 * The `used` set is mutated in place to record the returned name — callers
 * track namespaces this way before any collision-detection error is thrown.
 */
export function makeUniqueIdentifier(base: string, used: Set<string>): string {
  const sanitized = sanitizeIdentifier(base)
  if (!used.has(sanitized)) {
    used.add(sanitized)
    return sanitized
  }
  let counter = 2
  while (used.has(`${sanitized}${counter}`)) {
    counter += 1
  }
  const unique = `${sanitized}${counter}`
  used.add(unique)
  return unique
}
