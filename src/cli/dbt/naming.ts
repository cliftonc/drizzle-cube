/**
 * Deterministic name conversions between dbt SQL names and generated TypeScript
 * identifiers. All functions are pure and total so re-running the generator on
 * unchanged artifacts produces byte-for-byte identical output.
 *
 * dbt `meta.drizzle_cube.*` overrides take precedence over these conventions and
 * are applied by the normalizer before these helpers are used as a fallback.
 */

/** Split a SQL-ish identifier into lowercase word tokens. */
function tokenize(name: string): string[] {
  return name
    // split camelCase / PascalCase boundaries
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    // non-alphanumeric runs become separators
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((t) => t.toLowerCase())
}

/** `customer_id` -> `customerId`. Leading digits are preserved as-is. */
export function toCamelCase(name: string): string {
  const tokens = tokenize(name)
  if (tokens.length === 0) return name
  return tokens
    .map((t, i) => (i === 0 ? t : t.charAt(0).toUpperCase() + t.slice(1)))
    .join('')
}

/** `customer_orders` -> `CustomerOrders` (used for cube names). */
export function toPascalCase(name: string): string {
  const camel = toCamelCase(name)
  return camel.charAt(0).toUpperCase() + camel.slice(1)
}

/** `customer_id` -> `Customer Id` (used for titles). */
export function toTitleCase(name: string): string {
  const tokens = tokenize(name)
  if (tokens.length === 0) return name
  return tokens.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(' ')
}

/** Cube const identifier, e.g. cube `Orders` -> `ordersCube`. */
export function toCubeVar(cubeName: string): string {
  const camel = cubeName.charAt(0).toLowerCase() + cubeName.slice(1)
  return `${camel}Cube`
}

/** File name (no extension) for a model's relation name, e.g. `orders`. */
export function toFileName(relationName: string): string {
  return toCamelCase(relationName)
}
